/**
 * Alarm Notification Wrapper
 *
 * Provides real-time alarm notifications using SSE (Server-Sent Events)
 * instead of polling. Listens for alarm events dispatched by HMISSEProvider.
 */

"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import { AlarmNotificationProvider } from "@/components/providers/alarm-notification-provider";
import { AlarmNotification } from "@/components/notifications/alarm-notification";
import { getAlarms, acknowledgeAlarm } from "@/app/(dashboard)/_actions/alarm-actions";
import { Alarm } from "@/types/alarm.types";

interface AlarmNotificationWrapperProps {
  children: ReactNode;
}

export function AlarmNotificationWrapper({ children }: AlarmNotificationWrapperProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  // Fetch alarms using Server Action (initial load only)
  const fetchAlarms = useCallback(async () => {
    try {
      const result = await getAlarms();

      if (result.success && result.data) {
        console.log("[AlarmWrapper] Initial alarms loaded:", result.data.length);
        setAlarms(result.data);
      } else {
        console.warn("[AlarmWrapper] Failed to load alarms:", result.error);
      }
    } catch (error) {
      console.warn("[AlarmWrapper] Failed to fetch alarms:", error);
    }
  }, []);

  // Listen for SSE alarm events instead of polling
  useEffect(() => {
    console.log("[AlarmWrapper] Listening for SSE alarm events...");

    const handleAlarmAdded = (event: Event) => {
      const customEvent = event as CustomEvent<Alarm>;
      const alarm = customEvent.detail;
      console.log("[AlarmWrapper] New alarm via SSE:", alarm.id);

      // Add to alarms list if not already present
      setAlarms((prev) => {
        const exists = prev.some((a) => a.id === alarm.id);
        if (!exists) {
          return [...prev, alarm];
        }
        return prev;
      });
    };

    const handleAlarmAcknowledged = (event: Event) => {
      const customEvent = event as CustomEvent<Alarm>;
      const alarm = customEvent.detail;
      console.log("[AlarmWrapper] Alarm acknowledged via SSE:", alarm.id);

      // Update alarm in list
      setAlarms((prev) =>
        prev.map((a) =>
          a.id === alarm.id
            ? {
                ...a,
                acknowledged: true,
                acknowledgedBy: alarm.acknowledgedBy,
                acknowledgedAt: alarm.acknowledgedAt,
              }
            : a
        )
      );
    };

    // Listen for custom events dispatched by HMISSEProvider
    window.addEventListener("alarm:added", handleAlarmAdded);
    window.addEventListener("alarm:acknowledged", handleAlarmAcknowledged);

    // Also fetch initial alarms on mount
    fetchAlarms();

    return () => {
      window.removeEventListener("alarm:added", handleAlarmAdded);
      window.removeEventListener("alarm:acknowledged", handleAlarmAcknowledged);
    };
  }, [fetchAlarms]);

  // Handle acknowledge - calls Server Action
  const handleAcknowledge = useCallback(async (alarmId: string) => {
    console.log("[AlarmWrapper] Acknowledging alarm:", alarmId);

    const result = await acknowledgeAlarm(alarmId);

    if (result.success) {
      console.log("[AlarmWrapper] Alarm acknowledged successfully");
      // Note: We don't need to refresh alarms here since the SSE event will update them
    } else {
      console.error("[AlarmWrapper] Failed to acknowledge alarm:", result.error);
    }
  }, []);

  return (
    <AlarmNotificationProvider alarms={alarms} onAcknowledge={handleAcknowledge}>
      {children}
      <AlarmNotification />
    </AlarmNotificationProvider>
  );
}
