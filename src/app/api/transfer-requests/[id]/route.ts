import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

async function getEmployeeBalance(employeeId: string, productId: string): Promise<number> {
  const [exits, outTransfers, inTransfers] = await Promise.all([
    prisma.stockExit.findMany({ where: { employeeId, productId } }),
    prisma.employeeTransfer.findMany({ where: { fromEmployeeId: employeeId, productId } }),
    prisma.employeeTransfer.findMany({ where: { toEmployeeId: employeeId, productId } }),
  ]);
  const inQ = exits.reduce((s, e) => s + e.quantity, 0) + inTransfers.reduce((s, t) => s + t.quantity, 0);
  const outQ = outTransfers.reduce((s, t) => s + t.quantity, 0);
  return inQ - outQ;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { status: newStatus } = body;
  if (newStatus !== "approved" && newStatus !== "rejected") return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

  const adminId = (session.user as { id?: string }).id;
  if (!adminId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  try {
    const tr = await prisma.transferRequest.findUnique({
      where: { id },
      include: { product: true, requestedBy: { select: { employeeId: true } } },
    });
    if (!tr) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    if (tr.status !== "pending") return NextResponse.json({ error: "Demande déjà traitée" }, { status: 400 });

    const fromEmployeeId = (tr.requestedBy as { employeeId?: string | null }).employeeId;
    if (!fromEmployeeId) return NextResponse.json({ error: "Demandeur sans employé associé" }, { status: 400 });

    if (newStatus === "approved") {
      const balance = await getEmployeeBalance(fromEmployeeId, tr.productId);
      if (balance < tr.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant : l'employé ne dispose que de ${balance} pour ce produit.` },
          { status: 400 }
        );
      }

      if (tr.returnToStock) {
        await prisma.$transaction([
          prisma.employeeTransfer.create({
            data: {
              fromEmployeeId,
              toEmployeeId: null,
              productId: tr.productId,
              quantity: tr.quantity,
              transferRequestId: id,
            },
          }),
          prisma.stockEntry.create({
            data: {
              productId: tr.productId,
              quantity: tr.quantity,
              supplier: "Retour au stock",
            },
          }),
          prisma.transferRequest.update({
            where: { id },
            data: { status: "approved", decidedById: adminId, decidedAt: new Date() },
          }),
        ]);
      } else {
        if (!tr.toEmployeeId) return NextResponse.json({ error: "Bénéficiaire manquant" }, { status: 400 });
        await prisma.$transaction([
          prisma.employeeTransfer.create({
            data: {
              fromEmployeeId,
              toEmployeeId: tr.toEmployeeId,
              productId: tr.productId,
              quantity: tr.quantity,
              transferRequestId: id,
            },
          }),
          prisma.transferRequest.update({
            where: { id },
            data: { status: "approved", decidedById: adminId, decidedAt: new Date() },
          }),
        ]);
      }
    } else {
      await prisma.transferRequest.update({
        where: { id },
        data: { status: "rejected", decidedById: adminId, decidedAt: new Date() },
      });
    }

    const updated = await prisma.transferRequest.findUnique({
      where: { id },
      include: { product: true, toEmployee: true, requestedBy: { select: { name: true, email: true } } },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
