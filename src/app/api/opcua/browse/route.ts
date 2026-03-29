/**
 * OPC UA Browse API Route
 *
 * POST /api/opcua/browse - Browse children of a node
 *
 * Body:
 * {
 *   "nodeId": "RootFolder",           // optional, default "RootFolder"
 *   "detailed": false,                 // optional, default false
 *   "maxDepth": 3,                     // optional, only for tree mode
 *   "mode": "simple" | "detailed" | "tree"  // optional, default "simple"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import opcuaService from "@/lib/server/opcua-service";
import { BrowseResult, BrowseTreeNode, BrowseMode } from "@/types/opcua.types";
import { handleServiceError } from "@/lib/server/opcua-errors";

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
    const nodeId = body.nodeId || "RootFolder";
    const mode: BrowseMode = body.mode || "simple";
    const maxDepth = body.maxDepth || 3;

    let result: string[] | BrowseResult[] | BrowseTreeNode[];

    switch (mode) {
      case "detailed":
        result = await opcuaService.browseDetailed(nodeId);
        break;
      case "tree":
        result = await opcuaService.browseTree(nodeId, maxDepth);
        break;
      case "simple":
      default:
        result = await opcuaService.browse(nodeId);
        break;
    }

    return NextResponse.json({
      success: true,
      nodeId,
      mode,
      data: result,
    });
  } catch (error) {
    const handledError = handleServiceError(error, "browse");
    return NextResponse.json(
      {
        error: "Failed to browse OPC UA server",
        details: handledError instanceof Error ? handledError.message : String(error),
      },
      { status: 500 }
    );
  }
}
