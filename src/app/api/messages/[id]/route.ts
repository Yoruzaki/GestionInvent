import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const { id } = await params;
  const msg = await prisma.message.findFirst({
    where: { id, OR: [{ fromUserId: userId }, { toUserId: userId }] },
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!msg) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });

  if (msg.toUserId === userId && !msg.read) {
    await prisma.message.update({
      where: { id },
      data: { read: true },
    });
  }

  return NextResponse.json(msg);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const { id } = await params;
  const msg = await prisma.message.findFirst({
    where: { id, toUserId: userId },
  });
  if (!msg) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  if (body.read === true) {
    await prisma.message.update({
      where: { id },
      data: { read: true },
    });
  }
  return NextResponse.json({ ok: true });
}
