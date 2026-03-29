"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type LineStatus = "running" | "stopped" | "fault";

interface LineStatusContextType {
  lineStatus: LineStatus;
  setLineStatus: (status: LineStatus) => void;
}

const LineStatusContext = createContext<LineStatusContextType | undefined>(undefined);

export function LineStatusProvider({ children }: { children: ReactNode }) {
  const [lineStatus, setLineStatus] = useState<LineStatus>("running");

  return (
    <LineStatusContext.Provider value={{ lineStatus, setLineStatus }}>
      {children}
    </LineStatusContext.Provider>
  );
}

export function useLineStatus() {
  const context = useContext(LineStatusContext);
  if (context === undefined) {
    throw new Error("useLineStatus must be used within a LineStatusProvider");
  }
  return context;
}
