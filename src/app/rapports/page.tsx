"use client";

import { useEffect, useState } from "react";
import { FileBarChart, Download, FileSpreadsheet, RefreshCw } from "lucide-react";

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

  const exportExcel = () => {
    window.open(`/api/export/rapports?type=${reportType}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-title flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-xl">
            <FileBarChart className="w-7 h-7 text-primary-600" />
          </div>
          Rapports
        </h1>
        <div className="flex gap-2 flex-wrap">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as typeof reportType)}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="stock">Stock actuel</option>
            <option value="actifs-par-lieu">Équipements par lieu</option>
            <option value="actifs-par-personne">Équipements par personne</option>
            <option value="consommation-mois">Consommation par mois</option>
          </select>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!data || !Array.isArray(data) || data.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-600 text-white hover:bg-slate-700 font-medium text-sm disabled:opacity-50 shadow-sm"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-sm shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500">Chargement…</p>
          </div>
        ) : !data || !Array.isArray(data) ? (
          <div className="p-12 text-center text-slate-500">Aucune donnée</div>
        ) : reportType === "stock" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">Produit</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Catégorie</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Unité</th>
                  <th className="text-right p-4 font-semibold text-slate-700">Stock actuel</th>
                </tr>
              </thead>
              <tbody>
                {(data as ReportStock).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{row.produit}</td>
                    <td className="p-4 text-slate-600">{row.categorie}</td>
                    <td className="p-4 text-slate-600">{row.unite}</td>
                    <td className="p-4 text-right font-semibold">{row.stockActuel}</td>
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
                  <th className="text-left p-4 font-semibold text-slate-700">Lieu</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Bureau</th>
                  <th className="text-right p-4 font-semibold text-slate-700">Nombre d&apos;équipements</th>
                </tr>
              </thead>
              <tbody>
                {(data as ReportLieu).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{row.lieu}</td>
                    <td className="p-4 text-slate-600">{row.bureau ?? "—"}</td>
                    <td className="p-4 text-right font-semibold">{row.nombre}</td>
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
                  <th className="text-left p-4 font-semibold text-slate-700">Personne</th>
                  <th className="text-right p-4 font-semibold text-slate-700">Nombre d&apos;équipements</th>
                </tr>
              </thead>
              <tbody>
                {(data as ReportPersonne).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{row.personne}</td>
                    <td className="p-4 text-right font-semibold">{row.nombre}</td>
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
                  <th className="text-left p-4 font-semibold text-slate-700">Mois</th>
                  <th className="text-right p-4 font-semibold text-slate-700">Total sorties</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Détails (produit / quantité)</th>
                </tr>
              </thead>
              <tbody>
                {(data as ReportConsommation).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{row.mois}</td>
                    <td className="p-4 text-right font-semibold">{row.sorties}</td>
                    <td className="p-4">
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
