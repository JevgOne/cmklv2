"use client";

import { useState } from "react";
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
}

export function SettingsContent({
  email,
  ico,
  bankAccount,
  quickModeEnabled: initialQuickMode,
  userLevel,
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
            {userLevel === "JUNIOR" ? (
              <p className="text-sm text-orange-600">
                Dostupné od úrovně Makléř (5+ prodejů)
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
            disabled={userLevel === "JUNIOR"}
          />
        </div>
      </Card>

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
