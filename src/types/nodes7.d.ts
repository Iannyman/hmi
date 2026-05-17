declare module 'nodes7' {
  interface S7ConnectionOptions {
    port?: number;
    host: string;
    rack?: number;
    slot?: number;
    timeout?: number;
    localTSAP?: number;
    remoteTSAP?: number;
    debug?: boolean;
    doNotOptimize?: boolean;
  }

  class NodeS7 {
    initiateConnection(
      options: S7ConnectionOptions,
      callback: (err: unknown) => void
    ): void;

    dropConnection(callback: (err: unknown) => void): void;

    setTranslationCB(callback: (tag: string) => string): void;

    addItems(items: string | string[]): void;

    removeItems(items?: string | string[]): void;

    readAllItems(
      callback: (err: unknown, values: Record<string, unknown>) => void
    ): void;

    writeItems(
      items: string | string[],
      values: unknown | unknown[],
      callback: (err: unknown) => void
    ): void;
  }

  export = NodeS7;
}
