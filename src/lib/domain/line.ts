/**
 * Line Domain Model
 * 
 * Represents the production line with attributes for display and methods for UI interactions.
 * Uses OPCUA subscriptions for real-time updates.
 */

import { EventEmitter } from "events";
import { NodeMapper } from "../server/node-mapper";
import { OPCUAService } from "../server/opcua-service";
import { MonitoredDataValue } from "@/types/opcua.types";
import { Order } from "./order";
import { LineStatus, LineMode, DomainObject, LineStatistics } from "@/types/domain.types";

export class Line extends EventEmitter implements DomainObject {
  // Dependencies
  private nodeMapper: NodeMapper;
  private opcuaService: OPCUAService;
  private subscriptionId: string | null = null;

  // Attributes (for display)
  public name: string = "";
  public status: LineStatus = "setup";
  public mode: LineMode = "setup";
  public partsOK: number = 0;
  public partsNOK: number = 0;
  public errorMessage: string = "";
  public order: Order;

  // Track previous error message for change detection
  private previousErrorMessage: string = "";

  // Node IDs (cached for performance)
  private nodeIds: {
    name: string;
    partsOK: string;
    partsNOK: string;
    resetStatistics: string;
    status: string;
    errorMessage : string;
    mode: string;
    acknowledgeErrors: string;
  } | null = null;

  constructor(nodeMapper: NodeMapper, opcuaService: OPCUAService) {
    super();
    this.nodeMapper = nodeMapper;
    this.opcuaService = opcuaService;
    this.order = new Order(nodeMapper, opcuaService);
  }

  /**
   * Subscribe to all Line OPCUA nodes for real-time updates
   * Called when component mounts
   */
  async subscribe(callback: (line: Line) => void): Promise<void> {
    // Step 1: Get node IDs (cache them)
    if (!this.nodeIds) {
      this.nodeIds = {
        name: this.nodeMapper.getNodeId("Line.sName"),
        partsOK: this.nodeMapper.getNodeId("Line.dPartsOK"),
        partsNOK: this.nodeMapper.getNodeId("Line.dPartsNOK"),
        resetStatistics: this.nodeMapper.getNodeId("Line.xResetStatistics"),
        status: this.nodeMapper.getNodeId("Line.sInStatus"),
        errorMessage: this.nodeMapper.getNodeId("Line.sErrorMessage"),
        mode: this.nodeMapper.getNodeId("Line.iMode"),
        acknowledgeErrors: this.nodeMapper.getNodeId("Line.xAckErrors"),
      };
    }

    // Step 2: Subscribe to OPCUA nodes
    const nodeIds = [
      this.nodeIds.name,
      this.nodeIds.partsOK,
      this.nodeIds.partsNOK,
      this.nodeIds.status,
      this.nodeIds.mode,
      this.nodeIds.errorMessage,
    ];

    this.subscriptionId = await this.opcuaService.subscribe(
      nodeIds,
      (dataValue: MonitoredDataValue) => this.handleSubscriptionChanges(dataValue, callback)
    );

    // Step 3: Subscribe to order
    await this.order.subscribe((order) => {
      this.order = order;
      callback(this);
    });

    // Step 4: Initial refresh to get current values
    await this.refresh();
  }

  /**
   * Unsubscribe from all Line OPCUA nodes
   * Called when component unmounts
   */
  async unsubscribe(): Promise<void> {
    if (this.subscriptionId) {
      await this.opcuaService.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }

    await this.order.unsubscribe();
  }

  /**
   * Write value to a Line OPCUA node
   * Called from UI buttons or input changes
   * 
   * Usage:
   * - line.write("Line.xResetStatistics", true)  // Reset statistics button
   * - line.write("Line.xAckErrors", true)        // Acknowledge errors button
   * - line.write("Line.iMode", 0)               // Mode selector (0=auto, 1=manual)
   */
  async write(variablePath: string, value: unknown): Promise<void> {
    const nodeId = this.nodeMapper.getNodeId(variablePath);
    await this.opcuaService.writeNode(nodeId, value);
  }

