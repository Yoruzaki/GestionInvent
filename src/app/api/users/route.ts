import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getAllowedTypes } from "@/lib/product-types";

/** Liste des utilisateurs admin (pour gérer les permissions par type de produit) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const list = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true, name: true, email: true, allowedProductTypes: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(list);
}

/** Créer un nouvel admin (réservé au super-admin) */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const me = await prisma.user.findUnique({
    where: { id: (session.user as { id?: string }).id },
  });
  if (!me || me.role !== "admin" || me.allowedProductTypes != null)
    return NextResponse.json({ error: "Seul le super-admin peut créer des administrateurs" }, { status: 403 });

  const body = await request.json();
  const { name, email, password, allowedProductTypes } = body;
  if (!name || !email || !password)
    return NextResponse.json({ error: "Nom, email et mot de passe requis" }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 6 caractères" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
  if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });

  const apt = allowedProductTypes === "equipment" ? "equipment"
    : allowedProductTypes === "consumable" ? "consumable"
    : null; // null = tous les types (super-admin ou admin complet)
  const hashed = await hash(String(password), 10);

  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: hashed,
      role: "admin",
      allowedProductTypes: apt,
    },
    select: { id: true, name: true, email: true, allowedProductTypes: true },
  });
  return NextResponse.json(user);
}
