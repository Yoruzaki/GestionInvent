import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const list = await prisma.stockEntry.findMany({
    where: productId ? { productId } : undefined,
    include: { product: true },
    orderBy: { purchaseDate: "desc" },
    take: 200,
  });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "admin") return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  const body = await request.json();
  const { productId, quantity, purchaseDate, supplierId, supplier, invoiceNumber } = body;
  if (!productId || quantity == null) return NextResponse.json({ error: "Produit et quantité requis" }, { status: 400 });
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  const allowed = (await import("@/lib/product-types")).getAllowedTypes((session.user as { allowedProductTypes?: string }).allowedProductTypes);
  if (allowed && !allowed.includes(product.productType as "equipment" | "consumable"))
    return NextResponse.json({ error: "Vous n'avez pas le droit de gérer ce type de produit" }, { status: 403 });
  const entry = await prisma.stockEntry.create({
    data: {
      productId,
      quantity: Number(quantity),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      supplierId: supplierId || null,
      supplier: supplier ?? null,
      invoiceNumber: invoiceNumber ?? null,
    },
    include: { product: true },
  });
  return NextResponse.json(entry);
}
