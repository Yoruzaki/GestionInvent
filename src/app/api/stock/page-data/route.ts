import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/**
 * Single endpoint for all data needed by the Stock page.
 * All admins see full stock; actions (entries/exits) are limited by type at POST.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

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
