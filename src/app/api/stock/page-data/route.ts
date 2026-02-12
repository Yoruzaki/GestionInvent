import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Single endpoint for all data needed by the Stock page.
 * One request = one round-trip and one compilation in dev (instead of 8).
 */
export async function GET() {
  const [
    products,
    entries,
    exits,
    locations,
    employees,
    suppliers,
    productCategories,
    units,
    observationTypes,
  ] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.stockEntry.groupBy({ by: ["productId"], _sum: { quantity: true } }),
    prisma.stockExit.groupBy({ by: ["productId"], _sum: { quantity: true } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
    prisma.observationType.findMany({ orderBy: { label: "asc" } }),
  ]);

  const entryMap = Object.fromEntries(entries.map((e) => [e.productId, e._sum.quantity ?? 0]));
  const exitMap = Object.fromEntries(exits.map((e) => [e.productId, e._sum.quantity ?? 0]));
  const balance = products.map((p) => ({
    ...p,
    totalEntrees: entryMap[p.id] ?? 0,
    totalSorties: exitMap[p.id] ?? 0,
    stockActuel: (entryMap[p.id] ?? 0) - (exitMap[p.id] ?? 0),
  }));

  return NextResponse.json({
    balance,
    products,
    locations,
    employees,
    suppliers,
    productCategories,
    units,
    observationTypes,
  });
}
