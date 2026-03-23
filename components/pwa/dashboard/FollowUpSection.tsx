"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface FollowUpContact {
  id: string;
  name: string;
  phone: string;
  nextFollowUp: string;
  followUpNote: string | null;
}

export function FollowUpSection() {
  const [contacts, setContacts] = useState<FollowUpContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowUps() {
      try {
        const res = await fetch("/api/contacts?filter=follow_up&limit=3");
        if (res.ok) {
          const data = await res.json();
          setContacts(data.contacts ?? []);
        }
      } catch {
        // API nemusí být dostupné
      } finally {
        setLoading(false);
      }
    }
    fetchFollowUps();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          K follow-upu dnes
        </h3>
        <Badge variant="rejected">{contacts.length}</Badge>
      </div>

      {contacts.map((contact) => (
        <Link
          key={contact.id}
          href={`/makler/contacts/${contact.id}`}
          className="block no-underline"
        >
          <Card hover className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-gray-900">
                  {contact.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {contact.followUpNote || contact.phone}
                </div>
              </div>
              <a
                href={`tel:${contact.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 bg-success-50 text-success-500 rounded-lg flex items-center justify-center no-underline"
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
            </div>
          </Card>
        </Link>
      ))}

      <Link
        href="/makler/contacts?filter=follow_up"
        className="block text-center text-sm text-orange-500 font-semibold py-2 no-underline"
      >
        Všechny kontakty k follow-upu
      </Link>
    </div>
  );
}
