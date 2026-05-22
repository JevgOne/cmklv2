# Plan P2-05: Smart Search + Autocomplete

**Priorita:** P2 (TOP 5 pro launch)
**Slozitost:** L
**Zavislosti:** P0-08 (PostgreSQL — HOTOVO)
**Duvod vyberu:** UX — lepsi vyhledavani = vice prodeje. Aktualni search pouziva Prisma `contains` (pomaly substring match bez relevance). Pro e-shop s 1000+ dily je fulltext nutnost.

---

## Cil

Implementovat PostgreSQL full-text search s relevancnim razenim a autocomplete suggestions. Jednotny search endpoint pro vsechny entity (dily, vozidla, inzeraty).

---

## Analyza aktualniho stavu

### Aktualni vyhledavani — Prisma `contains`

**Dily** (`app/api/parts/route.ts`, radky 122-129):
```ts
if (filters.search) {
  where.OR = [
    { name: { contains: filters.search } },
    { description: { contains: filters.search } },
    { oemNumber: { contains: filters.search } },
    { partNumber: { contains: filters.search } },
  ];
}
```

**Vozidla** (`app/api/vehicles/route.ts`) — ZADNY textovy search! Jen filtry (brand, model, fuelType...).

**Inzeraty** (`app/api/listings/route.ts`) — ZADNY textovy search! Jen filtry.

**GlobalSearch PWA** (`app/api/search/route.ts`, 140 radku) — multi-entity search pres VIN, brand, model, name, phone. Pouziva `contains`.

### Problemy aktualniho pristupu

1. **Bez relevance** — `contains` vraci vysledky bez razeni dle shody
2. **Pomaly na velkem datasetu** — substring match nemuze pouzit index
3. **Bez fuzzy matchingu** — "brzdova destick" nenajde "brzdova desticka"
4. **Bez autocomplete** — zadne suggestions behem psani
5. **Rozdeleny search** — kazda entita ma vlastni endpoint
6. **Bez word boundary** — "Golf" v `contains` najde i "Volkswagen Golf GTI" ale i "golfovy"

### PostgreSQL fulltext moznosti

PostgreSQL ma nativni fulltext search:
- `tsvector` — indexovany typ pro fulltext
- `tsquery` — queryovaci typ
- `ts_rank` — relevancni skore
- GIN index — rychle vyhledavani
- Cesky slovnik: `czech` (stemming, stop words)

---

## Kroky implementace

### Krok 1: Pridat tsvector pole do schema

**Soubor:** `prisma/schema.prisma`

Prisma nema nativni podporu pro `tsvector`. Pouzijeme raw SQL migraci.

**Part model — pridat unsupported pole:**
```diff
 model Part {
   name         String
   description  String?
   oemNumber    String?
   partNumber   String?
+
+  // Fulltext search (generovany z name + description + oemNumber + partNumber)
+  searchVector Unsupported("tsvector")?
```

**Vehicle model — shodne:**
```diff
 model Vehicle {
   brand        String
   model        String
   vin          String?
+
+  searchVector Unsupported("tsvector")?
```

**Listing model — shodne:**
```diff
 model Listing {
   brand        String?
   model        String?
   title        String?
   description  String?
+
+  searchVector Unsupported("tsvector")?
```

### Krok 2: Vytvorit migraci s tsvector a triggery

**Migrace:** `npx prisma migrate dev --name add_fulltext_search --create-only`

Potom rucne upravit SQL migraci:

```sql
-- Part: searchVector
ALTER TABLE "Part" ADD COLUMN "searchVector" tsvector;

UPDATE "Part" SET "searchVector" = 
  setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("oemNumber", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("partNumber", '')), 'B') ||
  setweight(to_tsvector('simple', coalesce("description", '')), 'C');

CREATE INDEX "Part_searchVector_idx" ON "Part" USING GIN ("searchVector");

-- Trigger pro automaticke aktualizace
CREATE OR REPLACE FUNCTION part_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW."name", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."oemNumber", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."partNumber", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW."description", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER part_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "name", "oemNumber", "partNumber", "description"
  ON "Part"
  FOR EACH ROW
  EXECUTE FUNCTION part_search_vector_update();

-- Vehicle: searchVector
ALTER TABLE "Vehicle" ADD COLUMN "searchVector" tsvector;

UPDATE "Vehicle" SET "searchVector" = 
  setweight(to_tsvector('simple', coalesce("brand", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("model", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("vin", '')), 'B');

CREATE INDEX "Vehicle_searchVector_idx" ON "Vehicle" USING GIN ("searchVector");

CREATE OR REPLACE FUNCTION vehicle_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW."brand", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."model", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."vin", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "brand", "model", "vin"
  ON "Vehicle"
  FOR EACH ROW
  EXECUTE FUNCTION vehicle_search_vector_update();

-- Listing: searchVector
ALTER TABLE "Listing" ADD COLUMN "searchVector" tsvector;

UPDATE "Listing" SET "searchVector" = 
  setweight(to_tsvector('simple', coalesce("brand", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("model", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("title", '')), 'B') ||
  setweight(to_tsvector('simple', coalesce("description", '')), 'C');

CREATE INDEX "Listing_searchVector_idx" ON "Listing" USING GIN ("searchVector");

CREATE OR REPLACE FUNCTION listing_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW."brand", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."model", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."title", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW."description", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "brand", "model", "title", "description"
  ON "Listing"
  FOR EACH ROW
  EXECUTE FUNCTION listing_search_vector_update();

-- Trigram index pro fuzzy matching (prefix search, autocomplete)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Part_name_trgm_idx" ON "Part" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Vehicle_brand_trgm_idx" ON "Vehicle" USING GIN ("brand" gin_trgm_ops);
CREATE INDEX "Vehicle_model_trgm_idx" ON "Vehicle" USING GIN ("model" gin_trgm_ops);
```

