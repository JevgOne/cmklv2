import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface LeadCardData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  brand: string | null;
  model: string | null;
  city: string | null;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; variant: "new" | "verified" | "pending" | "top" | "rejected" | "default" }> = {
  NEW: { label: "Novy", variant: "new" },
  ASSIGNED: { label: "Prijaty", variant: "verified" },
  CONTACTED: { label: "Kontaktovano", variant: "pending" },
  MEETING_SCHEDULED: { label: "Schuzka", variant: "top" },
  VEHICLE_ADDED: { label: "Nabrano", variant: "verified" },
  REJECTED: { label: "Odmitnuty", variant: "rejected" },
  EXPIRED: { label: "Expiroval", variant: "default" },
};

interface LeadCardProps {
  lead: LeadCardData;
}

export function LeadCard({ lead }: LeadCardProps) {
  const statusInfo = statusLabels[lead.status] ?? { label: lead.status, variant: "default" as const };

  return (
    <Link href={`/makler/leads/${lead.id}`} className="block no-underline">
      <Card hover className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm truncate">
                {lead.name}
              </span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>

            {(lead.brand || lead.model) && (
              <div className="text-sm text-gray-600 mt-1">
                {[lead.brand, lead.model].filter(Boolean).join(" ")}
              </div>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              {lead.city && <span>{lead.city}</span>}
              <span>{formatDate(lead.createdAt)}</span>
            </div>
          </div>

          {/* Kontaktni tlacitka */}
          <div className="flex gap-1.5 flex-shrink-0">
            <a
              href={`tel:${lead.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 bg-success-50 text-success-500 rounded-lg flex items-center justify-center text-sm no-underline"
              title="Zavolat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href={`sms:${lead.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 bg-info-50 text-info-500 rounded-lg flex items-center justify-center text-sm no-underline"
              title="SMS"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.783.783 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href={`https://wa.me/${lead.phone.replace(/\s+/g, "").replace(/^\+/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 bg-green-50 text-green-600 rounded-lg flex items-center justify-center text-sm no-underline"
              title="WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M16.555 3.444a9.964 9.964 0 00-7.072-2.93C4.723.514 1.005 4.23 1.005 8.989c0 1.493.39 2.952 1.13 4.237L1 19.486l6.39-1.676a9.922 9.922 0 004.096.896h.004c4.757 0 8.674-3.717 8.674-8.476a8.428 8.428 0 00-2.609-6.786z" />
              </svg>
            </a>
          </div>
        </div>
      </Card>
    </Link>
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
