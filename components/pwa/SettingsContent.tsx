"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";

interface SettingsContentProps {
  email: string;
  ico: string;
  bankAccount: string;
  quickModeEnabled: boolean;
  userLevel?: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
}

export function SettingsContent({
  email,
  ico,
  bankAccount,
  quickModeEnabled: initialQuickMode,
  userLevel,
  firstName,
  lastName,
  phone,
  avatar,
}: SettingsContentProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bankAccountValue, setBankAccountValue] = useState(bankAccount);
  const [quickMode, setQuickMode] = useState(initialQuickMode);
  const [saving, setSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [bankMessage, setBankMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleExportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `carmakler-data-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      // silent
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Opravdu chcete požádat o smazání účtu? Tato akce je nevratná.")) return;
    setDeletingAccount(true);
    setDeleteMessage(null);
    try {
      const res = await fetch("/api/settings/delete-account", { method: "POST" });
      if (res.ok) {
        setDeleteMessage({
          type: "success",
          text: "Žádost o smazání účtu byla odeslána. Budeme vás kontaktovat.",
        });
      } else {
        const data = await res.json();
        setDeleteMessage({
          type: "error",
          text: data.error || "Nepodařilo se odeslat žádost",
        });
      }
    } catch {
      setDeleteMessage({ type: "error", text: "Chyba serveru" });
    } finally {
      setDeletingAccount(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Nové heslo musí mít alespoň 8 znaků",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Hesla se neshodují" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      if (res.ok) {
        setPasswordMessage({
          type: "success",
          text: "Heslo bylo úspěšně změněno",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setPasswordMessage({
          type: "error",
          text: data.error || "Nepodařilo se změnit heslo",
        });
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Chyba serveru" });
    } finally {
      setSaving(false);
    }
  }

  async function handleBankAccountSave() {
    setBankMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/settings/bank-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankAccount: bankAccountValue }),
      });
      if (res.ok) {
        setBankMessage({
          type: "success",
          text: "Bankovní účet byl aktualizován",
        });
      } else {
        const data = await res.json();
        setBankMessage({
          type: "error",
          text: data.error || "Nepodařilo se uložit",
        });
      }
    } catch {
      setBankMessage({ type: "error", text: "Chyba serveru" });
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickModeToggle(value: boolean) {
    setQuickMode(value);
    try {
      const res = await fetch("/api/profile/quick-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quickModeEnabled: value }),
      });
      if (!res.ok) {
        setQuickMode(!value);
      }
    } catch {
      setQuickMode(!value);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profil — readonly */}
      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Účet</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Email</label>
            <div className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-3 py-2 mt-1">
              {email}
            </div>
          </div>
          {ico && (
            <div>
              <label className="text-xs text-gray-500">IČO</label>
              <div className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-3 py-2 mt-1">
                {ico}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Změna hesla */}
      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Změna hesla</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <Input
            label="Současné heslo"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="Nové heslo"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimálně 8 znaků"
            required
          />
          <Input
            label="Potvrzení hesla"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Zopakujte nové heslo"
            required
          />
          {passwordMessage && (
            <div
              className={`text-sm px-3 py-2 rounded-lg ${
                passwordMessage.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {passwordMessage.text}
            </div>
          )}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Ukládám..." : "Změnit heslo"}
          </Button>
        </form>
      </Card>

      {/* Bankovní účet */}
      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Bankovní účet pro výplatu provizí
        </h2>
        <div className="space-y-3">
          <Input
            label="IBAN / Číslo účtu"
            value={bankAccountValue}
            onChange={(e) => setBankAccountValue(e.target.value)}
            placeholder="CZ6508000000001234567890 nebo 123456/0800"
          />
          {bankMessage && (
            <div
              className={`text-sm px-3 py-2 rounded-lg ${
                bankMessage.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {bankMessage.text}
            </div>
          )}
          <Button
            size="sm"
            onClick={handleBankAccountSave}
            disabled={saving || bankAccountValue === bankAccount}
          >
            Uložit
          </Button>
        </div>
      </Card>

      {/* Rychlý režim */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Rychlý režim</h2>
            {userLevel === "STAR_1" ? (
              <p className="text-sm text-orange-600">
                Dostupné od úrovně ⭐⭐
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Zjednodušený 3-krokový flow pro rychlé zadání vozidla
              </p>
            )}
          </div>
          <Toggle
            checked={quickMode}
            onChange={handleQuickModeToggle}
            disabled={userLevel === "STAR_1"}
          />
        </div>
      </Card>

      {/* Blog — moje články */}
      <Link href="/makler/blog">
        <Card className="p-5 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Moje články
              </h2>
              <p className="text-sm text-gray-500">
                Psaní a správa blog článků
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
        </Card>
      </Link>

      {/* Nastavení notifikací */}
      <Link href="/makler/settings/notifications">
        <Card className="p-5 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Nastavení notifikací
              </h2>
              <p className="text-sm text-gray-500">
                Push, email a SMS notifikace
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
        </Card>
      </Link>

      {/* Podpis pro emaily */}
      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Podpis pro emaily</h2>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            {avatar ? (
              <Image
                src={avatar}
                alt="Avatar"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {firstName} {lastName}
              </p>
              {phone && (
                <p className="text-xs text-gray-500">{phone}</p>
              )}
              <p className="text-xs text-gray-500">{email}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Podpis se generuje automaticky z vašeho profilu
        </p>
      </Card>

      {/* Data a soukromí */}
      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Data a soukromí</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Stáhněte si kopii všech vašich dat uložených v systému Carmakler.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportData}
              disabled={exporting}
            >
              {exporting ? "Exportuji..." : "Exportovat moje data"}
            </Button>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-sm text-gray-500 mb-2">
              Požádejte o trvalé smazání vašeho účtu a všech souvisejících dat.
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? "Odesílám..." : "Požádat o smazání účtu"}
            </Button>
            {deleteMessage && (
              <div
                className={`text-sm px-3 py-2 rounded-lg mt-2 ${
                  deleteMessage.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {deleteMessage.text}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* O aplikaci */}
      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">O aplikaci</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Verze</span>
            <span className="text-gray-900 font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Obchodní podmínky</span>
            <a
              href="/podminky"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Zobrazit
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Podpora</span>
            <a
              href="mailto:podpora@carmakler.cz"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              podpora@carmakler.cz
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
