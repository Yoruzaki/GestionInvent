"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Bell, MessageCircle } from "lucide-react";

type Notification = { id: string; type: string; title: string; message: string; read: boolean; relatedId?: string; createdAt: string };

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user) return;
    const fetchNotif = () => {
      fetch("/api/notifications?unread=true")
        .then((r) => (r.ok ? r.json() : {}))
        .then((data: { notifications?: Notification[]; unreadCount?: number }) => {
          setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
          setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
        })
        .catch(() => {});
    };
    fetchNotif();
    const t = setInterval(fetchNotif, 30000);
    return () => clearInterval(t);
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/messages?folder=inbox&unread=true")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: { unreadCount?: number }) => setMessagesUnread(typeof data.unreadCount === "number" ? data.unreadCount : 0))
      .catch(() => {});
    const t = setInterval(() => {
      fetch("/api/messages?folder=inbox")
        .then((r) => (r.ok ? r.json() : {}))
        .then((data: { unreadCount?: number }) => setMessagesUnread(typeof data.unreadCount === "number" ? data.unreadCount : 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [session?.user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session?.user) return null;

  const totalUnread = unreadCount + messagesUnread;
  const markRead = (id: string) => {
    fetch(`/api/notifications/${id}`, { method: "PATCH" }).then(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  };

  const formatDate = (s: string) => {
    const d = new Date(s);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    return d.toLocaleDateString("fr-FR");
  };

  return (
    <div className="relative flex items-center gap-1" ref={ref}>
      <Link
        href="/messages"
        className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        title="Messages"
      >
        <MessageCircle className="w-5 h-5" />
        {messagesUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center px-1">
            {messagesUnread > 99 ? "99+" : messagesUnread}
          </span>
        )}
      </Link>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 w-80 max-h-96 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    fetch("/api/notifications/read-all", { method: "POST" }).then(() => {
                      setUnreadCount(0);
                      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                    });
                  }}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Tout marquer lu
                </button>
              )}
            </div>
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">Aucune notification</div>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer ${
                      !n.read ? "bg-primary-50/50" : ""
                    }`}
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                      if (n.type.startsWith("transfer_request") && n.relatedId) {
                        window.location.href = "/demandes";
                      }
                      if ((n.type === "message" || n.type === "complaint") && n.relatedId) {
                        window.location.href = "/messages";
                      }
                      if ((n.type === "stock_low" || n.type === "stock_rupture") && n.relatedId) {
                        window.location.href = "/stock";
                      }
                      setOpen(false);
                    }}
                  >
                    <p className="font-medium text-slate-800 text-sm">{n.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-center text-sm font-medium text-primary-600 hover:bg-slate-50"
            >
              Voir toutes les notifications
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
