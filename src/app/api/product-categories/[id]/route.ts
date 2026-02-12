import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name } = body;
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  const item = await prisma.productCategory.update({
    where: { id },
    data: { name },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.productCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
