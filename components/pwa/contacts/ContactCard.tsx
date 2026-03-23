import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface ContactCardData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  totalVehicles: number;
  totalSold: number;
  lastContactAt: string | null;
  nextFollowUp: string | null;
  _count?: { vehicles: number; communications: number };
}

interface ContactCardProps {
  contact: ContactCardData;
}

export function ContactCard({ contact }: ContactCardProps) {
  const isFollowUpDue =
    contact.nextFollowUp && new Date(contact.nextFollowUp) <= new Date();

  return (
    <Link
      href={`/makler/contacts/${contact.id}`}
      className="block no-underline"
    >
      <Card hover className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm truncate">
                {contact.name}
              </span>
              {isFollowUpDue && (
                <Badge variant="rejected">Follow-up</Badge>
              )}
            </div>

            <div className="text-sm text-gray-500 mt-1">{contact.phone}</div>

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              {contact.city && <span>{contact.city}</span>}
              <span>
                {contact.totalVehicles} aut
                {contact.totalSold > 0 && ` / ${contact.totalSold} prodáno`}
              </span>
              {contact.lastContactAt && (
                <span>Kontakt: {formatDate(contact.lastContactAt)}</span>
              )}
            </div>
          </div>

          {/* Kontaktní tlačítka */}
          <div className="flex gap-1.5 flex-shrink-0">
            <a
              href={`tel:${contact.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 bg-success-50 text-success-500 rounded-lg flex items-center justify-center text-sm no-underline"
              title="Zavolat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <a
              href={`sms:${contact.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 bg-info-50 text-info-500 rounded-lg flex items-center justify-center text-sm no-underline"
              title="SMS"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.783.783 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z"
                  clipRule="evenodd"
                />
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
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "dnes";
  if (diffDays === 1) return "včera";
  if (diffDays < 7) return `před ${diffDays} dny`;
  return date.toLocaleDateString("cs-CZ");
}
