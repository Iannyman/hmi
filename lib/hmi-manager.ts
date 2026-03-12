/**
 * HMI Manager
 * 
 * Central manager class that ties together all HMI domain objects.
 * Manages initialization, subscriptions, and provides easy access to Line, Station, and Device objects.
 */

import { EventEmitter } from "events";
import { NodeMapper } from "./node-mapper";
import { Line } from "./domain/line";
import { Station } from "./domain/station";
import { StructureChange } from "@/types/domain.types";

export class HMIManager extends EventEmitter {
  private nodeMapper: NodeMapper;
  private opcuaService: any; // Using any for OPCUAService to avoid type issues
  private line: Line | null = null;
  private stations: Map<string, Station> = new Map();
  private isInitialized: boolean = false;

  constructor(nodeMapper: NodeMapper, opcuaService: any) {
    super();
    this.nodeMapper = nodeMapper;
    this.opcuaService = opcuaService;
  }

  /**
   * Initialize HMI system
   * Browses OPCUA structure, builds node ID map, creates all domain objects
   * @param browseTree - The browse tree from OPCUA server
   */
  async initialize(browseTree: any[]): Promise<void> {
    if (this.isInitialized) {
      console.log("HMI Manager already initialized");
      return;
    }

    console.log("Initializing HMI Manager...");

    // Step 1: Build node ID map from browse tree
    const nodeIdMap = this.nodeMapper.buildNodeIdMap(browseTree);
    // console.log("Node ID map built:", {
    //   namespace: nodeIdMap.namespace,
    //   stations: nodeIdMap.stations,
    //   devices: nodeIdMap.devices,
    //   variableCount: Object.keys(nodeIdMap.variables).length
    // });

    // Step 2: Create Line object
    this.line = new Line(this.nodeMapper, this.opcuaService);
    console.log("Line object created");

    // Step 3: Create Station objects
    for (const stationId of nodeIdMap.stations) {
      const station = new Station(stationId, this.nodeMapper, this.opcuaService);
      
      // Create devices for this station
      const deviceIds = nodeIdMap.devices[stationId] || [];
      for (const deviceId of deviceIds) {
        const deviceType = this.getDeviceType(deviceId);
        station.createDevice(deviceId, deviceType);
        // console.log(`Device created: ${stationId}.${deviceId} (type: ${deviceType})`);
      }
      
      this.stations.set(stationId, station);
      // console.log(`Station object created: ${stationId} with ${deviceIds.length} devices`);
    }

    // Step 4: Subscribe to Line updates
    console.log("[HMI Manager] Subscribing to Line updates...");
    await this.line.subscribe((line) => {
      // console.log("[HMI Manager] Line update received:", line.name, "status:", line.status);
      this.emit("line:updated", line);
    });
    // console.log("[HMI Manager] Line subscription created successfully");

    // Step 5: Subscribe to all Station data (Control + Devices)
    for (const station of this.stations.values()) {
      console.log(`[HMI Manager] Subscribing to Station ${station.id} (Control + Devices)...`);
      await station.subscribe((updatedStation) => {
        this.emit("station:updated", updatedStation);
      }, true); // includeDevices = true - subscribe to everything
      console.log(`[HMI Manager] Station ${station.id} subscription complete`);
    }

    // Step 6: Subscribe to device updates
    for (const station of this.stations.values()) {
      station.onDeviceAdded((device) => {
        this.emit("device:added", { stationId: station.id, device });
      });

      station.onDeviceRemoved((device) => {
        this.emit("device:removed", { stationId: station.id, device });
      });

      station.onDeviceUpdated((device) => {
        this.emit("device:updated", { stationId: station.id, device });
      });
    }

    // Step 7: Subscribe to device error messages globally (for alarm detection)
    // This ensures alarms are detected regardless of which page the user is on
    console.log("[HMI Manager] Subscribing to device error messages globally...");
    await this.subscribeToDeviceErrorMessages();

    this.isInitialized = true;
    console.log("HMI Manager initialized successfully");
    this.emit("initialized", this);
  }

