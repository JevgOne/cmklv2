"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface PartRequestOffer {
  id: string;
  partName: string;
  price: number;
  condition: string;
  status: string;
  supplier: { companyName: string | null; firstName: string | null; lastName: string | null };
  createdAt: string;
}

interface PartRequest {
  id: string;
  description: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  offers: PartRequestOffer[];
  _count: { offers: number };
}

const STATUS_MAP: Record<string, { label: string; variant: "success" | "pending" | "rejected" }> = {
  OPEN: { label: "Otevřená", variant: "pending" },
  OFFERS_RECEIVED: { label: "Nabídky", variant: "success" },
  ACCEPTED: { label: "Přijato", variant: "success" },
  EXPIRED: { label: "Expirováno", variant: "rejected" },
  CANCELLED: { label: "Zrušeno", variant: "rejected" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ");
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PoptavkyPage() {
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/part-requests");
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Moje poptávky</h2>
        <p className="text-sm text-gray-500 mt-1">
          Přehled vašich poptávek dílů a nabídek od vrakovišť
        </p>
      </div>

      {requests.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-3">&#128203;</div>
          <h3 className="font-bold text-gray-900 mb-2">Žádné poptávky</h3>
          <p className="text-gray-500 text-sm">
            Zatím jste neodeslali žádnou poptávku. Pokud nenajdete díl v katalogu,
            zkuste funkci &quot;Poptejte u vrakovišť&quot;.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const statusInfo = STATUS_MAP[req.status] ?? {
              label: req.status,
              variant: "pending" as const,
            };
            const isExpired = new Date(req.expiresAt) < new Date();

            return (
              <Card key={req.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                      {req._count.offers > 0 && (
                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          {req._count.offers} {req._count.offers === 1 ? "nabídka" : "nabídek"}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-2">
                      {req.description}
                    </h3>
                    {(req.vehicleBrand || req.vehicleModel) && (
                      <p className="text-sm text-gray-500 mt-1">
                        Pro: {[req.vehicleBrand, req.vehicleModel, req.vehicleYear].filter(Boolean).join(" ")}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Vytvořeno: {formatDate(req.createdAt)}
                      {!isExpired && (
                        <span> · Platí do: {formatDate(req.expiresAt)}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Offers */}
                {req.offers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Nabídky od vrakovišť
                    </h4>
                    {req.offers.map((offer) => {
                      const supplierName =
                        offer.supplier.companyName ??
                        [offer.supplier.firstName, offer.supplier.lastName].filter(Boolean).join(" ") ??
                        "Dodavatel";
                      return (
                        <div
                          key={offer.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {offer.partName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {supplierName} · {offer.condition === "NEW" ? "Nový" : offer.condition === "USED_GOOD" ? "Dobrý stav" : "Použitý"}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-orange-600">
                            {formatPrice(offer.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
