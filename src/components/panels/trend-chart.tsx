"use client";

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
} from "recharts";
import type { TrendData } from "@/types/device.types";
import { cn } from "@/lib/utils";

interface TrendChartProps {
  data: TrendData[];
  title: string;
  dataKey: string;
  color?: string;
  unit?: string;
  height?: number;
  className?: string;
}

export function TrendChart({
  data,
  title,
  dataKey,
  color = "#3b8f3b",
  unit = "",
  height = 220,
  className,
}: TrendChartProps) {
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded p-2 shadow-lg">
          <p className="text-xs text-gray-500 mb-1 font-mono">{label}</p>
          <p className="text-sm font-medium text-white">
            {payload[0].value}
            {unit && <span className="ml-1 text-gray-400">{unit}</span>}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("card", className)}>
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 16, right: 16, bottom: 16, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            strokeWidth={1}
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const time = value.split(":");
              return time.length >= 2 ? `${time[0]}:${time[1]}` : value;
            }}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}${unit}`}
            tickMargin={8}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, stroke: color, strokeWidth: 2, fill: "#000" }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
