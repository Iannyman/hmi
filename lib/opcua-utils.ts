/**
 * OPC UA Utility Functions
 * 
 * This file contains shared utility functions for OPC UA operations
 * to eliminate code duplication.
 */

import { NodeValue } from "@/types/opcua.types";

// ============================================================================
// DateTime Conversion
// ============================================================================

/**
 * Convert OPC UA DateTime to JavaScript Date
 * @param dt - OPC UA DateTime object (any type with toDate method or Date)
 * @returns JavaScript Date or null
 */
export function toDate(dt: unknown): Date | null {
  if (!dt) return null;
  // Check if dt has toDate method (OPC UA DateTime)
  if (typeof (dt as any).toDate === 'function') {
    return (dt as any).toDate();
  }
  // If it's already a Date
  if (dt instanceof Date) {
    return dt;
  }
  return null;
}

// ============================================================================
// Node Class Constants
// ============================================================================

/**
 * OPC UA NodeClass enumeration values
 */
export const NodeClass = {
  Object: 2,
  Variable: 1,
  Method: 4,
  ObjectType: 8,
  VariableType: 16,
  ReferenceType: 32,
  DataType: 64,
  View: 128,
} as const;

/**
 * Check if node class is an object
 * @param nodeClass - Node class value
 * @returns True if node is an object
 */
export function isObjectNode(nodeClass: number): boolean {
  return nodeClass === NodeClass.Object;
}

/**
 * Check if node class is a variable
 * @param nodeClass - Node class value
 * @returns True if node is a variable
 */
export function isVariableNode(nodeClass: number): boolean {
  return nodeClass === NodeClass.Variable;
}

// ============================================================================
// Node ID Validation
// ============================================================================

/**
 * Validate OPC UA Node ID format
 * @param nodeId - Node ID string to validate
 * @returns True if valid format
 */
export function isValidNodeId(nodeId: string): boolean {
  // Basic validation - checks for common OPC UA node ID formats
  const patterns = [
    /^ns=\d+;[isgb]=.+$/,  // Namespace with identifier type
    /^i=\d+$/,              // Numeric identifier
    /^s=.+$/,               // String identifier
    /^g=.+$/,               // GUID identifier
    /^b=.+$/,               // ByteString identifier
  ];
  return patterns.some(pattern => pattern.test(nodeId));
}

// ============================================================================
// Subscription Utilities
// ============================================================================

/**
 * Generate a unique subscription name
 * @param prefix - Optional prefix for the subscription name
 * @returns Unique subscription name
 */
export function generateSubscriptionName(prefix: string = "subscription"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Extract error message from unknown error type
 * @param error - Unknown error
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// ============================================================================
// Browse Utilities
// ============================================================================

/**
 * Check if a node should be browsed recursively
 * @param nodeClass - Node class value
 * @returns True if node should be browsed recursively
 */
export function shouldBrowseRecursively(nodeClass: number): boolean {
  return isObjectNode(nodeClass) || isVariableNode(nodeClass);
}

/**
 * Build node path from array of display names
 * @param path - Array of display names
 * @returns Dot-separated path string
 */
export function buildNodePath(path: string[]): string {
  return path.join(".");
}

/**
 * Parse node path into array of display names
 * @param path - Dot-separated path string
 * @returns Array of display names
 */
export function parseNodePath(path: string): string[] {
  return path.split(".");
}

// ============================================================================
// Device Type Utilities
// ============================================================================

import { DeviceType } from "@/types/device.types";

/**
 * Get device type from display name
 * @param displayName - Display name of the device
 * @returns Device type or null
 */
export function getDeviceTypeFromDisplayName(displayName: string): DeviceType | null {
  const deviceTypes: DeviceType[] = ["motor", "valve", "sensor", "robot", "conveyor", "drive", "cylinder"];
  const lowerName = displayName.toLowerCase();
  
  for (const type of deviceTypes) {
    if (lowerName.startsWith(type)) {
      return type;
    }
  }
  return null;
}

/**
 * Check if display name matches a device type
 * @param displayName - Display name to check
 * @param deviceType - Device type to match
 * @returns True if matches
 */
export function isDeviceType(displayName: string, deviceType: DeviceType): boolean {
  return displayName.toLowerCase().startsWith(deviceType);
}

// ============================================================================
// Station Utilities
// ============================================================================

/**
 * Check if display name is a station
 * @param displayName - Display name to check
 * @returns True if is a station
 */
export function isStation(displayName: string): boolean {
  return displayName.startsWith("Station_");
}

/**
 * Extract station ID from display name
 * @param displayName - Display name of the station
 * @returns Station ID or null
 */
export function extractStationId(displayName: string): string | null {
  const match = displayName.match(/^Station_(.+)$/);
  return match ? match[1] : null;
}

// ============================================================================
// Device ID Utilities
// ============================================================================

/**
 * Extract device ID from display name
 * @param displayName - Display name of the device
 * @returns Device ID or null
 */
export function extractDeviceId(displayName: string): string | null {
  // Matches patterns like "Motor_1", "Cylinder_2", etc.
  const match = displayName.match(/^[A-Za-z]+_(\d+)$/);
  return match ? match[1] : null;
}

/**
 * Check if display name is a device
 * @param displayName - Display name to check
 * @returns True if is a device
 */
export function isDevice(displayName: string): boolean {
  const deviceTypes = ["motor", "valve", "sensor", "robot", "conveyor", "drive", "cylinder"];
  const lowerName = displayName.toLowerCase();
  return deviceTypes.some(type => lowerName.startsWith(type));
}

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Measure execution time of a function
 * @param fn - Function to measure
 * @returns Result and execution time in milliseconds
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  return {
    result,
    timeMs: endTime - startTime,
  };
}

/**
 * Measure synchronous execution time of a function
 * @param fn - Function to measure
 * @returns Result and execution time in milliseconds
 */
export function measureTimeSync<T>(fn: () => T): { result: T; timeMs: number } {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  return {
    result,
    timeMs: endTime - startTime,
  };
}
