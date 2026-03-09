/**
 * HMI Data API Route
 *
 * GET /api/hmi/data - Get current HMI data (Line and Stations)
 * Returns the current state from HMI Manager
 */

import { NextResponse } from "next/server";
import { HMILocator } from "@/lib/hmi-locator";
import opcuaService from "@/lib/opcua-service";
import { Cylinder } from "@/lib/domain/cylinder";
import { Motor } from "@/lib/domain/motor";
import { Valve } from "@/lib/domain/valve";
import { Sensor } from "@/lib/domain/sensor";
import { Robot } from "@/lib/domain/robot";
import { Conveyor } from "@/lib/domain/conveyor";
import { Drive } from "@/lib/domain/drive";

export async function GET() {
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

    // Also verify OPC UA is connected (heartbeat may have disconnected)
    const isOpcuaConnected = await opcuaService.verifyConnection();
    if (!isOpcuaConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "OPC UA not connected",
        },
        { status: 503 }
      );
    }

    // Get line data - manually serialize to avoid circular references
    const line = HMILocator.getLine();
    const lineData = {
      name: line.name,
      status: line.status,
      mode: line.mode,
      partsOK: line.partsOK,
      partsNOK: line.partsNOK,
      totalParts: line.getTotalParts(),
      efficiency: line.getEfficiency(),
      scrapRate: line.getScrapRate(),
      // Serialize order object properties to avoid circular references
      order: line.order ? {
        type: line.order.type,
        quantity: line.order.quantity,
        contract: line.order.contract,
      } : null,
    };

    // Get stations data - manually serialize to avoid circular references
    const stations = HMILocator.getAllStations().map(station => {
      const stationDevices = station.getDevices();
      return {
        id: station.id,
        name: station.name,
        status: station.status,
        warning: station.warning,
        message: station.message,
        mode: station.mode,
        partsOK: station.partsOK,
        partsNOK: station.partsNOK,
        disabled: station.disabled,
        efficiency: station.getEfficiency(),
        deviceCount: stationDevices.length,
        devices: stationDevices.map(device => {
          // Base properties shared by all devices
          const baseData = {
            id: device.id,
            stationId: station.id,
            name: device.name,
            type: device.type,
            status: device.status,
            details: device.details,
          };

          // Use type guards to add type-specific properties
          // Only serialize properties that actually exist in the domain models
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
        }),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        line: lineData,
        stations: stations,
      },
    });
  } catch (error) {
    console.error("Failed to get HMI data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
