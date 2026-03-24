"use client";

import Link from "next/link";
import { Bell, Settings, User, Menu, Factory, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { useHMIManager } from "@/hooks/use-hmi-manager";
import { getAlarms } from "@/actions/alarm-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LineStatus } from "@/types/domain.types";

// Polling interval for header alarm count (ms)
const ALARM_POLL_INTERVAL = parseInt(process.env.NEXT_PUBLIC_HEADER_ALARM_POLL_INTERVAL_MS || "3000", 10);

interface UserAccount {
  id: string;
  name: string;
  role: string;
}

const mockUsers: UserAccount[] = [
  { id: "1", name: "Operator", role: "operator" },
  { id: "2", name: "Supervisor", role: "supervisor" },
  { id: "3", name: "Admin", role: "admin" },
];

export function Header() {
  const { isOpen, toggle } = useSidebar();
  const { line } = useHMIManager();
  const [activeAlarms, setActiveAlarms] = useState(0);
  const [criticalAlarms, setCriticalAlarms] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  // User authentication state - initialize with default to match server render
  const [currentUser, setCurrentUser] = useState<UserAccount>(mockUsers[0]);
  const [selectedUser, setSelectedUser] = useState<UserAccount>(mockUsers[0]);
  const [password, setPassword] = useState("");
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  // Fetch alarm counts from Server Action
  const fetchAlarmCounts = useCallback(async () => {
    try {
      const result = await getAlarms();
      if (result.success && result.data) {
        const active = result.data.filter((a) => !a.acknowledged).length;
        const critical = result.data.filter(
          (a) => !a.acknowledged && a.severity === "critical"
        ).length;
        setActiveAlarms(active);
        setCriticalAlarms(critical);
      }
    } catch (error) {
      // Silently fail - header will show 0 alarms
    }
  }, []);

  // Poll for alarm counts
  useEffect(() => {
    fetchAlarmCounts();

    const interval = setInterval(fetchAlarmCounts, ALARM_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAlarmCounts]);

  // Load persisted user from localStorage after mount (client-only)
  useEffect(() => {
    const saved = localStorage.getItem("selectedUser");
    if (saved) {
      const user = mockUsers.find((u) => u.id === saved);
      if (user) {
        setCurrentUser(user);
        setSelectedUser(user);
      }
    }
  }, []);

  const handleAuthenticate = () => {
    // TODO: Implement actual authentication logic
    if (password) {
      setCurrentUser(selectedUser);
      localStorage.setItem("selectedUser", selectedUser.id);
      setIsAuthDialogOpen(false);
      setPassword("");
    }
  };

  const handleCancel = () => {
    setIsAuthDialogOpen(false);
    setPassword("");
    setSelectedUser(currentUser);
  };

  // Get line status from real data or default to stopped
  const lineStatus: LineStatus = line?.status as LineStatus ?? "stopped";

  const getStatusDisplay = () => {
    switch (lineStatus) {
      case "auto":
        return {
          text: "AUTO",
          color: "bg-[hsl(var(--status-running))]",
        };
      case "home":
        return {
          text: "HOME",
          color: "bg-[hsl(var(--status-stopped))]",
        };        
      case "setup":
        return {
          text: "SETUP",
          color: "bg-[hsl(var(--status-stopped))]",
        };
      case "end":
        return {
          text: "INIT",
          color: "bg-[hsl(var(--status-stopped))]",
        };        
      case "init":
        return {
          text: "INIT",
          color: "bg-[hsl(var(--status-stopped))]",
        };
      case "error":
        return {
          text: "ERROR",
          color: "bg-[hsl(var(--status-fault))]",
        };
      default:
        return {
          text: "UNKNOWN",
          color: "bg-[hsl(var(--text-muted))]",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Get line name from real data or use default
  const lineName = line?.name ?? "Line 1";
  const lineMode = line?.mode ?? "manual";

  // Get statistics from real data or use defaults
  const efficiency = line?.efficiency ?? 0;
  const totalParts = line?.totalParts ?? 0;
  const partsOK = line?.partsOK ?? 0;
  const partsNOK = line?.partsNOK ?? 0;

  // Calculate production rate (parts per hour) - mock if not available
  const productionRate = totalParts > 0 ? Math.round(totalParts / 8) : 0; // Assume 8 hour shift for demo

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 h-16 border-b border-[hsl(var(--border))] flex items-center justify-between px-6 bg-gradient-to-b from-[hsl(var(--bg-1))] to-[hsl(var(--bg))] backdrop-blur-xl">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="p-3 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-all duration-200 rounded-lg hover:bg-[hsl(var(--surface))]"
          aria-label="Toggle sidebar"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--accent))] to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
            <Factory className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold tracking-tight hidden sm:inline text-gradient-accent">{lineName}</span>
        </Link>
      </div>

      {/* Center - Status on mobile, full stats on desktop */}
      <div className="flex items-center gap-4">
        {/* Mobile Status Indicator */}
        <div className="lg:hidden flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[hsl(var(--surface))] border border-[hsl(var(--border))]">
          <span className={cn("w-2 h-2 rounded-full", statusDisplay.color, lineStatus === "auto" && "glow-green animate-pulse", lineStatus === "error" && "animate-blink")}></span>
          <span className="text-xs text-[hsl(var(--text))] font-medium">{statusDisplay.text}</span>
        </div>

        {/* Desktop Full Stats */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--surface))] border border-[hsl(var(--border))]">
          <span className={cn("w-2.5 h-2.5 rounded-full", statusDisplay.color, lineStatus === "auto" && "glow-green animate-pulse", lineStatus === "error" && "animate-blink")}></span>
          <span className="text-[hsl(var(--text))] font-medium">{statusDisplay.text}</span>
        </div>
        <div className="text-[hsl(var(--text-muted))]">
          Active: <span className="text-[hsl(var(--text))] font-semibold font-mono">4/6</span>
        </div>
        <div className="text-[hsl(var(--text-muted))]">
          OEE: <span className="text-[hsl(var(--text))] font-semibold font-mono text-gradient-accent">87.3%</span>
        </div>
        <div className="text-[hsl(var(--text-muted))]">
          Production: <span className="text-[hsl(var(--text))] font-semibold font-mono">{productionRate}/hr</span>
        </div>
        <div className="text-[hsl(var(--text-muted))]">
          Efficiency: <span className={cn("font-semibold font-mono", efficiency > 80 ? "text-[hsl(var(--status-running))]" : "text-[hsl(var(--status-warning))]")}>{efficiency.toFixed(1)}%</span>
        </div>
        <div className="font-mono text-[hsl(var(--text-muted))] bg-[hsl(var(--surface))] px-3 py-1.5 rounded-lg border border-[hsl(var(--border))]">{currentTime}</div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <Link href="/alarms">
          <button className="relative p-3 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-all duration-200 rounded-lg hover:bg-[hsl(var(--surface))]">
            <Bell className="w-5 h-5" />
            {activeAlarms > 0 && (
              <span
                className={cn(
                  "absolute top-2 right-2 w-2.5 h-2.5 rounded-full",
                  criticalAlarms > 0
                    ? "bg-[hsl(var(--status-fault))] glow-red animate-blink"
                    : "bg-[hsl(var(--status-warning))] glow-yellow"
                )}
              />
            )}
          </button>
        </Link>
        <button
          onClick={() => setIsAuthDialogOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-all duration-200 rounded-lg hover:bg-[hsl(var(--surface))]"
        >
          <User className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">{currentUser.name}</span>
        </button>
      </div>
    </header>

    {/* User Authentication Dialog */}
    <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
      <DialogContent className="bg-[hsl(var(--surface-1))] border-[hsl(var(--border))]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--text))]">User Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-muted))] mb-2">Select User</label>
              <div className="space-y-2">
                {mockUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                      selectedUser.id === user.id
                        ? "bg-[hsl(var(--accent))] border-[hsl(var(--accent))] text-white"
                        : "bg-[hsl(var(--surface))] border-[hsl(var(--border))] text-[hsl(var(--text))] hover:border-[hsl(var(--accent))]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5" />
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <span className={cn(
                      "text-xs uppercase tracking-wider px-2 py-1 rounded",
                      selectedUser.id === user.id
                        ? "bg-white/20"
                        : "bg-[hsl(var(--surface-1))]"
                    )}>{user.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-muted))] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg text-[hsl(var(--text))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-[hsl(var(--border))] text-[hsl(var(--text))]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAuthenticate}
              disabled={!password}
              className="bg-gradient-to-r from-[hsl(var(--accent))] to-blue-600 text-white hover:opacity-90"
            >
              Authenticate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
