/**
 * OPC UA Connection API Route
 *
 * POST /api/opcua/connect - Connect to OPC UA server
 * DELETE /api/opcua/connect - Disconnect from OPC UA server
 * GET /api/opcua/connect - Get connection status
 */

import { NextRequest, NextResponse } from "next/server";
import opcuaService from "@/lib/opcua-service";
import { OPCUAConfig } from "@/types/opcua.types";
import {
  createSuccessResponse,
  handleServiceError,
} from "@/lib/opcua-errors";
import { validateEndpointUrl } from "@/lib/opcua-errors";

export async function POST(request: NextRequest) {
  try {
    const config: OPCUAConfig = await request.json();

    // Use environment variable as fallback if endpointUrl not provided
    const endpointUrl = config.endpointUrl || process.env.NEXT_PUBLIC_OPCUA_ENDPOINT_URL;

    if (!endpointUrl) {
      return NextResponse.json(
        {
          error: "No OPC UA endpoint URL provided",
          details: "Either provide endpointUrl in the request body or set NEXT_PUBLIC_OPCUA_ENDPOINT_URL in .env.local",
        },
        { status: 400 }
      );
    }

    // Validate endpoint URL
    validateEndpointUrl(endpointUrl);

    // Only disconnect if there's an active connection (prevents errors on refresh)
    if (opcuaService.isConnected()) {
      console.log("[OPC UA Connect] Existing connection found, disconnecting first...");
      await opcuaService.disconnect();
    }

    // Attempt connection
    await opcuaService.connect({ ...config, endpointUrl });

    // Verify the connection actually worked
    const isConnected = await opcuaService.verifyConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          error: "Connection attempt failed",
          details: "Could not establish a working connection to the OPC UA server",
        },
        { status: 503 }
      );
    }

    return createSuccessResponse(
      { endpointUrl },
      "Connected to OPC UA server"
    );
  } catch (error) {
    const handledError = handleServiceError(error, "connect");
    return NextResponse.json(
      {
        error: handledError.message,
        details: handledError instanceof Error ? handledError.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await opcuaService.disconnect();

    return createSuccessResponse(
      undefined,
      "Disconnected from OPC UA server"
    );
  } catch (error) {
    const handledError = handleServiceError(error, "disconnect");
    return NextResponse.json(
      {
        error: handledError.message,
        details: handledError instanceof Error ? handledError.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const isConnected = await opcuaService.verifyConnection();

    return NextResponse.json({
      connected: isConnected,
    });
  } catch (error) {
    const handledError = handleServiceError(error, "getConnectionStatus");
    return NextResponse.json(
      {
        error: handledError.message,
        details: handledError instanceof Error ? handledError.message : undefined,
      },
      { status: 500 }
    );
  }
}
