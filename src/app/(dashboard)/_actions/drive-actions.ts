"use server";

/**
 * Drive Server Actions
 *
 * These actions run on the server and can be called directly from client components.
 * They handle drive operations by calling domain methods.
 */

import { HMILocator } from "@/lib/server";
import { Drive } from "@/lib/domain/drive";

export async function jogPositive(stationId: string, driveId: string, value: boolean) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as Drive).jogPositive(value);
  return { success: true };
}

export async function jogNegative(stationId: string, driveId: string, value: boolean) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as Drive).jogNegative(value);
  return { success: true };
}

export async function startHoming(stationId: string, driveId: string, value: boolean) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as Drive).startHomming(value);
  return { success: true };
}

export async function startPositioning(stationId: string, driveId: string, value: boolean) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as Drive).startPosition(value);
  return { success: true };
}

export async function setPositionIndex(stationId: string, driveId: string, index: number) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as Drive).setPositionIndex(index);
  return { success: true };
}
