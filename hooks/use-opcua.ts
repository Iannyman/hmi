/**
 * React Hook for OPC UA Communication
 *
 * Provides methods for connecting, reading, writing, and subscribing to OPC UA nodes
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { DataType } from "node-opcua";
import {
  OPCUAConfigClient,
  NodeValue as OPCUANodeValue,
  SubscriptionData,
  BrowseResult,
  BrowseTreeNode,
  BrowseMode,
} from "@/types/opcua.types";

export function useOPCUA() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Connect to OPC UA server
   */
  const connect = useCallback(async (config: OPCUAConfigClient): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/opcua/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error);
      }

      setIsConnected(true);
      console.log("[DIAGNOSTIC] useOPCUA: Setting isConnected to true");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setIsConnected(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Disconnect from OPC UA server
   */
  const disconnect = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/opcua/connect", {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error);
      }

      setIsConnected(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Read a single node value
   */
  const readNode = useCallback(async (nodeId: string): Promise<OPCUANodeValue | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/opcua/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error);
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Read multiple node values
   */
  const readNodes = useCallback(async (nodeIds: string[]): Promise<OPCUANodeValue[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/opcua/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error);
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Write a value to a node
   */
  const writeNode = useCallback(async (
    nodeId: string,
    value: unknown,
    dataType: keyof typeof DataType
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/opcua/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, value, dataType }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a subscription
   */
  const subscribe = useCallback(
    (
      subscriptionName: string,
      nodeIds: string[],
      onUpdate: (data: SubscriptionData) => void,
      samplingInterval?: number
    ): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        // Create the subscription on the server
        fetch("/api/opcua/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionName, nodeIds, samplingInterval }),
        })
          .then(async (response) => {
            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.details || result.error);
            }

            resolve(true);
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : String(err));
            reject(err);
          });
      });
    },
    []
  );

  /**
   * Remove a subscription
   */
  const unsubscribe = useCallback(
    async (subscriptionName: string): Promise<boolean> => {
      try {
        const response = await fetch("/api/opcua/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionName }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.details || result.error);
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        return false;
      }
    },
    []
  );

  /**
   * Poll nodes at regular intervals (alternative to subscriptions)
   */
  const pollNodes = useCallback(
    (nodeIds: string[], intervalMs: number, onUpdate: (values: OPCUANodeValue[]) => void) => {
      const intervalId = setInterval(async () => {
        if (isConnected) {
          const values = await readNodes(nodeIds);
          onUpdate(values);
        }
      }, intervalMs);

      // Return cleanup function
      return () => clearInterval(intervalId);
    },
    [isConnected, readNodes]
  );

  /**
   * Check connection status
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/opcua/connect");
      const result = await response.json();
      setIsConnected(result.connected);
      return result.connected;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, []);

  /**
   * Browse OPC UA address space
   */
  const browse = useCallback(
    async (
      nodeId: string = "ObjectsFolder",
      mode: BrowseMode = "tree",
      maxDepth: number = 7
    ): Promise<string[] | BrowseResult[] | BrowseTreeNode[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/opcua/browse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodeId, mode, maxDepth }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.details || result.error);
        }

        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Note: Connection check is handled by HMIInitializerProvider, not here
  // This avoids race conditions and makes HMIInitializerProvider the single source of truth

  return {
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    readNode,
    readNodes,
    writeNode,
    subscribe,
    unsubscribe,
    pollNodes,
    checkConnection,
    browse,
  };
}

/**
 * Hook for reading a single node with auto-refresh
 */
export function useOPCUANode(
  nodeId: string | null,
  options?: {
    pollInterval?: number;
    enabled?: boolean;
  }
) {
  const { isConnected, readNode } = useOPCUA();
  const [data, setData] = useState<OPCUANodeValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeId || !options?.enabled || !isConnected) return;

    const fetchData = async () => {
      const result = await readNode(nodeId);
      if (result) {
        setData(result);
        setError(null);
      } else {
        setError("Failed to read node");
      }
    };

    fetchData();

    if (options.pollInterval) {
      const intervalId = setInterval(fetchData, options.pollInterval);
      return () => clearInterval(intervalId);
    }
  }, [nodeId, isConnected, readNode, options?.enabled, options?.pollInterval]);

  return { data, error, isConnected };
}

/**
 * Hook for reading multiple nodes with auto-refresh
 */
export function useOPCUANodes(
  nodeIds: string[],
  options?: {
    pollInterval?: number;
    enabled?: boolean;
  }
) {
  const { isConnected, readNodes } = useOPCUA();
  const [data, setData] = useState<OPCUANodeValue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataMap, setDataMap] = useState<Map<string, OPCUANodeValue>>(new Map());

  useEffect(() => {
    if (!nodeIds.length || !options?.enabled || !isConnected) return;

    const fetchData = async () => {
      const results = await readNodes(nodeIds);
      if (results.length) {
        setData(results);
        setError(null);
        
        // Update map for easy access by nodeId
        const map = new Map<string, OPCUANodeValue>();
        results.forEach((item) => map.set(item.nodeId, item));
        setDataMap(map);
      } else {
        setError("Failed to read nodes");
      }
    };

    fetchData();

    if (options.pollInterval) {
      const intervalId = setInterval(fetchData, options.pollInterval);
      return () => clearInterval(intervalId);
    }
  }, [nodeIds.join(","), isConnected, readNodes, options?.enabled, options?.pollInterval]);

  return { data, dataMap, error, isConnected };
}
