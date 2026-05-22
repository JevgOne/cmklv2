# Plan: Centrální vyhledávání přes celou platformu

**Task:** #22
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** New Feature (cross-platform search)
**Závažnost:** HIGH — UX + SEO + engagement

---

## 1. Aktuální stav

### Co existuje:

| Komponenta | Kde | Co prohledává | Technologie |
|-----------|-----|---------------|-------------|
| `SmartSearchBar` | `/dily` (eshop) | Parts, Listings | tsvector + pg_trgm |
| `GlobalSearch` | PWA makléř (TopBar) | Vehicles, Contacts, Contracts | Prisma `contains` |
| `AdminGlobalSearch` | Admin (AdminHeader) | Vehicles, Contacts, Contracts | Prisma `contains` |
| `SearchOverlay` | Partner PWA, PWA-Parts | Custom `onSearch` callback | Reusable overlay |
| `VehicleFilters` | `/nabidka` | Vehicles + Listings | URL params → Prisma |
| `PartsFilters` | `/dily/katalog` | Parts | URL params → Prisma |
| `PartsSearch` | `/dily` | Parts (brand/model dropdown) | Static data |

### Infrastruktura:

| Technologie | Stav | Detail |
|-------------|------|--------|
| PostgreSQL tsvector | ✅ Funkční | Vehicle, Listing, Part mají `searchVector` |
| GIN indexy | ✅ Funkční | searchVector + trigram na name/brand/model |
| pg_trgm | ✅ Funkční | `similarity()` pro fuzzy suggestions |
| `/api/search/smart` | ✅ Funkční | Fulltext přes Parts + Listings (NE Vehicles!) |
| `/api/search` | ✅ Funkční | Broker/admin search (VIN, brand, contacts) |
| Czech NLP parser | ✅ Funkční | `lib/search-parser.ts` — brand/model/year extraction |
| Czech synonyms | ✅ Funkční | `lib/search-synonyms.ts` — 40+ part + 30+ brand synonyms |
| Search history | ✅ Funkční | DB (per-user) + localStorage (guest) |

### Co CHYBÍ:

1. **Žádný centrální search** — uživatel nemůže hledat "přes všechno" z jednoho místa
2. **Search bar v hlavním Navbar NEEXISTUJE** — `MainNavbar` nemá žádný search input
3. **`/api/search/smart` neprohledává Vehicle** — jen Parts + Listings (Vehicle má tsvector ale není dotazován!)
4. **Žádná search stránka** — `/hledat?q=...` neexistuje
5. **AutoServis nemá tsvector** — nový model, chybí fulltext index
6. **Article (blog) nemá tsvector** — blog je prohledatelný jen přes title/slug
7. **Makléři (User) nejsou prohledatelní** — žádný public search endpoint
8. **Cross-subdomain search** — SmartSearchBar redirectuje na `/dily/katalog`, ne na centrální výsledky

---

## 2. Architektura centrálního vyhledávání

### Princip: Jeden search bar → kategorizované výsledky

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Hledat vozidla, díly, servisy, makléře...              │
│─────────────────────────────────────────────────────────────│
│                                                             │
│  Vozidla (3)                                                │
│  ┌─────┐ Škoda Octavia 1.6 TDI              249 000 Kč    │
│  │ img │ 2019 · 95 000 km · Diesel                         │
│  └─────┘                                                    │
│  ┌─────┐ Škoda Octavia Combi 2.0 TDI        289 000 Kč    │
│  │ img │ 2020 · 78 000 km · Diesel                         │
│  └─────┘                                                    │
│  → Zobrazit všechna vozidla (12)                           │
│                                                             │
│  Autodíly (2)                                               │
│  ┌─────┐ Brzdové destičky Octavia III        890 Kč       │
│  │ img │ Nové · Aftermarket                                │
│  └─────┘                                                    │
│  → Zobrazit všechny díly (8)                               │
│                                                             │
│  Autoservisy (1)                                            │
│  ┌─────┐ AutoPro Servis Praha               ★ 4.6 (23)    │
│  │ img │ Praha 5 · Autorizovaný servis Škoda               │
│  └─────┘                                                    │
│                                                             │
│  Makléři (1)                                                │
│  ┌─────┐ Jan Novák                          ★ 4.8          │
│  │ img │ Praha · Specialista na SUV                        │
│  └─────┘                                                    │
│                                                             │
│  Blog (2)                                                   │
│  📄 Jak vybrat správnou Škodu Octavii                      │
│  📄 STK pro rok 2026 — vše co potřebujete vědět           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Searchable entities:

