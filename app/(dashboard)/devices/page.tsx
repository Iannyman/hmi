"use client";

import { MotorCard } from "@/components/devices/motor-card";
import { ValveCard } from "@/components/devices/valve-card";
import { RobotCard } from "@/components/devices/robot-card";
import { SensorCard } from "@/components/devices/sensor-card";
import { ConveyorCard } from "@/components/devices/conveyor-card";
import { DriveCard } from "@/components/devices/drive-card";
import { CylinderCard } from "@/components/devices/cylinder-card";
import { resetStationStatistics } from "@/actions/station-actions";
import { useState, Suspense, useMemo } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useConnection } from "@/hooks/use-connection";
import { useHMIManager } from "@/hooks/use-hmi-manager";
import { useOPCUASubscription } from "@/hooks/use-opcua-subscription";
import { DeviceStatus } from "@/types/device.types";
import { DeviceType } from "@/types/device.types";
import { DeviceDTO } from "@/types/device.dto";
import Link from "next/link";

type FilterType = "all" | DeviceType;
type FilterStatus = "all" | DeviceStatus | "initializing";

function DevicesContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const stationId = searchParams.get("station");
  const { getStation, stations, isInitialized } = useHMIManager();
  const hmiStation = getStation(stationId || "");
  const { isConnected } = useConnection();

  // Subscribe to devices for this station
  useOPCUASubscription(pathname, stationId || undefined);

  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Transform HMI station to display format
  const station = useMemo(() => {
    if (!hmiStation || !stationId) return null;
    return {
      id: hmiStation.id,
      name: hmiStation.name || hmiStation.id,
      location: hmiStation.name,
      warning: hmiStation.warning,
      message: hmiStation.message,
      mode: hmiStation.mode,
      partOk: hmiStation.partsOK,
      partNok: hmiStation.partsNOK,
      totalParts: hmiStation.partsOK + hmiStation.partsNOK,
      efficiency: hmiStation.efficiency,
      status: hmiStation.status,
      currentAction: undefined,
    };
  }, [hmiStation, stationId]);

  const nokPercentage = station?.totalParts && station.totalParts > 0
    ? ((station.partNok / station.totalParts) * 100).toFixed(1)
    : "0.0";

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
    { value: "auto", label: "Auto" },
    { value: "running", label: "Running" },
    { value: "stopped", label: "Stopped" },
    { value: "error", label: "Error" },
    { value: "warning", label: "Warning" },
    { value: "manual", label: "Manual" },
    { value: "initializing", label: "Initializing" },
  ];

  // Filter and prepare device cards from OPC UA
  const getAllDevices = () => {
    const devices: Array<DeviceDTO & { location?: string; uniqueKey: string }> = [];

    // Determine which stations to get devices from
    const stationsToUse = stationId && hmiStation ? [hmiStation] : stations;

    // Use real OPC UA devices - DeviceDTO already has all device properties
    for (const station of stationsToUse) {
      if (!station.devices || station.devices.length === 0) continue;

      for (const device of station.devices) {
        const deviceType = device.type as FilterType;
        const VALID_DEVICE_TYPES: DeviceType[] = ["motor", "valve", "sensor", "robot", "conveyor", "drive", "cylinder"];
        if (!VALID_DEVICE_TYPES.includes(deviceType as DeviceType)) {
          continue;
        }

        // Create a unique key combining station ID and device ID
        const uniqueKey = `${station.id}-${device.id}`;

        // Add computed properties to the device object (no duplication)
        devices.push({
          ...device,
          location: station.name,
          uniqueKey,
        });
      }
    }

    return devices;
  };

  const filteredDevices = getAllDevices().filter((device) => {
    if (filterType !== "all" && device.type !== filterType) return false;
    if (filterStatus !== "all" && device.status !== filterStatus) return false;
    return true;
  });

  const renderDeviceCard = (device: (typeof filteredDevices)[0]) => {
    switch (device.type) {
      case "motor":
        return <MotorCard key={device.uniqueKey} motor={device} />;
      case "valve":
        return <ValveCard key={device.uniqueKey} valve={device} />;
      case "sensor":
        return <SensorCard key={device.uniqueKey} sensor={device} />;
      case "robot":
        return <RobotCard key={device.uniqueKey} robot={device} />;
      case "conveyor":
        return <ConveyorCard key={device.uniqueKey} conveyor={device} />;
      case "drive":
        return <DriveCard key={device.uniqueKey} drive={device} />;
      case "cylinder":
        return <CylinderCard key={device.uniqueKey} cylinder={device} />;
      default:
        return null;
    }
  };

  // Determine data source
  const usingRealData = getAllDevices().length > 0;

  return (
    <div className="p-6">

      {/* Page header */}
      <div className="mb-6 pb-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-4 mb-2">
          {station && (
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
              </Button>
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">
            {station ? `${station.name}` : "All Devices"}
          </h1>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[hsl(var(--text-muted))] text-sm">
            {station
              ? ""
              : "Monitor and control all production line devices"}
          </p>
          {station && !usingRealData && isInitialized && (
            <span className="flex items-center gap-1 text-xs text-[hsl(var(--status-warning))] bg-[hsl(var(--status-warning))/10] px-2 py-0.5 rounded">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-warning))]"></span>
              No devices found for this station
            </span>
          )}
        </div>

        {/* Station Statistics */}
        {station && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-[hsl(var(--surface))] rounded-lg px-4 py-2 text-center min-w-[80px]">
              <div className="text-xs text-[hsl(var(--text-dim))] uppercase tracking-wider mb-1">OK</div>
              <div className="text-xl font-bold font-mono text-[hsl(var(--text-primary))]">
                {station.partOk.toLocaleString()}
              </div>
            </div>
            <div className="bg-[hsl(var(--surface))] rounded-lg px-4 py-2 text-center min-w-[80px]">
              <div className="text-xs text-[hsl(var(--text-dim))] uppercase tracking-wider mb-1">NOK</div>
              <div className="text-xl font-bold font-mono text-[hsl(var(--status-error))]">
                {station.partNok.toLocaleString()}
              </div>
            </div>
            <div className="bg-[hsl(var(--surface))] rounded-lg px-4 py-2 text-center min-w-[80px]">
              <div className="text-xs text-[hsl(var(--text-dim))] uppercase tracking-wider mb-1">Total</div>
              <div className="text-xl font-bold font-mono text-[hsl(var(--status-running))]">
                {station.totalParts.toLocaleString()}
              </div>
            </div>
            <div className="bg-[hsl(var(--surface))] rounded-lg px-4 py-2 text-center min-w-[80px]">
              <div className="text-xs text-[hsl(var(--text-dim))] uppercase tracking-wider mb-1">NOK %</div>
              <div className="text-xl font-bold font-mono text-[hsl(var(--status-warning))]">
                {nokPercentage}%
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-2"
              disabled={!isInitialized || !stationId}
              onClick={() => stationId && resetStationStatistics(stationId)}
            >
              <RotateCcw className="w-4 h-4" />
              Reset Stats
            </Button>
          </div>
        )}
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
          Showing {filteredDevices.length} OPC UA device{filteredDevices.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Device grid */}
      {!isConnected ? (
        <Card className="p-8 text-center border-[hsl(var(--status-error))] bg-[hsl(var(--status-error))/5">
          <p className="text-[hsl(var(--status-error))] font-semibold">Device data unavailable</p>
          <p className="text-sm text-muted-foreground mt-1">Waiting for OPC UA connection...</p>
        </Card>
      ) : filteredDevices.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-3">
            {station
              ? "No OPC UA devices found for this station."
              : "No OPC UA devices available."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDevices.map(renderDeviceCard)}
        </div>
      )}
    </div>
  );
}

export default function DevicesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <DevicesContent />
    </Suspense>
  );
}
