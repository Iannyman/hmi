"use server";

/**
 * Station Server Actions
 *
 * These actions run on the server and can be called directly from client components.
 * They handle station operations by calling domain methods.
 */

import { HMILocator } from "@/lib/server";
import { StationMode } from "@/types/station.types";
/**
 * Set the station mode
 * @param stationId - The ID of the station
 * @param mode - The mode to set (auto, setup, init, end, home, or error)
 */
export async function setStationMode(stationId: string, mode: StationMode) {
  // Validate mode
  if (!["auto", "setup", "init", "end", "home", "error"].includes(mode)) {
    return { success: false, error: "Invalid mode. Must be: auto, setup, init, end, home, or error" };
  }

  try {
    const station = HMILocator.getStation(stationId);
    if (!station) {
      return { success: false, error: `Station ${stationId} not found` };
    }

    await station.setMode(mode);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Station Mode Action] Failed for ${stationId}:`, error);
    return { success: false, error: message };
  }
}

/**
 * Reset station statistics
 * @param stationId - The ID of the station
 * @param value - true to activate, false to deactivate
 * Clears all production counters and statistics for the station
 */
export async function resetStationStatistics(stationId: string, value: boolean) {
  try {
    const station = HMILocator.getStation(stationId);
    if (!station) {
      return { success: false, error: `Station ${stationId} not found` };
    }

    await station.resetStatistics(value);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Station Reset Statistics Action] Failed for ${stationId}:`, error);
    return { success: false, error: message };
  }
}

/**
 * Toggle station enabled/disabled state
 * @param stationId - The ID of the station
 * If station is disabled, enables it
 * If station is enabled, disables it
 */
export async function toggleStation(stationId: string) {
  try {
    const station = HMILocator.getStation(stationId);
    if (!station) {
      return { success: false, error: `Station ${stationId} not found` };
    }
    
    if (station.disabled) {
      await station.enable();
    } else {
      await station.disable();
    }
    
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Station Toggle Action] Failed for ${stationId}:`, error);
    return { success: false, error: message };
  }
}