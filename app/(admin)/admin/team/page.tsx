"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  position: string;
  bio: string;
  photoUrl: string | null;
  order: number;
  isPublic: boolean;
}

const EMPTY_FORM = {
  name: "",
  initials: "",
  position: "",
  bio: "",
  photoUrl: "",
  order: 0,
  isPublic: true,
};

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/team");
      if (res.ok) setMembers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  function startEdit(member: TeamMember) {
    setEditing(member.id);
    setForm({
      name: member.name,
      initials: member.initials,
      position: member.position,
      bio: member.bio,
      photoUrl: member.photoUrl || "",
      order: member.order,
      isPublic: member.isPublic,
    });
    setError("");
  }

  function startAdd() {
    setEditing("new");
    setForm({ ...EMPTY_FORM, order: members.length });
    setError("");
  }

  function cancelEdit() {
    setEditing(null);
    setError("");
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "team");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Chyba při nahrávání fotky");
        return;
      }
      const { url } = await res.json();
      setForm((prev) => ({ ...prev, photoUrl: url }));
    } catch {
      setError("Chyba při nahrávání fotky");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        photoUrl: form.photoUrl || null,
      };
      const url =
        editing === "new" ? "/api/admin/team" : `/api/admin/team/${editing}`;
      const method = editing === "new" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Chyba při ukládání");
        return;
      }
      setEditing(null);
      fetchMembers();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu smazat tohoto člena týmu?")) return;
    await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
    fetchMembers();
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    const idx = members.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= members.length) return;

    const a = members[idx];
    const b = members[swapIdx];
    await Promise.all([
      fetch(`/api/admin/team/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: b.order }),
      }),
      fetch(`/api/admin/team/${b.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: a.order }),
      }),
    ]);
    fetchMembers();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-extrabold text-gray-900">
            Správa týmu
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Členové týmu zobrazení na stránce O nás
          </p>
        </div>
        <Button variant="primary" onClick={startAdd}>
          + Přidat člena
        </Button>
      </div>

      {/* Edit / Add form */}
      {editing && (
        <Card className="p-6 mb-6 border-2 border-orange-200">
          <h2 className="font-bold text-lg text-gray-900 mb-4">
            {editing === "new" ? "Nový člen týmu" : "Upravit člena"}
          </h2>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jméno *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Jan Novák"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Iniciály *
              </label>
              <input
                type="text"
                value={form.initials}
                onChange={(e) =>
                  setForm({ ...form, initials: e.target.value.toUpperCase().slice(0, 4) })
                }
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="JN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pozice *
              </label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="CEO & CTO"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fotka
              </label>
              <div className="flex items-center gap-3">
                {form.photoUrl && (
                  <img
                    src={form.photoUrl}
                    alt="Náhled"
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 disabled:opacity-50"
                  />
                  {uploading && (
                    <p className="text-xs text-orange-500 mt-1">Nahrávám...</p>
                  )}
                  {form.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, photoUrl: "" })}
                      className="text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                      Odebrat fotku
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio *
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Krátký popis role a odpovědností..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pořadí
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: parseInt(e.target.value) || 0 })
                }
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isPublic"
                checked={form.isPublic}
                onChange={(e) =>
                  setForm({ ...form, isPublic: e.target.checked })
                }
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Veřejný (zobrazit na webu)
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Ukládám..." : "Uložit"}
            </Button>
            <Button variant="secondary" onClick={cancelEdit}>
              Zrušit
            </Button>
          </div>
        </Card>
      )}

      {/* Team members list */}
      {members.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Žádní členové týmu
          </h3>
          <p className="text-sm text-gray-500">
            Přidejte prvního člena týmu kliknutím na tlačítko výše.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((member, idx) => (
            <Card key={member.id} className="p-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <img
                  src={member.photoUrl || "/brand/default-avatar.png"}
                  alt={member.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{member.name}</h3>
                    {!member.isPublic && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Skrytý
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-orange-500 font-semibold">
                    {member.position}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {member.bio}
                  </p>
                </div>

                {/* Order controls */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleReorder(member.id, "up")}
                    disabled={idx === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    &#9650;
                  </button>
                  <span className="text-xs text-gray-400 text-center">
                    {member.order}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleReorder(member.id, "down")}
                    disabled={idx === members.length - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    &#9660;
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(member)}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    Upravit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(member.id)}
                    className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
