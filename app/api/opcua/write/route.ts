/**
 * OPC UA Write API Route
 *
 * POST /api/opcua/write - Write value to a node
 *
 * Body:
 * {
 *   "nodeId": "ns=2;s=MyVariable",
 *   "value": 123,
 *   "dataType": "Int32"  // DataType enum: "Boolean", "Int32", "Float", "String", etc.
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import opcuaService from "@/lib/opcua-service";
import { DataType } from "node-opcua";
import { handleServiceError, validateRequired, validateNodeId, validateDataType } from "@/lib/opcua-errors";
import { stringToDataType, getValidDataTypes } from "@/lib/opcua-utils-server";

export async function POST(request: NextRequest) {
  try {
    // Check connection
    if (!opcuaService.isConnected()) {
      return NextResponse.json(
        {
          error: "Not connected to OPC UA server",
          details: "Please connect to an OPC UA server before performing this operation",
        },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate required fields
    validateRequired(body.nodeId, "nodeId");
    validateRequired(body.value, "value");
    validateRequired(body.dataType, "dataType");

    // Validate node ID
    validateNodeId(body.nodeId);

    // Validate and convert data type
    const dataType = stringToDataType(body.dataType);

    if (dataType === undefined) {
      return NextResponse.json(
        {
          error: "Invalid dataType",
          validTypes: getValidDataTypes(),
        },
        { status: 400 }
      );
    }

    await opcuaService.writeNode(body.nodeId, body.value, dataType);

    return NextResponse.json({
      success: true,
      message: "Value written successfully",
      nodeId: body.nodeId,
      value: body.value,
    });
  } catch (error) {
    const handledError = handleServiceError(error, "write");
    return NextResponse.json(
      {
        error: "Failed to write value",
        details: handledError instanceof Error ? handledError.message : String(error),
      },
      { status: 500 }
    );
  }
}