**Pozn.:** Pouzivame `'simple'` konfiguraci misto `'czech'` protoze cesky slovnik nemusi byt na vsech PostgreSQL instancich. `simple` tokenizuje bez stemmingu — staci pro zakladni search. Pokud je k dispozici `czech`, lze zmenit.

Spustit migraci: `npx prisma migrate dev`

### Krok 3: Vytvorit search helper

**Soubor:** `lib/search.ts` (NOVY)

```ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Fulltext search pres PostgreSQL tsvector
 */
export async function searchParts(query: string, limit: number = 20) {
  // Escapovat specialni znaky a pridat prefix matching
  const sanitized = query.replace(/[^\w\s]/g, "").trim();
  if (!sanitized) return [];

  // Prefix match: "brzdov" → "brzdov:*"
  const tsQuery = sanitized
    .split(/\s+/)
    .map((word) => `${word}:*`)
    .join(" & ");

  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      slug: string;
      price: number;
      condition: string;
      partType: string;
      imageUrl: string | null;
      rank: number;
    }>
  >`
    SELECT 
      p.id, p.name, p.slug, p.price, p.condition, p."partType",
      (SELECT pi.url FROM "PartImage" pi WHERE pi."partId" = p.id AND pi."isPrimary" = true LIMIT 1) as "imageUrl",
      ts_rank(p."searchVector", to_tsquery('simple', ${tsQuery})) as rank
    FROM "Part" p
    WHERE p."searchVector" @@ to_tsquery('simple', ${tsQuery})
      AND p.status = 'ACTIVE'
      AND p.stock > 0
    ORDER BY rank DESC, p."viewCount" DESC
    LIMIT ${limit}
  `;

  return results;
}

export async function searchVehicles(query: string, limit: number = 20) {
  const sanitized = query.replace(/[^\w\s]/g, "").trim();
  if (!sanitized) return [];

  const tsQuery = sanitized
    .split(/\s+/)
    .map((word) => `${word}:*`)
    .join(" & ");

  return prisma.$queryRaw<
    Array<{
      id: string;
      brand: string;
      model: string;
      year: number;
      price: number;
      slug: string;
      imageUrl: string | null;
      rank: number;
    }>
  >`
    SELECT 
      v.id, v.brand, v.model, v.year, v.price, v.slug,
      (SELECT vi.url FROM "VehicleImage" vi WHERE vi."vehicleId" = v.id AND vi."isPrimary" = true LIMIT 1) as "imageUrl",
      ts_rank(v."searchVector", to_tsquery('simple', ${tsQuery})) as rank
    FROM "Vehicle" v
    WHERE v."searchVector" @@ to_tsquery('simple', ${tsQuery})
      AND v.status = 'ACTIVE'
    ORDER BY rank DESC
    LIMIT ${limit}
  `;
}

/**
 * Autocomplete suggestions (prefix match pres trigram)
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 5
): Promise<string[]> {
  const sanitized = query.replace(/[^\w\s]/g, "").trim();
  if (sanitized.length < 2) return [];

  // Ziskat unikatni nazvy dilu podobne query
  const suggestions = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT DISTINCT name
    FROM "Part"
    WHERE name ILIKE ${`%${sanitized}%`}
      AND status = 'ACTIVE'
    ORDER BY similarity(name, ${sanitized}) DESC
    LIMIT ${limit}
  `;

  return suggestions.map((s) => s.name);
}
```

### Krok 4: Vytvorit API endpoint

**Soubor:** `app/api/search/smart/route.ts` (NOVY)

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchParts, searchVehicles, getSearchSuggestions } from "@/lib/search";

const searchSchema = z.object({
  q: z.string().min(2).max(100),
  type: z.enum(["all", "parts", "vehicles"]).default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  suggestions: z.coerce.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const { q, type, limit, suggestions: wantSuggestions } = searchSchema.parse(params);

    // Suggestions mode — rychly autocomplete
    if (wantSuggestions) {
      const suggestions = await getSearchSuggestions(q);
      return NextResponse.json({ suggestions });
    }

    // Full search
    const results: Record<string, unknown[]> = {};

    if (type === "all" || type === "parts") {
      results.parts = await searchParts(q, limit);
    }

    if (type === "all" || type === "vehicles") {
      results.vehicles = await searchVehicles(q, limit);
    }

    return NextResponse.json({
      query: q,
      results,
      total: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
    });
  } catch (error) {
    console.error("GET /api/search/smart error:", error);
    return NextResponse.json({ error: "Interni chyba" }, { status: 500 });
  }
}
```

