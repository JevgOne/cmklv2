"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Contract {
  id: string;
  type: string;
  status: string;
  sellerName: string;
  pdfUrl: string | null;
  signedAt: string | null;
  createdAt: string;
}

interface VehicleContractsProps {
  contracts: Contract[];
  vehicleId: string;
}

const typeLabels: Record<string, string> = {
  BROKERAGE: "Zprostredkovatelska",
  HANDOVER: "Predavaci protokol",
};

const statusConfig: Record<string, { variant: "verified" | "pending" | "default" | "rejected"; label: string }> = {
  DRAFT: { variant: "default", label: "Koncept" },
  SIGNED: { variant: "verified", label: "Podepsana" },
  SENT: { variant: "pending", label: "Odeslana" },
  ARCHIVED: { variant: "default", label: "Archivovana" },
};

export function VehicleContracts({ contracts, vehicleId }: VehicleContractsProps) {
  if (contracts.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Smlouvy</h3>
          <Link href={`/makler/contracts/new?vehicleId=${vehicleId}`} className="no-underline">
            <Button variant="primary" size="sm">
              Nova smlouva
            </Button>
          </Link>
        </div>
        <Card className="p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-gray-200 mx-auto mb-2">
            <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
            <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
          </svg>
          <p className="text-sm text-gray-400">Zadne smlouvy</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">
          Smlouvy <span className="text-gray-400 font-normal">({contracts.length})</span>
        </h3>
        <Link href={`/makler/contracts/new?vehicleId=${vehicleId}`} className="no-underline">
          <Button variant="primary" size="sm">
            Nova smlouva
          </Button>
        </Link>
      </div>
      <div className="space-y-2">
        {contracts.map((contract) => {
          const config = statusConfig[contract.status] || { variant: "default" as const, label: contract.status };
          return (
            <Link
              key={contract.id}
              href={`/makler/contracts/${contract.id}`}
              className="block no-underline"
            >
              <Card className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {typeLabels[contract.type] || contract.type}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {contract.sellerName}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(contract.createdAt).toLocaleDateString("cs-CZ")}
                      {contract.signedAt && (
                        <> · Podpis: {new Date(contract.signedAt).toLocaleDateString("cs-CZ")}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.variant}>{config.label}</Badge>
                    {contract.pdfUrl && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(contract.pdfUrl!, "_blank");
                        }}
                        className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors border-none cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
