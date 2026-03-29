/**
 * HMI Auto-Initializer Provider
 *
 * Automatically connects to OPC UA and initializes the HMI system on app load.
 * This is the single place that manages OPC UA connection lifecycle.
 *
 * Connection Management:
 * - Checks if server is already connected on mount (e.g., from previous page load)
 * - If not connected, attempts connection
 * - When heartbeat detects connection loss, shows offline state and attempts reconnection
 * - Reconnection attempts every 5 seconds with no rapid retry loops
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useOPCUA } from "./opcua-hook";
import { useHMIManager } from "./hmi-manager-hook";
import { useConnectionSetter } from "./connection-provider";
import { HMISSEProvider } from "./hmi-sse-provider";

interface HMIInitializerProviderProps {
  children: React.ReactNode;
}

// Reconnection settings
const RECONNECT_INTERVAL_MS = parseInt(process.env.NEXT_PUBLIC_RECONNECT_INTERVAL_MS || "5000", 10);

export function HMIInitializerProvider({ children }: HMIInitializerProviderProps) {
  const { isConnected, isLoading, connect, disconnect, browse, checkConnection } = useOPCUA();
  const { isInitialized: hmiInitialized, isInitializing: hmiInitializing, initialize: initializeHMI, setIsInitialized } = useHMIManager();
  const { setIsConnected: setSharedConnection } = useConnectionSetter();
  const [initAttempted, setInitAttempted] = useState(false);

  // Use ref to track reconnection interval so we can clear it
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Use ref to track if we've already started reconnecting to prevent infinite loops
  const hasStartedReconnectingRef = useRef(false);

  // PLC configuration - consider moving to environment variable or settings
  const plcConfig = {
    endpointUrl: process.env.NEXT_PUBLIC_OPCUA_ENDPOINT || "opc.tcp://192.168.1.91:4840",
    securityMode: "None" as const,
    securityPolicy: "None" as const,
  };

  /**
   * Attempt connection to OPC UA server
   * @param forceDisconnect - If true, disconnect first to clear stale state
   */
  const attemptConnect = async (forceDisconnect = false): Promise<boolean> => {
    try {
      // When reconnecting, first disconnect to clear any stale server state
      if (forceDisconnect) {
        console.log("[HMIInitializer] Disconnecting to clear stale state...");
        await disconnect();
        // Small delay to ensure disconnect completes
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log("[HMIInitializer] Attempting to connect to OPC UA...");
      const success = await connect(plcConfig);
      if (success) {
        console.log("[HMIInitializer] Successfully connected to OPC UA");
        hasStartedReconnectingRef.current = false;
        setInitAttempted(true);
        // Update shared connection state so all components see the connected status
        setSharedConnection(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[HMIInitializer] Failed to connect:", err);
      return false;
    }
  };

  /**
   * Start reconnection attempts when disconnected
   */
  const startReconnecting = () => {
    // Prevent multiple intervals from being created
    if (hasStartedReconnectingRef.current || reconnectIntervalRef.current) {
      return;
    }

    hasStartedReconnectingRef.current = true;
    console.log("[HMIInitializer] Connection lost - will retry every", RECONNECT_INTERVAL_MS, "ms");

    // Wait a bit before first attempt to ensure disconnect completes
    // This prevents race conditions where client/session aren't fully cleared yet
    const firstAttemptDelay = parseInt(process.env.NEXT_PUBLIC_RECONNECT_FIRST_DELAY_MS || "1000", 10);

    const timeoutId = setTimeout(() => {
      // Check if we're still supposed to be reconnecting
      // This prevents creating intervals after stopReconnecting was called
      if (!hasStartedReconnectingRef.current) {
        return;
      }

      console.log("[HMIInitializer] First reconnection attempt...");
      attemptConnect(true); // Force disconnect to clear stale state

      // Then retry at intervals
      reconnectIntervalRef.current = setInterval(() => {
        if (!hasStartedReconnectingRef.current) {
          clearInterval(reconnectIntervalRef.current as NodeJS.Timeout);
          reconnectIntervalRef.current = null;
          return;
        }
        console.log("[HMIInitializer] Reconnection attempt...");
        attemptConnect(true); // Force disconnect to clear stale state
      }, RECONNECT_INTERVAL_MS);
    }, firstAttemptDelay);

    // Store the timeout ID so we can clear it if needed
    reconnectIntervalRef.current = timeoutId as unknown as NodeJS.Timeout;
  };

  /**
   * Stop reconnection attempts
   */
  const stopReconnecting = () => {
    if (reconnectIntervalRef.current) {
      clearTimeout(reconnectIntervalRef.current);
      clearInterval(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
    hasStartedReconnectingRef.current = false;
  };

  /**
   * Initial connection on mount
   * Check if server is already connected, then only connect if needed
   */
  useEffect(() => {
    const ensureConnection = async () => {
      if (!initAttempted && !isLoading) {
        // First check if server is already connected (e.g., from previous page load)
        const alreadyConnected = await checkConnection();

        // Delay to ensure state update propagates to all consumers
        // This prevents race condition where dashboard renders before state updates
        await new Promise(resolve => setTimeout(resolve, 300));

        if (alreadyConnected) {
          // Server already connected - skip connect step
          console.log("[HMIInitializer] Server already connected - skipping connect step");
          setInitAttempted(true);
          // Update shared connection state so all components see the connected status
          setSharedConnection(true);
        } else {
          // Not connected - proceed with connection
          attemptConnect();
        }
      }
    };
    ensureConnection();
  }, [initAttempted, isLoading]);

  /**
   * Monitor connection state and start/stop reconnection
   * - When we lose connection, start retrying and reset HMI state
   * - When we reconnect, stop retrying
   */
  useEffect(() => {
    if (isConnected) {
      // We're connected - stop any reconnection attempts and reset
      hasStartedReconnectingRef.current = false;
      stopReconnecting();
      // Ensure shared connection state is also set to true
      setSharedConnection(true);
      return;
    }

    if (!isLoading && initAttempted) {
      // We were connected, now we're not - start reconnection
      // Reset both client and server HMI state
      if (hmiInitialized) {
        console.log("[HMIInitializer] Connection lost - resetting HMI state");
        setIsInitialized(false);
        // Update shared connection state so all components see the disconnected status
        setSharedConnection(false);
        // Also reset server-side HMI manager
        fetch("/api/hmi/reset", { method: "POST" }).catch(err =>
          console.error("[HMIInitializer] Failed to reset HMI manager:", err)
        );
      }
      // The ref check inside startReconnecting prevents duplicate calls
      startReconnecting();
    }

    // Cleanup on unmount
    return () => stopReconnecting();
  }, [isConnected, isLoading, initAttempted, hmiInitialized, setIsInitialized]);

  /**
   * Periodically sync connection state with server
   * This ensures that if the server-side connection is lost (e.g., heartbeat disconnect),
   * the client-side state is updated to trigger reconnection.
   */
  useEffect(() => {
    // Only run this after initial connection attempt
    if (!initAttempted) return;

    const syncInterval = setInterval(async () => {
      const actuallyConnected = await checkConnection();
      const shouldBeConnected = actuallyConnected;

      // Update shared state to match actual server state
      if (shouldBeConnected !== isConnected) {
        console.log("[HMIInitializer] Syncing connection state:", isConnected, "->", shouldBeConnected);
        setSharedConnection(shouldBeConnected);
      }
    }, parseInt(process.env.NEXT_PUBLIC_CONNECTION_SYNC_INTERVAL_MS || "2000", 10));

    return () => clearInterval(syncInterval);
  }, [initAttempted, isConnected]);

  /**
   * Auto-browse and initialize HMI when connected
   */
  useEffect(() => {
    const autoBrowseAndInitialize = async () => {
      if (isConnected && !hmiInitialized && !hmiInitializing && !hasStartedReconnectingRef.current) {
        console.log("[HMIInitializer] Auto-browsing OPC UA structure...");
        try {
          // Verify connection is actually ready before browsing
          // Retry up to 5 times with 1 second delay between attempts
          let connectionVerified = false;
          for (let i = 0; i < 5; i++) {
            try {
              const response = await fetch("/api/opcua/connect");
              if (response.ok) {
                const result = await response.json();
                if (result.connected) {
                  connectionVerified = true;
                  console.log("[HMIInitializer] Connection verified on attempt", i + 1);
                  break;
                }
              }
            } catch (err) {
              console.log("[HMIInitializer] Connection verification attempt", i + 1, "failed:", err);
            }
            if (i < 4) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          if (!connectionVerified) {
            console.error("[HMIInitializer] Connection verification failed after 5 attempts");
            return;
          }

          // Longer delay to ensure OPC UA session is fully stable and ready for browsing
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Final verification before browsing
          const finalCheck = await fetch("/api/opcua/connect");
          const finalResult = await finalCheck.json();
          if (!finalCheck.ok || !finalResult.connected) {
            console.error("[HMIInitializer] Final connection check failed");
            return;
          }

          // Step 1: Browse ObjectsFolder with sufficient depth (with retry)
          let treeData;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              treeData = await browse("ObjectsFolder", "tree", 15);
              break;
            } catch (err) {
              console.log("[HMIInitializer] Browse attempt", attempt + 1, "failed:", err);
              if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              } else {
                throw err;
              }
            }
          }

          // Step 2: Find ServerInterfaces -> hmi path
          const serverInterfaces = (treeData as { displayName: string; children?: { displayName: string }[] }[]).find(
            (node) => node.displayName === "ServerInterfaces"
          );

          if (!serverInterfaces) {
            console.error("[HMIInitializer] ServerInterfaces not found");
            return;
          }

          const hmi = serverInterfaces?.children?.find(
            (child) => child.displayName === "hmi"
          );

          if (!hmi) {
            console.error("[HMIInitializer] 'hmi' node not found under ServerInterfaces");
            return;
          }

          // Step 3: Initialize HMI Manager with HMI structure
          console.log("[HMIInitializer] Initializing HMI Manager...");
          await initializeHMI([hmi]);
          console.log("[HMIInitializer] HMI Manager initialized successfully!");
        } catch (err) {
          console.error("[HMIInitializer] Failed to browse/initialize HMI:", err);
        }
      }
    };
    autoBrowseAndInitialize();
  }, [isConnected, hmiInitialized, hmiInitializing, browse, initializeHMI]);

  // Render children wrapped in SSE provider — SSE only activates after init
  return <HMISSEProvider>{children}</HMISSEProvider>;
}
