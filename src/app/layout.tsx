import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { AuthAwareLayout } from "@/components/AuthAwareLayout";

export const metadata: Metadata = {
  title: "HNSF — Inventaire | Higher National School of Forests",
  description: "Gestion du stock — HNSF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <SessionProvider>
          <AuthAwareLayout>{children}</AuthAwareLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
