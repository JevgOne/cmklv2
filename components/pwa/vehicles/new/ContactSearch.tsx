"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [localContacts, setLocalContacts] = useState<Contact[]>([]);
  const [apiContacts, setApiContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadContacts() {
    setLoading(true);
    try {
      const db = await getDB();
      const allContacts = await db.getAll("contacts");
      setLocalContacts(
        allContacts.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
        }))
      );
    } catch {
      setLocalContacts([]);
    } finally {
      setLoading(false);
    }
  }

  const searchAPI = useCallback(async (q: string) => {
    if (!navigator.onLine || q.length < 2) {
      setApiContacts([]);
      return;
    }
    try {
      const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setApiContacts(
          (data.contacts ?? []).map((c: Contact) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
          }))
        );
      }
    } catch {
      // API unavailable — local results only
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setApiContacts([]);
      return;
    }
    const timer = setTimeout(() => searchAPI(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query, searchAPI]);

  // Merge local + API results, deduplicate by id
  const mergedContacts = (() => {
    const localFiltered = query.trim()
      ? localContacts.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.phone.includes(query)
        )
      : localContacts;

    const seen = new Set(localFiltered.map((c) => c.id));
    const merged = [...localFiltered];
    for (const c of apiContacts) {
      if (!seen.has(c.id)) {
        merged.push(c);
        seen.add(c.id);
      }
    }
    return merged;
  })();

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
        ) : mergedContacts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            {query.trim()
              ? "Žádný kontakt nenalezen"
              : "Zatím žádné uložené kontakty"}
          </p>
        ) : (
          <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {mergedContacts.map((contact) => (
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
