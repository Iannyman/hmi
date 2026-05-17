/**
 * S7 Connection API Route
 *
 * POST   /api/s7/connect  — Connect to S7 PLC
 * DELETE /api/s7/connect  — Disconnect from S7 PLC
 * GET    /api/s7/connect  — Get connection status
 */

import { NextRequest, NextResponse } from "next/server";
import s7Service from "@/lib/server/s7-service";
import { S7Config } from "@/types/s7.types";
import {
  createSuccessResponse,
  createErrorResponse,
  validateS7Host,
} from "@/lib/server/s7-errors";

export async function POST(request: NextRequest) {
  try {
    const body: Partial<S7Config> = await request.json().catch(() => ({}));

    const host = body.host || process.env.S7_HOST;
    if (!host) {
      return NextResponse.json(
        { error: "No S7 host provided. Set S7_HOST in .env or provide host in request body." },
        { status: 400 }
      );
    }

    validateS7Host(host);

    if (s7Service.isConnected()) {
      console.log("[S7 Connect] Existing connection found, disconnecting first...");
      await s7Service.disconnect();
    }

    const config: S7Config = {
      host,
      port: body.port ?? (Number(process.env.S7_PORT) || 102),
      rack: body.rack ?? (Number(process.env.S7_RACK) || 0),
      slot: body.slot ?? (Number(process.env.S7_SLOT) || 1),
    };

    await s7Service.connect(config);

    return createSuccessResponse(
      { host: config.host, port: config.port, rack: config.rack, slot: config.slot },
      "Connected to S7 PLC"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(message);
  }
}

export async function DELETE() {
  try {
    await s7Service.disconnect();
    return createSuccessResponse(undefined, "Disconnected from S7 PLC");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(message);
  }
}

export async function GET() {
  try {
    const status = s7Service.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(message);
  }
}
