"use server";

/**
 * Cylinder Server Actions
 *
 * These actions run on the server and can be called directly from client components.
 * They handle cylinder operations by calling domain methods.
 */

import { HMILocator } from "@/lib/hmi-locator";

export async function startMoveToWorkPosition(stationId: string, cylinderId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const cylinder = station.getDevice(cylinderId);
  if (!cylinder || cylinder.type !== 'cylinder') {
    return { success: false, error: "Cylinder not found" };
  }

  await (cylinder as any).startMoveToWorkPosition();
  return { success: true };
}

export async function stopMoveToWorkPosition(stationId: string, cylinderId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const cylinder = station.getDevice(cylinderId);
  if (!cylinder || cylinder.type !== 'cylinder') {
    return { success: false, error: "Cylinder not found" };
  }

  await (cylinder as any).stopMoveToWorkPosition();
  return { success: true };
}

export async function startMoveToHomePosition(stationId: string, cylinderId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const cylinder = station.getDevice(cylinderId);
  if (!cylinder || cylinder.type !== 'cylinder') {
    return { success: false, error: "Cylinder not found" };
  }

  await (cylinder as any).startMoveToHomePosition();
  return { success: true };
}

export async function stopMoveToHomePosition(stationId: string, cylinderId: string) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const cylinder = station.getDevice(cylinderId);
  if (!cylinder || cylinder.type !== 'cylinder') {
    return { success: false, error: "Cylinder not found" };
  }

  await (cylinder as any).stopMoveToHomePosition();
  return { success: true };
}

export async function setTimeout(stationId: string, cylinderId: string, timeout: number) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const cylinder = station.getDevice(cylinderId);
  if (!cylinder || cylinder.type !== 'cylinder') {
    return { success: false, error: "Cylinder not found" };
  }

  await (cylinder as any).setTimeout(timeout);
  return { success: true };
}
