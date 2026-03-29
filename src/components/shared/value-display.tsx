"use client";

import { cn } from "@/lib/utils";
import type { ValueTrend, ValueStatus } from "@/types/ui.types";

interface ValueDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: ValueTrend;
  status?: ValueStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ValueDisplay({
  label,
  value,
  unit,
  trend,
  status = "normal",
  size = "md",
  className,
}: ValueDisplayProps) {
  const sizeClasses = {
    sm: "text-sm sm:text-base",
    md: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl md:text-2xl",
  };

  const statusStyles = {
    normal: "text-[hsl(var(--text))]",
    warning: "text-[hsl(var(--status-warning))] glow-yellow",
    critical: "text-[hsl(var(--status-fault))] glow-red",
  };

  const trendStyles = {
    up: "text-[hsl(var(--status-running))] bg-[hsl(var(--status-running))]/10",
    down: "text-[hsl(var(--status-fault))] bg-[hsl(var(--status-fault))]/10",
    neutral: "text-[hsl(var(--text-muted))] bg-[hsl(var(--surface))]",
  };

  return (
    <div className={cn("flex flex-col gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] hover:border-[hsl(var(--border-accent))] transition-all duration-200", className)}>
      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[hsl(var(--text-dim))] font-semibold">{label}</span>
      <div className="flex items-baseline gap-1.5 sm:gap-2">
        <span className={cn(
          "font-mono font-bold tabular-nums",
          sizeClasses[size],
          statusStyles[status]
        )}>
          {value}
        </span>
        {unit && (
          <span className="text-xs sm:text-sm text-[hsl(var(--text-muted))]">{unit}</span>
        )}
        {trend && (
          <span className={cn("text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 rounded-md font-bold", trendStyles[trend])}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>
    </div>
  );
}
