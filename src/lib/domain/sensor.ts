/**
 * Sensor Device Domain Model
 * 
 * Represents a sensor device with attributes for display and methods for UI interactions.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { Device } from "./device";
import { NodeMapper } from "../server/node-mapper";
import { OPCUAService } from "../server/opcua-service";
import { MonitoredDataValue } from "@/types/opcua.types";

export class Sensor extends Device {
  // Attributes (for display)
  public name: string = "";
  public value: number = 0;
  public unit: string = "";
  public min: number = 0;
  public max: number = 0;
  public avg: number = 0;
  public alarmThreshold: number = 0;
  public errorMessage: string = "";

  // Track previous error state for change detection
  private previousErrorMessage: string = "";

  /**
   * Update sensor status based on current state
   * Called by HMIManager when errorMessage changes via global subscription.
   */
  public updateStatus(): void {
    const oldError = this.previousErrorMessage;
    this.previousErrorMessage = this.errorMessage;

    if (this.errorMessage !== "") {
      if (oldError !== this.errorMessage && this.listenerCount("error") > 0) {
        this.emit("error", {
          stationId: this.stationId,
          deviceId: this.id,
          deviceName: this.name || this.id,
          errorMessage: this.errorMessage,
        });
      }
    }
  }

  // Node IDs (cached for performance)
  private nodeIds: {
    name: string;
    value: string;
    unit: string;
    min: string;
    max: string;
    avg: string;
    alarmThreshold: string;
    errorMessage: string;
  } | null = null;

  constructor(
    id: string,
    stationId: string,
    nodeMapper: NodeMapper,
    opcuaService: OPCUAService
  ) {
    super(id, stationId, "sensor", nodeMapper, opcuaService);
  }

  protected getNodeIds(): string[] {
    if (!this.nodeIds) {
      this.nodeIds = {
        name: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sName`),
        value: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dValue`),
        unit: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sUnit`),
        min: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dMin`),
        max: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dMax`),
        avg: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dAvg`),
        alarmThreshold: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dAlarmThreshold`),
        errorMessage: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sErrorMessage`),
      };
    }

    return [
      this.nodeIds.name,
      this.nodeIds.value,
      this.nodeIds.unit,
      this.nodeIds.min,
      this.nodeIds.max,
      this.nodeIds.avg,
      this.nodeIds.alarmThreshold,
      this.nodeIds.errorMessage,
    ];
  }

  protected mapResultsToAttributes(results: Array<{ value: unknown }>): void {
    this.name = results[0].value as string;
    this.value = results[1].value as number;
    this.unit = results[2].value as string;
    this.min = results[3].value as number;
    this.max = results[4].value as number;
    this.avg = results[5].value as number;
    this.alarmThreshold = results[6].value as number;
    this.errorMessage = (results[7].value as string) ?? "";

    this.updateStatus();
  }

  protected handleSubscriptionChanges(
    dataValue: MonitoredDataValue,
    callback: (device: Device) => void
  ): void {
    if (!this.nodeIds) return;

    const value = dataValue.value?.value;

    let statusRelevantChanged = false;

    switch (dataValue.nodeId?.toString()) {
      case this.nodeIds.name:
        this.name = value as string;
        break;
      case this.nodeIds.value:
        this.value = value as number;
        break;
      case this.nodeIds.unit:
        this.unit = value as string;
        break;
      case this.nodeIds.min:
        this.min = value as number;
        break;
      case this.nodeIds.max:
        this.max = value as number;
        break;
      case this.nodeIds.avg:
        this.avg = value as number;
        break;
      case this.nodeIds.alarmThreshold:
        this.alarmThreshold = value as number;
        break;
      case this.nodeIds.errorMessage:
        this.errorMessage = value as string;
        statusRelevantChanged = true;
        break;
    }

    if (statusRelevantChanged) {
      this.updateStatus();
    }

    this.emit("updated", this);
    callback(this);
  }

  // Methods (for UI buttons) - convenience wrappers around write()

  /**
   * Set alarm threshold
   * Called from UI input
   */
  async setAlarmThreshold(threshold: number): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.dAlarmThreshold`, threshold);
  }

  // Computed properties (for display)

  /**
   * Check if sensor is in alarm state
   */
  isInAlarm(): boolean {
    return this.value >= this.alarmThreshold;
  }

  /**
   * Get value as percentage of range
   */
  getValuePercentage(): number {
    const range = this.max - this.min;
    return range > 0 ? ((this.value - this.min) / range) * 100 : 0;
  }

  /**
   * Get status based on alarm state
   */
  getAlarmStatus(): "normal" | "warning" | "alarm" {
    if (this.isInAlarm()) return "alarm";
    if (this.getValuePercentage() > 80) return "warning";
    return "normal";
  }
}
