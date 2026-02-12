import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const list = await prisma.location.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, officeNumber, building } = body;
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  const loc = await prisma.location.create({
    data: { name, officeNumber: officeNumber ?? null, building: building ?? null },
  });
  return NextResponse.json(loc);
}
