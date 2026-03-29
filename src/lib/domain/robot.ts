/**
 * Robot Device Domain Model
 * 
 * Represents a robot device with attributes for display and methods for UI interactions.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { Device } from "./device";
import { NodeMapper } from "../server/node-mapper";
import { OPCUAService } from "../server/opcua-service";
import { MonitoredDataValue } from "@/types/opcua.types";
import { RobotMode, AxisPositions } from "@/types/domain.types";

export class Robot extends Device {
  // Attributes (for display)
  public mode: RobotMode = "manual";
  public program: string = "";
  public programNumber: string = "";
  public cycle: number = 0;
  public totalCycles: number = 0;
  public timeRemaining: string = "00:00:00";
  public axisPositions: AxisPositions = { x: 0, y: 0, z: 0 };

  // Node IDs (cached for performance)
  private nodeIds: {
    mode: string;
    program: string;
    programNumber: string;
    cycle: string;
    totalCycles: string;
    timeRemaining: string;
    axisX: string;
    axisY: string;
    axisZ: string;
  } | null = null;

  constructor(
    id: string,
    stationId: string,
    nodeMapper: NodeMapper,
    opcuaService: OPCUAService
  ) {
    super(id, stationId, "robot", nodeMapper, opcuaService);
  }

  protected getNodeIds(): string[] {
    if (!this.nodeIds) {
      this.nodeIds = {
        mode: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sMode`),
        program: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sProgram`),
        programNumber: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sProgramNumber`),
        cycle: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.iCycle`),
        totalCycles: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.iTotalCycles`),
        timeRemaining: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sTimeRemaining`),
        axisX: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dAxisX`),
        axisY: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dAxisY`),
        axisZ: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dAxisZ`),
      };
    }

    return [
      this.nodeIds.mode,
      this.nodeIds.program,
      this.nodeIds.programNumber,
      this.nodeIds.cycle,
      this.nodeIds.totalCycles,
      this.nodeIds.timeRemaining,
      this.nodeIds.axisX,
      this.nodeIds.axisY,
      this.nodeIds.axisZ,
    ];
  }

  protected mapResultsToAttributes(results: Array<{ value: unknown }>): void {
    this.mode = this.mapMode(results[0].value as number);
    this.program = results[1].value as string;
    this.programNumber = results[2].value as string;
    this.cycle = results[3].value as number;
    this.totalCycles = results[4].value as number;
    this.timeRemaining = results[5].value as string;
    this.axisPositions = {
      x: results[6].value as number,
      y: results[7].value as number,
      z: results[8].value as number,
    };
  }

  protected handleSubscriptionChanges(
    dataValue: MonitoredDataValue,
    callback: (device: Device) => void
  ): void {
    if (!this.nodeIds) return;

    const nodeId = dataValue.nodeId?.toString();
    const value = dataValue.value?.value;

    switch (nodeId) {
      case this.nodeIds.mode:
        this.mode = this.mapMode(value as number);
        break;
      case this.nodeIds.program:
        this.program = value as string;
        break;
      case this.nodeIds.programNumber:
        this.programNumber = value as string;
        break;
      case this.nodeIds.cycle:
        this.cycle = value as number;
        break;
      case this.nodeIds.totalCycles:
        this.totalCycles = value as number;
        break;
      case this.nodeIds.timeRemaining:
        this.timeRemaining = value as string;
        break;
      case this.nodeIds.axisX:
        this.axisPositions.x = value as number;
        break;
      case this.nodeIds.axisY:
        this.axisPositions.y = value as number;
        break;
      case this.nodeIds.axisZ:
        this.axisPositions.z = value as number;
        break;
    }

    this.emit("updated", this);
    callback(this);
  }

  // Methods (for UI buttons) - convenience wrappers around write()

  /**
   * Start robot program
   * Called from UI button
   */
  async startProgram(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xStart`, true);
  }

  /**
   * Stop robot program
   * Called from UI button
   */
  async stopProgram(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xStop`, true);
  }

  /**
   * Move robot to specific axis position
   * Called from UI input
   */
  async moveToAxis(x: number, y: number, z: number): Promise<void> {
    await Promise.all([
      this.write(`${this.stationId}.${this.id}.dAxisX`, x),
      this.write(`${this.stationId}.${this.id}.dAxisY`, y),
      this.write(`${this.stationId}.${this.id}.dAxisZ`, z),
    ]);
  }

  /**
   * Set robot mode
   * Called from UI selector
   */
  async setMode(mode: RobotMode): Promise<void> {
    const modeValue = mode === "auto" ? 0 : 1;
    await this.write(`${this.stationId}.${this.id}.sMode`, modeValue);
  }

  // Computed properties (for display)

  /**
   * Get cycle progress percentage
   */
  getCycleProgress(): number {
    return this.totalCycles > 0 ? (this.cycle / this.totalCycles) * 100 : 0;
  }

  /**
   * Get robot status
   */
  getRobotStatus(): "idle" | "running" | "paused" | "error" {
    if (this.mode === "manual") return "idle";
    if (this.cycle > 0 && this.cycle < this.totalCycles) return "running";
    if (this.cycle === this.totalCycles) return "paused";
    return "error";
  }

  // Private helpers

  /**
   * Map mode number to RobotMode enum
   */
  private mapMode(mode: number): RobotMode {
    if (mode === 0) return "auto";
    return "manual";
  }
}
