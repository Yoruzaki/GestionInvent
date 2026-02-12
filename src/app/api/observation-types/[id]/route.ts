import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { label } = body;
  if (!label) return NextResponse.json({ error: "Libellé requis" }, { status: 400 });
  const item = await prisma.observationType.update({
    where: { id },
    data: { label },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.observationType.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