### Krok 5: Vytvorit SearchBar komponentu s autocomplete

**Soubor:** `components/web/SmartSearchBar.tsx` (NOVY)

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";

export function SmartSearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/smart?q=${encodeURIComponent(query)}&suggestions=true`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setIsOpen(true);
        }
      } catch { /* ignore */ }
    }, 200); // 200ms debounce

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSubmit = (searchQuery?: string) => {
    const q = searchQuery || query;
    if (q.trim().length >= 2) {
      setIsOpen(false);
      router.push(`/dily/katalog?search=${encodeURIComponent(q.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0) {
        handleSubmit(suggestions[selectedIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        placeholder="Hledat dily, OEM cisla..."
        aria-label="Vyhledavani"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        role="combobox"
      />

      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-50"
        >
          {suggestions.map((suggestion, i) => (
            <li
              key={suggestion}
              role="option"
              aria-selected={i === selectedIndex}
              className={`px-4 py-2 cursor-pointer text-sm ${
                i === selectedIndex ? "bg-orange-50 text-orange-700" : "hover:bg-gray-50"
              }`}
              onClick={() => handleSubmit(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Krok 6: Upravit existujici search v API

**Soubor:** `app/api/parts/route.ts`

Nahradit `contains` search za fulltext:

```diff
 if (filters.search) {
-  where.OR = [
-    { name: { contains: filters.search } },
-    { description: { contains: filters.search } },
-    { oemNumber: { contains: filters.search } },
-    { partNumber: { contains: filters.search } },
-  ];
+  // Pouzit fulltext search s relevancnim razenim
+  const sanitized = filters.search.replace(/[^\w\s]/g, "").trim();
+  if (sanitized) {
+    const tsQuery = sanitized.split(/\s+/).map(w => `${w}:*`).join(" & ");
+    // Fallback: pokud fulltext nic nenajde, zkusit ILIKE
+    where.OR = [
+      { searchVector: { search: tsQuery } },
+      { name: { contains: filters.search, mode: "insensitive" } },
+      { oemNumber: { contains: filters.search, mode: "insensitive" } },
+    ];
+  }
 }
```

Pozn.: Prisma 5+ podporuje `search` operaci na fulltext poli. Pokud ne, pouzit `$queryRaw`.

### Krok 7: Integrace na homepage a katalog

**E-shop homepage** (`app/(web)/dily/page.tsx`):
- Nahradit existujici PartsSearch za SmartSearchBar (nebo pridat vedle)

**Katalog** (`app/(web)/dily/katalog/page.tsx`):
- Precist `search` query param z URL
- Pouzit pro initialn query

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `prisma/schema.prisma` | Pridat searchVector Unsupported("tsvector") na Part, Vehicle, Listing |
| SQL migrace | tsvector pole, GIN indexy, triggery, pg_trgm extension |
| `lib/search.ts` | NOVY — fulltext search helper funkce |
| `app/api/search/smart/route.ts` | NOVY — smart search endpoint |
| `components/web/SmartSearchBar.tsx` | NOVY — search bar s autocomplete |
| `app/api/parts/route.ts` | Nahradit contains za fulltext |
| `app/(web)/dily/page.tsx` | Integrace SmartSearchBar |
| `app/(web)/dily/katalog/page.tsx` | Podpora search query parametru |

## Bezpecnostni opatreni

1. **SQL injection prevence:** Pouzit Prisma `$queryRaw` s template literals (automaticky escaped)
2. **Input sanitizace:** Odstranit specialni znaky z query pred vytvorenim tsquery
3. **Rate limiting:** Search endpoint by mel mit rate limit (10 req/s per IP)
4. **Max delka query:** Omezit na 100 znaku

## Overeni

- [ ] `pg_trgm` extension nainstalovana v PostgreSQL
- [ ] tsvector pole vyplnena pro existujici zaznamy (migration UPDATE)
- [ ] Triggery automaticky aktualizuji searchVector pri INSERT/UPDATE
- [ ] GIN index existuje na vsech searchVector polich
- [ ] `GET /api/search/smart?q=brzdov` vraci relevantni dily s rankem
- [ ] Autocomplete suggestions funguji (min 2 znaky, 200ms debounce)
- [ ] SmartSearchBar ma ARIA atributy (combobox, listbox, option)
- [ ] Klavesnicova navigace v suggestions (sipky, Enter, Escape)
- [ ] Fallback na ILIKE pokud fulltext nic nenajde
- [ ] Existujici PartsSearch (brand/model/year selecty) funguje beze zmeny
- [ ] Build prochazi
- [ ] Migrace projde
