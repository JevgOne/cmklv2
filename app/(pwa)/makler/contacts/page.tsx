"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContactCard, ContactCardData } from "@/components/pwa/contacts/ContactCard";

const CONTACT_TABS = [
  { value: "all", label: "Všechny" },
  { value: "with_vehicle", label: "S vozem" },
  { value: "without_vehicle", label: "Bez vozu" },
  { value: "follow_up", label: "Follow-up" },
];

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [contacts, setContacts] = useState<ContactCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContacts = useCallback(async (filter: string, q?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);
      if (q) params.set("q", q);

      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts ?? []);
      } else {
        setContacts([]);
      }
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts(activeTab, searchQuery || undefined);
  }, [activeTab, fetchContacts, searchQuery]);

  function handleTabChange(value: string) {
    setActiveTab(value);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Kontakty</h1>
          <p className="text-sm text-gray-500 mt-1">
            CRM prodejců
          </p>
        </div>
        <Link href="/makler/contacts/new">
          <Button variant="primary" size="sm">
            + Přidat
          </Button>
        </Link>
      </div>

      <Input
        placeholder="Hledat jméno, telefon..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <Tabs
        tabs={CONTACT_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="overflow-x-auto"
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Žádné kontakty"
          description={
            activeTab === "follow_up"
              ? "Nemáte žádné kontakty k follow-upu."
              : "Zatím nemáte žádné kontakty prodejců."
          }
        />
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}
