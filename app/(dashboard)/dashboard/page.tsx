"use client";

import { StationCard } from "@/components/stations/station-card";
import { LineControlPanel } from "@/components/panels/line-control-panel";
import { LineStatisticsPanel } from "@/components/panels/line-statistics-panel";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useStations } from "@/hooks/use-hmi-manager";
import { useConnection } from "@/hooks/use-connection";


export default function DashboardPage() {
  const { stations: hmiStations, isInitialized } = useStations();
  const { isConnected } = useConnection();

  // Transform HMI stations to display format
  const displayStations = useMemo(() => {
    if (!isInitialized || hmiStations.length === 0) {
      return [];
    }

    return hmiStations.map((hmiStation) => ({
      id: hmiStation.id,
      name: hmiStation.name || hmiStation.id,
      location: hmiStation.name,
      mode: hmiStation.mode,
      warning: hmiStation.warning,
      message: hmiStation.message,
      partOk: hmiStation.partsOK,
      partNok: hmiStation.partsNOK,
      totalParts: hmiStation.partsOK + hmiStation.partsNOK,
      efficiency: hmiStation.efficiency,
      status: hmiStation.status,
    }));
  }, [hmiStations, isInitialized]);

  return (
    <div className="p-8 pb-20 animate-fade-in">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-[hsl(var(--border))]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient-accent">Production Overview</h1>
            <p className="text-[hsl(var(--text-muted))] text-sm mt-2">
              {isInitialized && hmiStations.length > 0
                ? `OPC UA Data — ${hmiStations.length} Stations`
                : "No OPC UA stations available."}
            </p>
          </div>
          <div className="flex flex-col lg:flex-row items-stretch gap-3">
            <LineStatisticsPanel />
            <LineControlPanel />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--text-dim))]">
            Production Stations
            {/* {isConnected && isInitialized && hmiStations.length > 0 && (
              <span className="ml-2 text-xs text-[hsl(var(--status-running))] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-running))] animate-pulse"></span>
                Live from HMI Manager
              </span>
            )} */}
          </h2>
        </div>
        {!isConnected ? (
          <Card className="p-8 text-center border-[hsl(var(--status-fault))] bg-[hsl(var(--status-fault))/5">
            <div className="flex flex-col items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--status-fault))]"></div>
              <p className="text-[hsl(var(--status-fault))] font-semibold">No OPC UA Connection</p>
              <p className="text-sm text-muted-foreground">Waiting for connection to PLC...</p>
            </div>
          </Card>
        ) : !isInitialized ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Initializing HMI System...</p>
          </Card>
        ) : displayStations.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No OPC UA stations available.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            {displayStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
