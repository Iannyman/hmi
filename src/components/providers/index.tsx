"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { ConnectionProvider } from "./connection-provider";
import { OPCUADataProvider } from "./opcua-data-provider";
import { HMIDataProvider } from "./hmi-data-provider";
import { HMIInitializerProvider } from "./hmi-initializer-provider";
import { SidebarProvider } from "./sidebar-provider";
import { LineStatusProvider } from "./line-status-provider";
import { LineStatisticsProvider } from "./line-statistics-provider";
import { AlarmNotificationWrapper } from "@/components/notifications/alarm-notification-wrapper";

/**
 * Composed Provider Hierarchy
 *
 * Order matters — each provider depends on its parent's context:
 *
 * ThemeProvider                (theme: dark/light)
 * └── ConnectionProvider       (OPC UA connection state)
 *     └── OPCUADataProvider    (OPC UA connection data)
 *         └── HMIDataProvider  (HMI data context)
 *             └── HMIInitializerProvider  (auto-connect + init lifecycle)
 *                 └── SidebarProvider     (UI sidebar state)
 *                     └── LineStatusProvider     (production line status)
 *                         └── LineStatisticsProvider  (production stats)
 *                             └── AlarmNotificationWrapper  (alarm toasts)
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark">
      <ConnectionProvider>
        <OPCUADataProvider>
          <HMIDataProvider>
            <HMIInitializerProvider>
              <SidebarProvider>
                <LineStatusProvider>
                  <LineStatisticsProvider>
                    <AlarmNotificationWrapper>
                      {children}
                    </AlarmNotificationWrapper>
                  </LineStatisticsProvider>
                </LineStatusProvider>
              </SidebarProvider>
            </HMIInitializerProvider>
          </HMIDataProvider>
        </OPCUADataProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}

// Re-export hooks for convenience
export { useConnection, useConnectionSetter } from "./connection-provider";
export { useHMIManager, useLine, useStations, useStation, useDevices } from "./hmi-manager-hook";
export { useOPCUA, useOPCUANode, useOPCUANodes } from "./opcua-hook";
export { useSidebar } from "./sidebar-provider";
export { useLineStatus } from "./line-status-provider";
export { useLineStatistics } from "./line-statistics-provider";
export { useHMIDataContext } from "./hmi-data-provider";
export { useOPCUAData } from "./opcua-data-provider";
export { useTheme } from "./theme-provider";
