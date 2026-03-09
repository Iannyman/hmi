/**
 * Base Device Class
 * 
 * Abstract base class for all device types (Cylinder, Motor, Valve, etc.).
 * Provides common functionality for all devices including subscription, write, and refresh.
 */

import { EventEmitter } from "events";
import { NodeMapper } from "../node-mapper";
import { DeviceType } from "@/types/device.types";
import { PLCStatus, DomainObject } from "@/types/domain.types";

export abstract class Device extends EventEmitter implements DomainObject {
  // Dependencies
  protected nodeMapper: NodeMapper;
  protected opcuaService: any; // Using any for OPCUAService to avoid type issues
  protected subscriptionId: string | null = null;

  // Attributes (for display)
  public id: string;
  public stationId: string;
  public name: string = "";
  public type: DeviceType;
  public status!: PLCStatus; // Initialized by subclass
  public details: string = "";

  constructor(
    id: string,
    stationId: string,
    type: DeviceType,
    nodeMapper: NodeMapper,
    opcuaService: any // Using any for OPCUAService to avoid type issues
  ) {
    super();
    this.id = id;
    this.stationId = stationId;
    this.type = type;
    this.nodeMapper = nodeMapper;
    this.opcuaService = opcuaService;
  }

  /**
   * Subscribe to all Device OPCUA nodes for real-time updates
   * @param callback - Called when any subscribed node value changes
   */
  async subscribe(callback: (device: Device) => void): Promise<void> {
    const nodeIds = this.getNodeIds();

    this.subscriptionId = await this.opcuaService.subscribe(
      nodeIds,
      (dataValue: any) => this.handleSubscriptionChanges(dataValue, callback)
    );

    await this.refresh();
  }

  /**
   * Unsubscribe from all Device OPCUA nodes
   */
  async unsubscribe(): Promise<void> {
    if (this.subscriptionId) {
      await this.opcuaService.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
  }

  /**
   * Write value to a Device OPCUA node
   * @param variablePath - Path to the variable (e.g., "Station_1.Cylinder_1.xEnOperation")
   * @param value - Value to write
   */
  async write(variablePath: string, value: unknown): Promise<void> {
    const nodeId = this.nodeMapper.getNodeId(variablePath);
    await this.opcuaService.writeNode(nodeId, value);
  }

  /**
   * Refresh all Device data from OPCUA server
   * Used for initial load or manual refresh
   */
  async refresh(): Promise<void> {
    const nodeIds = this.getNodeIds();
    const results = await this.opcuaService.readMultipleNodes(nodeIds);
    this.mapResultsToAttributes(results);
    this.emit("updated", this);
  }

  /**
   * Get node IDs for this device's variables
   * Must be implemented by subclasses
   */
  protected abstract getNodeIds(): string[];

  /**
   * Map OPCUA read results to device attributes
   * Must be implemented by subclasses
   * @param results - Array of read results from OPCUA
   */
  protected abstract mapResultsToAttributes(results: Array<{ value: unknown }>): void;

  /**
   * Handle subscription changes from OPCUA
   * Must be implemented by subclasses
   * @param dataValue - Single node value change from OPCUA
   * @param callback - Callback to notify of updates
   */
  protected abstract handleSubscriptionChanges(
    dataValue: any,
    callback: (device: Device) => void
  ): void;

  // Methods (for UI buttons) - convenience wrappers around write()

  /**
   * Enable the device
   * Called from UI button
   */
  async enable(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xEnOperation`, true);
  }

  /**
   * Disable the device
   * Called from UI button
   */
  async disable(): Promise<void> {
    await this.write(`${this.stationId}.${this.id}.xEnOperation`, false);
  }

  // Event subscription

  /**
   * Subscribe to device update events
   * @param callback - Called when device is updated
   */
  onUpdated(callback: (device: Device) => void): void {
    this.on("updated", callback);
  }

  /**
   * Unsubscribe from device update events
   * @param callback - Callback to remove
   */
  offUpdated(callback: (device: Device) => void): void {
    this.off("updated", callback);
  }

}
