"use client";

import { useEffect, useState } from "react";
import { Send, Clock, CheckCircle, XCircle } from "lucide-react";

type TransferRequest = {
  id: string;
  quantity: number;
  status: string;
  returnToStock?: boolean;
  requestedAt: string;
  product: { name: string; unit: string };
  toEmployee: { name: string } | null;
  location: { name: string } | null;
};

export default function MesDemandesPage() {
  const [list, setList] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transfer-requests")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (status: string) => {
    if (status === "pending") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> En attente</span>;
    if (status === "approved") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3" /> Acceptée</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><XCircle className="w-3 h-3" /> Refusée</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Send className="w-7 h-7" /> Mes demandes de sortie
      </h1>
      <p className="text-slate-600">Vos demandes sont validées par l&apos;administrateur.</p>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement…</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Aucune demande.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((r) => (
              <li key={r.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                <span className="font-medium">{r.quantity} {r.product?.name}</span>
                <span className="text-slate-500">{r.returnToStock ? "→ Retour au stock" : `→ ${r.toEmployee?.name ?? "—"}`}</span>
                {r.location && <span className="text-slate-500 text-sm">{r.location.name}</span>}
                {statusBadge(r.status)}
                <span className="text-slate-400 text-sm ml-auto">{new Date(r.requestedAt).toLocaleDateString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
