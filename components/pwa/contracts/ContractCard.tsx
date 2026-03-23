import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatPrice } from "@/lib/utils";

interface ContractCardProps {
  contract: {
    id: string;
    type: string;
    sellerName: string;
    price: number | null;
    commission: number | null;
    status: string;
    createdAt: string;
    signedAt: string | null;
    vehicle: {
      id: string;
      brand: string;
      model: string;
      variant: string | null;
      year: number;
    } | null;
  };
}

const statusMap: Record<string, { variant: "active" | "pending" | "draft" | "sold"; label: string }> = {
  DRAFT: { variant: "draft", label: "Koncept" },
  SIGNED: { variant: "active", label: "Podepsáno" },
  SENT: { variant: "sold", label: "Odesláno" },
  CANCELLED: { variant: "pending", label: "Zrušeno" },
};

const typeLabels: Record<string, { label: string; icon: string }> = {
  BROKERAGE: { label: "Zprostředkovatelská", icon: "handshake" },
  HANDOVER: { label: "Předávací protokol", icon: "clipboard" },
};

function ContractTypeIcon({ type }: { type: string }) {
  if (type === "HANDOVER") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

export function ContractCard({ contract }: ContractCardProps) {
  const statusInfo = statusMap[contract.status] || { variant: "draft" as const, label: contract.status };
  const typeInfo = typeLabels[contract.type] || { label: contract.type, icon: "document" };

  const vehicleName = contract.vehicle
    ? `${contract.vehicle.brand} ${contract.vehicle.model}${contract.vehicle.variant ? ` ${contract.vehicle.variant}` : ""}`
    : "Bez vozidla";

  const dateStr = new Date(contract.createdAt).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/makler/contracts/${contract.id}`}
      className="block no-underline"
    >
      <Card hover className="p-4">
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 flex-shrink-0">
            <ContractTypeIcon type={contract.type} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm truncate">
                  {vehicleName}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {typeInfo.label}
                </p>
              </div>
              <StatusPill variant={statusInfo.variant}>
                {statusInfo.label}
              </StatusPill>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{contract.sellerName}</span>
                <span>·</span>
                <span>{dateStr}</span>
              </div>
              {contract.price && (
                <span className="text-sm font-extrabold text-gray-900">
                  {formatPrice(contract.price)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
