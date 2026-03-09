"use client";

import { BaseDeviceCard } from "./base-device-card";
import { ValueDisplay } from "@/components/shared/value-display";
import { Button } from "@/components/ui/button";
import { AlertCircle, Zap, Gauge, Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeviceDTO } from "@/types/device.dto";

interface DriveCardProps {
  drive: Extract<DeviceDTO, { type: "drive" }>;
  onClick?: () => void;
}

export function DriveCard({ drive, onClick }: DriveCardProps) {
  const hasFault = !!drive.faultCode;

  return (
    <BaseDeviceCard
      id={drive.id}
      name={drive.name}
      type="drive"
      status={drive.status}
      location={drive.stationId}
      onClick={onClick}
      className="w-full sm:min-w-[320px]"
    >
      {/* Fault indicator */}
      {hasFault && (
        <div className="mb-3 p-2 bg-status-fault/10 border border-status-fault/30 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-status-fault animate-blink-fast" />
          <div>
            <div className="text-sm font-semibold text-status-fault">Fault Active</div>
            <div className="text-xs text-text-muted">Code: {drive.faultCode}</div>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <ValueDisplay label="Frequency" value={drive.frequency} unit="Hz" />
        <ValueDisplay label="Torque" value={drive.torque} unit="%" />
      </div>

      {/* Power metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-surface-1 rounded p-2 text-center">
          <Zap className="w-4 h-4 mx-auto text-text-muted mb-1" />
          <div className="text-xs text-text-muted">Voltage</div>
          <div className="text-sm font-mono font-semibold">{drive.voltage}V</div>
        </div>
        <div className="bg-surface-1 rounded p-2 text-center">
          <Zap className="w-4 h-4 mx-auto text-text-muted mb-1" />
          <div className="text-xs text-text-muted">Current</div>
          <div className="text-sm font-mono font-semibold">{drive.current}A</div>
        </div>
        <div className="bg-surface-1 rounded p-2 text-center">
          <Gauge className="w-4 h-4 mx-auto text-text-muted mb-1" />
          <div className="text-xs text-text-muted">PF</div>
          <div className="text-sm font-mono font-semibold">{drive.powerFactor}</div>
        </div>
      </div>

      {/* Fault history */}
      {drive.faultHistory && drive.faultHistory.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-text-muted mb-1">Recent Faults</div>
          <div className="space-y-1">
            {drive.faultHistory.slice(0, 2).map((fault, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs bg-surface-1 rounded px-2 py-1"
              >
                <span className="font-mono text-status-fault">{fault.code}</span>
                <span className="text-text-muted">{fault.timestamp.split(" ")[1]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-2">
        <Button
          size="default"
          variant="success"
          disabled={drive.status === "running" || hasFault}
          onClick={() => console.log(`Start ${drive.name}`)}
          className="flex-1"
        >
          <Play className="w-4 h-4" />
          Start
        </Button>
        <Button
          size="default"
          variant="outline"
          disabled={drive.status === "stopped"}
          onClick={() => console.log(`Stop ${drive.name}`)}
          className="flex-1"
        >
          <Pause className="w-4 h-4" />
          Stop
        </Button>
        <Button
          size="default"
          variant="outline"
          disabled={!hasFault}
          onClick={() => console.log(`Reset ${drive.name}`)}
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>
    </BaseDeviceCard>
  );
}
