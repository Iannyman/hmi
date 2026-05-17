"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { ConnectionProvider } from "./connection-provider";
import { OPCUADataProvider } from "./opcua-data-provider";
import { HMIDataProvider } from "./hmi-data-provider";
import { HMIInitializerProvider } from "./hmi-initializer-provider";
import { S7ConnectionProvider } from "./s7-connection-provider";
import { S7InitializerProvider } from "./s7-initializer-provider";
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
 *             └── HMIInitializerProvider  (OPC UA auto-connect + init lifecycle)
 *                 └── S7ConnectionProvider   (S7 connection state)
 *                     └── S7InitializerProvider  (S7 auto-connect lifecycle)
 *                         └── SidebarProvider     (UI sidebar state)
 *                             └── LineStatusProvider     (production line status)
 *                                 └── LineStatisticsProvider  (production stats)
 *                                     └── AlarmNotificationWrapper  (alarm toasts)
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark">
      <ConnectionProvider>
        <OPCUADataProvider>
          <HMIDataProvider>
            <HMIInitializerProvider>
              <S7ConnectionProvider>
                <S7InitializerProvider>
                  <SidebarProvider>
                    <LineStatusProvider>
                      <LineStatisticsProvider>
                        <AlarmNotificationWrapper>
                          {children}
                        </AlarmNotificationWrapper>
                      </LineStatisticsProvider>
                    </LineStatusProvider>
                  </SidebarProvider>
                </S7InitializerProvider>
              </S7ConnectionProvider>
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
export { useS7Connection, useS7ConnectionSetter } from "./s7-connection-provider";
export { useS7 } from "./s7-hook";
export { useSidebar } from "./sidebar-provider";
export { useLineStatus } from "./line-status-provider";
export { useLineStatistics } from "./line-statistics-provider";
export { useHMIDataContext } from "./hmi-data-provider";
export { useOPCUAData } from "./opcua-data-provider";
export { useTheme } from "./theme-provider";
