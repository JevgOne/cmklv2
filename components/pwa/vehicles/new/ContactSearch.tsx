"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { getDB } from "@/lib/offline/db";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface ContactSearchProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contact: Contact) => void;
}

export function ContactSearch({ open, onClose, onSelect }: ContactSearchProps) {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadContacts();
  }, [open]);

  async function loadContacts() {
    setLoading(true);
    try {
      const db = await getDB();
      const allContacts = await db.getAll("contacts");
      setContacts(
        allContacts.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
        }))
      );
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = query.trim()
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.phone.includes(query)
      )
    : contacts;

  return (
    <Modal open={open} onClose={onClose} title="Hledat kontakt">
      <div className="space-y-4">
        <Input
          placeholder="Jméno nebo telefon..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            {query.trim()
              ? "Žádný kontakt nenalezen"
              : "Zatím žádné uložené kontakty"}
          </p>
        ) : (
          <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {filtered.map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  onSelect(contact);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{contact.name}</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {contact.phone}
                  {contact.email && ` · ${contact.email}`}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
