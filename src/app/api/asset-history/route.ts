import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const list = await prisma.assetHistory.findMany({
    include: { asset: true },
    orderBy: { date: "desc" },
    take: 300,
  });
  return NextResponse.json(list);
}
