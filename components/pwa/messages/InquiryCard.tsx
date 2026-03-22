import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface InquiryCardData {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  message: string;
  status: string;
  reply: string | null;
  createdAt: string;
  offeredPrice: number | null;
}

const statusLabels: Record<string, { label: string; variant: "new" | "verified" | "pending" | "top" | "rejected" | "default" }> = {
  NEW: { label: "Novy", variant: "new" },
  REPLIED: { label: "Zodpovezeno", variant: "verified" },
  VIEWING_SCHEDULED: { label: "Prohlidka", variant: "top" },
  NEGOTIATING: { label: "Vyjednavani", variant: "pending" },
  RESERVED: { label: "Rezervovano", variant: "top" },
  SOLD: { label: "Prodano", variant: "verified" },
  NO_INTEREST: { label: "Bez zajmu", variant: "default" },
};

interface InquiryCardProps {
  inquiry: InquiryCardData;
  onClick?: () => void;
}

export function InquiryCard({ inquiry, onClick }: InquiryCardProps) {
  const statusInfo = statusLabels[inquiry.status] ?? { label: inquiry.status, variant: "default" as const };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
    >
      <Card hover className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm truncate">
                {inquiry.buyerName}
              </span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>

            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {inquiry.message}
            </p>

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>{formatDate(inquiry.createdAt)}</span>
              {inquiry.offeredPrice && (
                <span className="text-orange-500 font-medium">
                  {new Intl.NumberFormat("cs-CZ").format(inquiry.offeredPrice)} Kc
                </span>
              )}
            </div>
          </div>

          {/* Kontaktni tlacitka */}
          <div className="flex gap-1.5 flex-shrink-0">
            <a
              href={`tel:${inquiry.buyerPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 bg-green-50 text-green-600 rounded-lg flex items-center justify-center no-underline"
              title="Zavolat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </Card>
    </button>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Prave ted";
  if (diffMins < 60) return `pred ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `pred ${diffHours} hod`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `pred ${diffDays} dny`;

  return date.toLocaleDateString("cs-CZ");
}
