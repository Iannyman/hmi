/**
 * S7 Auto-Initializer Provider
 *
 * Automatically connects to the S7 PLC on app load.
 * Mirrors HMIInitializerProvider pattern used for OPC UA.
 *
 * - Checks if server is already connected on mount
 * - If not connected, attempts connection using env defaults
 * - Auto-reconnects on connection loss
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useS7 } from "./s7-hook";
import { useS7ConnectionSetter } from "./s7-connection-provider";

const S7_RECONNECT_INTERVAL_MS = parseInt(process.env.S7_RECONNECT_INTERVAL_MS || "5000", 10);

export function S7InitializerProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, isLoading, connect, disconnect, checkConnection } = useS7();
  const { setIsS7Connected } = useS7ConnectionSetter();
  const [initAttempted, setInitAttempted] = useState(false);

  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedReconnectingRef = useRef(false);

  const attemptConnect = async (forceDisconnect = false): Promise<boolean> => {
    try {
      if (forceDisconnect) {
        console.log("[S7Init] Disconnecting to clear stale state...");
        await disconnect();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log("[S7Init] Attempting to connect to S7 PLC...");
      const success = await connect();
      if (success) {
        console.log("[S7Init] Successfully connected to S7 PLC");
        hasStartedReconnectingRef.current = false;
        setInitAttempted(true);
        setIsS7Connected(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[S7Init] Failed to connect:", err);
      return false;
    }
  };

  const startReconnecting = () => {
    if (hasStartedReconnectingRef.current || reconnectIntervalRef.current) {
      return;
    }

    hasStartedReconnectingRef.current = true;
    console.log("[S7Init] Connection lost — will retry every", S7_RECONNECT_INTERVAL_MS, "ms");

    reconnectIntervalRef.current = setInterval(() => {
      if (!hasStartedReconnectingRef.current) {
        clearInterval(reconnectIntervalRef.current as NodeJS.Timeout);
        reconnectIntervalRef.current = null;
        return;
      }
      attemptConnect(true);
    }, S7_RECONNECT_INTERVAL_MS);
  };

  const stopReconnecting = () => {
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
    hasStartedReconnectingRef.current = false;
  };

  // Initial connection on mount
  useEffect(() => {
    const ensureConnection = async () => {
      if (!initAttempted && !isLoading) {
        const alreadyConnected = await checkConnection();
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (alreadyConnected) {
          console.log("[S7Init] Server already connected — skipping connect step");
          setInitAttempted(true);
          setIsS7Connected(true);
        } else {
          attemptConnect();
        }
      }
    };
    ensureConnection();
  }, [initAttempted, isLoading]);

  // Monitor connection and reconnect
  useEffect(() => {
    if (isConnected) {
      stopReconnecting();
      setIsS7Connected(true);
      return;
    }

    if (!isLoading && initAttempted) {
      setIsS7Connected(false);
      startReconnecting();
    }

    return () => stopReconnecting();
  }, [isConnected, isLoading, initAttempted]);

  // Periodic sync with server
  useEffect(() => {
    if (!initAttempted) return;

    const syncInterval = setInterval(async () => {
      const actuallyConnected = await checkConnection();
      if (actuallyConnected !== isConnected) {
        console.log("[S7Init] Syncing connection state:", isConnected, "->", actuallyConnected);
        setIsS7Connected(actuallyConnected);
      }
    }, parseInt(process.env.S7_CONNECTION_SYNC_INTERVAL_MS || "5000", 10));

    return () => clearInterval(syncInterval);
  }, [initAttempted, isConnected]);

  return <>{children}</>;
}
