"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import {
  OPCUAMockData,
} from "@/types/opcua.types";

interface OPCUADataContextType {
  opcuaMockData: OPCUAMockData | null;
  setOpcuaMockData: (data: OPCUAMockData | null) => void;
  subscriptionActive: boolean;
  setSubscriptionActive: (active: boolean) => void;
}

const OPCUADataContext = createContext<OPCUADataContextType | undefined>(undefined);

export function OPCUADataProvider({ children }: { children: ReactNode }) {
  const [opcuaMockData, setOpcuaMockData] = useState<OPCUAMockData | null>(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  return (
    <OPCUADataContext.Provider value={{ opcuaMockData, setOpcuaMockData, subscriptionActive, setSubscriptionActive }}>
      {children}
    </OPCUADataContext.Provider>
  );
}

export function useOPCUAData() {
  const context = useContext(OPCUADataContext);
  if (context === undefined) {
    throw new Error("useOPCUAData must be used within an OPCUADataProvider");
  }
  return context;
}
