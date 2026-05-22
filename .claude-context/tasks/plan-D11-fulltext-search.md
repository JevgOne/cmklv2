# Plan D11 — Fulltext Search (Partner PWA + PWA-Parts)

**Datum:** 2026-04-11
**Agent:** Plánovač
**Zdroj:** plan-faze3-batch-a.md §2, codebase audit
**Effort:** ~4h
**DB migrace:** ŽÁDNÁ
**Nové dependencies:** ŽÁDNÉ

---

## §0 Executive summary

Ani Partner PWA ani PWA-Parts nemají search funkci. Makléřská PWA má `GlobalSearch.tsx` (297 lines) — full-screen overlay s debounced input, kategorized results, ESC/backdrop close. Tohle je proven pattern k adaptaci.

**Přístup:**
1. Vytvořit **generický `SearchOverlay`** v `components/ui/` — reusable pro obě PWA
2. Přidat **`?q=` search param** do existujících partner API routes (parts + vehicles)
3. Vytvořit **nový unified search endpoint** `/api/partner/search` pro overlay
4. Přidat **search button** do PartnerLayout top baru a SupplierTopBar
5. Přidat **lokální search input** na parts/vehicles list pages

**Pattern z GlobalSearch.tsx (proven):**
- `useState` + `useRef` + `useCallback` pro debounce
- 300ms debounce, min 2 znaky
- Full-screen overlay na mobilu
- `useRouter().push()` pro navigaci
- Kategorie výsledků s count labels

---

## §1 Soubory k vytvoření

### 1.1 `components/ui/SearchOverlay.tsx` (NEW, ~130 lines)

```tsx
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
  icon: string;   // emoji
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
        {/* Search input — EXACT PATTERN z GlobalSearch.tsx lines 112-143 */}
        <div className="flex items-center gap-3 h-14 px-4 max-w-lg mx-auto">
          <button onClick={onClose} className="p-1 text-gray-500 bg-transparent border-none cursor-pointer" aria-label="Zavrit">
            {/* Heroicons arrow-left (same SVG as GlobalSearch) */}
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

        {/* Results */}
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
```

**Klíčové:**
- Generický — `onSearch` callback vrací `SearchCategory[]`, overlay neví nic o business logice
- Vizuálně identický s GlobalSearch — full-screen overlay, arrow-back, debounce, loading spinner
- Emoji ikony v result items (fallback pokud chybí image)

---

### 1.2 `app/api/partner/search/route.ts` (NEW, ~70 lines)

```tsx
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const q = new URL(request.url).searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ vehicles: [], parts: [], leads: [], orders: [] });
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
    });

    if (session.user.role === "PARTNER_BAZAR") {
      const [vehicles, leads] = await Promise.all([
        prisma.vehicle.findMany({
          where: {
            brokerId: session.user.id,
            OR: [
              { brand: { contains: q, mode: "insensitive" } },
              { model: { contains: q, mode: "insensitive" } },
              { vin: { contains: q } },
            ],
          },
          select: { id: true, brand: true, model: true, year: true, price: true, status: true },
          take: 10,
        }),
        partner ? prisma.partnerLead.findMany({
          where: {
            partnerId: partner.id,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, phone: true, status: true },
          take: 5,
        }) : [],
      ]);

      return NextResponse.json({ vehicles, leads });
    } else {
      // PARTNER_VRAKOVISTE
      const [parts, orders] = await Promise.all([
        prisma.part.findMany({
          where: {
            supplierId: session.user.id,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { oemNumber: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, category: true, price: true, status: true, slug: true },
          take: 10,
        }),
        prisma.order.findMany({
          where: {
            items: { some: { supplierId: session.user.id } },
            orderNumber: { contains: q },
          },
          select: { id: true, orderNumber: true, status: true, totalPrice: true },
          take: 5,
        }),
      ]);

      return NextResponse.json({ parts, orders });
    }
  } catch (error) {
    console.error("GET /api/partner/search error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
```

**Poznámka:** `mode: "insensitive"` funguje na PostgreSQL — Prisma to přeloží na `ILIKE`. Pokud by nefungovalo (STOP-2), fallback je `$queryRawUnsafe` s `ILIKE`.

---

## §2 Soubory k editaci

### 2.1 `app/api/partner/parts/route.ts` — přidat `?q=` search (GET handler, line 18-22)

**Za řádek 21** (`if (status) where.status = status;`) přidat:

