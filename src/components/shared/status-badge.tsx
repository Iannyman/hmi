"use client";

import type { StatusType, StatusSize } from "@/types/ui.types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: StatusType;
  size?: StatusSize;
  label?: string;
  showDot?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: "text-[10px] px-2.5 py-1 rounded-lg",
  md: "text-[11px] px-3 py-1.5 rounded-lg",
  lg: "text-[12px] px-4 py-2 rounded-xl",
};

const statusStyles = {
  running: "bg-gradient-to-r from-[hsl(var(--status-running))] to-green-600 text-white shadow-lg shadow-green-500/20",
  ready: "bg-gradient-to-r from-[hsl(var(--status-running))] to-green-600 text-white shadow-lg shadow-green-500/20",
  stopped: "bg-gradient-to-r from-[hsl(var(--status-stopped))] to-gray-600 text-white",
  error: "bg-gradient-to-r from-[hsl(var(--status-fault))] to-red-600 text-white shadow-lg shadow-red-500/20 animate-pulse-glow",
  warning: "bg-gradient-to-r from-[hsl(var(--status-warning))] to-yellow-600 text-white shadow-lg shadow-yellow-500/20",
  manual: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20",
  auto: "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/20",
  initialize: "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20",
};

export function StatusBadge({
  status,
  size = "md",
  label,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const displayLabel = label || status.toUpperCase();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider transition-all duration-200",
        sizeStyles[size],
        statusStyles[status] || statusStyles.stopped,
        className
      )}
    >
      {showDot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full",
          status === "running" || status === "manual" || status === "auto" ? "bg-white/90 animate-pulse" : "bg-white/80"
        )} />
      )}
      {displayLabel}
    </div>
  );
}
