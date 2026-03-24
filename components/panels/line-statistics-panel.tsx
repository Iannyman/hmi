"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw, Package, CheckCircle, XCircle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHMIManager } from "@/hooks/use-hmi-manager";
import { resetStatistics } from "@/actions/line-actions";

interface LineStatisticsPanelProps {
  className?: string;
}

export function LineStatisticsPanel({ className }: LineStatisticsPanelProps) {
  const { line, isInitialized } = useHMIManager();

  // Get statistics from line data or use defaults
  const partsOk = line?.partsOK ?? 0;
  const partsNok = line?.partsNOK ?? 0;
  const totalParts = line?.totalParts ?? partsOk + partsNok;
  // Ensure scrapRate is a number and limit to 2 decimal places
  const scrapRate = Number(line?.scrapRate ?? 0);

  const stats = [
    {
      label: "Parts OK",
      value: partsOk.toLocaleString(),
      icon: CheckCircle,
      color: "text-[hsl(var(--status-running))]",
      bgColor: "bg-[hsl(var(--status-running))]/10",
    },
    {
      label: "Parts NOK",
      value: partsNok.toLocaleString(),
      icon: XCircle,
      color: "text-[hsl(var(--status-fault))]",
      bgColor: "bg-[hsl(var(--status-fault))]/10",
    },
    {
      label: "Total Parts",
      value: totalParts.toLocaleString(),
      icon: Package,
      color: "text-[hsl(var(--text-primary))]",
      bgColor: "bg-[hsl(var(--surface-elevated))]",
    },
    {
      label: "Scrap Rate",
      value: `${scrapRate.toFixed(2)}%`,
      icon: TrendingDown,
      color: scrapRate > 5 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--text-primary))]",
      bgColor: scrapRate > 5 ? "bg-[hsl(var(--status-warning))]/10" : "bg-[hsl(var(--surface-elevated))]",
    },
  ];

  const handleResetStatistics = async (value: boolean) => {
    try {
      const result = await resetStatistics(value);
      if (!result.success) {
        console.error("Failed to set reset statistics:", result.error);
      }
    } catch (err) {
      console.error("Failed to set reset statistics:", err);
    }
  };

  return (
    <div className={cn("card p-4", className)}>
      <div className="flex items-center gap-6">
        {/* Statistics */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-md", stat.bgColor)}>
                  <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.color)} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[hsl(var(--text-dim))]">
                    {stat.label}
                  </span>
                  <span className={cn("text-sm sm:text-base font-semibold", stat.color)}>
                    {stat.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reset Button */}
        <div className="ml-auto">
          <Button
            size="default"
            variant="outline"
            onMouseDown={() => handleResetStatistics(true)}
            onMouseUp={() => handleResetStatistics(false)}
            onMouseLeave={() => handleResetStatistics(false)}
            onTouchStart={() => handleResetStatistics(true)}
            onTouchEnd={() => handleResetStatistics(false)}
            disabled={!isInitialized}
            className="gap-2"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
