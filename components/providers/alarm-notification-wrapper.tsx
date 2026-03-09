"use client";

import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { AlarmNotificationProvider } from "@/components/providers/alarm-notification-provider";
import { AlarmNotification } from "@/components/notifications/alarm-notification";
import { getAlarms, acknowledgeAlarm } from "@/actions/alarm-actions";
import { Alarm } from "@/types/alarm.types";

interface AlarmNotificationWrapperProps {
  children: ReactNode;
}

// Polling interval for alarms (ms)
const ALARM_POLL_INTERVAL = parseInt(process.env.NEXT_PUBLIC_ALARM_POLL_INTERVAL || "1000", 10);

export function AlarmNotificationWrapper({ children }: AlarmNotificationWrapperProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [useMockData, setUseMockData] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousAlarmIdsRef = useRef<Set<string>>(new Set());

  // Fetch alarms using Server Action
  const fetchAlarms = useCallback(async () => {
    try {
      const result = await getAlarms();

      if (result.success && result.data) {
        const fetchedAlarms = result.data;

        // Check if there are new alarms (for logging)
        const currentAlarmIds = new Set(fetchedAlarms.map((a) => a.id));
        const newAlarms = fetchedAlarms.filter(
          (a) => !previousAlarmIdsRef.current.has(a.id)
        );

        if (newAlarms.length > 0) {
          console.log("[AlarmWrapper] New alarms received:", newAlarms.length);
        }

        previousAlarmIdsRef.current = currentAlarmIds;
        setAlarms(fetchedAlarms);
        setUseMockData(false);
      } else {
        // Server action failed, fall back to mock data
        console.log("[AlarmWrapper] Server action not available, using mock data:", result.error);
        setUseMockData(true);
      }
    } catch (error) {
      console.warn("[AlarmWrapper] Failed to fetch alarms:", error);
      // Fall back to mock data on error
      setUseMockData(true);
    }
  }, []);

  // Start polling for alarms
  useEffect(() => {
    console.log("[AlarmWrapper] Starting alarm polling...");

    // Initial fetch
    fetchAlarms();

    // Set up polling
    pollIntervalRef.current = setInterval(() => {
      fetchAlarms();
    }, ALARM_POLL_INTERVAL);

    // Cleanup on unmount
    return () => {
      console.log("[AlarmWrapper] Stopping alarm polling...");
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchAlarms]);

  // Handle acknowledge - calls Server Action
  const handleAcknowledge = useCallback(async (alarmId: string) => {
    console.log("[AlarmWrapper] Acknowledging alarm:", alarmId);

    if (!useMockData) {
      // Call Server Action to acknowledge
      const result = await acknowledgeAlarm(alarmId);

      if (result.success) {
        console.log("[AlarmWrapper] Alarm acknowledged successfully");
        // Refresh alarms immediately after acknowledge
        fetchAlarms();
      } else {
        console.error("[AlarmWrapper] Failed to acknowledge alarm:", result.error);
      }
    } else {
      // Fallback for mock alarms
      setAlarms((prev) =>
        prev.map((a) =>
          a.id === alarmId
            ? {
                ...a,
                acknowledged: true,
                acknowledgedBy: "Operator",
                acknowledgedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
              }
            : a
        )
      );
    }
  }, [fetchAlarms, useMockData]);

  return (
    <AlarmNotificationProvider alarms={alarms} onAcknowledge={handleAcknowledge}>
      {children}
      <AlarmNotification />
    </AlarmNotificationProvider>
  );
}
