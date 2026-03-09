"use client";

import { useEffect, useState, useCallback } from "react";
import { AlarmPanel } from "@/components/panels/alarm-panel";
import { getAlarms, acknowledgeAlarm as acknowledgeAlarmAction, acknowledgeAllAlarms, clearAlarmHistory } from "@/actions/alarm-actions";
import { Alarm } from "@/types/alarm.types";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

// Polling interval for alarms page (ms)
const ALARM_POLL_INTERVAL = 2000;

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch alarms from Server Action
  const fetchAlarms = useCallback(async () => {
    try {
      const result = await getAlarms();
      if (result.success && result.data) {
        setAlarms(result.data);
      } else {
        console.error("Failed to fetch alarms:", result.error);
      }
    } catch (error) {
      console.error("Failed to fetch alarms:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and set up polling
  useEffect(() => {
    fetchAlarms();

    const interval = setInterval(fetchAlarms, ALARM_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAlarms]);

  // Handle acknowledge
  const handleAcknowledge = useCallback(async (alarmId: string) => {
    const result = await acknowledgeAlarmAction(alarmId);
    if (result.success) {
      // Refresh alarms immediately after acknowledge
      fetchAlarms();
    } else {
      console.error("Failed to acknowledge alarm:", result.error);
    }
  }, [fetchAlarms]);

  // Handle acknowledge all
  const handleAcknowledgeAll = useCallback(async () => {
    const result = await acknowledgeAllAlarms();
    if (result.success) {
      console.log(`Acknowledged ${result.acknowledgedCount || 0} alarms`);
      // Refresh alarms immediately after acknowledge
      fetchAlarms();
    } else {
      console.error("Failed to acknowledge all alarms:", result.error);
    }
  }, [fetchAlarms]);

  // Handle clear history
  const handleClearHistory = useCallback(async () => {
    const result = await clearAlarmHistory();
    if (result.success) {
      console.log(`Cleared ${result.clearedCount || 0} acknowledged alarms`);
      // Refresh alarms immediately after clearing
      fetchAlarms();
    } else {
      console.error("Failed to clear alarm history:", result.error);
    }
  }, [fetchAlarms]);

  // Filter alarms by severity and status
  const criticalAlarms = alarms.filter((a) => a.severity === "critical");
  const warningAlarms = alarms.filter((a) => a.severity === "warning");
  const infoAlarms = alarms.filter((a) => a.severity === "info");
  const activeAlarms = alarms.filter((a) => !a.acknowledged);

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6 pb-4 border-b border-gray-800">
        <h1 className="text-2xl font-semibold tracking-tight">ALARMS</h1>
        <p className="text-gray-500 text-sm mt-1">View and manage system alarms and alerts</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold font-mono tabular-nums">{activeAlarms.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Active Alarms</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold font-mono tabular-nums">{criticalAlarms.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Critical</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold font-mono tabular-nums">{warningAlarms.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Warning</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold font-mono tabular-nums">{infoAlarms.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Info</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active alarms */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Active Alarms</h2>
        {isLoading ? (
          <div className="card p-12 text-center text-gray-500">
            Loading alarms...
          </div>
        ) : (
          <AlarmPanel
            alarms={activeAlarms}
            onAcknowledge={handleAcknowledge}
            onAcknowledgeAll={handleAcknowledgeAll}
            onClear={(id) => console.log("Clear alarm:", id)}
          />
        )}
      </div>

      {/* All alarms history */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Alarm History</h2>
        {isLoading ? (
          <div className="card p-12 text-center text-gray-500">
            Loading alarms...
          </div>
        ) : (
          <AlarmPanel
            alarms={alarms}
            onAcknowledge={handleAcknowledge}
            onClearHistory={handleClearHistory}
            onClear={(id) => console.log("Clear alarm:", id)}
            maxHeight="600px"
          />
        )}
      </div>
    </div>
  );
}
