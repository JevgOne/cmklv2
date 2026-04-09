# Plán #182 — TASK-020 Eshop autodíly (gap-fix)

**Autor:** planovac
**Datum:** 2026-04-09
**Task ID:** 182
**Parent task:** TASK-020 „Eshop autodíly" (priorita 3, stav „zpracovává se" v `TASK-QUEUE.md`)
**Type:** gap-fix planning (malý-střední)
**Related:** #88a Wolt commission (live), #161 Stripe Connect Express (live), #131+ eshop backend (postaveno), #19 order emails (live), QA-TASK-019-020.md 2026-04-04

---

## §0 — Executive summary

TASK-020 je **funkčně postavená z ~95 %**. Celá infrastruktura existuje:
kompletní `Part` model s `wholesalePrice` + `markupPercent` + `externalId` +
`feedConfigId`, PWA pro vrakoviště (wizard 3 kroků), katalog + detail + košík +
objednávka + moje objednávky, admin feed správa (`/admin/feeds`), API pro
feed import, commission split přes `/api/stripe/webhook` (z #88a), Stripe
Connect Express onboarding card v `/parts/profile` (z #161).

**QA report** `.claude-context/tasks/QA-TASK-019-020.md` (2026-04-04) identifikoval
**3 konkrétní gapy** a tento plán je řeší jako minimální scope:

1. **`WHOLESALE_SUPPLIER` role** — v kódu 0 výskytů mimo docs. Pozor: `User.role`
   je **String field (NE Prisma enum)** — jeho přidání je jen comment change
   v schema.prisma + aktualizace allowedRoles polí, **žádná DB migrace role**.
2. **`Part.manufacturer`** — chybí (výrobce dílu: TRW, Bosch, LUK, …).
3. **`Part.warranty`** — chybí (záruka, např. „24 měsíců").

Plus nutný UI follow-up: wizard (DetailsStep) + katalog filter + detail page
rendering + Zod validators + seed aktualizace + jeden testovací E2E.

**Migration story:** jediná DB migrace přidává 2 sloupce na `Part`. Po zkušenosti
z memory `project_recurring_tsvector_drift.md` musí implementator eskalovat přes
**STOP-1 ritual** a navrhnout **Option A** (reset dev DB). Produkce nedotčena.

Plán řeší **Fázi A (minimal gap-fix)**. **Fáze B** (B2B pricing tiers, TecDoc
API, bulk CSV rozšíření) je explicitně **OUT OF SCOPE** a zůstává jako future
work v §4.

---

## §1 — Aktuální stav TASK-020 (code scan)

### §1.1 — Prisma schema (`prisma/schema.prisma`)

**✅ EXISTUJE — kompletně postavené:**

```
model Part {              // řádky 889-954
  id, slug, supplierId, supplier (User)
  category, name, description, searchVector (tsvector)
  partNumber, oemNumber
  partType (USED/NEW/AFTERMARKET, default USED)
  condition (NEW/USED_GOOD/USED_FAIR/USED_POOR/REFURBISHED)
  price, wholesalePrice, markupPercent, currency, vatIncluded
  stock, weight, dimensions
  compatibleBrands, compatibleModels, compatibleYearFrom, compatibleYearTo, universalFit
  status (DRAFT/ACTIVE/SOLD/INACTIVE), viewCount
  feedConfigId, externalId   // z feed importu
  images (PartImage[]), orderItems (OrderItem[])
  timestamps
}

model PartImage { ... }                                    // 956-967
model PartsFeedConfig { ... }                              // 1598-1627
model PartsFeedImportLog { ... }                           // 1629-1645
model Order / OrderItem (eshop checkout)                   // 1004-1100+
```

- `Part` obsahuje **searchVector** jako `Unsupported("tsvector")` — fulltext
  search přes raw SQL trigger (detail viz migration history).
- `Part.wholesalePrice` + `markupPercent` **EXISTUJE** — spec v TASK-QUEUE
  říká „Přidat pole wholesalePrice" ale to už je hotové. QA report tohle
  neflagoval jako gap.

**❌ CHYBÍ:**

- `Part.manufacturer String?` — výrobce dílu (TRW, Bosch, LUK…)
- `Part.warranty String?` — záruka (formát lead Q2, viz §6)

### §1.2 — UserRole (NOT enum!)

**Kritické zjištění:** `User.role` v Prisma schema je **String field**, ne enum.
Řádek 21 `prisma/schema.prisma`:

```prisma
role String @default("BROKER") // ADMIN, BACKOFFICE, REGIONAL_DIRECTOR, MANAGER,
// BROKER, ADVERTISER, BUYER, PARTS_SUPPLIER, INVESTOR, VERIFIED_DEALER,
// PARTNER_BAZAR, PARTNER_VRAKOVISTE
```

**Důsledek pro migraci:** přidání `WHOLESALE_SUPPLIER` je **jen aktualizace
komentáře** a polí `allowedRoles` v kódu. **Žádná DB migrace pro role
nevyžadována.** To drasticky snižuje risk tsvector/trgm drift collision.

Grep `WHOLESALE_SUPPLIER` v codebase: **0 výskytů v .ts/.tsx**. Jen v
`TASK-QUEUE.md`, `fix-plan-production-readiness.md`, `QA-TASK-019-020.md`.

Seed (`prisma/seed.ts`) má 2 výskyty `role: "PARTS_SUPPLIER"` (řádky 1564, 1581)
— musíme přidat jeden `WHOLESALE_SUPPLIER` pro testování.

### §1.3 — API routes

**✅ `app/api/parts/*`:**

- `POST /api/parts` — create díl, gated na `PARTS_SUPPLIER, PARTNER_VRAKOVISTE,
  ADMIN, BACKOFFICE` (řádek 21). NEOBSAHUJE manufacturer/warranty v create body.
- `GET /api/parts` — katalog s filtrací: category, condition, partType, brand,
  model, year, minPrice, maxPrice, inStock, search, sort, page, limit.
  **NEOBSAHUJE** `manufacturer` filter ani search přes manufacturer.
- `GET/PUT/DELETE /api/parts/[id]` — PUT používá `updatePartSchema` (partial),
  ownership check, admin override. NEOBSAHUJE manufacturer/warranty logic.
- `GET /api/parts/compatible` — kompatibilní díly přes VIN/vůz
- `GET /api/parts/for-vehicle` — díly pro konkrétní vůz
- `GET /api/parts/supplier-stats` — statistiky dodavatele
- `POST /api/parts/import` — CSV bulk import (PARTS_SUPPLIER gate)

**✅ `app/api/orders/*`:**

- `POST /api/orders` — vytvoření objednávky
- `GET /api/orders/[id]` + `/status` + `/returns`
- `GET /api/orders/track/[token]` — public tracking

**✅ `app/api/admin/feeds/*` (parts feed správa):**

- `GET/POST /api/admin/feeds` — list + create feed config
- `GET/PUT/DELETE /api/admin/feeds/[id]`
- `POST /api/admin/feeds/[id]/import` — spustit import
- `GET /api/admin/feeds/[id]/logs` — log history
- `GET /api/admin/feeds/suppliers` — list dostupných dodavatelů

**⚠️ Konflikt v naming:** `app/api/feeds/import/*` (řádky 1-10 v `run/route.ts`
importují z `@/lib/listing-import`) je pro **LISTING feedy z TASK-019**
(inzertní platforma), ne pro parts. To je z TASK-019, mimo scope #182.

### §1.4 — Web routes (`app/(web)/dily/*`)

**✅ EXISTUJÍCÍ:**

```
/dily                            page.tsx (homepage s kaskádou značka→model)
/dily/katalog                    page.tsx (full filter UI, client component)
/dily/[slug]                     page.tsx (detail dílu, server component)
/dily/kosik                      page.tsx (cart)
/dily/objednavka                 page.tsx (checkout flow)
/dily/objednavka/potvrzeni       page.tsx
/dily/moje-objednavky            page.tsx
/dily/kategorie/[slug]           page.tsx (SEO landing per category)
/dily/vrakoviste/[slug]          page.tsx (SEO landing per vrakoviště)
/dily/znacka/[brand]                              (SEO brand hub)
/dily/znacka/[brand]/[model]                      (SEO model hub)
/dily/znacka/[brand]/[model]/[rok]                (SEO year hub)
```

**Detail page (`/dily/[slug]/page.tsx`) klíčové findings:**

- Řádky 182-203: název + kompatibilita + OE/PN čísla
- Řádky 220-246: kategorie + popis + dodavatel bloky
- Řádky 249-272: cena + dostupnost
- Řádky 274-281: AddToCartButton
- Řádky 296-305: `ProductDetailTabs` (description, compatibility, weight, dimensions)
- **CHYBÍ:** manufacturer nebo warranty rendering kdekoli. Ani v hlavní kolonce,
  ani v tabu, ani u aftermarket dílů (kde by to mělo být nejvýraznější).
- Řádky 117-119: supplier name swap na „CarMakléř Shop" pro AFTERMARKET/NEW
  (anonymizace velkoobchodu — spec konzistentní).

**Katalog page (`/dily/katalog/page.tsx`):**

- Client component s `useState`/`fetchParts()` přes `/api/parts?...`
- Filter bar: značka vozu, typ dílu (USED/NEW/AFTERMARKET), cena od-do, řazení, pouze skladem
- Tabs kategorií: vse, ENGINE, BODY, BRAKES, SUSPENSION, ELECTRICAL, INTERIOR (7 z 12 kategorií viditelných)
- **CHYBÍ:** manufacturer filter input, warranty filter (low priority), model filter, year filter, condition filter

### §1.5 — PWA routes (`app/(pwa-parts)/*`)

**✅ KOMPLETNÍ scaffolding:**

```
/parts                       dashboard (stats, pending orders, rychlé akce)
/parts/new                   add-part wizard entry
/parts/my                    my parts list
/parts/import                CSV bulk import
/parts/orders                order queue
/parts/orders/[id]           order detail
/parts/profile               SupplierStripeCard (z #161) + profile settings
```

**Components (`components/pwa-parts/*`):**

- `AddPartWizard` — 3 kroků (Fotky, Údaje, Cena)
- `PhotoStep.tsx` — krok 1: fotky
- `DetailsStep.tsx` — krok 2: název, kategorie, stav (condition), popis,
  kompatibilita, source VIN, OEM číslo. **NEOBSAHUJE** manufacturer.
- `PricingStep.tsx` — krok 3: cena, DPH, množství, delivery options + preview.
  **NEOBSAHUJE** warranty.
- `CompatibilitySelector.tsx`, `CsvImport.tsx`, `PartCard.tsx`, `PartFilters.tsx`
- `dashboard/{SupplierStats,PendingOrders}.tsx`
- `orders/{OrderCard,OrderActions,ShippingLabelCard}.tsx`
- `profile/SupplierStripeCard.tsx` (z #161)
- `SupplierBottomNav.tsx`, `SupplierTopBar.tsx`

### §1.6 — Middleware (`middleware.ts`)

**Role gating (řádky 7-19):**

```ts
const PARTS_SUPPLIER_ROLES = ["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];
```

Aplikuje se na `/parts` prefix (řádky 251-269). **CHYBÍ:** `WHOLESALE_SUPPLIER`
v tomto poli. Bez doplnění nemůže WHOLESALE_SUPPLIER user otevřít PWA.

### §1.7 — Validators (`lib/validators/parts.ts`)

**Současné schémata:**

- `createPartSchema`: name, category (enum), description, partNumber, oemNumber,
  condition (enum), price, currency, vatIncluded, stock, weight, dimensions,
  compatibleBrands, compatibleModels, compatibleYearFrom, compatibleYearTo,
  universalFit, images[]
- `updatePartSchema = createPartSchema.partial()`
- `partFilterSchema`: category, condition, partType, brand, model, year,
  minPrice, maxPrice, inStock, search, sort, page, limit
- `createOrderSchema`, `orderStatusSchema` — pro checkout flow

**CHYBÍ:** `manufacturer`, `warranty` v create/update schema + `manufacturer`
filter v partFilterSchema.

### §1.8 — Admin feeds (`app/(admin)/admin/feeds/*`)

**✅ KOMPLETNÍ UI:** list page s stats cards + per-feed kartami + „Importovat"
+ „Detail" + stránka new/[id]. Funguje proti `/api/admin/feeds/*`. Žádné
WHOLESALE_SUPPLIER specifické UI — obecný admin pro jakéhokoli dodavatele feedu.

### §1.9 — Seed (`prisma/seed.ts`)

Dvě PARTS_SUPPLIER seed entries na řádcích 1564, 1581. Žádný WHOLESALE_SUPPLIER.
Žádné sample Part s manufacturer/warranty (logicky, pole ještě neexistují).

### §1.10 — Test coverage

- `e2e/chrome-test-178-161c.spec.ts` — PARTS_SUPPLIER login + SupplierStripeCard
- `e2e/flow-2-4-test.spec.ts` — parts flow test
- `__tests__/middleware.test.ts` — PARTS_SUPPLIER gate test

**CHYBÍ:** žádný E2E nebo unit test pro manufacturer/warranty field ani
WHOLESALE_SUPPLIER role.

---

## §2 — Gap analysis vs TASK-020 zadání + QA-TASK-019-020.md

### §2.1 — QA report findings (2026-04-04)

`.claude-context/tasks/QA-TASK-019-020.md`:

- **TASK-020: 44/47 ✅ = 94%** s 3 ❌ gaps:

| # | Gap | QA severity | Verified 2026-04-09 |
|---|-----|-------------|---------------------|
| 1 | `WHOLESALE_SUPPLIER` role missing | kritický | ✅ confirmed (0 code matches) |
| 2 | `Part.manufacturer` field missing | kritický | ✅ confirmed (grep 0 matches) |
| 3 | `Part.warranty` field missing | kritický | ✅ confirmed (grep 0 matches) |

**Žádné další ❌** v TASK-020 sekci QA reportu. Plus bonus znamená:
feed import infra, commission split (#88a), Stripe Connect (#161),
order emails (#19) byly QA uznány jako fungující.

### §2.2 — Vs TASK-QUEUE.md TASK-020 spec

TASK-020 spec (řádky 1672-1970) zmiňuje explicitně:

> „**Nová role: WHOLESALE_SUPPLIER** (velkoobchodní dodavatel)"
> „Jiný flow než vrakoviště — nepřidává díly ručně, ale importuje katalog"

> „Rozšíření Part modelu:
> — Přidat pole `wholesalePrice` (Int?) — nákupní cena od velkoobchodu
> — Přidat pole `feedConfigId` (String?) — odkaz na feed
> — Přidat pole `externalId` (String?) — ID dílu v systému dodavatele
> — Přidat pole `manufacturer` (String?) — výrobce dílu (TRW, Bosch, LUK…)
> — Přidat pole `warranty` (String?) — záruka (\"24 měsíců\")"

**Scoreboard** (z spec 5 rozšíření vs current schema):

| Pole | Spec | Schema 2026-04-09 |
|------|------|-------------------|
| `wholesalePrice` | required | ✅ řádek 913 |
| `feedConfigId` | required | ✅ řádek 935 |
| `externalId` | required | ✅ řádek 937 |
| `manufacturer` | required | ❌ **GAP** |
| `warranty` | required | ❌ **GAP** |

Spec zmiňuje i TecDoc integraci, bulk CSV, drop-shipping — ale ty jsou
označené jako **Fáze 2** nebo z kontextu „nice-to-have". Gap vůči
QA + spec je tedy redukován na **3 konkrétní položky z §2.1**.

### §2.3 — Mimo scope gap-fix

Tyto věci jsem našel jako potenciální gaps, ale **PATŘÍ DO FÁZE B**, NE
do fáze A:

- Katalog filter chybí: model, year, condition, manufacturer (jeden z
  3 hlavních gaps, součástí Fáze A)
- Kategorie tabs zobrazují jen 7 z 12 kategorií v katalog page
- Manufacturer není v `searchVector` fulltextu — může vyžadovat trigger update
- WHOLESALE_SUPPLIER-specific dashboard variant
- B2B pricing tiers (velkoobchodní slevy pro VIP zákazníky)
- TecDoc API integrace (placená licence, out of scope)
- Drop-shipping workflow (email notification velkoobchodu → dodavatel → zákazník)

---

## §3 — Scope Fáze A (minimal gap-fix) — **IMPLEMENT NOW**

### §3.1 — Acceptance criteria summary

Po dokončení Fáze A musí:

1. Prisma schema obsahovat `Part.manufacturer String?` + `Part.warranty String?`
2. `UserRole` comment v schema.prisma obsahovat `WHOLESALE_SUPPLIER`
3. Middleware `PARTS_SUPPLIER_ROLES` obsahovat `WHOLESALE_SUPPLIER`
4. `createPartSchema` + `updatePartSchema` akceptovat `manufacturer` a `warranty`
5. `partFilterSchema` + `GET /api/parts` podporovat `manufacturer` filter
6. `POST /api/parts` ukládat `manufacturer` a `warranty` z body
7. `PUT /api/parts/[id]` akceptovat update těchto polí
8. Allowed roles v `POST /api/parts` + `POST /api/parts/import` obsahovat `WHOLESALE_SUPPLIER`
9. `DetailsStep` wizard obsahovat `manufacturer` input (optional, vždy viditelné)
10. `PricingStep` wizard obsahovat `warranty` input (optional, vždy viditelné)
11. `/dily/[slug]/page.tsx` detail zobrazovat manufacturer + warranty pokud nejsou prázdné
12. `/dily/katalog/page.tsx` obsahovat manufacturer filter input + propagovat do API query
13. `prisma/seed.ts` obsahovat 1× `WHOLESALE_SUPPLIER` user + 2-3 sample Parts s vyplněnými manufacturer + warranty
14. 1× E2E test pro full flow: WHOLESALE_SUPPLIER login → add part s manufacturer + warranty → katalog filter → detail render

### §3.2 — Step 1: Prisma schema updates

**File:** `prisma/schema.prisma`

**Change 1 — User.role comment (řádek 21):**

```diff
- role String @default("BROKER") // ADMIN, BACKOFFICE, REGIONAL_DIRECTOR, MANAGER, BROKER, ADVERTISER, BUYER, PARTS_SUPPLIER, INVESTOR, VERIFIED_DEALER, PARTNER_BAZAR, PARTNER_VRAKOVISTE
+ role String @default("BROKER") // ADMIN, BACKOFFICE, REGIONAL_DIRECTOR, MANAGER, BROKER, ADVERTISER, BUYER, PARTS_SUPPLIER, WHOLESALE_SUPPLIER, INVESTOR, VERIFIED_DEALER, PARTNER_BAZAR, PARTNER_VRAKOVISTE
```

**Change 2 — Part model nová pole (řádek ~903 mezi oemNumber a partType):**

```diff
   partNumber  String?
   oemNumber   String?
+
+  // Výrobce a záruka (rozšíření pro aftermarket a nové díly, TASK-020 #182)
+  manufacturer String? // Např. "TRW", "Bosch", "LUK"
+  warranty     String? // Např. "24 měsíců", "zákonná", "doživotní"

   // Typ dílu
   partType String @default("USED") // USED, NEW, AFTERMARKET
```

**Index consideration:** `@@index([manufacturer])` — přidat pro katalog filter.
Warranty se nefiltruje, index nepotřebný.

```diff
   @@index([externalId])
+  @@index([manufacturer])
 }
```

**Acceptance:** `npx prisma validate` exit 0, `schema.prisma` obsahuje 2 nové
řádky v Part + updated comment + 1 nový index.

### §3.3 — Step 2: DB migrace (STOP-1 ritual!)

**⚠️ KRITICKÝ STOP-1 BOD pro implementator ⚠️**

Spuštění `npx prisma migrate dev --name add_part_manufacturer_warranty`
**OČEKÁVANĚ SELŽE** s „Drift detected: Removed index on columns (searchVector /
name (trgm))" na Listing/Part/Vehicle modelech. Toto je **recurring tsvector
drift**, dokumentovaný v memory `project_recurring_tsvector_drift.md`.

**Implementator MUSÍ:**

1. **NEOPRAVOVAT SELF-RESOLVE** — nepoužívat `db push`, `migrate resolve`,
   ani ruční DROP/CREATE migration files
2. **ESKALOVAT k lead** s zprávou ve formátu:

   > „STOP-1: `prisma migrate dev` selhal s tsvector drift na Part/Listing/Vehicle.
   > Známý recurring problém per memory `project_recurring_tsvector_drift.md`.
   > Navrhuju **Option A** (reset dev DB + replay migrací + nová migrace):
   >
   > ```bash
   > npx prisma migrate reset --force
   > npx prisma migrate dev --name add_part_manufacturer_warranty
   > npx prisma generate
   > npx prisma db seed
   > ```
   >
   > Option A je autorizovaný precedent v #155, #162. Produkce nedotčena
   > (běží `migrate deploy`, žádné drift detection). Čekám na lead green light
   > před spuštěním."

3. **Čekat na explicit lead ACK** před spuštěním Option A.
4. Po lead ACK spustit výše uvedený sled a pokračovat.

**Alternative options** (pouze pro lead, ne pro impl):

- **Option B:** Přidat manufacturer+warranty přes raw SQL ALTER TABLE v
  nové prisma migration (zachová dev DB, ale risk schema/migration mismatch).
- **Option C:** Permanent fix dle memory — modelovat searchVector jako
  `Unsupported("tsvector")` správně + všechny trgm/GIN indexy pod Prisma
  management. Samostatný task, out of scope #182.

**Implementator default:** Option A po ACK.

**Acceptance:** Migrace aplikovaná, `npx prisma studio` ukazuje 2 nová pole
na Part, seed data zahrnují manufacturer a warranty vyplněné.

### §3.4 — Step 3: Zod validators

**File:** `lib/validators/parts.ts`

**Change 1 — createPartSchema (řádek ~12-39):**

```diff
 export const createPartSchema = z.object({
   name: z.string().min(1, "Název je povinný"),
   category: z.enum(partCategories),
   description: z.string().optional(),
   partNumber: z.string().optional(),
   oemNumber: z.string().optional(),
+  manufacturer: z.string().trim().max(100).optional(),
+  warranty: z.string().trim().max(50).optional(),
   condition: z.enum(partConditions),
   price: z.number().int().min(1, "Cena musí být alespoň 1 Kč"),
   // ...
 });
```

**Change 2 — partFilterSchema (řádek ~43-57):**

```diff
 export const partFilterSchema = z.object({
   category: z.string().optional(),
   condition: z.string().optional(),
   partType: z.string().optional(),
   brand: z.string().optional(),
   model: z.string().optional(),
   year: z.coerce.number().int().optional(),
+  manufacturer: z.string().optional(),
   minPrice: z.coerce.number().int().optional(),
   // ...
 });
```

**Note:** `updatePartSchema = createPartSchema.partial()` → automaticky dědí.

**Acceptance:** Unit test `createPartSchema.parse({ name, category, condition,
price, manufacturer: "TRW", warranty: "24 měsíců" })` projde; bez těch dvou
polí také projde (optional).

### §3.5 — Step 4: API routes

**File 1: `app/api/parts/route.ts`**

**Change 1 — allowedRoles (řádek 21):**

```diff
-    const allowedRoles = ["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];
+    const allowedRoles = ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];
```

**Change 2 — POST create body (řádek 34-67):**

```diff
     const part = await prisma.part.create({
       data: {
         slug,
         supplierId: session.user.id,
         name: data.name,
         category: data.category,
         description: data.description ?? null,
         partNumber: data.partNumber ?? null,
         oemNumber: data.oemNumber ?? null,
+        manufacturer: data.manufacturer ?? null,
+        warranty: data.warranty ?? null,
         condition: data.condition,
         // ...
       },
     });
```

**Change 3 — GET filter (řádek 97-130):**

```diff
     if (filters.year) { ... }
+
+    if (filters.manufacturer) {
+      where.manufacturer = { contains: filters.manufacturer, mode: "insensitive" as const };
+    }

     if (filters.minPrice || filters.maxPrice) { ... }
```

**Change 4 — GET search ILIKE fallback (řádek 122-130):**

```diff
     if (filters.search) {
       where.OR = [
         { name: { contains: filters.search, mode: "insensitive" as const } },
         { description: { contains: filters.search, mode: "insensitive" as const } },
         { oemNumber: { contains: filters.search, mode: "insensitive" as const } },
         { partNumber: { contains: filters.search, mode: "insensitive" as const } },
+        { manufacturer: { contains: filters.search, mode: "insensitive" as const } },
       ];
     }
```

**File 2: `app/api/parts/[id]/route.ts`**

PUT handler používá `updatePartSchema.parse(body)` a potom `updateData: { ...data }`
(řádek 69, 85). Po přidání polí do createPartSchema zdědí updatePartSchema
automaticky a spread zahrne oba fields. **Žádná změna.**

**File 3: `app/api/parts/import/route.ts`**

CSV import. Mělo by akceptovat `manufacturer` a `warranty` sloupce. Potřeba
ověřit aktuální shape — pravděpodobně potřebuje parser update. Implementator
čte soubor a aplikuje minimální patch (přidání 2 optional sloupců do CSV
parseru + DB create).

**Change:** allowedRoles (řádek podobný jako `api/parts/route.ts:21`) přidat
`WHOLESALE_SUPPLIER`. Ostatní změny impl-driven per file content.

**Acceptance:** Curl `POST /api/parts` s manufacturer+warranty payloadem
vrací 201; `GET /api/parts?manufacturer=TRW` vrací jen díly s manufacturer=TRW.

### §3.6 — Step 5: Middleware

**File:** `middleware.ts` řádek 16

```diff
- const PARTS_SUPPLIER_ROLES = ["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];
+ const PARTS_SUPPLIER_ROLES = ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];
```

**Test impact:** `__tests__/middleware.test.ts` — pokud je tam hardcoded
role list, přidat WHOLESALE_SUPPLIER do allow-list testu. Implementator
čte test file při patch.

**Acceptance:** Login jako WHOLESALE_SUPPLIER user → navigace na `/parts`
vrací 200 (ne redirect).

### §3.7 — Step 6: PWA wizard UI

**File 1: `components/pwa-parts/parts/DetailsStep.tsx`**

**Change 1 — PartDetails interface (řádek 9-18):**

```diff
 export interface PartDetails {
   name: string;
   category: string;
   condition: string;
   conditionNote: string;
   description: string;
   oemNumber: string;
+  manufacturer: string;
   sourceVin: string;
   compatibility: CompatibilityEntry[];
 }
```

**Change 2 — Input field (po OEM number, řádek ~168):**

```diff
       <Input
         label="OEM číslo dílu (nepovinné)"
         value={details.oemNumber}
         onChange={(e) => update("oemNumber", e.target.value)}
         placeholder="např. 5E4 831 051"
       />
+
+      <Input
+        label="Výrobce dílu (nepovinné)"
+        value={details.manufacturer}
+        onChange={(e) => update("manufacturer", e.target.value)}
+        placeholder="např. TRW, Bosch, LUK"
+        maxLength={100}
+      />
```

**File 2: `components/pwa-parts/parts/PricingStep.tsx`**

**Change 1 — PricingData interface (řádek 13-18):**

```diff
 export interface PricingData {
   price: string;
   vatIncluded: boolean;
   quantity: string;
   deliveryOptions: string[];
+  warranty: string;
 }
```

**Change 2 — Input field (po quantity, řádek ~131):**

```diff
       <Input
         label="Množství na skladě"
         type="number"
         value={pricing.quantity}
         onChange={(e) => update("quantity", e.target.value)}
         placeholder="1"
       />
+
+      <Input
+        label="Záruka (nepovinné)"
+        value={pricing.warranty}
+        onChange={(e) => update("warranty", e.target.value)}
+        placeholder="např. 24 měsíců, doživotní, zákonná"
+        maxLength={50}
+      />
```

**File 3: `app/(pwa-parts)/parts/new/page.tsx`**

Tento soubor obsahuje top-level state pro wizard (PartDetails + PricingData
+ photos + submit handler). Implementator čte soubor a:

1. Inicializuje `manufacturer: ""` v default PartDetails state
2. Inicializuje `warranty: ""` v default PricingData state
3. V submit handleru (POST body) přidá `manufacturer: details.manufacturer || undefined`
   a `warranty: pricing.warranty || undefined`

**Acceptance:** Wizard kroky 2 a 3 mají nová optional inputs; submit
úspěšně vytvoří díl s vyplněnými fields.

### §3.8 — Step 7: Web UI

**File 1: `app/(web)/dily/[slug]/page.tsx`**

**Change — přidání bloku mezi „Kategorie" a „Dodavatel" (řádek ~228):**

```diff
             {part.description && ( ... popis blok ... )}
+
+            {(part.manufacturer || part.warranty) && (
+              <div className="mb-6 p-4 bg-gray-100 rounded-xl">
+                {part.manufacturer && (
+                  <div className="mb-2">
+                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">
+                      Výrobce
+                    </h3>
+                    <p className="text-gray-900 font-semibold">{part.manufacturer}</p>
+                  </div>
+                )}
+                {part.warranty && (
+                  <div>
+                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">
+                      Záruka
+                    </h3>
+                    <p className="text-gray-900 font-semibold">{part.warranty}</p>
+                  </div>
+                )}
+              </div>
+            )}

             <div className="mb-6 p-4 bg-gray-100 rounded-xl">
               <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                 Dodavatel
               </h3>
```

**File 2: `app/(web)/dily/katalog/page.tsx`**

**Change 1 — State (řádek ~88-95):**

```diff
   const [brand, setBrand] = useState("");
+  const [manufacturer, setManufacturer] = useState("");
   const [partType, setPartType] = useState("");
```

**Change 2 — fetchParts URL params (řádek ~102-114):**

```diff
     if (brand) params.set("brand", brand);
+    if (manufacturer) params.set("manufacturer", manufacturer);
     if (partType) params.set("partType", partType);
```

**Change 3 — fetchParts dependency list (řádek 127):**

```diff
-  }, [activeTab, brand, partType, minPrice, maxPrice, inStock, sort, page]);
+  }, [activeTab, brand, manufacturer, partType, minPrice, maxPrice, inStock, sort, page]);
```

**Change 4 — Filter bar grid (řádek ~166):**

Současný grid `lg:grid-cols-6` → přidáním 1 inputu bude 7 nebo změna na
`lg:grid-cols-7`. Mobile zůstane 1 sloupec.

```diff
-        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 items-end">
+        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4 items-end">
           <Select
             label="Značka vozu"
             ...
           />
+          <Input
+            label="Výrobce dílu"
+            placeholder="TRW, Bosch..."
+            value={manufacturer}
+            onChange={(e) => { setManufacturer(e.target.value); setPage(1); }}
+          />
           <Select
             label="Typ dílu"
             ...
```

**Acceptance:** Detail page zobrazuje novou sekci pokud manufacturer nebo
warranty vyplněné; katalog filter input zavolá API s manufacturer parametrem
a vrátí filtrovaný výsledek.

### §3.9 — Step 8: Seed

**File:** `prisma/seed.ts`

**Change 1 — Nový user entry** (vedle PARTS_SUPPLIER na ~1590):

```ts
await prisma.user.upsert({
  where: { email: "velkoobchod@carmakler.cz" },
  update: {},
  create: {
    email: "velkoobchod@carmakler.cz",
    password: hashedPassword,
    firstName: "Test",
    lastName: "Velkoobchod",
    companyName: "Auto Kelly Test s.r.o.",
    role: "WHOLESALE_SUPPLIER",
    status: "ACTIVE",
    emailVerified: new Date(),
  },
});
```

**Change 2 — Sample Parts s manufacturer + warranty**

Minimálně 2-3 entries:

- „Brzdové destičky přední" — manufacturer: „TRW", warranty: „24 měsíců",
  partType: „NEW", category: „BRAKES"
- „Alternátor" — manufacturer: „Bosch", warranty: „12 měsíců", partType:
  „AFTERMARKET", category: „ELECTRICAL"
- „Tlumič přední levý" — manufacturer: „Sachs", warranty: „24 měsíců",
  partType: „NEW", category: „SUSPENSION"

Implementator identifikuje přesnou lokaci sample Part seed v existujícím souboru
(pravděpodobně po existujících Part seed entries) a přidá nové záznamy s
correct supplier link.

**Acceptance:** `npx prisma db seed` proběhne bez chyby; `prisma studio`
ukazuje WHOLESALE_SUPPLIER user a 2-3 Parts s vyplněnými manufacturer + warranty.

### §3.10 — Step 9: E2E test

**File:** `e2e/task-182-wholesale-supplier.spec.ts` (nový)

**Test shape:**

```typescript
import { test, expect } from "@playwright/test";

test.describe("#182 TASK-020 gap-fix — WHOLESALE_SUPPLIER + manufacturer + warranty", () => {
  test("full flow: login → add part → katalog filter → detail render", async ({ page }) => {
    // 1) Login jako WHOLESALE_SUPPLIER
    await page.goto("/login");
    await page.fill('input[name="email"]', "velkoobchod@carmakler.cz");
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/parts/);

    // 2) Navigace na add part wizard
    await page.goto("/parts/new");

    // 3) Krok 1: fotka (skip nebo mock upload)
    // 4) Krok 2: údaje včetně manufacturer
    await page.fill('input[placeholder*="Přední nárazník"]', "Testovací díl 182");
    await page.selectOption('select[name="category"]', "BRAKES");
    await page.selectOption('select[name="condition"]', "NEW");
    // Compatibility selector: add Škoda / Octavia
    // ...
    await page.fill('input[placeholder*="TRW, Bosch"]', "TRW");
    // Click Pokračovat

    // 5) Krok 3: cena + warranty
    await page.fill('input[type="number"][placeholder="0"]', "1500");
    await page.fill('input[placeholder*="24 měsíců"]', "24 měsíců");
    // Check delivery checkbox
    // Click Publikovat

    // 6) Ověření: na katalog filtruj manufacturer=TRW
    await page.goto("/dily/katalog");
    await page.fill('input[placeholder*="TRW, Bosch"]', "TRW");
    // Wait for fetch
    await page.waitForTimeout(500);

    // 7) Klik na kartu s Testovacím dílem 182
    await page.click('text=Testovací díl 182');
    await expect(page.locator("text=Výrobce")).toBeVisible();
    await expect(page.locator("text=TRW")).toBeVisible();
    await expect(page.locator("text=Záruka")).toBeVisible();
    await expect(page.locator("text=24 měsíců")).toBeVisible();
  });
});
```

**Note:** Test selectors jsou approximation — implementator adaptuje na
skutečné komponent markup (`data-testid`, role, etc.).

**Acceptance:** `npx playwright test e2e/task-182-wholesale-supplier.spec.ts`
projde 1/1.

### §3.11 — File manifest Fáze A

**Modified files (core):**

1. `prisma/schema.prisma` — Part model + UserRole comment + index
2. `prisma/migrations/NEW/migration.sql` — auto-generated via `migrate dev`
3. `prisma/seed.ts` — WHOLESALE_SUPPLIER user + 2-3 sample Parts
4. `lib/validators/parts.ts` — createPartSchema + partFilterSchema
5. `app/api/parts/route.ts` — allowedRoles + POST body + GET filter
6. `app/api/parts/import/route.ts` — allowedRoles + CSV parser (impl-driven)
7. `middleware.ts` — PARTS_SUPPLIER_ROLES
8. `__tests__/middleware.test.ts` — test update pokud hardcoded role list
9. `components/pwa-parts/parts/DetailsStep.tsx` — PartDetails interface + manufacturer input
10. `components/pwa-parts/parts/PricingStep.tsx` — PricingData interface + warranty input
11. `app/(pwa-parts)/parts/new/page.tsx` — initial state + submit body
12. `app/(web)/dily/[slug]/page.tsx` — manufacturer/warranty render block
13. `app/(web)/dily/katalog/page.tsx` — filter state + input + URL param

**New files:**

1. `e2e/task-182-wholesale-supplier.spec.ts` — E2E test

**Nedotčeno (verified):**

- `app/api/parts/[id]/route.ts` — PUT dědí přes updatePartSchema + spread
- `app/api/parts/compatible/route.ts`, `/for-vehicle`, `/supplier-stats`
- `app/(admin)/admin/feeds/*` — feed admin funguje bez WHOLESALE_SUPPLIER
  specifikace (generic)
- `app/api/admin/feeds/*` — dtto
- `app/api/orders/*` — checkout flow pokračuje nezměněný
- `components/pwa-parts/parts/{AddPartWizard,PhotoStep,CompatibilitySelector}.tsx`
- `components/pwa-parts/SupplierBottomNav.tsx`, `SupplierTopBar.tsx`
- `app/(web)/dily/kosik/page.tsx`, `objednavka/*`, `moje-objednavky`
- `lib/parts-categories.ts` — kategorie zůstávají stejné

### §3.12 — Implementator delivery pipeline

**Suggested sequence:**

1. **Branch:** `fix/task-182-eshop-dily-gap`
2. **Commit A — schema + migrace:** Step 1 + Step 2 (po STOP-1 eskalaci a ACK)
3. **Commit B — validators + API:** Step 3 + Step 4
4. **Commit C — middleware + seed:** Step 5 + Step 8
5. **Commit D — PWA wizard UI:** Step 6
6. **Commit E — web UI:** Step 7
7. **Commit F — E2E test:** Step 9
8. **STOP-2 před HOTOVO:** `npm run lint && npm run build` + manual smoke na
   `/parts/new` (wizard formulář) + `/dily/katalog` (filter) + `/dily/[slug]`
   (detail render). Hlášení HOTOVO jen pokud všechno zelené.

---

## §4 — Scope Fáze B — **DEFERRED (not now)**

Tyto položky se NErealizují v #182, zůstávají jako samostatné tasky / next steps.
Plán je tady dokumentuje pro kontext, ať je jasné, co je „postavitelné nahoře"
v budoucnu.

### §4.1 — B2B pricing tiers

Velkoobchodní slevy pro VIP zákazníky (autoservisy, flotily). Vyžaduje:

- `CustomerTier` model nebo `User.customerTier` field
- `PartPrice` model se vztahem [Part, Tier] pro per-tier prices
- Pricing logic v Part detail + cart + checkout
- Admin UI pro tier management

**Out of scope #182** — samostatný task (~1-2 týdny).

### §4.2 — TecDoc API integrace

Standard pro autodíly identifikaci a compatibility. Per spec je to **Fáze 2**
(placená licence). Vyžaduje:

- TecDoc account + API key
- Lib wrapper `lib/tecdoc.ts`
- Compatibility resolver: OEM number → seznam kompatibilních vozidel
- Cron job pro cache refresh
- UI integrace v compatibility picker

**Out of scope #182** — samostatný task, čeká na business rozhodnutí o
licenci.

### §4.3 — WHOLESALE_SUPPLIER-specific dashboard

Vlastní variant `/parts` dashboardu s B2B KPIs (feed import status, markup
performance, drop-shipping queue). Vyžaduje:

- Nová komponenta `components/pwa-parts/dashboard/WholesaleDashboard.tsx`
- Role-based routing v `app/(pwa-parts)/parts/page.tsx`
- Feed stats API `/api/parts/wholesale-stats`

**Out of scope #182** — malý task (2-3 dny), ale neřeší gap. Doporučuji odložit
dokud nebude reálný WHOLESALE_SUPPLIER partner na pilotu.

### §4.4 — Drop-shipping workflow

Zákazník objedná přes eshop → systém notifikuje velkoobchod → velkoobchod
pošle díl rovnou zákazníkovi (ne přes Carmakler sklad). Vyžaduje:

- Order routing logic (per part source: feed vs local)
- Email notifikace velkoobchodu s order detaily
- Tracking flow: velkoobchod zadá tracking → zákazník vidí
- Return/claim workflow (kdo řeší reklamaci?)

**Out of scope #182** — MVP business model (sklad Carmakler) je jednodušší a
funguje dnes. Drop-shipping = separate phase.

### §4.5 — Bulk CSV rozšíření (manufacturer + warranty sloupce)

Spec ukazuje template k stažení pro bulk import. Po přidání 2 polí do Part
musí CSV template + parser akceptovat nové sloupce.

**Polo-scope:** Step 4 (`/api/parts/import`) v Fázi A obsahuje minimální patch
pro backend (manufacturer + warranty columns v parseru). CSV template soubor
(pokud existuje) a UI dokumentace se aktualizují v Fázi B nebo při prvním
reálném import requestu.

---

## §5 — STOP rules / out of scope

### §5.1 — Nedotknout se

- **#88a Wolt commission infrastructure** — live na produkci. `applyCommissionSplit`
  v `/api/stripe/webhook`, `orderItem.commissionRateApplied/carmaklerFee/supplierPayout`
  snapshot pattern. **NEDOTKNI SE** — žádné změny v webhook handler, commission
  logice, nebo snapshot polích.

- **#161 Stripe Connect Express** — live. `SupplierStripeCard`, `syncAccountToDb`,
  `account.updated` handler, `transfers` capability. **NEDOTKNI SE** — plán #182
  nijak nekoliduje, ale impl nesmí „při příležitosti" editovat Stripe Connect
  files.

- **#19 Order confirmation emails** — live. `orderConfirmationCustomerHtml/Text/Subject`,
  `orderNotificationSupplierHtml/Text/Subject`. **NEDOTKNI SE**.

- **TASK-019 inzertní platforma** — funkčně 100% (ověřeno v #181). `Listing`
  model, `/inzerce/*`, `/moje-inzeraty/*`, `/nabidka/*`, watchdog flow,
  `/api/listings/*`, `/api/feeds/import/run` (který importuje listingy,
  ne parts!). **NEDOTKNI SE**.

- **#156 Donor car flow** — má vlastní baseline plán. Samostatný major task,
  out of scope #182.

- **Existující PARTS_SUPPLIER flow** — funguje, vrakoviště přes PWA přidávají
  díly manuálně. **NEDOTKNI SE, pouze extendnout** (přidat WHOLESALE_SUPPLIER
  do role poli tam, kde má smysl spolu existovat).

- **`searchVector` raw SQL triggers** — pokud existují mimo Prisma schema,
  nemodifikovat. Fulltext search pro manufacturer se implementuje přes ILIKE
  fallback v `GET /api/parts` (už existuje pattern v search clause).
  Permanent fix tsvector je samostatný task.

### §5.2 — Nikdy bez autorizace

- **`prisma db push`** — NIKDY. Rozbije migration history.
- **`prisma migrate resolve --applied/--rolled-back`** — NIKDY bez explicit
  lead ACK. Může schovat skutečný drift.
- **Ruční ALTER TABLE v SQL klientovi** — NIKDY.
- **Force-push do remote** — NIKDY.
- **Bypass `--no-verify` na pre-commit hook** — NIKDY.

### §5.3 — Escalation protocols

- **STOP-1 tsvector drift** (§3.3) — explicit memory precedent. Impl eskaluje
  se Option A/B/C přehledem. Lead rychle ACKuje (pattern #155, #162).

- **STOP-2 pre-HOTOVO** — `npm run lint` + `npm run build` + manual smoke
  (wizard submit, katalog filter, detail render). Impl neohlašuje HOTOVO bez
  zeleného lintu/buildu.

- **STOP-3 scope creep** — pokud impl při čtení kódu najde „další věc co
  bych opravil" mimo file manifest §3.11 → **ESKALUJ, neoprav**. Gap-fix je
  narrow scope, nechci out-of-plan edity.

- **STOP-4 Lead decisions missing** — plán má §7 prázdné. Impl NESMÍ začít
  bez vyplněné §7 s Q1-Q5 rozhodnutími. Po dispatch implementatora mu lead
  přidá §7 jako komentář k plánu nebo nový commit.

---

## §6 — LEAD QUESTIONS (5 max)

**Q1: WHOLESALE_SUPPLIER vs PARTS_SUPPLIER — separate role nebo marker?**

Kontext: spec v TASK-QUEUE.md říká „Nová role … jiný flow než vrakoviště —
nepřidává díly ručně, ale importuje katalog". Ale wizard `/parts/new` je
manual flow, ne import flow.

**Recommendation: MARKER only, stejná PWA.**

Důvod:
1. Eshop backend je již postavený (Part model, `/parts/*` API, `/parts/*`
   PWA, feed admin). Duplikovat vše pro WHOLESALE_SUPPLIER = zbytečná práce.
2. Rozdíl není v flow, ale v **zdroji dílů**: PARTS_SUPPLIER zadává manuálně
   přes wizard, WHOLESALE_SUPPLIER importuje přes feed (v `admin/feeds`).
3. Role slouží jako filter v admin UI („show only wholesale feeds") a jako
   authorization pro feed management.
4. Manual wizard zůstává dostupný i pro WHOLESALE_SUPPLIER (edge case: ad-hoc
   přidat díl, který není ve feedu).
5. Budoucí B2B pricing tiers + WHOLESALE_SUPPLIER dashboard variant lze
   postavit na tom bez refactoru rolí.

**Alternativa B: Separate role s vlastní PWA (`/wholesale/*`).** Větší scope,
duplikovaný kód. Doporučuji zamítnout.

**Alternativa C: Oddělený Partner entity (jako vrakoviště v #88a).** Přidává
komplexitu a nekoresponduje se spec, který říká „role". Doporučuji zamítnout.

---

**Q2: `Part.warranty` datový formát — Int (měsíce) nebo String?**

Kontext: spec v TASK-QUEUE.md explicit říká „warranty (String?) — záruka
(\"24 měsíců\")". QA report potvrzuje String bez dalšího upřesnění.

**Recommendation: String? (max 50 znaků).**

Důvody:
1. Spec explicit říká String.
2. Permissive pro různé formulace: „24 měsíců", „zákonná 24 měsíců",
   „doživotní", „3 roky", „1 rok / 30 000 km" (mileage-based pro nové díly).
3. Feed imports mohou mít variace (auto Kelly vrací „24 měsíců", Elit „2
   roky", Bosch „2 years"). Int by vyžadoval normalizaci na každém import
   callu → ztráta informace.
4. Display v UI je přímočarý (1:1 render), neni potřeba i18n formát.

**Trade-off:** filter „záruka ≥ 24 měsíců" nejde jako range query. Ale
katalog filter na warranty není v spec ani v mé Phase A scope (low priority).
Pokud bude požadavek v budoucnu → Fáze B může přidat `warrantyMonths Int?`
paralelně se String.

**Alternativa B: Int (měsíce).** Strukturované, umožní range filter. Ale
ztrácí information density a poruší spec. Doporučuji zamítnout.

---

**Q3: `Part.manufacturer` — enum, free text, nebo normalized list? Součást fulltextu?**

Kontext: spec ukazuje „TRW, Bosch, LUK" — konkrétní značky. Ale neurčuje formát.

**Recommendation: Free text String? (max 100 znaků), index přidám, fulltext
přes ILIKE fallback v existujícím `GET /api/parts` search clause.**

Důvody:
1. Enum je restriktivní: neznámé výrobce (menší brand, ČR-specific) by
   se nedaly přidat bez deploy / DB migration.
2. Normalized list (samostatný `Manufacturer` model) je over-engineering pro
   gap-fix. Lze refaktorovat v Fázi B pokud bude potřeba standardizace.
3. Free text + index + ILIKE search je existující pattern pro `name`,
   `oemNumber`, `partNumber`. Přidáme manufacturer do stejné logiky.
4. Case-insensitive search zachytí „TRW" vs „trw" vs „TRW Automotive" stejně.
5. Raw SQL tsvector trigger pro manufacturer je **out of scope gap-fix**
   (memory `project_recurring_tsvector_drift.md` warning — nemodifikujeme
   tsvector triggers v gap-fix, permanent fix je samostatný task).

**Akceptujeme trade-off:** „TRW" a „TRW Automotive" v DB jsou dvě různé
hodnoty, uživatel se musí trefit do začátku. ILIKE `contains` tohle mitiguje.

**Alternativa B: Enum.** Restriktivní. Doporučuji zamítnout.

**Alternativa C: Samostatný Manufacturer model.** Over-engineering. Doporučuji
zamítnout pro Fázi A; zvažte v Fázi B pokud přibude 50+ manufacturerů.

---

**Q4: Fáze B scope — dělat teď nebo odložit?**

Kontext: Fáze B (B2B pricing, TecDoc, drop-shipping, dedikovaný dashboard)
je explicitní plán, ale žádný z těch 4 bodů nevyřeší QA-flagované gaps.

**Recommendation: ODLOŽIT (defer), #182 řeší jen Fázi A.**

Důvody:
1. QA report #182 scope = 3 konkrétní gaps. Fáze A je splní kompletně.
2. Fáze B položky jsou business decisions (TecDoc licence, drop-shipping
   vs sklad model) nebo čekají na reálný WHOLESALE_SUPPLIER partner na pilotu.
3. Rozšíření scope #182 na Fázi B = risk scope creep → delay na dodání
   gap-fixu, který je na produkci blokující (3 ❌ v QA reportu).
4. Lead může dispatchnout Fázi B položky jako samostatné tasky (#183+) po
   merge #182 podle business priority.

**Alternativa B: Rozšíříme scope o některou položku Fáze B.** Recommendací
je „ne", ale pokud lead trvá → doporučuji **#4.3 (WHOLESALE_SUPPLIER dashboard
variant)** jako nejjednodušší (2-3 dny) a poslouží jako validation testovací
flow pro WHOLESALE_SUPPLIER role end-to-end.

---

**Q5: Wizard UI — manufacturer/warranty vždy, nebo conditional na partType?**

Kontext: manufacturer a warranty dávají business smysl hlavně pro NEW/AFTERMARKET
díly (značkový výrobce + záruka). Pro USED díly může být unknown.

**Recommendation: VŽDY zobrazit, obě optional, bez conditional renderingu.**

Důvody:
1. Vrakoviště **může** znát výrobce u použitého dílu (např. „LUK spojka z
   Octavie" — sourceVIN dešifruje původní výbavu). Conditional hide by zamítl
   validní use case.
2. Warranty pro použité díly typicky není, ale dodavatel může dát „3 měsíce
   funkční záruka" jako přidanou hodnotu. Hide by to zamítl.
3. Conditional rendering přidává kognitivní zátěž (uživatel přepne partType
   → pole zmizí → zmatek). Lineární formulář je jednodušší.
4. Optional fields jsou standardní pattern pro „vyplň pokud víš".
5. Validation: oba fields jsou `z.string().optional()` — prázdné pole =
   žádná hodnota v DB. Žádná UX friction.

**Alternativa B: Conditional (show only for NEW/AFTERMARKET).** Zamítnut
kvůli edge cases + UX bug risk.

---

## §7 — LEAD DECISIONS (ACCEPT / REJECT / AMEND)

> **Lead doplní po dispatchi.** Před implementací musí být každá otázka Q1-Q5
> rozhodnuta a zaznamenána zde. Verbatim copy Q1-Q5 ACCEPT decisions stylu
> #161 §20 LEAD DECISIONS. Implementator nesmí začít bez vyplněné §7.

### Q1 decision:
> *(pending)*

### Q2 decision:
> *(pending)*

### Q3 decision:
> *(pending)*

### Q4 decision:
> *(pending)*

### Q5 decision:
> *(pending)*

### Additional constraints / amendments:
> *(pending — lead může přidat vlastní úpravy scope, STOP rules, atd.)*

---

## §8 — Post-implementation checklist (pre-HOTOVO)

Implementator checkuje před hlášením HOTOVO k lead:

- [ ] Migration aplikovaná (včetně Option A reset dev DB pokud potřeba)
- [ ] `npx prisma validate` exit 0
- [ ] `npx prisma studio` — Part má manufacturer + warranty sloupce
- [ ] Seed data obsahuje WHOLESALE_SUPPLIER user + 2-3 sample Parts
- [ ] `npm run lint` — 0 nových warningů
- [ ] `npm run build` — success
- [ ] Smoke: login jako WHOLESALE_SUPPLIER → `/parts/new` → wizard projde
  s vyplněnými manufacturer + warranty
- [ ] Smoke: `/dily/katalog` → manufacturer filter input funguje
- [ ] Smoke: `/dily/[slug]` detail → manufacturer + warranty block renderuje
- [ ] E2E test `task-182-wholesale-supplier.spec.ts` projde 1/1
- [ ] `__tests__/middleware.test.ts` (pokud updated) projde
- [ ] Git log: 6 atomických commitů per §3.12 suggested sequence
- [ ] Žádné edity mimo file manifest §3.11
- [ ] HOTOVO zpráva obsahuje: commit hashes, migration filename, seed delta
  (kolik nových entries), test pass/fail

---

**Konec plánu #182.**
