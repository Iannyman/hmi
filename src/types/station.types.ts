// ============================================================================
// Station Types
// ============================================================================
import { DeviceDTO } from "@/types/device.dto";


export type StationMode = "auto" | "setup" | "init" | "end" | "home" | "error";

export type StationStatus = "auto" | "setup" | "init" | "home" | "warning" | "error" | "end" | "disabled";

export interface Station {
  id: string;
  name: string;
  location: string;
  mode: StationMode;
  warning: string;
  message: string;
  partsOK: number;
  partsNOK: number;
  totalParts: number;
  efficiency: number;
  status: StationStatus;
}

export interface StationData {
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