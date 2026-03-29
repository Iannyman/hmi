/**
 * Motor Device Domain Model
 * 
 * Represents a motor device with attributes for display and methods for UI interactions.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { Device } from "./device";
import { NodeMapper } from "../server/node-mapper";
import { OPCUAService } from "../server/opcua-service";
import { MonitoredDataValue } from "@/types/opcua.types";

export class Motor extends Device {
  // Attributes (for display)
  public name: string = "";
  public speed: number = 0;
  public maxSpeed: number = 0;
  public current: number = 0;
  public maxCurrent: number = 0;
  public power: number = 0;
  public temperature: number = 0;
  public load: number = 0;
  public errorMessage: string = "";

  // Track previous error state for change detection
  private previousErrorMessage: string = "";

  /**
   * Update motor status based on current state
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
    speed: string;
    maxSpeed: string;
    current: string;
    maxCurrent: string;
    power: string;
    temperature: string;
    load: string;
    errorMessage: string;
  } | null = null;

  constructor(
    id: string,
    stationId: string,
    nodeMapper: NodeMapper,
    opcuaService: OPCUAService
  ) {
    super(id, stationId, "motor", nodeMapper, opcuaService);
  }

  protected getNodeIds(): string[] {
    if (!this.nodeIds) {
      this.nodeIds = {
        name: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sName`),
        speed: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dSpeed`),
        maxSpeed: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dMaxSpeed`),
        current: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dCurrent`),
        maxCurrent: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dMaxCurrent`),
        power: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dPower`),
        temperature: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dTemperature`),
        load: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dLoad`),
        errorMessage: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sErrorMessage`),
      };
    }

    return [
      this.nodeIds.name,
      this.nodeIds.speed,
      this.nodeIds.maxSpeed,
      this.nodeIds.current,
      this.nodeIds.maxCurrent,
      this.nodeIds.power,
      this.nodeIds.temperature,
      this.nodeIds.load,
      this.nodeIds.errorMessage,
    ];
  }

  protected mapResultsToAttributes(results: Array<{ value: unknown }>): void {
    this.name = results[0].value as string;
    this.speed = results[1].value as number;
    this.maxSpeed = results[2].value as number;
    this.current = results[3].value as number;
    this.maxCurrent = results[4].value as number;
    this.power = results[5].value as number;
    this.temperature = results[6].value as number;
    this.load = results[7].value as number;
    this.errorMessage = (results[8].value as string) ?? "";

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
      case this.nodeIds.speed:
        this.speed = value as number;
        break;
      case this.nodeIds.maxSpeed:
        this.maxSpeed = value as number;
        break;
      case this.nodeIds.current:
        this.current = value as number;
        break;
      case this.nodeIds.maxCurrent:
        this.maxCurrent = value as number;
        break;
      case this.nodeIds.power:
        this.power = value as number;
        break;
      case this.nodeIds.temperature:
        this.temperature = value as number;
        break;
      case this.nodeIds.load:
        this.load = value as number;
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
   * Set motor speed
   * Called from UI slider/input
   */
  async setSpeed(speed: number): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.dSpeed`, speed);
  }

  /**
   * Start motor
   * Called from UI button
   */
  async start(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xStart`, true);
  }

  /**
   * Stop motor
   * Called from UI button
   */
  async stop(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xStop`, true);
  }

  // Computed properties (for display)

  /**
   * Get speed as percentage of max speed
   */
  getSpeedPercentage(): number {
    return this.maxSpeed > 0 ? (this.speed / this.maxSpeed) * 100 : 0;
  }

  /**
   * Get current as percentage of max current
   */
  getCurrentPercentage(): number {
    return this.maxCurrent > 0 ? (this.current / this.maxCurrent) * 100 : 0;
  }
}
