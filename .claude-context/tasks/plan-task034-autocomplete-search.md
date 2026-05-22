# Plan — Task #34: Autocomplete + Smart Search APIs

**Datum:** 2026-04-14
**Gap:** G-14 + G-18 (P1)
**Effort:** L (2-3 dny)

---

## 1. AKTUÁLNÍ STAV

- `lib/search.ts` — `smartSearch()` vrací `SearchResult[]` (id, type, title, subtitle, slug, price, image, rank)
- `getSearchSuggestions()` — vrací `string[]` (max 8), pg_trgm similarity + OEM union
- `SmartSearchBar.tsx` — debounce 200ms, keyboard nav, textové suggestions
- `GET /api/search/smart?q=XXX&suggestions=true` — unified endpoint

**Chybí:**
- Rich autocomplete previews (obrázky, ceny, sekce)
- NLP parsování ("brzdové destičky octavia 2017")
- Slovník synonym

---

## 2. GET /api/parts/autocomplete?q=XXX (NOVÝ)

**Soubor:** `app/api/parts/autocomplete/route.ts`

### Response:
```typescript
{
  sections: {
    parts: Array<{ id, name, slug, price, image?, manufacturer, stock }>;     // max 3
    categories: Array<{ slug, label, count }>;                                 // max 2
    vehicles: Array<{ brand, model, year?, count }>;                          // max 3
    oem: Array<{ number, partCount, cheapestPrice }>;                         // max 2
  };
  total: number;
}
```

### Implementace:

```typescript
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ sections: {}, total: 0 });

  const looksLikeOem = /^[A-Z0-9\s\-.]{4,}$/i.test(q);

  // Paralelní dotazy
  const [parts, categories, vehicles, oem] = await Promise.all([
    // Top 3 díly (fulltext + similarity)
    prisma.part.findMany({
      where: { status: "ACTIVE", name: { contains: q, mode: "insensitive" } },
      select: {
        id: true, name: true, slug: true, price: true,
        manufacturer: true, stock: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: { viewCount: "desc" },
      take: 3,
    }),

    // Top 2 kategorie s počtem dílů
    prisma.$queryRaw`
      SELECT category AS slug, COUNT(*) AS count
      FROM "Part"
      WHERE status = 'ACTIVE'
        AND (name ILIKE ${'%' + q + '%'} OR category ILIKE ${'%' + q + '%'})
      GROUP BY category
      ORDER BY count DESC
      LIMIT 2
    `,

    // Top 3 vozy (brand+model combinations)
    prisma.$queryRaw`
      SELECT "compatibleBrands"[1] AS brand,
             "compatibleModels"[1] AS model,
             COUNT(*) AS count
      FROM "Part"
      WHERE status = 'ACTIVE'
        AND ("compatibleBrands"::text ILIKE ${'%' + q + '%'}
             OR "compatibleModels"::text ILIKE ${'%' + q + '%'})
      GROUP BY "compatibleBrands"[1], "compatibleModels"[1]
      HAVING "compatibleBrands"[1] IS NOT NULL
      ORDER BY count DESC
      LIMIT 3
    `,

    // OEM čísla (pokud query vypadá jako OEM)
    looksLikeOem
      ? prisma.$queryRaw`
          SELECT "oemNumber" AS number, COUNT(*) AS "partCount",
                 MIN(price) AS "cheapestPrice"
          FROM "Part"
          WHERE status = 'ACTIVE' AND "oemNumber" IS NOT NULL
            AND UPPER(REPLACE(REPLACE("oemNumber", ' ', ''), '-', ''))
                ILIKE ${'%' + q.replace(/[\s\-.]/g, '').toUpperCase() + '%'}
          GROUP BY "oemNumber"
          ORDER BY "partCount" DESC
          LIMIT 2
        `
      : [],
  ]);

  return NextResponse.json({
    sections: { parts, categories, vehicles, oem },
    total: parts.length + categories.length + vehicles.length + oem.length,
  });
}
```

---

## 3. NLP SMART SEARCH

### 3a. Synonym dictionary

**Soubor:** `lib/search-synonyms.ts` (NOVÝ)

