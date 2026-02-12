"use client";

import { useEffect, useState } from "react";
import { Send, CheckCircle, XCircle, User } from "lucide-react";

type TransferRequest = {
  id: string;
  quantity: number;
  status: string;
  returnToStock?: boolean;
  requestedAt: string;
  product: { name: string; unit: string };
  toEmployee: { name: string } | null;
  location: { name: string } | null;
  requestedBy?: { name: string; email: string };
};

export default function DemandesPage() {
  const [list, setList] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const load = () => {
    setLoading(true);
    fetch(`/api/transfer-requests${filter === "pending" ? "?status=pending" : ""}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const res = await fetch(`/api/transfer-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
    else {
      const err = await res.json();
      alert(err.error || "Erreur");
    }
  };

  const pendingCount = filter === "pending" ? list.length : list.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Send className="w-7 h-7" /> Demandes à valider
      </h1>
      <p className="text-slate-600">Acceptez ou refusez les demandes. En acceptant : l&apos;équipement est retiré de l&apos;employé demandeur et soit attribué à un autre employé, soit renvoyé au stock.</p>

      <div className="flex gap-2">
        <button type="button" onClick={() => setFilter("pending")} className={`px-3 py-2 rounded-lg text-sm font-medium ${filter === "pending" ? "bg-primary-600 text-white" : "bg-slate-100"}`}>
          En attente ({pendingCount})
        </button>
        <button type="button" onClick={() => setFilter("all")} className={`px-3 py-2 rounded-lg text-sm font-medium ${filter === "all" ? "bg-primary-600 text-white" : "bg-slate-100"}`}>
          Toutes
        </button>
      </div>

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
                {r.requestedBy && (
                  <span className="inline-flex items-center gap-1 text-slate-600 text-sm">
                    <User className="w-3.5 h-3.5" /> {r.requestedBy.name}
                  </span>
                )}
                <span className="text-slate-400 text-sm">{new Date(r.requestedAt).toLocaleDateString("fr-FR")}</span>
                {r.status === "pending" && (
                  <div className="ml-auto flex gap-2">
                    <button type="button" onClick={() => decide(r.id, "approved")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">
                      <CheckCircle className="w-4 h-4" /> Accepter
                    </button>
                    <button type="button" onClick={() => decide(r.id, "rejected")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700">
                      <XCircle className="w-4 h-4" /> Refuser
                    </button>
                  </div>
                )}
                {r.status !== "pending" && (
                  <span className={`ml-auto text-sm font-medium ${r.status === "approved" ? "text-emerald-600" : "text-rose-600"}`}>
                    {r.status === "approved" ? "Acceptée" : "Refusée"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
