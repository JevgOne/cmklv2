"use client";

/**
 * ShippingLabelCard — vrakoviště PWA widget pro přepravní štítek.
 *
 * 5 variant (priority order):
 *  1. PICKUP — info box + "Označit jako vyzvednuto" (→ DELIVERED)
 *  2. shippedAt != null — "Odesláno {datetime}" + tracking link
 *  3. shippingLabelUrl == null — "Čekáme na platbu" (BANK_TRANSFER/COD před platbou)
 *  4. shippingLabelUrl != null && shippedAt == null — happy path:
 *       carrier badge, tracking, adresa, [Stáhnout PDF] + [Označit jako odesláno]
 *  5. DRY-RUN overlay na variantě 4 (trackingNumber začíná "DRY-")
 *
 * Flow "Mark shipped":
 *  - window.confirm prompt (per team-lead decision 2026-04-06)
 *  - PUT /api/orders/[id]/status { status: "SHIPPED" }
 *  - Endpoint auto-nastaví shippedAt=now
 *  - NESMÍ volat sendEmail() — customer už dostane email z webhooku po platbě (#19)
 *  - onShipped callback → parent re-renders detail + list
 */

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const CARRIER_LABELS: Record<string, string> = {
  ZASILKOVNA: "Zásilkovna",
  DPD: "DPD",
  PPL: "PPL",
  GLS: "GLS",
  CESKA_POSTA: "Česká pošta",
  PICKUP: "Osobní odběr",
};

