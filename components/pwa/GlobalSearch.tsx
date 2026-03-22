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

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

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
      // Tiché selhání
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      search(value);
    }, 300);
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
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose}>
      <div
        className="fixed inset-x-0 top-0 bg-white pt-[env(safe-area-inset-top)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 h-14 px-4 max-w-lg mx-auto">
          <button
            onClick={onClose}
            className="p-1 text-gray-500"
            aria-label="Zavřít"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Hledat vozidla, kontakty, smlouvy..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {loading && (
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Results */}
        {results && query.length >= 2 && (
          <div className="border-t border-gray-100 max-h-[70vh] overflow-y-auto">
            <div className="max-w-lg mx-auto px-4 py-3">
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
                            onClick={() => navigate(`/makler/vehicles/${v.id}`)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-left transition-colors"
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
                                {v.price.toLocaleString("cs-CZ")} Kč
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kontakty */}
                  {results.contacts.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Kontakty ({results.contacts.length})
                      </div>
                      <div className="space-y-1">
                        {results.contacts.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => navigate(`/makler/contacts/${c.id}`)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-left transition-colors"
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
                            onClick={() =>
                              navigate(`/makler/contracts/${c.id}`)
                            }
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-left transition-colors"
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
          </div>
        )}
      </div>
    </div>
  );
}
