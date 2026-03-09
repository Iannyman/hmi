/**
 * HMI Reset API Route
 *
 * POST /api/hmi/reset - Reset HMI Manager state
 * Clears all subscriptions and prepares for re-initialization
 */

import { NextRequest, NextResponse } from "next/server";
import { HMILocator } from "@/lib/hmi-locator";

export async function POST() {
  try {
    console.log("Resetting HMI Manager...");
    await HMILocator.reset();

    return NextResponse.json({
      success: true,
      message: "HMI Manager reset successfully",
    });
  } catch (error) {
    console.error("Failed to reset HMI Manager:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
