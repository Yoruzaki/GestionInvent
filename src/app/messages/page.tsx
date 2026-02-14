"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, AlertCircle } from "lucide-react";

type User = { id: string; name: string; email: string; role?: string };
type Message = {
  id: string;
  subject: string;
  body: string;
  isComplaint: boolean;
  read: boolean;
  createdAt: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
  replies?: Message[];
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [form, setForm] = useState({ toUserId: "", subject: "", body: "", isComplaint: false });
  const [sending, setSending] = useState(false);

  const loadMessages = () => {
    fetch(`/api/messages?folder=${folder}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: { messages?: Message[] }) => setMessages(Array.isArray(data.messages) ? data.messages : []))
      .finally(() => setLoading(false));
  };

  const loadUsers = () => {
    fetch("/api/users/messagable")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: User[]) => setUsers(Array.isArray(list) ? list : []));
  };

  useEffect(() => {
    loadMessages();
  }, [folder]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetch(`/api/messages/${selectedId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setSelectedMsg);
    } else {
      setSelectedMsg(null);
    }
  }, [selectedId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.toUserId || !form.subject || !form.body) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUserId: form.toUserId,
        subject: form.subject,
        body: form.body,
        isComplaint: form.isComplaint,
      }),
    });
    setSending(false);
    if (res.ok) {
      setForm({ toUserId: "", subject: "", body: "", isComplaint: false });
      setComposeOpen(false);
      loadMessages();
    } else {
      const err = await res.json().catch(() => ({}));
      alert((err as { error?: string }).error || "Erreur");
    }
  };

  const formatDate = (s: string) => new Date(s).toLocaleString("fr-FR");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-title flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-xl">
            <MessageCircle className="w-7 h-7 text-primary-600" />
          </div>
          Messages
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setComposeOpen(!composeOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium text-sm"
          >
            <Send className="w-4 h-4" /> Nouveau message
          </button>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setFolder("inbox")}
              className={`px-4 py-2 text-sm font-medium ${folder === "inbox" ? "bg-primary-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              Reçus
            </button>
            <button
              type="button"
              onClick={() => setFolder("sent")}
              className={`px-4 py-2 text-sm font-medium ${folder === "sent" ? "bg-primary-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              Envoyés
            </button>
          </div>
        </div>
      </div>

      {composeOpen && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-lg">
          <h2 className="font-semibold mb-4">Nouveau message</h2>
          <form onSubmit={sendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Destinataire *</label>
              <select
                required
                value={form.toUserId}
                onChange={(e) => setForm({ ...form, toUserId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Choisir…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) — {u.role === "admin" ? "Admin" : "Employé"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Sujet *</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Objet du message"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-1">
                <AlertCircle className="w-4 h-4" />
                <input
                  type="checkbox"
                  checked={form.isComplaint}
                  onChange={(e) => setForm({ ...form, isComplaint: e.target.checked })}
                  className="rounded"
                />
                C&apos;est une plainte / réclamation
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Message *</label>
              <textarea
                required
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Votre message…"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={sending} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium disabled:opacity-50">
                Envoyer
              </button>
              <button type="button" onClick={() => setComposeOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-1">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Chargement…</div>
          ) : messages.length === 0 ? (
            <div className="p-6 text-center text-slate-500">Aucun message</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {messages.map((m) => (
                <li
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedId === m.id ? "bg-primary-50" : ""} ${!m.read && folder === "inbox" ? "border-l-4 border-l-primary-500" : ""}`}
                >
                  <p className="font-medium text-slate-800 truncate">{m.subject}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {folder === "inbox" ? (m.fromUser as { name?: string })?.name : (m.toUser as { name?: string })?.name} • {formatDate(m.createdAt)}
                  </p>
                  {m.isComplaint && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">Plainte</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2">
          {selectedMsg ? (
            <div className="p-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg font-semibold text-slate-800">{selectedMsg.subject}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  De {(selectedMsg.fromUser as { name?: string })?.name} → {(selectedMsg.toUser as { name?: string })?.name} • {formatDate(selectedMsg.createdAt)}
                </p>
                {selectedMsg.isComplaint && (
                  <span className="inline-flex items-center gap-1 mt-2 text-sm px-2 py-1 rounded bg-amber-100 text-amber-800">
                    <AlertCircle className="w-4 h-4" /> Plainte
                  </span>
                )}
              </div>
              <div className="py-4 text-slate-700 whitespace-pre-wrap">{selectedMsg.body}</div>
              {selectedMsg.replies && selectedMsg.replies.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium text-slate-800">Réponses</h3>
                  {selectedMsg.replies.map((r) => (
                    <div key={r.id} className="pl-4 border-l-2 border-slate-200 py-2">
                      <p className="text-sm font-medium text-slate-600">{(r.fromUser as { name?: string })?.name} • {formatDate(r.createdAt)}</p>
                      <p className="text-slate-700 whitespace-pre-wrap mt-1">{r.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">Sélectionnez un message</div>
          )}
        </div>
      </div>
    </div>
  );
}
