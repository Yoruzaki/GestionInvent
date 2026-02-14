import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  try {
    const list = await prisma.product.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { code: q },
                { barcode: q },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(list);
  } catch {
    const list = await prisma.product.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(q ? { name: { contains: q } } : {}),
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(list);
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await request.json();
  const {
    name,
    code,
    barcode,
    productType,
    category,
    categoryId,
    unit,
    unitId,
    minimumThreshold,
    purchaseDate,
    quantity,
    supplierId,
    supplier,
    invoiceNumber,
  } = body;
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  const pt = productType === "consumable" ? "consumable" : "equipment";
  const categoryName = category ?? "bureau";
  const unitName = unit ?? "pièce";
  const product = await prisma.product.create({
    data: {
      name,
      code: code ?? null,
      barcode: barcode ?? null,
      productType: pt,
      category: categoryName,
      categoryId: categoryId || null,
      unit: unitName,
      unitId: unitId || null,
      minimumThreshold: minimumThreshold ?? 0,
    },
  });
  const hasFirstEntry =
    (quantity != null && Number(quantity) > 0) || purchaseDate || supplierId || supplier;
  if (hasFirstEntry && quantity != null && Number(quantity) > 0) {
    await prisma.stockEntry.create({
      data: {
        productId: product.id,
        quantity: Number(quantity),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        supplierId: supplierId || null,
        supplier: supplier ?? null,
        invoiceNumber: invoiceNumber ?? null,
      },
    });
  }
  return NextResponse.json(product);
}
