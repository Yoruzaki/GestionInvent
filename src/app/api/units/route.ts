import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    if (typeof (prisma as { unit?: { findMany: (args: unknown) => Promise<unknown[]> } }).unit?.findMany !== "function") {
      return NextResponse.json([]);
    }
    const list = await prisma.unit.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, symbol } = body;
    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const item = await prisma.unit.create({
      data: { name, symbol: symbol ?? null },
    });
    return NextResponse.json(item);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("undefined") || msg.includes("unit")) {
      return NextResponse.json(
        { error: "Modèle indisponible. Arrêtez le serveur (Ctrl+C), exécutez: npx prisma generate puis relancez." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