function localizedCarrier(code: string | null): string {
  if (!code) return "Dopravce neznámý";
  return CARRIER_LABELS[code] ?? code;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface ShippingLabelCardProps {
  orderId: string;
  orderNumber: string;
  deliveryMethod: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingLabelUrl: string | null;
  shippedAt: string | null;
  zasilkovnaPointName: string | null;
  deliveryAddress: {
    street: string;
    city: string;
    zip: string;
    name: string;
  };
  /** Počet unique supplierů v objednávce — >1 zobrazí warning o koordinaci */
  supplierCount?: number;
  /** Callback po úspěšném mark-shipped (parent refreshuje stav) */
  onShipped: () => void;
  /** Callback po úspěšném mark-delivered pro PICKUP (parent refreshuje stav) */
  onDelivered?: () => void;
}

export function ShippingLabelCard({
  orderId,
  orderNumber,
  deliveryMethod,
  trackingCarrier,
  trackingNumber,
  trackingUrl,
  shippingLabelUrl,
  shippedAt,
  zasilkovnaPointName,
  deliveryAddress,
  supplierCount = 1,
  onShipped,
  onDelivered,
}: ShippingLabelCardProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPickup = deliveryMethod === "PICKUP";
  const isDryRun = !!trackingNumber && trackingNumber.startsWith("DRY-");
  const isMultiSupplier = supplierCount > 1;

  /* ---------- PUT helpers ---------- */

  async function putStatus(
    nextStatus: "SHIPPED" | "DELIVERED",
    confirmMessage: string,
    onSuccess: () => void
  ) {
    if (!window.confirm(confirmMessage)) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Nepodařilo se aktualizovat stav objednávky");
        return;
      }
      onSuccess();
    } catch {
      setError("Chyba spojení — zkuste to prosím znovu");
    } finally {
      setSubmitting(false);
    }
  }

  function handleMarkShipped() {
    putStatus(
      "SHIPPED",
      "Opravdu označit jako odesláno?",
      onShipped
    );
  }

  function handleMarkPickedUp() {
    putStatus(
      "DELIVERED",
      "Opravdu označit jako vyzvednuto?",
      onDelivered ?? onShipped
    );
  }

  /* ---------- Variant 1: PICKUP ---------- */
  if (isPickup) {
    // Pokud už je DELIVERED (shippedAt null, ale status=DELIVERED), parent by měl tuto kartu
    // vůbec nerenderovat nebo přepnout na "already delivered" variantu. Tady jen base state.
    return (
      <Card className="p-4 border-2 border-green-100">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-3xl shrink-0">📦</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Osobní odběr
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Zákazník si díly vyzvedne osobně. Žádný přepravní štítek se nevytváří.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
          <p className="font-semibold text-gray-900">{deliveryAddress.name}</p>
          <p className="text-gray-600">
            Objednávka <span className="font-mono">#{orderNumber}</span>
          </p>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          variant="success"
          size="lg"
          className="w-full mt-4"
          onClick={handleMarkPickedUp}
          disabled={submitting}
        >
          {submitting ? "Ukládá se…" : "✅ Označit jako vyzvednuto"}
        </Button>
      </Card>
    );
  }

  /* ---------- Variant 2: Already shipped ---------- */
  if (shippedAt) {
    return (
      <Card className="p-4 border-2 border-green-100 bg-green-50/40">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-3xl shrink-0">✅</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Odesláno
            </h3>
            <p className="text-sm text-gray-600">
              {formatDateTime(shippedAt)}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-green-100 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">Dopravce</span>
            <Badge variant="verified">{localizedCarrier(trackingCarrier)}</Badge>
          </div>
          {trackingNumber && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Tracking</span>
              <span className="font-mono text-gray-900 font-semibold">
                {trackingNumber}
              </span>
            </div>
          )}
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-3 text-center text-sm font-semibold text-green-700 hover:text-green-800 no-underline py-2 border border-green-200 rounded-lg"
            >
              Sledovat zásilku →
            </a>
          )}
        </div>
      </Card>
    );
  }

  /* ---------- Variant 3: Label not ready (BANK_TRANSFER/COD before payment) ---------- */
  if (!shippingLabelUrl) {
    return (
      <Card className="p-4 border-2 border-amber-100 bg-amber-50/40">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-3xl shrink-0">⏳</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Štítek zatím není připraven
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Čekáme na platbu. Jakmile zákazník zaplatí, automaticky se vygeneruje přepravní štítek.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full mt-4"
          disabled
        >
          🖨️ Stáhnout štítek (nedostupné)
        </Button>
      </Card>
    );
  }

  /* ---------- Variant 4 (+ 5 dry-run overlay): Label ready, awaiting ship ---------- */
  const displayAddress = deliveryMethod === "ZASILKOVNA" && zasilkovnaPointName
    ? `Výdejní místo: ${zasilkovnaPointName}`
    : null;

  return (
    <Card className="p-4 border-2 border-orange-100">
      <div className="flex items-start gap-3 mb-3">
        <div className="text-3xl shrink-0">🏷️</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 mb-1">
            K odeslání
          </h3>
          <p className="text-sm text-gray-600">
            Stáhni PDF štítek, přilepit na krabici a předej dopravci.
          </p>
        </div>
      </div>

      {/* DRY-RUN banner (variant 5 overlay) */}
      {isDryRun && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <strong className="text-amber-800 block mb-1">
            ⚠️ DRY-RUN režim
          </strong>
          <p className="text-amber-700 leading-relaxed">
            Štítek je placeholder (není skutečná zásilka). Pro produkční provoz nastav API klíče dopravce v <code className="font-mono text-xs">.env</code>.
          </p>
        </div>
      )}

      {/* Multi-supplier warning */}
      {isMultiSupplier && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <strong className="text-blue-800 block mb-1">
            ℹ️ Více vrakovišť
          </strong>
          <p className="text-blue-700 leading-relaxed">
            Tato objednávka obsahuje díly od více vrakovišť. Koordinujte odeslání s ostatními dodavateli.
          </p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500">Dopravce</span>
          <Badge variant="pending">{localizedCarrier(trackingCarrier)}</Badge>
        </div>
        {trackingNumber && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">Tracking</span>
            <span className="font-mono text-gray-900 font-semibold text-right break-all">
              {trackingNumber}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
          📍 Adresa doručení
        </p>
        <div className="text-sm text-gray-900 space-y-0.5">
          <p className="font-semibold">{deliveryAddress.name}</p>
          {displayAddress ? (
            <p className="text-gray-700">{displayAddress}</p>
          ) : (
            <p className="text-gray-700">
              {deliveryAddress.street}, {deliveryAddress.zip} {deliveryAddress.city}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Primary CTA — download PDF label */}
      <a
        href={shippingLabelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-4 no-underline"
      >
        <Button variant="primary" size="lg" className="w-full">
          🖨️ Stáhnout PDF štítek
        </Button>
      </a>

      {/* Secondary CTA — mark as shipped */}
      <Button
        variant="success"
        size="lg"
        className="w-full mt-2"
        onClick={handleMarkShipped}
        disabled={submitting}
      >
        {submitting ? "Ukládá se…" : "✅ Označit jako odesláno"}
      </Button>
    </Card>
  );
}
