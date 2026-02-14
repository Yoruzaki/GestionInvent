"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowDownCircle, ArrowUpCircle, HelpCircle, FileSpreadsheet } from "lucide-react";

type EntryItem = {
  id: string;
  quantity: number;
  purchaseDate: string;
  product: { name: string };
  supplier: string | null;
};
type ExitItem = {
  id: string;
  quantity: number;
  date: string;
  product: { name: string };
  employee: { name: string } | null;
  location?: { name: string } | null;
  observation?: string | null;
  purpose: string | null;
};

export default function MouvementsPage() {
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [exits, setExits] = useState<ExitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"tous" | "entrees" | "sorties">("tous");
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setLoading(true);
    const toJson = (r: Response) => (r.ok ? r.json() : Promise.resolve([]));
    Promise.all([
      fetch("/api/stock/entries").then(toJson).catch(() => []),
      fetch("/api/stock/exits").then(toJson).catch(() => []),
    ])
      .then(([ent, ext]) => {
        setEntries(Array.isArray(ent) ? ent : []);
        setExits(Array.isArray(ext) ? ext : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const events: { type: "entree" | "sortie"; date: string; label: string; detail?: string }[] = [];
  if (filter === "tous" || filter === "entrees")
    entries.forEach((e) =>
      events.push({
        type: "entree",
        date: e.purchaseDate,
        label: `+${e.quantity} ${e.product?.name}`,
        detail: e.supplier ?? undefined,
      })
    );
  if (filter === "tous" || filter === "sorties")
    exits.forEach((e) => {
      const detailParts = [e.employee?.name, e.location?.name, e.observation, e.purpose].filter(Boolean);
      events.push({
        type: "sortie",
        date: e.date,
        label: `−${e.quantity} ${e.product?.name}`,
        detail: detailParts.length ? detailParts.join(" · ") : undefined,
      });
    });
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportExcel = () => window.open("/api/export/mouvements", "_blank");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="page-title flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <Activity className="w-7 h-7 text-primary-600" />
            </div>
            Mouvements
          </h1>
          <button type="button" onClick={() => setShowHelp(!showHelp)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500" title="Aide">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-sm shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exporter Excel
          </button>
          <button
            type="button"
            onClick={() => setFilter("tous")}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${filter === "tous" ? "bg-primary-600 text-white" : "bg-slate-100"}`}
          >
            <Activity className="w-4 h-4" /> Tous
          </button>
          <button
            type="button"
            onClick={() => setFilter("entrees")}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${filter === "entrees" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}
          >
            <ArrowDownCircle className="w-4 h-4" /> Entrées
          </button>
          <button
            type="button"
            onClick={() => setFilter("sorties")}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${filter === "sorties" ? "bg-amber-600 text-white" : "bg-slate-100"}`}
          >
            <ArrowUpCircle className="w-4 h-4" /> Sorties
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 space-y-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" /> Entrées et Sorties de stock
          </h3>
          <p><strong>Entrées</strong> : achats de produits — quand du stock entre au magasin (ex. +50 rames de papier).</p>
          <p><strong>Sorties</strong> : quand du stock sort — avec employé, destination (Lieu/Bureau) et observation.</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement…</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Aucun mouvement à afficher.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {events.slice(0, 150).map((ev, i) => (
              <li key={`${ev.type}-${ev.date}-${i}`} className="flex items-start gap-4 px-4 py-3 hover:bg-slate-50/50">
                <span className="text-slate-400 text-sm whitespace-nowrap">
                  {new Date(ev.date).toLocaleDateString("fr-FR")} {new Date(ev.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                    ev.type === "entree" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {ev.type === "entree" && <ArrowDownCircle className="w-3.5 h-3.5" />}
                  {ev.type === "sortie" && <ArrowUpCircle className="w-3.5 h-3.5" />}
                  {ev.label}
                </span>
                {ev.detail && <span className="text-slate-500 text-sm">{ev.detail}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