  /**
   * Re-discover structure (for new stations/devices)
   * Browses OPCUA structure again and detects changes
   * @param browseTree - The new browse tree from OPCUA server
   * @returns Structure changes detected
   */
  async rediscoverStructure(browseTree: any[]): Promise<StructureChange[]> {
    console.log("Re-discovering HMI structure...");

    const { updatedMap, changes } = this.nodeMapper.updateNodeIdMap(browseTree);
    
    // Handle structure changes
    for (const change of changes) {
      switch (change.type) {
        case "station_added":
          if (change.stationId) {
            const station = new Station(change.stationId, this.nodeMapper, this.opcuaService);
            this.stations.set(change.stationId, station);
            await station.subscribe((updatedStation) => {
              this.emit("station:updated", updatedStation);
            });
            // console.log(`New station added: ${change.stationId}`);
          }
          break;
          
        case "station_removed":
          if (change.stationId) {
            const station = this.stations.get(change.stationId);
            if (station) {
              await station.unsubscribe();
              this.stations.delete(change.stationId);
              // console.log(`Station removed: ${change.stationId}`);
            }
          }
          break;
          
        case "device_added":
          if (change.stationId && change.deviceId) {
            const station = this.stations.get(change.stationId);
            if (station) {
              const device = station.createDevice(change.deviceId, this.getDeviceType(change.deviceId));
              await device.subscribe((updatedDevice) => {
                this.emit("device:updated", { stationId: change.stationId, device: updatedDevice });
              });
              // console.log(`New device added: ${change.stationId}.${change.deviceId}`);
            }
          }
          break;
          
        case "device_removed":
          if (change.stationId && change.deviceId) {
            const station = this.stations.get(change.stationId);
            if (station) {
              const device = station.getDevice(change.deviceId);
              if (device) {
                await device.unsubscribe();
                station.removeDevice(change.deviceId);
                // console.log(`Device removed: ${change.stationId}.${change.deviceId}`);
              }
            }
          }
          break;
      }
    }

    this.emit("structure:changed", changes);
    return changes;
  }

  /**
   * Get Line object
   */
  getLine(): Line {
    if (!this.line) {
      throw new Error("HMI Manager not initialized. Call initialize() first.");
    }
    return this.line;
  }

  /**
   * Get Station object by ID
   */
  getStation(stationId: string): Station | undefined {
    return this.stations.get(stationId);
  }

  /**
   * Get all Station objects
   */
  getAllStations(): Station[] {
    return Array.from(this.stations.values());
  }

