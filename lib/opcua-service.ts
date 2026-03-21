/**
 * OPC UA Service for Siemens PLC Communication
 *
 * This service manages the connection to OPC UA servers and provides
 * methods for reading, writing, and subscribing to nodes.
 */

import {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  DataValue,
  Variant,
  DataType,
  ClientSubscription,
  ClientMonitoredItem,
  TimestampsToReturn,
  ClientSession,
} from "node-opcua";

import {
  OPCUAConfig,
  NodeValue,
  SubscriptionCallback,
  BrowseResult,
  BrowseTreeNode,
} from "@/types/opcua.types";

import {
  shouldBrowseRecursively,
  generateSubscriptionName,
} from "@/lib/opcua-utils";
import { dataValueToNodeValue } from "@/lib/opcua-utils-server";

import {
  OPCUANotConnectedError,
  OPCUANodeError,
  OPCUASubscriptionError,
  OPCUABrowseError,
} from "@/lib/opcua-errors";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default sampling interval for OPC UA subscriptions (in milliseconds)
 * Read from environment variable NEXT_PUBLIC_OPCUA_SAMPLING_INTERVAL
 * Lower values = faster updates but more network/CPU load
 * Recommended: 500-5000ms
 */
export const DEFAULT_SAMPLING_INTERVAL = Number(process.env.NEXT_PUBLIC_OPCUA_SAMPLING_INTERVAL) || 1000;

// ============================================================================
// Subscription Callback Registry
// ============================================================================

/**
 * Registry for subscription callbacks
 * Allows dynamic registration of callbacks for subscriptions
 */
class SubscriptionCallbackRegistry {
  private callbacks = new Map<string, SubscriptionCallback>();

  register(subscriptionName: string, callback: SubscriptionCallback): void {
    this.callbacks.set(subscriptionName, callback);
  }

  unregister(subscriptionName: string): void {
    this.callbacks.delete(subscriptionName);
  }

  get(subscriptionName: string): SubscriptionCallback | undefined {
    return this.callbacks.get(subscriptionName);
  }

  has(subscriptionName: string): boolean {
    return this.callbacks.has(subscriptionName);
  }
}

// ============================================================================
// OPC UA Service Class
// ============================================================================

class OPCUAService {
  private client: OPCUAClient | null = null;
  private session: ClientSession | null = null;
  private subscriptions: Map<string, ClientSubscription> = new Map();
  private monitoredItems: Map<string, ClientMonitoredItem[]> = new Map();
  private config: OPCUAConfig | null = null;
  private isConnecting = false;
  private callbackRegistry = new SubscriptionCallbackRegistry();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly heartbeatIntervalMs = 3000; // Check every 3 seconds

