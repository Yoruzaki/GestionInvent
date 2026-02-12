import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  const { id } = await params;
  const body = await request.json();
  const dataFull: Record<string, unknown> = {};
  for (const k of ["name", "code", "barcode", "category", "unit", "minimumThreshold"]) {
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
      const dataSafe = { name: dataFull.name, category: dataFull.category, unit: dataFull.unit, minimumThreshold: dataFull.minimumThreshold };
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
  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
