/**
 * Node Mapper
 * 
 * Maps OPCUA node IDs to variable paths and manages structure discovery.
 * Converts variable paths (e.g., "Line.sName") to node IDs (e.g., "ns=5;i=18").
 */

import { NodeIDMap, ParsedNodeId, StructureChange } from "@/types/domain.types";
import { BrowseTreeNode } from "@/types/opcua.types";

const NAMESPACE = Number(process.env.NEXT_PUBLIC_OPCUA_NAMESPACE) || 4; // default node in OPC UA

export class NodeMapper {
  private nodeIdMap: NodeIDMap | null = null;

  /**
   * Build node ID map from OPCUA browse tree
   * @param browseTree - The browse tree from OPCUA server
   * @returns The built node ID map
   */
  buildNodeIdMap(browseTree: BrowseTreeNode[]): NodeIDMap {
    // console.log("buildNodeIdMap called with browseTree:", JSON.stringify(browseTree, null, 2));

    const map: NodeIDMap = {
      namespace: NAMESPACE,
      variables: {},
      stations: [],
      devices: {}
    };

    // If root is a container node (like "hmi"), process its children directly
    // This avoids prefixing paths with "hmi." when Line class expects "Line.sName"
    const nodesToProcess = this.shouldSkipRootNode(browseTree)
      ? browseTree[0].children || []
      : browseTree;

    this.processBrowseTree(nodesToProcess, map);
    this.nodeIdMap = map;

    // console.log("Node ID map built:", {
    //   namespace: map.namespace,
    //   stations: map.stations,
    //   devices: map.devices,
    //   variableCount: Object.keys(map.variables).length,
    //   variables: Object.keys(map.variables).slice(0, 50) // Log first 50 variables
    // });
    // console.log("ALL variable paths:", Object.keys(map.variables));
    
    return map;
  }

  /**
   * Update node ID map and detect structure changes
   * @param newBrowseTree - The new browse tree from OPCUA server
   * @returns Updated map and list of structure changes
   */
  updateNodeIdMap(newBrowseTree: BrowseTreeNode[]): {
    updatedMap: NodeIDMap;
    changes: StructureChange[];
  } {
    const oldMap = this.nodeIdMap;
    const newMap = this.buildNodeIdMap(newBrowseTree);
    const changes = this.detectStructureChanges(oldMap, newMap);
    
    this.nodeIdMap = newMap;
    
    if (changes.length > 0) {
      console.log("Structure changes detected:", changes);
    }
    
    return { updatedMap: newMap, changes };
  }

  /**
   * Get node ID for a variable path
   * @param path - Variable path (e.g., "Line.sName")
   * @returns Node ID string (e.g., "ns=5;i=18")
   * @throws Error if node ID map is not initialized or path not found
   */
  getNodeId(path: string): string {
    if (!this.nodeIdMap) {
      throw new Error("Node ID map not initialized. Call buildNodeIdMap() first.");
    }

    const identifier = this.nodeIdMap.variables[path];
    if (identifier === undefined) {
      console.error(`Node ID not found for path: ${path}`);
      console.error("Available paths:", Object.keys(this.nodeIdMap.variables));
      throw new Error(`Node ID not found for path: ${path}`);
    }

    return this.formatNodeId(this.nodeIdMap.namespace, identifier);
  }

  /**
   * Get all station IDs
   * @returns Array of station IDs
   */
  getStationIds(): string[] {
    if (!this.nodeIdMap) {
      throw new Error("Node ID map not initialized");
    }
    return [...this.nodeIdMap.stations];
  }

  /**
   * Get device IDs for a specific station
   * @param stationId - The station ID
   * @returns Array of device IDs for the station
   */
  getDeviceIds(stationId: string): string[] {
    if (!this.nodeIdMap) {
      throw new Error("Node ID map not initialized");
    }
    return this.nodeIdMap.devices[stationId] || [];
  }

  /**
   * Get the current node ID map
   * @returns The current node ID map or null if not initialized
   */
  getNodeIdMap(): NodeIDMap | null {
    return this.nodeIdMap;
  }

  /**
   * Get variable path for a node ID (reverse lookup)
   * @param nodeId - Node ID string (e.g., "ns=5;i=18")
   * @returns Variable path (e.g., "Line.sName") or null if not found
   */
  getPathByNodeId(nodeId: string): string | null {
    if (!this.nodeIdMap) {
      return null;
    }

    const parsed = this.parseNodeId(nodeId);
    if (!parsed) {
      return null;
    }

    // Search for matching path
    for (const [path, identifier] of Object.entries(this.nodeIdMap.variables)) {
      if (identifier === parsed.identifier) {
        return path;
      }
    }

    return null;
  }

  /**
   * Check if root node should be skipped (it's a container like "hmi")
   * @param browseTree - The browse tree to check
   * @returns True if root is a container that should be skipped
   */
  private shouldSkipRootNode(browseTree: BrowseTreeNode[]): boolean {
    if (browseTree.length !== 1) return false;

    const root = browseTree[0];
    // Skip root if it's a well-known container (hmi) with children
    const isContainer = root.displayName === "hmi" || root.browseName === "hmi";
    const hasChildren = !!(root.children && root.children.length > 0);

    return isContainer && hasChildren;
  }

