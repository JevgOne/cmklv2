"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  phone: string | null;
  createdAt: string;
}

const ROLES = [
  "ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR", "BROKER",
  "ADVERTISER", "BUYER", "PARTS_SUPPLIER", "WHOLESALE_SUPPLIER",
  "INVESTOR", "VERIFIED_DEALER", "PARTNER_BAZAR", "PARTNER_VRAKOVISTE",
];

const STATUS_MAP: Record<string, { label: string; variant: "success" | "pending" | "rejected" }> = {
  ACTIVE: { label: "Aktivní", variant: "success" },
  PENDING: { label: "Čeká", variant: "pending" },
  ONBOARDING: { label: "Onboarding", variant: "pending" },
  SUSPENDED: { label: "Blokován", variant: "rejected" },
  INACTIVE: { label: "Neaktivní", variant: "rejected" },
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  BACKOFFICE: "BackOffice",
  MANAGER: "Manažer",
  REGIONAL_DIRECTOR: "Reg. ředitel",
  BROKER: "Makléř",
  ADVERTISER: "Inzerent",
  BUYER: "Kupující",
  PARTS_SUPPLIER: "Dodavatel dílů",
  WHOLESALE_SUPPLIER: "Velkoobchod",
  INVESTOR: "Investor",
  VERIFIED_DEALER: "Dealer",
  PARTNER_BAZAR: "Partner bazar",
  PARTNER_VRAKOVISTE: "Partner vrakoviště",
};

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = async (userId: string, field: string, value: string) => {
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, [field]: value }),
      });
      fetchUsers();
      setEditingUser(null);
    } catch {
      // ignore
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Opravdu smazat uživatele "${userName}"? Tuto akci nelze vrátit.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Nepodařilo se smazat uživatele");
      }
    } catch {
      alert("Chyba spojení");
    }
  };

  const resetPassword = async (userId: string) => {
    if (newPassword.length < 6) {
      setPwMsg("Heslo musí mít alespoň 6 znaků");
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        setPwMsg("Heslo změněno!");
        setNewPassword("");
        setTimeout(() => { setResetPasswordUser(null); setPwMsg(""); }, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setPwMsg(data.error || "Chyba");
      }
    } catch {
      setPwMsg("Chyba spojení");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900">Uživatelé</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Uživatelé</h1>
        </div>
        <div className="text-sm text-gray-500">{users.length} uživatelů</div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Hledat jméno nebo email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Všechny role</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-3 font-semibold text-gray-600">Jméno</th>
                <th className="text-left p-3 font-semibold text-gray-600">Email</th>
                <th className="text-left p-3 font-semibold text-gray-600">Role</th>
                <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                <th className="text-left p-3 font-semibold text-gray-600">Registrace</th>
                {isAdmin && <th className="text-left p-3 font-semibold text-gray-600">Akce</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-gray-400">
                    Načítám...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-gray-400">
                    Žádní uživatelé nenalezeni.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const statusInfo = STATUS_MAP[user.status] || { label: user.status, variant: "pending" as const };
                  const isEditing = editingUser === user.id;

                  return (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        )}
                      </td>
                      <td className="p-3 text-gray-600">{user.email}</td>
                      <td className="p-3">
                        {isAdmin && isEditing ? (
                          <select
                            defaultValue={user.role}
                            onChange={(e) => updateUser(user.id, "role", e.target.value)}
                            className="h-8 px-2 text-xs rounded border border-gray-200 bg-white"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString("cs-CZ")}
                      </td>
                      {isAdmin && (
                        <td className="p-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                              {isEditing ? (
                                <button
                                  onClick={() => setEditingUser(null)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg>
                                  Hotovo
                                </button>
                              ) : (
                                <button
                                  onClick={() => setEditingUser(user.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" /><path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" /></svg>
                                  Upravit
                                </button>
                              )}
                              {user.status === "ACTIVE" ? (
                                <button
                                  onClick={() => updateUser(user.id, "status", "SUSPENDED")}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M4.5 7a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7Z" /></svg>
                                  Blokovat
                                </button>
                              ) : user.status === "SUSPENDED" ? (
                                <button
                                  onClick={() => updateUser(user.id, "status", "ACTIVE")}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg>
                                  Aktivovat
                                </button>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setResetPasswordUser(resetPasswordUser === user.id ? null : user.id);
                                  setNewPassword("");
                                  setPwMsg("");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" /></svg>
                                Heslo
                              </button>
                              <button
                                onClick={() => deleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.712Z" clipRule="evenodd" /></svg>
                                Smazat
                              </button>
                            </div>
                            {resetPasswordUser === user.id && (
                              <div className="flex items-center gap-1.5 mt-1 p-2 bg-blue-50 rounded-lg">
                                <input
                                  type="text"
                                  placeholder="Nové heslo"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="h-7 px-2 text-xs rounded-md border border-blue-200 w-28 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                                />
                                <button
                                  onClick={() => resetPassword(user.id)}
                                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                                >
                                  Uložit
                                </button>
                                {pwMsg && (
                                  <span className={`text-xs font-medium ${pwMsg.includes("změněno") ? "text-emerald-600" : "text-red-500"}`}>
                                    {pwMsg}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
