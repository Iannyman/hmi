/**
 * OPC UA Read API Route
 *
 * POST /api/opcua/read - Read one or multiple nodes
 *
 * Body (single node):
 * { "nodeId": "ns=2;s=MyVariable" }
 *
 * Body (multiple nodes):
 * { "nodeIds": ["ns=2;s=Variable1", "ns=2;s=Variable2"] }
 */

import { NextRequest, NextResponse } from "next/server";
import opcuaService from "@/lib/server/opcua-service";
import { handleServiceError, validateArray, validateNodeId } from "@/lib/server/opcua-errors";

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

    // Single node read
    if (body.nodeId && !body.nodeIds) {
      validateNodeId(body.nodeId);
      const result = await opcuaService.readNode(body.nodeId);
      return NextResponse.json({ success: true, data: result });
    }

    // Multiple nodes read
    if (body.nodeIds) {
      validateArray(body.nodeIds, "nodeIds");
      
      // Validate each node ID
      body.nodeIds.forEach((nodeId: string, index: number) => {
        try {
          validateNodeId(nodeId);
        } catch {
          throw new Error(`Invalid node ID at index ${index}: ${nodeId}`);
        }
      });

      const results = await opcuaService.readMultipleNodes(body.nodeIds);
      return NextResponse.json({ success: true, data: results });
    }

    return NextResponse.json(
      { error: "Either nodeId or nodeIds must be provided" },
      { status: 400 }
    );
  } catch (error) {
    const handledError = handleServiceError(error, "read");
    return NextResponse.json(
      {
        error: "Failed to read node(s)",
        details: handledError instanceof Error ? handledError.message : String(error),
      },
      { status: 500 }
    );
  }
}
