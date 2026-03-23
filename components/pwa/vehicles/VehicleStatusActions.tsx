"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ReserveButton } from "./ReserveButton";
import { DamageReportButton } from "./DamageReportButton";
import { formatPrice } from "@/lib/utils";

interface VehicleStatusActionsProps {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    variant: string | null;
    status: string;
    price: number;
    commission: number | null;
    rejectionReason: string | null;
    reservedFor: string | null;
    reservedAt: string | null;
    reservedPrice: number | null;
    soldPrice: number | null;
    soldAt: string | null;
    handoverCompleted: boolean;
  };
}

export function VehicleStatusActions({ vehicle }: VehicleStatusActionsProps) {
  const router = useRouter();
  const [withdrawing, setWithdrawing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const title = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}`;

  const handleWithdraw = async () => {
    if (!confirm("Opravdu chcete stáhnout vozidlo z nabídky?")) return;
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Opravdu chcete smazat tento draft?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "DELETE",
      });
      if (res.ok) router.push("/makler/vehicles");
    } finally {
      setDeleting(false);
    }
  };

  const handleResubmit = async () => {
    const res = await fetch(`/api/vehicles/${vehicle.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING" }),
    });
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-3">
      {/* Provize */}
      {vehicle.commission && ["ACTIVE", "RESERVED", "SOLD"].includes(vehicle.status) && (
        <Card className="p-4 bg-orange-50 border border-orange-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Vaše provize</span>
            <span className="text-lg font-extrabold text-orange-600">
              {formatPrice(vehicle.commission)}
            </span>
          </div>
        </Card>
      )}

      {/* DRAFT */}
      {vehicle.status === "DRAFT" && (
        <>
          <Link href={`/makler/vehicles/${vehicle.id}/edit`} className="block no-underline">
            <Button variant="primary" size="lg" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
              Pokračovat v editaci
            </Button>
          </Link>
          <Button
            variant="danger"
            size="default"
            className="w-full"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Mazání..." : "Smazat draft"}
          </Button>
        </>
      )}

      {/* PENDING */}
      {vehicle.status === "PENDING" && (
        <Alert variant="info">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold text-sm">Čeká na schválení</p>
            <p className="text-xs mt-1">Vozidlo bylo odesláno ke schválení. Budete informováni o výsledku.</p>
          </div>
        </Alert>
      )}

      {/* REJECTED */}
      {vehicle.status === "REJECTED" && (
        <>
          <Alert variant="error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-sm">Zamítnuto</p>
              {vehicle.rejectionReason && (
                <p className="text-xs mt-1">Důvod: {vehicle.rejectionReason}</p>
              )}
            </div>
          </Alert>
          <Link href={`/makler/vehicles/${vehicle.id}/edit`} className="block no-underline">
            <Button variant="primary" size="lg" className="w-full">
              Opravit a odeslat znovu
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="default"
            className="w-full"
            onClick={handleResubmit}
          >
            Odeslat znovu bez uprav
          </Button>
        </>
      )}

      {/* ACTIVE */}
      {vehicle.status === "ACTIVE" && (
        <>
          <ReserveButton vehicleId={vehicle.id} vehicleName={title} />
          <Link href={`/makler/vehicles/${vehicle.id}/edit`} className="block no-underline">
            <Button variant="outline" size="default" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
              Upravit vozidlo
            </Button>
          </Link>
          <DamageReportButton vehicleId={vehicle.id} />
          <Button
            variant="ghost"
            size="default"
            className="w-full"
            onClick={handleWithdraw}
            disabled={withdrawing}
          >
            {withdrawing ? "Stahuji..." : "Stáhnout z nabídky"}
          </Button>
        </>
      )}

      {/* RESERVED */}
      {vehicle.status === "RESERVED" && (
        <>
          {vehicle.reservedFor && (
            <Card className="p-4 bg-yellow-50 border border-yellow-200">
              <h3 className="font-semibold text-gray-900 mb-2">Rezervace</h3>
              <p className="text-sm text-gray-600">
                Kupující: <span className="font-medium">{vehicle.reservedFor}</span>
              </p>
              {vehicle.reservedPrice != null && (
                <p className="text-sm text-gray-600">
                  Dohodnuta cena: <span className="font-medium">{formatPrice(vehicle.reservedPrice)}</span>
                </p>
              )}
              {vehicle.reservedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(vehicle.reservedAt).toLocaleDateString("cs-CZ")}
                </p>
              )}
            </Card>
          )}
          <Link href={`/makler/vehicles/${vehicle.id}/handover`} className="block no-underline">
            <Button variant="success" size="lg" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Předávací checklist
            </Button>
          </Link>
          <DamageReportButton vehicleId={vehicle.id} />
        </>
      )}

      {/* SOLD */}
      {vehicle.status === "SOLD" && (
        <>
          <Card className="p-4 bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="verified">Prodáno</Badge>
            </div>
            {vehicle.soldPrice != null && (
              <p className="text-sm text-gray-600">
                Prodejní cena: <span className="font-bold">{formatPrice(vehicle.soldPrice)}</span>
              </p>
            )}
            {vehicle.soldAt && (
              <p className="text-xs text-gray-400 mt-1">
                {new Date(vehicle.soldAt).toLocaleDateString("cs-CZ")}
              </p>
            )}
          </Card>
        </>
      )}

      {/* ARCHIVED */}
      {vehicle.status === "ARCHIVED" && (
        <Alert variant="warning">
          <div>
            <p className="font-semibold text-sm">Archivováno</p>
            <p className="text-xs mt-1">Vozidlo bylo staženo z nabídky.</p>
          </div>
        </Alert>
      )}
    </div>
  );
}
