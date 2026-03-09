/**
 * OPC UA Subscription API Route
 *
 * POST /api/opcua/subscribe - Create a subscription
 * DELETE /api/opcua/subscribe - Remove a subscription
 * GET /api/opcua/subscribe - Get active subscriptions
 *
 * Body for POST:
 * {
 *   "subscriptionName": "mySubscription",
 *   "nodeIds": ["ns=2;s=Variable1", "ns=2;s=Variable2"],
 *   "samplingInterval": 1000  // optional, default 1000ms
 * }
 *
 * Body for DELETE:
 * {
 *   "subscriptionName": "mySubscription"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import opcuaService from "@/lib/opcua-service";
import { handleServiceError, validateRequired, validateArray } from "@/lib/opcua-errors";

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

    // Validate required fields
    validateRequired(body.subscriptionName, "subscriptionName");
    validateArray(body.nodeIds, "nodeIds");

    const samplingInterval = body.samplingInterval || 1000;

    // Create subscription with callback that logs changes
    await opcuaService.createSubscription(
      body.subscriptionName,
      body.nodeIds,
      (dataValue: any) => {
        // Log subscription updates (can be replaced with custom logic)
        console.log(`Subscription "${body.subscriptionName}" update:`, {
          nodeId: dataValue.nodeId?.toString(),
          value: dataValue.value?.value,
          statusCode: dataValue.statusCode?.toString(),
        });
      },
      samplingInterval
    );

    return NextResponse.json({
      success: true,
      message: "Subscription created",
      subscriptionName: body.subscriptionName,
      nodeIds: body.nodeIds,
      samplingInterval,
    });
  } catch (error) {
    const handledError = handleServiceError(error, "subscribe");
    return NextResponse.json(
      {
        error: "Failed to create subscription",
        details: handledError instanceof Error ? handledError.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    validateRequired(body.subscriptionName, "subscriptionName");

    await opcuaService.removeSubscription(body.subscriptionName);

    return NextResponse.json({
      success: true,
      message: "Subscription removed",
      subscriptionName: body.subscriptionName,
    });
  } catch (error) {
    const handledError = handleServiceError(error, "unsubscribe");
    return NextResponse.json(
      {
        error: "Failed to remove subscription",
        details: handledError instanceof Error ? handledError.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const activeSubscriptions = opcuaService.getActiveSubscriptions();

    return NextResponse.json({
      activeSubscriptions,
    });
  } catch (error) {
    const handledError = handleServiceError(error, "getSubscriptions");
    return NextResponse.json(
      {
        error: "Failed to get active subscriptions",
        details: handledError instanceof Error ? handledError.message : String(error),
      },
      { status: 500 }
    );
  }
}
