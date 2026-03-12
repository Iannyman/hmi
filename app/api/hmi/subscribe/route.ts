/**
 * HMI Route Subscription API Route
 *
 * POST /api/hmi/subscribe - Subscribe to route-specific OPC UA nodes
 * Implements route-based lazy subscriptions for optimal performance
 *
 * Routes:
 * - /dashboard: Line + Order + Stations.Control data only
 * - /devices?station=X: Devices for station X only
 */

import { NextResponse } from "next/server";
import { HMILocator } from "@/lib/hmi-locator";

export async function POST(request: Request) {
  try {
    // Check if HMI Manager is initialized
    if (!HMILocator.isReady()) {
      return NextResponse.json(
        {
          success: false,
          error: "HMI Manager not initialized",
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { route, stationId } = body;

    if (!route) {
      return NextResponse.json(
        {
          success: false,
          error: "Route is required",
        },
        { status: 400 }
      );
    }

    console.log(`[API /hmi/subscribe] Subscribing to route: ${route}${stationId ? ` (${stationId})` : ""}`);

    // Get HMI Manager and subscribe to route
    const hmi = HMILocator.getInstance();
    await hmi.subscribeToRoute(route, stationId);

    // Get current route state
    const currentRouteState = hmi.getCurrentRoute();

    return NextResponse.json({
      success: true,
      data: {
        route: currentRouteState.route,
        stationId: currentRouteState.stationId,
      },
    });
  } catch (error) {
    console.error("[API /hmi/subscribe] Failed to subscribe to route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/hmi/subscribe - Get current route subscription state
 */
export async function GET() {
  try {
    if (!HMILocator.isReady()) {
      return NextResponse.json(
        {
          success: false,
          error: "HMI Manager not initialized",
        },
        { status: 503 }
      );
    }

    const hmi = HMILocator.getInstance();
    const currentRouteState = hmi.getCurrentRoute();

    return NextResponse.json({
      success: true,
      data: {
        route: currentRouteState.route,
        stationId: currentRouteState.stationId,
      },
    });
  } catch (error) {
    console.error("[API /hmi/subscribe] Failed to get route state:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
