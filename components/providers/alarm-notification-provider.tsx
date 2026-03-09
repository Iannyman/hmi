"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from "react";
import type { Alarm } from "@/types/alarm.types";

interface AlarmNotificationContextType {
  pendingAlarm: Alarm | null;
  showAlarmNotification: (alarm: Alarm) => void;
  dismissAlarm: () => void;
  acknowledgeAlarm: (alarmId: string) => void;
  dismissedAlarmIds: Set<string>;
}

const AlarmNotificationContext = createContext<AlarmNotificationContextType | undefined>(
  undefined
);

export function useAlarmNotification() {
  const context = useContext(AlarmNotificationContext);
  if (!context) {
    throw new Error("useAlarmNotification must be used within AlarmNotificationProvider");
  }
  return context;
}

interface AlarmNotificationProviderProps {
  children: ReactNode;
  alarms?: Alarm[];
  onAcknowledge?: (alarmId: string) => void;
}

export function AlarmNotificationProvider({ children, alarms = [], onAcknowledge }: AlarmNotificationProviderProps) {
  const [pendingAlarm, setPendingAlarm] = useState<Alarm | null>(null);
  const [dismissedAlarmIds, setDismissedAlarmIds] = useState<Set<string>>(new Set());
  const processedAlarmIds = useRef<Set<string>>(new Set());

  // Check for new unacknowledged alarms and show notification
  useEffect(() => {
    const unacknowledgedAlarms = alarms.filter((a) => !a.acknowledged);

    // Find the most recent critical alarm, or warning, or info
    const newAlarm = unacknowledgedAlarms.find((alarm) => {
      // Skip if already dismissed
      if (dismissedAlarmIds.has(alarm.id)) {
        return false;
      }
      // Skip if already processed (shown before)
      if (processedAlarmIds.current.has(alarm.id)) {
        return false;
      }
      return true;
    });

    if (newAlarm) {
      // Mark as processed
      processedAlarmIds.current.add(newAlarm.id);
      setPendingAlarm(newAlarm);
    } else if (unacknowledgedAlarms.length === 0) {
      // Clear processed alarms when all are acknowledged
      processedAlarmIds.current.clear();
    }
  }, [alarms, dismissedAlarmIds]);

  const showAlarmNotification = useCallback((alarm: Alarm) => {
    if (!alarm.acknowledged && !dismissedAlarmIds.has(alarm.id)) {
      processedAlarmIds.current.add(alarm.id);
      setPendingAlarm(alarm);
    }
  }, [dismissedAlarmIds]);

  const dismissAlarm = useCallback(() => {
    if (pendingAlarm) {
      setDismissedAlarmIds((prev) => new Set(prev).add(pendingAlarm.id));
    }
    setPendingAlarm(null);
  }, [pendingAlarm]);

  const acknowledgeAlarm = useCallback((alarmId: string) => {
    onAcknowledge?.(alarmId);
    setPendingAlarm(null);
  }, [onAcknowledge]);

  return (
    <AlarmNotificationContext.Provider
      value={{
        pendingAlarm,
        showAlarmNotification,
        dismissAlarm,
        acknowledgeAlarm,
        dismissedAlarmIds,
      }}
    >
      {children}
    </AlarmNotificationContext.Provider>
  );
}
