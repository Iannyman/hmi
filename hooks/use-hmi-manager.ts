/**
 * React Hook for HMI Manager
 *
 * Provides easy access to HMI data through API routes.
 * Polling is handled by HMIDataPollerProvider - this hook just consumes data.
 */

"use client";

import { useCallback, useState, useEffect } from "react";
import { useHMIDataContext } from "@/components/providers/hmi-data-provider";
import { DeviceDTO } from "@/types/device.dto";

import { StationStatus, StationMode } from "@/types/station.types";

interface StationData {
  id: string;
  name: string;
  status: StationStatus;
  mode: StationMode;
  warning: string;
  message: string;
  partsOK: number;
  partsNOK: number;
  disabled: boolean;
  efficiency: number;
  deviceCount: number;
  devices: DeviceDTO[];
}


/**
 * Main hook for accessing HMI data and methods
 * Polling is handled by HMIDataPollerProvider - this just consumes data
 */
export function useHMIManager() {
  const { isInitialized, isInitializing, error, hmiData, setIsInitialized, setIsInitializing, setError } = useHMIDataContext();

  /**
   * Initialize HMI system
   * Browses OPC UA structure, builds node ID map, creates all domain objects
   */
  const initialize = useCallback(async (browseTree: any[]) => {
    if (isInitialized) {
      return true;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const response = await fetch("/api/hmi/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ browseTree }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to initialize HMI");
      }

      setIsInitialized(true);
      return true;
    } catch (err: Error | unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [isInitialized, setIsInitialized, setIsInitializing, setError]);

  /**
   * Get a specific station by ID
   */
  const getStation = useCallback((stationId: string): StationData | undefined => {
    return hmiData?.stations.find((s) => s.id === stationId);
  }, [hmiData]);

  /**
   * Get all devices from all stations
   */
  const getAllDevices = useCallback((): DeviceDTO[] => {
    const devices: DeviceDTO[] = [];
    if (hmiData) {
      for (const station of hmiData.stations) {
        devices.push(...station.devices);
      }
    }
    return devices;
  }, [hmiData]);

  return {
    // State
    isInitialized,
    isInitializing,
    error,
    line: hmiData?.line || null,
    stations: hmiData?.stations || [],

    // Methods
    initialize,
    getStation,
    getAllDevices,
    setIsInitialized,
  };
}

/**
 * Hook for accessing Line data
 */
export function useLine() {
  const { line, isInitialized } = useHMIManager();
  return { line, isInitialized };
}

/**
 * Hook for accessing Station data
 */
export function useStations() {
  const { stations, isInitialized } = useHMIManager();
  return { stations, isInitialized };
}

/**
 * Hook for accessing a specific Station
 */
export function useStation(stationId: string) {
  const { getStation, isInitialized } = useHMIManager();
  const [station, setStation] = useState<StationData | undefined>(undefined);

  useEffect(() => {
    if (isInitialized) {
      setStation(getStation(stationId));
    }
  }, [stationId, isInitialized, getStation]);

  return { station, isInitialized };
}

/**
 * Hook for accessing all Devices
 */
export function useDevices() {
  const { getAllDevices, isInitialized } = useHMIManager();
  const [devices, setDevices] = useState<DeviceDTO[]>([]);

  useEffect(() => {
    if (isInitialized) {
      setDevices(getAllDevices());
    }
  }, [isInitialized, getAllDevices]);

  return { devices, isInitialized };
}
