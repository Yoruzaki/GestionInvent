"use client";

import { useEffect, useState } from "react";
import { FileBarChart, Download, Package, MapPin, User, TrendingDown } from "lucide-react";

type ReportStock = { produit: string; categorie: string; unite: string; stockActuel: number }[];
type ReportLieu = { lieu: string; bureau: string | null; nombre: number }[];
type ReportPersonne = { personne: string; nombre: number }[];
type ReportConsommation = { mois: string; sorties: number; details: { produit: string; qte: number }[] }[];

export default function RapportsPage() {
  const [reportType, setReportType] = useState<"stock" | "actifs-par-lieu" | "actifs-par-personne" | "consommation-mois">("stock");
  const [data, setData] = useState<ReportStock | ReportLieu | ReportPersonne | ReportConsommation | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/rapports?type=${reportType}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [reportType]);

  const exportCsv = () => {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    const headers = Object.keys(data[0] as object);
    const rows = (data as object[]).map((row) => {
      const r = row as Record<string, unknown>;
      return headers.map((h) => (typeof r[h] === "object" ? JSON.stringify(r[h]) : String(r[h] ?? ""))).join(";");
    });
    const csv = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileBarChart className="w-7 h-7" /> Rapports
        </h1>
        <div className="flex gap-2 flex-wrap">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as typeof reportType)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="stock">Stock actuel</option>
            <option value="actifs-par-lieu">Équipements par lieu</option>
            <option value="actifs-par-personne">Équipements par personne</option>
            <option value="consommation-mois">Consommation par mois</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium"
          >
            Actualiser
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement…</div>
        ) : !data || !Array.isArray(data) ? (
          <div className="p-8 text-center text-slate-500">Aucune donnée</div>
        ) : reportType === "stock" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium">Produit</th>
                  <th className="text-left p-3 font-medium">Catégorie</th>
                  <th className="text-left p-3 font-medium">Unité</th>
                  <th className="text-right p-3 font-medium">Stock actuel</th>
                </tr>
              </thead>
              <tbody>
                {(data as ReportStock).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-3">{row.produit}</td>
                    <td className="p-3">{row.categorie}</td>
                    <td className="p-3">{row.unite}</td>
                    <td className="p-3 text-right font-medium">{row.stockActuel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reportType === "actifs-par-lieu" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium">Lieu</th>
                  <th className="text-left p-3 font-medium">Bureau</th>
                  <th className="text-right p-3 font-medium">Nombre d'équipements</th>
                </tr>
              </thead>
              <tbody>
                {(data as ReportLieu).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-3">{row.lieu}</td>
                    <td className="p-3">{row.bureau ?? "—"}</td>
                    <td className="p-3 text-right font-medium">{row.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reportType === "actifs-par-personne" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium">Personne</th>
                  <th className="text-right p-3 font-medium">Nombre d'équipements</th>
                </tr>
              </thead>
              <tbody>
                {(data as ReportPersonne).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-3">{row.personne}</td>
                    <td className="p-3 text-right font-medium">{row.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium">Mois</th>
                  <th className="text-right p-3 font-medium">Total sorties</th>
                  <th className="text-left p-3 font-medium">Détails (produit / quantité)</th>
                </tr>
              </thead>
              <tbody>
                {(data as ReportConsommation).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-3">{row.mois}</td>
                    <td className="p-3 text-right font-medium">{row.sorties}</td>
                    <td className="p-3">
                      <ul className="list-disc list-inside text-slate-600">
                        {row.details?.map((d, j) => (
                          <li key={j}>{d.produit} : {d.qte}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
