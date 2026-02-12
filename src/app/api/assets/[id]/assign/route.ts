import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { newLocationId, newUserId, actionType } = body;
  const asset = await prisma.asset.findUnique({ where: { id }, include: { location: true, assignedTo: true } });
  if (!asset) return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });

  await prisma.assetHistory.create({
    data: {
      assetId: id,
      previousLocation: asset.location?.name ?? null,
      newLocation: newLocationId ? (await prisma.location.findUnique({ where: { id: newLocationId } }))?.name ?? null : null,
      previousUser: asset.assignedTo?.name ?? null,
      newUser: newUserId ? (await prisma.employee.findUnique({ where: { id: newUserId } }))?.name ?? null : null,
      actionType: actionType || "assignation",
    },
  });

  const updated = await prisma.asset.update({
    where: { id },
    data: {
      ...(newLocationId ? { locationId: newLocationId } : {}),
      ...(newUserId !== undefined ? { assignedToId: newUserId || null } : {}),
    },
    include: { location: true, assignedTo: true },
  });
  return NextResponse.json(updated);
}
