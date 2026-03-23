"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

interface FlipItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  purchasePrice: number;
  repairCost: number;
  estimatedSalePrice: number;
  dealerName: string;
  createdAt: string;
}

export interface FlipManagementProps {
  flips: FlipItem[];
}

const statusMap: Record<string, { label: string; variant: "verified" | "top" | "live" | "new" | "pending" | "rejected" | "default" }> = {
  PENDING_APPROVAL: { label: "Ke schválení", variant: "pending" },
  APPROVED: { label: "Schváleno", variant: "new" },
  FUNDING: { label: "Financování", variant: "live" },
  FUNDED: { label: "Financováno", variant: "verified" },
  IN_REPAIR: { label: "V opravě", variant: "top" },
  FOR_SALE: { label: "Na prodej", variant: "live" },
  SOLD: { label: "Prodáno", variant: "verified" },
  COMPLETED: { label: "Dokončeno", variant: "verified" },
  CANCELLED: { label: "Zamítnuto", variant: "rejected" },
};

export function FlipManagement({ flips }: FlipManagementProps) {
  const router = useRouter();

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Vozidlo
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Dealer
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Status
              </th>
              <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Nákup
              </th>
              <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Oprava
              </th>
              <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Prodej
              </th>
              <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">
                Akce
              </th>
            </tr>
          </thead>
          <tbody>
            {flips.map((flip) => {
              const statusInfo = statusMap[flip.status] || statusMap.PENDING_APPROVAL;
              return (
                <tr key={flip.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 text-sm">
                      {flip.brand} {flip.model}
                    </div>
                    <div className="text-xs text-gray-400">{flip.year}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{flip.dealerName}</td>
                  <td className="px-6 py-4">
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                    {formatPrice(flip.purchasePrice)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                    {formatPrice(flip.repairCost)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-success-500 text-right">
                    {formatPrice(flip.estimatedSalePrice)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/marketplace/${flip.id}`)}
                    >
                      Detail
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
