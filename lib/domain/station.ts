/**
 * Station Domain Model
 * 
 * Represents a production station with attributes for display and methods for UI interactions.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { EventEmitter } from "events";
import { NodeMapper } from "../node-mapper";
import { Device } from "./device";
import { Cylinder } from "./cylinder";
import { Motor } from "./motor";
import { Valve } from "./valve";
import { Sensor } from "./sensor";
import { Robot } from "./robot";
import { Conveyor } from "./conveyor";
import { Drive } from "./drive";
import { StationStatus, StationMode } from "@/types/station.types";
import { DeviceType } from "@/types/device.types";
import { DomainObject, StationStatistics } from "@/types/domain.types";

export class Station extends EventEmitter implements DomainObject {
  // Dependencies
  private nodeMapper: NodeMapper;
  private opcuaService: any; // Using any for OPCUAService to avoid type issues
  private subscriptionId: string | null = null;

  // Attributes (for display)
  public id: string;
  public name: string = "";
  public status: StationStatus = "setup";
  public mode: StationMode = "setup";
  public partsOK: number = 0;
  public partsNOK: number = 0;
  public disabled: boolean = false;
  public warning: string = "";
  public message: string = "";
  public devices: Map<string, Device> = new Map();

  // Node IDs (cached for performance)
  private nodeIds: {
    name: string;
    partsOK: string;
    partsNOK: string;
    resetStatistics: string;
    status: string;
    mode: string;
    disabled: string;
    warning: string;
    message: string;
  } | null = null;

  // Reverse mapping: nodeId -> variable name for logging
  private nodeIdToName: Map<string, string> = new Map();

  constructor(id: string, nodeMapper: NodeMapper, opcuaService: any) {
    super();
    this.id = id;
    this.nodeMapper = nodeMapper;
    this.opcuaService = opcuaService;
  }

  /**
   * Subscribe to all Station OPCUA nodes for real-time updates
   * Called when component mounts
   * @param callback - Function to call when station data updates
   * @param includeDevices - Whether to also subscribe to device updates (default: false)
   */
  async subscribe(callback: (station: Station) => void, includeDevices: boolean = false): Promise<void> {
    // console.log(`[Station ${this.id}] Starting subscription...`);

    // Step 1: Get node IDs (cache them)
    if (!this.nodeIds) {
      // console.log(`[Station ${this.id}] Resolving node IDs for paths:`);
      const paths = [
        `${this.id}.Control.sName`,
        `${this.id}.Control.dPartsOK`,
        `${this.id}.Control.dPartsNOK`,
        `${this.id}.Control.xResetStatistics`,
        `${this.id}.Control.sInStatus`,
        `${this.id}.Control.iMode`,
        `${this.id}.Control.xDisabled`,
        `${this.id}.Control.sWarning`,
        `${this.id}.Control.sMessage`,
      ];

      for (const path of paths) {
        try {
          const nodeId = this.nodeMapper.getNodeId(path);
          // console.log(`[Station ${this.id}]   ${path} -> ${nodeId}`);
        } catch (err) {
          console.error(`[Station ${this.id}]   ${path} -> ERROR:`, err);
        }
      }

      this.nodeIds = {
        name: this.nodeMapper.getNodeId(`${this.id}.Control.sName`),
        partsOK: this.nodeMapper.getNodeId(`${this.id}.Control.dPartsOK`),
        partsNOK: this.nodeMapper.getNodeId(`${this.id}.Control.dPartsNOK`),
        resetStatistics: this.nodeMapper.getNodeId(`${this.id}.Control.xResetStatistics`),
        status: this.nodeMapper.getNodeId(`${this.id}.Control.sInStatus`),
        warning: this.nodeMapper.getNodeId(`${this.id}.Control.sWarning`),
        message: this.nodeMapper.getNodeId(`${this.id}.Control.sMessage`),
        mode: this.nodeMapper.getNodeId(`${this.id}.Control.iMode`),
        disabled: this.nodeMapper.getNodeId(`${this.id}.Control.xDisabled`),
      };

      // Build reverse mapping for logging (nodeId -> variable name)
      this.nodeIdToName.set(this.nodeIds.name, "sName");
      this.nodeIdToName.set(this.nodeIds.partsOK, "dPartsOK");
      this.nodeIdToName.set(this.nodeIds.partsNOK, "dPartsNOK");
      this.nodeIdToName.set(this.nodeIds.status, "sInStatus");
      this.nodeIdToName.set(this.nodeIds.warning, "sWarning");
      this.nodeIdToName.set(this.nodeIds.message, "sMessage");
      this.nodeIdToName.set(this.nodeIds.mode, "iMode");
      this.nodeIdToName.set(this.nodeIds.disabled, "xDisabled");
    }

    // Step 2: Subscribe to OPCUA nodes
    const nodeIds = [
      this.nodeIds.name,
      this.nodeIds.partsOK,
      this.nodeIds.partsNOK,
      this.nodeIds.status,
      this.nodeIds.warning,
      this.nodeIds.message,
      this.nodeIds.mode,
      this.nodeIds.disabled,
    ];

    // console.log(`[Station ${this.id}] Creating OPC UA subscription for ${nodeIds.length} nodes`);

    this.subscriptionId = await this.opcuaService.subscribe(
      nodeIds,
      (dataValue: any) => this.handleSubscriptionChanges(dataValue, callback)
    );

    // console.log(`[Station ${this.id}] Subscription created with ID: ${this.subscriptionId}`);

    // Step 3: Subscribe to all devices (only if includeDevices is true)
    if (includeDevices) {
      for (const device of this.devices.values()) {
        await device.subscribe((device: Device) => {
          this.emit("deviceUpdated", device);
          callback(this);
        });
      }
    }

    // Step 4: Initial refresh to get current values
    await this.refresh();
  }

  /**
   * Unsubscribe from all Station OPCUA nodes
   * Called when component unmounts
   */
  async unsubscribe(): Promise<void> {
    if (this.subscriptionId) {
      await this.opcuaService.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }

    for (const device of this.devices.values()) {
      await device.unsubscribe();
    }
  }

  /**
   * Write value to a Station OPCUA node
   * Called from UI buttons or input changes
   *
   * Usage:
   * - station.write("Station_1.Control.xDisabled", false)  // Enable button
   * - station.write("Station_1.Control.xDisabled", true)   // Disable button
   * - station.write("Station_1.Control.xResetStatistics", true)  // Reset statistics button
   * - station.write("Station_1.Control.iMode", 0)        // Mode selector
   */
  async write(variablePath: string, value: unknown): Promise<void> {
    // console.log(`[Station ${this.id}] Writing: ${variablePath} = ${value}`);
    const nodeId = this.nodeMapper.getNodeId(variablePath);
    // console.log(`[Station ${this.id}] Node ID: ${nodeId}`);
    await this.opcuaService.writeNode(nodeId, value);
    // console.log(`[Station ${this.id}] Write complete`);
  }

  /**
   * Refresh all Station data from OPCUA server
   * Used for initial load or manual refresh
   */
  async refresh(): Promise<void> {
    if (!this.nodeIds) {
      throw new Error("Node IDs not initialized. Call subscribe() first.");
    }

    const nodeIds = [
      this.nodeIds.name,
      this.nodeIds.partsOK,
      this.nodeIds.partsNOK,
      this.nodeIds.status,
      this.nodeIds.warning,
      this.nodeIds.message,
      this.nodeIds.mode,
      this.nodeIds.disabled,
    ];

    const results = await this.opcuaService.readMultipleNodes(nodeIds);

    this.name = results[0].value as string;
    this.partsOK = results[1].value as number;
    this.partsNOK = results[2].value as number;
    this.status = this.mapStatus(results[3].value as string);
    this.warning = results[4].value as string;
    this.message = results[5].value as string;
    this.mode = this.mapMode(results[6].value as number);
    this.disabled = results[7].value as boolean;

    for (const device of this.devices.values()) {
      await device.refresh();
    }

    this.emit("updated", this);
  }

  /**
   * Handle subscription changes from OPCUA
   */
  private handleSubscriptionChanges(
    dataValue: any,
    callback: (station: Station) => void
  ): void {
    if (!this.nodeIds) return;

    const nodeId = dataValue.nodeId?.toString();
    const value = dataValue.value?.value;
    const varName = this.nodeIdToName.get(nodeId) || "unknown";

    // console.log(`[Station ${this.id}] ${varName} (${nodeId}) changed to:`, value, "statusCode:", dataValue.statusCode?.toString());

    switch (nodeId) {
      case this.nodeIds.name:
        this.name = value as string;
        break;
      case this.nodeIds.partsOK:
        this.partsOK = value as number;
        break;
      case this.nodeIds.partsNOK:
        this.partsNOK = value as number;
        break;
      case this.nodeIds.status:
        this.status = this.mapStatus(value as string);
        break;
      case this.nodeIds.warning:
        this.warning = value as string;
        break;
      case this.nodeIds.message:
        this.message = value as string;
        break;
      case this.nodeIds.mode:
        this.mode = this.mapMode(value as number);
        break;
      case this.nodeIds.disabled:
        this.disabled = value as boolean;
        break;
      default:
        console.log(`[Station ${this.id}] Unknown node ID in subscription: ${nodeId}`);
        return;
    }

    this.emit("updated", this);
    callback(this);
  }

  // Methods (for UI buttons) - convenience wrappers around write()

  /**
   * Reset Station statistics
   * Called from UI button
   */
  async resetStatistics(): Promise<void> {
    await this.write(`${this.id}.Control.xResetStatistics`, true);
  }

  /**
   * Enable the station
   * Called from UI button
   */
  async enable(): Promise<void> {
    await this.write(`${this.id}.Control.xDisabled`, false);
  }

  /**
   * Disable the station
   * Called from UI button
   */
  async disable(): Promise<void> {
    await this.write(`${this.id}.Control.xDisabled`, true);
  }

  /**
   * Set station mode
   * Called from UI selector
   */
  async setMode(mode: StationMode): Promise<void> {
    const modeMap: Record<StationMode, number> = {
      setup: 0,
      auto: 1,
      init: 2,
      end: 3,
      home : 4,
      error: 5
    };

    const modeValue = modeMap[mode] ?? 0;
    await this.write(`${this.id}.Control.iMode`, modeValue);
  }


  // Device management

  /**
   * Add a device to the station
   */
  addDevice(device: Device): void {
    this.devices.set(device.id, device);
    this.emit("deviceAdded", device);
  }

  /**
   * Remove a device from the station
   */
  removeDevice(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      this.devices.delete(deviceId);
      this.emit("deviceRemoved", device);
    }
  }

  /**
   * Get a specific device by ID
   */
  getDevice(id: string): Device | undefined {
    return this.devices.get(id);
  }

  /**
   * Get all devices
   */
  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get a typed Cylinder by ID
   */
  getCylinder(id: string): Cylinder | undefined {
    const device = this.devices.get(id);
    return device && device.type === "cylinder" ? device as Cylinder : undefined;
  }

  /**
   * Get a typed Motor by ID
   */
  getMotor(id: string): Motor | undefined {
    const device = this.devices.get(id);
    return device && device.type === "motor" ? device as Motor : undefined;
  }

  /**
   * Get a typed Valve by ID
   */
  getValve(id: string): Valve | undefined {
    const device = this.devices.get(id);
    return device && device.type === "valve" ? device as Valve : undefined;
  }

  /**
   * Get a typed Sensor by ID
   */
  getSensor(id: string): Sensor | undefined {
    const device = this.devices.get(id);
    return device && device.type === "sensor" ? device as Sensor : undefined;
  }

  /**
   * Get a typed Robot by ID
   */
  getRobot(id: string): Robot | undefined {
    const device = this.devices.get(id);
    return device && device.type === "robot" ? device as Robot : undefined;
  }

  /**
   * Get a typed Conveyor by ID
   */
  getConveyor(id: string): Conveyor | undefined {
    const device = this.devices.get(id);
    return device && device.type === "conveyor" ? device as Conveyor : undefined;
  }

  /**
   * Get a typed Drive by ID
   */
  getDrive(id: string): Drive | undefined {
    const device = this.devices.get(id);
    return device && device.type === "drive" ? device as Drive : undefined;
  }

  /**
   * Create a device instance based on type
   */
  createDevice(deviceId: string, type: DeviceType): Device {
    let device: Device;

    switch (type) {
      case "cylinder":
        device = new Cylinder(deviceId, this.id, this.nodeMapper, this.opcuaService);
        break;
      case "motor":
        device = new Motor(deviceId, this.id, this.nodeMapper, this.opcuaService);
        break;
      case "valve":
        device = new Valve(deviceId, this.id, this.nodeMapper, this.opcuaService);
        break;
      case "sensor":
        device = new Sensor(deviceId, this.id, this.nodeMapper, this.opcuaService);
        break;
      case "robot":
        device = new Robot(deviceId, this.id, this.nodeMapper, this.opcuaService);
        break;
      case "conveyor":
        device = new Conveyor(deviceId, this.id, this.nodeMapper, this.opcuaService);
        break;
      case "drive":
        device = new Drive(deviceId, this.id, this.nodeMapper, this.opcuaService);
        break;
      default:
        throw new Error(`Unknown device type: ${type}`);
    }

    this.addDevice(device);
    return device;
  }

  // Computed properties (for display)

  /**
   * Get station efficiency percentage
   */
  getEfficiency(): number {
    const total = this.partsOK + this.partsNOK;
    return total > 0 ? (this.partsOK / total) * 100 : 0;
  }

  /**
   * Get device count
   */
  getDeviceCount(): number {
    return this.devices.size;
  }

  /**
   * Get station statistics
   */
  getStatistics(): StationStatistics {
    return {
      totalParts: this.partsOK + this.partsNOK,
      partsOK: this.partsOK,
      partsNOK: this.partsNOK,
      scrapRate: this.getEfficiency() > 0 ? 100 - this.getEfficiency() : 0,
      efficiency: this.getEfficiency(),
      deviceCount: this.getDeviceCount(),
    };
  }

  // Event subscription

  /**
   * Subscribe to station update events
   */
  onUpdated(callback: (station: Station) => void): void {
    this.on("updated", callback);
  }

  /**
   * Unsubscribe from station update events
   */
  offUpdated(callback: (station: Station) => void): void {
    this.off("updated", callback);
  }

  /**
   * Subscribe to device added events
   */
  onDeviceAdded(callback: (device: Device) => void): void {
    this.on("deviceAdded", callback);
  }

  /**
   * Unsubscribe from device added events
   */
  offDeviceAdded(callback: (device: Device) => void): void {
    this.off("deviceAdded", callback);
  }

  /**
   * Subscribe to device removed events
   */
  onDeviceRemoved(callback: (device: Device) => void): void {
    this.on("deviceRemoved", callback);
  }

  /**
   * Unsubscribe from device removed events
   */
  offDeviceRemoved(callback: (device: Device) => void): void {
    this.off("deviceRemoved", callback);
  }

  /**
   * Subscribe to device updated events
   */
  onDeviceUpdated(callback: (device: Device) => void): void {
    this.on("deviceUpdated", callback);
  }

  /**
   * Unsubscribe from device updated events
   */
  offDeviceUpdated(callback: (device: Device) => void): void {
    this.off("deviceUpdated", callback);
  }

  // Private helpers

  /**
   * Map status string to StationStatus enum
   */
  private mapStatus(status: string): StationStatus {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("auto")) return "auto";
    if (statusLower.includes("warn")) return "warning";
    if (statusLower.includes("init")) return "init";
    if (statusLower.includes("home")) return "home";
    if (statusLower.includes("error")) return "error";
    return "setup";
  }

  /**
   * Map mode number to StationMode enum
   */
  private mapMode(mode: number): StationMode {
    if (mode === 0) return "setup";
    if (mode === 1) return "auto";
    if (mode === 2) return "init";
    if (mode === 3) return "end";
    if (mode === 4) return "home";
    return "error"
  }
}
