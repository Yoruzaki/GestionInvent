"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Package, Activity, FileBarChart, Settings, LogOut, Send } from "lucide-react";

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

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const links = role === "admin" ? adminLinks : userLinks;

  return (
    <nav className="bg-primary-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === href ? "bg-primary-600 text-white" : "text-primary-100 hover:bg-primary-600/80 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden flex gap-1 overflow-x-auto pb-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium shrink-0 ${
                    pathname === href ? "bg-primary-600" : "text-primary-100 hover:bg-primary-600/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-primary-100 hover:bg-primary-600/80 hover:text-white"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
