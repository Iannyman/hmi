/**
 * S7 Service for Siemens PLC Communication via nodes7
 *
 * Provides promisified methods for reading/writing PLC data blocks.
 * Runs as a parallel communication channel alongside OPC UA.
 */

import NodeS7 from "nodes7";
import {
  S7Config,
  S7AddressEntry,
  S7ArrayEntry,
  S7Value,
  S7ConnectionStatus,
} from "@/types/s7.types";
import { S7_ADDRESS_MAP } from "./s7-address-map";
import {
  S7ConnectionError,
  S7NotConnectedError,
  S7ReadError,
  S7WriteError,
  S7ValidationError,
} from "./s7-errors";

class S7Service {
  private conn: NodeS7 | null = null;
  private config: S7Config | null = null;
  private connected = false;
  private busy = false;
  private addressMap = new Map<string, S7AddressEntry | S7ArrayEntry>();

  constructor() {
    this.loadAddressMap(S7_ADDRESS_MAP);
  }

  // ============================================================================
  // Address Map Management
  // ============================================================================

  loadAddressMap(entries: (S7AddressEntry | S7ArrayEntry)[]): void {
    this.addressMap.clear();
    for (const entry of entries) {
      this.addressMap.set(entry.name, entry);
    }
  }

  getAddressEntries(): (S7AddressEntry | S7ArrayEntry)[] {
    return Array.from(this.addressMap.values());
  }

  getAddressEntry(name: string): S7AddressEntry | S7ArrayEntry | undefined {
    return this.addressMap.get(name);
  }

  // ============================================================================
  // Connection Lifecycle
  // ============================================================================

  async connect(config: S7Config): Promise<void> {
    if (this.connected && this.conn) {
      console.log("[S7] Already connected, skipping");
      return;
    }

    const { host, port = 102, rack = 0, slot = 1 } = config;

    const conn = new NodeS7();

    await new Promise<void>((resolve, reject) => {
      conn.initiateConnection({ port, host, rack, slot }, (err: unknown) => {
        if (err) {
          reject(new S7ConnectionError(`Failed to connect to ${host}:${port}: ${err}`));
        } else {
          resolve();
        }
      });
    });

    conn.setTranslationCB((tag: string) => {
      const entry = this.addressMap.get(tag);
      return entry ? entry.address : tag;
    });

    // Register all address map items for polling
    if (this.addressMap.size > 0) {
      conn.addItems(Array.from(this.addressMap.keys()));
    }

    this.conn = conn;
    this.config = config;
    this.connected = true;

    console.log(`[S7] Connected to ${host}:${port} (rack=${rack}, slot=${slot}), ${this.addressMap.size} addresses mapped`);
  }

  async disconnect(): Promise<void> {
    if (!this.conn) {
      return;
    }

    try {
      await new Promise<void>((resolve) => {
        this.conn!.dropConnection(() => {
          resolve();
        });
      });
    } catch (error) {
      console.error("[S7] Error during disconnect (non-critical):", error);
    }

    this.conn = null;
    this.config = null;
    this.connected = false;
    console.log("[S7] Disconnected");
  }

  // ============================================================================
  // State Queries
  // ============================================================================

  isConnected(): boolean {
    return this.connected && this.conn !== null;
  }

  getStatus(): S7ConnectionStatus {
    if (!this.config) {
      return { connected: false };
    }
    return {
      connected: this.connected,
      host: this.config.host,
      port: this.config.port,
      rack: this.config.rack,
      slot: this.config.slot,
    };
  }

  // ============================================================================
  // Read Operations
  // ============================================================================

  async readByName(names: string[]): Promise<S7Value[]> {
    this.ensureConnected();
    await this.ensureReady();

    // Validate all names exist
    for (const name of names) {
      if (!this.addressMap.has(name)) {
        throw new S7ValidationError(`Unknown address name: "${name}"`);
      }
    }

    this.conn!.addItems(names);

    const values = await this.readAllItemsInternal();

    const now = new Date();
    return names.map((name) => ({
      name,
      address: this.addressMap.get(name)!.address,
      value: values[name],
      quality: values[name] === undefined ? "bad" as const : "good" as const,
      timestamp: now,
    }));
  }

  async readByAddress(addresses: string[]): Promise<S7Value[]> {
    this.ensureConnected();
    await this.ensureReady();

    // Override translation to pass through raw addresses
    this.conn!.setTranslationCB((tag: string) => {
      const match = tag.match(/^__temp_\d+_(.+)$/);
      return match ? match[1] : (this.addressMap.get(tag)?.address ?? tag);
    });

    const tempNames = addresses.map((addr, i) => `__temp_${i}_${addr}`);
    this.conn!.addItems(tempNames);

    const values = await this.readAllItemsInternal();

    // Remove temp items and restore standard translation
    this.conn!.removeItems(tempNames);
    this.restoreTranslation();

    const now = new Date();
    return addresses.map((address, i) => ({
      name: address,
      address,
      value: values[tempNames[i]],
      quality: values[tempNames[i]] === undefined ? "bad" as const : "good" as const,
      timestamp: now,
    }));
  }

