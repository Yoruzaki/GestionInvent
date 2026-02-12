"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Package, AlertTriangle, Activity, ArrowRight, Send, Box } from "lucide-react";

interface DashboardData {
  totalProduits: number;
  alerteStockBas: { id: string; name: string; minimumThreshold: number }[];
  ruptures: number;
  dernieresEntrees: { id: string; quantity: number; purchaseDate: string; product: { name: string } }[];
  dernieresSorties: { id: string; quantity: number; date: string; product: { name: string }; employee: { name: string } | null; location?: { name: string } | null }[];
}

type EquipmentItem = { product: { id: string; name: string; unit: string }; quantity: number };
type TransferRequestItem = { id: string; quantity: number; status: string; product: { name: string }; toEmployee: { name: string }; requestedAt: string };

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const [data, setData] = useState<DashboardData | null>(null);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [myRequests, setMyRequests] = useState<TransferRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/dashboard")
        .then((r) => r.json())
        .then(setData)
        .finally(() => setLoading(false));
    } else {
      Promise.all([
        fetch("/api/me/equipment").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/transfer-requests").then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([equip, reqs]) => {
          setEquipment(Array.isArray(equip) ? equip : []);
          setMyRequests(Array.isArray(reqs) ? reqs : []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isAdmin]);

  if (loading) return <div className="text-center py-12">Chargement…</div>;

  if (!isAdmin) {
    const pending = myRequests.filter((r) => r.status === "pending");
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
        <p className="text-slate-600">Bienvenue, {session?.user?.name}. Voici votre équipement et vos demandes.</p>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Box className="w-5 h-5" /> Votre équipement
            </h2>
            <Link href="/mon-equipement" className="text-sm text-primary-600 flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {equipment.length === 0 ? (
              <li className="px-4 py-6 text-slate-500 text-sm">Aucun équipement attribué pour le moment.</li>
            ) : (
              equipment.slice(0, 8).map((item, i) => (
                <li key={item.product.id + i} className="px-4 py-2 text-sm">
                  <span className="font-medium">{item.quantity} {item.product.name}</span>
                  <span className="text-slate-500 ml-1">({item.product.unit})</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Send className="w-5 h-5" /> Vos demandes
            </h2>
            <Link href="/mes-demandes" className="text-sm text-primary-600 flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {pending.length === 0 ? (
              <li className="px-4 py-6 text-slate-500 text-sm">Aucune demande en attente.</li>
            ) : (
              pending.slice(0, 5).map((r) => (
                <li key={r.id} className="px-4 py-2 text-sm text-amber-700">
                  {r.quantity} {r.product?.name} → {r.toEmployee?.name} — En attente
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-12">Erreur de chargement</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total produits</p>
              <p className="text-xl font-semibold">{data.totalProduits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Stock bas</p>
              <p className="text-xl font-semibold">{data.alerteStockBas?.length ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ruptures</p>
              <p className="text-xl font-semibold">{data.ruptures ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {data.alerteStockBas?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h2 className="font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Stock bas
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {data.alerteStockBas.map((p) => (
              <li key={p.id}>
                <Link href="/stock" className="underline hover:no-underline">{p.name}</Link> — seuil : {p.minimumThreshold}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" /> Derniers mouvements
          </h2>
          <Link href="/mouvements" className="text-sm text-primary-600 flex items-center gap-1">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {(() => {
            const events = [
              ...(data.dernieresEntrees ?? []).map((e) => ({ type: "entree" as const, ...e, date: e.purchaseDate })),
              ...(data.dernieresSorties ?? []).map((e) => ({ type: "sortie" as const, ...e })),
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
            if (events.length === 0) return <li className="px-4 py-6 text-slate-500 text-sm">Aucune entrée ou sortie récente</li>;
            return events.map((ev) => {
              const dest = ev.type === "sortie" && ("employee" in ev || "location" in ev)
                ? ((ev as { employee?: { name: string }; location?: { name: string } }).employee?.name ?? (ev as { location?: { name: string } }).location?.name ?? "")
                : "";
              return (
                <li key={`${ev.type}-${ev.id}`} className={`px-4 py-2 text-sm ${ev.type === "entree" ? "text-emerald-700" : "text-amber-700"}`}>
                  {ev.type === "entree" ? "+" : "−"}{ev.quantity} {ev.product?.name}{dest ? ` — ${dest}` : ""} — {new Date(ev.date).toLocaleDateString("fr-FR")}
                </li>
              );
            });
          })()}
        </ul>
      </div>
    </div>
  );
}
