import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const role = (session.user as { role?: string }).role;

  try {
    if (role === "admin") {
      const list = await prisma.transferRequest.findMany({
        where: statusFilter === "pending" ? { status: "pending" } : undefined,
        orderBy: { requestedAt: "desc" },
        take: 100,
        include: {
          product: true,
          toEmployee: true,
          location: true,
          requestedBy: { select: { id: true, name: true, email: true } },
        },
      });
      return NextResponse.json(list);
    }
    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    const list = await prisma.transferRequest.findMany({
      where: { requestedById: userId },
      orderBy: { requestedAt: "desc" },
      take: 100,
      include: {
        product: true,
        toEmployee: true,
        location: true,
      },
    });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "user") return NextResponse.json({ error: "Réservé aux utilisateurs" }, { status: 403 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const body = await request.json();
  const { productId, quantity, toEmployeeId, locationId, purpose, returnToStock } = body;
  if (!productId || quantity == null) return NextResponse.json({ error: "Produit et quantité requis" }, { status: 400 });
  const qty = Math.floor(Number(quantity));
  if (!Number.isFinite(qty) || qty < 1) return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
  const isReturn = !!returnToStock;
  if (!isReturn && !toEmployeeId) return NextResponse.json({ error: "Choisir un bénéficiaire ou « Retour au stock »" }, { status: 400 });

  try {
    const req = await prisma.transferRequest.create({
      data: {
        productId: String(productId),
        quantity: qty,
        returnToStock: isReturn,
        toEmployeeId: isReturn ? null : (toEmployeeId ? String(toEmployeeId) : null),
        locationId: locationId ? String(locationId) : null,
        purpose: purpose != null ? String(purpose) : null,
        requestedById: userId,
      },
      include: { product: true, toEmployee: true, location: true },
    });
    return NextResponse.json(req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    if (msg.includes("Foreign key") || msg.includes("Record to create not found")) {
      return NextResponse.json({ error: "Produit ou bénéficiaire invalide" }, { status: 400 });
    }
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Cette demande existe déjà" }, { status: 409 });
    }
    console.error("POST /api/transfer-requests", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
