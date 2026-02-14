"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Pencil, Trash2, X, Search, Filter, Send, FileSpreadsheet } from "lucide-react";

type BalanceItem = {
  id: string;
  name: string;
  code?: string | null;
  barcode?: string | null;
  productType?: string;
  category: string;
  unit: string;
  minimumThreshold: number;
  totalEntrees: number;
  totalSorties: number;
  stockActuel: number;
};

type Product = { id: string; name: string; code?: string | null; barcode?: string | null; productType?: string; category: string; unit: string; minimumThreshold: number };
type Location = { id: string; name: string; officeNumber?: string | null };
type Employee = { id: string; name: string };
type Supplier = { id: string; name: string };
type ProductCategory = { id: string; name: string; productType?: string };
type Unit = { id: string; name: string; symbol?: string | null };
type ObservationType = { id: string; label: string };

export default function StockPage() {
  const [balance, setBalance] = useState<BalanceItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [unitsList, setUnitsList] = useState<Unit[]>([]);
  const [observationTypes, setObservationTypes] = useState<ObservationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"liste" | "entree" | "sortie" | "produit" | "demande">("liste");
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const allowedProductTypes = (session?.user as { allowedProductTypes?: string } | undefined)?.allowedProductTypes;
  const allowedTypesList: string[] | null =
    !allowedProductTypes || !allowedProductTypes.trim()
      ? null
      : allowedProductTypes
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s === "equipment" || s === "consumable");

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin && status === "authenticated") {
      router.replace("/mon-equipement");
    }
  }, [status, isAdmin, router]);

  const [formDemande, setFormDemande] = useState({ productId: "", productSearch: "", quantity: 0, toEmployeeId: "", toEmployeeSearch: "", locationId: "", purpose: "" });

  // Filters
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<"tous" | "en_stock" | "faible" | "rupture">("tous");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterProductType, setFilterProductType] = useState<"tous" | "equipment" | "consumable">("tous");

  const [formProduct, setFormProduct] = useState({
    name: "", code: "", barcode: "", productType: "equipment" as "equipment" | "consumable",
    categoryId: "", category: "", unitId: "", unit: "", minimumThreshold: 0,
    purchaseDate: "", quantity: 0, supplierId: "", invoiceNumber: "",
  });
  const [formEntree, setFormEntree] = useState({
    productId: "", productSearch: "", quantity: 0, supplierId: "", supplier: "", invoiceNumber: "",
  });
  const [formSortie, setFormSortie] = useState({
    productId: "", productSearch: "", quantity: 0, employeeId: "", employeeSearch: "",
    locationId: "", observation: "", observationTypeId: "", purpose: "",
  });

  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [employeeSearchResults, setEmployeeSearchResults] = useState<Employee[]>([]);
  const [employeeSearching, setEmployeeSearching] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", code: "", barcode: "", productType: "equipment" as "equipment" | "consumable", category: "", unit: "", minimumThreshold: 0 });

  const productsForActions =
    !isAdmin || !allowedTypesList?.length
      ? products
      : products.filter((p) => p.productType && allowedTypesList.includes(p.productType));
  const searchResultsForActions =
    !isAdmin || !allowedTypesList?.length
      ? productSearchResults
      : productSearchResults.filter((p) => p.productType && allowedTypesList.includes(p.productType));

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/stock/page-data")
      .then((r) => (r.ok ? r.json() : Promise.resolve({})))
      .then((data) => {
        setBalance(Array.isArray(data.balance) ? data.balance : []);
        setProducts(Array.isArray(data.products) ? data.products : []);
        setLocations(Array.isArray(data.locations) ? data.locations : []);
        setEmployees(Array.isArray(data.employees) ? data.employees : []);
        setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : []);
        setProductCategories(Array.isArray(data.productCategories) ? data.productCategories : []);
        setUnitsList(Array.isArray(data.units) ? data.units : []);
        setObservationTypes(Array.isArray(data.observationTypes) ? data.observationTypes : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const searchProducts = useCallback((q: string) => {
    const v = q.trim();
    if (!v) {
      setProductSearchResults([]);
      return;
    }
    setProductSearching(true);
    fetch(`/api/products/search?q=${encodeURIComponent(v)}`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((list: Product[]) => {
        setProductSearchResults(Array.isArray(list) ? list : []);
      })
      .finally(() => setProductSearching(false));
  }, []);

  const searchEmployees = useCallback((q: string) => {
    const v = q.trim();
    if (!v) {
      setEmployeeSearchResults([]);
      return;
    }
    setEmployeeSearching(true);
    fetch(`/api/employees?q=${encodeURIComponent(v)}`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((list: Employee[]) => {
        setEmployeeSearchResults(Array.isArray(list) ? list : []);
      })
      .finally(() => setEmployeeSearching(false));
  }, []);

  const filteredBalance = balance.filter((b) => {
    const q = searchQ.trim().toLowerCase();
    if (q) {
      const match =
        b.name.toLowerCase().includes(q) ||
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.barcode && b.barcode.includes(q));
      if (!match) return false;
    }
    if (filterProductType !== "tous" && (b as { productType?: string }).productType !== filterProductType) return false;
    if (filterCategory && b.category !== filterCategory) return false;
    if (filterStatus === "en_stock" && (b.stockActuel <= 0 || (b.minimumThreshold > 0 && b.stockActuel <= b.minimumThreshold))) return false;
    if (filterStatus === "faible" && (b.minimumThreshold <= 0 || b.stockActuel > b.minimumThreshold || b.stockActuel <= 0)) return false;
    if (filterStatus === "rupture" && b.stockActuel > 0) return false;
    return true;
  });

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryName = formProduct.categoryId ? productCategories.find((c) => c.id === formProduct.categoryId)?.name ?? formProduct.category : formProduct.category || "bureau";
    const unitName = formProduct.unitId ? unitsList.find((u) => u.id === formProduct.unitId)?.name ?? formProduct.unit : formProduct.unit || "pièce";
    const res = await fetch("/api/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formProduct.name, code: formProduct.code || undefined, barcode: formProduct.barcode || undefined,
        productType: formProduct.productType,
        category: categoryName, categoryId: formProduct.categoryId || undefined,
        unit: unitName, unitId: formProduct.unitId || undefined, minimumThreshold: formProduct.minimumThreshold,
        purchaseDate: formProduct.purchaseDate || undefined, quantity: formProduct.quantity,
        supplierId: formProduct.supplierId || undefined, invoiceNumber: formProduct.invoiceNumber || undefined,
      }),
    });
    if (res.ok) {
      setFormProduct({ name: "", code: "", barcode: "", productType: "equipment", categoryId: "", category: "", unitId: "", unit: "", minimumThreshold: 0, purchaseDate: "", quantity: 0, supplierId: "", invoiceNumber: "" });
      setTab("liste");
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert((err as { error?: string }).error || "Erreur");
    }
  };

  const addEntree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEntree.productId) {
      alert("Veuillez sélectionner un produit.");
      return;
    }
    const res = await fetch("/api/stock/entries", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formEntree, supplierId: formEntree.supplierId || undefined, supplier: formEntree.supplier || undefined,
      }),
    });
    if (res.ok) {
      setFormEntree({ productId: "", productSearch: "", quantity: 0, supplierId: "", supplier: "", invoiceNumber: "" });
      setTab("liste");
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert((err as { error?: string }).error || "Erreur");
    }
  };

  const addSortie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSortie.productId) {
      alert("Veuillez sélectionner un produit.");
      return;
    }
    const obs = formSortie.observationTypeId
      ? observationTypes.find((o) => o.id === formSortie.observationTypeId)?.label ?? formSortie.observation
      : formSortie.observation;
    const res = await fetch("/api/stock/exits", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: formSortie.productId,
        quantity: formSortie.quantity,
        employeeId: formSortie.employeeId || undefined,
        locationId: formSortie.locationId || undefined,
        observation: obs || undefined,
        purpose: formSortie.purpose || undefined,
      }),
    });
    if (res.ok) {
      setFormSortie({ productId: "", productSearch: "", quantity: 0, employeeId: "", employeeSearch: "", locationId: "", observation: "", observationTypeId: "", purpose: "" });
      setTab("liste");
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert((err as { error?: string }).error || "Erreur");
    }
  };

  const addDemande = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDemande.productId) { alert("Veuillez sélectionner un produit."); return; }
    if (!formDemande.toEmployeeId) { alert("Veuillez sélectionner le bénéficiaire."); return; }
    const res = await fetch("/api/transfer-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: formDemande.productId,
        quantity: formDemande.quantity,
        toEmployeeId: formDemande.toEmployeeId,
        locationId: formDemande.locationId || undefined,
        purpose: formDemande.purpose || undefined,
      }),
    });
    if (res.ok) {
      setFormDemande({ productId: "", productSearch: "", quantity: 0, toEmployeeId: "", toEmployeeSearch: "", locationId: "", purpose: "" });
      setTab("liste");
      load();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur");
    }
  };

  const categoryOptions = productCategories.length > 0 ? productCategories : [{ id: "", name: "bureau" }, { id: "entretien", name: "entretien" }, { id: "maintenance", name: "maintenance" }, { id: "pedago", name: "fournitures pédagogiques" }];
  const unitOptions = unitsList.length > 0 ? unitsList : [{ id: "", name: "pièce" }, { id: "box", name: "boîte" }, { id: "rame", name: "rame" }, { id: "litre", name: "litre" }, { id: "kg", name: "kg" }];

  const openEdit = async (productId: string) => {
    const res = await fetch(`/api/products/${productId}`);
    if (!res.ok) return;
    const p = await res.json();
    setEditForm({ name: p.name, code: p.code ?? "", barcode: p.barcode ?? "", productType: p.productType === "consumable" ? "consumable" : "equipment", category: p.category ?? "", unit: p.unit ?? "", minimumThreshold: p.minimumThreshold ?? 0 });
    setEditingProductId(productId);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;
    const res = await fetch(`/api/products/${editingProductId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm),
    });
    if (res.ok) { setEditingProductId(null); load(); } else { const err = await res.json(); alert(err.error || "Erreur"); }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Supprimer ce produit ? Les entrées et sorties associées seront aussi supprimées.")) return;
    const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    if (res.ok) { setEditingProductId(null); load(); } else { const err = await res.json(); alert(err.error || "Erreur"); }
  };

  const getStatusBadge = (b: BalanceItem) => {
    if (b.stockActuel <= 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Rupture</span>;
    if (b.minimumThreshold > 0 && b.stockActuel <= b.minimumThreshold) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Faible</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">En stock</span>;
  };

  if (status === "loading" || !isAdmin) return <div className="p-8 text-center text-slate-500">Chargement…</div>;

  const exportExcel = () => {
    window.open("/api/export/stock", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-title flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-xl">
            <Package className="w-7 h-7 text-primary-600" />
          </div>
          Stock
        </h1>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={exportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-sm shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Exporter Excel
            </button>
          )}
          <button type="button" onClick={() => setTab("liste")} className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm ${tab === "liste" ? "bg-primary-600 text-white shadow-primary-600/20" : "bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300"}`}>
            Stock actuel
          </button>
          {isAdmin && (
            <>
              <button type="button" onClick={() => setTab("produit")} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${tab === "produit" ? "bg-primary-600 text-white" : "bg-white border border-slate-200 hover:bg-slate-50"}`}>
                <Plus className="w-4 h-4" /> Nouveau produit
              </button>
              <button type="button" onClick={() => setTab("entree")} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${tab === "entree" ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 hover:bg-slate-50"}`}>
                <ArrowDownCircle className="w-4 h-4" /> Entrée
              </button>
              <button type="button" onClick={() => setTab("sortie")} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${tab === "sortie" ? "bg-amber-600 text-white" : "bg-white border border-slate-200 hover:bg-slate-50"}`}>
                <ArrowUpCircle className="w-4 h-4" /> Sortie
              </button>
            </>
          )}
          {!isAdmin && (
            <button type="button" onClick={() => setTab("demande")} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${tab === "demande" ? "bg-primary-600 text-white" : "bg-white border border-slate-200 hover:bg-slate-50"}`}>
              <Send className="w-4 h-4" /> Demander une sortie
            </button>
          )}
        </div>
      </div>

      {tab === "liste" && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, code ou code-barres…"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="en_stock">En stock</option>
                  <option value="faible">Faible</option>
                  <option value="rupture">Rupture</option>
                </select>
                <select
                  value={filterProductType}
                  onChange={(e) => setFilterProductType(e.target.value as typeof filterProductType)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="tous">Tous les types</option>
                  <option value="equipment">Équipement</option>
                  <option value="consumable">Consommable</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Toutes catégories</option>
                  {Array.from(new Set(balance.map((b) => b.category))).sort().map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="overflow-x-auto animate-pulse">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-4 font-semibold text-slate-700">Produit</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Type</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Code / Code-barres</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Catégorie</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Statut</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Entrées</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Sorties</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Stock actuel</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Seuil</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="p-4"><span className="block h-4 w-32 bg-slate-200 rounded" /></td>
                        <td className="p-4"><span className="block h-5 w-20 bg-slate-200 rounded-full" /></td>
                        <td className="p-4"><span className="block h-4 w-20 bg-slate-200 rounded" /></td>
                        <td className="p-4"><span className="block h-4 w-16 bg-slate-200 rounded" /></td>
                        <td className="p-4"><span className="block h-5 w-16 bg-slate-200 rounded-full" /></td>
                        <td className="p-4 text-right"><span className="inline-block h-4 w-8 bg-slate-200 rounded" /></td>
                        <td className="p-4 text-right"><span className="inline-block h-4 w-8 bg-slate-200 rounded" /></td>
                        <td className="p-4 text-right"><span className="inline-block h-4 w-8 bg-slate-200 rounded" /></td>
                        <td className="p-4 text-right"><span className="inline-block h-4 w-6 bg-slate-200 rounded" /></td>
                        <td className="p-4"><span className="block h-8 w-16 bg-slate-200 rounded" /></td>
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
                      <th className="text-left p-4 font-semibold text-slate-700">Produit</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Type</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Code / Code-barres</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Catégorie</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Statut</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Entrées</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Sorties</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Stock actuel</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Seuil</th>
                      {isAdmin && <th className="text-left p-4 font-semibold text-slate-700">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBalance.map((b) => (
                      <tr
                        key={b.id}
                        className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                          b.minimumThreshold > 0 && b.stockActuel <= b.minimumThreshold ? "bg-amber-50/50" : ""
                        }`}
                      >
                        <td className="p-4 font-medium text-slate-800">{b.name}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${(b as { productType?: string }).productType === "consumable" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>
                            {(b as { productType?: string }).productType === "consumable" ? "Consommable" : "Équipement"}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 text-xs">{[b.code, b.barcode].filter(Boolean).join(" · ") || "—"}</td>
                        <td className="p-4">{b.category}</td>
                        <td className="p-4">{getStatusBadge(b)}</td>
                        <td className="p-4 text-right text-emerald-600 font-medium">{b.totalEntrees}</td>
                        <td className="p-4 text-right text-amber-600 font-medium">{b.totalSorties}</td>
                        <td className="p-4 text-right font-semibold">{b.stockActuel}</td>
                        <td className="p-4 text-right">
                          {b.minimumThreshold > 0 && b.stockActuel <= b.minimumThreshold ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              <AlertTriangle className="w-4 h-4" /> {b.minimumThreshold}
                            </span>
                          ) : (
                            b.minimumThreshold || "—"
                          )}
                        </td>
                        {isAdmin && (
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => openEdit(b.id)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors" title="Modifier">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => deleteProduct(b.id)} className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors" title="Supprimer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && filteredBalance.length === 0 && (
              <div className="p-12 text-center text-slate-500">Aucun produit ne correspond aux filtres.</div>
            )}
          </div>
        </>
      )}

      {editingProductId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Modifier le produit</h2>
              <button type="button" onClick={() => setEditingProductId(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-600">Type de produit</label>
                <select value={editForm.productType} onChange={(e) => setEditForm({ ...editForm, productType: e.target.value as "equipment" | "consumable" })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="equipment">Équipement</option>
                  <option value="consumable">Consommable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Nom *</label>
                <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Code produit</label>
                  <input value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="ex. PROD-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Code-barres</label>
                  <input value={editForm.barcode} onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Scannable" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Catégorie</label>
                  <input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Unité</label>
                  <input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Seuil alerte</label>
                <input type="number" min={0} value={editForm.minimumThreshold} onChange={(e) => setEditForm({ ...editForm, minimumThreshold: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setEditingProductId(null)} className="px-4 py-2 rounded-lg border border-slate-300">Annuler</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tab === "produit" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-lg">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-slate-800">
            <Package className="w-5 h-5" /> Nouveau produit
          </h2>
          <form onSubmit={addProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">Type de produit *</label>
              <select value={formProduct.productType} onChange={(e) => setFormProduct({ ...formProduct, productType: e.target.value as "equipment" | "consumable" })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="equipment">Équipement (PC, bureau, matériel durable)</option>
                <option value="consumable">Consommable (papier, produits d'entretien)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600">Nom *</label>
                <input required value={formProduct.name} onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Code produit</label>
                <input value={formProduct.code} onChange={(e) => setFormProduct({ ...formProduct, code: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="ex. PROD-001" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Code-barres</label>
              <input value={formProduct.barcode} onChange={(e) => setFormProduct({ ...formProduct, barcode: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Scannable ou saisi" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600">Catégorie</label>
                <select value={formProduct.categoryId || formProduct.category} onChange={(e) => {
                  const v = e.target.value;
                  const cat = productCategories.find((c) => c.id === v) ?? categoryOptions.find((c) => (c.id || c.name) === v);
                  setFormProduct({ ...formProduct, categoryId: productCategories.some((c) => c.id === v) ? v : "", category: cat?.name ?? v });
                }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                  {categoryOptions.map((c) => (
                    <option key={c.id || c.name} value={c.id || c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Unité</label>
                <select value={formProduct.unitId || formProduct.unit} onChange={(e) => {
                  const v = e.target.value;
                  const u = unitsList.find((x) => x.id === v) ?? unitOptions.find((x) => (x.id || x.name) === v);
                  setFormProduct({ ...formProduct, unitId: unitsList.some((x) => x.id === v) ? v : "", unit: u?.name ?? v });
                }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                  {unitOptions.map((u) => (
                    <option key={u.id || u.name} value={u.id || u.name}>{u.name}{u.symbol ? ` (${u.symbol})` : ""}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Seuil alerte (stock bas)</label>
              <input type="number" min={0} value={formProduct.minimumThreshold} onChange={(e) => setFormProduct({ ...formProduct, minimumThreshold: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div className="border-t border-slate-200 pt-3 mt-3">
              <p className="text-sm font-medium text-slate-600 mb-2">Premier achat (optionnel)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500">Date d'achat</label>
                  <input type="date" value={formProduct.purchaseDate} onChange={(e) => setFormProduct({ ...formProduct, purchaseDate: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Quantité</label>
                  <input type="number" min={0} value={formProduct.quantity || ""} onChange={(e) => setFormProduct({ ...formProduct, quantity: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Fournisseur</label>
                  <select value={formProduct.supplierId} onChange={(e) => setFormProduct({ ...formProduct, supplierId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="">—</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">N° facture</label>
                  <input value={formProduct.invoiceNumber} onChange={(e) => setFormProduct({ ...formProduct, invoiceNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium">
              Ajouter le produit
            </button>
          </form>
        </div>
      )}

      {tab === "entree" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-md">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-emerald-700">
            <ArrowDownCircle className="w-5 h-5" /> Enregistrer une entrée (achat)
          </h2>
          <form onSubmit={addEntree} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">Produit *</label>
              <input
                required
                value={formEntree.productSearch}
                onChange={(e) => { setFormEntree({ ...formEntree, productSearch: e.target.value }); searchProducts(e.target.value); }}
                onFocus={() => formEntree.productSearch && searchProducts(formEntree.productSearch)}
                placeholder="Rechercher par nom, code ou code-barres…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              {productSearching && <p className="text-xs text-slate-500 mt-0.5">Recherche…</p>}
              {searchResultsForActions.length > 0 && (
                <ul className="mt-1 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {searchResultsForActions.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setFormEntree({ ...formEntree, productId: p.id, productSearch: `${p.name} ${p.code ?? ""} ${p.barcode ?? ""}`.trim() })}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                      >
                        {p.name} {p.code && <span className="text-slate-500">({p.code})</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {formEntree.productId && (
                <p className="text-xs text-emerald-600 mt-1">Produit sélectionné. <button type="button" onClick={() => setFormEntree({ ...formEntree, productId: "", productSearch: "" })} className="underline">Changer</button></p>
              )}
              {!formEntree.productId && productsForActions.length > 0 && (
                <select
                  value={formEntree.productId}
                  onChange={(e) => {
                    const p = productsForActions.find((x) => x.id === e.target.value);
                    setFormEntree({ ...formEntree, productId: e.target.value, productSearch: p ? `${p.name} (${p.unit})` : "" });
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">Ou choisir dans la liste…</option>
                  {productsForActions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Quantité *</label>
              <input required type="number" min={1} value={formEntree.quantity || ""} onChange={(e) => setFormEntree({ ...formEntree, quantity: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Fournisseur</label>
              <select value={formEntree.supplierId} onChange={(e) => setFormEntree({ ...formEntree, supplierId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">—</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <input value={formEntree.supplier} onChange={(e) => setFormEntree({ ...formEntree, supplier: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Ou saisie libre" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">N° facture</label>
              <input value={formEntree.invoiceNumber} onChange={(e) => setFormEntree({ ...formEntree, invoiceNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <button type="submit" className="w-full py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium">
              Enregistrer l'entrée
            </button>
          </form>
        </div>
      )}

      {tab === "sortie" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-md">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-amber-700">
            <ArrowUpCircle className="w-5 h-5" /> Enregistrer une sortie
          </h2>
          <form onSubmit={addSortie} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">Produit *</label>
              <input
                required
                value={formSortie.productSearch}
                onChange={(e) => { setFormSortie({ ...formSortie, productSearch: e.target.value }); searchProducts(e.target.value); }}
                onFocus={() => formSortie.productSearch && searchProducts(formSortie.productSearch)}
                placeholder="Rechercher par nom, code ou code-barres…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              {productSearching && <p className="text-xs text-slate-500 mt-0.5">Recherche…</p>}
              {searchResultsForActions.length > 0 && (
                <ul className="mt-1 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {searchResultsForActions.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setFormSortie({ ...formSortie, productId: p.id, productSearch: `${p.name} ${p.code ?? ""} ${p.barcode ?? ""}`.trim() })}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                      >
                        {p.name} {p.code && <span className="text-slate-500">({p.code})</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {formSortie.productId && (
                <p className="text-xs text-emerald-600 mt-1">Produit sélectionné. <button type="button" onClick={() => setFormSortie({ ...formSortie, productId: "", productSearch: "" })} className="underline">Changer</button></p>
              )}
              {!formSortie.productId && productsForActions.length > 0 && (
                <select value={formSortie.productId} onChange={(e) => {
                  const p = productsForActions.find((x) => x.id === e.target.value);
                  setFormSortie({ ...formSortie, productId: e.target.value, productSearch: p ? `${p.name} (${p.unit})` : "" });
                }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="">Ou choisir dans la liste…</option>
                  {productsForActions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Quantité *</label>
              <input required type="number" min={1} value={formSortie.quantity || ""} onChange={(e) => setFormSortie({ ...formSortie, quantity: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Bénéficiaire / Employé</label>
              <input
                value={formSortie.employeeSearch}
                onChange={(e) => { setFormSortie({ ...formSortie, employeeSearch: e.target.value }); searchEmployees(e.target.value); }}
                onFocus={() => formSortie.employeeSearch && searchEmployees(formSortie.employeeSearch)}
                placeholder="Rechercher un employé…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              {employeeSearchResults.length > 0 && (
                <ul className="mt-1 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-32 overflow-y-auto">
                  {employeeSearchResults.map((emp) => (
                    <li key={emp.id}>
                      <button type="button" onClick={() => setFormSortie({ ...formSortie, employeeId: emp.id, employeeSearch: emp.name })} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm">
                        {emp.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {formSortie.employeeId && <p className="text-xs text-emerald-600 mt-1">Employé sélectionné.</p>}
              <select value={formSortie.employeeId} onChange={(e) => setFormSortie({ ...formSortie, employeeId: e.target.value, employeeSearch: employees.find((x) => x.id === e.target.value)?.name ?? "" })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">Ou choisir…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Destination (Lieu / Bureau)</label>
              <select value={formSortie.locationId} onChange={(e) => setFormSortie({ ...formSortie, locationId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">— Choisir un lieu</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}{loc.officeNumber ? ` — ${loc.officeNumber}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Observation</label>
              <select value={formSortie.observationTypeId} onChange={(e) => setFormSortie({ ...formSortie, observationTypeId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">—</option>
                {observationTypes.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <input value={formSortie.observation} onChange={(e) => setFormSortie({ ...formSortie, observation: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Ou texte libre" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Motif supplémentaire</label>
              <input value={formSortie.purpose} onChange={(e) => setFormSortie({ ...formSortie, purpose: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="ex. Maintenance, urgence…" />
            </div>
            <button type="submit" className="w-full py-3 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium">
              Enregistrer la sortie
            </button>
          </form>
        </div>
      )}

      {tab === "demande" && !isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-md">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-primary-700">
            <Send className="w-5 h-5" /> Demander une sortie
          </h2>
          <p className="text-sm text-slate-600 mb-4">Votre demande sera validée par l&apos;administrateur. Une fois acceptée, la sortie sera enregistrée.</p>
          <form onSubmit={addDemande} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">Produit *</label>
              <input
                value={formDemande.productSearch}
                onChange={(e) => { setFormDemande({ ...formDemande, productSearch: e.target.value }); searchProducts(e.target.value); }}
                onFocus={() => formDemande.productSearch && searchProducts(formDemande.productSearch)}
                placeholder="Rechercher par nom, code ou code-barres…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              {productSearchResults.length > 0 && (
                <ul className="mt-1 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {productSearchResults.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => setFormDemande({ ...formDemande, productId: p.id, productSearch: `${p.name} ${p.code ?? ""} ${p.barcode ?? ""}`.trim() })} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm">
                        {p.name} {p.code && <span className="text-slate-500">({p.code})</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {formDemande.productId && <p className="text-xs text-emerald-600 mt-1">Produit sélectionné.</p>}
              <select value={formDemande.productId} onChange={(e) => { const p = products.find((x) => x.id === e.target.value); setFormDemande({ ...formDemande, productId: e.target.value, productSearch: p ? `${p.name} (${p.unit})` : "" }); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">Ou choisir…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Quantité *</label>
              <input required type="number" min={1} value={formDemande.quantity || ""} onChange={(e) => setFormDemande({ ...formDemande, quantity: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Bénéficiaire (employé) *</label>
              <input value={formDemande.toEmployeeSearch} onChange={(e) => { setFormDemande({ ...formDemande, toEmployeeSearch: e.target.value }); searchEmployees(e.target.value); }} onFocus={() => formDemande.toEmployeeSearch && searchEmployees(formDemande.toEmployeeSearch)} placeholder="Rechercher un employé…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              {employeeSearchResults.length > 0 && (
                <ul className="mt-1 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-32 overflow-y-auto">
                  {employeeSearchResults.map((emp) => (
                    <li key={emp.id}>
                      <button type="button" onClick={() => setFormDemande({ ...formDemande, toEmployeeId: emp.id, toEmployeeSearch: emp.name })} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm">{emp.name}</button>
                    </li>
                  ))}
                </ul>
              )}
              <select value={formDemande.toEmployeeId} onChange={(e) => setFormDemande({ ...formDemande, toEmployeeId: e.target.value, toEmployeeSearch: employees.find((x) => x.id === e.target.value)?.name ?? "" })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">Choisir un employé…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Destination (Lieu / Bureau)</label>
              <select value={formDemande.locationId} onChange={(e) => setFormDemande({ ...formDemande, locationId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">—</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}{loc.officeNumber ? ` — ${loc.officeNumber}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Motif</label>
              <input value={formDemande.purpose} onChange={(e) => setFormDemande({ ...formDemande, purpose: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Optionnel" />
            </div>
            <button type="submit" className="w-full py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium">
              Envoyer la demande
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
