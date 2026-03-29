/**
 * Device DTO Types
 *
 * Discriminated union types for device data transfer between server and client.
 * Uses the `type` field as the discriminator for proper type safety.
 * Reuses existing types from device.types.ts for consistency.
 */

import { DeviceStatus } from "./device.types";
import { MotorData, SensorData, RobotData, ConveyorData, DriveData, CylinderData } from "./device.types";

// Discriminated union - each device type follows the same pattern
// DeviceBase properties (id, stationId, name, type, status, details) are implicitly included via intersection
export type DeviceDTO =
  | ({ id: string; stationId: string; name: string; type: "motor"; status: DeviceStatus; details: string } & MotorData)
  | ({ id: string; stationId: string; name: string; type: "sensor"; status: DeviceStatus; details: string } & SensorData)
  | ({ id: string; stationId: string; name: string; type: "robot"; status: DeviceStatus; details: string } & RobotData)
  | ({ id: string; stationId: string; name: string; type: "conveyor"; status: DeviceStatus; details: string } & ConveyorData)
  | ({ id: string; stationId: string; name: string; type: "drive"; status: DeviceStatus; details: string } & DriveData)
  | ({ id: string; stationId: string; name: string; type: "cylinder"; status: DeviceStatus; details: string } & CylinderData);
