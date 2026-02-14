"use client";

import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/components/SidebarContext";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <main
      className={`min-h-screen transition-[padding] duration-300 pt-20 pl-4 lg:pt-6 lg:pl-0 ${
        collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
      }`}
    >
      <div className="page-container">{children}</div>
    </main>
  );
}

export function AuthAwareLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">Chargement…</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50/80">
        <Sidebar />
        <LayoutContent>{children}</LayoutContent>
      </div>
    </SidebarProvider>
  );
}
