/**
 * S7 Address Map API Route
 *
 * GET /api/s7/address-map — Return the current address map
 */

import s7Service from "@/lib/server/s7-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/server/s7-errors";

export async function GET() {
  try {
    const entries = s7Service.getAddressEntries();
    return createSuccessResponse({
      count: entries.length,
      entries,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(message);
  }
}
