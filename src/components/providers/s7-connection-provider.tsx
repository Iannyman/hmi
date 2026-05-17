/**
 * S7 Connection Provider
 *
 * Provides S7 connection state across the app via React Context.
 * Mirrors ConnectionProvider pattern used for OPC UA.
 */

"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface S7ConnectionContextValue {
  isS7Connected: boolean;
  setIsS7Connected: (value: boolean) => void;
}

const S7ConnectionContext = createContext<S7ConnectionContextValue | undefined>(undefined);

export function S7ConnectionProvider({ children }: { children: ReactNode }) {
  const [isS7Connected, setIsS7Connected] = useState(false);

  return (
    <S7ConnectionContext.Provider value={{ isS7Connected, setIsS7Connected }}>
      {children}
    </S7ConnectionContext.Provider>
  );
}

export function useS7Connection() {
  const context = useContext(S7ConnectionContext);
  if (context === undefined) {
    throw new Error("useS7Connection must be used within S7ConnectionProvider");
  }
  return { isS7Connected: context.isS7Connected };
}

export function useS7ConnectionSetter() {
  const context = useContext(S7ConnectionContext);
  if (context === undefined) {
    throw new Error("useS7ConnectionSetter must be used within S7ConnectionProvider");
  }
  return { setIsS7Connected: context.setIsS7Connected };
}
