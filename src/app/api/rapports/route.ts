import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "stock") {
    const products = await prisma.product.findMany();
    const entries = await prisma.stockEntry.groupBy({ by: ["productId"], _sum: { quantity: true } });
    const exits = await prisma.stockExit.groupBy({ by: ["productId"], _sum: { quantity: true } });
    const eMap = Object.fromEntries(entries.map((e) => [e.productId, e._sum.quantity ?? 0]));
    const xMap = Object.fromEntries(exits.map((e) => [e.productId, e._sum.quantity ?? 0]));
    const data = products.map((p) => ({
      produit: p.name,
      categorie: p.category,
      unite: p.unit,
      stockActuel: (eMap[p.id] ?? 0) - (xMap[p.id] ?? 0),
    }));
    return NextResponse.json(data);
  }

  if (type === "actifs-par-lieu") {
    const list = await prisma.asset.groupBy({
      by: ["locationId"],
      _count: { id: true },
    });
    const locations = await prisma.location.findMany();
    const locMap = Object.fromEntries(locations.map((l) => [l.id, l]));
    const data = list.map((x) => ({
      lieu: locMap[x.locationId ?? ""]?.name ?? "Non affecté",
      bureau: locMap[x.locationId ?? ""]?.officeNumber,
      nombre: x._count.id,
    }));
    return NextResponse.json(data);
  }

  if (type === "actifs-par-personne") {
    const list = await prisma.asset.groupBy({
      by: ["assignedToId"],
      _count: { id: true },
    });
    const employees = await prisma.employee.findMany();
    const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));
    const data = list.map((x) => ({
      personne: empMap[x.assignedToId ?? ""]?.name ?? "Non assigné",
      nombre: x._count.id,
    }));
    return NextResponse.json(data);
  }

  if (type === "consommation-mois") {
    const exits = await prisma.stockExit.findMany({
      include: { product: true },
    });
    const byMonth: Record<string, { mois: string; sorties: number; details: { produit: string; qte: number }[] }> = {};
    for (const e of exits) {
      const key = e.date.toISOString().slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { mois: key, sorties: 0, details: [] };
      byMonth[key].sorties += e.quantity;
      const det = byMonth[key].details.find((d) => d.produit === e.product.name);
      if (det) det.qte += e.quantity;
      else byMonth[key].details.push({ produit: e.product.name, qte: e.quantity });
    }
    return NextResponse.json(Object.values(byMonth).sort((a, b) => b.mois.localeCompare(a.mois)));
  }

  return NextResponse.json({ error: "type invalide" }, { status: 400 });
}
