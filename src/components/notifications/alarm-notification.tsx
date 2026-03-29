"use client";

import type { Alarm } from "@/types/alarm.types";
import { AlertTriangle, AlertCircle, Info, X, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAlarmNotification } from "@/components/providers/alarm-notification-provider";
import { Button } from "@/components/ui/button";

const AUTO_DISMISS_DURATION = parseInt(process.env.NEXT_PUBLIC_ALARM_AUTO_DISMISS_DURATION || "5000", 10); // 5 seconds

export function AlarmNotification() {
  const { pendingAlarm: alarm, dismissAlarm, acknowledgeAlarm } = useAlarmNotification();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(AUTO_DISMISS_DURATION);
  const animationFrameRef = useRef<number>(0);
  const dismissAlarmRef = useRef(dismissAlarm);
  const isPausedRef = useRef(false);
  const animateRef = useRef<((currentTime: number) => void) | null>(null);

  // Keep dismissAlarm ref updated
  useEffect(() => {
    dismissAlarmRef.current = dismissAlarm;
  }, [dismissAlarm]);

  // Reset and start progress when alarm changes
  useEffect(() => {
    if (alarm && !alarm.acknowledged) {
      setIsAnimating(true);
      setIsVisible(true);
      setProgress(100);
      startTimeRef.current = performance.now();
      remainingTimeRef.current = AUTO_DISMISS_DURATION;
      isPausedRef.current = false;
    } else {
      setIsAnimating(false);
      setProgress(100);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [alarm?.id]);

  const handleClose = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    setIsAnimating(false);
    setTimeout(() => {
      dismissAlarmRef.current();
    }, 300);
  }, []);

  // Animation loop - defined as a stable ref
  animateRef.current = (currentTime: number) => {
    if (isPausedRef.current || !alarm || alarm.acknowledged) {
      return;
    }

    const elapsed = currentTime - startTimeRef.current;
    const remaining = Math.max(0, remainingTimeRef.current - elapsed);
    const newProgress = (remaining / AUTO_DISMISS_DURATION) * 100;

    setProgress(newProgress);

    if (remaining <= 0) {
      cancelAnimationFrame(animationFrameRef.current);
      setIsAnimating(false);
      setTimeout(() => {
        dismissAlarmRef.current();
      }, 300);
    } else {
      animationFrameRef.current = requestAnimationFrame(animateRef.current!);
    }
  };

  // Start animation when alarm arrives
  useEffect(() => {
    if (!alarm || alarm.acknowledged) {
      cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(animateRef.current!);

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [alarm?.id]);

  // Pause progress on hover, resume when leaving
  const handleMouseEnter = () => {
    if (!isPausedRef.current) {
      isPausedRef.current = true;
      // Store remaining time based on current progress
      setProgress((currentProgress) => {
        remainingTimeRef.current = (currentProgress / 100) * AUTO_DISMISS_DURATION;
        return currentProgress;
      });
    }
  };

  const handleMouseLeave = () => {
    if (isPausedRef.current) {
      isPausedRef.current = false;
      // Reset start time and restart animation
      startTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animateRef.current!);
    }
  };

  if (!alarm || !isVisible) return null;

  const getIcon = (severity: Alarm["severity"]) => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    switch (severity) {
      case "critical":
        return <AlertTriangle className={cn(iconClass, "text-[hsl(var(--status-fault))]")} />;
      case "warning":
        return <AlertCircle className={cn(iconClass, "text-[hsl(var(--status-warning))]")} />;
      case "info":
        return <Info className={cn(iconClass, "text-[hsl(var(--text-muted))]")} />;
    }
  };

  const getSeverityClass = (severity: Alarm["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          border: "border-[hsl(var(--status-fault))]",
          bg: "bg-[hsl(var(--status-fault))]/10",
          glow: "glow-red",
        };
      case "warning":
        return {
          border: "border-[hsl(var(--status-warning))]",
          bg: "bg-[hsl(var(--status-warning))]/10",
          glow: "glow-yellow",
        };
      default:
        return {
          border: "border-[hsl(var(--border-accent))]",
          bg: "bg-[hsl(var(--surface))]",
          glow: "",
        };
    }
  };

  const severityStyles = getSeverityClass(alarm.severity);

  const handleAcknowledge = () => {
    acknowledgeAlarm(alarm.id);
    handleClose();
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-[200] w-full max-w-2xl",
        "hidden md:block",
        "transition-all duration-300 ease-out",
        isAnimating ? "animate-slide-in opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          "card",
          severityStyles.border,
          severityStyles.bg,
          severityStyles.glow,
          "shadow-lg",
          "overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <div className="mt-0.5">{getIcon(alarm.severity)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-[hsl(var(--text))] uppercase tracking-wide">
                New Alarm
              </h4>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </div>

        {/* Description */}
        <div className="px-4 pb-3">
          <p className="text-lg font-semibold text-[hsl(var(--text))] mt-1">
            {alarm.title}
          </p>
          <p className="text-sm text-[hsl(var(--text-muted))]">
            {alarm.description}
          </p>
        </div>

        {/* Footer with device info and actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--text-dim))] min-w-0">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-mono">{alarm.timestamp}</span>
            <span className="text-[hsl(var(--border-strong))] flex-shrink-0">•</span>
            <span className="truncate">{alarm.device}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAcknowledge}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Acknowledge
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-black/20 dark:bg-white/10">
          <div
            className={cn(
              "h-full",
              alarm.severity === "critical" && "bg-red-500",
              alarm.severity === "warning" && "bg-amber-500",
              alarm.severity === "info" && "bg-blue-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
