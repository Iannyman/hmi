"use client";

import { useEffect, useRef } from "react";
import { useOPCUA } from "./use-opcua";
import { useOPCUAData } from "@/components/providers/opcua-data-provider";
import { RouteSubscriptionConfig } from "@/types/opcua.types";

// Default subscription configurations for each route
export const ROUTE_SUBSCRIPTIONS: RouteSubscriptionConfig[] = [
  {
    route: "/dashboard",
    nodePaths: ["Line", "Order", "Stations.Control"],
    description: "Line status, Order info, and all station controls"
  },
  {
    route: "/devices",
    nodePaths: ["Stations"], // All station devices
    description: "All station devices and their values"
  },
  {
    route: "/alarms",
    nodePaths: ["Alarms"],
    description: "Alarm notifications and status"
  },
  {
    route: "/trends",
    nodePaths: ["Line", "Stations"],
    description: "Line and station data for trend analysis"
  },
  {
    route: "/settings",
    nodePaths: ["Settings"],
    description: "System settings"
  }
];

/**
 * Hook for managing OPC UA subscriptions based on current route
 * 
 * Note: This hook is currently disabled. The subscription logic is commented out
 * because it requires the OPC UA server to be browsed first to collect node IDs.
 * Use the "Dynamic Browse" feature in the OPC UA Demo page to load data from
 * the server first, then subscriptions can be enabled.
 */
export function useOPCUASubscription(currentRoute: string) {
  const { isConnected, subscribe, unsubscribe } = useOPCUA();
  const { opcuaMockData } = useOPCUAData();
  
  // Track current subscription to avoid duplicate subscriptions
  const currentSubscriptionRef = useRef<string | null>(null);
  const subscribedNodeIdsRef = useRef<Set<string>>(new Set());

  // Handle subscription updates
  const handleSubscriptionUpdate = (data: { 
    nodeId: string; 
    value: unknown; 
    statusCode: string; 
    sourceTimestamp?: Date; 
    serverTimestamp?: Date 
  }) => {
    console.log(`Subscription update: ${data.nodeId} = ${data.value}`);
    // The OPCUADataProvider will handle updating mock data
  };

  return {
    subscribedNodeIds: Array.from(subscribedNodeIdsRef.current),
    currentSubscription: currentSubscriptionRef.current
  };
}

/**
 * Helper function to collect node IDs by paths
 * 
 * This function traverses the mock data structure to find node IDs
 * corresponding to the specified paths (e.g., "Line", "Order", "Stations.Control")
 */
export function collectNodeIdsByPaths(
  opcuaMockData: { stations: any[] } | null,
  paths: string[]
): string[] {
  const nodeIds: string[] = [];

  if (!opcuaMockData) {
    return nodeIds;
  }

  for (const path of paths) {
    if (path === "Line") {
      // Add Line node ID if available
      // This would come from browsing structure
      console.log("Collecting Line nodes...");
    } else if (path === "Order") {
      // Add Order node ID if available
      console.log("Collecting Order nodes...");
    } else if (path === "Stations.Control") {
      // Collect all Station.Control node IDs
      for (const station of opcuaMockData.stations) {
        // Find Control children in station
        const controlNode = station.nodeId; // This would be station's Control node
        if (controlNode) {
          nodeIds.push(controlNode);
        }
      }
    } else if (path === "Stations") {
      // Collect all station node IDs and their devices
      for (const station of opcuaMockData.stations) {
        nodeIds.push(station.nodeId);
        for (const device of station.devices) {
          // Add device variable node IDs
          Object.values(device.values).forEach(value => {
            if (typeof value === "string" && value.startsWith("ns=")) {
              nodeIds.push(value);
            }
          });
        }
      }
    } else if (path === "Alarms") {
      // Collect alarm node IDs
      console.log("Collecting Alarm nodes...");
    } else if (path === "Settings") {
      // Collect settings node IDs
      console.log("Collecting Settings nodes...");
    }
  }

  return nodeIds;
}
