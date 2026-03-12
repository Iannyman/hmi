"use client";

import { useEffect, useRef, useState } from "react";
import { useHMIDataContext } from "@/components/providers/hmi-data-provider";

/**
 * Hook for managing OPC UA subscriptions based on current route
 *
 * This hook implements route-based lazy subscriptions:
 * - Dashboard: Line + Order + Stations.Control data only
 * - Devices: Devices for the specific station being viewed
 *
 * When the route changes, it automatically unsubscribes from the previous
 * route's nodes and subscribes to the new route's nodes.
 *
 * @param currentRoute - The current route path
 * @param stationId - Optional station ID (required for /devices route)
 */
export function useOPCUASubscription(currentRoute: string, stationId?: string) {
  const { isInitialized } = useHMIDataContext();

  // Track current subscription state
  const [subscribedNodeIds, setSubscribedNodeIds] = useState<string[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);

  // Store previous route for cleanup comparison
  const prevRouteRef = useRef<string | null>(null);
  const prevStationIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef<boolean>(false);

  useEffect(() => {
    // Don't subscribe until HMI Manager is initialized
    if (!isInitialized) {
      console.log("[useOPCUASubscription] Waiting for HMI initialization...");
      return;
    }

    // Skip if already processing this exact route/station
    const subscriptionKey = `${currentRoute}:${stationId || "none"}`;
    if (currentSubscription === subscriptionKey || isLoadingRef.current) {
      return;
    }

    // Subscribe to the route
    const subscribeToRoute = async () => {
      isLoadingRef.current = true;
      try {
        console.log(`[useOPCUASubscription] Subscribing to route: ${currentRoute}${stationId ? ` (${stationId})` : ""}`);

        const response = await fetch("/api/hmi/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ route: currentRoute, stationId }),
        });

        const result = await response.json();

        if (result.success) {
          console.log(`[useOPCUASubscription] Successfully subscribed to: ${currentRoute}${stationId ? ` (${stationId})` : ""}`);

          // Update subscription state
          setCurrentSubscription(subscriptionKey);

          // Set subscribed node IDs based on route
          if (currentRoute === "/dashboard") {
            // Dashboard: Line + all Stations.Control
            setSubscribedNodeIds([
              "Line.sName",
              "Line.sInStatus",
              "Line.iMode",
              "Line.dPartsOK",
              "Line.dPartsNOK",
              "All Stations.Control.*",
            ]);
          } else if (currentRoute === "/devices" && stationId) {
            // Devices: specific station's devices
            setSubscribedNodeIds([`${stationId}.* (all devices)`]);
          } else {
            setSubscribedNodeIds([]);
          }
        } else {
          console.error("[useOPCUASubscription] Failed to subscribe:", result.error);
        }
      } catch (error) {
        console.error("[useOPCUASubscription] Failed to subscribe to route:", error);
      } finally {
        isLoadingRef.current = false;
      }
    };

    subscribeToRoute();

    // Store current route for next cleanup
    prevRouteRef.current = currentRoute;
    prevStationIdRef.current = stationId || null;
  }, [currentRoute, stationId, currentSubscription, isInitialized]);

  // Cleanup on unmount - unsubscribe from devices if on devices page
  useEffect(() => {
    return () => {
      if (prevRouteRef.current === "/devices" && prevStationIdRef.current) {
        console.log("[useOPCUASubscription] Cleaning up device subscriptions on unmount");
        // Note: The server-side HMI Manager will handle cleanup when the next
        // route subscription comes in, so we don't need to explicitly call
        // unsubscribe here
      }
    };
  }, []);

  return {
    subscribedNodeIds,
    currentSubscription,
  };
}
