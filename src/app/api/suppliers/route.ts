import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    if (typeof (prisma as { supplier?: { findMany: (args: unknown) => Promise<unknown[]> } }).supplier?.findMany !== "function") {
      return NextResponse.json([]);
    }
    const list = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contact } = body;
    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const item = await prisma.supplier.create({
      data: { name, contact: contact ?? null },
    });
    return NextResponse.json(item);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("undefined") || msg.includes("supplier")) {
      return NextResponse.json(
        { error: "Modèle fournisseur indisponible. Arrêtez le serveur (Ctrl+C), exécutez: npx prisma generate puis relancez." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
