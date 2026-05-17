/**
 * S7 Read API Route
 *
 * POST /api/s7/read — Read values from S7 PLC
 *
 * Body options:
 * { "names": ["db2_array1", "db2_array2"] }          — read by friendly name
 * { "addresses": ["DB2,DINT52"] }                     — read by raw address
 * { "all": true }                                      — read entire address map
 * { "items": [{ "name": "db2_array2", "index": 3 }] } — read array element by index
 */

import { NextRequest, NextResponse } from "next/server";
import s7Service from "@/lib/server/s7-service";
import {
  createSuccessResponse,
  createNotConnectedResponse,
  createErrorResponse,
} from "@/lib/server/s7-errors";

export async function POST(request: NextRequest) {
  try {
    if (!s7Service.isConnected()) {
      return createNotConnectedResponse();
    }

    const body = await request.json();

    // Read by name
    if (body.names) {
      const values = await s7Service.readByName(body.names);
      return createSuccessResponse(values);
    }

    // Read by raw address
    if (body.addresses) {
      const values = await s7Service.readByAddress(body.addresses);
      return createSuccessResponse(values);
    }

    // Read array element by index
    if (body.items) {
      const results = [];
      for (const item of body.items) {
        if (item.name && item.index !== undefined) {
          const value = await s7Service.readByIndex(item.name, item.index);
          results.push(value);
        }
      }
      return createSuccessResponse(results);
    }

    // Read all
    if (body.all) {
      const values = await s7Service.readAll();
      return createSuccessResponse(values);
    }

    return NextResponse.json(
      { error: "Provide 'names', 'addresses', 'items', or 'all': true" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(message);
  }
}
