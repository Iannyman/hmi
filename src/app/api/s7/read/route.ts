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
      if (!Array.isArray(body.names) || !body.names.every((n: unknown) => typeof n === "string")) {
        return NextResponse.json({ error: "'names' must be an array of strings" }, { status: 400 });
      }
      const values = await s7Service.readByName(body.names);
      return createSuccessResponse(values);
    }

    // Read by raw address
    if (body.addresses) {
      if (!Array.isArray(body.addresses) || !body.addresses.every((a: unknown) => typeof a === "string")) {
        return NextResponse.json({ error: "'addresses' must be an array of strings" }, { status: 400 });
      }
      const values = await s7Service.readByAddress(body.addresses);
      return createSuccessResponse(values);
    }

    // Read array element by index
    if (body.items) {
      if (!Array.isArray(body.items)) {
        return NextResponse.json({ error: "'items' must be an array" }, { status: 400 });
      }
      const results = [];
      for (const item of body.items) {
        if (typeof item.name !== "string" || typeof item.index !== "number") {
          return NextResponse.json({ error: "Each item must have 'name' (string) and 'index' (number)" }, { status: 400 });
        }
        const value = await s7Service.readByIndex(item.name, item.index);
        results.push(value);
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
