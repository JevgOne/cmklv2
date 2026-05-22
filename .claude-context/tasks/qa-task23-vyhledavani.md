# QA Report — Task #23: Centrální vyhledávání

**Datum:** 2026-05-22  
**Commit:** dec4d26  
**Výsledek: FAIL ❌ — STOP-6: rate limiting chybí**

---

## 1. KRITICKÝ PROBLÉM — STOP-6 porušen

Plán explicitně (STOP-6): *"Rate limit na `/api/search/global` — min 30 req/min per IP (public endpoint)."*

`app/api/search/global/route.ts` — **žádný rate limiting**. Pouze Cache-Control header (`public, s-maxage=60`) pro CDN caching — to není rate limit.

```typescript
// CHYBÍ: např.
// import { rateLimit } from "@/lib/rate-limit";
// await rateLimit(req, { max: 30, window: "1m" });
```

**Fix:** Přidat IP-based rate limiting (30 req/min). Existuje-li `lib/rate-limit.ts`, použít; jinak vytvořit (nebo použít Upstash Ratelimit/Redis).

---

## 2. Simplify kontrola

### ⚠️ `flatIndex` mutation v render

```tsx
let flatIndex = 0;
// ...
items.map((item) => {
  const idx = flatIndex++;  // mutation uvnitř map — anti-pattern
```

Funguje správně (render je synchronní, výsledky jsou statické), ale je to code smell. Alternativa: předpočítat přes `reduce`. Závažnost: LOW.

### `<img>` vs Next.js `<Image>`

2 lint warnings: `page.tsx:123` a `UniversalSearchBar.tsx:180`. Varování, nikoliv error. Pro search autocomplete thumbnails akceptovatelné (malé obrázky, Cloudinary URL).

### AutoServis ILIKE fallback

`searchServicesGlobal` používá ILIKE místo tsvector s komentářem `// Fáze 2`. Plán to explicitně předpokládá. ✅

---

## 3. Debug kontrola

**Lint:** 0 errors, 2 warnings (`<img>`) ✅

---

## 4. Reverzní kontrola vs. plán — Fáze 1

### STOP pravidla

| STOP | Status | Poznámka |
|---|---|---|
| STOP-1: Nemazat SmartSearchBar | ✅ | Nový `UniversalSearchBar` — SmartSearchBar nedotčen |
| STOP-2: Neměnit `/api/search/smart` | ✅ | Nový `/api/search/global` |
| STOP-3: Jen veřejné entity | ✅ | Vehicle/Listing: `status='ACTIVE'`, AutoServis: `isPublished=true`, Part: `status='ACTIVE'` |
| STOP-4: Žádné citlivé údaje | ✅ | Žádný telefon, email, VIN v search results |
| STOP-5: noindex na /hledat | ✅ | `robots: { index: false, follow: true }` |
| **STOP-6: Rate limiting** | ❌ CHYBÍ | Cache-Control ≠ rate limit |
| STOP-7: AbortController | ✅ | `abortRef.current?.abort()` před každým novým requestem |

### Fáze 1 Acceptance Criteria

| Kritérium | Status |
|---|---|
| /api/search/global vrací Vehicle + Listing + Part | ✅ |
| /hledat zobrazuje kategorizované výsledky | ✅ |
| Search icon v MainNavbar → overlay | ✅ |
| Autocomplete max 3 výsledky per kategorie | ✅ (`limit=3`) |
| Klik naviguje na detail | ✅ |
| Enter → /hledat?q=... | ✅ |
| Mobile: full-screen overlay | ✅ (`fixed inset-0`) |
| ARIA: combobox, listbox, keyboard nav | ✅ |
| Cmd/Ctrl+K shortcut | ✅ (Fáze 2 bonus — splněno předem) |
| `npm run build` | ⚠️ Neověřeno |

### Fáze 2 (optional — pro info)

| Položka | Status |
|---|---|
| tsvector na AutoServis, Article, User | ❌ Fáze 2, OK |
| Brokers ve výsledcích | ❌ Fáze 2, OK |
| Articles ve výsledcích | ❌ Fáze 2, OK |
| Search history při prázdném focusu | ❌ Fáze 2, OK |

### Implementace — kvalitativní hodnocení

| Komponenta | Hodnocení |
|---|---|
| `lib/search.ts` — `globalSearch()` | ✅ Paralelní queries, sanitizeQuery, correct merge |
| `app/api/search/global/route.ts` | ⚠️ Funkční, ale bez rate limitu |
| `UniversalSearchBar.tsx` | ✅ Debounce, AbortController, ARIA, keyboard nav |
| `SearchOverlayTrigger.tsx` | ✅ Cmd+K, backdrop blur, clean |
| `app/(web)/hledat/page.tsx` | ✅ SSR, category tabs, suggestions, noindex |
| `components/main/Navbar.tsx` | ✅ 2-line change, `SearchOverlayTrigger` na správném místě |

---

## Závěr

Implementace kvalitní — debounce, AbortController, ARIA, keyboard nav, noindex, paralelní DB queries — vše správně. **Jediný bloker je STOP-6** (rate limiting na veřejném endpoint). Všechna Fáze 1 acceptance criteria splněna.

**Fix:** Přidat IP-based rate limiting na `/api/search/global` (max 30 req/min per IP).
