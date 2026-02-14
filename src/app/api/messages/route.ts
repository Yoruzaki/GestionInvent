import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder") || "inbox";
  const unreadOnly = searchParams.get("unread") === "true";

  const where =
    folder === "sent"
      ? { fromUserId: userId }
      : { toUserId: userId, ...(unreadOnly ? { read: false } : {}) };

  const list = await prisma.message.findMany({
    where: { ...where, parentId: null },
    orderBy: { createdAt: "desc" },
    take: 100,
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

  const unreadCount = await prisma.message.count({
    where: { toUserId: userId, read: false, parentId: null },
  });

  return NextResponse.json({ messages: list, unreadCount });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const fromUserId = (session.user as { id?: string }).id;
  if (!fromUserId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const reqBody = await request.json();
  const { toUserId, subject, body: msgBody, isComplaint, parentId } = reqBody;
  if (!toUserId || !subject || msgBody == null)
    return NextResponse.json({ error: "Destinataire, sujet et message requis" }, { status: 400 });

  const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!toUser) return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 });

  const msg = await prisma.message.create({
    data: {
      fromUserId,
      toUserId: String(toUserId),
      subject: String(subject).trim(),
      body: String(msgBody).trim(),
      isComplaint: !!isComplaint,
      parentId: parentId || null,
    },
    include: {
      fromUser: { select: { name: true } },
      toUser: { select: { name: true } },
    },
  });

  const notifType = isComplaint ? "complaint" : "message";
  const notifTitle = isComplaint ? "Nouvelle plainte" : "Nouveau message";
  const fromName = (msg.fromUser as { name?: string }).name ?? "Quelqu'un";
  const notifMessage = isComplaint
    ? `${fromName} vous a envoyé une plainte : ${subject}`
    : `${fromName} vous a envoyé un message : ${subject}`;

  await createNotification({
    userId: toUserId,
    type: notifType,
    title: notifTitle,
    message: notifMessage,
    relatedId: msg.id,
  }).catch(() => {});

  return NextResponse.json(msg);
}
