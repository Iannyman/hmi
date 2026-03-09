/**
 * HMI Service Locator
 *
 * Provides access to the HMIManager singleton with explicit initialization.
 * Uses globalThis for cross-context sharing (required for Next.js Server Actions).
 *
 * Usage:
 * 1. Initialize once: await HMILocator.initialize(browseTree)
 * 2. Get instance: const hmi = HMILocator.getInstance()
 * 3. Check ready: if (HMILocator.isReady()) ...
 */

import { NodeMapper } from "./node-mapper";
import opcuaService from "./opcua-service";
import { HMIManager } from "./hmi-manager";
import { AlarmLocator } from "./alarm-locator";

// Type declaration for the global property
declare global {
  // eslint-disable-next-line no-var
  var __HMI_MANAGER_INSTANCE__: HMIManager | undefined;
}

class HMILocator {
  private static isInitializing: boolean = false;

  /**
   * Initialize the HMI Manager
   * Must be called before getInstance()
   * @param browseTree - The browse tree from OPC UA server
   * @returns The existing instance if already initialized, or a new instance
   */
  static async initialize(browseTree: any[]): Promise<HMIManager> {
    // Return existing instance if already initialized (supports multiple clients)
    if (global.__HMI_MANAGER_INSTANCE__) {
      return global.__HMI_MANAGER_INSTANCE__;
    }

    if (this.isInitializing) {
      throw new Error("HMI Manager is already being initialized");
    }

    this.isInitializing = true;

    try {
      const nodeMapper = new NodeMapper();
      const instance = new HMIManager(nodeMapper, opcuaService);
      await instance.initialize(browseTree);

      // Store in globalThis for cross-context sharing
      global.__HMI_MANAGER_INSTANCE__ = instance;

      // Initialize the Alarm Manager with the HMI Manager
      await AlarmLocator.initialize(instance);
      console.log("[HMILocator] Alarm Manager initialized");

      return instance;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Get the HMI Manager instance
   * @throws Error if not initialized
   */
  static getInstance(): HMIManager {
    const instance = global.__HMI_MANAGER_INSTANCE__;
    if (!instance) {
      throw new Error(
        "HMI Manager not initialized. Call HMILocator.initialize(browseTree) first."
      );
    }
    return instance;
  }

  /**
   * Check if HMI Manager is ready
   */
  static isReady(): boolean {
    const instance = global.__HMI_MANAGER_INSTANCE__;
    return instance !== undefined && instance.isReady();
  }

  /**
   * Reset the HMI Manager
   * Clears the instance and allows re-initialization
   */
  static async reset(): Promise<void> {
    const instance = global.__HMI_MANAGER_INSTANCE__;
    if (instance) {
      await instance.reset();
      global.__HMI_MANAGER_INSTANCE__ = undefined;
    }

    // Also reset the Alarm Manager
    AlarmLocator.reset();
  }

  /**
   * Get the Line object (convenience method)
   */
  static getLine() {
    return this.getInstance().getLine();
  }

  /**
   * Get a Station by ID (convenience method)
   */
  static getStation(stationId: string) {
    return this.getInstance().getStation(stationId);
  }

  /**
   * Get all Stations (convenience method)
   */
  static getAllStations() {
    return this.getInstance().getAllStations();
  }
}

export { HMILocator };
