"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn(
          "flex-1 min-w-0 overflow-x-hidden transition-all duration-300",
          // Reserve space for sidebar on desktop when open
          isOpen ? "lg:ml-60" : "lg:ml-0"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
