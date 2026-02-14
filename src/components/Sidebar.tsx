"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSidebar } from "./SidebarContext";
import {
  LayoutDashboard,
  Package,
  Activity,
  FileBarChart,
  Settings,
  LogOut,
  Send,
  User,
  Mail,
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  MessageCircle,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";

const INSTITUTION_NAME = "HNSF";
const INSTITUTION_SUBTITLE = "Inventaire";

const adminLinks = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/mouvements", label: "Mouvements", icon: Activity },
  { href: "/rapports", label: "Rapports", icon: FileBarChart },
  { href: "/parametres", label: "Paramètres", icon: Settings },
  { href: "/demandes", label: "Demandes", icon: Send },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const userLinks = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/mon-equipement", label: "Mon équipement", icon: Package },
  { href: "/mes-demandes", label: "Mes demandes", icon: Send },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, setCollapsed } = useSidebar();

  const role = (session?.user as { role?: string } | undefined)?.role;
  const links = role === "admin" ? adminLinks : userLinks;

  const allowedTypes = (session?.user as { allowedProductTypes?: string })?.allowedProductTypes;
  const roleLabel =
    role === "admin"
      ? allowedTypes
        ? allowedTypes === "equipment"
          ? "Équipements"
          : allowedTypes === "consumable"
            ? "Consommables"
            : "Tous types"
        : "Super Admin"
      : "Employé";

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-slate-200/80 shrink-0 ${collapsed ? "justify-center px-0" : ""}`}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 ring-1 ring-primary-500/20">
              <Image src="/Logo.png" alt="HNSF" width={32} height={32} className="object-contain" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 block truncate">{INSTITUTION_NAME}</span>
              <span className="text-xs text-slate-500 font-medium block">{INSTITUTION_SUBTITLE}</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-500/10 shrink-0">
            <Image src="/Logo.png" alt="HNSF" width={28} height={28} className="object-contain" />
          </Link>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? "bg-primary-500/10 text-primary-700 border border-primary-500/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-transparent"
                }
                ${collapsed ? "justify-center px-2" : ""}
              `}
              title={collapsed ? label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary-600" : "text-slate-500"}`} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Notifications & Messages */}
      {session?.user && !collapsed && (
        <div className="px-3 py-2 border-t border-slate-200/80">
          <NotificationBell />
        </div>
      )}

      {/* Account section */}
      {session?.user && (
        <div className={`border-t border-slate-200/80 p-3 shrink-0 ${collapsed ? "px-2" : ""}`}>
          <div
            className={`
              rounded-xl p-3 bg-slate-50/80
              ${collapsed ? "flex flex-col items-center" : ""}
            `}
          >
            {!collapsed ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm truncate">{session.user.name}</p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 shrink-0" /> {session.user.email}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 bg-white/60 rounded-lg px-2 py-1 w-fit">
                  <Shield className="w-3.5 h-3.5" /> {roleLabel}
                </p>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collapse toggle - desktop only */}
      <div className="hidden lg:flex border-t border-slate-200/80 p-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-sm font-medium transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white/95 backdrop-blur-md border-r border-slate-200/80
          flex flex-col shadow-sidebar
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {mobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:bg-slate-100 z-10"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <NavContent />
      </aside>
    </>
  );
}
