"use client";

import { TrendChart } from "@/components/panels/trend-chart";
import { mockTrendData } from "@/lib/mock-data";
import { useState } from "react";
import { cn } from "@/lib/utils";

const timeWindows = [
  { label: "1 Min", value: "1m" },
  { label: "5 Min", value: "5m" },
  { label: "1 Hour", value: "1h" },
  { label: "8 Hours", value: "8h" },
];

export default function TrendsPage() {
  const [timeWindow, setTimeWindow] = useState("1h");

  const tempData = mockTrendData.map((item) => ({
    ...item,
    temperature: 60 + Math.random() * 20,
  }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">TRENDS</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time data visualization and historical trends</p>
        </div>
        <div className="flex gap-2">
          {timeWindows.map((window) => (
            <button
              key={window.value}
              onClick={() => setTimeWindow(window.value)}
              className={cn(
                "px-4 py-2 rounded text-sm font-medium transition-colors",
                timeWindow === window.value
                  ? "bg-accent text-white"
                  : "btn-secondary"
              )}
            >
              {window.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TrendChart
          data={mockTrendData}
          title="Power Consumption"
          dataKey="power"
          color="#3b8f3b"
          unit="kW"
          height={280}
        />
        <TrendChart
          data={tempData}
          title="Temperature"
          dataKey="temperature"
          color="#b8862f"
          unit="°C"
          height={280}
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2">Average Power</p>
          <p className="text-2xl font-mono font-semibold">8.2 <span className="text-gray-500">kW</span></p>
          <p className="text-xs text-green-600 mt-1">↑ 5.2% vs last hour</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2">Peak Temperature</p>
          <p className="text-2xl font-mono font-semibold">78.5 <span className="text-gray-500">°C</span></p>
          <p className="text-xs text-yellow-600 mt-1">Approaching limit</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2">Data Points</p>
          <p className="text-2xl font-mono font-semibold">{mockTrendData.length}</p>
          <p className="text-xs text-gray-600 mt-1">Last 60 minutes</p>
        </div>
      </div>
    </div>
  );
}
