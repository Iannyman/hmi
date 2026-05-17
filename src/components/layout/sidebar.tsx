"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Layers,
  AlertTriangle,
  TrendingUp,
  Settings,
  Database,
} from "lucide-react";
import { getAlarms } from "@/app/(dashboard)/_actions/alarm-actions";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { useConnection, useS7Connection } from "@/components/providers";

// Polling interval for alarms (ms)
const ALARM_POLL_INTERVAL = parseInt(process.env.NEXT_PUBLIC_ALARM_POLL_INTERVAL || "1000", 10);

const nav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Devices", href: "/devices", icon: Layers },
  { name: "Mock Data", href: "/mock-data", icon: Database },
  { name: "Alarms", href: "/alarms", icon: AlertTriangle },
  { name: "Trends", href: "/trends", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const { isConnected } = useConnection();
  const { isS7Connected } = useS7Connection();
  const [activeAlarms, setActiveAlarms] = useState(0);

  // Fetch alarm count from Server Action
  const fetchAlarmCount = useCallback(async () => {
    try {
      const result = await getAlarms();
      if (result.success && result.data) {
        const count = result.data.filter((a) => !a.acknowledged).length;
        setActiveAlarms(count);
      }
    } catch {
      // Silently fail - sidebar will show 0 alarms
    }
  }, []);

  // Poll for alarm count
  useEffect(() => {
    fetchAlarmCount();

    const interval = setInterval(fetchAlarmCount, ALARM_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAlarmCount]);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024) {
      close();
    }
  }, [pathname, close]);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-[60] h-[calc(100vh-4rem)] w-60 border-r border-[hsl(var(--border))] bg-gradient-to-b from-[hsl(var(--bg-1))] to-[hsl(var(--bg))] backdrop-blur-xl flex flex-col transition-transform duration-300 ease-in-out",
          // Single source of truth: isOpen controls visibility
          // Both translate-x-0 and -translate-x-full work on all screen sizes
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {nav.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-4 text-sm rounded-xl transition-all duration-200 min-h-[52px]",
                isActive
                  ? "bg-gradient-to-r from-[hsl(var(--accent))] to-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--surface))]"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="flex-1 font-medium">{item.name}</span>
              {item.name === "Alarms" && activeAlarms > 0 && (
                <span className={cn(
                  "flex items-center justify-center text-xs font-bold w-7 h-7 rounded-lg",
                  isActive ? "bg-white/20 text-white" : "bg-[hsl(var(--status-fault))] text-white glow-red"
                )}>
                  {activeAlarms}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer section */}
      <div className="p-4 border-t border-[hsl(var(--border))]">
        <div className="text-xs text-[hsl(var(--text-dim))] mb-3 font-medium uppercase tracking-wider">Connections</div>
        <div className="space-y-2 text-xs">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg border",
            isConnected
              ? "text-[hsl(var(--text-muted))] bg-[hsl(var(--surface))] border-[hsl(var(--border))]"
              : "text-[hsl(var(--status-fault))] bg-[hsl(var(--status-fault))/10 border-[hsl(var(--status-fault))]"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-[hsl(var(--status-running))] glow-green animate-pulse" : "bg-[hsl(var(--status-fault))]"
            )}></span>
            <span className="font-medium">OPC UA {isConnected ? "Connected" : "Disconnected"}</span>
          </div>
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg border",
            isS7Connected
              ? "text-[hsl(var(--text-muted))] bg-[hsl(var(--surface))] border-[hsl(var(--border))]"
              : "text-[hsl(var(--status-fault))] bg-[hsl(var(--status-fault))/10 border-[hsl(var(--status-fault))]"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full",
              isS7Connected ? "bg-[hsl(var(--status-running))] glow-green animate-pulse" : "bg-[hsl(var(--status-fault))]"
            )}></span>
            <span className="font-medium">S7 {isS7Connected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
