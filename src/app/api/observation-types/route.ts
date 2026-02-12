import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    if (typeof (prisma as { observationType?: { findMany: (args: unknown) => Promise<unknown[]> } }).observationType?.findMany !== "function") {
      return NextResponse.json([]);
    }
    const list = await prisma.observationType.findMany({ orderBy: { label: "asc" } });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label } = body;
    if (!label) return NextResponse.json({ error: "Libellé requis" }, { status: 400 });
    const item = await prisma.observationType.create({ data: { label } });
    return NextResponse.json(item);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("undefined") || msg.includes("observationType")) {
      return NextResponse.json(
        { error: "Modèle indisponible. Arrêtez le serveur (Ctrl+C), exécutez: npx prisma generate puis relancez." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
