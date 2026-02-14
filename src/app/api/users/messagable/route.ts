import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/** Liste des utilisateurs qu'on peut contacter (admins + employés avec compte) */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const myId = (session.user as { id?: string }).id;
  if (!myId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  const users = await prisma.user.findMany({
    where: {
      id: { not: myId },
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
    take: q ? 30 : 100,
  });

  return NextResponse.json(users);
}
