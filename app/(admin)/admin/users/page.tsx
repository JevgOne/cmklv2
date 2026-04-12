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
                          <div className="flex gap-1">
                            {isEditing ? (
                              <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>
                                Hotovo
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setEditingUser(user.id)}>
                                Upravit
                              </Button>
                            )}
                            {user.status === "ACTIVE" ? (
                              <Button size="sm" variant="ghost" onClick={() => updateUser(user.id, "status", "SUSPENDED")}>
                                Blokovat
                              </Button>
                            ) : user.status === "SUSPENDED" ? (
                              <Button size="sm" variant="ghost" onClick={() => updateUser(user.id, "status", "ACTIVE")}>
                                Aktivovat
                              </Button>
                            ) : null}
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
