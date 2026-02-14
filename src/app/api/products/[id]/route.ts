import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getAllowedTypes } from "@/lib/product-types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
  });
  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  const allowed = getAllowedTypes((session.user as { allowedProductTypes?: string }).allowedProductTypes);
  if (allowed && !allowed.includes(existing.productType as "equipment" | "consumable"))
    return NextResponse.json({ error: "Vous n'avez pas le droit de modifier ce produit" }, { status: 403 });
  const body = await request.json();
  const dataFull: Record<string, unknown> = {};
  for (const k of ["name", "code", "barcode", "category", "unit", "minimumThreshold", "productType"]) {
    if (body[k] !== undefined) dataFull[k] = body[k];
  }
  try {
    const product = await prisma.product.update({
      where: { id },
      data: dataFull,
    });
    return NextResponse.json(product);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("Unknown argument") && (dataFull.code !== undefined || dataFull.barcode !== undefined)) {
      const dataSafe = {
        name: dataFull.name as string,
        category: dataFull.category as string,
        unit: dataFull.unit as string,
        minimumThreshold: dataFull.minimumThreshold as number,
        productType: dataFull.productType as string,
      };
      const product = await prisma.product.update({
        where: { id },
        data: dataSafe,
      });
      return NextResponse.json(product);
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  const allowed = getAllowedTypes((session.user as { allowedProductTypes?: string }).allowedProductTypes);
  if (allowed && !allowed.includes(existing.productType as "equipment" | "consumable"))
    return NextResponse.json({ error: "Vous n'avez pas le droit de supprimer ce produit" }, { status: 403 });
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
