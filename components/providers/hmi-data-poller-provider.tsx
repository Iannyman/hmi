/**
 * HMI Data Poller Provider
 *
 * Handles polling of HMI data from the server.
 * This provider runs only ONCE in the app tree, ensuring a single polling interval.
 * Components consume the data through HMIDataContext without triggering additional polls.
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
   */
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only poll when initialized and connected
    if (!isInitialized || !isConnected) {
      return;
    }

    // Start polling every HMI_DATA_REFRESH_INTERVAL
    intervalRef.current = setInterval(() => {
      refreshData();
    }, HMI_DATA_REFRESH_INTERVAL);

    // Initial fetch
    refreshData();

    // Cleanup on unmount or when conditions change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isInitialized, isConnected]);

  return <>{children}</>;
}
