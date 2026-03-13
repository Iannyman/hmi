"use client";

import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, Play, Pause, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useHMIManager } from "@/hooks/use-hmi-manager";
import { LineStatus } from "@/types/domain.types";
import { setLineMode } from "@/actions/line-actions";

interface LineControlPanelProps {
  className?: string;
}

// Minimum duration for button loading animation (ms)
const MIN_LOADING_DURATION = 600;

export function LineControlPanel({ className }: LineControlPanelProps) {
  const { line, isInitialized } = useHMIManager();
  const [loadingAction, setLoadingAction] = useState<"start" | "stop" | "init" | null>(null);

  // Get line status - use real data or default to stopped
  const lineStatus: LineStatus = line?.status as LineStatus ?? "stopped";

  const handleAction = async (action: "start" | "stop" | "init", mode: "auto" | "setup" | "init") => {
    setLoadingAction(action);
    const startTime = Date.now();

    try {
      const result = await setLineMode(mode);
      if (!result.success) {
        console.error(`Failed to ${action} line:`, result.error);
      }
    } catch (err) {
      console.error(`Failed to ${action} line:`, err);
    } finally {
      // Ensure minimum loading duration for smooth animation
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_DURATION - elapsed);
      setTimeout(() => setLoadingAction(null), remainingTime);
    }
  };

  const handleStart = () => handleAction("start", "auto");
  const handleStop = () => handleAction("stop", "setup");
  const handleInit = () => handleAction("init", "init");

  const getStatusConfig = () => {
    switch (lineStatus) {
      case "auto":
        return {
          text: "Auto",
          color: "text-[hsl(var(--status-running))]",
          bgColor: "bg-[hsl(var(--status-running))]/10",
          borderColor: "border-[hsl(var(--status-running))]/30",
          icon: PlayCircle,
        };
      case "setup":
        return {
          text: "Setup",
          color: "text-[hsl(var(--text-muted))]",
          bgColor: "bg-[hsl(var(--surface))]",
          borderColor: "border-[hsl(var(--border))]",
          icon: PauseCircle,
        };
      case "error":
        return {
          text: "Fault",
          color: "text-[hsl(var(--status-fault))]",
          bgColor: "bg-[hsl(var(--status-fault))]/10",
          borderColor: "border-[hsl(var(--status-fault))]/30",
          icon: PauseCircle,
        };
      default:
        return {
          text: "Unknown",
          color: "text-[hsl(var(--text-muted))]",
          bgColor: "bg-[hsl(var(--surface))]",
          borderColor: "border-[hsl(var(--border))]",
          icon: PauseCircle,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className={cn("card p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4", className)}>

      {/* Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
        <Button
          size="default"
          variant="success"
          disabled={lineStatus === "auto" || !!loadingAction || !isInitialized}
          onClick={handleStart}
          className="flex-1 min-w-0 sm:flex-none sm:w-28"
        >
          {loadingAction === "start" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span className="hidden sm:inline ml-1.5">Start</span>
        </Button>
        <Button
          size="default"
          variant="outline"
          disabled={!!loadingAction || !isInitialized}
          onClick={handleInit}
          className="flex-1 min-w-0 sm:flex-none sm:w-28"
        >
          {loadingAction === "init" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          <span className="hidden sm:inline ml-1.5">Init</span>
        </Button>
        <Button
          size="default"
          variant="outline"
          disabled={lineStatus === "setup" || !!loadingAction || !isInitialized}
          onClick={handleStop}
          className="flex-1 min-w-0 sm:flex-none sm:w-28"
        >
          {loadingAction === "stop" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
          <span className="hidden sm:inline ml-1.5">Stop</span>
        </Button>
      </div>
    </div>
  );
}
