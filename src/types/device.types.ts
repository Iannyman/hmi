// ============================================================================
// Device Types
// ============================================================================

export type DeviceType = "motor" | "valve" | "sensor" | "robot" | "conveyor" | "drive" | "cylinder";

/**
 * Device operational status (running/stopped states)
 * Used for device-level operational state tracking
 */
export type DeviceStatus = "running" | "stopped" | "error" | "warning" | "manual" | "auto";



export interface BaseDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location?: string;
  lastUpdate: string;
}

export interface MotorData {
  speed: number;
  maxSpeed: number;
  current: number;
  maxCurrent: number;
  power: number;
  temperature: number;
  load: number;
  runtime: string;
  speedTrend?: "up" | "down" | "neutral";
}

export interface ValveData {
  position: "open" | "closed" | "partial";
  positionPercent: number;
  pressure: number;
  flowRate: number;
  actuatorStatus: "active" | "inactive";
  lastCycle: string;
}

export interface SensorData {
  value: number;
  unit: string;
  min: number;
  max: number;
  avg: number;
  alarmThreshold: number;
  trendHistory: number[];
}

export interface RobotData {
  mode: "auto" | "manual";
  program: string;
  programNumber: string;
  cycle: number;
  totalCycles: number;
  timeRemaining: string;
  axisPositions: {
    x: number;
    y: number;
    z: number;
  };
}

export interface ConveyorData {
  speed: number;
  direction: "forward" | "reverse" | "stopped";
  materialCount: number;
  capacity: number;
  loadPercentage: number;
  length: number;
}

export interface DriveData {
  actPosition: number;
  actPositionIndex: number;
  axisMoving: boolean;
  errorMessage?: string;
  enForward: boolean;
  enBackward: boolean;
  enPositioning: boolean;
  targetPositionIndex: number;
}

export interface TrendData {
  timestamp: string;
  value: number;
  power?: number;
  temperature?: number;
  pressure?: number;
}

// Cylinder-specific data only (consistent pattern with other devices)
export interface CylinderData {
  model: "2-state" | "3-state";
  inWorkPosition: boolean;
  inHomePosition: boolean;
  enabled: boolean;
  enableHomePosition: boolean;
  enableWorkPosition: boolean;
  errorMessage: string;
  toHomePosition: boolean;
  toWorkPosition: boolean;
  timeout: number;
}

// Combined Device types (BaseDevice + specific data)
export interface Motor extends BaseDevice {
  type: "motor";
  data: MotorData;
}

export interface Valve extends BaseDevice {
  type: "valve";
  data: ValveData;
}

export interface Sensor extends BaseDevice {
  type: "sensor";
  data: SensorData;
}

export interface Robot extends BaseDevice {
  type: "robot";
  data: RobotData;
}

export interface Conveyor extends BaseDevice {
  type: "conveyor";
  data: ConveyorData;
}

export interface Drive extends BaseDevice {
  type: "drive";
  data: DriveData;
}

export interface Cylinder extends BaseDevice {
  type: "cylinder";
  data: CylinderData;
}

export type Device = Motor | Valve | Sensor | Robot | Conveyor | Drive | Cylinder;
