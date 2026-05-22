"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export interface InquiryData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  reply: string | null;
  repliedAt: string | null;
  status: string;
  priority: string | null;
  note: string | null;
  viewingDate: string | null;
  viewingResult: string | null;
  createdAt: string;
  updatedAt: string;
  listing: {
    id: string;
    slug: string;
    brand: string;
    model: string;
    variant: string | null;
    year: number;
    price: number;
    image: string | null;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  NEW: { label: "Nový", color: "bg-red-50 text-red-700", dot: "bg-red-500" },
  READ: { label: "Přečteno", color: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-500" },
  REPLIED: { label: "Odpovězeno", color: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  VIEWING: { label: "Prohlídka", color: "bg-purple-50 text-purple-700", dot: "bg-purple-500" },
  SOLD: { label: "Prodáno", color: "bg-green-50 text-green-700", dot: "bg-green-500" },
  CLOSED: { label: "Uzavřeno", color: "bg-gray-50 text-gray-600", dot: "bg-gray-400" },
  NO_INTEREST: { label: "Bez zájmu", color: "bg-gray-50 text-gray-600", dot: "bg-gray-400" },
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "text-red-600",
  NORMAL: "text-gray-500",
  LOW: "text-gray-400",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface InquiryCardProps {
  inquiry: InquiryData;
  onReply: (inquiry: InquiryData) => void;
  onStatusChange: (id: string, status: string, viewingDate?: string) => void;
  onNoteChange: (id: string, note: string, priority?: string) => void;
}

export function InquiryCard({ inquiry, onReply, onStatusChange, onNoteChange }: InquiryCardProps) {
  const status = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.NEW;
  const vehicleName = `${inquiry.listing.brand} ${inquiry.listing.model}${inquiry.listing.variant ? " " + inquiry.listing.variant : ""} ${inquiry.listing.year}`;
  const price = new Intl.NumberFormat("cs-CZ").format(inquiry.listing.price);

  return (
    <div className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Vehicle thumbnail */}
        {inquiry.listing.image && (
          <div className="hidden sm:block w-16 h-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
            <img src={inquiry.listing.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Top row: status + time */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              {inquiry.priority && inquiry.priority !== "NORMAL" && (
                <span className={`text-xs font-medium ${PRIORITY_COLORS[inquiry.priority] || ""}`}>
                  {inquiry.priority === "HIGH" ? "Vysoká priorita" : "Nízká priorita"}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400 shrink-0">{timeAgo(inquiry.createdAt)}</span>
          </div>

          {/* Contact info */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-gray-900">{inquiry.name}</span>
            {inquiry.phone && (
              <a href={`tel:${inquiry.phone}`} className="text-xs text-gray-500 hover:text-orange-500">
                {inquiry.phone}
              </a>
            )}
          </div>

          {/* Vehicle */}
          <Link href={`/moje-inzeraty/${inquiry.listing.id}`} className="text-xs text-gray-500 hover:text-orange-500 no-underline">
            {vehicleName} — {price} Kč
          </Link>

          {/* Message preview */}
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{inquiry.message}</p>

          {/* Reply preview */}
          {inquiry.reply && (
            <div className="mt-2 pl-3 border-l-2 border-orange-200">
              <p className="text-xs text-gray-500 line-clamp-1">Vaše odpověď: {inquiry.reply}</p>
            </div>
          )}

          {/* Viewing date */}
          {inquiry.viewingDate && (
            <div className="mt-1 text-xs text-purple-600">
              Prohlídka: {new Date(inquiry.viewingDate).toLocaleDateString("cs-CZ")}
              {inquiry.viewingResult && ` — ${inquiry.viewingResult === "INTERESTED" ? "Zájem" : inquiry.viewingResult === "THINKING" ? "Přemýšlí" : "Bez zájmu"}`}
            </div>
          )}

          {/* Note */}
          {inquiry.note && (
            <div className="mt-1 text-xs text-gray-400 italic">Poznámka: {inquiry.note}</div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {inquiry.phone && (
              <a
                href={`tel:${inquiry.phone}`}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition no-underline"
              >
                Zavolat
              </a>
            )}
            <button
              type="button"
              onClick={() => onReply(inquiry)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition"
            >
              Odpovědět
            </button>
            {inquiry.status === "REPLIED" && (
              <button
                type="button"
                onClick={() => {
                  const date = prompt("Datum prohlídky (YYYY-MM-DD):");
                  if (date) onStatusChange(inquiry.id, "VIEWING", new Date(date).toISOString());
                }}
                className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-md hover:bg-purple-100 transition"
              >
                Prohlídka
              </button>
            )}
            {inquiry.status === "VIEWING" && (
              <button
                type="button"
                onClick={() => onStatusChange(inquiry.id, "SOLD")}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition"
              >
                Prodáno
              </button>
            )}
            {!["SOLD", "CLOSED", "NO_INTEREST"].includes(inquiry.status) && (
              <button
                type="button"
                onClick={() => {
                  const note = prompt("Interní poznámka:", inquiry.note || "");
                  if (note !== null) onNoteChange(inquiry.id, note);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
              >
                Poznámka
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
