import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SidebarProvider } from "@/components/providers/sidebar-provider";
import { LineStatusProvider } from "@/components/providers/line-status-provider";
import { LineStatisticsProvider } from "@/components/providers/line-statistics-provider";
import { AlarmNotificationWrapper } from "@/components/providers/alarm-notification-wrapper";
import { OPCUADataProvider } from "@/components/providers/opcua-data-provider";
import { HMIInitializerProvider } from "@/components/providers/hmi-initializer-provider";
import { HMIDataProvider } from "@/components/providers/hmi-data-provider";
import { HMISSEProvider } from "@/components/providers/hmi-sse-provider";
import { HMIDataPollerProvider } from "@/components/providers/hmi-data-poller-provider";
import { ConnectionProvider } from "@/hooks/use-connection";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Production HMI System",
  description: "Automotive Production Line Human-Machine Interface",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                if (theme === 'light' || theme === 'dark') {
                  document.documentElement.classList.add(theme);
                }
              })();
            `,
          }}
        />
        <ThemeProvider defaultTheme="dark">
          <ConnectionProvider>
            <OPCUADataProvider>
            <HMIDataProvider>
              <HMISSEProvider>
                <HMIDataPollerProvider>
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
                </HMIDataPollerProvider>
              </HMISSEProvider>
            </HMIDataProvider>
          </OPCUADataProvider>
          </ConnectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