  /**
   * Connect to the OPC UA server
   */
  async connect(config: OPCUAConfig): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || this.isConnected()) {
      console.log("Already connected or connecting, skipping connection attempt");
      return;
    }

    this.isConnecting = true;
    this.config = config;

    try {
      this.client = OPCUAClient.create({
        endpointMustExist: false,
        connectionStrategy: {
          initialDelay: 1000,
          maxRetry: 3,
        },
        requestedSessionTimeout: 30 * 1000, // 30 seconds - compatible with subscriptions
        securityMode: config.securityMode ?? MessageSecurityMode.None,
        securityPolicy: config.securityPolicy ?? SecurityPolicy.None,
      });

      this.client.on("backoff", () => {
        console.log("OPC UA Connection failed, retrying...");
      });

      this.client.on("connection_reestablished", () => {
        console.log("OPC UA Connection reestablished");
        this.reconnectAttempts = 0;
      });

      await this.client.connect(config.endpointUrl);

      // Create session with optional authentication
      if (config.username && config.password) {
        this.session = await this.client.createSession({
          type: 1, // UserTokenType.UserName
          userName: config.username,
          password: config.password,
        } as any);
      } else {
        this.session = await this.client.createSession();
      }

      console.log("Connected to OPC UA server:", config.endpointUrl);

      // Start heartbeat to detect connection loss
      this.startHeartbeat();
    } catch (error) {
      console.error("Failed to connect to OPC UA server:", error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    // Stop any existing heartbeat
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(async () => {
      if (this.isConnected()) {
        const isAlive = await this.verifyConnection();
        if (!isAlive) {
          console.log("[Heartbeat] Connection lost, disconnecting...");
          await this.disconnect();
        }
      }
    }, this.heartbeatIntervalMs);

    console.log(`[Heartbeat] Started (interval: ${this.heartbeatIntervalMs}ms)`);
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log("[Heartbeat] Stopped");
    }
  }

  /**
   * Disconnect from the OPC UA server
   * This method never throws - all errors are caught and logged
   */
  async disconnect(): Promise<void> {
    try {
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      // Stop heartbeat
      this.stopHeartbeat();

      // Delete all subscriptions
      for (const [name, subscription] of this.subscriptions) {
        try {
          await subscription.terminate();
        } catch (error) {
          console.error(`Error terminating subscription ${name}:`, error);
        }
        this.callbackRegistry.unregister(name);
      }
      this.subscriptions.clear();
      this.monitoredItems.clear();

      // Close session
      if (this.session) {
        try {
          await this.session.close();
        } catch (error) {
          console.error("Error closing session:", error);
        }
        this.session = null;
      }

      // Disconnect client (only if actually connected)
      // Check if the client has an active connection before attempting disconnect
      if (this.client) {
        try {
          // Only attempt disconnect if the client is in a valid state
          // This prevents "Secure Channel Closed" errors on already-closed clients
          await this.client.disconnect();
        } catch (error) {
          // Silently ignore disconnect errors - we're cleaning up anyway
          console.error("Error disconnecting client (non-critical):", error);
        }
        this.client = null;
      }

      console.log("Disconnected from OPC UA server");
    } catch (error) {
      // Never throw from disconnect - this method is used for cleanup
      console.error("Unexpected error during disconnect:", error);
      // Ensure state is cleared even on error
      this.session = null;
      this.client = null;
      this.subscriptions.clear();
      this.monitoredItems.clear();
    }
  }

  /**
   * Ensure connection is active, attempt reconnection if needed
   */
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected()) {
      throw new OPCUANotConnectedError();
    }
  }

  /**
   * Read a single node value
   */
  async readNode(nodeId: string): Promise<NodeValue> {
    await this.ensureConnected();

    try {
      const dataValue = await this.session!.read({
        nodeId,
        attributeId: AttributeIds.Value,
      });

      return dataValueToNodeValue(nodeId, dataValue);
    } catch (error) {
      console.error(`Error reading node ${nodeId}:`, error);
      throw new OPCUANodeError(`Failed to read node ${nodeId}`, nodeId);
    }
  }

  /**
   * Read multiple node values
   */
  async readMultipleNodes(nodeIds: string[]): Promise<NodeValue[]> {
    await this.ensureConnected();

    try {
      const nodesToRead = nodeIds.map((nodeId) => ({
        nodeId,
        attributeId: AttributeIds.Value,
      }));

      const results = await this.session!.read(nodesToRead);

      return results.map((dataValue, index) => 
        dataValueToNodeValue(nodeIds[index], dataValue)
      );
    } catch (error) {
      console.error("Error reading nodes:", error);
      throw error;
    }
  }

  /**
   * Write a value to a node with explicit data type
   */
  async writeNode(nodeId: string, value: unknown, dataType?: DataType): Promise<void> {
    await this.ensureConnected();

    // Auto-detect data type if not provided
    const actualDataType = dataType ?? (() => {
      if (typeof value === "string") {
        return DataType.String;
      } else if (typeof value === "number") {
        return Number.isInteger(value) ? DataType.Int16 : DataType.Double;
      } else if (typeof value === "boolean") {
        return DataType.Boolean;
      } else {
        return DataType.Variant;
      }
    })();

    try {
      const variant = new Variant({ dataType: actualDataType, value });
      await this.session!.write({
        nodeId,
        attributeId: AttributeIds.Value,
        value: { value: variant },
      });
    } catch (error) {
      console.error(`Error writing to node ${nodeId}:`, error);
      throw new OPCUANodeError(`Failed to write to node ${nodeId}`, nodeId);
    }
  }

  /**
   * Register a callback for a subscription
   */
  registerSubscriptionCallback(subscriptionName: string, callback: SubscriptionCallback): void {
    this.callbackRegistry.register(subscriptionName, callback);
  }

  /**
   * Unregister a callback for a subscription
   */
  unregisterSubscriptionCallback(subscriptionName: string): void {
    this.callbackRegistry.unregister(subscriptionName);
  }

  /**
   * Create a subscription for monitoring node changes
   */
  async createSubscription(
    subscriptionName: string,
    nodeIds: string[],
    callback: SubscriptionCallback,
    samplingInterval: number = DEFAULT_SAMPLING_INTERVAL
  ): Promise<void> {
    await this.ensureConnected();

    // Remove existing subscription if it exists
    if (this.subscriptions.has(subscriptionName)) {
      await this.removeSubscription(subscriptionName);
    }

    try {
      // Register callback
      this.callbackRegistry.register(subscriptionName, callback);

      const subscription = await this.session!.createSubscription2({
        requestedPublishingInterval: samplingInterval,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 1,  // Changed from 100 - send immediately
        publishingEnabled: true,
        priority: 10,
      });

      const monitoredItems: ClientMonitoredItem[] = [];

      // console.log(`[OPC UA] Creating monitored items for ${nodeIds.length} nodes:`);
      for (const nodeId of nodeIds) {
        // console.log(`[OPC UA]   - Monitoring: ${nodeId}`);
        const item = await subscription.monitor(
          {
            nodeId,
            attributeId: AttributeIds.Value,
          },
          { samplingInterval, discardOldest: true, queueSize: 10 },
          TimestampsToReturn.Both
        );

        // Wrap callback to include nodeId in the dataValue
        item.on("changed", (dataValue: DataValue) => {
          // Attach nodeId to dataValue so the callback knows which node changed
          (dataValue as any).nodeId = nodeId;
          callback(dataValue as any);
        });

        // Also listen to errors
        item.on("err", (message: string) => {
          console.error(`[OPC UA Subscription] Error on ${nodeId}:`, message);
        });

        monitoredItems.push(item);
      }

      this.subscriptions.set(subscriptionName, subscription);
      this.monitoredItems.set(subscriptionName, monitoredItems);

      // console.log(`Subscription "${subscriptionName}" created for ${nodeIds.length} nodes`);
    } catch (error) {
      console.error(`Error creating subscription ${subscriptionName}:`, error);
      this.callbackRegistry.unregister(subscriptionName);
      throw new OPCUASubscriptionError(`Failed to create subscription ${subscriptionName}`);
    }
  }

  /**
   * Subscribe to nodes and return subscription ID
   * @param nodeIds - Array of node IDs to monitor
   * @param callback - Callback for value changes
   * @param samplingInterval - Sampling interval in milliseconds
   * @returns Subscription ID
   */
  async subscribe(
    nodeIds: string[],
    callback: SubscriptionCallback,
    samplingInterval: number = DEFAULT_SAMPLING_INTERVAL
  ): Promise<string> {
    const subscriptionName = generateSubscriptionName();
    await this.createSubscription(subscriptionName, nodeIds, callback, samplingInterval);
    return subscriptionName;
  }

  /**
   * Unsubscribe by subscription ID
   * @param subscriptionId - The subscription ID returned by subscribe()
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    await this.removeSubscription(subscriptionId);
  }

  /**
   * Remove a subscription
   */
  async removeSubscription(subscriptionName: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionName);

    if (subscription) {
      try {
        await subscription.terminate();
        this.subscriptions.delete(subscriptionName);
        this.monitoredItems.delete(subscriptionName);
        this.callbackRegistry.unregister(subscriptionName);
        // console.log(`Subscription "${subscriptionName}" removed`);
      } catch (error) {
        console.error(`Error removing subscription ${subscriptionName}:`, error);
        throw new OPCUASubscriptionError(`Failed to remove subscription ${subscriptionName}`);
      }
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.client !== null && this.session !== null;
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Verify connection is actually alive
   * Returns true only if the connection can perform operations
   * Note: Does NOT disconnect on failure - caller should handle that
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.client || !this.session) {
      return false;
    }

    try {
      // Try to read a simple known node (RootFolder) to verify connection
      await this.session.read({
        nodeId: "RootFolder",
        attributeId: 13, // AttributeIds.BrowseName
      });
      return true;
    } catch (error) {
      console.log('[OPC UA Service] Connection verification failed:', error);
      // Just report status - don't disconnect, caller decides what to do
      return false;
    }
  }

  /**
   * Check if a subscription exists
   */
  hasSubscription(subscriptionName: string): boolean {
    return this.subscriptions.has(subscriptionName);
  }

  /**
   * Browse the address space (for discovering nodes)
   */
  async browse(rootNodeId: string = "RootFolder"): Promise<string[]> {
    await this.ensureConnected();

    try {
      const result = await this.session!.browse(rootNodeId);
      return result.references?.map((ref) => ref.browseName.toString()) || [];
    } catch (error) {
      console.error(`Error browsing from ${rootNodeId}:`, error);
      throw new OPCUABrowseError(`Failed to browse from ${rootNodeId}`);
    }
  }

  /**
   * Browse with detailed node information
   */
  async browseDetailed(rootNodeId: string = "RootFolder"): Promise<BrowseResult[]> {
    await this.ensureConnected();

    try {
      const result = await this.session!.browse(rootNodeId);
      
      return (result.references || []).map((ref) => ({
        nodeId: ref.nodeId.toString(),
        browseName: ref.browseName.toString(),
        displayName: ref.displayName?.text || "",
        nodeClass: ref.nodeClass.toString(),
        typeDefinition: ref.typeDefinition?.toString() || "",
      }));
    } catch (error) {
      console.error(`Error browsing from ${rootNodeId}:`, error);
      throw new OPCUABrowseError(`Failed to browse from ${rootNodeId}`);
    }
  }

  /**
   * Browse tree recursively
   */
  async browseTree(
    rootNodeId: string = "RootFolder",
    maxDepth: number = 3,
    currentDepth: number = 0
  ): Promise<BrowseTreeNode[]> {
    await this.ensureConnected();

    try {
      const result = await this.session!.browse(rootNodeId);
      const children: BrowseTreeNode[] = [];

      // Only continue recursion if we haven't reached max depth
      if (currentDepth < maxDepth) {
        for (const ref of result.references || []) {
          const childNode: BrowseTreeNode = {
            nodeId: ref.nodeId.toString(),
            browseName: ref.browseName.toString(),
            displayName: ref.displayName?.text || "",
            nodeClass: ref.nodeClass.toString(),
          };

          // Only browse Object (2) and Variable (1) nodes recursively
          if (shouldBrowseRecursively(ref.nodeClass)) {
            try {
              childNode.children = await this.browseTree(
                ref.nodeId.toString(),
                maxDepth,
                currentDepth + 1
              );
            } catch (error) {
              // If we can't browse a child, just add it without children
              console.warn(`Could not browse ${ref.nodeId.toString()}:`, error);
              childNode.children = [];
            }
          }

          children.push(childNode);
        }
      }

      return children;
    } catch (error) {
      console.error(`Error browsing tree from ${rootNodeId}:`, error);
      throw new OPCUABrowseError(`Failed to browse tree from ${rootNodeId}`);
    }
  }
}

// Singleton instance
const opcuaService = new OPCUAService();

export default opcuaService;
export { SubscriptionCallbackRegistry };
