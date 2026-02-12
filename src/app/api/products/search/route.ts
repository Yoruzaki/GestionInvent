import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json([]);

  try {
    const list = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { code: q },
          { barcode: q },
        ],
      },
      orderBy: { name: "asc" },
      take: 20,
    });
    return NextResponse.json(list);
  } catch {
    const list = await prisma.product.findMany({
      where: { name: { contains: q } },
      orderBy: { name: "asc" },
      take: 20,
    });
    return NextResponse.json(list);
  }
}
