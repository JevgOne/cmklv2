"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExtendExclusiveModal } from "./ExtendExclusiveModal";
import { TerminateExclusiveModal } from "./TerminateExclusiveModal";
import { ReportViolationModal } from "./ReportViolationModal";

interface ExclusiveSectionProps {
  vehicleId: string;
  exclusiveUntil: string | null;
  contract: {
    id: string;
    exclusiveEndDate: string | null;
    earlyTermination: boolean;
    terminationReason: string | null;
    violationReported: boolean;
    violationDetails: string | null;
    penaltyAmount: number | null;
    pdfUrl: string | null;
    status: string;
  } | null;
}

type ExclusiveStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "TERMINATED" | "NONE";

function getExclusiveStatus(
  exclusiveUntil: string | null,
  contract: ExclusiveSectionProps["contract"]
): { status: ExclusiveStatus; daysRemaining: number | null } {
  if (contract?.earlyTermination) {
    return { status: "TERMINATED", daysRemaining: null };
  }
  if (!exclusiveUntil) {
    return { status: "NONE", daysRemaining: null };
  }
  const now = new Date();
  const until = new Date(exclusiveUntil);
  const diffMs = until.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) return { status: "EXPIRED", daysRemaining: 0 };
  if (days <= 14) return { status: "EXPIRING_SOON", daysRemaining: days };
  return { status: "ACTIVE", daysRemaining: days };
}

const statusConfig: Record<
  ExclusiveStatus,
  { badge: "verified" | "pending" | "rejected" | "default"; label: string; bgClass: string; borderClass: string }
> = {
  ACTIVE: {
    badge: "verified",
    label: "Aktivni",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
  },
  EXPIRING_SOON: {
    badge: "pending",
    label: "Brzy vyprsi",
    bgClass: "bg-yellow-50",
    borderClass: "border-yellow-200",
  },
  EXPIRED: {
    badge: "rejected",
    label: "Vyprsela",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
  },
  TERMINATED: {
    badge: "default",
    label: "Ukoncena",
    bgClass: "bg-gray-50",
    borderClass: "border-gray-200",
  },
  NONE: {
    badge: "default",
    label: "Bez exkluzivity",
    bgClass: "bg-gray-50",
    borderClass: "border-gray-200",
  },
};

export function ExclusiveSection({
  vehicleId,
  exclusiveUntil,
  contract,
}: ExclusiveSectionProps) {
  const [extendOpen, setExtendOpen] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [violationOpen, setViolationOpen] = useState(false);

  const { status, daysRemaining } = getExclusiveStatus(exclusiveUntil, contract);
  const config = statusConfig[status];

  if (status === "NONE") return null;

  const formattedDate = exclusiveUntil
    ? new Date(exclusiveUntil).toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Exkluzivni smlouva
        </h3>
        <Card className={`p-4 ${config.bgClass} border ${config.borderClass}`}>
          <div className="flex items-center justify-between mb-3">
            <Badge variant={config.badge}>{config.label}</Badge>
            {contract?.violationReported && (
              <Badge variant="rejected">Poruseni nahlaseno</Badge>
            )}
          </div>

          {formattedDate && daysRemaining !== null && daysRemaining > 0 && (
            <p className="text-sm text-gray-700">
              Exkluzivita do{" "}
              <span className="font-semibold">{formattedDate}</span>{" "}
              <span className="text-gray-500">
                (zbyva {daysRemaining}{" "}
                {daysRemaining === 1
                  ? "den"
                  : daysRemaining < 5
                  ? "dny"
                  : "dni"})
              </span>
            </p>
          )}

          {status === "EXPIRED" && (
            <p className="text-sm text-red-600">
              Exkluzivita vyprsela {formattedDate}
            </p>
          )}

          {status === "TERMINATED" && contract?.terminationReason && (
            <p className="text-sm text-gray-600">
              Duvod: {contract.terminationReason}
            </p>
          )}

          {contract?.penaltyAmount && (
            <p className="text-xs text-gray-500 mt-1">
              Smluvni pokuta:{" "}
              {new Intl.NumberFormat("cs-CZ").format(contract.penaltyAmount)} Kc
            </p>
          )}

          {/* Action buttons */}
          {(status === "ACTIVE" || status === "EXPIRING_SOON") && (
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setExtendOpen(true)}
                >
                  Prodlouzit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setTerminateOpen(true)}
                >
                  Ukoncit
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => setViolationOpen(true)}
                >
                  Nahlasit poruseni
                </Button>
                {contract?.pdfUrl && (
                  <a
                    href={contract.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="ghost" size="sm" className="w-full">
                      Zobrazit smlouvu
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}

          {status === "EXPIRED" && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => setExtendOpen(true)}
              >
                Obnovit exkluzivitu
              </Button>
              {contract?.pdfUrl && (
                <a
                  href={contract.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="ghost" size="sm" className="w-full">
                    Zobrazit smlouvu
                  </Button>
                </a>
              )}
            </div>
          )}
        </Card>
      </div>

      <ExtendExclusiveModal
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        vehicleId={vehicleId}
      />
      <TerminateExclusiveModal
        open={terminateOpen}
        onClose={() => setTerminateOpen(false)}
        vehicleId={vehicleId}
        penaltyAmount={contract?.penaltyAmount}
      />
      <ReportViolationModal
        open={violationOpen}
        onClose={() => setViolationOpen(false)}
        vehicleId={vehicleId}
      />
    </>
  );
}
