/**
 * Alarm Manager
 *
 * Central manager for handling alarm generation from device errors.
 * Listens to device error events and creates Alarm objects dynamically.
 */

import { EventEmitter } from "events";
import { HMIManager } from "./hmi-manager";
import { Alarm } from "@/types/alarm.types";

export interface DeviceErrorEvent {
  stationId: string;
  deviceId: string;
  deviceName: string;
  errorMessage: string;
}

export class AlarmManager extends EventEmitter {
  private alarms: Map<string, Alarm> = new Map();
  private hmiManager: HMIManager;
  private isInitialized: boolean = false;

  constructor(hmiManager: HMIManager) {
    super();
    this.hmiManager = hmiManager;
  }

  /**
   * Initialize the alarm manager
   * Sets up listeners for device error events
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("[AlarmManager] Already initialized");
      return;
    }

    console.log("[AlarmManager] Initializing...");

    // Wait for HMI to be ready
    if (!this.hmiManager.isReady()) {
      console.log("[AlarmManager] Waiting for HMI initialization...");
      await new Promise<void>((resolve) => {
        this.hmiManager.onInitialized(() => resolve());
      });
    }

    // Set up error listeners for all existing stations and devices
    this.setupErrorListeners();

    // Listen for new stations/devices being added
    this.hmiManager.onDeviceAdded(({ stationId, device }) => {
      console.log(`[AlarmManager] Setting up error listener for new device: ${stationId}.${device.id}`);
      this.setupDeviceErrorListener(stationId, device);
    });

    this.isInitialized = true;
    console.log("[AlarmManager] Initialized successfully");

    // Scan for existing errors after initialization
    // This captures any errors that existed before the AlarmManager started listening
    this.scanForExistingErrors();
  }

  /**
   * Scan all devices for existing errors and create alarms
   * Called after initialization to capture pre-existing error states
   */
  private scanForExistingErrors(): void {
    console.log("[AlarmManager] Scanning for existing errors...");
    const stations = this.hmiManager.getAllStations();
    let foundErrors = 0;

    for (const station of stations) {
      const devices = station.getDevices();

      for (const device of devices) {
        // Check if this is a Cylinder and has an error
        if (device.type === "cylinder" && device.errorMessage && device.errorMessage !== "") {
          const errorData: DeviceErrorEvent = {
            stationId: station.id,
            deviceId: device.id,
            deviceName: (device as any).getName?.() || device.id,
            errorMessage: device.errorMessage,
          };
          this.createAlarm(errorData);
          foundErrors++;
        }
      }
    }

    console.log(`[AlarmManager] Scan complete: found ${foundErrors} existing errors`);
  }

  /**
   * Set up error listeners for all existing devices
   */
  private setupErrorListeners(): void {
    const stations = this.hmiManager.getAllStations();

    for (const station of stations) {
      const devices = station.getDevices();

      for (const device of devices) {
        this.setupDeviceErrorListener(station.id, device);
      }
    }

    console.log(`[AlarmManager] Set up error listeners for ${stations.length} stations`);
  }

  /**
   * Set up error listener for a single device
   */
  private setupDeviceErrorListener(stationId: string, device: any): void {
    // Listen to error events from device
    device.on("error", (errorData: DeviceErrorEvent) => {
      console.log(`[AlarmManager] Error received from ${errorData.deviceId}:`, errorData.errorMessage);
      this.createAlarm(errorData);
    });
  }

  /**
   * Create an alarm from a device error event
   */
  private createAlarm(errorData: DeviceErrorEvent): void {
    const alarmId = `${errorData.deviceId}-${Date.now()}`;

    const alarm: Alarm = {
      id: alarmId,
      title: `${errorData.deviceName} Error`,
      description: errorData.errorMessage,
      severity: "critical",
      device: errorData.deviceName,
      deviceId: errorData.deviceId,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      acknowledged: false,
    };

    this.alarms.set(alarmId, alarm);
    console.log(`[AlarmManager] Alarm created: ${alarmId} - ${alarm.title}`);

    this.emit("alarm:added", alarm);
  }

  /**
   * Get all current alarms
   */
  getAlarms(): Alarm[] {
    return Array.from(this.alarms.values());
  }

  /**
   * Get unacknowledged alarms
   */
  getUnacknowledgedAlarms(): Alarm[] {
    return this.getAlarms().filter((a) => !a.acknowledged);
  }

  /**
   * Acknowledge an alarm
   */
  acknowledgeAlarm(alarmId: string): void {
    const alarm = this.alarms.get(alarmId);
    if (alarm) {
      alarm.acknowledged = true;
      alarm.acknowledgedBy = "Operator";
      alarm.acknowledgedAt = new Date().toISOString().replace("T", " ").substring(0, 19);
      console.log(`[AlarmManager] Alarm acknowledged: ${alarmId}`);
      this.emit("alarm:acknowledged", alarm);
    }
  }

  /**
   * Clear acknowledged alarms (removes them from the list)
   */
  clearAcknowledgedAlarms(): void {
    const before = this.alarms.size;
    for (const [id, alarm] of this.alarms) {
      if (alarm.acknowledged) {
        this.alarms.delete(id);
      }
    }
    const cleared = before - this.alarms.size;
    if (cleared > 0) {
      console.log(`[AlarmManager] Cleared ${cleared} acknowledged alarms`);
    }
  }

  /**
   * Reset the alarm manager
   * Clears all alarms and removes all listeners
   */
  reset(): void {
    console.log("[AlarmManager] Resetting...");
    this.alarms.clear();
    this.removeAllListeners();
    this.isInitialized = false;
    console.log("[AlarmManager] Reset complete");
  }

  // Event subscription helpers

  /**
   * Subscribe to alarm added events
   */
  onAlarmAdded(callback: (alarm: Alarm) => void): void {
    this.on("alarm:added", callback);
  }

  /**
   * Subscribe to alarm acknowledged events
   */
  onAlarmAcknowledged(callback: (alarm: Alarm) => void): void {
    this.on("alarm:acknowledged", callback);
  }

  /**
   * Unsubscribe from alarm added events
   */
  offAlarmAdded(callback: (alarm: Alarm) => void): void {
    this.off("alarm:added", callback);
  }

  /**
   * Unsubscribe from alarm acknowledged events
   */
  offAlarmAcknowledged(callback: (alarm: Alarm) => void): void {
    this.off("alarm:acknowledged", callback);
  }
}
