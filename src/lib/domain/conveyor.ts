/**
 * Conveyor Device Domain Model
 * 
 * Represents a conveyor device with attributes for display and methods for UI interactions.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { Device } from "./device";
import { NodeMapper } from "../server/node-mapper";
import { OPCUAService } from "../server/opcua-service";
import { MonitoredDataValue } from "@/types/opcua.types";
import { ConveyorDirection } from "@/types/domain.types";

export class Conveyor extends Device {
  // Attributes (for display)
  public speed: number = 0;
  public direction: ConveyorDirection = "stopped";
  public materialCount: number = 0;
  public capacity: number = 0;
  public loadPercentage: number = 0;
  public length: number = 0;

  // Node IDs (cached for performance)
  private nodeIds: {
    speed: string;
    direction: string;
    materialCount: string;
    capacity: string;
    loadPercentage: string;
    length: string;
  } | null = null;

  constructor(
    id: string,
    stationId: string,
    nodeMapper: NodeMapper,
    opcuaService: OPCUAService
  ) {
    super(id, stationId, "conveyor", nodeMapper, opcuaService);
  }

  protected getNodeIds(): string[] {
    if (!this.nodeIds) {
      this.nodeIds = {
        speed: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dSpeed`),
        direction: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sDirection`),
        materialCount: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dMaterialCount`),
        capacity: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dCapacity`),
        loadPercentage: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dLoadPercentage`),
        length: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dLength`),
      };
    }

    return [
      this.nodeIds.speed,
      this.nodeIds.direction,
      this.nodeIds.materialCount,
      this.nodeIds.capacity,
      this.nodeIds.loadPercentage,
      this.nodeIds.length,
    ];
  }

  protected mapResultsToAttributes(results: Array<{ value: unknown }>): void {
    this.speed = results[0].value as number;
    this.direction = this.mapDirection(results[1].value as number);
    this.materialCount = results[2].value as number;
    this.capacity = results[3].value as number;
    this.loadPercentage = results[4].value as number;
    this.length = results[5].value as number;
  }

  protected handleSubscriptionChanges(
    dataValue: MonitoredDataValue,
    callback: (device: Device) => void
  ): void {
    if (!this.nodeIds) return;

    const value = dataValue.value?.value;

    switch (dataValue.nodeId?.toString()) {
      case this.nodeIds.speed:
        this.speed = value as number;
        break;
      case this.nodeIds.direction:
        this.direction = this.mapDirection(value as number);
        break;
      case this.nodeIds.materialCount:
        this.materialCount = value as number;
        break;
      case this.nodeIds.capacity:
        this.capacity = value as number;
        break;
      case this.nodeIds.loadPercentage:
        this.loadPercentage = value as number;
        break;
      case this.nodeIds.length:
        this.length = value as number;
        break;
    }

    this.emit("updated", this);
    callback(this);
  }

  // Methods (for UI buttons) - convenience wrappers around write()

  /**
   * Set conveyor speed
   * Called from UI slider/input
   */
  async setSpeed(speed: number): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.dSpeed`, speed);
  }

  /**
   * Set conveyor direction
   * Called from UI selector
   */
  async setDirection(direction: ConveyorDirection): Promise<void> {
    const directionValue = direction === "forward" ? 0 : direction === "reverse" ? 1 : 2;
    await this.write(`${this.stationId}.${this.id}.sDirection`, directionValue);
  }

  /**
   * Start conveyor
   * Called from UI button
   */
  async start(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xStart`, true);
  }

  /**
   * Stop conveyor
   * Called from UI button
   */
  async stop(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xStop`, true);
  }

  // Computed properties (for display)

  /**
   * Get remaining capacity
   */
  getRemainingCapacity(): number {
    return Math.max(0, this.capacity - this.materialCount);
  }

  /**
   * Get conveyor status
   */
  getConveyorStatus(): "idle" | "running" | "full" | "error" {
    if (this.direction === "stopped") return "idle";
    if (this.materialCount >= this.capacity) return "full";
    if (this.speed > 0) return "running";
    return "error";
  }

  // Private helpers

  /**
   * Map direction number to ConveyorDirection enum
   */
  private mapDirection(direction: number): ConveyorDirection {
    if (direction === 0) return "forward";
    if (direction === 1) return "reverse";
    return "stopped";
  }
}
