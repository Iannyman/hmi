/**
 * Motor Device Domain Model
 * 
 * Represents a motor device with attributes for display and methods for UI interactions.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { Device } from "./device";
import { NodeMapper } from "../node-mapper";

export class Motor extends Device {
  // Attributes (for display)
  public speed: number = 0;
  public maxSpeed: number = 0;
  public current: number = 0;
  public maxCurrent: number = 0;
  public power: number = 0;
  public temperature: number = 0;
  public load: number = 0;

  // Node IDs (cached for performance)
  private nodeIds: {
    speed: string;
    maxSpeed: string;
    current: string;
    maxCurrent: string;
    power: string;
    temperature: string;
    load: string;
  } | null = null;

  constructor(
    id: string,
    stationId: string,
    nodeMapper: NodeMapper,
    opcuaService: any
  ) {
    super(id, stationId, "motor", nodeMapper, opcuaService);
  }

  protected getNodeIds(): string[] {
    if (!this.nodeIds) {
      this.nodeIds = {
        speed: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dSpeed`),
        maxSpeed: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dMaxSpeed`),
        current: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dCurrent`),
        maxCurrent: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dMaxCurrent`),
        power: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dPower`),
        temperature: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dTemperature`),
        load: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dLoad`),
      };
    }

    return [
      this.nodeIds.speed,
      this.nodeIds.maxSpeed,
      this.nodeIds.current,
      this.nodeIds.maxCurrent,
      this.nodeIds.power,
      this.nodeIds.temperature,
      this.nodeIds.load,
    ];
  }

  protected mapResultsToAttributes(results: Array<{ value: unknown }>): void {
    this.speed = results[0].value as number;
    this.maxSpeed = results[1].value as number;
    this.current = results[2].value as number;
    this.maxCurrent = results[3].value as number;
    this.power = results[4].value as number;
    this.temperature = results[5].value as number;
    this.load = results[6].value as number;
  }

  protected handleSubscriptionChanges(
    dataValue: any,
    callback: (device: Device) => void
  ): void {
    if (!this.nodeIds) return;

    const nodeId = dataValue.nodeId?.toString();
    const value = dataValue.value?.value;

    switch (nodeId) {
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
