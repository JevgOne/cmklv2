"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface VehicleResult {
  id: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  price: number;
  image: string | null;
}

interface ContactResult {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  totalVehicles: number;
}

interface ContractResult {
  id: string;
  type: string;
  sellerName: string;
  status: string;
  vehicle: string | null;
  createdAt: string;
}

interface SearchResults {
  vehicles: VehicleResult[];
  contacts: ContactResult[];
  contracts: ContractResult[];
}

interface AdminGlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminGlobalSearch({ isOpen, onClose }: AdminGlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const navigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const totalResults =
    (results?.vehicles.length || 0) +
    (results?.contacts.length || 0) +
    (results?.contracts.length || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose}>
      <div
        className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <svg
            className="w-5 h-5 text-gray-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Hledat vozidla, makléře, kontakty..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {loading && (
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] text-gray-400 bg-gray-100 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results && query.length >= 2 && (
          <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
            {totalResults === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                Žádné výsledky pro &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="space-y-4">
                {/* Vozidla */}
                {results.vehicles.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Vozidla ({results.vehicles.length})
                    </div>
                    <div className="space-y-1">
                      {results.vehicles.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => navigate(`/admin/vehicles/${v.id}`)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                            {v.image ? (
                              <img
                                src={v.image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5 text-gray-300"
                              >
                                <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 116 0h3.75a3 3 0 116 0H18a2.25 2.25 0 002.25-2.25V15H13.5z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {v.brand} {v.model} ({v.year})
                            </div>
                            <div className="text-xs text-gray-500">
                              {v.vin} · {v.price.toLocaleString("cs-CZ")} Kč
                            </div>
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            v.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : v.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-500"
                          }`}>
                            {v.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kontakty (prodejci) */}
                {results.contacts.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Kontakty ({results.contacts.length})
                    </div>
                    <div className="space-y-1">
                      {results.contacts.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => navigate(`/admin/users`)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                        >
                          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5 text-orange-400"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {c.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {c.phone}
                              {c.email ? ` · ${c.email}` : ""}
                              {c.city ? ` · ${c.city}` : ""}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Smlouvy */}
                {results.contracts.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Smlouvy ({results.contracts.length})
                    </div>
                    <div className="space-y-1">
                      {results.contracts.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => navigate(`/admin/vehicles`)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                        >
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5 text-blue-400"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {c.sellerName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {c.type === "BROKERAGE"
                                ? "Zprostředkovatelská"
                                : "Předávací protokol"}
                              {c.vehicle ? ` · ${c.vehicle}` : ""}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        {!results && (
          <div className="px-5 py-3 text-xs text-gray-400 text-center">
            Zadejte min. 2 znaky pro vyhledávání
          </div>
        )}
      </div>
    </div>
  );
}
