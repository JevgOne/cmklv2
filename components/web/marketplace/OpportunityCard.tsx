import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

export interface OpportunityCardProps {
  id: string;
  brand: string;
  model: string;
  year: number;
  photoUrl?: string;
  purchasePrice: number;
  repairCost: number;
  estimatedSalePrice: number;
  fundedAmount: number;
  neededAmount: number;
  status: "PENDING_APPROVAL" | "APPROVED" | "FUNDING" | "FUNDED" | "IN_REPAIR" | "FOR_SALE" | "SOLD" | "COMPLETED" | "CANCELLED";
  dealerName: string;
  linkPrefix?: string;
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

export const OpportunityCard = memo(function OpportunityCard({
  id,
  brand,
  model,
  year,
  photoUrl,
  purchasePrice,
  repairCost,
  estimatedSalePrice,
  fundedAmount,
  neededAmount,
  status,
  dealerName,
  linkPrefix = "/marketplace/investor",
}: OpportunityCardProps) {
  const totalCost = purchasePrice + repairCost;
  const profit = estimatedSalePrice - totalCost;
  const roi = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0;
  const fundingProgress = neededAmount > 0 ? Math.round((fundedAmount / neededAmount) * 100) : 100;
  const statusInfo = statusMap[status] || statusMap.PENDING_APPROVAL;

  return (
    <Link href={`${linkPrefix}/${id}`} className="no-underline block">
      <Card hover className="group">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`${brand} ${model}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">
              🚗
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          <div className="absolute top-3 right-3">
            <span className="bg-white/90 backdrop-blur-sm text-gray-900 font-bold text-sm px-3 py-1.5 rounded-lg">
              ROI {roi}%
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-[17px] font-bold text-gray-900 truncate">
            {brand} {model}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {year} · {dealerName}
          </p>

          {/* Prices */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase">Nákup</div>
              <div className="text-sm font-bold text-gray-900">{formatPrice(purchasePrice)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase">Oprava</div>
              <div className="text-sm font-bold text-gray-900">{formatPrice(repairCost)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase">Prodej</div>
              <div className="text-sm font-bold text-success-500">{formatPrice(estimatedSalePrice)}</div>
            </div>
          </div>

          {/* Funding progress */}
          {(status === "FUNDING" || status === "APPROVED") && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500">Financováno</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(fundedAmount)} / {formatPrice(neededAmount)}
                </span>
              </div>
              <ProgressBar value={fundingProgress} variant="green" />
            </div>
          )}

          {/* CTA */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-lg font-extrabold text-gray-900">
              {formatPrice(profit)}
              <span className="text-xs font-medium text-gray-500 ml-1">zisk</span>
            </div>
            <Button variant="primary" size="sm">
              {status === "FUNDING" ? "Investovat" : "Detail"}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
});
