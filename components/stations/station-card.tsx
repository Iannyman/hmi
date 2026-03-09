"use client";

import { Station, StationMode } from "@/types/station.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Factory, CheckCircle, Play, Hand, RotateCcw, AlertTriangle, Activity, HomeIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { setStationMode } from "@/actions/station-actions";
import { StationStatus } from "@/types";

interface StationCardProps {
  station: Station;
}

const statusColors: Record<StationStatus, { bg: string; text: string; border: string }> = {
  auto: {
    bg: "bg-gradient-to-br from-[hsl(var(--status-running))]/20 to-[hsl(var(--status-running))]/10",
    text: "text-[hsl(var(--status-running))]",
    border: "border-[hsl(var(--status-running))]/30"
  },
  setup: {
    bg: "bg-gradient-to-br from-[hsl(var(--status-warning))]/20 to-[hsl(var(--status-warning))]/10",
    text: "text-[hsl(var(--status-warning))]",
    border: "border-[hsl(var(--status-warning))]/30"
  },
  error: {
    bg: "bg-gradient-to-br from-[hsl(var(--status-fault))]/20 to-[hsl(var(--status-fault))]/10",
    text: "text-[hsl(var(--status-fault))]",
    border: "border-[hsl(var(--status-fault))]/30"
  },
  warning: {
    bg: "bg-gradient-to-br from-[hsl(var(--status-warning))]/20 to-[hsl(var(--status-warning))]/10",
    text: "text-[hsl(var(--status-warning))]",
    border: "border-[hsl(var(--status-warning))]/30"
  },  
  init: {
    bg: "bg-gradient-to-br from-[hsl(var(--status-warning))]/20 to-[hsl(var(--status-warning))]/10",
    text: "text-[hsl(var(--status-warning))]",
    border: "border-[hsl(var(--status-warning))]/30"
  },
  home: {
    bg: "bg-gradient-to-br from-[hsl(var(--status-running))]/20 to-[hsl(var(--status-running))]/10",
    text: "text-[hsl(var(--status-running))]",
    border: "border-[hsl(var(--status-running))]/30"
  }
};

