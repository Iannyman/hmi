/**
 * Domain Model Type Definitions
 *
 * This file contains all type definitions for the OPCUA HMI domain models
 * including Line, Order, Station, and Device types.
 */



// ============================================================================
// Base Types
// ============================================================================

export type LineStatus = "auto" | "setup" | "init" | "warning" | "error" ;
export type LineMode = "auto" | "setup" | "init" | "end" | "error";

/**
 * PLC line/station status states
 * Different from DeviceStatus which represents device operational states (running/stopped)
 */
export type PLCStatus = "auto" | "setup" | "error" | "init" | "warning" | "ready" | "disabled";

// ============================================================================
// Node Mapping Types
// ============================================================================

export interface NodeIDMap {
  namespace: number;
  variables: Record<string, number | string>;
  stations: string[];
  devices: Record<string, string[]>;
}

export interface ParsedNodeId {
  namespace: number;
  identifier: number | string;
}

export interface StructureChange {
  type: "station_added" | "device_added" | "station_removed" | "device_removed";
  stationId?: string;
  deviceId?: string;
}

// ============================================================================
// Domain Object Interface
// ============================================================================

export interface DomainObject {
  /**
   * Subscribe to OPCUA nodes for real-time updates
   * @param callback - Called when any subscribed node value changes
   */
  subscribe(callback: (data: unknown) => void): Promise<void>;

  /**
   * Unsubscribe from OPCUA nodes
   */
  unsubscribe(): Promise<void>;

  /**
   * Write value to an OPCUA node
   * @param variablePath - Path to the variable (e.g., "Line.sName")
   * @param value - Value to write
   */
  write(variablePath: string, value: unknown): Promise<void>;

  /**
   * Refresh all data from OPCUA (initial load or manual refresh)
   */
  refresh(): Promise<void>;
}

// ============================================================================
// Device-Specific Types
// ============================================================================

export type CylinderModelType = "2-state" | "3-state";
export type ValvePosition = "open" | "closed" | "partial";
export type ActuatorStatus = "active" | "inactive";
export type RobotMode = "auto" | "manual";
export type ConveyorDirection = "forward" | "reverse" | "stopped";

export interface AxisPositions {
  x: number;
  y: number;
  z: number;
}

export interface FaultRecord {
  code: string;
  timestamp: string;
}

// ============================================================================
// Subscription Change Types
// ============================================================================

export interface SubscriptionChange {
  nodeId: string;
  value: unknown;
  statusCode: string;
  sourceTimestamp?: Date;
  serverTimestamp?: Date;
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface LineStatistics {
  totalParts: number;
  partsOK: number;
  partsNOK: number;
  scrapRate: number;
  efficiency: number;
}

export interface StationStatistics {
  totalParts: number;
  partsOK: number;
  partsNOK: number;
  scrapRate: number;
  efficiency: number;
  deviceCount: number;
}

// ============================================================================
// Event Types
// ============================================================================

export type DomainEventType = 
  | "line:updated"
  | "order:updated"
  | "station:added"
  | "station:removed"
  | "station:updated"
  | "device:added"
  | "device:removed"
  | "device:updated"
  | "structure:changed";

export interface DomainEvent {
  type: DomainEventType;
  timestamp: Date;
  data?: unknown;
}