```typescript
export const PART_SYNONYMS: Record<string, string[]> = {
  "brzdové destičky": ["brzdové desky", "destičky", "brake pads"],
  "nárazník": ["naraznik", "bumper", "přední nárazník", "zadní nárazník"],
  "světlo": ["světla", "přední světlo", "zadní světlo", "headlight"],
  "zrcátko": ["zpětné zrcátko", "zrcadlo", "mirror"],
  "alternátor": ["dynamo", "alternator"],
  "startér": ["starter", "spouštěč"],
  // ... 50-100 entries
};

export const BRAND_SYNONYMS: Record<string, string> = {
  "škoda": "Skoda", "škoďák": "Skoda", "fabie": "Fabia",
  "okťávka": "Octavia", "octávka": "Octavia",
  "volkswagen": "Volkswagen", "vw": "Volkswagen", "volčák": "Volkswagen",
  "bmw": "BMW", "bavorák": "BMW",
  "mercedes": "Mercedes-Benz", "merc": "Mercedes-Benz",
  // ... 30-50 entries
};

export const CATEGORY_KEYWORDS: Record<string, string> = {
  "brzdy": "BRAKES", "brzdový": "BRAKES", "brzdové": "BRAKES",
  "motor": "ENGINE", "motorový": "ENGINE",
  "převodovka": "TRANSMISSION", "kvalt": "TRANSMISSION",
  "karoserie": "BODY", "karoserní": "BODY",
  "interiér": "INTERIOR", "sedačka": "INTERIOR",
  "elektro": "ELECTRICAL", "elektrický": "ELECTRICAL",
  "podvozek": "SUSPENSION", "tlumič": "SUSPENSION",
  "výfuk": "EXHAUST", "výfuková": "EXHAUST",
  "kolo": "WHEELS", "pneumatika": "WHEELS", "pneu": "WHEELS",
  "chlazení": "COOLING", "chladič": "COOLING",
  "palivo": "FUEL", "palivový": "FUEL",
};
```

### 3b. NLP Parser

**Soubor:** `lib/search-parser.ts` (NOVÝ)

```typescript
interface ParsedQuery {
  category?: string;     // BRAKES
  brand?: string;        // Skoda
  model?: string;        // Octavia
  year?: number;         // 2017
  keywords: string[];    // ["přední", "destičky"]
  oemNumber?: string;    // detected OEM
}

export function parseNaturalQuery(query: string): ParsedQuery {
  const tokens = query.toLowerCase().split(/\s+/);
  const result: ParsedQuery = { keywords: [] };

  for (const token of tokens) {
    // Rok
    if (/^(19|20)\d{2}$/.test(token)) {
      result.year = parseInt(token, 10);
      continue;
    }

    // Značka
    const brand = BRAND_SYNONYMS[token];
    if (brand && !result.brand) { result.brand = brand; continue; }

    // Kategorie
    const cat = CATEGORY_KEYWORDS[token];
    if (cat && !result.category) { result.category = cat; continue; }

    // OEM detekce
    if (/^[A-Z0-9\-.]{6,}$/i.test(token)) {
      result.oemNumber = token; continue;
    }

    result.keywords.push(token);
  }

  // Synonym expansion na keywords
  // ...

  return result;
}
```

### 3c. GET /api/parts/smart-search?q=XXX (NOVÝ)

**Soubor:** `app/api/parts/smart-search/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const parsed = parseNaturalQuery(q);

  // Sestavit Prisma where z parsed query
  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (parsed.category) where.category = parsed.category;
  if (parsed.brand) where.compatibleBrands = { has: parsed.brand };
  if (parsed.year) {
    where.compatibleYearFrom = { lte: parsed.year };
    where.compatibleYearTo = { gte: parsed.year };
  }
  if (parsed.keywords.length > 0) {
    where.name = { contains: parsed.keywords.join(" "), mode: "insensitive" };
  }
  if (parsed.oemNumber) {
    where.OR = [
      { oemNumber: { contains: parsed.oemNumber, mode: "insensitive" } },
      { partNumber: { contains: parsed.oemNumber, mode: "insensitive" } },
    ];
  }

  const parts = await prisma.part.findMany({
    where,
    include: { images: { where: { isPrimary: true }, take: 1 } },
    orderBy: { viewCount: "desc" },
    take: 20,
  });

  return NextResponse.json({
    parts,
    parsed, // vrátit parsed query pro UI (zobrazit "Hledáte: brzdy pro Škoda Octavia 2017")
    total: parts.length,
  });
}
```

---

## 4. SmartSearchBar UI UPGRADE

V `components/web/SmartSearchBar.tsx`:
- Fetch z `/api/parts/autocomplete` místo `/api/search/smart?suggestions=true`
- Zobrazit sekce: Díly (s obrázkem+cenou), Kategorie (s počtem), Vozy, OEM
- Max 12 řádků celkem
- Obrázek: 32x32 thumbnail vlevo

---

## 5. POŘADÍ

1. Synonym dictionary (`lib/search-synonyms.ts`)
2. NLP parser (`lib/search-parser.ts`)
3. Autocomplete API (`/api/parts/autocomplete`)
4. Smart search API (`/api/parts/smart-search`)
5. SmartSearchBar UI upgrade

## 6. COMMIT

```
feat: add rich autocomplete + NLP smart search with synonyms
```
