"use client";

import * as React from "react";

type SidebarProviderProps = {
  children: React.ReactNode;
};

type SidebarProviderState = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

const SidebarContext = React.createContext<SidebarProviderState | undefined>(undefined);

const STORAGE_KEY = "sidebar-open";

// Default: hidden on mobile/tablet, open on desktop
const getDefaultOpen = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= 1024;
};

export function SidebarProvider({ children }: SidebarProviderProps) {
  // Start with false to match server, then sync to real state after mount
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  // Initialize from localStorage after mount
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initialValue = stored !== null ? stored === "true" : getDefaultOpen();
    setIsOpen(initialValue);
  }, []);

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  const open = React.useCallback(() => {
    setIsOpen(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const close = React.useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "false");
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = React.useContext(SidebarContext);

  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
};
