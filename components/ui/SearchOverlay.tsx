"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image?: string | null;
}

interface SearchCategory {
  key: string;
  label: string;
  icon: string;
  results: SearchResult[];
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<SearchCategory[]>;
  placeholder?: string;
}

export function SearchOverlay({ isOpen, onClose, onSearch, placeholder = "Hledat..." }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
    if (!isOpen) { setQuery(""); setCategories([]); }
  }, [isOpen]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setCategories([]); return; }
    setLoading(true);
    try {
      const results = await onSearch(q);
      setCategories(results);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [onSearch]);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const navigate = (path: string) => { onClose(); router.push(path); };

  const totalResults = categories.reduce((s, c) => s + c.results.length, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose}>
      <div className="fixed inset-x-0 top-0 bg-white pt-[env(safe-area-inset-top)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 h-14 px-4 max-w-lg mx-auto">
          <button onClick={onClose} className="p-1 text-gray-500 bg-transparent border-none cursor-pointer" aria-label="Zavrit">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {loading && <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />}
        </div>

        {query.length >= 2 && (
          <div className="border-t border-gray-100 max-h-[70vh] overflow-y-auto">
            <div className="max-w-lg mx-auto px-4 py-3">
              {totalResults === 0 && !loading ? (
                <div className="text-center text-gray-400 py-8 text-sm">
                  Zadne vysledky pro &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.filter(c => c.results.length > 0).map(cat => (
                    <div key={cat.key}>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {cat.label} ({cat.results.length})
                      </div>
                      <div className="space-y-1">
                        {cat.results.map(r => (
                          <button
                            key={r.id}
                            onClick={() => navigate(r.href)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-left transition-colors bg-transparent border-none cursor-pointer"
                          >
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden text-lg">
                              {r.image ? <img src={r.image} alt="" className="w-full h-full object-cover" /> : cat.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{r.title}</div>
                              <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
