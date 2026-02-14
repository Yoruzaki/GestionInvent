import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const { id } = await params;
  const notif = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!notif) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
