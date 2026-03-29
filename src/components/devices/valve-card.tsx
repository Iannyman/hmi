"use client";

import { BaseDeviceCard } from "./base-device-card";
import { ValueDisplay } from "@/components/shared/value-display";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Button } from "@/components/ui/button";
import { History, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeviceDTO } from "@/types/device.dto";

interface ValveCardProps {
  valve: Extract<DeviceDTO, { type: "valve" }>;
  onClick?: () => void;
}

export function ValveCard({ valve, onClick }: ValveCardProps) {
  const isOpen = valve.position === "open";
  const isPartial = valve.position === "partial";

  return (
    <BaseDeviceCard
      id={valve.id}
      name={valve.name}
      type="valve"
      status={valve.status}
      location={valve.stationId}
      onClick={onClick}
      className="w-full sm:min-w-[320px]"
    >
      {/* Position indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">Position</span>
          <span
            className={cn(
              "text-sm font-semibold",
              isOpen
                ? "text-status-running"
                : isPartial
                  ? "text-status-warning"
                  : "text-status-stopped"
            )}
          >
            {valve.position.toUpperCase()}
          </span>
        </div>
        <ProgressBar
          value={valve.positionPercent}
          max={100}
          showValue={false}
          size="md"
          color={
            isOpen
              ? "success"
              : isPartial
                ? "warning"
                : "default"
          }
        />
        <div className="text-right mt-1">
          <span className="text-xs text-text-muted font-mono tabular-nums">
            {valve.positionPercent}%
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <ValueDisplay label="Pressure" value={valve.pressure} unit="bar" />
        <ValueDisplay label="Flow Rate" value={valve.flowRate} unit="L/min" />
      </div>

      {/* Actuator status */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-text-muted">Actuator:</span>
        <span
          className={cn(
            "font-medium",
            valve.actuatorStatus === "active" ? "text-status-running" : "text-status-stopped"
          )}
        >
          {valve.actuatorStatus.charAt(0).toUpperCase() + valve.actuatorStatus.slice(1)}
        </span>
      </div>

      {/* Last cycle */}
      <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
        <History className="w-4 h-4" />
        <span>Last cycle: {valve.lastCycle}</span>
      </div>

      {/* Control buttons */}
      <div className="mt-4 flex gap-2">
        <Button
          size="default"
          variant="success"
          disabled={isOpen}
          onClick={() => console.log(`Open ${valve.name}`)}
          className="flex-1"
        >
          <Play className="w-4 h-4" />
          Open
        </Button>
        <Button
          size="default"
          variant="outline"
          disabled={!isOpen}
          onClick={() => console.log(`Close ${valve.name}`)}
          className="flex-1"
        >
          <Pause className="w-4 h-4" />
          Close
        </Button>
      </div>
    </BaseDeviceCard>
  );
}
