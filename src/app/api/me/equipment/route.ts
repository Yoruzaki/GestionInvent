import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/** Équipement de l'employé = reçu (sorties) - donné (transfers out) + reçu d'autres employés (transfers in) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const employeeId = (session.user as { employeeId?: string }).employeeId;
  if (!employeeId) return NextResponse.json([]);

  type ExitWithProduct = Awaited<ReturnType<typeof prisma.stockExit.findMany>>[number] & { product: { id: string; name: string; unit: string } };
  type TransferWithProduct = Awaited<ReturnType<typeof prisma.employeeTransfer.findMany>>[number] & { product: { id: string; name: string; unit: string } };

  let exits: ExitWithProduct[];
  let outTransfers: TransferWithProduct[] = [];
  let inTransfers: TransferWithProduct[] = [];

  try {
    const [ex, out, in_] = await Promise.all([
      prisma.stockExit.findMany({ where: { employeeId }, include: { product: true } }),
      prisma.employeeTransfer.findMany({ where: { fromEmployeeId: employeeId }, include: { product: true } }),
      prisma.employeeTransfer.findMany({ where: { toEmployeeId: employeeId }, include: { product: true } }),
    ]);
    exits = ex as ExitWithProduct[];
    outTransfers = out as TransferWithProduct[];
    inTransfers = in_ as TransferWithProduct[];
  } catch {
    // Prisma client may not have employeeTransfer (run: npx prisma generate)
    exits = await prisma.stockExit.findMany({ where: { employeeId }, include: { product: true } }) as ExitWithProduct[];
  }

  const byProduct = new Map<string, { product: { id: string; name: string; unit: string }; quantity: number }>();

  for (const e of exits) {
    const key = e.productId;
    const cur = byProduct.get(key);
    const q = e.quantity;
    if (cur) cur.quantity += q;
    else byProduct.set(key, { product: e.product, quantity: q });
  }
  for (const t of outTransfers) {
    const key = t.productId;
    const cur = byProduct.get(key);
    if (cur) cur.quantity -= t.quantity;
    else byProduct.set(key, { product: t.product, quantity: -t.quantity });
  }
  for (const t of inTransfers) {
    const key = t.productId;
    const cur = byProduct.get(key);
    if (cur) cur.quantity += t.quantity;
    else byProduct.set(key, { product: t.product, quantity: t.quantity });
  }

  const result = Array.from(byProduct.values()).filter((x) => x.quantity > 0);
  return NextResponse.json(result);
}