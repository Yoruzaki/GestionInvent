import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/** Mettre à jour les types de produits autorisés d'un admin (réservé super-admin) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const me = await prisma.user.findUnique({
    where: { id: (session.user as { id?: string }).id },
  });
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (me.allowedProductTypes != null) return NextResponse.json({ error: "Seul le super-admin peut modifier les permissions" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { allowedProductTypes } = body;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Administrateur introuvable" }, { status: 404 });
  const value = allowedProductTypes === null || allowedProductTypes === "" || allowedProductTypes === "equipment,consumable"
    ? null
    : String(allowedProductTypes).trim();
  await prisma.user.update({
    where: { id },
    data: { allowedProductTypes: value || null },
  });
  return NextResponse.json({ ok: true });
}
