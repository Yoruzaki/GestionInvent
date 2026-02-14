import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "stock";

  let rows: Record<string, unknown>[] = [];
  let sheetName = "Rapport";

  if (type === "stock") {
    const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
    const entries = await prisma.stockEntry.groupBy({ by: ["productId"], _sum: { quantity: true } });
    const exits = await prisma.stockExit.groupBy({ by: ["productId"], _sum: { quantity: true } });
    const entryMap = Object.fromEntries(entries.map((e) => [e.productId, e._sum.quantity ?? 0]));
    const exitMap = Object.fromEntries(exits.map((e) => [e.productId, e._sum.quantity ?? 0]));
    rows = products.map((p) => ({
      Produit: p.name,
      Catégorie: p.category,
      Unité: p.unit,
      "Stock actuel": (entryMap[p.id] ?? 0) - (exitMap[p.id] ?? 0),
    }));
    sheetName = "Stock actuel";
  } else if (type === "actifs-par-lieu") {
    const assets = await prisma.asset.findMany({
      include: { location: true },
    });
    const byLoc = assets.reduce<Record<string, { lieu: string; bureau: string; count: number }>>((acc, a) => {
      const key = a.locationId || "sans-lieu";
      if (!acc[key]) {
        acc[key] = {
          lieu: a.location?.name ?? "Non affecté",
          bureau: a.location?.officeNumber ?? "",
          count: 0,
        };
      }
      acc[key].count++;
      return acc;
    }, {});
    rows = Object.values(byLoc).map((v) => ({ Lieu: v.lieu, Bureau: v.bureau, "Nombre équipements": v.count }));
    sheetName = "Actifs par lieu";
  } else if (type === "actifs-par-personne") {
    const assets = await prisma.asset.findMany({ include: { assignedTo: true } });
    const byPerson = assets.reduce<Record<string, number>>((acc, a) => {
      const name = a.assignedTo?.name ?? "Non assigné";
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});
    rows = Object.entries(byPerson).map(([personne, nombre]) => ({ Personne: personne, "Nombre équipements": nombre }));
    sheetName = "Actifs par personne";
  } else if (type === "consommation-mois") {
    const exits = await prisma.stockExit.findMany({
      include: { product: true },
      orderBy: { date: "asc" },
    });
    const byMonth: Record<string, { sorties: number; details: { produit: string; qte: number }[] }> = {};
    for (const e of exits) {
      const mois = new Date(e.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long" });
      if (!byMonth[mois]) byMonth[mois] = { sorties: 0, details: [] };
      byMonth[mois].sorties += e.quantity;
      const d = byMonth[mois].details.find((x) => x.produit === e.product.name);
      if (d) d.qte += e.quantity;
      else byMonth[mois].details.push({ produit: e.product.name, qte: e.quantity });
    }
    rows = Object.entries(byMonth).map(([mois, v]) => ({
      Mois: mois,
      "Total sorties": v.sorties,
      Détails: v.details.map((d) => `${d.produit}: ${d.qte}`).join("; "),
    }));
    sheetName = "Consommation par mois";
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `rapport-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
