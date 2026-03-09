/**
 * HMI Data Context Provider
 *
 * Shared context for HMI data to avoid duplicate state across hook calls.
 * All components using useHMIManager will share the same data state.
 */

"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { StationData } from "@/types/station.types";

interface LineData {
  name: string;
  status: string;
  mode: string;
  partsOK: number;
  partsNOK: number;
  totalParts: number;
  efficiency: number;
  scrapRate: number;
  order: {
    type: string;
    quantity: number;
    contract: string;
  };
}



interface HMIData {
  line: LineData;
  stations: StationData[];
}

interface HMIDataContextValue {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  hmiData: HMIData | null;
  setIsInitialized: (value: boolean) => void;
  setIsInitializing: (value: boolean) => void;
  setError: (error: string | null) => void;
  setHmiData: (data: HMIData | null) => void;
}

const HMIDataContext = createContext<HMIDataContextValue | undefined>(undefined);

export function HMIDataProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hmiData, setHmiData] = useState<HMIData | null>(null);

  return (
    <HMIDataContext.Provider
      value={{
        isInitialized,
        isInitializing,
        error,
        hmiData,
        setIsInitialized,
        setIsInitializing,
        setError,
        setHmiData,
      }}
    >
      {children}
    </HMIDataContext.Provider>
  );
}

export function useHMIDataContext() {
  const context = useContext(HMIDataContext);
  if (context === undefined) {
    throw new Error("useHMIDataContext must be used within HMIDataProvider");
  }
  return context;
}
