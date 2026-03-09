/**
 * Order Domain Model
 * 
 * Represents production order with attributes for display and methods for UI interactions.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { EventEmitter } from "events";
import { NodeMapper } from "../node-mapper";
import opcuaService from "../opcua-service";
import { DomainObject } from "@/types/domain.types";

export class Order extends EventEmitter implements DomainObject {
  // Dependencies
  private nodeMapper: NodeMapper;
  private opcuaService: any; // Using any for OPCUAService to avoid type issues
  private subscriptionId: string | null = null;

  // Attributes (for display)
  public type: string = "";
  public quantity: number = 0;
  public contract: string = "";
  public progress: number = 0;

  // Node IDs (cached for performance)
  private nodeIds: {
    type: string;
    quantity: string;
    contract: string;
  } | null = null;

  constructor(nodeMapper: NodeMapper, opcuaService: any) {
    super();
    this.nodeMapper = nodeMapper;
    this.opcuaService = opcuaService;
  }

  /**
   * Subscribe to all Order OPCUA nodes for real-time updates
   * Called when component mounts
   */
  async subscribe(callback: (order: Order) => void): Promise<void> {
    // Step 1: Get node IDs (cache them)
    if (!this.nodeIds) {
      this.nodeIds = {
        type: this.nodeMapper.getNodeId("Order.sType"),
        quantity: this.nodeMapper.getNodeId("Order.dQuantity"),
        contract: this.nodeMapper.getNodeId("Order.sContract"),
      };
    }

    // Step 2: Subscribe to OPCUA nodes
    const nodeIds = [
      this.nodeIds.type,
      this.nodeIds.quantity,
      this.nodeIds.contract,
    ];

    this.subscriptionId = await this.opcuaService.subscribe(
      nodeIds,
      (dataValue: any) => this.handleSubscriptionChanges(dataValue, callback)
    );

    // Step 3: Initial refresh to get current values
    await this.refresh();
  }

  /**
   * Unsubscribe from all Order OPCUA nodes
   * Called when component unmounts
   */
  async unsubscribe(): Promise<void> {
    if (this.subscriptionId) {
      await this.opcuaService.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
  }

  /**
   * Write value to an Order OPCUA node
   * Called from UI buttons or input changes
   *
   * Usage:
   * - order.write("Order.sType", "Standard")  // Order type input
   * - order.write("Order.dQuantity", 1000)  // Quantity input
   * - order.write("Order.sContract", "CON-123")  // Contract input
   */
  async write(variablePath: string, value: unknown): Promise<void> {
    const nodeId = this.nodeMapper.getNodeId(variablePath);
    await this.opcuaService.writeNode(nodeId, value);
  }

  /**
   * Refresh all Order data from OPCUA server
   * Used for initial load or manual refresh
   */
  async refresh(): Promise<void> {
    if (!this.nodeIds) {
      throw new Error("Node IDs not initialized. Call subscribe() first.");
    }

    const nodeIds = [
      this.nodeIds.type,
      this.nodeIds.quantity,
      this.nodeIds.contract,
    ];

    const results = await this.opcuaService.readMultipleNodes(nodeIds);

    this.type = results[0].value as string;
    this.quantity = results[1].value as number;
    this.contract = results[2].value as string;

    // Calculate progress (typically based on line parts)
    this.progress = this.calculateProgress();

    this.emit("updated", this);
  }

  /**
   * Handle subscription changes from OPCUA
   */
  private handleSubscriptionChanges(
    dataValue: any,
    callback: (order: Order) => void
  ): void {
    if (!this.nodeIds) return;

    const nodeId = dataValue.nodeId?.toString();
    const value = dataValue.value?.value;

    switch (nodeId) {
      case this.nodeIds.type:
        this.type = value as string;
        break;
      case this.nodeIds.quantity:
        this.quantity = value as number;
        break;
      case this.nodeIds.contract:
        this.contract = value as string;
        break;
    }

    this.emit("updated", this);
    callback(this);
  }

  // Methods (for UI buttons) - convenience wrappers around write()

  /**
   * Set order type
   * Called from UI input
   */
  async setType(type: string): Promise<void> {
    await this.write("Order.sType", type);
  }

  /**
   * Set order quantity
   * Called from UI input
   */
  async setQuantity(quantity: number): Promise<void> {
    await this.write("Order.dQuantity", quantity);
  }

  /**
   * Set order contract
   * Called from UI input
   */
  async setContract(contract: string): Promise<void> {
    await this.write("Order.sContract", contract);
  }

  // Computed properties (for display)

  /**
   * Calculate order progress
   * This is typically based on line parts produced vs target quantity
   */
  private calculateProgress(): number {
    // Progress calculation would typically use line partsOK
    // For now, return 0 as it would need access to line data
    if (!this.quantity) return 0;
    return this.progress;
  }

  /**
   * Get remaining quantity
   */
  getRemainingQuantity(): number {
    return Math.max(0, this.quantity - this.progress);
  }

  /**
   * Check if order is complete
   */
  isComplete(): boolean {
    return this.progress >= this.quantity;
  }

  // Event subscription

  /**
   * Subscribe to order update events
   */
  onUpdated(callback: (order: Order) => void): void {
    this.on("updated", callback);
  }

  /**
   * Unsubscribe from order update events
   */
  offUpdated(callback: (order: Order) => void): void {
    this.off("updated", callback);
  }
}
