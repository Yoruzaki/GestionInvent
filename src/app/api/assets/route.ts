import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const status = searchParams.get("status");
    const where = {
      ...(locationId ? { locationId } : {}),
      ...(status ? { status } : {}),
    };
    try {
      const list = await prisma.asset.findMany({
        where,
        include: { location: true, assignedTo: true, product: true },
        orderBy: { assetCode: "asc" },
      });
      return NextResponse.json(list);
    } catch {
      const list = await prisma.asset.findMany({
        where,
        include: { location: true, assignedTo: true },
        orderBy: { assetCode: "asc" },
      });
      return NextResponse.json(list.map((a) => ({ ...a, product: null })));
    }
  } catch (e) {
    console.error("GET /api/assets", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    assetCode,
    assetName,
    category,
    brand,
    model,
    serialNumber,
    purchaseDate,
    invoiceDate,
    supplier,
    status,
    locationId,
    assignedToId,
    productId,
    notes,
    observation,
  } = body;
  if (!assetCode || !assetName || !category)
    return NextResponse.json({ error: "Code, nom et catégorie requis" }, { status: 400 });
  const asset = await prisma.asset.create({
    data: {
      assetCode,
      assetName,
      category: category || "Équipement",
      brand: brand ?? null,
      model: model ?? null,
      serialNumber: serialNumber ?? null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
      supplier: supplier ?? null,
      status: status ?? "actif",
      locationId: locationId || null,
      assignedToId: assignedToId || null,
      productId: productId || null,
      notes: notes ?? null,
      observation: observation ?? null,
    },
    include: { location: true, assignedTo: true, product: true },
  });
  return NextResponse.json(asset);
}
