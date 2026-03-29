/**
 * React Hook for OPC UA Connection Status
 *
 * This hook provides a SINGLE source of truth for connection state across the app.
 * Using context ensures all components see the same connection state.
 */

"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface ConnectionContextValue {
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
}

const ConnectionContext = createContext<ConnectionContextValue | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <ConnectionContext.Provider value={{ isConnected, setIsConnected }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within ConnectionProvider");
  }

  // Debug log to track connection state changes
  useEffect(() => {
    console.log("[useConnection] isConnected:", context.isConnected);
  }, [context.isConnected]);

  return { isConnected: context.isConnected };
}

// Also export the setter for HMIInitializerProvider to update connection state
export function useConnectionSetter() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnectionSetter must be used within ConnectionProvider");
  }
  return { setIsConnected: context.setIsConnected };
}
