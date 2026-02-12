import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/** Créer ou réinitialiser le compte (email + mot de passe) d'un employé. Réservé admin. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const emp = await prisma.employee.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!emp) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  return NextResponse.json({ hasAccount: !!emp.user, email: emp.user?.email ?? null });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { email, password } = body;
  if (!email || !password) return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });

  const emp = await prisma.employee.findUnique({ where: { id } });
  if (!emp) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

  const hashed = await hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing && existing.employeeId !== id)
    return NextResponse.json({ error: "Cet email est déjà utilisé par un autre compte" }, { status: 400 });

  if (existing && existing.employeeId === id) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: hashed },
    });
    return NextResponse.json({ ok: true, message: "Mot de passe mis à jour" });
  }

  await prisma.user.create({
    data: {
      name: emp.name,
      email: email.trim().toLowerCase(),
      password: hashed,
      role: "user",
      employeeId: id,
    },
  });
  return NextResponse.json({ ok: true, message: "Compte créé" });
}
