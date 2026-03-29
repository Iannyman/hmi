/**
 * OPC UA Server-Side Utility Functions
 *
 * This file contains utility functions that can only run on the server
 * because they import from node-opcua which uses Node.js-only modules.
 */

import { DataValue, DataType } from "node-opcua";
import { NodeValue } from "@/types/opcua.types";
import { toDate } from "../opcua-utils";

// ============================================================================
// DataValue Conversion
// ============================================================================

/**
 * Convert OPC UA DataValue to NodeValue
 * @param nodeId - The node identifier
 * @param dataValue - The OPC UA DataValue
 * @returns NodeValue with converted timestamps
 */
export function dataValueToNodeValue(nodeId: string, dataValue: DataValue): NodeValue {
  return {
    nodeId,
    value: dataValue.value.value,
    statusCode: dataValue.statusCode.name || dataValue.statusCode.toString(),
    sourceTimestamp: toDate(dataValue.sourceTimestamp) || undefined,
    serverTimestamp: toDate(dataValue.serverTimestamp) || undefined,
  };
}

// ============================================================================
// DataType Conversion
// ============================================================================

/**
 * Convert string to DataType enum
 * @param dataTypeStr - String representation of DataType
 * @returns DataType enum value or undefined
 */
export function stringToDataType(dataTypeStr: string): DataType | undefined {
  return (DataType as unknown as Record<string, DataType>)[dataTypeStr];
}

/**
 * Get valid DataType names
 * @returns Array of valid DataType string names
 */
export function getValidDataTypes(): string[] {
  return Object.keys(DataType).filter((k) => isNaN(Number(k)));
}
