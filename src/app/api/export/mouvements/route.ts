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

  const [entries, exits] = await Promise.all([
    prisma.stockEntry.findMany({
      include: { product: true, supplierRef: true },
      orderBy: { purchaseDate: "desc" },
    }),
    prisma.stockExit.findMany({
      include: { product: true, employee: true, location: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const entryRows = entries.map((e) => ({
    Date: new Date(e.purchaseDate).toLocaleDateString("fr-FR"),
    Produit: e.product.name,
    Quantité: e.quantity,
    Fournisseur: e.supplierRef?.name ?? e.supplier ?? "",
    "N° facture": e.invoiceNumber ?? "",
  }));

  const exitRows = exits.map((e) => ({
    Date: new Date(e.date).toLocaleDateString("fr-FR"),
    Produit: e.product.name,
    Quantité: e.quantity,
    Bénéficiaire: e.employee?.name ?? "",
    Destination: e.location?.name ?? "",
    Observation: e.observation ?? "",
    Motif: e.purpose ?? "",
  }));

  const wsEntries = XLSX.utils.json_to_sheet(entryRows);
  const wsExits = XLSX.utils.json_to_sheet(exitRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsEntries, "Entrées");
  XLSX.utils.book_append_sheet(wb, wsExits, "Sorties");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `mouvements-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
