"use client";

import { useSession } from "next-auth/react";
import { Nav } from "@/components/Nav";

export function AuthAwareLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Chargement…</div>
      </div>
    );
  }
  return (
    <>
      {session && <Nav />}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </>
  );
}
