"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ProgressColor } from "@/types/ui.types";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: ProgressColor;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = "md",
  color = "default",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-2.5",
    md: "h-3",
    lg: "h-4",
  };

  const colorClasses: Record<ProgressColor, { bg: string; shadow: string }> = {
    default: { 
      bg: "bg-gradient-to-r from-[hsl(var(--text-muted))] to-[hsl(var(--text-dim))]", 
      shadow: "shadow-lg shadow-gray-500/10" 
    },
    success: { 
      bg: "bg-gradient-to-r from-[hsl(var(--status-running))] to-green-600", 
      shadow: "shadow-lg shadow-green-500/20 glow-green" 
    },
    warning: { 
      bg: "bg-gradient-to-r from-[hsl(var(--status-warning))] to-yellow-600", 
      shadow: "shadow-lg shadow-yellow-500/20 glow-yellow" 
    },
    danger: { 
      bg: "bg-gradient-to-r from-[hsl(var(--status-fault))] to-red-600", 
      shadow: "shadow-lg shadow-red-500/20 glow-red" 
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2.5">
          {label && <span className="text-xs uppercase tracking-wider text-[hsl(var(--text-dim))] font-semibold">{label}</span>}
          {showValue && (
            <span className="text-xs font-mono text-[hsl(var(--text))] tabular-nums bg-[hsl(var(--surface))] px-2 py-0.5 rounded-md border border-[hsl(var(--border))]">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className={cn(
        "w-full bg-[hsl(var(--bg-2))] overflow-hidden rounded-full border border-[hsl(var(--border))]",
        sizeClasses[size]
      )}>
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            colors.bg,
            colors.shadow
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {label && showValue && (
        <div className="text-right mt-1.5">
          <span className="text-xs text-[hsl(var(--text-dim))] font-mono tabular-nums">
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
