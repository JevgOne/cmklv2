"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ProfileFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    phone: string;
    avatar: string | null;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();

  // Profile state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [phone, setPhone] = useState(initialData.phone);
  const [avatar, setAvatar] = useState(initialData.avatar);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "avatar");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatar(data.url);
      }
    } catch {
      // silently fail
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (firstName.trim().length < 2) {
      setError("Jméno musí mít alespoň 2 znaky.");
      return;
    }
    if (lastName.trim().length < 2) {
      setError("Příjmení musí mít alespoň 2 znaky.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || null,
          avatar,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Chyba při ukládání");
        return;
      }

      setSuccess(true);
      await updateSession();
      router.refresh();
    } catch {
      setError("Nepodařilo se uložit změny");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (newPassword.length < 8) {
      setPwError("Nové heslo musí mít alespoň 8 znaků.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Hesla se neshodují.");
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPwError(data.error || "Chyba při změně hesla");
        return;
      }

      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPwError("Nepodařilo se změnit heslo");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile form */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upravit údaje</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
              Profil byl úspěšně aktualizován.
            </div>
          )}

          {/* Avatar upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Profilová fotka
            </label>
            <div className="flex items-center gap-4">
              {avatar ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={avatar}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: "var(--gradient-orange)" }}
                >
                  {firstName[0] || ""}{lastName[0] || ""}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? "Nahrávám..." : "Nahrát fotku"}
                </Button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Odstranit
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Jméno
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Příjmení
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Telefon
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="+420 xxx xxx xxx"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Ukládám..." : "Uložit změny"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Password change */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Změna hesla</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {pwError && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
              Heslo bylo úspěšně změněno.
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Současné heslo
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nové heslo
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
              minLength={8}
              placeholder="Min. 8 znaků"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Potvrzení hesla
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
              minLength={8}
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Button
              type="submit"
              variant="outline"
              disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
            >
              {pwSaving ? "Měním heslo..." : "Změnit heslo"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
