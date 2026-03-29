"use client";

import { BaseDeviceCard } from "./base-device-card";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeviceDTO } from "@/types/device.dto";

interface SensorCardProps {
  sensor: Extract<DeviceDTO, { type: "sensor" }>;
  onClick?: () => void;
}

export function SensorCard({ sensor, onClick }: SensorCardProps) {
  const isNearAlarm = sensor.value >= sensor.alarmThreshold * 0.9;

  return (
    <BaseDeviceCard
      id={sensor.id}
      name={sensor.name}
      type="sensor"
      status={sensor.status}
      location={sensor.stationId}
      onClick={onClick}
      className="w-full sm:min-w-[320px]"
    >
      {/* Large value display */}
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <div
            className={cn(
              "text-5xl font-bold font-mono tabular-nums transition-colors",
              isNearAlarm
                ? "text-status-fault animate-pulse-slow"
                : sensor.status === "warning"
                  ? "text-status-warning"
                  : "text-text-primary"
            )}
          >
            {sensor.value.toFixed(1)}
          </div>
          <div className="text-lg text-text-muted mt-1">{sensor.unit}</div>
        </div>
      </div>

      {/* Mini sparkline */}
      <div className="h-12 flex items-end gap-1 mb-4 px-2">
        {sensor.trendHistory.map((value, index) => {
          const height = ((value - sensor.min) / (sensor.max - sensor.min)) * 100;
          return (
            <div
              key={index}
              className={cn(
                "flex-1 rounded-t transition-all",
                value >= sensor.alarmThreshold
                  ? "bg-status-fault"
                  : isNearAlarm
                    ? "bg-status-warning"
                    : "bg-status-running"
              )}
              style={{ height: `${Math.max(height, 5)}%` }}
            />
          );
        })}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-surface-1 rounded p-2">
          <div className="text-text-muted">Min</div>
          <div className="font-mono font-semibold">{sensor.min.toFixed(1)}</div>
        </div>
        <div className="bg-surface-1 rounded p-2">
          <div className="text-text-muted">Avg</div>
          <div className="font-mono font-semibold">{sensor.avg.toFixed(1)}</div>
        </div>
        <div className="bg-surface-1 rounded p-2">
          <div className="text-text-muted">Max</div>
          <div className="font-mono font-semibold">{sensor.max.toFixed(1)}</div>
        </div>
      </div>

      {/* Alarm threshold */}
      <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
        <AlertTriangle
          className={cn(
            "w-4 h-4",
            isNearAlarm && "text-status-fault animate-blink-fast"
          )}
        />
        <span>Alarm at: {sensor.alarmThreshold} {sensor.unit}</span>
      </div>
    </BaseDeviceCard>
  );
}