  /**
   * Get station count
   */
  getStationCount(): number {
    return this.stations.size;
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset HMI Manager state
   * Clears all subscriptions and resets initialization state
   * Call this when OPC UA connection is lost to prepare for reconnection
   */
  async reset(): Promise<void> {
    console.log("Resetting HMI Manager...");

    // Unsubscribe from all stations
    for (const station of this.stations.values()) {
      try {
        await station.unsubscribe();
      } catch (err) {
        console.error(`Failed to unsubscribe station ${station.id}:`, err);
      }
    }

    // Unsubscribe from line
    if (this.line) {
      try {
        await this.line.unsubscribe();
      } catch (err) {
        console.error("Failed to unsubscribe line:", err);
      }
    }

    // Clear all state
    this.stations.clear();
    this.line = null;
    this.isInitialized = false;

    // Remove all listeners
    this.removeAllListeners();

    console.log("HMI Manager reset complete");
  }

  /**
   * Get device type from device ID
   */
  private getDeviceType(deviceId: string): "cylinder" | "motor" | "valve" | "sensor" | "robot" | "conveyor" | "drive" {
    const deviceIdLower = deviceId.toLowerCase();
    
    if (deviceIdLower.includes("cylinder")) return "cylinder";
    if (deviceIdLower.includes("motor")) return "motor";
    if (deviceIdLower.includes("valve")) return "valve";
    if (deviceIdLower.includes("sensor")) return "sensor";
    if (deviceIdLower.includes("robot")) return "robot";
    if (deviceIdLower.includes("conveyor")) return "conveyor";
    if (deviceIdLower.includes("drive")) return "drive";
    
    return "cylinder"; // Default
  }

  // Event subscription methods

  /**
   * Subscribe to line updates
   */
  onLineUpdated(callback: (line: Line) => void): void {
    this.on("line:updated", callback);
  }

  /**
   * Subscribe to station updates
   */
  onStationUpdated(callback: (station: Station) => void): void {
    this.on("station:updated", callback);
  }

  /**
   * Subscribe to device added events
   */
  onDeviceAdded(callback: (event: { stationId: string; device: any }) => void): void {
    this.on("device:added", callback);
  }

  /**
   * Subscribe to device removed events
   */
  onDeviceRemoved(callback: (event: { stationId: string; device: any }) => void): void {
    this.on("device:removed", callback);
  }

  /**
   * Subscribe to device updated events
   */
  onDeviceUpdated(callback: (event: { stationId: string; device: any }) => void): void {
    this.on("device:updated", callback);
  }

  /**
   * Subscribe to structure changed events
   */
  onStructureChanged(callback: (changes: StructureChange[]) => void): void {
    this.on("structure:changed", callback);
  }

  /**
   * Subscribe to initialized event
   */
  onInitialized(callback: () => void): void {
    this.on("initialized", callback);
  }

  /**
   * Unsubscribe from line update events
   */
  offLineUpdated(callback: (line: Line) => void): void {
    this.off("line:updated", callback);
  }

  /**
   * Unsubscribe from station update events
   */
  offStationUpdated(callback: (station: Station) => void): void {
    this.off("station:updated", callback);
  }

  /**
   * Unsubscribe from device added events
   */
  offDeviceAdded(callback: (event: { stationId: string; device: any }) => void): void {
    this.off("device:added", callback);
  }

  /**
   * Unsubscribe from device removed events
   */
  offDeviceRemoved(callback: (event: { stationId: string; device: any }) => void): void {
    this.off("device:removed", callback);
  }

  /**
   * Unsubscribe from device updated events
   */
  offDeviceUpdated(callback: (event: { stationId: string; device: any }) => void): void {
    this.off("device:updated", callback);
  }

  /**
   * Unsubscribe from structure changed events
   */
  offStructureChanged(callback: (changes: StructureChange[]) => void): void {
    this.off("structure:changed", callback);
  }

  /**
   * Subscribe to device error messages globally
   * This ensures alarm detection works regardless of current route
   * Subscribes only to xErrorMessage nodes for cylinders (lightweight)
   */
  private async subscribeToDeviceErrorMessages(): Promise<void> {
    const errorNodeIds: string[] = [];
    const errorNodeToDeviceMap: Map<string, { stationId: string; device: any }> = new Map();

    // Collect all error message node IDs from cylinders
    for (const station of this.stations.values()) {
      const devices = station.getDevices();
      for (const device of devices) {
        if (device.type === "cylinder") {
          const errorNodeId = this.nodeMapper.getNodeId(`${station.id}.${device.id}.sErrorMessage`);
          errorNodeIds.push(errorNodeId);
          errorNodeToDeviceMap.set(errorNodeId, { stationId: station.id, device });
        }
      }
    }

    if (errorNodeIds.length === 0) {
      console.log("[HMI Manager] No cylinder devices found for error monitoring");
      return;
    }

    // Create subscription for all error messages
    const subscriptionId = await this.opcuaService.subscribe(
      errorNodeIds,
      (dataValue: any) => {
        const nodeId = dataValue.nodeId?.toString();
        const value = dataValue.value?.value;

        const mapped = errorNodeToDeviceMap.get(nodeId);
        if (mapped) {
          const { stationId, device } = mapped;
          // Update the device's errorMessage directly
          (device as any).errorMessage = value || "";

          // Trigger error handling by calling updateStatus if it's a cylinder
          if (typeof (device as any).updateStatus === "function") {
            (device as any).updateStatus();
          }
        }
      }
    );

    console.log(`[HMI Manager] Subscribed to ${errorNodeIds.length} device error message nodes`);
  }
}