export function StationCard({ station }: StationCardProps) {
  const [loadingAction, setLoadingAction] = useState<"auto" | "setup" | "init" | null>(null);

  const handleModeChange = async (mode: StationMode) => {
    // Only set loading state for button modes (not error mode)
    if (mode === "auto" || mode === "setup" || mode === "init") {
      setLoadingAction(mode);
    }
    try {
      const result = await setStationMode(station.id, mode);
      if (!result.success) {
        console.error(`Failed to set station mode:`, result.error);
      }
    } catch (err) {
      console.error(`Failed to set station mode:`, err);
    } finally {
      setTimeout(() => setLoadingAction(null), 500);
    }
  };
  // Ensure values are numbers and limit to 2 decimal places
  const nokPercentage = station.totalParts > 0
    ? (Number(station.partNok) / Number(station.totalParts) * 100).toFixed(2)
    : "0.00";
  const efficiency = Number(station.efficiency).toFixed(2);

  const getStatusIcon = (status: StationStatus) => {
    switch (status) {
      case "auto":
        return <Play className="w-4 h-4" />;
      case "setup":
        return <Hand className="w-4 h-4" />;
      case "error":
        return <AlertTriangle className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "init":
        return <HomeIcon className="w-4 h-4" />;
      case "home":
        return <HomeIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: StationStatus) => {
    switch (status) {
      case "auto":
        return "bg-[hsl(var(--status-running))] text-white";
      case "setup":
        return "bg-[hsl(var(--status-warning))] text-white";
      case "error":
        return "bg-[hsl(var(--status-fault))] text-white ";
      case "warning":
        return "bg-[hsl(var(--status-warning))] text-white";
      case "init":
        return "bg-[hsl(var(--status-warning))] text-white";
      case "home":
        return "bg-[hsl(var(--status-running))] text-white";
    }
  };

  const getCardAnimation = (status: StationStatus) => {
    switch (status) {
      // case "auto":
      //   return "card-running-glow";
      case "error":
        return "card-error-glow";
      default:
        return "";
    }
  };

  const stationName = station.name.replace(/_/g, ' ');
  const cardAnimation = getCardAnimation(station.status);
  const colors = statusColors[station.status] || statusColors.auto;

  return (
    <Link
      href={`/devices?station=${station.id}`}
      className={cn("card card-hover p-6 group cursor-pointer station-card-container", cardAnimation)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform duration-300", colors.bg, colors.border)}>
            <Factory className={cn("w-6 h-6", colors.text)} strokeWidth={2} />
          </div>
          <div>
            <h3 className={cn("text-lg font-bold group-hover:text-[hsl(var(--accent))] transition-colors", station.status === "error" ? colors.text : "text-[hsl(var(--text))]")}>{stationName}</h3>
            <p className="text-sm text-[hsl(var(--text-muted))]">{station.location}</p>
          </div>
        </div>
        <div className={cn("px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0", getStatusColor(station.status))}>
          {getStatusIcon(station.status)}
          <span className="mode-text">{station.status}</span>
        </div>
      </div>

      {/* Status + Efficiency */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--status-running))]" />
          <span className="text-xs text-[hsl(var(--text-muted))]">Scrap Rate</span>
          <span className="text-sm font-bold font-mono text-gradient-accent">{efficiency}%</span>
        </div>
      </div>

      {/* Part Counts */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-[hsl(var(--surface))] rounded-lg p-2 text-center">
          <div className="text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider mb-0.5">OK</div>
          <div className="text-xl font-bold font-mono text-[hsl(var(--status-running))]">{station.partOk.toLocaleString()}</div>
        </div>
        <div className="bg-[hsl(var(--surface))] rounded-lg p-2 text-center">
          <div className="text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider mb-0.5">NOK</div>
          <div className="text-xl font-bold font-mono text-[hsl(var(--status-fault))]">{station.partNok.toLocaleString()}</div>
        </div>
        <div className="bg-[hsl(var(--surface))] rounded-lg p-2 text-center">
          <div className="text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider mb-0.5">Total</div>
          <div className="text-xl font-bold font-mono text-[hsl(var(--text-primary))]">{station.totalParts.toLocaleString()}</div>
        </div>
        <div className="bg-[hsl(var(--surface))] rounded-lg p-2 text-center">
          <div className="text-[10px] text-[hsl(var(--text-dim))] uppercase tracking-wider mb-0.5">NOK %</div>
          <div className="text-xl font-bold font-mono text-[hsl(var(--status-warning))]">{nokPercentage}%</div>
        </div>
      </div>

      {/* Current Action */}
      {station.message && (
        <div className="flex items-center gap-2 mb-4 bg-[hsl(var(--surface))] rounded-lg px-3 py-2">
          <Activity className="w-4 h-4 text-[hsl(var(--accent))]" />
          <span className="text-sm text-[hsl(var(--text-muted))] truncate font-medium">{station.message}</span>
        </div>
      )}

      {/* Mode Buttons */}
      <div className="flex gap-2">
        <Button
          size="default"
          variant={station.mode === "auto" ? "success" : "outline"}
          disabled={!!loadingAction}
          className="flex-1 min-w-0 font-semibold transition-all duration-200 text-sm button-container px-4 py-6 h-auto
            border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--border-accent))] hover:bg-[hsl(var(--surface-hover))]"
          onClick={(e) => {
            e.preventDefault();
            handleModeChange("auto");
          }}
        >
          {loadingAction === "auto" ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Play className="w-5 h-5 mr-2" />
          )}
          Auto
        </Button>
        <Button
          size="default"
          variant={"outline"}
          disabled={!!loadingAction}
          className="flex-1 min-w-0 font-semibold transition-all duration-200 text-sm button-container px-4 py-6 h-auto
            border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--border-accent))] hover:bg-[hsl(var(--surface-hover))]"
          onClick={(e) => {
            e.preventDefault();
            handleModeChange("init");
          }}
        >
          {loadingAction === "init" ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <RotateCcw className="w-5 h-5 mr-2" />
          )}
          Init
        </Button>
        <Button
          size="default"
          variant={station.mode === "setup" ? "default" : "outline"}
          disabled={!!loadingAction}
          className="flex-1 min-w-0 font-semibold transition-all duration-200 text-sm button-container px-4 py-6 h-auto
            border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--border-accent))] hover:bg-[hsl(var(--surface-hover))]"
          onClick={(e) => {
            e.preventDefault();
            handleModeChange("setup");
          }}
        >
          {loadingAction === "setup" ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Hand className="w-5 h-5 mr-2" />
          )}
          Setup
        </Button>
      </div>
    </Link>
  );
}
