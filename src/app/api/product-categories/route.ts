import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    if (typeof (prisma as { productCategory?: { findMany: (args: unknown) => Promise<unknown[]> } }).productCategory?.findMany !== "function") {
      return NextResponse.json([]);
    }
    const list = await prisma.productCategory.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;
    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const item = await prisma.productCategory.create({ data: { name } });
    return NextResponse.json(item);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("undefined") || msg.includes("productCategory")) {
      return NextResponse.json(
        { error: "Modèle indisponible. Arrêtez le serveur (Ctrl+C), exécutez: npx prisma generate puis relancez." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
