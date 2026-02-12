"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Send } from "lucide-react";

type EquipmentItem = { product: { id: string; name: string; unit: string }; quantity: number };
type Employee = { id: string; name: string };
type Location = { id: string; name: string; officeNumber?: string | null };

export default function MonEquipementPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeSearchResults, setEmployeeSearchResults] = useState<Employee[]>([]);
  const [form, setForm] = useState({ productId: "", productSearch: "", quantity: 0, toEmployeeId: "", toEmployeeSearch: "", locationId: "", purpose: "", returnToStock: false });

  const load = useCallback(() => {
    setLoading(true);
    const toJson = (r: Response) => (r.ok ? r.json() : Promise.resolve([]));
    Promise.all([
      fetch("/api/me/equipment").then(toJson).catch(() => []),
      fetch("/api/employees").then(toJson).catch(() => []),
      fetch("/api/locations").then(toJson).catch(() => []),
    ])
      .then(([equip, e, l]) => {
        setEquipment(Array.isArray(equip) ? equip : []);
        setEmployees(Array.isArray(e) ? e : []);
        setLocations(Array.isArray(l) ? l : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const searchEmployees = (q: string) => {
    const v = q.trim();
    if (!v) { setEmployeeSearchResults([]); return; }
    fetch(`/api/employees?q=${encodeURIComponent(v)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Employee[]) => setEmployeeSearchResults(Array.isArray(list) ? list : []));
  };

  const submitDemande = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId) { alert("Veuillez sélectionner un produit de votre équipement."); return; }
    if (!form.returnToStock && !form.toEmployeeId) { alert("Choisissez un bénéficiaire ou cochez « Retour au stock »."); return; }
    const item = equipment.find((x) => x.product.id === form.productId);
    if (item && form.quantity > item.quantity) { alert(`Quantité max. pour ce produit : ${item.quantity}`); return; }
    const res = await fetch("/api/transfer-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: form.productId,
        quantity: form.quantity,
        returnToStock: form.returnToStock,
        toEmployeeId: form.returnToStock ? undefined : form.toEmployeeId,
        locationId: form.locationId || undefined,
        purpose: form.purpose || undefined,
      }),
    });
    if (res.ok) {
      setForm({ productId: "", productSearch: "", quantity: 0, toEmployeeId: "", toEmployeeSearch: "", locationId: "", purpose: "", returnToStock: false });
      load();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur");
    }
  };

  const selectedItem = equipment.find((x) => x.product.id === form.productId);
  const maxQty = selectedItem ? selectedItem.quantity : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Box className="w-7 h-7" /> Mon équipement
      </h1>
      <p className="text-slate-600">Liste de l&apos;équipement qui vous a été attribué. Vous pouvez demander une sortie (attribution à un collègue ou un lieu) via le formulaire ci-dessous ; l&apos;administrateur validera la demande.</p>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement…</div>
        ) : equipment.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Aucun équipement attribué.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {equipment.map((item, i) => (
              <li key={item.product.id + i} className="px-4 py-3 flex justify-between items-center">
                <span className="font-medium">{item.product.name}</span>
                <span className="text-slate-600">{item.quantity} {item.product.unit}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-md">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-primary-700">
          <Send className="w-5 h-5" /> Demander une sortie
        </h2>
        <p className="text-sm text-slate-600 mb-4">Donnez une partie de votre équipement à un collègue ou renvoyez-la au stock. La quantité sera déduite de votre équipement une fois l&apos;admin a validé.</p>
        <form onSubmit={submitDemande} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600">Produit (votre équipement) *</label>
            <select value={form.productId} onChange={(e) => { const eq = equipment.find((x) => x.product.id === e.target.value); setForm({ ...form, productId: e.target.value, productSearch: eq ? eq.product.name : "" }); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" required>
              <option value="">Choisir dans votre équipement…</option>
              {equipment.map((item) => (
                <option key={item.product.id} value={item.product.id}>{item.product.name} — vous en avez {item.quantity} {item.product.unit}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Quantité *</label>
            <input required type="number" min={1} max={maxQty || undefined} value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder={maxQty ? `Max. ${maxQty}` : ""} />
            {maxQty > 0 && <p className="text-xs text-slate-500 mt-0.5">Maximum : {maxQty}</p>}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={form.returnToStock} onChange={(e) => setForm({ ...form, returnToStock: e.target.checked, toEmployeeId: "", toEmployeeSearch: "" })} className="rounded border-slate-300" />
              Retour au stock (renvoyer au magasin)
            </label>
          </div>
          {!form.returnToStock && (
            <div>
              <label className="block text-sm font-medium text-slate-600">Bénéficiaire (employé) *</label>
              <input value={form.toEmployeeSearch} onChange={(e) => { setForm({ ...form, toEmployeeSearch: e.target.value }); searchEmployees(e.target.value); }} placeholder="Rechercher…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              {employeeSearchResults.length > 0 && (
                <ul className="mt-1 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-32 overflow-y-auto">
                  {employeeSearchResults.map((emp) => (
                    <li key={emp.id}>
                      <button type="button" onClick={() => setForm({ ...form, toEmployeeId: emp.id, toEmployeeSearch: emp.name })} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm">{emp.name}</button>
                    </li>
                  ))}
                </ul>
              )}
              <select value={form.toEmployeeId} onChange={(e) => setForm({ ...form, toEmployeeId: e.target.value, toEmployeeSearch: employees.find((x) => x.id === e.target.value)?.name ?? "" })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">Choisir un employé…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-600">Destination (Lieu / Bureau)</label>
            <select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">—</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}{loc.officeNumber ? ` — ${loc.officeNumber}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Motif</label>
            <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Optionnel" />
          </div>
          <button type="submit" className="w-full py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium">Envoyer la demande</button>
        </form>
      </div>
    </div>
  );
}
