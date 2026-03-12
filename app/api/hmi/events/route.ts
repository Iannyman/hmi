/**
 * HMI Server-Sent Events (SSE) Endpoint
 *
 * GET /api/hmi/events - Stream real-time HMI updates
 *
 * This endpoint streams subscription updates from the HMI Manager to the client.
 * Provides instant updates when OPC UA subscription data changes.
 * Also streams alarm events from the AlarmManager for real-time notifications.
 */

import { NextRequest } from "next/server";
import { HMILocator } from "@/lib/hmi-locator";
import { AlarmLocator } from "@/lib/alarm-locator";
import { Cylinder } from "@/lib/domain/cylinder";
import { Motor } from "@/lib/domain/motor";
import { Valve } from "@/lib/domain/valve";
import { Sensor } from "@/lib/domain/sensor";
import { Robot } from "@/lib/domain/robot";
import { Conveyor } from "@/lib/domain/conveyor";
import { Drive } from "@/lib/domain/drive";
import type { Alarm } from "@/types/alarm.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Helper function to serialize device data with type-specific properties
 */
function serializeDevice(device: any, stationId: string) {
  // Base properties shared by all devices
  const baseData = {
    id: device.id,
    stationId: stationId,
    name: device.name,
    type: device.type,
    status: device.status,
    details: device.details,
  };

  // Use type guards to add type-specific properties
  if (device instanceof Cylinder) {
    return {
      ...baseData,
      model: device.model,
      inWorkPosition: device.inWorkPosition,
      inHomePosition: device.inHomePosition,
      enabled: device.enabled,
      enableHomePosition: device.enableHomePosition,
      enableWorkPosition: device.enableWorkPosition,
      errorMessage: device.errorMessage,
      toHomePosition: device.toHomePosition,
      toWorkPosition: device.toWorkPosition,
      timeout: device.timeout,
    };
  }

  if (device instanceof Motor) {
    return {
      ...baseData,
      speed: device.speed,
      maxSpeed: device.maxSpeed,
      current: device.current,
      maxCurrent: device.maxCurrent,
      power: device.power,
      temperature: device.temperature,
      load: device.load,
    };
  }

  if (device instanceof Valve) {
    return {
      ...baseData,
      position: device.position,
      positionPercent: device.positionPercent,
      pressure: device.pressure,
      flowRate: device.flowRate,
      actuatorStatus: device.actuatorStatus,
    };
  }

  if (device instanceof Sensor) {
    return {
      ...baseData,
      value: device.value,
      unit: device.unit,
      min: device.min,
      max: device.max,
      avg: device.avg,
      alarmThreshold: device.alarmThreshold,
    };
  }

  if (device instanceof Robot) {
    return {
      ...baseData,
      mode: device.mode,
      program: device.program,
      programNumber: device.programNumber,
      cycle: device.cycle,
      totalCycles: device.totalCycles,
      timeRemaining: device.timeRemaining,
      axisPositions: device.axisPositions,
    };
  }

  if (device instanceof Conveyor) {
    return {
      ...baseData,
      speed: device.speed,
      direction: device.direction,
      materialCount: device.materialCount,
      capacity: device.capacity,
      loadPercentage: device.loadPercentage,
      length: device.length,
    };
  }

  if (device instanceof Drive) {
    return {
      ...baseData,
      frequency: device.frequency,
      torque: device.torque,
      powerFactor: device.powerFactor,
      voltage: device.voltage,
      current: device.current,
      faultCode: device.faultCode,
      faultHistory: device.faultHistory,
    };
  }

  // Fallback for unknown device types
  return baseData;
}

/**
 * SSE Event Stream Handler
 */
export async function GET(request: NextRequest) {
  // Check if HMI Manager is initialized
  if (!HMILocator.isReady()) {
    return new Response("HMI Manager not initialized", { status: 503 });
  }

  const hmi = HMILocator.getInstance();

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      console.log("[SSE] Client connected");

      // Helper to send SSE events
      const sendEvent = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial connection message
      sendEvent("connected", { message: "SSE connection established", timestamp: Date.now() });

      // Subscribe to Line updates
      const onLineUpdated = (line: any) => {
        sendEvent("line:updated", {
          name: line.name,
          status: line.status,
          mode: line.mode,
          partsOK: line.partsOK,
          partsNOK: line.partsNOK,
          totalParts: line.getTotalParts(),
          efficiency: line.getEfficiency(),
          scrapRate: line.getScrapRate(),
        });
      };

      // Subscribe to Station updates
      const onStationUpdated = (station: any) => {
        const stationDevices = station.getDevices();
        sendEvent("station:updated", {
          id: station.id,
          name: station.name,
          status: station.status,
          mode: station.mode,
          warning: station.warning,
          message: station.message,
          partsOK: station.partsOK,
          partsNOK: station.partsNOK,
          disabled: station.disabled,
          efficiency: station.getEfficiency(),
          devices: stationDevices.map((d: any) => serializeDevice(d, station.id)),
        });
      };

      // Subscribe to Device updates (when devices are subscribed on a specific station)
      const onDeviceUpdated = ({ stationId, device }: { stationId: string; device: any }) => {
        sendEvent("device:updated", {
          stationId,
          device: serializeDevice(device, stationId),
        });
      };

      // Subscribe to Alarm events
      const onAlarmAdded = (alarm: Alarm) => {
        console.log(`[SSE] Alarm added: ${alarm.id}`);
        sendEvent("alarm:added", alarm);
      };

      const onAlarmAcknowledged = (alarm: Alarm) => {
        console.log(`[SSE] Alarm acknowledged: ${alarm.id}`);
        sendEvent("alarm:acknowledged", alarm);
      };

      // Register HMI event listeners
      hmi.on("line:updated", onLineUpdated);
      hmi.on("station:updated", onStationUpdated);
      hmi.on("device:updated", onDeviceUpdated);

      // Register Alarm event listeners (if AlarmManager is initialized)
      if (AlarmLocator.isReady()) {
        const alarmManager = AlarmLocator.getInstance();
        alarmManager.on("alarm:added", onAlarmAdded);
        alarmManager.on("alarm:acknowledged", onAlarmAcknowledged);
        console.log("[SSE] Alarm event listeners registered");
      }

      // Send initial data
      try {
        const line = hmi.getLine();
        onLineUpdated(line);

        const stations = hmi.getAllStations();
        stations.forEach(onStationUpdated);
      } catch (err) {
        console.error("[SSE] Error sending initial data:", err);
      }

      // Keep-alive: send a comment every 30 seconds to prevent timeout
      const keepAliveInterval = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 30000);

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        console.log("[SSE] Client disconnected");

        // Remove HMI event listeners
        hmi.off("line:updated", onLineUpdated);
        hmi.off("station:updated", onStationUpdated);
        hmi.off("device:updated", onDeviceUpdated);

        // Remove Alarm event listeners (if AlarmManager is initialized)
        if (AlarmLocator.isReady()) {
          const alarmManager = AlarmLocator.getInstance();
          alarmManager.off("alarm:added", onAlarmAdded);
          alarmManager.off("alarm:acknowledged", onAlarmAcknowledged);
        }

        // Clear keep-alive interval
        clearInterval(keepAliveInterval);

        controller.close();
      });
    },
  });

  // Return SSE stream with appropriate headers
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