  /**
   * Process browse tree recursively to build node ID map
   * @param nodes - Array of browse tree nodes
   * @param map - The node ID map to populate
   * @param parentPath - The parent path for recursion
   */
  private processBrowseTree(
    nodes: BrowseTreeNode[],
    map: NodeIDMap,
    parentPath: string = ""
  ): void {
    // console.log("processBrowseTree called with", {
    //   nodeCount: nodes.length,
    //   parentPath,
    //   firstNode: nodes[0]
    // });

    for (const node of nodes) {
      // Use displayName to avoid namespace prefix (e.g., "Line" not "5:Line")
      const name = node.displayName || node.browseName;
      const currentPath = parentPath ? `${parentPath}.${name}` : name;

      // console.log(`Processing node: ${currentPath}`, {
      //   browseName: node.browseName,
      //   displayName: node.displayName,
      //   nodeId: node.nodeId,
      //   nodeClass: node.nodeClass,
      //   hasChildren: node.children && node.children.length > 0
      // });

      // Extract station information
      if (name.startsWith("Station_")) {
        const stationId = name;
        if (!map.stations.includes(stationId)) {
          map.stations.push(stationId);
        }
        map.devices[stationId] = [];
      }

      // Store variable node IDs
      const parsed = this.parseNodeId(node.nodeId);
      if (parsed) {
        map.variables[currentPath] = parsed.identifier;
        // console.log(`Stored variable: ${currentPath} -> identifier: ${parsed.identifier}`);
      }

      // Process children
      if (node.children && node.children.length > 0) {
        this.processBrowseTree(node.children, map, currentPath);

        // Extract device information
        if (parentPath.startsWith("Station_") && !currentPath.includes("Control")) {
          const stationId = parentPath.split(".")[0];
          const deviceId = name;
          if (!map.devices[stationId].includes(deviceId)) {
            map.devices[stationId].push(deviceId);
          }
        }
      }
    }
  }

  /**
   * Detect structure changes (new stations/devices)
   * @param oldMap - The old node ID map
   * @param newMap - The new node ID map
   * @returns Array of structure changes
   */
  private detectStructureChanges(
    oldMap: NodeIDMap | null,
    newMap: NodeIDMap
  ): StructureChange[] {
    const changes: StructureChange[] = [];

    if (!oldMap) {
      // Initial discovery - all stations and devices are new
      for (const stationId of newMap.stations) {
        changes.push({ type: "station_added", stationId });
        for (const deviceId of newMap.devices[stationId] || []) {
          changes.push({ type: "device_added", stationId, deviceId });
        }
      }
      return changes;
    }

    // Detect new stations
    for (const stationId of newMap.stations) {
      if (!oldMap.stations.includes(stationId)) {
        changes.push({ type: "station_added", stationId });
      }
    }

    // Detect removed stations
    for (const stationId of oldMap.stations) {
      if (!newMap.stations.includes(stationId)) {
        changes.push({ type: "station_removed", stationId });
      }
    }

    // Detect new/removed devices
    for (const stationId of newMap.stations) {
      const oldDevices = oldMap.devices[stationId] || [];
      const newDevices = newMap.devices[stationId] || [];

      for (const deviceId of newDevices) {
        if (!oldDevices.includes(deviceId)) {
          changes.push({ type: "device_added", stationId, deviceId });
        }
      }

      for (const deviceId of oldDevices) {
        if (!newDevices.includes(deviceId)) {
          changes.push({ type: "device_removed", stationId, deviceId });
        }
      }
    }

    return changes;
  }

  /**
   * Parse node ID string
   * Handles both numeric (i=18) and string (s=Variable.Path) identifiers
   * @param nodeId - Node ID string (e.g., "ns=5;i=18", "ns=5;s=Line.sName", or "i=18")
   * @returns Parsed node ID or null if invalid
   */
  private parseNodeId(nodeId: string): ParsedNodeId | null {
    // Try full numeric format: ns=5;i=18
    let match = nodeId.match(/ns=(\d+);i=(\d+)/);
    if (match) {
      return {
        namespace: parseInt(match[1], 10),
        identifier: parseInt(match[2], 10)
      };
    }

    // Try full string format: ns=5;s=Line.Order.sType
    match = nodeId.match(/ns=(\d+);s=(.+)/);
    if (match) {
      return {
        namespace: parseInt(match[1], 10),
        identifier: match[2] // Keep the string identifier as-is
      };
    }

    // Try short numeric format: i=18 (use default namespace 5)
    match = nodeId.match(/i=(\d+)/);
    if (match) {
      return {
        namespace: NAMESPACE, // Default namespace for HMI
        identifier: parseInt(match[1], 10)
      };
    }

    // Try short string format: s=Line.Order.sType (use default namespace 5)
    match = nodeId.match(/s=(.+)/);
    if (match) {
      return {
        namespace: NAMESPACE,
        identifier: match[1] // Keep the string identifier as-is
      };
    }

    return null;
  }

  /**
   * Format node ID from namespace and identifier
   * @param namespace - The namespace number
   * @param identifier - The identifier (number for numeric IDs, string for string IDs)
   * @returns Node ID string (e.g., "ns=5;i=18" or "ns=5;s=Line.Order.sType")
   */
  private formatNodeId(namespace: number, identifier: number | string): string {
    if (typeof identifier === "string") {
      return `ns=${namespace};s=${identifier}`;
    }
    return `ns=${namespace};i=${identifier}`;
  }
}