| Entity | Model | tsvector | Indexed fields | Public URL |
|--------|-------|----------|----------------|------------|
| Vozidla (makléřská) | Vehicle | ✅ Existuje | brand (A), model (A), vin (B) | `/nabidka/[slug]` |
| Vozidla (inzerce) | Listing | ✅ Existuje | brand (A), model (A), variant (B), description (C) | `/nabidka/[slug]` |
| Autodíly | Part | ✅ Existuje | name (A), oemNumber (A), partNumber (B), description (C) | `/dily/katalog` → `/shop/dil/[slug]` |
| Autoservisy | AutoServis | ❌ PŘIDAT | name (A), city (A), categories (B), description (C) | `/autoservisy/[slug]` |
| Makléři | User | ❌ PŘIDAT | firstName+lastName (A), city (B), specializations (C) | `/profil/[slug]` |
| Blog | Article | ❌ PŘIDAT | title (A), excerpt (B), content (C) | `/blog/[slug]` |

---

## 3. Implementační plán

### Krok 1: Rozšířit tsvector na nové modely

**Soubor:** Nová migrace `prisma/migrations/XXXXXXXX_add_central_search_vectors/migration.sql`

```sql
-- AutoServis searchVector
ALTER TABLE "AutoServis" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
CREATE INDEX IF NOT EXISTS "AutoServis_searchVector_idx" ON "AutoServis" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "AutoServis_name_trgm_idx" ON "AutoServis" USING GIN ("name" gin_trgm_ops);

-- Article searchVector
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
CREATE INDEX IF NOT EXISTS "Article_searchVector_idx" ON "Article" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "Article_title_trgm_idx" ON "Article" USING GIN ("title" gin_trgm_ops);

-- User searchVector (jen pro makléře s profilem)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
CREATE INDEX IF NOT EXISTS "User_searchVector_idx" ON "User" USING GIN ("searchVector");

-- Triggers: AutoServis
CREATE OR REPLACE FUNCTION autoservis_search_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', COALESCE(NEW."name", '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW."city", '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(NEW."categories", ' '), '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW."description", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER autoservis_search_trigger
  BEFORE INSERT OR UPDATE ON "AutoServis"
  FOR EACH ROW EXECUTE FUNCTION autoservis_search_update();

-- Triggers: Article
CREATE OR REPLACE FUNCTION article_search_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', COALESCE(NEW."title", '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW."excerpt", '')), 'B') ||
    setweight(to_tsvector('simple', regexp_replace(COALESCE(NEW."content", ''), '<[^>]+>', ' ', 'g')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER article_search_trigger
  BEFORE INSERT OR UPDATE ON "Article"
  FOR EACH ROW EXECUTE FUNCTION article_search_update();

-- Triggers: User (makléři)
CREATE OR REPLACE FUNCTION user_search_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', COALESCE(NEW."firstName", '') || ' ' || COALESCE(NEW."lastName", '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW."city", '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW."bio", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_search_trigger
  BEFORE INSERT OR UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION user_search_update();

-- Backfill existing data
UPDATE "AutoServis" SET "name" = "name";
UPDATE "Article" SET "title" = "title";
UPDATE "User" SET "firstName" = "firstName";
```

**Prisma schema přidat:**

```prisma
// V model AutoServis:
searchVector Unsupported("tsvector")?

// V model Article:
searchVector Unsupported("tsvector")?

// V model User:
searchVector Unsupported("tsvector")?
```

### Krok 2: Nový API endpoint `/api/search/global`

**Soubor:** `app/api/search/global/route.ts` (NEW)

Tento endpoint nahrazuje/rozšiřuje `/api/search/smart` — prohledává VŠECHNY entity.

