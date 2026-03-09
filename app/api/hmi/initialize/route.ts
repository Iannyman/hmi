/**
 * HMI Initialize API Route
 *
 * Initializes the HMI system by browsing the OPC UA structure
 * and creating all domain objects (Line, Stations, Devices).
 */

import { NextRequest, NextResponse } from "next/server";
import { HMILocator } from "@/lib/hmi-locator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { browseTree } = body;

    if (!browseTree) {
      return NextResponse.json(
        { success: false, error: "Missing browseTree parameter" },
        { status: 400 }
      );
    }

    console.log("Initializing HMI system with browse tree...");
    await HMILocator.initialize(browseTree);

    const hmi = HMILocator.getInstance();
    return NextResponse.json({
      success: true,
      data: {
        isInitialized: hmi.isReady(),
        stationCount: hmi.getStationCount(),
      },
    });
  } catch (error) {
    console.error("Failed to initialize HMI:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
