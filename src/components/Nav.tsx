"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Activity,
  FileBarChart,
  Settings,
  LogOut,
  Send,
  ChevronDown,
  User,
  Mail,
  Shield,
  Menu,
} from "lucide-react";

const INSTITUTION_NAME = "HNSF — Higher National School of Forests";

const adminLinks = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/mouvements", label: "Mouvements", icon: Activity },
  { href: "/rapports", label: "Rapports", icon: FileBarChart },
  { href: "/parametres", label: "Paramètres", icon: Settings },
  { href: "/demandes", label: "Demandes à valider", icon: Send },
];

const userLinks = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/mon-equipement", label: "Mon équipement", icon: Package },
  { href: "/mes-demandes", label: "Mes demandes", icon: Send },
];

function AccountDropdown() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session?.user) return null;

  const role = (session.user as { role?: string }).role;
  const allowedTypes = (session.user as { allowedProductTypes?: string }).allowedProductTypes;
  const roleLabel = role === "admin" ? (allowedTypes ? `Admin (${allowedTypes === "equipment" ? "Équipements" : allowedTypes === "consumable" ? "Consommables" : "Tous types"})` : "Super Admin") : "Employé";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-primary-100 hover:bg-primary-600/80 hover:text-white transition-colors"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-primary-500/30 flex items-center justify-center shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div className="hidden sm:block text-left">
          <span className="font-medium block truncate max-w-[140px]">{session.user.name}</span>
          <span className="text-xs text-primary-200 truncate block max-w-[140px]">{session.user.email}</span>
        </div>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-800 truncate">{session.user.name}</p>
            <p className="text-sm text-slate-500 truncate flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 shrink-0" /> {session.user.email}
            </p>
            <p className="text-xs mt-1.5 flex items-center gap-1 text-slate-600 bg-slate-100 rounded-md px-2 py-1 w-fit">
              <Shield className="w-3.5 h-3.5" /> {roleLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 text-sm"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const links = role === "admin" ? adminLinks : userLinks;

  return (
    <nav className="bg-gradient-to-r from-primary-800 to-primary-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shrink-0 ring-2 ring-white/20">
                <Image src="/Logo.png" alt="HNSF" width={40} height={40} className="object-contain" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg leading-tight block">{INSTITUTION_NAME}</span>
                <span className="text-primary-200 text-xs font-medium">Inventaire</span>
              </div>
              <span className="sm:hidden font-semibold">HNSF</span>
            </Link>
            <div className="hidden md:flex gap-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === href
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-primary-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden flex gap-1 overflow-x-auto pb-1 max-w-[200px]">
              {!mobileMenuOpen &&
                links.slice(0, 3).map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                      pathname === href ? "bg-white/20" : "text-primary-100 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                ))}
            </div>
            <AccountDropdown />
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary-600/50">
            <div className="flex flex-col gap-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
                    pathname === href ? "bg-white/20" : "text-primary-100 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
