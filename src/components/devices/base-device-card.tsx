"use client";

import { useState } from "react";
import type { DeviceType, DeviceStatus } from "@/types/device.types";
import { Settings, Battery, Activity, Bot, ArrowRight, LoaderPinwheel, Wrench } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { DeviceLongPressDialog } from "./device-long-press-dialog";

interface BaseDeviceCardProps {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location?: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  deviceSettingsContent?: React.ReactNode;
  deviceSettingsTitle?: string;
}

const deviceIcons: Record<DeviceType, React.ElementType> = {
  motor: Settings,
  sensor: Activity,
  robot: Bot,
  conveyor: ArrowRight,
  drive: LoaderPinwheel,
  cylinder: Battery
};

const statusColors: Record<DeviceStatus, { bg: string; text: string; glow: string }> = {
  running: {
    bg: "bg-gradient-to-br from-[hsl(var(--status-running))]/20 to-[hsl(var(--status-running))]/10",
    text: "text-[hsl(var(--status-running))]",
    glow: ""
  },
  stopped: {
    bg: "bg-gradient-to-br from-[hsl(var(--status-stopped))]/20 to-[hsl(var(--status-stopped))]/10",
    text: "text-[hsl(var(--status-stopped))]",
    glow: ""
  },
  error: {
    bg: "bg-gradient-to-br from-[hsl(var(--status-fault))]/20 to-[hsl(var(--status-fault))]/10",
    text: "text-[hsl(var(--status-fault))]",
    glow: ""
  },
  warning: {
    bg: "bg-gradient-to-br from-[hsl(var(--status-warning))]/20 to-[hsl(var(--status-warning))]/10",
    text: "text-[hsl(var(--status-warning))]",
    glow: ""
  },
  manual: {
    bg: "bg-gradient-to-br from-blue-600/20 to-blue-600/10",
    text: "text-blue-500",
    glow: ""
  },
  auto: {
    bg: "bg-gradient-to-br from-cyan-600/20 to-cyan-600/10",
    text: "text-cyan-500",
    glow: ""
  },
};

const getDeviceCardAnimation = (status: DeviceStatus) => {
  switch (status) {
    case "error":
      return "card-error-glow";
    default:
      return "";
  }
};

export function BaseDeviceCard({
  name,
  type,
  status,
  location,
  children,
  onClick,
  className,
  deviceSettingsContent,
  deviceSettingsTitle,
}: BaseDeviceCardProps) {
  const DeviceIcon = deviceIcons[type];
  const colors = statusColors[status] || statusColors.stopped;
  const cardAnimation = getDeviceCardAnimation(status);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  return (
    <>
    <div
      onClick={onClick}
      className={cn(
        "card card-hover p-3 sm:p-4 md:p-5 pb-4 sm:pb-5 md:pb-6 cursor-pointer group",
        cardAnimation,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4 md:mb-5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className={cn("p-2 sm:p-2.5 rounded-xl border border-[hsl(var(--border))] flex-shrink-0", colors.bg, colors.glow)}>
            <DeviceIcon className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5", colors.text)} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn("font-semibold text-xs sm:text-sm group-hover:text-[hsl(var(--accent))] transition-colors truncate", status === "error" ? colors.text : "text-[hsl(var(--text))]")}>{name}</h3>
            {location && (
              <p className="text-xs text-[hsl(var(--text-dim))] mt-0.5 truncate">{location}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {deviceSettingsContent && (
            <button
              onClick={openDialog}
              className="p-1.5 rounded-lg text-[hsl(var(--text-muted))] hover:text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/10 transition-all duration-200"
            >
              <Wrench className="w-3.5 h-3.5" />
            </button>
          )}
          <StatusBadge status={status} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>

    {deviceSettingsContent && (
      <DeviceLongPressDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={deviceSettingsTitle ?? name}
      >
        {deviceSettingsContent}
      </DeviceLongPressDialog>
    )}
    </>
  );
}
