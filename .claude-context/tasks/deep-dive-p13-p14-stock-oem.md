# Deep Dive P1-3 + P1-4: Stock Alerts + OEM Lookup

**Datum:** 2026-04-13
**Autor:** Plánovač
**Pro:** Implementátor

---

## P1-3: Inventory Stock Alerts

### Existující infrastruktura

#### Notifikační systém
- **Pusher:** Zmíněn v CLAUDE.md jako "Real-time: Pusher", ale ŽÁDNÝ Pusher kód v `lib/` ani `app/` — grep na `pusher|Pusher` vrátil jen e2e test. **Pusher NENÍ implementovaný.**
- **Email (Resend):** Plně funkční — `lib/resend.ts`
  - `sendEmail({ to, subject, html, text })` — graceful fallback pokud RESEND_API_KEY chybí (log do konzole)
  - FROM: `info@carmakler.cz` (env: RESEND_FROM_EMAIL)
  - Existující email templates v `lib/email-templates/` (16 šablon)
- **SMS:** GoSMS nebo Twilio v `.env.example`, ale žádná implementace v kódu

#### Cron pattern
Všechny cron endpoints (10 existujících) používají stejný pattern:

```typescript
// app/api/cron/xxx/route.ts
export async function GET(request: NextRequest) {
  // 1. Auth check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // 2. Business logic (delegované do lib/)
  const result = await doSomething();
  // 3. Return JSON result
  return NextResponse.json({ success: true, ...result });
}
```

#### Supplier dashboard
**Soubor:** `components/pwa-parts/dashboard/SupplierStats.tsx`

Zobrazuje 4 stat karty:
- 📦 Aktivní díly (activeParts)
- 🛒 K vyřízení (pendingOrders)
- 💰 Tržby měsíc (revenue)
- ⭐ Hodnocení (rating)

Fetch z: `/api/parts/supplier-stats`

**Soubor:** `components/pwa-parts/dashboard/PendingOrders.tsx`

Zobrazuje pending/confirmed objednávky (max 5). Fetch z `/api/orders?role=supplier&limit=5`.

**Dashboard page:** `app/(pwa-parts)/parts/page.tsx` — renderuje SupplierStats + PendingOrders.

#### Part model — relevantní pole
```prisma
model Part {
  stock     Int       // aktuální počet kusů
  status    String    // DRAFT, ACTIVE, SOLD, INACTIVE
  supplierId String   // kdo díl nabízí
  supplier   User     // relace
  // Index na supplierId existuje (line 952)
  // Index na status existuje (line 954)
}
```

### Implementační plán P1-3

#### Soubory k vytvoření:
| # | Soubor | Popis |
|---|--------|-------|
| 1 | `app/api/cron/stock-alerts/route.ts` | Cron endpoint |
| 2 | `lib/stock-alerts.ts` | Business logika |
| 3 | `lib/email-templates/stock-alert-supplier.ts` | Email šablona |

#### Soubory k úpravě:
| # | Soubor | Popis |
|---|--------|-------|
| 4 | `components/pwa-parts/dashboard/SupplierStats.tsx` | Přidat low-stock count |
| 5 | `vercel.json` | Přidat cron schedule |

#### Step-by-step:

**Krok 1: `lib/stock-alerts.ts`**

```typescript
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { stockAlertSupplierHtml, stockAlertSupplierText } from "./email-templates/stock-alert-supplier";

const LOW_STOCK_THRESHOLD = 3; // díly s <= 3 ks na skladě

export interface StockAlertResult {
  suppliersNotified: number;
  totalLowStockParts: number;
  errors: string[];
}

export async function checkAndSendStockAlerts(): Promise<StockAlertResult> {
  // 1. Najdi aktivní díly s nízkým stockem, seskupené po supplierech
  const lowStockParts = await prisma.part.findMany({
    where: {
      status: "ACTIVE",
      stock: { lte: LOW_STOCK_THRESHOLD },
    },
    select: {
      id: true,
      name: true,
      stock: true,
      partNumber: true,
      supplier: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { stock: "asc" },
  });

  // 2. Seskupit podle dodavatele
  const bySupplier = new Map<string, typeof lowStockParts>();
  for (const part of lowStockParts) {
    const key = part.supplier.id;
    if (!bySupplier.has(key)) bySupplier.set(key, []);
    bySupplier.get(key)!.push(part);
  }

  // 3. Poslat email každému dodavateli
  const errors: string[] = [];
  let suppliersNotified = 0;

  for (const [, parts] of bySupplier) {
    const supplier = parts[0].supplier;
    const result = await sendEmail({
      to: supplier.email,
      subject: `⚠️ Nízký sklad — ${parts.length} dílů potřebuje doplnit`,
      html: stockAlertSupplierHtml({ supplierName: supplier.firstName, parts }),
      text: stockAlertSupplierText({ supplierName: supplier.firstName, parts }),
    });
    if (result.success) {
      suppliersNotified++;
    } else {
      errors.push(`${supplier.email}: ${result.error}`);
    }
  }

  return {
    suppliersNotified,
    totalLowStockParts: lowStockParts.length,
    errors,
  };
}
```

