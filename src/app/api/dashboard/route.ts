import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [products, stockEntries, stockExits, entries, exits] = await Promise.all([
    prisma.product.findMany(),
    prisma.stockEntry.findMany({ take: 5, orderBy: { purchaseDate: "desc" }, include: { product: true } }),
    prisma.stockExit.findMany({ take: 5, orderBy: { date: "desc" }, include: { product: true, employee: true, location: true } }),
    prisma.stockEntry.groupBy({ by: ["productId"], _sum: { quantity: true } }),
    prisma.stockExit.groupBy({ by: ["productId"], _sum: { quantity: true } }),
  ]);
  const entryMap = Object.fromEntries(entries.map((e) => [e.productId, e._sum.quantity ?? 0]));
  const exitMap = Object.fromEntries(exits.map((e) => [e.productId, e._sum.quantity ?? 0]));
  const lowStock = products.filter((p) => {
    const stock = (entryMap[p.id] ?? 0) - (exitMap[p.id] ?? 0);
    return p.minimumThreshold > 0 && stock > 0 && stock <= p.minimumThreshold;
  });
  const ruptures = products.filter((p) => {
    const stock = (entryMap[p.id] ?? 0) - (exitMap[p.id] ?? 0);
    return stock <= 0;
  });

  const { notifyStockAlerts } = await import("@/lib/notifications");
  await notifyStockAlerts(lowStock, ruptures).catch(() => {});

  return NextResponse.json({
    totalProduits: products.length,
    alerteStockBas: lowStock,
    ruptures: ruptures.length,
    dernieresEntrees: stockEntries,
    dernieresSorties: stockExits,
  });
}
