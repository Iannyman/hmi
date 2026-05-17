/**
 * S7 Service Locator
 *
 * Provides access to the S7Service singleton via globalThis.
 * Required for cross-context sharing in Next.js Server Actions.
 */

import { S7Service } from "./s7-service";

declare global {
  var __S7_SERVICE_INSTANCE__: S7Service | undefined;
}

class S7Locator {
  static getInstance(): S7Service {
    const instance = global.__S7_SERVICE_INSTANCE__;
    if (!instance) {
      throw new Error(
        "S7 Service not initialized. Call S7Locator.initialize() first."
      );
    }
    return instance;
  }

  static isReady(): boolean {
    return global.__S7_SERVICE_INSTANCE__ !== undefined;
  }

  static reset(): void {
    global.__S7_SERVICE_INSTANCE__ = undefined;
  }
}

export { S7Locator };
