"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
};

export default function NotificationsPage() {
  const [list, setList] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = () => {
    setLoading(true);
    const url = filter === "unread" ? "/api/notifications?unread=true" : "/api/notifications";
    fetch(url)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: { notifications?: Notification[]; unreadCount?: number }) => {
        setList(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const markRead = (id: string) => {
    fetch(`/api/notifications/${id}`, { method: "PATCH" }).then(() => load());
  };

  const markAllRead = () => {
    fetch("/api/notifications/read-all", { method: "POST" }).then(() => load());
  };

  const formatDate = (s: string) => new Date(s).toLocaleString("fr-FR");

  const getTypeLabel = (type: string): string => {
    if (type === "transfer_request_approved") return "Accepté";
    if (type === "transfer_request_rejected") return "Refusé";
    if (type === "transfer_request_new") return "Nouvelle demande";
    if (type === "message") return "Message";
    if (type === "complaint") return "Plainte";
    if (type === "stock_low") return "Stock bas";
    if (type === "stock_rupture") return "Rupture";
    return type;
  };

  const getTypeColor = (type: string) => {
    if (type === "transfer_request_approved") return "bg-emerald-100 text-emerald-800";
    if (type === "transfer_request_rejected") return "bg-rose-100 text-rose-800";
    if (type === "transfer_request_new") return "bg-blue-100 text-blue-800";
    if (type === "complaint") return "bg-amber-100 text-amber-800";
    if (type === "stock_low") return "bg-amber-100 text-amber-800";
    if (type === "stock_rupture") return "bg-rose-100 text-rose-800";
    return "bg-slate-100 text-slate-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-title flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-xl">
            <Bell className="w-7 h-7 text-primary-600" />
          </div>
          Notifications
        </h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "unread")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Toutes</option>
            <option value="unread">Non lues</option>
          </select>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium"
            >
              <CheckCheck className="w-4 h-4" /> Tout marquer lu
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Chargement…</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Aucune notification</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((n) => (
              <li
                key={n.id}
                className={`px-4 py-4 hover:bg-slate-50/50 transition-colors ${!n.read ? "bg-primary-50/30" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(n.type)}`}>
                        {getTypeLabel(n.type)}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1">{n.message}</p>
                    <p className="text-slate-400 text-xs mt-2">{formatDate(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                      title="Marquer comme lu"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
