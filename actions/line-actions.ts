"use server";

/**
 * Line Server Actions
 *
 * These actions run on the server and can be called directly from client components.
 * They handle line operations by calling domain methods.
 */

import { HMILocator } from "@/lib/hmi-locator";

export type LineMode = "auto" | "setup" | "init";

/**
 * Set the line mode
 * @param mode - The mode to set (auto, setup, or init)
 */
export async function setLineMode(mode: LineMode) {
  // Validate mode
  if (!["auto", "setup", "init"].includes(mode)) {
    return { success: false, error: "Invalid mode. Must be: auto, setup, or init" };
  }

  try {
    const line = HMILocator.getLine();
    await line.setMode(mode);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Line Mode Action] Failed:", error);
    return { success: false, error: message };
  }
}

/**
 * Reset line statistics 
 * @param value - true to activate, false to deactivate
 * Reset statistics of line
 */
export async function resetStatistics(value: boolean) {
  try {
    const line = HMILocator.getLine();
    await line.resetStatistics(value);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Line Reset Statistics Action] Failed:", error);
    return { success: false, error: message };
  }
}

/**
 * Acknowledge line errors
 * @param value - true to activate, false to deactivate
 * Clears all active errors on the line
 */
export async function acknowledgeLineErrors(value: boolean) {
  try {
    const line = HMILocator.getLine();
    await line.acknowledgeErrors(value);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Line Acknowledge Errors Action] Failed:", error);
    return { success: false, error: message };
  }
}