```typescript
// GET /api/search/global?q=...&limit=5&type=all|vehicles|parts|services|brokers|articles

interface GlobalSearchResponse {
  vehicles: SearchResultItem[];     // Vehicle + Listing (merged)
  parts: SearchResultItem[];        // Part
  services: SearchResultItem[];     // AutoServis
  brokers: SearchResultItem[];      // User (s profilem)
  articles: SearchResultItem[];     // Article (published)
  totalByType: Record<string, number>;
  suggestions: string[];
}

interface SearchResultItem {
  id: string;
  type: "vehicle" | "listing" | "part" | "service" | "broker" | "article";
  title: string;
  subtitle: string;
  url: string;
  image?: string | null;
  price?: number | null;
  rating?: number | null;
  rank: number;
  meta?: Record<string, string | number>; // Extra data (rok, km, město, ...)
}
```

**Logika:**
1. Sanitize query → tsquery format (`word:* & word:*`)
2. Paralelní `$queryRawUnsafe` na VŠECHNY tabulky s tsvector
3. Každý dotaz s `LIMIT 5` (top results per category)
4. Přidat Vehicle dotaz (teď chybí v smart search!)
5. Filter: Vehicles = `status: 'ACTIVE'`, Parts = `status: 'ACTIVE'`, AutoServis = `isPublished: true`, Article = `status: 'PUBLISHED'`, User = `role: 'BROKER'` AND `status: 'ACTIVE'` AND `slug IS NOT NULL`
6. Merge suggestions z pg_trgm přes všechny entity

**Rate limiting:** Debounce na frontendu (300ms), server-side rate limit 30 req/min per IP.

### Krok 3: Search results page `/hledat`

**Soubory:**

| Soubor | Typ | Detail |
|--------|-----|--------|
| `app/(web)/hledat/page.tsx` | NEW | Server component — SSR search results |
| `app/(web)/hledat/layout.tsx` | NEW | Layout s metadata |
| `app/(web)/hledat/loading.tsx` | NEW | Loading skeleton |

**URL:** `/hledat?q=škoda+octavia&typ=vse`

**Query parametry:**

| Param | Default | Hodnoty |
|-------|---------|---------|
| `q` | (required) | Search query |
| `typ` | `vse` | `vse`, `vozidla`, `dily`, `servisy`, `makleri`, `blog` |
| `page` | `1` | Pagination (jen pro single-type view) |

**Chování:**
- **`typ=vse`** (default): Zobrazí top 3-5 výsledků z každé kategorie + "Zobrazit vše (N)" link
- **`typ=vozidla`**: Zobrazí jen vozidla s paginací (18 per page)
- **Prázdný query**: Zobrazí trending queries + populární kategorie
- **Žádné výsledky**: "Nic jsme nenašli" + návrhy (pg_trgm suggestions) + populární kategorie

**SEO:**
- `<title>` = `"${query}" — Hledání | CarMakléř`
- `noindex` na search results (standard practice)
- Canonical: `/hledat?q=...` (bez page param)

### Krok 4: Univerzální SearchBar komponenta

**Soubor:** `components/web/UniversalSearchBar.tsx` (NEW)

Rozšíření SmartSearchBar o cross-entity autocomplete:

