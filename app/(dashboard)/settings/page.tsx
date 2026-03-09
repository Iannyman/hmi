"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select } from "@/components/ui/select";
import { Settings, User, Palette, Bell } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshRate, setRefreshRate] = useState("500ms");
  const [role, setRole] = useState("supervisor");

  const refreshRateOptions = [
    { value: "100ms", label: "100ms (Real-time)" },
    { value: "500ms", label: "500ms (Fast)" },
    { value: "1000ms", label: "1000ms (Normal)" },
    { value: "5000ms", label: "5000ms (Slow)" },
  ];

  const roleOptions = [
    { value: "operator", label: "Operator" },
    { value: "supervisor", label: "Supervisor" },
    { value: "administrator", label: "Administrator" },
  ];

  return (
    <div className="p-6 max-w-4xl">
      {/* Page header */}
      <div className="mb-6 pb-4 border-b border-[hsl(var(--border))]">
        <h1 className="text-2xl font-semibold tracking-tight">SETTINGS</h1>
        <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Configure system preferences and display options</p>
      </div>

      {/* Display Settings */}
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-[hsl(var(--text-muted))]" />
            <h2 className="text-lg font-semibold">Display Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-[hsl(var(--text-muted))]">
                  Use dark theme for reduced eye strain
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>

            <Separator />

          </div>
        </div>
      </div>



      {/* System Info */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-[hsl(var(--text-muted))]" />
            <h2 className="text-lg font-semibold">System Information</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[hsl(var(--text-muted))]">Version</div>
              <div className="font-medium">2.4.1</div>
            </div>
            <div>
              <div className="text-[hsl(var(--text-muted))]">Build</div>
              <div className="font-medium">2026.01.19</div>
            </div>
            <div>
              <div className="text-[hsl(var(--text-muted))]">License</div>
              <div className="font-medium">Enterprise</div>
            </div>
            <div>
              <div className="text-[hsl(var(--text-muted))]">Support</div>
              <div className="font-medium">support@tdaniel.win</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
