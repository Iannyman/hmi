"use client";

import { useState, useRef, useEffect } from "react";
import { BaseDeviceCard } from "./base-device-card";
import { Button } from "@/components/ui/button";
import { Move, Home, SkipForward, SkipBack, AlertTriangle, Gauge, Target, Save, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DeviceDTO } from "@/types/device.dto";
import { jogPositive, jogNegative, startHoming, startPositioning, setPositionIndex } from "@/app/(dashboard)/_actions/drive-actions";
import { StationStatus } from "@/types/station.types";


interface DriveCardProps {
  drive: Extract<DeviceDTO, { type: "drive" }>;
  stationStatus?: StationStatus;
  onClick?: () => void;
}

export function DriveCard({ drive, stationStatus, onClick }: DriveCardProps) {
  const hasError = !!drive.errorMessage;

  // Refactor station name
  const stationName = drive.stationId.replace(/_/g, ' ');

  // Disable cylinder controls when station is in automatic mode
  const isStationAuto = stationStatus === "auto";

  // Local state for position index input with debouncing 
  const [positionIndexValue, setPositionIndexValue] = useState(drive.targetPositionIndex ?? 0);
  const positionIndexDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync position index when drive data changes
  useEffect(() => {
    setPositionIndexValue(drive.targetPositionIndex ?? 0);
  }, [drive.targetPositionIndex]);

  // Debounced handler for position index input
  const handlePositionIndexChange = (newValue: string) => {
    const value = Number(newValue);
    if (isNaN(value)) return;

    // Clamp between 1 and 10000
    const clampedValue = Math.max(1, Math.min(10000, value));
    setPositionIndexValue(clampedValue);

    // Clear previous timeout
    if (positionIndexDebounceRef.current) {
      clearTimeout(positionIndexDebounceRef.current);
    }

    // Set new timeout for debounced write
    positionIndexDebounceRef.current = setTimeout(async () => {
      if (clampedValue >= 0 && drive.stationId) {
        const result = await setPositionIndex(drive.stationId, drive.id, clampedValue);
        if (!result.success) {
          console.error("Failed to set position index:", result.error);
        }
      }
    }, 500); // 500ms debounce
  };

  const handleStartHoming = async (value: boolean) => {
    if (!drive.stationId) return;
    const result = await startHoming(drive.stationId, drive.id, value);
    if (!result.success) console.error("Failed to start homing:", result.error);
  };

  const handleStartPositioning = async (value: boolean) => {
    if (!drive.stationId) return;
    const result = await startPositioning(drive.stationId, drive.id, value);
    if (!result.success) console.error("Failed to start positioning:", result.error);
  };

  const handleJogPositive = async (value: boolean) => {
    if (!drive.stationId) return;
    const result = await jogPositive(drive.stationId, drive.id, value);
    if (!result.success) console.error("Failed to start jog positive:", result.error);
  };

  const handleJogNegative = async (value: boolean) => {
    if (!drive.stationId) return;
    const result = await jogNegative(drive.stationId, drive.id, value);
    if (!result.success) console.error("Failed to start jog negative:", result.error);
  };

  return (
    <BaseDeviceCard
      id={drive.id}
      name={drive.name}
      type="drive"
      status={drive.status}
      location={stationName}
      onClick={onClick}
      className="w-full sm:min-w-[320px]"
      deviceSettingsTitle={`${drive.name} — Position Teaching`}
      deviceSettingsContent={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[hsl(var(--surface))] rounded-xl p-3 text-center border border-[hsl(var(--border))]">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <Gauge className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                <span className="text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider font-semibold">Position</span>
              </div>
              <p className="text-xl font-bold font-mono text-gradient">{drive.actPosition}</p>
              <p className="text-[10px] text-[hsl(var(--text-muted))]">mm</p>
            </div>
            <div className="bg-[hsl(var(--surface))] rounded-xl p-3 text-center border border-[hsl(var(--border))]">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <Target className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                <span className="text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider font-semibold">Index</span>
              </div>
              <p className="text-xl font-bold font-mono text-gradient">{drive.actPositionIndex}</p>
              <p className="text-[10px] text-[hsl(var(--text-muted))]">#</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20">
            <span className="text-xs text-[hsl(var(--text-muted))]">Position teaching — coming soon</span>
          </div>

          <Button
            disabled
            className="w-full bg-gradient-to-r from-[hsl(var(--accent))] to-blue-600 text-white opacity-50 cursor-not-allowed"
          >
            Save Current Position
          </Button>
        </div>
      }
    >
      {/* Current State */}
      <div className="mb-3 sm:mb-4 md:mb-5 p-2 sm:p-3 md:p-4 bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))]">
        <p className="text-[10px] sm:text-xs text-[hsl(var(--text-dim))] uppercase tracking-wider font-semibold mb-2 sm:mb-3">Drive State</p>
        {/* Status indicator */}
        <div className={cn(
          "flex-1 min-w-0 p-2 sm:p-3 rounded-xl border-2 transition-all duration-200",
          drive.axisMoving
            ? "border-[hsl(var(--status-running))] bg-[hsl(var(--status-running))]/10"
            : "border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]"
        )}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Move className={cn(
              "w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0",
              drive.axisMoving
                ? "text-[hsl(var(--status-running))]"
                : "text-[hsl(var(--text-muted))]"
            )} />
            <div className="flex flex-col min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-[hsl(var(--text))] truncate">{drive.axisMoving ? "Moving" : "Stopped"}</p>
              <p className="text-[9px] sm:text-[10px] text-[hsl(var(--text-dim))] truncate">{" ... "}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
        <div className="bg-[hsl(var(--surface))] rounded-xl p-2 sm:p-3 text-center border border-[hsl(var(--border))]">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--text-muted))]" />
            <span className="text-[9px] sm:text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider font-semibold">Position Value</span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-gradient">{drive.actPosition}</p>
          <p className="text-[9px] sm:text-[10px] text-[hsl(var(--text-muted))]">mm</p>
        </div>
        <div className="bg-[hsl(var(--surface))] rounded-xl p-2 sm:p-3 text-center border border-[hsl(var(--border))]">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--text-muted))]" />
            <span className="text-[9px] sm:text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider font-semibold"> Act Position Index</span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-gradient">{drive.actPositionIndex}</p>
          <p className="text-[9px] sm:text-[10px] text-[hsl(var(--text-muted))]">#</p>
        </div>
        <div className="bg-[hsl(var(--surface))] rounded-xl p-2 sm:p-3 text-center border border-[hsl(var(--border))]">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            <Target className={cn(
              "w-3.5 h-3.5 sm:w-4 sm:h-4",
              hasError ? "text-[hsl(var(--status-error))]" : "text-[hsl(var(--text-muted))]"
            )} />
            <span className="text-[9px] sm:text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider font-semibold">Set Position Index</span>
          </div>
          <Input
            value={positionIndexValue}
            onChange={handlePositionIndexChange}
            variant="fault"
            size="sm"
            validation="number"
            min={1}
            max={10000}
            placeholder="#"
          />
          <p className="text-[9px] sm:text-[10px] text-[hsl(var(--text-muted))] mt-1">#</p>
        </div>
      </div>

      {/* Error inidcator*/}
      {hasError && (
        <div className="flex items-center gap-2 mb-4 bg-[hsl(var(--status-error))]/10 rounded-lg px-3 py-2 border border-[hsl(var(--status-error))] shadow-[0_0_12px_rgba(239,68,68,0.25)]">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-error))]" />
          <span className="text-sm text-[hsl(var(--status-error))] truncate font-medium">{drive.errorMessage}</span>
        </div>
      )}

      {/* Control buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="default"
          variant="outline"
          disabled={isStationAuto}
          onMouseDown={() => handleStartHoming(true)}
          onMouseUp={() => handleStartHoming(false)}
          onMouseLeave={() => handleStartHoming(false)}
          onTouchStart={() => handleStartHoming(true)}
          onTouchEnd={() => handleStartHoming(false)}
          className={cn(
            "flex-1 min-w-0 font-semibold text-xs sm:text-sm button-container px-2 sm:px-3",
            "border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--border-accent))] hover:bg-[hsl(var(--surface-hover))]"
          )}
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
        <Button
          size="default"
          variant="outline"
          disabled={!drive.enPositioning || isStationAuto}
          onMouseDown={() => handleStartPositioning(true)}
          onMouseUp={() => handleStartPositioning(false)}
          onMouseLeave={() => handleStartPositioning(false)}
          onTouchStart={() => handleStartPositioning(true)}
          onTouchEnd={() => handleStartPositioning(false)}
          className={cn(
            "flex-1 min-w-0 font-semibold text-xs sm:text-sm button-container px-2 sm:px-3",
            "border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--border-accent))] hover:bg-[hsl(var(--surface-hover))]"
          )}
        >
          <Move className="w-4 h-4" />
          Position
        </Button>
        <Button
          size="default"
          variant="outline"
          disabled={!drive.enForward || isStationAuto}
          onMouseDown={() => handleJogPositive(true)}
          onMouseUp={() => handleJogPositive(false)}
          onMouseLeave={() => handleJogPositive(false)}
          onTouchStart={() => handleJogPositive(true)}
          onTouchEnd={() => handleJogPositive(false)}
          className={cn(
            "flex-1 min-w-0 font-semibold text-xs sm:text-sm button-container px-2 sm:px-3",
            "border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--border-accent))] hover:bg-[hsl(var(--surface-hover))]"
          )}
        >
          <SkipForward className="w-4 h-4" />
          Jog+
        </Button>
        <Button
          size="default"
          variant="outline"
          disabled={!drive.enBackward || isStationAuto}
          onMouseDown={() => handleJogNegative(true)}
          onMouseUp={() => handleJogNegative(false)}
          onMouseLeave={() => handleJogNegative(false)}
          onTouchStart={() => handleJogNegative(true)}
          onTouchEnd={() => handleJogNegative(false)}
          className={cn(
            "flex-1 min-w-0 font-semibold text-xs sm:text-sm button-container px-2 sm:px-3",
            "border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--border-accent))] hover:bg-[hsl(var(--surface-hover))]"
          )}
        >
          <SkipBack className="w-4 h-4" />
          Jog-
        </Button>
      </div>
    </BaseDeviceCard>
  );
}
