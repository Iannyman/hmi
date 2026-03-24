/**
 * Drive Device Domain Model
 *
 * Represents a positioning drive/axis with position control.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { Device } from "./device";
import { NodeMapper } from "../node-mapper";
import { PLCStatus } from "@/types/domain.types";

export class Drive extends Device {
  // Attributes (for display)
  public name: string = "";
  public actPosition: number = 0;
  public actPositionIndex: number = 0;
  public axisMoving: boolean = false;
  public errorMessage: string = "";
  public enForward: boolean = false;
  public enBackward: boolean = false;
  public enPositioning: boolean = false;
  public status: PLCStatus = "disabled";
  public targetPositionIndex: number = 0;

  // Track previous error state for change detection
  private previousErrorMessage: string = "";

  /**
   * Update drive status based on current state
   * Drives don't have a status node - status is derived from state
   */
  private updateStatus(): void {
    const oldError = this.previousErrorMessage;
    this.previousErrorMessage = this.errorMessage;

    if (this.errorMessage !== "") {
      this.status = "error";

      // Emit error event only if this is a NEW error
      if (oldError !== this.errorMessage && this.listenerCount("error") > 0) {
        this.emit("error", {
          stationId: this.stationId,
          deviceId: this.id,
          deviceName: this.name,
          errorMessage: this.errorMessage,
        });
      }
    } else {
      this.status = "ready";
    }
  }

  // Node IDs (cached for performance)
  private nodeIds: {
    name: string;
    actPosition: string;
    actPositionIndex: string;
    axisMoving: string;
    errorMessage: string;
    enForward: string;
    enBackward: string;
    enPositioning: string;
    jogPositive: string;
    jogNegative: string;
    setPositionIndex: string;
    startHomming: string;
    startPosition: string;
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
        name: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sName`),
        actPosition: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.dActPosition`),
        actPositionIndex: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.iActPositionIndex`),
        axisMoving: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xAxisMoving`),
        errorMessage: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sErrorMessage`),
        enForward: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xEnForward`),
        enBackward: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xEnBackward`),
        enPositioning: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xEnPositioning`),
        jogPositive: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xJogPositive`),
        jogNegative: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xJogNegative`),
        setPositionIndex: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.iSetPositionIndex`),
        startHomming: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xStartHomming`),
        startPosition: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xStartPosition`),
      };
    }

    return [
      this.nodeIds.name,
      this.nodeIds.actPosition,
      this.nodeIds.actPositionIndex,
      this.nodeIds.axisMoving,
      this.nodeIds.errorMessage,
      this.nodeIds.enForward,
      this.nodeIds.enBackward,
      this.nodeIds.enPositioning,
      this.nodeIds.setPositionIndex,
    ];
  }

  protected mapResultsToAttributes(results: Array<{ value: unknown }>): void {
    this.name = results[0].value as string;
    this.actPosition = results[1].value as number;
    this.actPositionIndex = results[2].value as number;
    this.axisMoving = results[3].value as boolean;
    this.errorMessage = results[4].value as string;
    this.enForward = results[5].value as boolean;
    this.enBackward = results[6].value as boolean;
    this.enPositioning = results[7].value as boolean;
    this.targetPositionIndex = results[8].value as number;

    // Update status based on new state
    this.updateStatus();
  }

  protected handleSubscriptionChanges(
    dataValue: any,
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
      case this.nodeIds.actPosition:
        this.actPosition = value as number;
        break;
      case this.nodeIds.actPositionIndex:
        this.actPositionIndex = value as number;
        break;
      case this.nodeIds.axisMoving:
        this.axisMoving = value as boolean;
        statusRelevantChanged = true;
        break;
      case this.nodeIds.errorMessage:
        this.errorMessage = value as string;
        statusRelevantChanged = true;
        break;
      case this.nodeIds.enForward:
        this.enForward = value as boolean;
        statusRelevantChanged = true;
        break;
      case this.nodeIds.enBackward:
        this.enBackward = value as boolean;
        statusRelevantChanged = true;
        break;
      case this.nodeIds.enPositioning:
        this.enPositioning = value as boolean;
        statusRelevantChanged = true;
        break;
      case this.nodeIds.setPositionIndex:
        this.targetPositionIndex = value as number;
        break;
    }

    // Update status if relevant state changed
    if (statusRelevantChanged) {
      this.updateStatus();
    }

    this.emit("updated", this);
    callback(this);
  }

  // Methods (for UI buttons) - convenience wrappers around write()

  /**
   * Start jog positive direction
   * @param value - true to activate, false to deactivate
   * Called from UI button
   */
  async jogPositive(value: boolean): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xJogPositive`, value);
  }

  /**
   * Start jog negative direction
   * @param value - true to activate, false to deactivate
   * Called from UI button
   */
  async jogNegative(value: boolean): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xJogNegative`, value);
  }


  /**
   * Start homing sequence
   * @param value - true to activate, false to deactivate
   * Called from UI button
   */
  async startHomming(value: boolean): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xStartHomming`, value);
  }

  /**
   * Start positioning to set index
   * @param value - true to activate, false to deactivate
   * Called from UI button
   */
  async startPosition(value: boolean): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xStartPosition`, value);
  }

  /**
   * Set position index
   * Called from UI input
   */
  async setPositionIndex(index: number): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.iSetPositionIndex`, index);
  }  
}
