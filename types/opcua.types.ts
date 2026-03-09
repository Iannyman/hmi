/**
 * Centralized OPC UA Type Definitions
 *
 * This file contains all shared type definitions for OPC UA operations
 * to eliminate duplication across the codebase.
 */

import { MessageSecurityMode, SecurityPolicy, DataType } from "node-opcua";
import { DeviceType } from './device.types';



// ============================================================================
// Configuration Types
// ============================================================================

export interface OPCUAConfig {
  endpointUrl: string;
  securityMode?: MessageSecurityMode;
  securityPolicy?: SecurityPolicy;
  username?: string;
  password?: string;
}

// Simplified config for client-side use (string enums)
export interface OPCUAConfigClient {
  endpointUrl: string;
  securityMode?: "None" | "Sign" | "SignAndEncrypt";
  securityPolicy?: "None" | "Basic128Rsa15" | "Basic256";
  username?: string;
  password?: string;
}

// ============================================================================
// Node Value Types
// ============================================================================

export interface NodeValue {
  nodeId: string;
  value: unknown;
  statusCode: string;
  sourceTimestamp?: Date;
  serverTimestamp?: Date;
}

// Alias for consistency with hooks
export type OPCUANodeValue = NodeValue;

// ============================================================================
// Subscription Types
// ============================================================================

import { DataValue } from "node-opcua";

export type SubscriptionCallback = (dataValue: DataValue) => void;

export interface SubscriptionData {
  nodeId: string;
  value: unknown;
  statusCode: string;
  sourceTimestamp?: Date;
  serverTimestamp?: Date;
}

// ============================================================================
// Browse Types
// ============================================================================

export interface BrowseResult {
  nodeId: string;
  browseName: string;
  displayName: string;
  nodeClass: string;
  typeDefinition: string;
}

export interface BrowseTreeNode {
  nodeId: string;
  browseName: string;
  displayName: string;
  nodeClass: string;
  children?: BrowseTreeNode[];
}

export type BrowseMode = "simple" | "detailed" | "tree";

// ============================================================================
// Write Types
// ============================================================================

export type OPCUADataType = keyof typeof DataType;

// ============================================================================
// Dynamic Structure Types (for OPCUA Browser)
// ============================================================================

export interface DynamicNodeValue {
  nodeId: string;
  displayName: string;
  value: unknown;
  statusCode: string;
  sourceTimestamp?: Date;
  serverTimestamp?: Date;
}

export interface DynamicStructure {
  nodeId: string;
  displayName: string;
  nodeClass: string;
  typeDefinition?: string;
  children?: DynamicStructure[];
  value?: unknown;
  values?: DynamicNodeValue[];
}

export interface NodeMapping {
  nodeId: string;
  path: string[];
  displayName: string;
  nodeClass: string;
  typeDefinition?: string;
}

// ============================================================================
// Provider Types
// ============================================================================

export interface OPCUADevice {
  id: string;
  name: string;
  type: DeviceType;
  status: string;
  nodeId: string;
  values: Record<string, unknown>;
}

export interface OPCUAStation {
  id: string;
  name: string;
  location: string;
  mode: string;
  partOk: number;
  partNok: number;
  totalParts: number;
  efficiency: number;
  status: string;
  currentAction?: string;
  nodeId: string;
  devices: OPCUADevice[];
}

export interface OPCUAMockData {
  stations: OPCUAStation[];
  stationDevices: Record<string, string[]>;
  devices: {
    motors: OPCUADevice[];
    valves: OPCUADevice[];
    sensors: OPCUADevice[];
    robots: OPCUADevice[];
    conveyors: OPCUADevice[];
    drives: OPCUADevice[];
    cylinders: OPCUADevice[];
  };
}

// ============================================================================
// Subscription Configuration Types
// ============================================================================

export interface RouteSubscriptionConfig {
  route: string;
  nodePaths: string[];
  description: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface OPCUAError {
  error: string;
  details?: string;
  code?: number;
}

export interface OPCUASuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface OPCUAErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export type OPCUAResponse<T = unknown> = OPCUASuccessResponse<T> | OPCUAErrorResponse;
