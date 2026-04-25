"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface BrokerEditFormProps {
  brokerId: string;
  initialData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    bio: string;
    specializations: string[];
    cities: string[];
    ico: string;
    bankAccount: string;
  };
}

const statusOptions = [
  { value: "ACTIVE", label: "Aktivní" },
  { value: "PENDING", label: "Čekající" },
  { value: "SUSPENDED", label: "Pozastaven" },
  { value: "INACTIVE", label: "Neaktivní" },
];

export function BrokerEditForm({ brokerId, initialData }: BrokerEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [email, setEmail] = useState(initialData.email);
  const [phone, setPhone] = useState(initialData.phone);
  const [status, setStatus] = useState(initialData.status);
  const [bio, setBio] = useState(initialData.bio);
  const [citiesText, setCitiesText] = useState(initialData.cities.join(", "));
  const [specsText, setSpecsText] = useState(initialData.specializations.join(", "));
  const [ico, setIco] = useState(initialData.ico);
  const [bankAccount, setBankAccount] = useState(initialData.bankAccount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const cities = citiesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const specializations = specsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/brokers/${brokerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          status,
          bio,
          cities,
          specializations,
          ico,
          bankAccount,
        }),
      });

      if (res.ok) {
        router.push(`/admin/brokers/${brokerId}`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nepodařilo se uložit změny");
      }
    } catch {
      setError("Chyba spojení se serverem");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Osobní údaje</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Jméno</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Příjmení</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Telefon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Firemní údaje</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>IČO</label>
              <input
                type="text"
                value={ico}
                onChange={(e) => setIco(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Bankovní účet</label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Města (oddělená čárkou)</label>
              <input
                type="text"
                value={citiesText}
                onChange={(e) => setCitiesText(e.target.value)}
                className={inputClass}
                placeholder="Praha, Brno, Ostrava"
              />
            </div>
            <div>
              <label className={labelClass}>Specializace (oddělené čárkou)</label>
              <input
                type="text"
                value={specsText}
                onChange={(e) => setSpecsText(e.target.value)}
                className={inputClass}
                placeholder="SUV, Luxury, Elektro"
              />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Bio</h3>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={`${inputClass} min-h-[120px] resize-y`}
          placeholder="Krátký popis makléře..."
        />
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/brokers/${brokerId}`)}
        >
          Zrušit
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={saving}>
          {saving ? "Ukládám..." : "Uložit změny"}
        </Button>
      </div>
    </form>
  );
}
