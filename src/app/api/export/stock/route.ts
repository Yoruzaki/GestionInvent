import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  const entries = await prisma.stockEntry.groupBy({ by: ["productId"], _sum: { quantity: true } });
  const exits = await prisma.stockExit.groupBy({ by: ["productId"], _sum: { quantity: true } });
  const entryMap = Object.fromEntries(entries.map((e) => [e.productId, e._sum.quantity ?? 0]));
  const exitMap = Object.fromEntries(exits.map((e) => [e.productId, e._sum.quantity ?? 0]));

  const rows = products.map((p) => {
    const totalEntrees = entryMap[p.id] ?? 0;
    const totalSorties = exitMap[p.id] ?? 0;
    const stockActuel = totalEntrees - totalSorties;
    return {
      Produit: p.name,
      Code: p.code ?? "",
      "Code-barres": p.barcode ?? "",
      Type: p.productType === "consumable" ? "Consommable" : "Équipement",
      Catégorie: p.category,
      Unité: p.unit,
      Entrées: totalEntrees,
      Sorties: totalSorties,
      "Stock actuel": stockActuel,
      "Seuil alerte": p.minimumThreshold,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stock");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `inventaire-stock-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
