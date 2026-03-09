"use client";

import { BaseDeviceCard } from "./base-device-card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Clock, Code, Play, Pause, RotateCcw } from "lucide-react";
import { DeviceDTO } from "@/types/device.dto";

interface RobotCardProps {
  robot: Extract<DeviceDTO, { type: "robot" }>;
  onClick?: () => void;
}

export function RobotCard({ robot, onClick }: RobotCardProps) {
  const progressPercent = (robot.cycle / robot.totalCycles) * 100;

  return (
    <BaseDeviceCard
      id={robot.id}
      name={robot.name}
      type="robot"
      status={robot.status}
      location={robot.stationId}
      onClick={onClick}
      className="w-full sm:min-w-[320px]"
    >
      {/* Status and mode */}
      <div className="flex items-center justify-between mb-3">
        <StatusBadge status={robot.status} size="md" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Mode:</span>
          <StatusBadge
            status={robot.mode}
            size="sm"
            label={robot.mode.toUpperCase()}
          />
        </div>
      </div>

      {/* Program info */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-surface-1 rounded">
        <Code className="w-4 h-4 text-text-muted" />
        <span className="text-sm font-medium">{robot.programNumber}</span>
        <span className="text-sm text-text-muted">•</span>
        <span className="text-sm">{robot.program}</span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <ProgressBar
          value={robot.cycle}
          max={robot.totalCycles}
          label="Progress"
          size="md"
          color="success"
        />
      </div>

      {/* Cycle info */}
      <div className="flex items-center justify-between text-sm mb-3">
        <div>
          <span className="text-text-muted">Cycle: </span>
          <span className="font-mono font-semibold">
            {robot.cycle} / {robot.totalCycles}
          </span>
        </div>
        <div className="flex items-center gap-1 text-text-muted">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{robot.timeRemaining}</span>
        </div>
      </div>

      {/* Axis positions */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="bg-surface-1 rounded p-2 text-center">
          <div className="text-text-muted">X</div>
          <div className="font-mono font-semibold">{robot.axisPositions.x}</div>
        </div>
        <div className="bg-surface-1 rounded p-2 text-center">
          <div className="text-text-muted">Y</div>
          <div className="font-mono font-semibold">{robot.axisPositions.y}</div>
        </div>
        <div className="bg-surface-1 rounded p-2 text-center">
          <div className="text-text-muted">Z</div>
          <div className="font-mono font-semibold">{robot.axisPositions.z}</div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-2">
        <Button
          size="default"
          variant="success"
          disabled={robot.status === "running"}
          onClick={() => console.log(`Start ${robot.name}`)}
          className="flex-1"
        >
          <Play className="w-4 h-4" />
          Start
        </Button>
        <Button
          size="default"
          variant="outline"
          disabled={robot.status === "stopped"}
          onClick={() => console.log(`Stop ${robot.name}`)}
          className="flex-1"
        >
          <Pause className="w-4 h-4" />
          Stop
        </Button>
        <Button
          size="default"
          variant="outline"
          onClick={() => console.log(`Home ${robot.name}`)}
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>
    </BaseDeviceCard>
  );
}
