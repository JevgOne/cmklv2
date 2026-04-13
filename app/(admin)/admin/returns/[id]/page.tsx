"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  RETURN_STATUSES,
  RETURN_STATUS_MAP,
  RETURN_TYPE_MAP,
  formatPriceCZK,
} from "@/lib/returns-constants";

interface ReturnDetail {
  id: string;
  rmaNumber: string | null;
  type: string;
  status: string;
  reason: string;
  defectDesc: string | null;
  photos: string | null;
  items: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  bankAccount: string | null;
  requestedAmount: number;
  approvedAmount: number | null;
  refundedAt: string | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  deadlineAt: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    orderNumber: string;
    deliveryName: string;
    totalPrice: number;
    items: { id: string; quantity: number; unitPrice: number; part?: { name: string } }[];
  };
}

export default function AdminReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const canEdit = session?.user?.role === "ADMIN" || session?.user?.role === "BACKOFFICE";

  const [returnData, setReturnData] = useState<ReturnDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Editable fields
  const [status, setStatus] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchReturn = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/returns/${params.id}`);
      const data = await res.json();
      if (data.return) {
        setReturnData(data.return);
        setStatus(data.return.status);
        setApprovedAmount(data.return.approvedAmount?.toString() || "");
        setAdminNotes(data.return.adminNotes || "");
        setRejectionReason(data.return.rejectionReason || "");
      }
    } catch {
      setError("Nepodařilo se načíst reklamaci.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchReturn();
  }, [fetchReturn]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = { status };
      if (approvedAmount) body.approvedAmount = parseFloat(approvedAmount);
      if (adminNotes) body.adminNotes = adminNotes;
      if (rejectionReason) body.rejectionReason = rejectionReason;

      const res = await fetch(`/api/admin/returns/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Chyba při ukládání.");
        return;
      }

      await fetchReturn();
    } catch {
      setError("Nepodařilo se uložit změny.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Reklamace nenalezena</h2>
        <Button variant="primary" onClick={() => router.push("/admin/returns")}>
          Zpět na seznam
        </Button>
      </div>
    );
  }

  const statusInfo = RETURN_STATUS_MAP[returnData.status] || { label: returnData.status, variant: "pending" as const };
  const isOverdue = returnData.deadlineAt && new Date(returnData.deadlineAt) < new Date();

  let parsedPhotos: string[] = [];
  try {
    parsedPhotos = returnData.photos ? JSON.parse(returnData.photos) : [];
  } catch {
    // ignore
  }

  let parsedItems: { orderItemId: string; quantity: number; reason: string }[] = [];
  try {
    parsedItems = returnData.items ? JSON.parse(returnData.items) : [];
  } catch {
    // ignore
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <Link href="/admin/returns" className="hover:text-gray-700 no-underline">
              Reklamace
            </Link>
            <span>/</span>
            <span className="text-gray-900">Detail</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[28px] font-extrabold text-gray-900">
              {returnData.rmaNumber || returnData.order.orderNumber}
            </h1>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {isOverdue && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                ⚠ Po lhůtě
              </span>
            )}
          </div>
        </div>
        <Button variant="secondary" onClick={() => router.push("/admin/returns")}>
          ← Zpět
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — info */}
        <div className="space-y-6">
          {/* Basic info */}
          <Card className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Základní údaje</h2>
            <div className="space-y-3 text-sm">
              {returnData.rmaNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">RMA číslo:</span>
                  <span className="font-mono font-medium">{returnData.rmaNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Typ:</span>
                <span className="font-medium">{RETURN_TYPE_MAP[returnData.type] || returnData.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Objednávka:</span>
                <Link href={`/admin/orders`} className="text-orange-600 no-underline font-medium">
                  {returnData.order.orderNumber}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Požadovaná částka:</span>
                <span className="font-semibold">{formatPriceCZK(returnData.requestedAmount)}</span>
              </div>
              {returnData.approvedAmount !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Schválená částka:</span>
                  <span className="font-semibold text-green-600">{formatPriceCZK(returnData.approvedAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Vytvořeno:</span>
                <span>{new Date(returnData.createdAt).toLocaleString("cs-CZ")}</span>
              </div>
              {returnData.deadlineAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Lhůta (30 dní):</span>
                  <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                    {new Date(returnData.deadlineAt).toLocaleDateString("cs-CZ")}
                  </span>
                </div>
              )}
              {returnData.refundedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Vráceno dne:</span>
                  <span>{new Date(returnData.refundedAt).toLocaleString("cs-CZ")}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Reason */}
          <Card className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Důvod</h2>
            <p className="text-sm text-gray-700">{returnData.reason}</p>
            {returnData.defectDesc && (
              <div className="mt-3">
                <span className="text-xs font-semibold text-gray-500">Popis závady:</span>
                <p className="text-sm text-gray-700 mt-1">{returnData.defectDesc}</p>
              </div>
            )}
          </Card>

          {/* Contact */}
          <Card className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Kontakt</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Jméno:</span>
                <span className="font-medium">{returnData.contactName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span>{returnData.contactEmail}</span>
              </div>
              {returnData.contactPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Telefon:</span>
                  <span>{returnData.contactPhone}</span>
                </div>
              )}
              {returnData.bankAccount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Bankovní účet:</span>
                  <span className="font-mono text-xs">{returnData.bankAccount}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Photos */}
          {parsedPhotos.length > 0 && (
            <Card className="p-6">
              <h2 className="font-bold text-gray-900 mb-4">Fotografie závady</h2>
              <div className="grid grid-cols-2 gap-3">
                {parsedPhotos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={url}
                      alt={`Foto závady ${i + 1}`}
                      className="rounded-lg object-cover w-full h-32 border border-gray-200"
                    />
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Items */}
          {parsedItems.length > 0 && (
            <Card className="p-6">
              <h2 className="font-bold text-gray-900 mb-4">Položky k vrácení</h2>
              <div className="space-y-2">
                {parsedItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Množství: {item.quantity}x</span>
                    <span className="text-gray-500 text-xs">{item.reason}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column — actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Správa reklamace</h2>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!canEdit}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-100"
                >
                  {RETURN_STATUSES.map((s) => (
                    <option key={s} value={s}>{RETURN_STATUS_MAP[s]?.label || s}</option>
                  ))}
                </select>
              </div>

              {/* Approved amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schválená částka (Kč)
                </label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  disabled={!canEdit}
                  placeholder={`Max ${returnData.requestedAmount} Kč`}
                  min={0}
                  max={returnData.requestedAmount}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-100"
                />
              </div>

              {/* Rejection reason */}
              {(status === "REJECTED" || rejectionReason) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Důvod zamítnutí
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    disabled={!canEdit}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-100 resize-none"
                  />
                </div>
              )}

              {/* Admin notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interní poznámky
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={!canEdit}
                  rows={4}
                  placeholder="Poznámky viditelné pouze pro admin tým..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-100 resize-none"
                />
              </div>

              {canEdit && (
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Ukládám..." : "Uložit změny"}
                </Button>
              )}
            </div>
          </Card>

          {/* Order info summary */}
          <Card className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Objednávka</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Číslo:</span>
                <span className="font-medium">{returnData.order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Zákazník:</span>
                <span>{returnData.order.deliveryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Celkem:</span>
                <span className="font-semibold">{formatPriceCZK(returnData.order.totalPrice)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
