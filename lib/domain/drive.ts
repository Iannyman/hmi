/**
 * Drive Device Domain Model
 * 
 * Represents a drive device with attributes for display and methods for UI interactions.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { Device } from "./device";
import { NodeMapper } from "../node-mapper";
import { FaultRecord } from "@/types/domain.types";

export class Drive extends Device {
  // Attributes (for display)
  public frequency: number = 0;
  public torque: number = 0;
  public powerFactor: number = 0;
  public voltage: number = 0;
  public current: number = 0;
  public faultCode: string = "";
  public faultHistory: FaultRecord[] = [];

  // Node IDs (cached for performance)
  private nodeIds: {
    frequency: string;
    torque: string;
    powerFactor: string;
    voltage: string;
    current: string;
    faultCode: string;
  } | null = null;

  constructor(
    id: string,
    stationId: string,
    nodeMapper: NodeMapper,
    opcuaService: any
  ) {
    super(id, stationId, "drive", nodeMapper, opcuaService);
  }

  protected getNodeIds(): string[] {
    if (!this.nodeIds) {
      this.nodeIds = {
        frequency: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dFrequency`),
        torque: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dTorque`),
        powerFactor: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dPowerFactor`),
        voltage: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dVoltage`),
        current: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dCurrent`),
        faultCode: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sFaultCode`),
      };
    }

    return [
      this.nodeIds.frequency,
      this.nodeIds.torque,
      this.nodeIds.powerFactor,
      this.nodeIds.voltage,
      this.nodeIds.current,
      this.nodeIds.faultCode,
    ];
  }

  protected mapResultsToAttributes(results: Array<{ value: unknown }>): void {
    this.frequency = results[0].value as number;
    this.torque = results[1].value as number;
    this.powerFactor = results[2].value as number;
    this.voltage = results[3].value as number;
    this.current = results[4].value as number;
    this.faultCode = results[5].value as string;
  }

  protected handleSubscriptionChanges(
    dataValue: any,
    callback: (device: Device) => void
  ): void {
    if (!this.nodeIds) return;

    const nodeId = dataValue.nodeId?.toString();
    const value = dataValue.value?.value;

    switch (nodeId) {
      case this.nodeIds.frequency:
        this.frequency = value as number;
        break;
      case this.nodeIds.torque:
        this.torque = value as number;
        break;
      case this.nodeIds.powerFactor:
        this.powerFactor = value as number;
        break;
      case this.nodeIds.voltage:
        this.voltage = value as number;
        break;
      case this.nodeIds.current:
        this.current = value as number;
        break;
      case this.nodeIds.faultCode:
        this.faultCode = value as string;
        // Add to fault history when fault occurs
        if (this.faultCode && this.faultCode !== "") {
          this.faultHistory.push({
            code: this.faultCode,
            timestamp: new Date().toISOString(),
          });
        }
        break;
    }

    this.emit("updated", this);
    callback(this);
  }

  // Methods (for UI buttons) - convenience wrappers around write()

  /**
   * Set drive frequency
   * Called from UI input
   */
  async setFrequency(frequency: number): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.dFrequency`, frequency);
  }

  /**
   * Clear drive fault
   * Called from UI button
   */
  async clearFault(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xClearFault`, true);
  }

  /**
   * Reset drive
   * Called from UI button
   */
  async reset(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xReset`, true);
  }

  // Computed properties (for display)

  /**
   * Check if drive has an active fault
   */
  hasFault(): boolean {
    return this.faultCode !== "" && this.faultCode !== "0";
  }

  /**
   * Get drive status
   */
  getDriveStatus(): "idle" | "running" | "fault" | "warning" {
    if (this.hasFault()) return "fault";
    if (this.frequency > 0) return "running";
    if (this.current > 0) return "warning";
    return "idle";
  }

  /**
   * Get calculated power
   */
  getCalculatedPower(): number {
    return (this.voltage * this.current * this.powerFactor) / 1000;
  }
}
