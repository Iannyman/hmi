"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AlarmPanel } from "@/components/panels/alarm-panel";
import { getAlarms, acknowledgeAlarm as acknowledgeAlarmAction, acknowledgeAllAlarms, clearAlarmHistory } from "@/actions/alarm-actions";
import { Alarm } from "@/types/alarm.types";
import { AlertTriangle, AlertCircle, Info, WifiOff } from "lucide-react";
import { useConnection } from "@/hooks/use-connection";
import { Card } from "@/components/ui/card";

// Polling interval for alarms page (ms)
const ALARM_POLL_INTERVAL = 2000;

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const { isConnected } = useConnection();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch alarms from Server Action
  const fetchAlarms = useCallback(async () => {
    try {
      const result = await getAlarms();
      if (result.success && result.data) {
        setAlarms(result.data);
        setInitError(null); // Clear error on successful fetch
      } else {
        // Check if error is due to uninitialized system
        if (result.error === "Alarm Manager not initialized") {
          setInitError("Alarm system not initialized. Please connect to OPC UA server.");
        } else {
          console.error("Failed to fetch alarms:", result.error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch alarms:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up polling - only when connected
  useEffect(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Only poll when connected to OPC UA
    if (isConnected) {
      fetchAlarms(); // Initial fetch
      pollIntervalRef.current = setInterval(fetchAlarms, ALARM_POLL_INTERVAL);
    } else {
      // Not connected - set error state
      setInitError("No OPC UA connection. Please wait for connection to be established.");
      setIsLoading(false);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isConnected, fetchAlarms]);

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

  // Sort alarms by timestamp (newest first) for history display
  const sortedAlarms = [...alarms].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Show connection error state
  if (initError) {
    return (
      <div className="p-6">
        {/* Page header */}
        <div className="mb-6 pb-4 border-b border-[hsl(var(--border))]">
          <h1 className="text-2xl font-semibold tracking-tight">ALARMS</h1>
          <p className="text-[hsl(var(--text-muted))] text-sm mt-1">View and manage system alarms and alerts</p>
        </div>

        {/* Error state */}
        <Card className="p-12 text-center border-[hsl(var(--status-error))] bg-[hsl(var(--status-error))/5]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[hsl(var(--status-error))/10]">
              <WifiOff className="w-8 h-8 text-[hsl(var(--status-error))]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[hsl(var(--status-error))]">No Connection</h2>
              <p className="text-sm text-[hsl(var(--text-muted))] mt-1">{initError}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6 pb-4 border-b border-[hsl(var(--border))]">
        <h1 className="text-2xl font-semibold tracking-tight">ALARMS</h1>
        <p className="text-[hsl(var(--text-muted))] text-sm mt-1">View and manage system alarms and alerts</p>
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
            alarms={sortedAlarms}
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
