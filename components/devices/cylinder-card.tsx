"use client";

import { BaseDeviceCard } from "./base-device-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Gauge, Clock, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { startMoveToWorkPosition, stopMoveToWorkPosition, startMoveToHomePosition, stopMoveToHomePosition, setTimeout as setCylinderTimeout } from "@/actions/cylinder-actions";
import { DeviceDTO } from "@/types/device.dto";

interface CylinderCardProps {
  cylinder: Extract<DeviceDTO, { type: "cylinder" }>;
  // Optional display values
  pressure?: number;
  cycleTime?: number;
  onClick?: () => void;
}

// Helper to extract name from details string (format: "Name/labelHP/labelWP")
const getName = (details: string): string => {
  if (!details) return "Cylinder";
  const parts = details.split('/');
  return parts[0] || "Cylinder";
};

// Helper to extract Home Position label from details string
const getLabelHP = (details: string): string => {
  if (!details) return "Home Position";
  const parts = details.split('/');
  return parts[1] || "Home Position";
};

// Helper to extract Work Position label from details string
const getLabelWP = (details: string): string => {
  if (!details) return "Work Position";
  const parts = details.split('/');
  return parts[2] || "Work Position";
};

export function CylinderCard({ cylinder, pressure = 8, cycleTime = 0, onClick }: CylinderCardProps) {
  // Extract labels from details string
  const name = getName(cylinder.details);
  const labelHP = getLabelHP(cylinder.details);
  const labelWP = getLabelWP(cylinder.details);
  const hasError = Boolean(cylinder.errorMessage);

  // Local state for timeout input with debouncing 
  const [timeoutValue, setTimeoutValue] = useState(cylinder.timeout ?? 0);
  const timeoutDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync timeout when cylinder data changes
  useEffect(() => {
    setTimeoutValue(cylinder.timeout ?? 0);
  }, [cylinder.timeout]);

  // Debounced timeout change handler
  const handleTimeoutChange = (newValue: string) => {
    const value = Number(newValue);
    if (isNaN(value)) return;

    // Clamp between 1 and 10000
    const clampedValue = Math.max(1, Math.min(10000, value));
    setTimeoutValue(clampedValue);

    // Clear previous timeout
    if (timeoutDebounceRef.current) {
      clearTimeout(timeoutDebounceRef.current);
    }

    // Set new timeout for debounced write
    timeoutDebounceRef.current = setTimeout(async () => {
      if (clampedValue >= 0 && cylinder.stationId) {
        const result = await setCylinderTimeout(cylinder.stationId, cylinder.id, clampedValue);
        if (!result.success) {
          console.error("Failed to set timeout:", result.error);
        }
      }
    }, 500); // 500ms debounce
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (timeoutDebounceRef.current) {
        clearTimeout(timeoutDebounceRef.current);
      }
    };
  }, []);

  const handleStartMoveToWork = async () => {
    if (!cylinder.stationId) return;
    const result = await startMoveToWorkPosition(cylinder.stationId, cylinder.id);
    if (!result.success) {
      console.error("Failed to start move to work position:", result.error);
    }
  };

  const handleStopMoveToWork = async () => {
    if (!cylinder.stationId) return;
    const result = await stopMoveToWorkPosition(cylinder.stationId, cylinder.id);
    if (!result.success) {
      console.error("Failed to stop move to work position:", result.error);
    }
  };

  const handleStartMoveToHome = async () => {
    if (!cylinder.stationId) return;
    const result = await startMoveToHomePosition(cylinder.stationId, cylinder.id);
    if (!result.success) {
      console.error("Failed to start move to home position:", result.error);
    }
  };

  const handleStopMoveToHome = async () => {
    if (!cylinder.stationId) return;
    const result = await stopMoveToHomePosition(cylinder.stationId, cylinder.id);
    if (!result.success) {
      console.error("Failed to stop move to home position:", result.error);
    }
  };  

  // Refactor station name
  const stationName = cylinder.stationId.replace(/_/g, ' ');

  return (
    <BaseDeviceCard
      id={cylinder.id}
      name={name}
      type="cylinder"
      status={cylinder.status}
      location={stationName}
      onClick={onClick}
    >
      {/* Current State - Both States Displayed */}
      <div className="mb-3 sm:mb-4 md:mb-5 p-2 sm:p-3 md:p-4 bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))]">
        <p className="text-[10px] sm:text-xs text-[hsl(var(--text-dim))] uppercase tracking-wider font-semibold mb-2 sm:mb-3">Cylinder State</p>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Work Position State */}
          <div className={cn(
            "flex-1 min-w-0 p-2 sm:p-3 rounded-xl border-2 transition-all duration-200",
            cylinder.inWorkPosition
              ? "border-[hsl(var(--status-running))] bg-[hsl(var(--status-running))]/10"
              : "border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]"
          )}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ChevronRight className={cn(
                "w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0",
                cylinder.inWorkPosition
                  ? "text-[hsl(var(--status-running))]"
                  : "text-[hsl(var(--text-muted))]"
              )} />
              <div className="flex flex-col min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-[hsl(var(--text))] truncate">Work Position</p>
                <p className="text-[9px] sm:text-[10px] text-[hsl(var(--text-dim))] truncate">{labelWP}</p>
              </div>
            </div>
          </div>

          {/* Home Position State */}
          <div className={cn(
            "flex-1 min-w-0 p-2 sm:p-3 rounded-xl border-2 transition-all duration-200",
            cylinder.inHomePosition
              ? "border-[hsl(var(--status-running))] bg-[hsl(var(--status-running))]/10"
              : "border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]"
          )}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ChevronLeft className={cn(
                "w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0",
                cylinder.inHomePosition
                  ? "text-[hsl(var(--status-running))]"
                  : "text-[hsl(var(--text-muted))]"
              )} />
              <div className="flex flex-col min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-[hsl(var(--text))] truncate">Home Position</p>
                <p className="text-[9px] sm:text-[10px] text-[hsl(var(--text-dim))] truncate">{labelHP}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
        <div className="bg-[hsl(var(--surface))] rounded-xl p-2 sm:p-3 text-center border border-[hsl(var(--border))]">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--text-muted))]" />
            <span className="text-[9px] sm:text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider font-semibold">Pressure</span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-gradient">{pressure}</p>
          <p className="text-[9px] sm:text-[10px] text-[hsl(var(--text-muted))]">bar</p>
        </div>
        <div className="bg-[hsl(var(--surface))] rounded-xl p-2 sm:p-3 text-center border border-[hsl(var(--border))]">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--text-muted))]" />
            <span className="text-[9px] sm:text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider font-semibold">Last Cycle Time</span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-gradient">{cycleTime}</p>
          <p className="text-[9px] sm:text-[10px] text-[hsl(var(--text-muted))]">sec</p>
        </div>
        <div className="bg-[hsl(var(--surface))] rounded-xl p-2 sm:p-3 text-center border border-[hsl(var(--border))]">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            <AlertTriangle className={cn(
              "w-3.5 h-3.5 sm:w-4 sm:h-4",
              hasError ? "text-[hsl(var(--status-error))]" : "text-[hsl(var(--text-muted))]"
            )} />
            <span className="text-[9px] sm:text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider font-semibold">Timeout Error</span>
          </div>
          <Input
            value={timeoutValue.toString()}
            onChange={handleTimeoutChange}
            variant="fault"
            size="sm"
            validation="number"
            min={1}
            max={10000}
            placeholder="ms"
          />
          <p className="text-[9px] sm:text-[10px] text-[hsl(var(--text-muted))] mt-1">ms</p>
        </div>
      </div>

      {/* Error inidcator*/}
      {hasError && (
        <div className="flex items-center gap-2 mb-4 bg-[hsl(var(--status-error))]/10 rounded-lg px-3 py-2 border border-[hsl(var(--status-error))] shadow-[0_0_12px_rgba(239,68,68,0.25)]">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-error))]" />
          <span className="text-sm text-[hsl(var(--status-error))] truncate font-medium">{cylinder.errorMessage}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2 sm:gap-3">
        <Button
          size="default"
          variant={"outline"}
          className={cn(
            "flex-1 min-w-0 font-semibold text-xs sm:text-sm button-container px-2 sm:px-3",
            "border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--border-accent))] hover:bg-[hsl(var(--surface-hover))]"
          )}
          onMouseDown={handleStartMoveToWork}
          onMouseUp={handleStopMoveToWork}
          onMouseLeave={handleStopMoveToWork}
          onTouchStart={handleStartMoveToWork}
          onTouchEnd={handleStopMoveToWork}
          disabled={!cylinder.enabled || !cylinder.enableWorkPosition}
        >
          {(
            <ChevronRight className="cylinder-button-icon w-4 h-4 sm:w-5 sm:h-5 mr-1 flex-shrink-0" />
          )}
          <span className="whitespace-normal">Work Position</span>
        </Button>
        <Button
          size="default"
          variant={"outline"}
          className={cn(
            "flex-1 min-w-0 font-semibold text-xs sm:text-sm button-container px-2 sm:px-3",
            "border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--border-accent))] hover:bg-[hsl(var(--surface-hover))]"
          )}
          onMouseDown={handleStartMoveToHome}
          onMouseUp={handleStopMoveToHome}
          onMouseLeave={handleStopMoveToHome}
          onTouchStart={handleStartMoveToHome}
          onTouchEnd={handleStopMoveToHome}
          disabled={!cylinder.enabled || !cylinder.enableHomePosition}
        >
          {(
            <ChevronLeft className="cylinder-button-icon w-4 h-4 sm:w-5 sm:h-5 mr-1 flex-shrink-0" />
          )}
          <span className="whitespace-normal">Home Position</span>
        </Button>
      </div>
    </BaseDeviceCard>
  );
}
