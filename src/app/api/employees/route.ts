import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const list = await prisma.employee.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: { name: "asc" },
    take: q ? 20 : 500,
    include: { user: { select: { id: true, email: true } } },
  });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, position, department } = body;
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  const emp = await prisma.employee.create({
    data: { name, position: position ?? null, department: department ?? null },
  });
  return NextResponse.json(emp);
}
