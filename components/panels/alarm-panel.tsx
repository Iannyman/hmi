"use client";

import type { Alarm } from "@/types/alarm.types";
import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AlarmPanelProps {
  alarms: Alarm[];
  onAcknowledge?: (alarmId: string) => void;
  onAcknowledgeAll?: () => void;
  onClear?: (alarmId: string) => void;
  onClearHistory?: () => void;
  maxHeight?: string;
}

export function AlarmPanel({
  alarms,
  onAcknowledge,
  onAcknowledgeAll,
  onClear,
  onClearHistory,
  maxHeight = "400px",
}: AlarmPanelProps) {
  const alarmCount = alarms.length;
  const criticalCount = alarms.filter((a) => a.severity === "critical").length;

  const handleAcknowledgeAll = () => {
    if (onAcknowledgeAll) {
      // Use the dedicated acknowledgeAll handler if available
      onAcknowledgeAll();
    } else {
      // Fallback: acknowledge each alarm individually
      alarms.forEach((a) => {
        if (!a.acknowledged) {
          onAcknowledge?.(a.id);
        }
      });
    }
  };

  // If onClearHistory is provided, we're in history mode - show Clear button
  const isHistoryMode = onClearHistory !== undefined;

  const getIcon = (severity: Alarm["severity"]) => {
    const iconClass = "w-4 h-4";
    switch (severity) {
      case "critical":
        return <AlertTriangle className={cn(iconClass, "text-[hsl(var(--status-fault))]")} />;
      case "warning":
        return <AlertCircle className={cn(iconClass, "text-[hsl(var(--status-warning))]")} />;
      case "info":
        return <Info className={cn(iconClass, "text-[hsl(var(--text-muted))]")} />;
    }
  };

  const getBorderClass = (severity: Alarm["severity"]) => {
    switch (severity) {
      case "critical":
        return "border-[hsl(var(--status-fault))] bg-[hsl(var(--status-fault))]/10 glow-red";
      case "warning":
        return "border-[hsl(var(--status-warning))] bg-[hsl(var(--status-warning))]/10 glow-yellow";
      default:
        return "border-[hsl(var(--border))]";
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4.5 h-4.5 text-[hsl(var(--text-muted))]" />
          <span className="text-sm font-bold text-[hsl(var(--text))]">ALARMS</span>
          {alarmCount > 0 && (
            <span className="text-xs text-[hsl(var(--text-muted))]">({alarmCount})</span>
          )}
          {criticalCount > 0 && (
            <span className="text-xs text-[hsl(var(--status-fault))] font-bold px-2 py-0.5 rounded-md bg-[hsl(var(--status-fault))]/10">({criticalCount} CRITICAL)</span>
          )}
        </div>
        {isHistoryMode ? (
          <Button
            onClick={onClearHistory}
            variant="outline"
            size="lg"
            className="px-12"
          >
            Clear
          </Button>
        ) : (
          <Button
            onClick={handleAcknowledgeAll}
            variant="outline"
            size="lg"
            className="px-12"
          >
            Ack All
          </Button>
        )}
      </div>

      {/* Alarm list */}
      <div style={{ maxHeight }} className="overflow-y-auto scrollbar-modern">
        {alarms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--text-muted))]">
            <div className="w-12 h-12 mb-3 rounded-full bg-[hsl(var(--status-running))]/20 flex items-center justify-center glow-green">
              <CheckCircle className="w-7 h-7 text-[hsl(var(--status-running))]" strokeWidth={2} />
            </div>
            <p className="text-sm font-semibold">No Active Alarms</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={cn(
                  "p-4 transition-all duration-200 hover:bg-[hsl(var(--surface))]",
                  !alarm.acknowledged && getBorderClass(alarm.severity)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(alarm.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-[hsl(var(--text))]">
                          {alarm.title}
                        </h4>
                        <p className="text-xs text-[hsl(var(--text-muted))] mt-1">
                          {alarm.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2.5 text-xs text-[hsl(var(--text-dim))]">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-mono">{alarm.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
