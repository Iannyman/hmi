/**
 * Alarm Service Locator
 *
 * Provides access to the AlarmManager singleton with explicit initialization.
 * Uses globalThis for cross-context sharing (required for Next.js Server Actions).
 *
 * Usage:
 * 1. Initialize once: await AlarmLocator.initialize(hmiManager)
 * 2. Get instance: const alarmManager = AlarmLocator.getInstance()
 * 3. Check ready: if (AlarmLocator.isReady()) ...
 */

import { AlarmManager } from "./alarm-manager";
import { HMIManager } from "./hmi-manager";

// Type declaration for the global property
declare global {
  // eslint-disable-next-line no-var
  var __ALARM_MANAGER_INSTANCE__: AlarmManager | undefined;
}

class AlarmLocator {
  private static isInitializing: boolean = false;

  /**
   * Initialize the Alarm Manager
   * Must be called before getInstance()
   * @param hmiManager - The HMI Manager instance
   * @returns The existing instance if already initialized, or a new instance
   */
  static async initialize(hmiManager: HMIManager): Promise<AlarmManager> {
    // Return existing instance if already initialized (supports multiple clients)
    if (global.__ALARM_MANAGER_INSTANCE__) {
      return global.__ALARM_MANAGER_INSTANCE__;
    }

    if (this.isInitializing) {
      throw new Error("Alarm Manager is already being initialized");
    }

    this.isInitializing = true;

    try {
      const instance = new AlarmManager(hmiManager);
      await instance.initialize();

      // Store in globalThis for cross-context sharing
      global.__ALARM_MANAGER_INSTANCE__ = instance;
      return instance;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Get the Alarm Manager instance
   * @throws Error if not initialized
   */
  static getInstance(): AlarmManager {
    const instance = global.__ALARM_MANAGER_INSTANCE__;
    if (!instance) {
      throw new Error(
        "Alarm Manager not initialized. Call AlarmLocator.initialize(hmiManager) first."
      );
    }
    return instance;
  }

  /**
   * Check if Alarm Manager is ready
   */
  static isReady(): boolean {
    const instance = global.__ALARM_MANAGER_INSTANCE__;
    return instance !== undefined;
  }

  /**
   * Reset the Alarm Manager
   * Clears the instance and allows re-initialization
   */
  static reset(): void {
    const instance = global.__ALARM_MANAGER_INSTANCE__;
    if (instance) {
      instance.reset();
      global.__ALARM_MANAGER_INSTANCE__ = undefined;
    }
  }

  /**
   * Get all alarms (convenience method)
   */
  static getAlarms() {
    return this.getInstance().getAlarms();
  }

  /**
   * Acknowledge an alarm (convenience method)
   */
  static acknowledgeAlarm(alarmId: string) {
    return this.getInstance().acknowledgeAlarm(alarmId);
  }

  /**
   * Clear acknowledged alarms (convenience method)
   */
  static clearAcknowledgedAlarms() {
    return this.getInstance().clearAcknowledgedAlarms();
  }
}

export { AlarmLocator };
