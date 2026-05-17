/**
 * React Hook for S7 PLC Communication
 *
 * Provides methods for connecting, reading, and writing to S7 PLC
 * via the /api/s7/* routes.
 */

"use client";

import { useCallback, useState } from "react";
import { S7Value } from "@/types/s7.types";

export function useS7() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (config?: { host?: string; port?: number; rack?: number; slot?: number }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/s7/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config ?? {}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error);
      }

      setIsConnected(true);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setIsConnected(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/s7/connect", { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error);
      }

      setIsConnected(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/s7/connect");
      if (!response.ok) {
        setIsConnected(false);
        return false;
      }
      const result = await response.json();
      setIsConnected(result.connected);
      return result.connected;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, []);

  const readByName = useCallback(async (names: string[]): Promise<S7Value[]> => {
    const response = await fetch("/api/s7/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.details || result.error);
    return result.data;
  }, []);

  const readByAddress = useCallback(async (addresses: string[]): Promise<S7Value[]> => {
    const response = await fetch("/api/s7/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.details || result.error);
    return result.data;
  }, []);

  const readByIndex = useCallback(async (name: string, index: number): Promise<S7Value> => {
    const response = await fetch("/api/s7/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ name, index }] }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.details || result.error);
    if (!Array.isArray(result.data) || result.data.length === 0) {
      throw new Error("Empty read result");
    }
    return result.data[0];
  }, []);

  const readAll = useCallback(async (): Promise<S7Value[]> => {
    const response = await fetch("/api/s7/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.details || result.error);
    return result.data;
  }, []);

  const writeByName = useCallback(async (items: { name: string; value: unknown }[]): Promise<boolean> => {
    const response = await fetch("/api/s7/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.details || result.error);
    return true;
  }, []);

  const writeByIndex = useCallback(async (name: string, index: number, value: unknown): Promise<boolean> => {
    const response = await fetch("/api/s7/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ name, index, value }] }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.details || result.error);
    return true;
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    checkConnection,
    readByName,
    readByAddress,
    readByIndex,
    readAll,
    writeByName,
    writeByIndex,
  };
}
