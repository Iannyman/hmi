"use client";

import { BaseDeviceCard } from "./base-device-card";
import { ValueDisplay } from "@/components/shared/value-display";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Package, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeviceDTO } from "@/types/device.dto";

interface ConveyorCardProps {
  conveyor: Extract<DeviceDTO, { type: "conveyor" }>;
  onClick?: () => void;
}

export function ConveyorCard({ conveyor, onClick }: ConveyorCardProps) {
  return (
    <BaseDeviceCard
      id={conveyor.id}
      name={conveyor.name}
      type="conveyor"
      status={conveyor.status}
      location={conveyor.stationId}
      onClick={onClick}
      className="w-full sm:min-w-[320px]"
    >
      {/* Direction indicator */}
      <div className="flex items-center justify-center mb-4">
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg",
            conveyor.status === "running" ? "bg-status-running/10" : "bg-surface-1"
          )}
        >
          {conveyor.direction === "forward" ? (
            <ArrowRight className={cn("w-6 h-6", conveyor.status === "running" && "text-status-running")} />
          ) : conveyor.direction === "reverse" ? (
            <ArrowLeft className={cn("w-6 h-6", conveyor.status === "running" && "text-status-running")} />
          ) : (
            <span className="text-text-muted text-sm">Stopped</span>
          )}
          <span className="text-sm font-medium">
            {conveyor.direction === "forward"
              ? "Forward"
              : conveyor.direction === "reverse"
                ? "Reverse"
                : "Stopped"}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <ValueDisplay label="Speed" value={conveyor.speed} unit="m/s" />
        <ValueDisplay label="Length" value={conveyor.length} unit="m" />
      </div>

      {/* Load indicator */}
      <div className="mb-3">
        <ProgressBar
          value={conveyor.loadPercentage}
          max={100}
          label="Load"
          size="md"
          color={
            conveyor.loadPercentage > 90
              ? "danger"
              : conveyor.loadPercentage > 70
                ? "warning"
                : "default"
          }
        />
      </div>

      {/* Material count */}
      <div className="flex items-center justify-between p-3 bg-surface-1 rounded mb-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-text-muted" />
          <span className="text-sm text-text-muted">Materials</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-mono font-semibold">
            {conveyor.materialCount}
          </div>
          <div className="text-xs text-text-muted">/ {conveyor.capacity}</div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-2">
        <Button
          size="default"
          variant="success"
          disabled={conveyor.status === "running"}
          onClick={() => console.log(`Start ${conveyor.name}`)}
          className="flex-1"
        >
          <Play className="w-4 h-4" />
          Start
        </Button>
        <Button
          size="default"
          variant="outline"
          disabled={conveyor.status === "stopped"}
          onClick={() => console.log(`Stop ${conveyor.name}`)}
          className="flex-1"
        >
          <Pause className="w-4 h-4" />
          Stop
        </Button>
      </div>
    </BaseDeviceCard>
  );
}
