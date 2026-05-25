"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  image?: string | null;
  price?: number | null;
  rating?: number | null;
}

interface SearchResults {
  vehicles: SearchItem[];
  parts: SearchItem[];
  services: SearchItem[];
  articles: SearchItem[];
  suggestions?: string[];
}

const TYPE_LABELS: Record<string, string> = {
  vehicles: "Vozidla",
  parts: "Autodíly",
  services: "Autoservisy",
  articles: "Články",
};

export function UniversalSearchBar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Cmd+K / Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Debounced fetch — STOP-7: AbortController
  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/search/global?q=${encodeURIComponent(q)}&limit=3`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setActiveIndex(-1);
      }
    } catch {
      // aborted or network error — ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchResults(query), 300);
    return () => clearTimeout(timeout);
  }, [query, fetchResults]);

  // Flatten results for keyboard nav
  const allItems: SearchItem[] = results
    ? [...results.vehicles, ...results.parts, ...results.services, ...results.articles]
    : [];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < allItems.length) {
        router.push(allItems[activeIndex].url);
        onClose?.();
      } else {
        router.push(`/hledat?q=${encodeURIComponent(query)}`);
        onClose?.();
      }
    }
  }

  const hasResults = results && (results.vehicles.length > 0 || results.parts.length > 0 || results.services.length > 0 || results.articles.length > 0);
  let flatIndex = 0;

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto" role="combobox" aria-expanded={!!hasResults} aria-haspopup="listbox" aria-controls="search-results">
      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hledat vozidla, díly, servisy..."
          className="w-full pl-12 pr-4 py-4 text-base bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition"
          aria-autocomplete="list"
          aria-controls="search-results"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {hasResults && (
        <div
          id="search-results"
          role="listbox"
          className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-[70vh] overflow-y-auto"
        >
          {(["vehicles", "parts", "services", "articles"] as const).map((category) => {
            const items = results[category];
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50">
                  {TYPE_LABELS[category]}
                </div>
                {items.map((item) => {
                  const idx = flatIndex++;
                  return (
                    <Link
                      key={item.id}
                      href={item.url}
                      onClick={() => onClose?.()}
                      role="option"
                      aria-selected={activeIndex === idx}
                      className={`flex items-center gap-3 px-4 py-3 no-underline transition ${
                        activeIndex === idx ? "bg-orange-50" : "hover:bg-gray-50"
                      }`}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover shrink-0 bg-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-lg">
                          {item.type === "vehicle" || item.type === "listing" ? "🚗" : item.type === "part" ? "🔧" : item.type === "article" ? "📝" : "🏪"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                      </div>
                      {item.price != null && (
                        <span className="text-sm font-bold text-gray-900 shrink-0">
                          {item.price.toLocaleString("cs-CZ")} Kč
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {/* Show all results link */}
          <Link
            href={`/hledat?q=${encodeURIComponent(query)}`}
            onClick={() => onClose?.()}
            className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-orange-600 bg-gray-50 no-underline hover:bg-orange-50 transition border-t border-gray-100 ${
              activeIndex === allItems.length ? "bg-orange-50" : ""
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Zobrazit všechny výsledky pro &quot;{query}&quot;
          </Link>
        </div>
      )}

      {/* No results */}
      {results && !hasResults && query.length >= 2 && !loading && (
        <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-6 text-center">
          <p className="text-gray-500 text-sm">
            Žádné výsledky pro &quot;{query}&quot;
          </p>
          {results.suggestions && results.suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Zkuste:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {results.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
