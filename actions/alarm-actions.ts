"use server";

/**
 * Alarm Server Actions
 *
 * These actions run on the server and can be called directly from client components.
 * They handle alarm operations by calling the AlarmLocator.
 */

import { AlarmLocator } from "@/lib/alarm-locator";
import { Alarm } from "@/types/alarm.types";
import { acknowledgeLineErrors } from "./line-actions";

/**
 * Get all current alarms
 * Returns the list of alarms from Alarm Manager
 */
export async function getAlarms(): Promise<{ success: boolean; data?: Alarm[]; error?: string }> {
  try {
    // Check if Alarm Manager is initialized
    if (!AlarmLocator.isReady()) {
      return {
        success: false,
        error: "Alarm Manager not initialized",
      };
    }

    const alarms = AlarmLocator.getAlarms();

    return {
      success: true,
      data: alarms,
    };
  } catch (error) {
    console.error("[Get Alarms Action] Failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Acknowledge an alarm
 * Also sends acknowledge signal to the PLC
 * @param alarmId - The ID of the alarm to acknowledge
 */
export async function acknowledgeAlarm(alarmId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Alarm Manager is initialized
    if (!AlarmLocator.isReady()) {
      return {
        success: false,
        error: "Alarm Manager not initialized",
      };
    }

    if (!alarmId) {
      return {
        success: false,
        error: "Missing alarmId parameter",
      };
    }

    // Acknowledge the alarm in the AlarmManager
    AlarmLocator.acknowledgeAlarm(alarmId);

    // Send acknowledge signal to the PLC
    const lineResult = await acknowledgeLineErrors(true);
    if (!lineResult.success) {
      console.warn("[Acknowledge Alarm Action] Failed to acknowledge line errors:", lineResult.error);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("[Acknowledge Alarm Action] Failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Acknowledge all unacknowledged alarms
 * Also sends acknowledge signal to the PLC once
 */
export async function acknowledgeAllAlarms(): Promise<{ success: boolean; acknowledgedCount?: number; error?: string }> {
  try {
    // Check if Alarm Manager is initialized
    if (!AlarmLocator.isReady()) {
      return {
        success: false,
        error: "Alarm Manager not initialized",
      };
    }

    // Get all unacknowledged alarms
    const alarms = AlarmLocator.getAlarms();
    const unacknowledgedAlarms = alarms.filter((a) => !a.acknowledged);

    // Acknowledge all unacknowledged alarms
    for (const alarm of unacknowledgedAlarms) {
      AlarmLocator.acknowledgeAlarm(alarm.id);
    }

    // Send acknowledge signal to the PLC once (not per alarm)
    const lineResult = await acknowledgeLineErrors(true);
    if (!lineResult.success) {
      console.warn("[Acknowledge All Alarms Action] Failed to acknowledge line errors:", lineResult.error);
    }

    return {
      success: true,
      acknowledgedCount: unacknowledgedAlarms.length,
    };
  } catch (error) {
    console.error("[Acknowledge All Alarms Action] Failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Clear acknowledged alarms from history
 * Removes all acknowledged alarms from the list
 */
export async function clearAlarmHistory(): Promise<{ success: boolean; clearedCount?: number; error?: string }> {
  try {
    // Check if Alarm Manager is initialized
    if (!AlarmLocator.isReady()) {
      return {
        success: false,
        error: "Alarm Manager not initialized",
      };
    }

    // Get acknowledged alarms count before clearing
    const alarms = AlarmLocator.getAlarms();
    const acknowledgedCount = alarms.filter((a) => a.acknowledged).length;

    // Clear acknowledged alarms
    AlarmLocator.clearAcknowledgedAlarms();

    return {
      success: true,
      clearedCount: acknowledgedCount,
    };
  } catch (error) {
    console.error("[Clear Alarm History Action] Failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message,
    };
  }
}