```tsx
const search = searchParams.get("q");
if (search && search.length >= 2) {
  where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { oemNumber: { contains: search, mode: "insensitive" } },
    { category: { contains: search, mode: "insensitive" } },
  ];
}
```

---

### 2.2 `app/api/partner/vehicles/route.ts` — přidat `?q=` search (GET handler, line 18-21)

**Za řádek 21** (`if (status) where.status = status;`) přidat:

```tsx
const search = searchParams.get("q");
if (search && search.length >= 2) {
  where.OR = [
    { brand: { contains: search, mode: "insensitive" } },
    { model: { contains: search, mode: "insensitive" } },
    { vin: { contains: search } },
  ];
}
```

---

### 2.3 `components/partner/PartnerLayout.tsx` — přidat search button + overlay (lines 1-8, 122-134)

**Přidat importy (line 1-8):**

```diff
  "use client";
  
- import { useState } from "react";
+ import { useState, useCallback } from "react";
  import Link from "next/link";
  import { usePathname } from "next/navigation";
  import { useSession, signOut } from "next-auth/react";
  import { cn } from "@/lib/utils";
  import { PartnerBottomNav } from "@/components/partner/PartnerBottomNav";
+ import { SearchOverlay } from "@/components/ui/SearchOverlay";
```

**Přidat state + search handler do component body (po line 42):**

```tsx
const [searchOpen, setSearchOpen] = useState(false);

const handleSearch = useCallback(async (q: string) => {
  const res = await fetch(`/api/partner/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();

  if (isVrakoviste) {
    return [
      { key: "parts", label: "Dily", icon: "🔧", results: (data.parts || []).map((p: { id: string; name: string; category: string; price: number; slug: string }) => ({
        id: p.id, title: p.name, subtitle: `${p.category} · ${p.price?.toLocaleString("cs-CZ")} Kc`, href: `/partner/parts/${p.id}`,
      }))},
      { key: "orders", label: "Objednavky", icon: "📦", results: (data.orders || []).map((o: { id: string; orderNumber: string; status: string; totalPrice: number }) => ({
        id: o.id, title: `#${o.orderNumber}`, subtitle: o.status, href: `/partner/orders/${o.id}`,
      }))},
    ];
  } else {
    return [
      { key: "vehicles", label: "Vozidla", icon: "🚗", results: (data.vehicles || []).map((v: { id: string; brand: string; model: string; year: number; price: number }) => ({
        id: v.id, title: `${v.brand} ${v.model} (${v.year})`, subtitle: `${v.price?.toLocaleString("cs-CZ")} Kc`, href: `/partner/vehicles/${v.id}`,
      }))},
      { key: "leads", label: "Zajemci", icon: "👥", results: (data.leads || []).map((l: { id: string; name: string; phone: string }) => ({
        id: l.id, title: l.name, subtitle: l.phone, href: `/partner/leads`,
      }))},
    ];
  }
}, [isVrakoviste]);
```

**Upravit mobile top bar (line 123-134) — přidat search button:**

```diff
  <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
-   <div className="flex items-center justify-center">
+   <div className="flex items-center justify-between">
+     <div className="w-8" /> {/* spacer */}
+     <div className="flex items-center">
        <img src="/brand/logo-dark.png" alt="CarMakler" className="h-7" />
        <span className="ml-2 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">PARTNER</span>
+     </div>
+     <button onClick={() => setSearchOpen(true)} className="p-1 text-gray-600 bg-transparent border-none cursor-pointer" aria-label="Hledat">
+       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
+         <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
+       </svg>
+     </button>
    </div>
  </header>
```

**Přidat SearchOverlay před closing `</div>` layoutu (před line 144):**

```tsx
<SearchOverlay
  isOpen={searchOpen}
  onClose={() => setSearchOpen(false)}
  onSearch={handleSearch}
  placeholder={isVrakoviste ? "Hledat dily, objednavky..." : "Hledat vozidla, zajemce..."}
/>
```

---

### 2.4 `components/pwa-parts/SupplierTopBar.tsx` — přidat search button (line 21-22)

**Přidat import + state + handler:**

```diff
  "use client";
  
  import { useOnlineStatusContext } from "@/components/pwa/OnlineStatusProvider";
