"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CommunicationTimeline } from "@/components/pwa/contacts/CommunicationTimeline";
import { CommunicationForm } from "@/components/pwa/contacts/CommunicationForm";
import { SmsTemplates } from "@/components/pwa/contacts/SmsTemplates";
import Link from "next/link";

interface ContactDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  note: string | null;
  totalVehicles: number;
  totalSold: number;
  lastContactAt: string | null;
  nextFollowUp: string | null;
  followUpNote: string | null;
  vehicles: Array<{
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    status: string;
    slug: string | null;
    city: string;
  }>;
  communications: Array<{
    id: string;
    type: string;
    direction: string | null;
    summary: string;
    duration: number | null;
    result: string | null;
    createdAt: string;
  }>;
}

const STATUS_LABELS: Record<string, { label: string; variant: "verified" | "pending" | "rejected" | "default" }> = {
  DRAFT: { label: "Koncept", variant: "default" },
  PENDING: { label: "Ceka", variant: "pending" },
  ACTIVE: { label: "Aktivni", variant: "verified" },
  RESERVED: { label: "Rezervovano", variant: "pending" },
  SOLD: { label: "Prodano", variant: "verified" },
  ARCHIVED: { label: "Archivovano", variant: "default" },
};

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCommForm, setShowCommForm] = useState(false);
  const [showSmsTemplates, setShowSmsTemplates] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchContact = useCallback(async () => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (res.ok) {
        setContact(await res.json());
      }
    } catch {
      // error handled by error.tsx
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  async function handleDelete() {
    if (!confirm("Opravdu smazat kontakt?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/makler/contacts");
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  }

  function handleCommSuccess() {
    setShowCommForm(false);
    fetchContact();
  }

  if (loading) {
    return (
      <div className="p-4 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-4 text-center py-20">
        <p className="text-gray-500">Kontakt nenalezen</p>
      </div>
    );
  }

  const isFollowUpDue =
    contact.nextFollowUp && new Date(contact.nextFollowUp) <= new Date();
  const successRate =
    contact.totalVehicles > 0
      ? Math.round((contact.totalSold / contact.totalVehicles) * 100)
      : 0;

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {contact.name}
          </h1>
          {contact.city && (
            <p className="text-sm text-gray-500 mt-1">{contact.city}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          Smazat
        </Button>
      </div>

      {/* Kontaktni info */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Telefon</div>
            <div className="font-semibold text-gray-900">{contact.phone}</div>
          </div>
          <div className="flex gap-1.5">
            <a
              href={`tel:${contact.phone}`}
              className="w-10 h-10 bg-success-50 text-success-500 rounded-lg flex items-center justify-center no-underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href={`sms:${contact.phone}`}
              className="w-10 h-10 bg-info-50 text-info-500 rounded-lg flex items-center justify-center no-underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.783.783 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href={`https://wa.me/${contact.phone.replace(/\s+/g, "").replace(/^\+/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center no-underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M16.555 3.444a9.964 9.964 0 00-7.072-2.93C4.723.514 1.005 4.23 1.005 8.989c0 1.493.39 2.952 1.13 4.237L1 19.486l6.39-1.676a9.922 9.922 0 004.096.896h.004c4.757 0 8.674-3.717 8.674-8.476a8.428 8.428 0 00-2.609-6.786z" />
              </svg>
            </a>
          </div>
        </div>

        {contact.email && (
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="font-semibold text-gray-900">{contact.email}</div>
          </div>
        )}

        {contact.address && (
          <div>
            <div className="text-sm text-gray-500">Adresa</div>
            <div className="font-semibold text-gray-900">{contact.address}</div>
          </div>
        )}

        {contact.note && (
          <div>
            <div className="text-sm text-gray-500">Poznamka</div>
            <div className="text-sm text-gray-700">{contact.note}</div>
          </div>
        )}
      </Card>

      {/* Statistiky */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <div className="text-2xl font-extrabold text-gray-900">
            {contact.totalVehicles}
          </div>
          <div className="text-xs text-gray-500">Nabrano aut</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-extrabold text-gray-900">
            {contact.totalSold}
          </div>
          <div className="text-xs text-gray-500">Prodano</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-extrabold text-gray-900">
            {successRate}%
          </div>
          <div className="text-xs text-gray-500">Uspesnost</div>
        </Card>
      </div>

      {/* Follow-up */}
      {(contact.nextFollowUp || isFollowUpDue) && (
        <Card className={`p-4 ${isFollowUpDue ? "ring-2 ring-error-500" : ""}`}>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
              Follow-up
            </h3>
            {isFollowUpDue && <Badge variant="rejected">Dnes!</Badge>}
          </div>
          <div className="text-sm text-gray-900">
            {new Date(contact.nextFollowUp!).toLocaleDateString("cs-CZ", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
          {contact.followUpNote && (
            <div className="text-sm text-gray-500 mt-1">
              {contact.followUpNote}
            </div>
          )}
        </Card>
      )}

      {/* Vozidla */}
      {contact.vehicles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            Vozidla ({contact.vehicles.length})
          </h3>
          {contact.vehicles.map((v) => {
            const statusInfo = STATUS_LABELS[v.status] ?? {
              label: v.status,
              variant: "default" as const,
            };
            return (
              <Link
                key={v.id}
                href={`/makler/vehicles/${v.id}`}
                className="block no-underline"
              >
                <Card hover className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-gray-900">
                        {v.brand} {v.model}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {v.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {v.price.toLocaleString("cs-CZ")} Kc
                      </span>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* SMS sablony */}
      <div>
        <button
          onClick={() => setShowSmsTemplates(!showSmsTemplates)}
          className="text-sm font-semibold text-orange-500 cursor-pointer bg-transparent border-none p-0"
        >
          {showSmsTemplates ? "Skryt SMS sablony" : "Zobrazit SMS sablony"}
        </button>
        {showSmsTemplates && (
          <div className="mt-3">
            <SmsTemplates
              contactName={contact.name}
              contactPhone={contact.phone}
              brokerName=""
            />
          </div>
        )}
      </div>

      {/* Komunikace */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            Komunikace
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCommForm(!showCommForm)}
          >
            {showCommForm ? "Zrusit" : "+ Pridat"}
          </Button>
        </div>

        {showCommForm && (
          <Card className="p-4">
            <CommunicationForm
              contactId={contact.id}
              onSuccess={handleCommSuccess}
              onCancel={() => setShowCommForm(false)}
            />
          </Card>
        )}

        <CommunicationTimeline communications={contact.communications} />
      </div>
    </div>
  );
}
