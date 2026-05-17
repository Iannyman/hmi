/**
 * S7 Write API Route
 *
 * POST /api/s7/write — Write values to S7 PLC
 *
 * Body options:
 * { "items": [{ "name": "db2_array1", "value": 100 }] }           — write by name
 * { "addresses": [{ "address": "DB2,DINT20", "value": 999 }] }    — write by raw address
 * { "items": [{ "name": "db2_array1", "index": 5, "value": 999 }]}— write by index
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

    // Write by name (with optional index)
    if (body.items) {
      if (!Array.isArray(body.items)) {
        return NextResponse.json({ error: "'items' must be an array" }, { status: 400 });
      }
      for (const item of body.items) {
        if (typeof item.name !== "string") {
          return NextResponse.json({ error: "Each item must have a 'name' (string)" }, { status: 400 });
        }
        if (item.index !== undefined && typeof item.index !== "number") {
          return NextResponse.json({ error: "'index' must be a number" }, { status: 400 });
        }
      }

      const indexItems = body.items.filter((item: { index?: number }) => item.index !== undefined);
      const nameItems = body.items.filter((item: { index?: number }) => item.index === undefined);

      for (const item of indexItems) {
        await s7Service.writeByIndex(item.name, item.index, item.value);
      }

      if (nameItems.length > 0) {
        await s7Service.writeByName(
          nameItems.map((item: { name: string; value: unknown }) => ({
            name: item.name,
            value: item.value,
          }))
        );
      }

      return createSuccessResponse(
        { count: body.items.length },
        `Wrote ${body.items.length} value(s)`
      );
    }

    // Write by raw address
    if (body.addresses) {
      if (!Array.isArray(body.addresses)) {
        return NextResponse.json({ error: "'addresses' must be an array" }, { status: 400 });
      }
      for (const item of body.addresses) {
        if (typeof item.address !== "string") {
          return NextResponse.json({ error: "Each address item must have an 'address' (string)" }, { status: 400 });
        }
      }

      await s7Service.writeByAddress(
        body.addresses.map((item: { address: string; value: unknown }) => ({
          address: item.address,
          value: item.value,
        }))
      );
      return createSuccessResponse(
        { count: body.addresses.length },
        `Wrote ${body.addresses.length} value(s)`
      );
    }

    return NextResponse.json(
      { error: "Provide 'items' or 'addresses'" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(message);
  }
}
