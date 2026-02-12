import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { location: true, assignedTo: true, product: true, history: true },
  });
  if (!asset) return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });
  return NextResponse.json(asset);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const current = await prisma.asset.findUnique({
    where: { id },
    include: { location: true, assignedTo: true },
  });
  if (!current) return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });

  const allowed = [
    "assetName", "category", "brand", "model", "serialNumber",
    "purchaseDate", "invoiceDate", "supplier", "status", "locationId", "assignedToId", "productId", "notes", "observation",
  ];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
    if (k === "purchaseDate" && body[k]) data[k] = new Date(body[k]);
    if (k === "invoiceDate" && body[k]) data[k] = new Date(body[k]);
  }

  const locChanged = body.locationId !== undefined && body.locationId !== current.locationId;
  const userChanged = body.assignedToId !== undefined && body.assignedToId !== current.assignedToId;
  if (locChanged || userChanged) {
    const newLocId = (body.locationId as string) ?? current.locationId;
    const newUserId = (body.assignedToId as string) ?? current.assignedToId;
    const newLoc = newLocId ? await prisma.location.findUnique({ where: { id: newLocId } }) : null;
    const newUser = newUserId ? await prisma.employee.findUnique({ where: { id: newUserId } }) : null;
    await prisma.assetHistory.create({
      data: {
        assetId: id,
        previousLocation: current.location?.name ?? null,
        newLocation: newLoc?.name ?? null,
        previousUser: current.assignedTo?.name ?? null,
        newUser: newUser?.name ?? null,
        actionType: "assignation",
      },
    });
  }

  const asset = await prisma.asset.update({
    where: { id },
    data,
    include: { location: true, assignedTo: true, product: true },
  });
  return NextResponse.json(asset);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