+ import { useState, useCallback } from "react";
+ import { SearchOverlay } from "@/components/ui/SearchOverlay";
  
  export function SupplierTopBar() {
    const { isOnline } = useOnlineStatusContext();
+   const [searchOpen, setSearchOpen] = useState(false);
+ 
+   const handleSearch = useCallback(async (q: string) => {
+     const res = await fetch(`/api/partner/search?q=${encodeURIComponent(q)}`);
+     if (!res.ok) return [];
+     const data = await res.json();
+     return [
+       { key: "parts", label: "Dily", icon: "🔧", results: (data.parts || []).map((p: { id: string; name: string; category: string; price: number }) => ({
+         id: p.id, title: p.name, subtitle: p.category, href: `/parts/${p.id}`,
+       }))},
+       { key: "orders", label: "Objednavky", icon: "📦", results: (data.orders || []).map((o: { id: string; orderNumber: string; status: string }) => ({
+         id: o.id, title: `#${o.orderNumber}`, subtitle: o.status, href: `/parts/orders/${o.id}`,
+       }))},
+     ];
+   }, []);
```

**Přidat search button v "Right side" div (před online indicator, kolem line 22):**

```tsx
{/* Search button */}
<button onClick={() => setSearchOpen(true)} className="p-1 text-gray-600 bg-transparent border-none cursor-pointer" aria-label="Hledat">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
</button>
```

**Přidat SearchOverlay na konec return, před uzavírací `</header>`:**

```tsx
<SearchOverlay
  isOpen={searchOpen}
  onClose={() => setSearchOpen(false)}
  onSearch={handleSearch}
  placeholder="Hledat dily, objednavky..."
/>
```

---

### 2.5 `app/(partner)/partner/parts/page.tsx` — lokální search input

**Přidat search state (po existujících useState, kolem line 38):**

```tsx
const [search, setSearch] = useState("");
const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
```

**Přidat `useRef` do importu (line 1):**
```diff
- import { useEffect, useState } from "react";
+ import { useEffect, useState, useRef } from "react";
```

**Přidat `?q=` do fetch URL (line 44):**
```diff
- const res = await fetch(`/api/partner/parts?page=${page}`);
+ const res = await fetch(`/api/partner/parts?page=${page}${search ? `&q=${encodeURIComponent(search)}` : ""}`);
```

**Přidat `search` do useEffect dependency array a reset page on search:**

Aktuální useEffect (line 40):
```tsx
useEffect(() => {
  async function load() { ... }
  load();
}, [page]);
```

Změnit na:
```tsx
useEffect(() => {
  async function load() { ... }
  load();
}, [page, search]);
```

**Přidat search input nad list (v JSX, před kartami dílů):**

```tsx
<div className="mb-4">
  <input
    type="text"
    placeholder="Hledat dily..."
    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white"
    onChange={e => {
      const val = e.target.value;
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
    }}
  />
</div>
```

---

### 2.6 `app/(partner)/partner/vehicles/page.tsx` — lokální search input

**Stejný pattern jako 2.5:**
- Přidat `search` state + `useRef`
- Přidat `?q=` do fetch URL
- Přidat `search` do useEffect deps
- Přidat search input nad listingem

```diff
- const res = await fetch(`/api/partner/vehicles?page=${page}${status ? `&status=${status}` : ""}`);
+ const res = await fetch(`/api/partner/vehicles?page=${page}${status ? `&status=${status}` : ""}${search ? `&q=${encodeURIComponent(search)}` : ""}`);
```

---

## §3 Acceptance criteria

- [ ] Partner BAZAR: search overlay v top baru hledá vehicles (brand, model, vin) + leads (name, phone)
- [ ] Partner VRAKOVISTE: search overlay hledá parts (name, OEM, category) + orders (orderNumber)
- [ ] PWA-Parts: search button v SupplierTopBar, overlay funguje
- [ ] Klik na výsledek naviguje na detail stránku
- [ ] Lokální search na `/partner/parts` filtruje díly
- [ ] Lokální search na `/partner/vehicles` filtruje vozidla
- [ ] Debounce 300ms, min 2 znaky
- [ ] Loading spinner při hledání
- [ ] "Žádné výsledky" empty state
- [ ] ESC / backdrop click zavře overlay
- [ ] TypeScript: 0 errors
- [ ] Build: passes

## §4 STOP kritéria

- **STOP-1:** tsvector migration drift blokuje build → reset dev DB, NE řeš v produkci
- **STOP-2:** Prisma `mode: "insensitive"` nefunguje → fallback na `$queryRawUnsafe` s `ILIKE`
- **STOP-3:** SearchOverlay nefunguje na obou PWA současně → ověř že `onSearch` callback je prop-based, ne hardcoded
- **STOP-4:** PartnerLead model nemá `phone` nebo `email` field → ověř schema (má: name, phone, email, notes, status na lines ~1730+)