**Krok 2: `app/api/cron/stock-alerts/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAndSendStockAlerts } from "@/lib/stock-alerts";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkAndSendStockAlerts();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("CRON stock-alerts error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**Krok 3: Email šablona `lib/email-templates/stock-alert-supplier.ts`**

Pattern: kopírovat z `order-notification-supplier.ts` — stejná struktura (emailLayout wrapper, escapeHtml, tabulka s daty).

Obsah emailu:
- Předmět: `⚠️ Nízký sklad — X dílů potřebuje doplnit`
- Tělo: tabulka s díly (název, partNumber, aktuální stock), CTA button "Aktualizovat sklad" → `/parts/my`

**Krok 4: Vercel Cron (přidat do vercel.json)**

```json
{ "path": "/api/cron/stock-alerts", "schedule": "0 7 * * *" }
```
→ Denně v 7:00 ráno

**Krok 5: Dashboard widget (volitelné rozšíření)**

V `SupplierStats.tsx` přidat 5. kartu nebo badge na "Aktivní díly":

```typescript
// Rozšířit /api/parts/supplier-stats o lowStockCount
// Pak zobrazit: "📦 Aktivní díly (3 ⚠️ nízký sklad)"
```

Alternativně: přidat nový widget `LowStockAlert` pod stats, který zobrazuje díly s stock ≤ 3.

---

## P1-4: OEM Křížové Reference

### Existující infrastruktura

#### Part.oemNumber a Part.partNumber
```prisma
model Part {
  partNumber  String?   // číslo dílu výrobce aftermarket
  oemNumber   String?   // originální číslo dílu od výrobce vozu
  // searchVector generován z: name + description + oemNumber + partNumber
}
```

**Indexy na Part (lines 952-959):**
- ✅ supplierId, category, status, price, partType, feedConfigId, externalId, manufacturer
- ❌ **CHYBÍ index na oemNumber** — pro OEM lookup bude potřeba přidat
- ❌ **CHYBÍ index na partNumber**

#### Fulltext search (tsvector)
`searchVector` je generován z `name + description + oemNumber + partNumber` → OEM čísla JSOU prohledávatelná přes Smart Search, ale:
- Tsvector tokenizuje na slova → OEM číslo "06B 103 925" se rozpadne na 3 tokeny
- Přesné hledání "06B103925" (bez mezer) nemusí najít "06B 103 925"
- Trvám similarity na name, ne na oemNumber → nízký rank pro OEM match

#### SmartSearchBar
**Soubor:** `components/web/SmartSearchBar.tsx`

- Placeholder: `"Hledat díly, OEM čísla..."` — **už zmiňuje OEM!**
- Fetch: `/api/search/smart?q=xxx&suggestions=true`
- Redirect na: `/dily/katalog?search=xxx`
- Suggestions: pg_trgm similarity na `Part.name` (ne na oemNumber)

#### Smart Search API
**Soubor:** `lib/search.ts` → `app/api/search/smart/route.ts`

`smartSearch()`:
- Hledá v `Part.searchVector` (tsvector) → zahrnuje oemNumber ale jen jako tokeny
- Suggestions z `getSearchSuggestions()` → similarity jen na `Part.name`, ne oemNumber

### Implementační plán P1-4

#### Varianta A: Rozšíření existujícího Smart Search (doporučeno)

Nejmenší effort, největší dopad — přidat OEM-specifický search branch.

#### Soubory k úpravě:
| # | Soubor | Popis |
|---|--------|-------|
| 1 | `prisma/schema.prisma` | Přidat index na oemNumber a partNumber |
| 2 | `lib/search.ts` | Přidat OEM-specifickou vyhledávací cestu |
| 3 | `app/api/parts/oem-lookup/route.ts` | NOVÝ — dedicated OEM lookup endpoint |

#### Soubory k vytvoření (volitelné rozšíření):
| # | Soubor | Popis |
|---|--------|-------|
| 4 | `components/web/OemLookup.tsx` | NOVÝ — dedicated OEM search UI |

#### Step-by-step:

**Krok 1: Prisma index**

```prisma
model Part {
  // ...existující pole...

  @@index([supplierId])
  @@index([category])
  @@index([status])
  @@index([price])
  @@index([partType])
  @@index([feedConfigId])
  @@index([externalId])
  @@index([manufacturer])
  // ★ NOVÉ:
  @@index([oemNumber])
  @@index([partNumber])
}
```

→ `npx prisma migrate dev --name add-oem-partnum-indexes`

**Krok 2: OEM Lookup API endpoint**

**Soubor:** `app/api/parts/oem-lookup/route.ts`

```typescript
// GET /api/parts/oem-lookup?q=06B103925&page=1&limit=20

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("q")?.trim() ?? "";
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const limit = Math.min(50, parseInt(params.get("limit") || "20", 10));

  if (query.length < 3) {
    return NextResponse.json({ parts: [], total: 0 });
  }

  // Normalizovat OEM číslo: odstranit mezery, pomlčky, tečky
  const normalized = query.replace(/[\s\-\.]/g, "").toUpperCase();

  // Hledat v oemNumber A partNumber (cross-reference)
  const where = {
    status: "ACTIVE",
    OR: [
      // Přesný match (po normalizaci)
      { oemNumber: { contains: normalized, mode: "insensitive" as const } },
      { partNumber: { contains: normalized, mode: "insensitive" as const } },
      // Originální query (s mezerami/pomlčkami)
      { oemNumber: { contains: query, mode: "insensitive" as const } },
      { partNumber: { contains: query, mode: "insensitive" as const } },
    ],
  };

  const [parts, total] = await Promise.all([
    prisma.part.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        oemNumber: true,
        partNumber: true,
        manufacturer: true,
        price: true,
        stock: true,
        condition: true,
        partType: true,
        compatibleBrands: true,
        compatibleModels: true,
        images: { select: { url: true }, take: 1, orderBy: { order: "asc" } },
      },
      orderBy: { price: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.part.count({ where }),
  ]);

  return NextResponse.json({ parts, total, page, totalPages: Math.ceil(total / limit) });
}
```

**Krok 3: Rozšířit Smart Search suggestions**

**Soubor:** `lib/search.ts` — upravit `getSearchSuggestions()`:

```typescript
// Přidat OEM suggestions k existujícím:
export async function getSearchSuggestions(query: string, limit = 8): Promise<string[]> {
  const cleaned = query.trim().replace(/[^\w\sáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ-]/g, "");
  if (cleaned.length < 2) return [];

  // Detekce OEM formátu: převážně čísla/písmena bez mezer, nebo s pomlčkami
  const looksLikeOem = /^[A-Z0-9\-\.]{4,}$/i.test(cleaned.replace(/\s/g, ""));

  const suggestions = await prisma.$queryRawUnsafe<Array<{ suggestion: string }>>(
    `(SELECT DISTINCT "name" AS suggestion FROM "Part"
      WHERE "status" = 'ACTIVE' AND similarity("name", $1) > 0.15
      ORDER BY similarity("name", $1) DESC
      LIMIT $2)
     UNION
     ${looksLikeOem ? `
     (SELECT DISTINCT "oemNumber" AS suggestion FROM "Part"
      WHERE "status" = 'ACTIVE' AND "oemNumber" IS NOT NULL
        AND UPPER(REPLACE(REPLACE("oemNumber", ' ', ''), '-', ''))
            LIKE '%' || UPPER(REPLACE(REPLACE($1, ' ', ''), '-', '')) || '%'
      LIMIT $2)
     UNION
     (SELECT DISTINCT "partNumber" AS suggestion FROM "Part"
      WHERE "status" = 'ACTIVE' AND "partNumber" IS NOT NULL
        AND UPPER(REPLACE(REPLACE("partNumber", ' ', ''), '-', ''))
            LIKE '%' || UPPER(REPLACE(REPLACE($1, ' ', ''), '-', '')) || '%'
      LIMIT $2)
     UNION ` : ""}
     (SELECT DISTINCT "brand" || ' ' || "model" AS suggestion FROM "Listing"
      WHERE "status" = 'ACTIVE' AND similarity("brand" || ' ' || "model", $1) > 0.15
      ORDER BY similarity("brand" || ' ' || "model", $1) DESC
      LIMIT $2)
     LIMIT $2`,
    cleaned,
    limit
  );

  return suggestions.map((s) => s.suggestion);
}
```

**Krok 4: OEM Lookup komponenta (volitelné)**

**Soubor:** `components/web/OemLookup.tsx`

Samostatný input pro OEM číslo:
- Input s placeholder "Zadejte OEM číslo dílu (např. 06B 103 925)"
- On submit → fetch `/api/parts/oem-lookup?q=xxx`
- Zobrazit výsledky jako ProductCard grid
- Umístění: na `/dily` landing page jako alternativní vyhledávání

Alternativa: přidat tab "OEM vyhledávání" do existujícího SmartSearchBar (méně práce, UI už existuje).

---

## Normalizace OEM čísel

OEM čísla mají různé formáty:
- `06B 103 925` (VW/Audi — mezery po 3 znacích)
- `06B-103-925` (pomlčky)
- `06B103925` (bez separátorů)
- `LR004459` (Land Rover — žádné separátory)
- `11 42 7 837 452` (BMW — mezery po 2-3 znacích)

**Normalizační funkce:**

```typescript
function normalizeOemNumber(oem: string): string {
  return oem.replace(/[\s\-\.]/g, "").toUpperCase();
}
```

Při uložení Part → vždy ukládat originální formát do `oemNumber`. Normalizaci dělat při vyhledávání.

---

## Závislostní graf

```
P1-3 (Stock alerts):
  Krok 1: lib/stock-alerts.ts           → nezávislý
  Krok 2: cron/stock-alerts/route.ts    → závisí na Krok 1
  Krok 3: email template               → závisí na Krok 1
  Krok 4: vercel.json cron             → závisí na Krok 2
  Krok 5: dashboard widget             → nezávislý (volitelný)

