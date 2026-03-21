/**
 * HMI SSE Provider
 *
 * Wraps the HMIDataProvider to enable Server-Sent Events for real-time updates.
 * This provider must be rendered INSIDE HMIDataProvider.
 *
 * Handles:
 * - Line/Station/Device updates via OPC UA subscriptions
 * - Alarm events from AlarmManager continuous scanning
 */

"use client";

import { ReactNode, useEffect, useState } from "react";
import { StationData } from "@/types/station.types";
import { useHMIDataContext } from "./hmi-data-provider";

interface HMISSEProviderProps {
  children: ReactNode;
}

export function HMISSEProvider({ children }: HMISSEProviderProps) {
  const { setHmiData, isInitialized } = useHMIDataContext();
  const [isMounted, setIsMounted] = useState(false);

  // Only run on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Skip if not mounted or not initialized
    if (!isMounted || !isInitialized) {
      return;
    }

    console.log("[HMISSEProvider] Starting SSE connection...");

    let eventSource: EventSource | null = null;
    const currentData = {
      line: null as any,
      stations: new Map<string, StationData>(),
    };

    // Debounce timer to prevent rapid updates
    let updateTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      console.log("[HMISSEProvider] Connecting to SSE...");

      eventSource = new EventSource("/api/hmi/events");

      eventSource.onopen = () => {
        console.log("[HMISSEProvider] SSE connection opened");
      };

      eventSource.addEventListener("connected", (e: MessageEvent) => {
        console.log("[HMISSEProvider] Connected:", JSON.parse(e.data));
      });

      eventSource.addEventListener("line:updated", (e: MessageEvent) => {
        const lineData = JSON.parse(e.data);
        console.log("[HMISSEProvider] Line updated:", lineData);
        currentData.line = lineData;
        scheduleUpdate();
      });

      eventSource.addEventListener("station:updated", (e: MessageEvent) => {
        const stationData = JSON.parse(e.data);
        console.log(`[HMISSEProvider] Station updated: ${stationData.id}`);
        currentData.stations.set(stationData.id, stationData);
        scheduleUpdate();
      });

      eventSource.addEventListener("device:updated", (e: MessageEvent) => {
        const { stationId, device } = JSON.parse(e.data);
        const station = currentData.stations.get(stationId);
        if (station && station.devices) {
          const deviceIndex = station.devices.findIndex((d: any) => d.id === device.id);
          if (deviceIndex !== -1) {
            station.devices[deviceIndex] = { ...station.devices[deviceIndex], ...device };
          }
        }
        scheduleUpdate();
      });

      // Alarm events - dispatch custom events for AlarmNotificationWrapper
      eventSource.addEventListener("alarm:added", (e: MessageEvent) => {
        const alarm = JSON.parse(e.data);
        console.log(`[HMISSEProvider] Alarm added: ${alarm.id}`);
        // Dispatch custom event for AlarmNotificationWrapper to listen to
        window.dispatchEvent(new CustomEvent('alarm:added', { detail: alarm }));
      });

      eventSource.addEventListener("alarm:acknowledged", (e: MessageEvent) => {
        const alarm = JSON.parse(e.data);
        console.log(`[HMISSEProvider] Alarm acknowledged: ${alarm.id}`);
        // Dispatch custom event for AlarmNotificationWrapper to listen to
        window.dispatchEvent(new CustomEvent('alarm:acknowledged', { detail: alarm }));
      });

      eventSource.onerror = (err) => {
        console.error("[HMISSEProvider] SSE error:", err);
        if (eventSource) {
          eventSource.close();
          // Reconnect after 3 seconds
          setTimeout(connect, 3000);
        }
      };
    };

    const updateContext = () => {
      if (currentData.line || currentData.stations.size > 0) {
        setHmiData({
          line: currentData.line,
          stations: Array.from(currentData.stations.values()),
        });
      }
    };

    // Debounced update - prevents rapid successive updates
    const scheduleUpdate = () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      updateTimeout = setTimeout(() => {
        updateContext();
        updateTimeout = null;
      }, 0); // Instant updates - changed from 100ms for faster response
    };

    connect();

    return () => {
      console.log("[HMISSEProvider] Cleaning up SSE");
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isInitialized, isMounted]); // Removed setHmiData from dependencies!

  return <>{children}</>;
}
