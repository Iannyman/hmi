/**
 * HMI Data Poller Provider
 *
 * DISABLED: SSE (Server-Sent Events) is now used for real-time updates instead of polling.
 * This provider is kept as a fallback if SSE fails.
 *
 * To re-enable polling:
 * 1. Uncomment the useEffect below
 * 2. Remove the HMIDataProvider's useHMISSE() call
 */

"use client";

import { useEffect, useRef } from "react";
import { useHMIDataContext } from "./hmi-data-provider";
import { useConnection } from "@/hooks/use-connection";
import { ReactNode } from "react";

// ============================================================================
// Configuration
// ============================================================================

/**
 * HMI data refresh interval (in milliseconds)
 * Read from environment variable NEXT_PUBLIC_HMI_REFRESH_INTERVAL
 * Lower values = faster UI updates but more server load
 * Recommended: 500-5000ms
 */
const HMI_DATA_REFRESH_INTERVAL = Number(process.env.NEXT_PUBLIC_HMI_REFRESH_INTERVAL) || 1000;

interface HMIDataPollerProviderProps {
  children: ReactNode;
}

export function HMIDataPollerProvider({ children }: HMIDataPollerProviderProps) {
  const { isInitialized, setHmiData } = useHMIDataContext();
  const { isConnected } = useConnection();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Refresh HMI data from server
   */
  const refreshData = async () => {
    if (!isInitialized) return;

    try {
      const response = await fetch("/api/hmi/read");
      const result = await response.json();

      if (result.success) {
        setHmiData(result.data);
      } else {
        console.warn("[HMIDataPoller] API returned:", result.error);
        setHmiData(null);
      }
    } catch (err) {
      console.warn("[HMIDataPoller] Failed to refresh HMI data:", err);
      setHmiData(null);
    }
  };

  /**
   * Set up polling when initialized and connected
   *
   * DISABLED: SSE is now used for real-time updates.
   * Re-enable this useEffect if SSE fails and you need polling fallback.
   */
  // useEffect(() => {
  //   // Clear any existing interval
  //   if (intervalRef.current) {
  //     clearInterval(intervalRef.current);
  //     intervalRef.current = null;
  //   }
  //
  //   // Only poll when initialized and connected
  //   if (!isInitialized || !isConnected) {
  //     return;
  //   }
  //
  //   // Start polling every HMI_DATA_REFRESH_INTERVAL
  //   intervalRef.current = setInterval(() => {
  //     refreshData();
  //   }, HMI_DATA_REFRESH_INTERVAL);
  //
  //   // Initial fetch
  //   refreshData();
  //
  //   // Cleanup on unmount or when conditions change
  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //       intervalRef.current = null;
  //     }
  //   };
  // }, [isInitialized, isConnected]);

  return <>{children}</>;
}