  /**
   * Refresh all Line data from OPCUA server
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
      this.nodeIds.mode,
      this.nodeIds.errorMessage,
    ];

    const results = await this.opcuaService.readMultipleNodes(nodeIds);

    this.name = results[0].value as string;
    this.partsOK = results[1].value as number;
    this.partsNOK = results[2].value as number;
    this.status = this.mapStatus(results[3].value as string);
    this.mode = this.mapMode(results[4].value as number);
    this.errorMessage = results[5].value as string;

    // Initialize previousErrorMessage for change detection
    this.previousErrorMessage = this.errorMessage;

    await this.order.refresh();

    this.emit("updated", this);
  }

  /**
   * Handle subscription changes from OPCUA
   */
  private handleSubscriptionChanges(
    dataValue: MonitoredDataValue,
    callback: (line: Line) => void
  ): void {
    if (!this.nodeIds) return;

    const nodeId = dataValue.nodeId?.toString();
    const value = dataValue.value?.value;

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
      case this.nodeIds.mode:
        this.mode = this.mapMode(value as number);
        break;
      case this.nodeIds.errorMessage:
        const oldError = this.previousErrorMessage;
        this.previousErrorMessage = this.errorMessage;
        this.errorMessage = value as string;

        // Emit error event only if this is a NEW error (error message changed)
        // and there are listeners (avoid error during initialization)
        if (oldError !== this.errorMessage && this.errorMessage && this.listenerCount("error") > 0) {
          this.emit("error", {
            lineName: this.name || "Line",
            errorMessage: this.errorMessage,
          });
        }
        break;
    }

    this.emit("updated", this);
    callback(this);
  }

  // Methods (for UI buttons) - convenience wrappers around write()

  /**
   * Reset line statistics
   * @param value - true to activate, false to deactivate
   * Called from UI button
   */
  async resetStatistics(value: boolean): Promise<void> {
    await this.write("Line.xResetStatistics", value);
  }

  /**
   * Acknowledge Line errors
   * @param value - true to activate, false to deactivate
   * Called from UI button
   */
  async acknowledgeErrors(value: boolean): Promise<void> {
    await this.write("Line.xAckErrors", value);
  }


  /**
   * Set Line mode
   * Called from UI selector
   */

  async setMode(mode: LineMode): Promise<void> {
    const modeMap: Record<LineMode, number> = {
      setup: 0,
      auto: 1,
      init: 2,
      end: 3,
      error : 4
    };

    const modeValue = modeMap[mode] ?? 0;
    await this.write("Line.iMode", modeValue);
  }


  // Computed properties (for display)

  /**
   * Get total parts produced
   */
  getTotalParts(): number {
    return this.partsOK + this.partsNOK;
  }

  /**
   * Get line efficiency percentage
   */
  getEfficiency(): number {
    const total = this.getTotalParts();
    return total > 0 ? (this.partsOK / total) * 100 : 0;
  }

  /**
   * Get scrap rate percentage
   */
  getScrapRate(): number {
    const total = this.getTotalParts();
    return total > 0 ? (this.partsNOK / total) * 100 : 0;
  }

  /**
   * Get line statistics
   */
  getStatistics(): LineStatistics {
    return {
      totalParts: this.getTotalParts(),
      partsOK: this.partsOK,
      partsNOK: this.partsNOK,
      scrapRate: this.getScrapRate(),
      efficiency: this.getEfficiency(),
    };
  }

  // Event subscription

  /**
   * Subscribe to line update events
   */
  onUpdated(callback: (line: Line) => void): void {
    this.on("updated", callback);
  }

  /**
   * Unsubscribe from line update events
   */
  offUpdated(callback: (line: Line) => void): void {
    this.off("updated", callback);
  }

  // Private helpers

  /**
   * Map status string to LineStatus enum
   */
  private mapStatus(status: string): LineStatus {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("auto")) return "auto";
    if (statusLower.includes("warn")) return "warning";
    if (statusLower.includes("init")) return "init";
    if (statusLower.includes("home")) return "home";
    if (statusLower.includes("error")) return "error";
    if (statusLower.includes("end")) return "end";
    return "setup";
  }

  /**
   * Map mode number to LineMode enum
   */
  private mapMode(mode: number): LineMode {
    if (mode === 0) return "setup";
    if (mode === 1) return "auto";
    if (mode === 2) return "init";
    if (mode === 3) return "end";
    return "error";
  }
}
