import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  const entries = await prisma.stockEntry.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
  });
  const exits = await prisma.stockExit.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
  });
  const entryMap = Object.fromEntries(entries.map((e) => [e.productId, e._sum.quantity ?? 0]));
  const exitMap = Object.fromEntries(exits.map((e) => [e.productId, e._sum.quantity ?? 0]));
  const balance = products.map((p) => ({
    ...p,
    totalEntrees: entryMap[p.id] ?? 0,
    totalSorties: exitMap[p.id] ?? 0,
    stockActuel: (entryMap[p.id] ?? 0) - (exitMap[p.id] ?? 0),
  }));
  return NextResponse.json(balance);
}
