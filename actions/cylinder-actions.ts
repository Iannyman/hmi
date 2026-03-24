"use server";

/**
 * Cylinder Server Actions
 *
 * These actions run on the server and can be called directly from client components.
 * They handle cylinder operations by calling domain methods.
 */

import { HMILocator } from "@/lib/hmi-locator";

export async function moveToWorkPosition(stationId: string, cylinderId: string, value: boolean) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const cylinder = station.getDevice(cylinderId);
  if (!cylinder || cylinder.type !== 'cylinder') {
    return { success: false, error: "Cylinder not found" };
  }

  await (cylinder as any).moveToWorkPosition(value);
  return { success: true };
}


export async function moveToHomePosition(stationId: string, cylinderId: string, value: boolean) {
  const station = HMILocator.getStation(stationId);
  if (!station) {
    return { success: false, error: "Station not found" };
  }

  const cylinder = station.getDevice(cylinderId);
  if (!cylinder || cylinder.type !== 'cylinder') {
    return { success: false, error: "Cylinder not found" };
  }

  await (cylinder as any).moveToHomePosition(value);
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
