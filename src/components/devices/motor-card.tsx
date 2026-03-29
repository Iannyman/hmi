"use client";

import { BaseDeviceCard } from "./base-device-card";
import { ValueDisplay } from "@/components/shared/value-display";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Button } from "@/components/ui/button";
import { Activity, Play, Pause } from "lucide-react";
import { DeviceDTO } from "@/types/device.dto";

interface MotorCardProps {
  motor: Extract<DeviceDTO, { type: "motor" }>;
  onClick?: () => void;
}

export function MotorCard({ motor, onClick }: MotorCardProps) {
  return (
    <BaseDeviceCard
      id={motor.id}
      name={motor.name}
      type="motor"
      status={motor.status}
      location={motor.stationId}
      onClick={onClick}
    >

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
        <ValueDisplay
          label="Speed"
          value={motor.speed}
          unit="RPM"
          trend={motor.speedTrend}
          status={motor.speed > motor.maxSpeed * 0.9 ? "warning" : "normal"}
        />
        <ValueDisplay
          label="Current"
          value={motor.current}
          unit="A"
          status={motor.current > motor.maxCurrent * 0.9 ? "critical" : "normal"}
        />
        <ValueDisplay label="Power" value={motor.power} unit="kW" />
        <ValueDisplay
          label="Temperature"
          value={motor.temperature}
          unit="°C"
          status={
            motor.temperature > 80
              ? "critical"
              : motor.temperature > 60
                ? "warning"
                : "normal"
          }
        />
      </div>

      {/* Load indicator */}
      <div className="mt-3 sm:mt-4 md:mt-5">
        <ProgressBar
          value={motor.load}
          max={100}
          label="Load"
          size="sm"
          color={motor.load > 90 ? "danger" : motor.load > 70 ? "warning" : "default"}
        />
      </div>

      {/* Runtime */}
      <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs text-[hsl(var(--text-dim))] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[hsl(var(--surface))] border border-[hsl(var(--border))]">
        <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--text-muted))]" />
        <span className="truncate">Runtime: {motor.runtime}</span>
      </div>

      {/* Control buttons */}
      <div className="mt-4 sm:mt-5 flex gap-2 sm:gap-3">
        <Button
          size="default"
          variant="success"
          disabled={motor.status === "running"}
          onClick={() => console.log(`Start ${motor.name}`)}
          className="flex-1 text-xs sm:text-sm"
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5" />
          Start
        </Button>
        <Button
          size="default"
          variant="outline"
          disabled={motor.status === "stopped"}
          onClick={() => console.log(`Stop ${motor.name}`)}
          className="flex-1 text-xs sm:text-sm"
        >
          <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
          Stop
        </Button>
      </div>
    </BaseDeviceCard>
  );
}
