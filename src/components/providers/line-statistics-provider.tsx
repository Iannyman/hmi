"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { LineStatistics } from "@/types/domain.types";

interface LineStatisticsContextType {
  statistics: LineStatistics;
  resetStatistics: () => void;
  updateStatistics: (updates: Partial<LineStatistics>) => void;
}

const LineStatisticsContext = createContext<LineStatisticsContextType | undefined>(undefined);

const INITIAL_STATISTICS: LineStatistics = {
  totalParts: 0,
  partsOK: 0,
  partsNOK: 0,
  scrapRate: 0,
  efficiency: 0,
};

export function LineStatisticsProvider({ children }: { children: ReactNode }) {
  const [statistics, setStatistics] = useState<LineStatistics>(INITIAL_STATISTICS);

  const resetStatistics = useCallback(() => {
    setStatistics(INITIAL_STATISTICS);
  }, []);

  const updateStatistics = useCallback((updates: Partial<LineStatistics>) => {
    setStatistics((prev) => {
      const updated = { ...prev, ...updates };

      // Recalculate scrap rate if partsOK or partsNOK changed
      if ("partsOK" in updates || "partsNOK" in updates) {
        const total = updated.partsOK + updated.partsNOK;
        updated.scrapRate = total > 0 ? (updated.partsNOK / total) * 100 : 0;
        updated.totalParts = total;
      }

      return updated;
    });
  }, []);

  return (
    <LineStatisticsContext.Provider value={{ statistics, resetStatistics, updateStatistics }}>
      {children}
    </LineStatisticsContext.Provider>
  );
}

export function useLineStatistics() {
  const context = useContext(LineStatisticsContext);
  if (context === undefined) {
    throw new Error("useLineStatistics must be used within a LineStatisticsProvider");
  }
  return context;
}
