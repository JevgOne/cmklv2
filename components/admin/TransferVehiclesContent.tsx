"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Select, Checkbox, Input } from "@/components/ui";

interface VehicleItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: string;
  image: string | null;
}

interface TargetBroker {
  id: string;
  name: string;
}

interface TransferVehiclesContentProps {
  sourceBrokerId: string;
  sourceBrokerName: string;
  vehicles: VehicleItem[];
  targetBrokers: TargetBroker[];
}

const statusLabels: Record<string, string> = {
  DRAFT: "Koncept",
  PENDING: "Čekající",
  ACTIVE: "Aktivní",
  RESERVED: "Rezervováno",
};

export function TransferVehiclesContent({
  sourceBrokerId,
  sourceBrokerName,
  vehicles,
  targetBrokers,
}: TransferVehiclesContentProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetBrokerId, setTargetBrokerId] = useState("");
  const [reason, setReason] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleVehicle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === vehicles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vehicles.map((v) => v.id)));
    }
  };

  const handleTransfer = async () => {
    setError(null);
    if (selectedIds.size === 0) {
      setError("Vyberte alespoň jedno vozidlo");
      return;
    }
    if (!targetBrokerId) {
      setError("Vyberte cílového makléře");
      return;
    }
    if (!reason.trim()) {
      setError("Vyplňte důvod přenosu");
      return;
    }

    const confirmed = confirm(
      `Opravdu chcete přenést ${selectedIds.size} vozidel na vybraného makléře?`
    );
    if (!confirmed) return;

    setTransferring(true);
    try {
      const res = await fetch(
        `/api/manager/brokers/${sourceBrokerId}/transfer-vehicles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleIds: Array.from(selectedIds),
            targetBrokerId,
            reason: reason.trim(),
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        setTimeout(() => {
          router.push(`/admin/manager/brokers/${sourceBrokerId}`);
          router.refresh();
        }, 2000);
        setError(null);
        void data;
      } else {
        const data = await res.json();
        setError(data.error || "Přenos se nezdařil");
      }
    } catch {
      setError("Chyba serveru");
    } finally {
      setTransferring(false);
    }
  };

  if (success) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-green-600"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Přenos dokončen
        </h2>
        <p className="text-gray-500">
          Vozidla byla úspěšně přenesena. Přesměrování...
        </p>
      </Card>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-400">
          Makléř {sourceBrokerName} nemá žádná aktivní vozidla k přenosu.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={() => router.back()}
        >
          Zpět
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Target broker + reason */}
      <Card className="p-6">
        <h2 className="font-bold text-gray-900 mb-4">Přenést na makléře</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Cílový makléř"
            placeholder="Vyberte makléře..."
            value={targetBrokerId}
            onChange={(e) => setTargetBrokerId(e.target.value)}
            options={targetBrokers.map((b) => ({
              value: b.id,
              label: b.name,
            }))}
          />
          <Input
            label="Důvod přenosu"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Např. nemoc, odchod, změna regionu..."
          />
        </div>
      </Card>

      {/* Vehicle selection */}
      <Card className="!p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.size === vehicles.length}
              onChange={selectAll}
            />
            <span className="text-sm font-semibold text-gray-900">
              Vybrat vše ({selectedIds.size}/{vehicles.length})
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {vehicles.map((v) => (
            <label
              key={v.id}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedIds.has(v.id)}
                onChange={() => toggleVehicle(v.id)}
              />
              <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                {v.image ? (
                  <img
                    src={v.image}
                    alt={`${v.brand} ${v.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-300 text-sm">Auto</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm">
                  {v.brand} {v.model} ({v.year})
                </div>
                <div className="text-xs text-gray-500">
                  {v.price.toLocaleString("cs-CZ")} Kč
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {statusLabels[v.status] || v.status}
              </span>
            </label>
          ))}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="text-sm bg-red-50 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => router.back()}>
          Zrušit
        </Button>
        <Button
          variant="primary"
          onClick={handleTransfer}
          disabled={
            transferring ||
            selectedIds.size === 0 ||
            !targetBrokerId ||
            !reason.trim()
          }
        >
          {transferring
            ? "Přenáším..."
            : `Přenést ${selectedIds.size} vozidel`}
        </Button>
      </div>
    </div>
  );
}