P1-4 (OEM lookup):
  Krok 1: Prisma indexes               → nezávislý, ale vyžaduje migraci
  Krok 2: OEM lookup API               → závisí na Krok 1
  Krok 3: Rozšířit suggestions         → nezávislý
  Krok 4: OEM UI komponenta            → závisí na Krok 2 (volitelný)
```

**P1-3 a P1-4 jsou vzájemně NEZÁVISLÉ** — mohou běžet paralelně.

---

## STOP & ESCALATE

| Situace | Akce |
|---------|------|
| `migrate dev` failuje s tsvector drift | Známý problém (memory: recurring_tsvector_drift). Fix: `migrate reset --force` na dev. Production unaffected. |
| Resend API rate limit | Batch emaily, max 1 email/dodavatel/den |
| OEM normalizace matchuje příliš broad | Zpřísnit: vyžadovat min 5 znaků po normalizaci |
| Supplier nemá email | Skip, logovat warning |

---

## Referenční soubory

| Účel | Soubor |
|------|--------|
| Cron pattern | `app/api/cron/sla-check/route.ts` (30 řádků, nejčistší vzor) |
| Email systém | `lib/resend.ts` (sendEmail funkce) |
| Email template pattern | `lib/email-templates/order-notification-supplier.ts` |
| Search implementation | `lib/search.ts` (smartSearch + getSearchSuggestions) |
| Search API | `app/api/search/smart/route.ts` |
| SmartSearchBar UI | `components/web/SmartSearchBar.tsx` (140 řádků) |
| Supplier dashboard | `components/pwa-parts/dashboard/SupplierStats.tsx` |
| Part indexes | `prisma/schema.prisma` lines 952-959 |
