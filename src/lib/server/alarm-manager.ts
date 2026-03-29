/**
 * Alarm Manager
 *
 * Central manager for handling alarm generation from device errors.
 * Listens to device error events and creates Alarm objects dynamically.
 *
 * Error detection is now handled by a global OPC UA subscription to device
 * error messages (sErrorMessage), managed by HMIManager. This ensures alarms
 * are detected regardless of which page the user is viewing.
 */

import { EventEmitter } from "events";
import { HMIManager } from "./hmi-manager";
import { Device } from "../domain/device";
import { Alarm } from "@/types/alarm.types";

export interface DeviceErrorEvent {
  stationId: string;
  deviceId: string;
  deviceName: string;
  errorMessage: string;
}

/**
 * Interface for devices that can report error messages.
 * Used by AlarmManager to check for error states on devices.
 */
interface DeviceWithErrorMessage extends Device {
  errorMessage: string;
}

export interface LineErrorEvent {
  lineName: string;
  errorMessage: string;
}

export class AlarmManager extends EventEmitter {
  private alarms: Map<string, Alarm> = new Map();
  private hmiManager: HMIManager;
  private isInitialized: boolean = false;

  // Alarm cooldown state - suppresses new alarms for 2s after acknowledgment
  private alarmCooldownUntil: number = 0;
  private readonly ALARM_COOLDOWN_MS = 2000;

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

    // Set up error listener for Line
    this.setupLineErrorListener();

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

    // Check Line for existing errors
    const line = this.hmiManager.getLine();
    if (line.errorMessage && line.errorMessage !== "") {
      const lineErrorData: LineErrorEvent = {
        lineName: line.name || "Line",
        errorMessage: line.errorMessage,
      };
      this.createLineAlarm(lineErrorData);
      foundErrors++;
    }

    for (const station of stations) {
      const devices = station.getDevices();

      for (const device of devices) {
        // Check if device has errorMessage property and has an error
        if ('errorMessage' in device) {
          const deviceWithError = device as DeviceWithErrorMessage;
          if (deviceWithError.errorMessage && deviceWithError.errorMessage !== "") {
            const errorData: DeviceErrorEvent = {
              stationId: station.id,
              deviceId: device.id,
              deviceName: deviceWithError.name || device.id,
              errorMessage: deviceWithError.errorMessage,
            };
            this.createAlarm(errorData);
            foundErrors++;
          }
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
   * Set up error listener for Line
   */
  private setupLineErrorListener(): void {
    const line = this.hmiManager.getLine();
    // Listen to error events from Line
    line.on("error", (errorData: LineErrorEvent) => {
      console.log(`[AlarmManager] Error received from Line:`, errorData.errorMessage);
      this.createLineAlarm(errorData);
    });
    console.log("[AlarmManager] Set up error listener for Line");
  }

  /**
   * Set up error listener for a single device
   */
  private setupDeviceErrorListener(stationId: string, device: Device): void {
    // Listen to error events from device
    // These events are emitted when:
    // 1. Device is subscribed and updateStatus() detects an error change
    // 2. Global error message subscription triggers updateStatus()
    device.on("error", (errorData: DeviceErrorEvent) => {
      console.log(`[AlarmManager] Error received from ${errorData.deviceId}:`, errorData.errorMessage);
      this.createAlarm(errorData);
    });
  }

  /**
   * Create an alarm from a device error event
   */
  private createAlarm(errorData: DeviceErrorEvent): void {
    // Suppress alarm creation during cooldown
    if (this.isInAlarmCooldown()) {
      console.log(`[AlarmManager] Device alarm suppressed during cooldown: ${errorData.deviceName} - ${errorData.errorMessage}`);
      return;
    }

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
   * Create an alarm from a Line error event
   * Only creates if an alarm with the same error message doesn't already exist
   */
  private createLineAlarm(errorData: LineErrorEvent): void {
    // Suppress alarm creation during cooldown
    if (this.isInAlarmCooldown()) {
      console.log(`[AlarmManager] Line alarm suppressed during cooldown: ${errorData.errorMessage}`);
      return;
    }

    // Check if an alarm for this Line error message already exists
    const existingAlarm = Array.from(this.alarms.values()).find(
      alarm => alarm.deviceId === "Line" &&
               alarm.description === errorData.errorMessage &&
               !alarm.acknowledged
    );

    if (existingAlarm) {
      console.log(`[AlarmManager] Line alarm already exists for: ${errorData.errorMessage}`);
      return;
    }

    const alarmId = `line-${Date.now()}`;

    const alarm: Alarm = {
      id: alarmId,
      title: `Line Error`,
      description: errorData.errorMessage,
      severity: "critical",
      device: errorData.lineName,
      deviceId: "Line",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      acknowledged: false,
    };

    this.alarms.set(alarmId, alarm);
    console.log(`[AlarmManager] Line alarm created: ${alarmId} - ${alarm.title}`);

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
   * Starts cooldown period to suppress duplicate alarms while PLC processes acknowledge
   */
  acknowledgeAlarm(alarmId: string): void {
    const alarm = this.alarms.get(alarmId);
    if (alarm) {
      alarm.acknowledged = true;
      alarm.acknowledgedBy = "Operator";
      alarm.acknowledgedAt = new Date().toISOString().replace("T", " ").substring(0, 19);
      console.log(`[AlarmManager] Alarm acknowledged: ${alarmId}`);

      // Start cooldown for any alarm acknowledgment
      this.startAlarmCooldown();

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
    this.alarmCooldownUntil = 0; // Reset cooldown
    console.log("[AlarmManager] Reset complete");
  }

  // Cooldown helpers

  /**
   * Start the alarm cooldown period
   * Called when any alarm is acknowledged
   */
  private startAlarmCooldown(): void {
    this.alarmCooldownUntil = Date.now() + this.ALARM_COOLDOWN_MS;
    console.log("[AlarmManager] Alarm cooldown started");
  }

  /**
   * Check if currently in cooldown period
   * Auto-resets cooldown state when expired
   */
  private isInAlarmCooldown(): boolean {
    const now = Date.now();
    if (now < this.alarmCooldownUntil) {
      return true;
    }
    if (this.alarmCooldownUntil > 0) {
      this.alarmCooldownUntil = 0;
      console.log("[AlarmManager] Alarm cooldown expired");
    }
    return false;
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
