"use client";

import { MotorCard } from "@/components/devices/motor-card";
import { ValveCard } from "@/components/devices/valve-card";
import { RobotCard } from "@/components/devices/robot-card";
import { SensorCard } from "@/components/devices/sensor-card";
import { ConveyorCard } from "@/components/devices/conveyor-card";
import { DriveCard } from "@/components/devices/drive-card";
import { CylinderCard } from "@/components/devices/cylinder-card";
import { useState } from "react";
import { Database } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { mockDevices } from "@/lib/mock-data";
import { DeviceStatus } from "@/types/device.types";
import { DeviceDTO } from "@/types/device.dto";

type FilterType = "all" | "motor" | "valve" | "sensor" | "robot" | "conveyor" | "drive" | "cylinder";
type FilterStatus = "all" | DeviceStatus;

// Simplified type for mock devices - extends DeviceDTO with location
type MockDevice = DeviceDTO & { location: string };

export default function MockDataPage() {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const deviceTypes: { value: FilterType; label: string }[] = [
    { value: "all", label: "All Devices" },
    { value: "motor", label: "Motors" },
    { value: "valve", label: "Valves" },
    { value: "sensor", label: "Sensors" },
    { value: "robot", label: "Robots" },
    { value: "conveyor", label: "Conveyors" },
    { value: "drive", label: "Drives" },
    { value: "cylinder", label: "Cylinders" },
  ];

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "All Status" },
    { value: "running", label: "Running" },
    { value: "stopped", label: "Stopped" },
    { value: "error", label: "Error" },
    { value: "warning", label: "Warning" },
    { value: "manual", label: "Manual" },
    { value: "auto", label: "Auto" },
  ];

  // Get all mock devices
  const getAllMockDevices = (): MockDevice[] => {
    const devices: MockDevice[] = [];

    mockDevices.motors.forEach((d, i) => {
      devices.push({
        id: d.id,
        stationId: `Station_A${i + 1}`,
        name: d.name,
        type: "motor",
        status: d.status,
        details: d.name,
        location: d.location || `Station A${i + 1}`,
        ...d.data,
      } as MockDevice);
    });

    mockDevices.valves.forEach((d, i) => {
      devices.push({
        id: d.id,
        stationId: `Station_B${i + 1}`,
        name: d.name,
        type: "valve",
        status: d.status,
        details: d.name,
        location: d.location || `Station B${i + 1}`,
        ...d.data,
      } as MockDevice);
    });

    mockDevices.sensors.forEach((d, i) => {
      devices.push({
        id: d.id,
        stationId: `Station_C${i + 1}`,
        name: d.name,
        type: "sensor",
        status: d.status,
        details: d.name,
        location: d.location || `Station C${i + 1}`,
        ...d.data,
      } as MockDevice);
    });

    mockDevices.robots.forEach((d, i) => {
      devices.push({
        id: d.id,
        stationId: `Station_D${i + 1}`,
        name: d.name,
        type: "robot",
        status: d.status,
        details: d.name,
        location: d.location || `Station D${i + 1}`,
        ...d.data,
      } as MockDevice);
    });

    mockDevices.conveyors.forEach((d, i) => {
      devices.push({
        id: d.id,
        stationId: `Line_${i + 1}`,
        name: d.name,
        type: "conveyor",
        status: d.status,
        details: d.name,
        location: d.location || `Line ${i + 1}`,
        ...d.data,
      } as MockDevice);
    });

    mockDevices.drives.forEach((d, i) => {
      devices.push({
        id: d.id,
        stationId: `Control_Panel_${i + 1}`,
        name: d.name,
        type: "drive",
        status: d.status,
        details: d.name,
        location: d.location || `Control Panel ${i + 1}`,
        ...d.data,
      } as MockDevice);
    });

    // Add mock cylinders
    mockDevices.cylinders.forEach((cylinder) => {
      devices.push({
        id: cylinder.id,
        stationId: cylinder.location || cylinder.id,
        name: cylinder.name,
        type: "cylinder",
        status: cylinder.status,
        details: `${cylinder.name}/Home Position/Work Position`,
        location: cylinder.location || cylinder.id,
        ...cylinder.data,
      } as MockDevice);
    });

    return devices;
  };

  const filteredDevices = getAllMockDevices().filter((device) => {
    if (filterType !== "all" && device.type !== filterType) return false;
    if (filterStatus !== "all" && device.status !== filterStatus) return false;
    return true;
  });

  const renderDeviceCard = (device: (typeof filteredDevices)[0]) => {
    switch (device.type) {
      case "motor":
        return <MotorCard key={device.id} motor={device} />;
      case "valve":
        return <ValveCard key={device.id} valve={device} />;
      case "sensor":
        return <SensorCard key={device.id} sensor={device} />;
      case "robot":
        return <RobotCard key={device.id} robot={device} />;
      case "conveyor":
        return <ConveyorCard key={device.id} conveyor={device} />;
      case "drive":
        return <DriveCard key={device.id} drive={device} />;
      case "cylinder":
        return <CylinderCard key={device.id} cylinder={device} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6 pb-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2 bg-[hsl(var(--surface))] rounded-lg">
            <Database className="w-5 h-5 text-[hsl(var(--text-muted))]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mock Data</h1>
            <p className="text-sm text-[hsl(var(--text-muted))]">
              Demo devices with simulated data for testing and development
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="flex items-center gap-1 text-xs text-[hsl(var(--text-muted))] bg-[hsl(var(--surface))] px-2 py-0.5 rounded">
            <Database className="w-3 h-3" />
            Static mock data
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Select
            label="Type"
            options={deviceTypes}
            value={filterType}
            onChange={(value) => setFilterType(value as FilterType)}
            className="w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            label="Status"
            options={statusFilters}
            value={filterStatus}
            onChange={(value) => setFilterStatus(value as FilterStatus)}
            className="w-48"
          />
        </div>
        <div className="ml-auto text-xs text-[hsl(var(--text-muted))]">
          Showing {filteredDevices.length} mock device{filteredDevices.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Device grid */}
      {filteredDevices.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No mock devices match the current filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDevices.map(renderDeviceCard)}
        </div>
      )}
    </div>
  );
}