```
┌─────────────────────────────────────────────────┐
│ 🔍 Hledat vozidla, díly, servisy...            │
│─────────────────────────────────────────────────│
│                                                 │
│  VOZIDLA                                        │
│  🚗 Škoda Octavia 1.6 TDI · 249 000 Kč        │
│  🚗 Škoda Octavia Combi · 289 000 Kč           │
│                                                 │
│  AUTODÍLY                                       │
│  🔧 Brzdové destičky Octavia · 890 Kč          │
│                                                 │
│  SERVISY                                        │
│  🏪 AutoPro Servis Praha · ★ 4.6               │
│                                                 │
│  ─────────────────────────                      │
│  🔍 Zobrazit všechny výsledky pro "octavia"    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Chování:**
1. **Debounce 300ms**, min 2 znaky
2. Volá `/api/search/global?q=...&limit=3` (3 per category for autocomplete)
3. **Kategorizované výsledky** v dropdown (max 2-3 per type)
4. Klik na výsledek → navigace na detail
5. Enter / "Zobrazit všechny" → `/hledat?q=...`
6. **Keyboard navigation**: ArrowDown/Up přes výsledky, Enter
7. **ESC** zavře dropdown
8. **Mobile:** Na mobile se dropdown zobrazí jako full-screen overlay (reuse SearchOverlay pattern)
9. **ARIA:** combobox role, listbox, grouped options

**Klíčové rozhodnutí: SmartSearchBar vs UniversalSearchBar:**
- `SmartSearchBar` zůstane na `/dily` — specifický pro díly, redirectuje na `/dily/katalog`
- `UniversalSearchBar` bude v Navbar — cross-platform, redirectuje na `/hledat`
- Interně sdílí pattern (debounce, keyboard, ARIA) ale jiný API endpoint a jiný redirect

### Krok 5: Integrace do Navbar

**Soubory k editaci:**

| Soubor | Typ | Detail |
|--------|-----|--------|
| `components/main/Navbar.tsx` | EDIT | Přidat search icon/bar |
| `components/inzerce/Navbar.tsx` | EDIT | Přidat search icon |
| `components/shop/Navbar.tsx` | EDIT | Přidat search icon |
| `components/main/MobileMenu.tsx` | EDIT | Přidat search v mobile menu |

**Desktop layout (MainNavbar):**

```
[Logo] [Nabídka] [PlatformSwitcher] [Služby ▾] [O nás ▾]    [🔍] [🛒] [Login] [CTA]
```

**Dva přístupy:**

**A) Search icon → overlay (DOPORUČENO pro MVP):**
- Ikona lupy v nav bar → klik otevře UniversalSearchBar overlay (full-width pod navbarem)
- Méně vizuálního místa v navbaru
- Pattern: Sauto, Mobile.de, Autoscout24

**B) Inline search bar:**
- Permanentní search input přímo v navbaru
- Zabírá místo, vyžaduje responsive úpravy
- Pattern: Amazon, Google

**Doporučení:** Přístup A (icon → overlay). Navbar je už plný. Search overlay se ukáže po kliknutí na lupu.

**Mobile:**
- Search icon v mobile header → full-screen overlay (reuse SearchOverlay pattern)
- Prominentní pozice v mobile menu

### Krok 6: Rozšířit `lib/search.ts`

**Soubor:** `lib/search.ts` (EDIT) — přidat funkce pro global search

Přidat novou funkci `globalSearch()` která paralelně dotazuje všechny entity:

```typescript
export async function globalSearch(
  query: string,
  options: { limitPerType?: number; type?: string } = {}
): Promise<GlobalSearchResponse> {
  const { limitPerType = 5, type = "all" } = options;
  const tsQuery = sanitizeQuery(query);
  
  if (!tsQuery) return emptyResponse();

  // Parallel queries for all entity types
  const [vehicles, listings, parts, services, brokers, articles] = await Promise.all([
    type === "all" || type === "vehicles" ? searchVehicles(tsQuery, limitPerType) : [],
    type === "all" || type === "vehicles" ? searchListings(tsQuery, limitPerType) : [],
    type === "all" || type === "parts" ? searchParts(tsQuery, limitPerType) : [],
    type === "all" || type === "services" ? searchServices(tsQuery, limitPerType) : [],
    type === "all" || type === "brokers" ? searchBrokers(tsQuery, limitPerType) : [],
    type === "all" || type === "articles" ? searchArticles(tsQuery, limitPerType) : [],
  ]);

  // Merge vehicles + listings into one "vozidla" category, sort by rank
  const mergedVehicles = [...vehicles, ...listings]
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limitPerType);

  const suggestions = await getGlobalSuggestions(query);

  return {
    vehicles: mergedVehicles,
    parts,
    services,
    brokers,
    articles,
    totalByType: { /* counts */ },
    suggestions,
  };
}
```

**Nové privátní funkce:**
- `searchVehicles(tsQuery, limit)` — **NOVÁ** (chybí v aktuálním `smartSearch`!)
- `searchServices(tsQuery, limit)` — AutoServis
- `searchBrokers(tsQuery, limit)` — User (public brokers)
- `searchArticles(tsQuery, limit)` — Article (published)

Existující `searchParts()` a `searchListings()` extrahovat z `smartSearch()`.

### Krok 7: Rozšířit suggestions o nové entity

**Soubor:** `lib/search.ts` (EDIT)

Přidat `getGlobalSuggestions()` — rozšíření `getSearchSuggestions()`:

```typescript
export async function getGlobalSuggestions(query: string, limit = 8): Promise<string[]> {
  // Existující: Part name + Listing brand/model
  // Přidat: AutoServis name, User firstName+lastName, Article title
  // Všechny s similarity() > 0.15
  // UNION ALL, deduplicate, LIMIT 8
}
```

### Krok 8 (OPTIONAL): Cmd/Ctrl+K shortcut

Na webu přidat globální keyboard shortcut `Cmd+K` / `Ctrl+K` který otevře search overlay.

**Soubor:** `components/web/UniversalSearchBar.tsx` — globální `keydown` listener

Pattern: stejný jako `AdminGlobalSearch` (kde Cmd+K shortcut už existuje).

---

## 4. URL struktura

```
/hledat                     → Prázdný search (trending, populární)
/hledat?q=octavia           → Všechny výsledky pro "octavia"
/hledat?q=octavia&typ=vozidla → Jen vozidla pro "octavia" (s paginací)
/hledat?q=brzdové+destičky&typ=dily → Jen díly
/hledat?q=praha&typ=servisy  → Jen servisy v Praze
/hledat?q=novák&typ=makleri  → Makléři
/hledat?q=STK&typ=blog       → Blog články
```

---

## 5. Subdomain routing

**Klíčové rozhodnutí:** Search stránka `/hledat` je na HLAVNÍ doméně (`carmakler.cz/hledat`).

Výsledky obsahují cross-platform links:
- Vozidla → `/nabidka/[slug]` (main)
- Díly → link na `shop.carmakler.cz/dil/[slug]` (shop subdomain)
- Inzerce → link na `inzerce.carmakler.cz/inzerat/[slug]`
- Servisy → `/autoservisy/[slug]` (main)
- Makléři → `/profil/[slug]` (main)
- Blog → `/blog/[slug]` (main)

**Search v Navbar subdomain navbarů (Inzerce, Shop):**
- Search icon v InzerceNavbar/ShopNavbar → redirect na `carmakler.cz/hledat?q=...`
- Alternativa: každý subdomain má vlastní filter default (`typ=vozidla` pro inzerce, `typ=dily` pro shop)

---

## 6. Seznam souborů

### Krok 1 — DB migrace:

| Soubor | Typ | Detail |
|--------|-----|--------|
| `prisma/schema.prisma` | EDIT | +searchVector na AutoServis, Article, User |
| Nová migrace SQL | NEW | tsvector columns + triggers + GIN indexes + backfill |

### Krok 2 — API:

| Soubor | Typ | Detail |
|--------|-----|--------|
| `app/api/search/global/route.ts` | NEW | GET — cross-platform search endpoint |
| `lib/search.ts` | EDIT | +globalSearch(), +searchVehicles(), +searchServices(), +searchBrokers(), +searchArticles() |

### Krok 3 — Search page:

| Soubor | Typ | Detail |
|--------|-----|--------|
| `app/(web)/hledat/page.tsx` | NEW | SSR search results page |
| `app/(web)/hledat/layout.tsx` | NEW | Layout + metadata |
| `app/(web)/hledat/loading.tsx` | NEW | Loading skeleton |

### Krok 4 — UI komponenty:

| Soubor | Typ | Detail |
|--------|-----|--------|
| `components/web/UniversalSearchBar.tsx` | NEW | Cross-platform search bar + autocomplete dropdown |
| `components/web/SearchResults.tsx` | NEW | Kategorizované výsledky (reusable na stránce i v dropdown) |
| `components/web/SearchResultCard.tsx` | NEW | Karta výsledku (vozidlo/díl/servis/makléř/článek) |

### Krok 5 — Navbar integrace:

| Soubor | Typ | Detail |
|--------|-----|--------|
| `components/main/Navbar.tsx` | EDIT | +search icon + overlay trigger |
| `components/main/MobileMenu.tsx` | EDIT | +search v mobile menu |
| `components/inzerce/Navbar.tsx` | EDIT (optional) | +search icon |
| `components/shop/Navbar.tsx` | EDIT (optional) | +search icon |

### Celkem: 8 NEW + 5 EDIT

---

## 7. Prioritizace (fáze)

### Fáze 1 — MVP (MUST):

1. **Rozšířit `lib/search.ts`** — přidat Vehicle query (chybí!), refactor do `globalSearch()`
2. **`/api/search/global`** — nový endpoint
3. **`/hledat` stránka** — SSR results page s kategorizovanými výsledky
4. **`UniversalSearchBar`** — search bar s autocomplete
5. **Navbar integrace** — search icon v MainNavbar

### Fáze 2 — Enhancement (SHOULD):

6. **tsvector na AutoServis, Article, User** — migrace + triggers
7. **Rozšířit global search o nové entity** (servisy, makléři, blog)
8. **Cmd+K shortcut**
9. **Search history** — logování do SearchQuery + "Nedávno hledáno" v dropdown

### Fáze 3 — Polish (NICE-TO-HAVE):

10. **Inzerce/Shop navbar search** — cross-subdomain routing
11. **Trending queries** — populární hledání na prázdném search
12. **Search analytics** — dashboard v admin panelu
13. **Czech stemming** — `to_tsvector('czech', ...)` místo `'simple'` (vyžaduje `czech` dictionary)

---

## 8. Výkonnostní úvahy

### Problém: 6 paralelních SQL dotazů

Global search dotazuje 6 tabulek paralelně. To je OK pro:
- **Autocomplete** (limit 3 per type = 6 dotazů × max 3 rows = lehký load)
- **Full search** (limit 5 per type = 6 dotazů × max 5 rows)

### Optimalizace:

1. **`Promise.all()`** — paralelní execution minimalizuje latenci (nejpomalejší dotaz = celková doba)
2. **GIN indexy** — tsvector search je O(log n), ne O(n)
3. **LIMIT** — max 5 per type v "všechno" mode
4. **Debounce 300ms** na frontendu
5. **AbortController** — cancel previous request on new keystroke
6. **Cache-Control** — `s-maxage=60, stale-while-revalidate=300` na search results page (ISR pro SSR)

### Benchmark odhad:

| Akce | Očekávaná latence |
|------|-------------------|
| Autocomplete (6 × limit 3) | < 50ms |
| Full search (6 × limit 20) | < 150ms |
| Single-type paginated (limit 18) | < 50ms |

PostgreSQL fulltext s GIN indexy zvládá miliony řádků pod 10ms. S aktuálním objemem dat (stovky/tisíce záznamů) není performance concern.

---

## 9. STOP pravidla

- **STOP-1:** NESMÍ smazat ani přepsat `SmartSearchBar` — ten zůstane na `/dily` pro specifický díly search. Centrální search je NOVÝ komponent.
- **STOP-2:** NESMÍ měnit stávající `/api/search/smart` API — existující kód na něm závisí. Vytvořit NOVÝ `/api/search/global`.
- **STOP-3:** NESMÍ prohledávat neveřejné entity — Vehicle/Listing musí být `status: 'ACTIVE'`, User musí být `role: 'BROKER'` AND `status: 'ACTIVE'` AND `slug IS NOT NULL`, Article musí být `status: 'PUBLISHED'`, AutoServis musí být `isPublished: true`.
- **STOP-4:** NESMÍ vystavovat citlivé údaje ve výsledcích — žádné telefony, emaily, VIN v public search results.
- **STOP-5:** Search results stránka (`/hledat`) musí mít `<meta name="robots" content="noindex">` — search results se neindexují.
- **STOP-6:** Rate limit na `/api/search/global` — min 30 req/min per IP (public endpoint).
- **STOP-7:** AbortController na frontendu — MUSÍ cancelovat předchozí request při novém keystroke.

---

## 10. Acceptance Criteria

### Fáze 1:
- [ ] `/api/search/global?q=octavia` vrací výsledky z Vehicle + Listing + Part
- [ ] `/hledat?q=octavia` zobrazuje kategorizované výsledky
- [ ] Search icon v MainNavbar otevře search overlay
- [ ] Autocomplete ukazuje max 3 výsledky per kategorie
- [ ] Klik na výsledek naviguje na detail
- [ ] Enter přesměruje na `/hledat?q=...`
- [ ] Mobile: search funguje jako full-screen overlay
- [ ] ARIA: combobox, listbox, keyboard navigation
- [ ] `npm run build` projde

### Fáze 2:
- [ ] AutoServis, Article, User mají tsvector + GIN indexy
- [ ] Search vrací výsledky ze VŠECH 6 kategorií
- [ ] Cmd/Ctrl+K otevře search
- [ ] Search history se zobrazuje při prázdném focusu

### Performance:
- [ ] Autocomplete response < 100ms (P95)
- [ ] Full search response < 200ms (P95)
- [ ] No N+1 queries
- [ ] AbortController cancels stale requests
