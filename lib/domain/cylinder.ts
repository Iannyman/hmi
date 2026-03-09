/**
 * Cylinder Device Domain Model
 *
 * Represents a cylinder device with attributes for display and methods for UI interactions.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { Device } from "./device";
import { NodeMapper } from "../node-mapper";
import { CylinderModelType, PLCStatus } from "@/types/domain.types";
import { DataType } from "node-opcua";

export class Cylinder extends Device {
  // Attributes (for display)
  public model: CylinderModelType = "2-state";
  public details: string = '';
  public inWorkPosition: boolean = false;
  public inHomePosition: boolean = false;
  public status: PLCStatus = "disabled";
  public enabled: boolean = false;
  public enableHomePosition: boolean = false;
  public enableWorkPosition: boolean = false;
  public errorMessage: string = '';
  public toHomePosition: boolean = false;
  public toWorkPosition: boolean = false;
  public timeout: number = 0;

  // Track previous error state for change detection
  private previousErrorMessage: string = '';

  /**
   * Update cylinder status based on current state
   * Cylinders don't have a status node - status is derived from state
   */
  private updateStatus(): void {
    const oldError = this.previousErrorMessage;
    this.previousErrorMessage = this.errorMessage;

    if (this.errorMessage !== '') {
      this.status = "error";

      // Emit error event only if this is a NEW error (error message changed)
      // and there are listeners (avoid error during initialization)
      if (oldError !== this.errorMessage && this.listenerCount("error") > 0) {
        this.emit("error", {
          stationId: this.stationId,
          deviceId: this.id,
          deviceName: this.getName(),
          errorMessage: this.errorMessage,
        });
      }
    } else if (!this.enabled) {
      this.status = "disabled";
    } else if (this.inWorkPosition || this.inHomePosition) {
      this.status = "ready";
    } else {
      this.status = "warning"; // Between positions, in transition
    }
  }

  // Node IDs (cached for performance)
  private nodeIds: {
    details: string;
    inWorkPosition: string;
    inHomePosition: string;
    enabled: string;
    enableHomePosition: string;
    enableWorkPosition: string;
    errorMessage: string;
    toHomePosition: string;
    toWorkPosition: string;
    timeout: string;
  } | null = null;

  // Reverse mapping: nodeId -> variable name for logging
  private nodeIdToName: Map<string, string> = new Map();

  constructor(
    id: string,
    stationId: string,
    nodeMapper: NodeMapper,
    opcuaService: any
  ) {
    super(id, stationId, "cylinder", nodeMapper, opcuaService);
  }

  /**
   * Get node IDs for this device's variables
   */
  protected getNodeIds(): string[] {
    if (!this.nodeIds) {
      this.nodeIds = {
        details: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sDetails`),
        inWorkPosition: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xInWorkPosition`),
        inHomePosition: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xInHomePosition`),
        enabled: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xEnOperation`),
        enableHomePosition: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xEnHomepos`),
        enableWorkPosition: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xEnWorkpos`),
        errorMessage: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.sErrorMessage`),
        toHomePosition: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xToHomePosition`),
        toWorkPosition: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.xToWorkPosition`),
        timeout: this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.iTimeout`),
      };

      // Build reverse mapping for logging
      this.nodeIdToName.set(this.nodeIds.details, "sDetails");
      this.nodeIdToName.set(this.nodeIds.inWorkPosition, "xInWorkPosition");
      this.nodeIdToName.set(this.nodeIds.inHomePosition, "xInHomePosition");
      this.nodeIdToName.set(this.nodeIds.enabled, "xEnOperation");
      this.nodeIdToName.set(this.nodeIds.enableHomePosition, "xEnHomepos");
      this.nodeIdToName.set(this.nodeIds.enableWorkPosition, "xEnWorkpos");
      this.nodeIdToName.set(this.nodeIds.errorMessage, "sErrorMessage");
      this.nodeIdToName.set(this.nodeIds.toHomePosition, "xToHomePosition");
      this.nodeIdToName.set(this.nodeIds.toWorkPosition, "xToWorkPosition");
      this.nodeIdToName.set(this.nodeIds.timeout, "iTimeout");
    }

    return [
      this.nodeIds.details,
      this.nodeIds.inWorkPosition,
      this.nodeIds.inHomePosition,
      this.nodeIds.enabled,
      this.nodeIds.enableHomePosition,
      this.nodeIds.enableWorkPosition,
      this.nodeIds.errorMessage,
      this.nodeIds.toHomePosition,
      this.nodeIds.toWorkPosition,
      this.nodeIds.timeout,
    ];
  }

  /**
   * Map OPCUA read results to device attributes
   */
  protected mapResultsToAttributes(results: Array<{ value: unknown }>): void {
    this.details = results[0].value as string;
    this.inWorkPosition = results[1].value as boolean;
    this.inHomePosition = results[2].value as boolean;
    this.enabled = results[3].value as boolean;
    this.enableHomePosition = results[4].value as boolean;
    this.enableWorkPosition = results[5].value as boolean;
    this.errorMessage = results[6].value as string;
    this.toHomePosition = results[7].value as boolean;
    this.toWorkPosition = results[8].value as boolean;
    this.timeout = results[9].value as number;

    // Update status based on new state
    this.updateStatus();
  }

  /**
   * Handle subscription changes from OPCUA
   */
  protected handleSubscriptionChanges(
    dataValue: any,
    callback: (device: Device) => void
  ): void {
    if (!this.nodeIds) return;

    const nodeId = dataValue.nodeId?.toString();
    const value = dataValue.value?.value;

    let statusRelevantChanged = false;

    switch (nodeId) {
      case this.nodeIds.details:
        this.details = value as string;
        break;
      case this.nodeIds.inWorkPosition:
        this.inWorkPosition = value as boolean;
        statusRelevantChanged = true;
        break;
      case this.nodeIds.inHomePosition:
        this.inHomePosition = value as boolean;
        statusRelevantChanged = true;
        break;
      case this.nodeIds.enabled:
        this.enabled = value as boolean;
        statusRelevantChanged = true;
        break;
      case this.nodeIds.enableHomePosition:
        this.enableHomePosition = value as boolean;
        break;
      case this.nodeIds.enableWorkPosition:
        this.enableWorkPosition = value as boolean;
        break;
      case this.nodeIds.errorMessage:
        this.errorMessage = value as string;
        statusRelevantChanged = true;
        break;
      case this.nodeIds.toHomePosition:
        this.toHomePosition = value as boolean;
        break;
      case this.nodeIds.toWorkPosition:
        this.toWorkPosition = value as boolean;
        break;
      case this.nodeIds.timeout:
        this.timeout = value as number;
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
   * Move cylinder to work position
   * Called from UI button
   */
  async moveToWorkPosition(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xToWorkPosition`, true);
  }

  /**
   * Move cylinder to home position
   * Called from UI button
   */
  async moveToHomePosition(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xToHomePosition`, true);
  }

  /**
   * Set timeout value
   * Called from UI input
   * Note: TIME type in Siemens PLC requires Int32 (DINT)
   */
  async setTimeout(timeout: number): Promise<void> {
    const nodeId = this.nodeMapper.getNodeId(`${this.stationId}.${this.id}.iTimeout`);
    await this.opcuaService.writeNode(nodeId, timeout, DataType.Int32);
  }

  // Computed properties (for display)

  /**
   * Check if cylinder has an error
   */
  hasError(): boolean {
    return this.errorMessage !== '';
  }

  /**
   * Get current position as string
   */
  getPosition(): string {
    if (this.inWorkPosition) return "Work Position";
    if (this.inHomePosition) return "Home Position";
    return "Unknown";
  }

  /**
   * Extract name from details string
   * Details format: "Name/labelHP/labelWP"
   */
  getName(): string {
    if (!this.details) return "Cylinder";
    const parts = this.details.split('/');
    return parts[0] || "";
  }

  /**
   * Extract Home Position label from details string
   * Details format: "Name/labelHP/labelWP"
   */
  getLabelHP(): string {
    if (!this.details) return "Home Position";
    const parts = this.details.split('/');
    return parts[1] || "Home Position";
  }

  /**
   * Extract Work Position label from details string
   * Details format: "Name/labelHP/labelWP"
   */
  getLabelWP(): string {
    if (!this.details) return "Work Position";
    const parts = this.details.split('/');
    return parts[2] || "Work Position";
  }
}
