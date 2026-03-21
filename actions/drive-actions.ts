"use server";

/**
 * Drive Server Actions
 *
 * These actions run on the server and can be called directly from client components.
 * They handle drive operations by calling domain methods.
 */

import { HMILocator } from "@/lib/hmi-locator";

export async function startJogPositive(stationId: string, driveId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as any).startJogPositive();
  return { success: true };
}

export async function stopJogPositive(stationId: string, driveId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as any).stopJogPositive();
  return { success: true };
}

export async function startJogNegative(stationId: string, driveId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as any).startJogNegative();
  return { success: true };
}

export async function stopJogNegative(stationId: string, driveId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as any).stopJogNegative();
  return { success: true };
}

export async function startHoming(stationId: string, driveId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as any).startHomming();
  return { success: true };
}

export async function stopHoming(stationId: string, driveId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as any).stopHomming();
  return { success: true };
}

export async function startPositioning(stationId: string, driveId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as any).startPosition();
  return { success: true };
}

export async function stopPositioning(stationId: string, driveId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const drive = station.getDevice(driveId);
  if (!drive || drive.type !== 'drive') {
    return { success: false, error: "Drive not found" };
  }

  await (drive as any).stopPosition();
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

  await (drive as any).setPositionIndex(index);
  return { success: true };
}
