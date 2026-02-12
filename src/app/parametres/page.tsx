"use client";

import { useEffect, useState } from "react";
import { MapPin, Users, Plus, Truck, Tag, FolderOpen, Ruler, Eye } from "lucide-react";

type Location = { id: string; name: string; officeNumber: string | null; building: string | null };
type Employee = { id: string; name: string; position: string | null; department: string | null; user?: { id: string; email: string } | null };
type Supplier = { id: string; name: string; contact: string | null };
type ProductCategory = { id: string; name: string };
type Unit = { id: string; name: string; symbol: string | null };
type ObservationType = { id: string; label: string };

type ParamSection = "lieux" | "employes" | "fournisseurs" | "observations" | "categories" | "unites";

function SectionHeader({
  title,
  icon: Icon,
  onAdd,
  open,
  onToggle,
}: {
  title: string;
  icon: React.ElementType;
  onAdd: () => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/50">
      <button type="button" onClick={onToggle} className="flex items-center gap-2 font-semibold w-full text-left">
        <Icon className="w-5 h-5 text-primary-600" />
        {title}
      </button>
      <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 shrink-0">
        <Plus className="w-4 h-4" /> Ajouter
      </button>
    </div>
  );
}

export default function ParametresPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [observationTypes, setObservationTypes] = useState<ObservationType[]>([]);
  const [openSection, setOpenSection] = useState<ParamSection>("lieux");

  const [locForm, setLocForm] = useState({ name: "", officeNumber: "", building: "" });
  const [empForm, setEmpForm] = useState({ name: "", position: "", department: "" });
  const [supplierForm, setSupplierForm] = useState({ name: "", contact: "" });
  const [catForm, setCatForm] = useState({ name: "" });
  const [unitForm, setUnitForm] = useState({ name: "", symbol: "" });
  const [obsForm, setObsForm] = useState({ label: "" });

  const [showLocForm, setShowLocForm] = useState(false);
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showObsForm, setShowObsForm] = useState(false);
  const [accountForId, setAccountForId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({ email: "", password: "" });

  const load = () => {
    Promise.all([
      fetch("/api/locations").then((r) => r.json()),
      fetch("/api/employees").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/product-categories").then((r) => r.json()),
      fetch("/api/units").then((r) => r.json()),
      fetch("/api/observation-types").then((r) => r.json()),
    ]).then(([l, e, s, c, u, o]) => {
      setLocations(l);
      setEmployees(e);
      setSuppliers(s);
      setCategories(c);
      setUnits(u);
      setObservationTypes(o);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const addLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: locForm.name, officeNumber: locForm.officeNumber || null, building: locForm.building || null }),
    });
    if (res.ok) {
      setLocForm({ name: "", officeNumber: "", building: "" });
      setShowLocForm(false);
      load();
    }
  };

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: empForm.name, position: empForm.position || null, department: empForm.department || null }),
    });
    if (res.ok) {
      setEmpForm({ name: "", position: "", department: "" });
      setShowEmpForm(false);
      load();
    }
  };

  const addSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: supplierForm.name, contact: supplierForm.contact || null }),
    });
    if (res.ok) {
      setSupplierForm({ name: "", contact: "" });
      setShowSupplierForm(false);
      load();
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/product-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catForm.name }),
    });
    if (res.ok) {
      setCatForm({ name: "" });
      setShowCatForm(false);
      load();
    }
  };

  const addUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: unitForm.name, symbol: unitForm.symbol || null }),
    });
    if (res.ok) {
      setUnitForm({ name: "", symbol: "" });
      setShowUnitForm(false);
      load();
    }
  };

  const addObservationType = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/observation-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: obsForm.label }),
    });
    if (res.ok) {
      setObsForm({ label: "" });
      setShowObsForm(false);
      load();
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    load();
  };
  const deleteCategory = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    await fetch(`/api/product-categories/${id}`, { method: "DELETE" });
    load();
  };
  const deleteUnit = async (id: string) => {
    if (!confirm("Supprimer cette unité ?")) return;
    await fetch(`/api/units/${id}`, { method: "DELETE" });
    load();
  };
  const deleteObservationType = async (id: string) => {
    if (!confirm("Supprimer ce type d'observation ?")) return;
    await fetch(`/api/observation-types/${id}`, { method: "DELETE" });
    load();
  };

  const createOrResetAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForId) return;
    const res = await fetch(`/api/employees/${accountForId}/account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: accountForm.email.trim(), password: accountForm.password }),
    });
    const data = await res.json();
    if (res.ok) {
      setAccountForId(null);
      setAccountForm({ email: "", password: "" });
      load();
    } else {
      alert(data.error || "Erreur");
    }
  };

  const formClass = "p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 items-end";
  const inputClass = "mt-0.5 rounded border border-slate-300 px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Paramètres</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["lieux", "Lieux / Bureaux", MapPin],
            ["employes", "Employés", Users],
            ["fournisseurs", "Fournisseurs", Truck],
            ["observations", "Observations", Eye],
            ["categories", "Catégories de produit", FolderOpen],
            ["unites", "Unités", Ruler],
          ] as [ParamSection, string, React.ElementType][]
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setOpenSection(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              openSection === key ? "bg-primary-600 text-white" : "bg-slate-100 hover:bg-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {openSection === "lieux" && (
        <section className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <SectionHeader
            title="Lieux / Bureaux"
            icon={MapPin}
            onAdd={() => { setShowLocForm(true); setOpenSection("lieux"); }}
            open={true}
            onToggle={() => {}}
          />
          {showLocForm && (
            <form onSubmit={addLocation} className={formClass}>
              <div>
                <label className="block text-xs font-medium text-slate-500">Nom *</label>
                <input required value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} className={inputClass} placeholder="ex. Bureau directeur" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">N° bureau</label>
                <input value={locForm.officeNumber} onChange={(e) => setLocForm({ ...locForm, officeNumber: e.target.value })} className={inputClass} placeholder="101" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Bâtiment</label>
                <input value={locForm.building} onChange={(e) => setLocForm({ ...locForm, building: e.target.value })} className={inputClass} placeholder="Bâtiment A" />
              </div>
              <button type="submit" className="py-2 px-4 rounded bg-primary-600 text-white text-sm hover:bg-primary-700">Enregistrer</button>
              <button type="button" onClick={() => setShowLocForm(false)} className="py-2 px-4 rounded border border-slate-300 text-sm">Annuler</button>
            </form>
          )}
          <ul className="divide-y divide-slate-100">
            {locations.map((l) => (
              <li key={l.id} className="px-4 py-3"><strong>{l.name}</strong> {l.officeNumber && `(${l.officeNumber})`} {l.building && `— ${l.building}`}</li>
            ))}
            {locations.length === 0 && !showLocForm && <li className="px-4 py-6 text-slate-500 text-sm">Aucun lieu.</li>}
          </ul>
        </section>
      )}

      {openSection === "employes" && (
        <section className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <SectionHeader title="Employés / Responsables" icon={Users} onAdd={() => setShowEmpForm(true)} open={true} onToggle={() => {}} />
          {showEmpForm && (
            <form onSubmit={addEmployee} className={formClass}>
              <div>
                <label className="block text-xs font-medium text-slate-500">Nom *</label>
                <input required value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} className={inputClass} placeholder="Ahmed Benali" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Poste</label>
                <input value={empForm.position} onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })} className={inputClass} placeholder="Directeur" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Département</label>
                <input value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} className={inputClass} placeholder="Direction" />
              </div>
              <button type="submit" className="py-2 px-4 rounded bg-primary-600 text-white text-sm hover:bg-primary-700">Enregistrer</button>
              <button type="button" onClick={() => setShowEmpForm(false)} className="py-2 px-4 rounded border border-slate-300 text-sm">Annuler</button>
            </form>
          )}
          <ul className="divide-y divide-slate-100">
            {employees.map((e) => (
              <li key={e.id} className="px-4 py-3 flex flex-wrap items-center gap-2">
                <span><strong>{e.name}</strong> {e.position && `— ${e.position}`} {e.department && `(${e.department})`}</span>
                {e.user ? (
                  <span className="text-slate-500 text-sm">Compte : {e.user.email}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => { setAccountForId(e.id); setAccountForm({ email: e.user?.email ?? "", password: "" }); }}
                  className="text-sm text-primary-600 hover:underline"
                >
                  {e.user ? "Réinitialiser le mot de passe" : "Créer un compte"}
                </button>
              </li>
            ))}
            {employees.length === 0 && !showEmpForm && <li className="px-4 py-6 text-slate-500 text-sm">Aucun employé.</li>}
          </ul>
        </section>
      )}

      {accountForId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4">
            <h3 className="font-semibold mb-3">Compte de connexion pour l&apos;employé</h3>
            <form onSubmit={createOrResetAccount} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-600">Email *</label>
                <input required type="email" value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="employe@etablissement.local" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Mot de passe *</label>
                <input required type="password" value={accountForm.password} onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="••••••" minLength={6} />
                <p className="text-xs text-slate-500 mt-0.5">L&apos;employé pourra le modifier après connexion.</p>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">Enregistrer</button>
                <button type="button" onClick={() => { setAccountForId(null); setAccountForm({ email: "", password: "" }); }} className="px-4 py-2 rounded-lg border border-slate-300">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openSection === "fournisseurs" && (
        <section className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <SectionHeader title="Fournisseurs" icon={Truck} onAdd={() => setShowSupplierForm(true)} open={true} onToggle={() => {}} />
          {showSupplierForm && (
            <form onSubmit={addSupplier} className={formClass}>
              <div>
                <label className="block text-xs font-medium text-slate-500">Nom *</label>
                <input required value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} className={inputClass} placeholder="Nom du fournisseur" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Contact</label>
                <input value={supplierForm.contact} onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })} className={inputClass} placeholder="Tél / email" />
              </div>
              <button type="submit" className="py-2 px-4 rounded bg-primary-600 text-white text-sm hover:bg-primary-700">Enregistrer</button>
              <button type="button" onClick={() => setShowSupplierForm(false)} className="py-2 px-4 rounded border border-slate-300 text-sm">Annuler</button>
            </form>
          )}
          <ul className="divide-y divide-slate-100">
            {suppliers.map((s) => (
              <li key={s.id} className="px-4 py-3 flex justify-between items-center">
                <span><strong>{s.name}</strong> {s.contact && `— ${s.contact}`}</span>
                <button type="button" onClick={() => deleteSupplier(s.id)} className="text-rose-600 text-sm hover:underline">Supprimer</button>
              </li>
            ))}
            {suppliers.length === 0 && !showSupplierForm && <li className="px-4 py-6 text-slate-500 text-sm">Aucun fournisseur. Ajoutez-en dans Paramètres.</li>}
          </ul>
        </section>
      )}

      {openSection === "observations" && (
        <section className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <SectionHeader title="Types d'observation" icon={Eye} onAdd={() => setShowObsForm(true)} open={true} onToggle={() => {}} />
          {showObsForm && (
            <form onSubmit={addObservationType} className={formClass}>
              <div>
                <label className="block text-xs font-medium text-slate-500">Libellé *</label>
                <input required value={obsForm.label} onChange={(e) => setObsForm({ ...obsForm, label: e.target.value })} className={inputClass} placeholder="ex. En panne, À réformer" />
              </div>
              <button type="submit" className="py-2 px-4 rounded bg-primary-600 text-white text-sm hover:bg-primary-700">Enregistrer</button>
              <button type="button" onClick={() => setShowObsForm(false)} className="py-2 px-4 rounded border border-slate-300 text-sm">Annuler</button>
            </form>
          )}
          <ul className="divide-y divide-slate-100">
            {observationTypes.map((o) => (
              <li key={o.id} className="px-4 py-3 flex justify-between items-center">
                <span>{o.label}</span>
                <button type="button" onClick={() => deleteObservationType(o.id)} className="text-rose-600 text-sm hover:underline">Supprimer</button>
              </li>
            ))}
            {observationTypes.length === 0 && !showObsForm && <li className="px-4 py-6 text-slate-500 text-sm">Aucun type. Utilisez ces libellés pour les observations sur les actifs.</li>}
          </ul>
        </section>
      )}

      {openSection === "categories" && (
        <section className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <SectionHeader title="Catégories de produit" icon={FolderOpen} onAdd={() => setShowCatForm(true)} open={true} onToggle={() => {}} />
          {showCatForm && (
            <form onSubmit={addCategory} className={formClass}>
              <div>
                <label className="block text-xs font-medium text-slate-500">Nom *</label>
                <input required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className={inputClass} placeholder="ex. Bureau, Entretien" />
              </div>
              <button type="submit" className="py-2 px-4 rounded bg-primary-600 text-white text-sm hover:bg-primary-700">Enregistrer</button>
              <button type="button" onClick={() => setShowCatForm(false)} className="py-2 px-4 rounded border border-slate-300 text-sm">Annuler</button>
            </form>
          )}
          <ul className="divide-y divide-slate-100">
            {categories.map((c) => (
              <li key={c.id} className="px-4 py-3 flex justify-between items-center">
                <span>{c.name}</span>
                <button type="button" onClick={() => deleteCategory(c.id)} className="text-rose-600 text-sm hover:underline">Supprimer</button>
              </li>
            ))}
            {categories.length === 0 && !showCatForm && <li className="px-4 py-6 text-slate-500 text-sm">Aucune catégorie. Ajoutez-en pour les produits.</li>}
          </ul>
        </section>
      )}

      {openSection === "unites" && (
        <section className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <SectionHeader title="Unités" icon={Ruler} onAdd={() => setShowUnitForm(true)} open={true} onToggle={() => {}} />
          {showUnitForm && (
            <form onSubmit={addUnit} className={formClass}>
              <div>
                <label className="block text-xs font-medium text-slate-500">Nom *</label>
                <input required value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} className={inputClass} placeholder="ex. Pièce, Rame" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Symbole</label>
                <input value={unitForm.symbol} onChange={(e) => setUnitForm({ ...unitForm, symbol: e.target.value })} className={inputClass} placeholder="ex. pce, kg" />
              </div>
              <button type="submit" className="py-2 px-4 rounded bg-primary-600 text-white text-sm hover:bg-primary-700">Enregistrer</button>
              <button type="button" onClick={() => setShowUnitForm(false)} className="py-2 px-4 rounded border border-slate-300 text-sm">Annuler</button>
            </form>
          )}
          <ul className="divide-y divide-slate-100">
            {units.map((u) => (
              <li key={u.id} className="px-4 py-3 flex justify-between items-center">
                <span><strong>{u.name}</strong> {u.symbol && `(${u.symbol})`}</span>
                <button type="button" onClick={() => deleteUnit(u.id)} className="text-rose-600 text-sm hover:underline">Supprimer</button>
              </li>
            ))}
            {units.length === 0 && !showUnitForm && <li className="px-4 py-6 text-slate-500 text-sm">Aucune unité. Ajoutez-en pour les produits.</li>}
          </ul>
        </section>
      )}
    </div>
  );
}