  async readAll(): Promise<S7Value[]> {
    return this.readByName(Array.from(this.addressMap.keys()));
  }

  async readByIndex(name: string, index: number): Promise<S7Value> {
    const entry = this.getArrayEntry(name);
    this.validateIndex(entry, index);

    const offset = this.getBaseOffset(entry) + index * entry.elementSize;
    const address = `${this.getDbNumber(entry.address)},${entry.elementType}${offset}`;

    const results = await this.readByAddress([address]);
    return {
      ...results[0],
      name: `${name}[${index}]`,
    };
  }

  // ============================================================================
  // Write Operations
  // ============================================================================

  async writeByName(items: { name: string; value: unknown }[]): Promise<void> {
    this.ensureConnected();
    await this.ensureReady();

    for (const item of items) {
      const entry = this.addressMap.get(item.name);
      if (!entry) {
        throw new S7ValidationError(`Unknown address name: "${item.name}"`);
      }
      if (entry.readOnly) {
        throw new S7ValidationError(`Variable "${item.name}" is read-only`);
      }
    }

    const names = items.map((item) => item.name);
    const values = items.map((item) => item.value);

    await this.writeItemsInternal(names, values);
  }

  async writeByAddress(items: { address: string; value: unknown }[]): Promise<void> {
    this.ensureConnected();
    await this.ensureReady();

    // Override translation for raw addresses
    this.conn!.setTranslationCB((tag: string) => {
      const match = tag.match(/^__temp_write_\d+_(.+)$/);
      return match ? match[1] : (this.addressMap.get(tag)?.address ?? tag);
    });

    const tempNames = items.map((item, i) => `__temp_write_${i}_${item.address}`);
    const values = items.map((item) => item.value);

    this.conn!.addItems(tempNames);
    await this.writeItemsInternal(tempNames, values);

    // Clean up and restore
    this.conn!.removeItems(tempNames);
    this.restoreTranslation();
  }

  async writeByIndex(name: string, index: number, value: unknown): Promise<void> {
    const entry = this.getArrayEntry(name);

    if (entry.readOnly) {
      throw new S7ValidationError(`Variable "${name}" is read-only`);
    }

    this.validateIndex(entry, index);

    const offset = this.getBaseOffset(entry) + index * entry.elementSize;
    const address = `${this.getDbNumber(entry.address)},${entry.elementType}${offset}`;

    await this.writeByAddress([{ address, value }]);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private ensureConnected(): void {
    if (!this.connected || !this.conn) {
      throw new S7NotConnectedError();
    }
  }

  private async ensureReady(): Promise<void> {
    if (this.busy) {
      throw new S7ReadError("S7 service is busy with another operation");
    }
  }

  private restoreTranslation(): void {
    this.conn!.setTranslationCB((tag: string) => {
      const entry = this.addressMap.get(tag);
      return entry ? entry.address : tag;
    });
  }

  private readAllItemsInternal(): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      this.busy = true;
      this.conn!.readAllItems((err: unknown, values: Record<string, unknown>) => {
        this.busy = false;
        if (err) {
          reject(new S7ReadError(`Read failed: ${err}`));
        } else {
          resolve(values);
        }
      });
    });
  }

  private writeItemsInternal(items: string | string[], values: unknown | unknown[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.busy = true;
      this.conn!.writeItems(items, values, (err: unknown) => {
        this.busy = false;
        if (err) {
          reject(new S7WriteError(`Write failed: ${err}`));
        } else {
          resolve();
        }
      });
    });
  }

  private getArrayEntry(name: string): S7ArrayEntry {
    const entry = this.addressMap.get(name);
    if (!entry) {
      throw new S7ValidationError(`Unknown address name: "${name}"`);
    }
    if (!("elementType" in entry)) {
      throw new S7ValidationError(`"${name}" is not an array entry`);
    }
    return entry as S7ArrayEntry;
  }

  private validateIndex(entry: S7ArrayEntry, index: number): void {
    if (index < 0 || index >= entry.length) {
      throw new S7ValidationError(`Index ${index} out of range for "${entry.name}" (0-${entry.length - 1})`);
    }
  }

  private getBaseOffset(entry: S7ArrayEntry): number {
    // Parse offset from address like "DB2,DINT40.10" → 40
    const match = entry.address.match(/,(\w+?)(\d+)/);
    return match ? parseInt(match[2], 10) : 0;
  }

  private getDbNumber(address: string): string {
    // "DB2,DINT40.10" → "DB2"
    const match = address.match(/^(DB\d+)/);
    return match ? match[1] : "DB1";
  }
}

// Singleton instance
const s7Service = new S7Service();

export default s7Service;
export { S7Service };
