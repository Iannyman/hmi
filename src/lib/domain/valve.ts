/**
 * Valve Device Domain Model
 * 
 * Represents a valve device with attributes for display and methods for UI interactions.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { Device } from "./device";
import { NodeMapper } from "../server/node-mapper";
import { OPCUAService } from "../server/opcua-service";
import { MonitoredDataValue } from "@/types/opcua.types";
import { ValvePosition, ActuatorStatus } from "@/types/domain.types";

export class Valve extends Device {
  // Attributes (for display)
  public name: string = "";
  public position: ValvePosition = "closed";
  public positionPercent: number = 0;
  public pressure: number = 0;
  public flowRate: number = 0;
  public actuatorStatus: ActuatorStatus = "inactive";
  public errorMessage: string = "";

  // Track previous error state for change detection
  private previousErrorMessage: string = "";

  /**
   * Update valve status based on current state
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
    position: string;
    positionPercent: string;
    pressure: string;
    flowRate: string;
    actuatorStatus: string;
    errorMessage: string;
  } | null = null;

  constructor(
    id: string,
    stationId: string,
    nodeMapper: NodeMapper,
    opcuaService: OPCUAService
  ) {
    super(id, stationId, "valve", nodeMapper, opcuaService);
  }

  protected getNodeIds(): string[] {
    if (!this.nodeIds) {
      this.nodeIds = {
        name: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sName`),
        position: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sPosition`),
        positionPercent: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dPositionPercent`),
        pressure: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dPressure`),
        flowRate: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dFlowRate`),
        actuatorStatus: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sActuatorStatus`),
        errorMessage: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sErrorMessage`),
      };
    }

    return [
      this.nodeIds.name,
      this.nodeIds.position,
      this.nodeIds.positionPercent,
      this.nodeIds.pressure,
      this.nodeIds.flowRate,
      this.nodeIds.actuatorStatus,
      this.nodeIds.errorMessage,
    ];
  }

  protected mapResultsToAttributes(results: Array<{ value: unknown }>): void {
    this.name = results[0].value as string;
    this.position = this.mapPosition(results[1].value as string);
    this.positionPercent = results[2].value as number;
    this.pressure = results[3].value as number;
    this.flowRate = results[4].value as number;
    this.actuatorStatus = results[5].value as ActuatorStatus;
    this.errorMessage = (results[6].value as string) ?? "";

    this.updateStatus();
  }

  protected handleSubscriptionChanges(
    dataValue: MonitoredDataValue,
    callback: (device: Device) => void
  ): void {
    if (!this.nodeIds) return;

    const nodeId = dataValue.nodeId?.toString();
    const value = dataValue.value?.value;

    let statusRelevantChanged = false;

    switch (nodeId) {
      case this.nodeIds.name:
        this.name = value as string;
        break;
      case this.nodeIds.position:
        this.position = this.mapPosition(value as string);
        break;
      case this.nodeIds.positionPercent:
        this.positionPercent = value as number;
        break;
      case this.nodeIds.pressure:
        this.pressure = value as number;
        break;
      case this.nodeIds.flowRate:
        this.flowRate = value as number;
        break;
      case this.nodeIds.actuatorStatus:
        this.actuatorStatus = value as ActuatorStatus;
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
   * Open valve
   * Called from UI button
   */
  async open(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xOpen`, true);
  }

  /**
   * Close valve
   * Called from UI button
   */
  async close(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xClose`, true);
  }

  /**
   * Set valve position percentage
   * Called from UI slider/input
   */
  async setPosition(percent: number): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.dPositionPercent`, percent);
  }

  // Private helpers

  /**
   * Map position string to ValvePosition enum
   */
  private mapPosition(position: string): ValvePosition {
    const posLower = position?.toLowerCase() || "";
    if (posLower.includes("open")) return "open";
    if (posLower.includes("close")) return "closed";
    if (posLower.includes("part")) return "partial";
    return "closed";
  }
}
