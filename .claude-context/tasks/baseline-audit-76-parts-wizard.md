# Baseline Audit — `/parts/new` wizard + `/admin/partners/[id]` (pre-#76a dispatch)

**Author:** evzen-the-king (code audit 2026-04-06)
**Purpose:** Dokumentuje výchozí stav `(pwa-parts)` PWA parts wizard + admin PartnerDetail PŘED dispatch #76a implementátora AI Part Scanner. Kód JIŽ existuje — #76a je rozšíření, ne greenfield.

---

## 1. Existující soubory

### `app/(pwa-parts)/parts/new/`
- `page.tsx` (113 řádků) — 3-step wizard orchestrator
- `layout.tsx`
- `loading.tsx`
- `error.tsx`

**Současný flow:** `Step 1 PhotoStep → Step 2 DetailsStep → Step 3 PricingStep`

### `components/pwa-parts/parts/`
- `AddPartWizard.tsx` (wrapper s `currentStep` prop)
- `PhotoStep.tsx`
- `DetailsStep.tsx` — type `PartDetails`: `name`, `category`, `condition`, `conditionNote`, `description`, `oemNumber`, `sourceVin`, `compatibility[]`
- `PricingStep.tsx` — type `PricingData`: `price`, `vatIncluded`, `quantity`, `deliveryOptions`
- `CompatibilitySelector.tsx`
- `PartCard.tsx`, `PartFilters.tsx`

### API endpoint
- `POST /api/parts` (wizard volá na `app/(pwa-parts)/parts/new/page.tsx:63`)
- Očekává body: `name`, `category`, `condition`, `price`, `compatibleBrands`, `compatibleModels`, `images`

### Sourozenecké stránky v `(pwa-parts)`:
- `app/(pwa-parts)/parts/page.tsx` (landing)
- `app/(pwa-parts)/parts/my/page.tsx` (moje díly)
- `app/(pwa-parts)/parts/import/page.tsx` (bulk import)
- `app/(pwa-parts)/parts/orders/page.tsx` + `[id]/page.tsx` (objednávky)
- `app/(pwa-parts)/parts/profile/page.tsx`

---

## 2. ⚠️ DUPLICATE FOUND

`app/(partner)/partner/parts/new/page.tsx` **taky existuje**, ale je to **single-page form** (ne 3-step wizard) s vlastními category/condition options (`ENGINE`, `TRANSMISSION` enum hodnoty, ne český labely). Pravděpodobně legacy nebo paralelní flow pro `PARTNER_VRAKOVISTE`/`PARTNER_BAZAR` role.

**Rozhodnutí pro #76a implementátora:**

| Option | Popis | Riziko |
|---|---|---|
| **(a) Doporučeno** | Rozšířit pouze `(pwa-parts)/parts/new/page.tsx` na 5-tier AI scanner flow + ponechat `(partner)` jako legacy fallback | Nízké — žádný breaking change |
| (b) | Smazat `(partner)/partner/parts/new/page.tsx` a unifikovat do PWA | Vyžaduje routing/role gating audit, riziko 404 pro existující uživatele |
| (c) | Rozšířit oba paralelně | Overkill, duplicate maintenance |

**Plánovač #76a dispatch instrukce:** Explicitně zmínit duplicate a instruovat implementátora Option (a). `(partner)` cleanup může být separate #76-cleanup task později.

---

## 3. Gap analýza — co #76v2 plán musí přidat

| #76v2 §X | Současný kód | Gap / action |
|---|---|---|
| 5-tier scan flow (label/code/voice/photo+vision/manual) | 3-step (Photo/Details/Pricing) | **Přidat Tier 0 "scan entry"** před PhotoStep se 5 options |
| §6 Vision OCR | Žádný | **Net new** — `/api/parts/scan` endpoint + Claude Vision integration |
| §6.6 Voice input | Žádný | **Net new** — `VoiceDescriptionInput.tsx` + `/api/parts/transcribe` (Whisper) |
| §6.4 ZXing barcode | Žádný | **Net new** — `BarcodeScanner.tsx` |
| §11.11 JIT hints | Wizard tour neexistuje | **Net new**, žádné migration |
| §11.1 Touch targets 56px | Neověřeno | **Audit existing** komponenty + bump |
| §13 Offline queue (Serwist + IndexedDB) | Neověřeno (Serwist jinde existuje) | **Verifikovat** v Serwist config |
| §0 Commission system | Žádný v PWA | **Net new** admin UI v `(admin)/admin/partners/[id]` |
| §0.4 Stripe Connect dynamic split | Neověřeno | **Pravděpodobně net new** webhook handler |

---

## 4. Recommendations pro plánovače

1. **Aktualizovat #76v2 §3 "Vstupní stav — co už máme"** aby reflektovalo tento baseline (soubory, typy, endpointy jmenovitě)
2. **Přidat §3.x "Duplicate (partner) legacy flow"** s recommendation Option (a)
3. **V §22 dispatch sekvenci** uvést explicitní pokyn: "Implementator #76a začíná rozšířením `app/(pwa-parts)/parts/new/page.tsx`, NEČTE `(partner)/partner/parts/new/*`, NEMAZÁVÁ legacy kód"
4. **V §4 Database changes** ověřit že `Part` Prisma model má pole pro nové features (partsScanLogId, scanType, aiConfidence, rawVisionResponse, voiceSeconds) — pokud ne, migration musí být v #76a phase 1

---

## 5. TL;DR — `/parts/new`

**`/parts/new` baseline JE healthy 3-step wizard.** Implementátor #76a má jasnou výchozí pozici — rozšiřovat, ne stavět. Duplicate `(partner)/partner/parts/new` vyžaduje explicit Option (a) rozhodnutí v dispatch. Commission system (§0) a Stripe Connect dynamic split jsou pravděpodobně net new — potřebují verification.

---

# Část 2 — `/admin/partners/[id]` PartnerDetail audit

**Evžen audit 2026-04-06, pro §0.3 commission slider UI dispatch #76a**

## 2.1 Existující soubory

- `app/(admin)/admin/partners/[id]/page.tsx` (11 řádků) — server component, thin wrapper
- `app/(admin)/admin/partners/[id]/loading.tsx` + `error.tsx` — full route
- **`components/admin/partners/PartnerDetail.tsx` (698 řádků)** — main client component (extend target)
- `components/admin/partners/PartnerStatusBadge.tsx`
- `components/admin/partners/PartnersTable.tsx`

## 2.2 PartnerDetail.tsx layout

2-column lg grid (`grid grid-cols-1 lg:grid-cols-2 gap-6`):

| Sloupec | Card |
|---|---|
| Levý | Údaje partnera (name, contact, phone, email, web, address, city, region, notes) |
| Levý | Stav a přiřazení (score, status select, manager) |
| Pravý | Zaznamenat kontakt (activity form) |
| Pravý | Timeline (activity log) |

## 2.3 Existing funkce

- `savePartner()` — `PATCH /api/partners/[id]`
- `changeStatus()` — `PATCH /api/partners/[id]` se status field
- `submitRejection()` — `PATCH` s `rejectionReason`
- `activatePartnership()` — `POST /api/partners/[id]/activate` (vytvoří user account)
- `addActivity()` — `POST /api/partners/[id]/activities`
- `assignManager()` — `PATCH` s `managerId`

## 2.4 Partner interface (řádky 15-40)

Obsahuje: `id`, `name`, `type`, `ico`, `address`, `city`, `region`, `zip`, `phone`, `email`, `web`, `contactPerson`, `estimatedSize`, `status`, `score`, `rejectionReason`, `managerId`, `userId`, `slug`, `notes`, `description`, `manager`, `user`, `_count`.

**❌ ŽÁDNÉ commission fieldy.** Žádný `commissionRate`, žádný `PartnerCommissionLog` reference. **Net new field.**

## 2.5 Auth gating (řádek 82-83)

```ts
const canActivate = session?.user?.role === "ADMIN" || session?.user?.role === "BACKOFFICE";
```

→ Implementator #76a může reusovat tento pattern pro `canEditCommission`.

## 2.6 Implementator #76a — concrete steps pro §0.3

**Edit existing:**
1. `components/admin/partners/PartnerDetail.tsx`:
   - Přidat `commissionRate: string` do Partner interface (~line 30)
   - Importovat 3 net-new komponenty
   - Vložit nový Card "Provize" do levého sloupce **mezi** "Údaje partnera" a "Stav a přiřazení" (cca line 429)
   - Card obsahuje: `<CommissionRateSlider />` + `<CommissionHistoryList />` + button → `<CommissionEditDialog />`

**Net new files:**
2. `components/admin/partners/CommissionRateSlider.tsx` — read-only display, range 12-20, default 15
3. `components/admin/partners/CommissionHistoryList.tsx` — fetch `GET /api/partners/[id]/commission-history`
4. `components/admin/partners/CommissionEditDialog.tsx` — Modal s slider + **povinný reason textarea** + submit
5. `app/api/partners/[id]/commission/route.ts` — `PATCH` handler, validace 12-20, vytvoří `PartnerCommissionLog` entry
6. `app/api/partners/[id]/commission-history/route.ts` — `GET` handler, log seřazený podle `changedAt DESC`
7. Prisma migration: `Partner.commissionRate Decimal @default(15.00) @db.Decimal(4,2)` + `model PartnerCommissionLog { id, partnerId, oldRate, newRate, reason, changedById, changedAt }`

**Žádné delete operace.** Existing flow (activate/reject/status/timeline) netknutý.

## 2.7 Evžen doporučení pro plánovače #76a update

1. **Pozice Card "Provize"** — mezi "Údaje partnera" a "Stav a přiřazení" v levém sloupci. Logicky patří k základním údajům, vizuálně oddělené od status workflow.
2. **Audit trail UI** — `CommissionHistoryList` vypadat jako existing Timeline (right column) — chronologický seznam s avatarem changedBy, `oldRate → newRate`, reason, datum.
3. **Slider granularita** — plán říká `Decimal(4,2)` → 0.01, ale UX-wise **0.5 nebo 1.0 je lepší**. Plánovač by měl rozhodnout.
4. **Mandatory `reason`** — povinný textarea v dialog, blokovat submit pokud prázdný. Důvod §0.6 LEGAL — audit trail musí vysvětlit proč.
5. **`canEditCommission` gating** — ADMIN + BACKOFFICE only. Plánovač má zvážit, jestli REGIONAL_DIRECTOR má právo (pravděpodobně NE — business decision).

## 2.8 TL;DR — `/admin/partners/[id]`

**`/admin/partners/[id]` baseline EXISTUJE a je healthy.** Implementator #76a extend existing 698-line `PartnerDetail.tsx`, přidá 3 net-new komponenty, 2 net-new API endpoints, 1 Prisma migration. Žádné greenfield, žádné delete.

---

# Část 3 — `prisma/schema.prisma` `Part` model audit

**Evžen audit 2026-04-06, pro §4 Database changes dispatch #76a**

## 3.1 Lokace

`prisma/schema.prisma:888-953` (66 řádků, 30+ polí)

## 3.2 Existující pole `Part` model

| Sekce | Pole | Poznámka |
|---|---|---|
| ID | `id`, `slug`, `supplierId`, `supplier` (User relation) | slug unique |
| Základní | `category`, `name`, `description`, `partNumber`, `oemNumber` | category string-enum: ENGINE, TRANSMISSION, BRAKES, SUSPENSION, BODY, ELECTRICAL, INTERIOR, WHEELS, EXHAUST, COOLING, FUEL, OTHER |
| Search | `searchVector` | `Unsupported("tsvector")?` — Postgres FTS už existuje (#54a) |
| Typ | `partType` (default "USED") | USED / NEW / AFTERMARKET |
| Stav | `condition` | NEW / USED_GOOD / USED_FAIR / USED_POOR / REFURBISHED |
| Cena | `price`, `wholesalePrice`, `markupPercent`, `currency`, `vatIncluded` | wholesale+markup z feedu |
| Sklad | `stock`, `weight`, `dimensions` | |
| Kompatibilita | `compatibleBrands`, `compatibleModels`, `compatibleYearFrom`, `compatibleYearTo`, `universalFit` | ⚠️ JSON jako String, ne native array |
| Status | `status` (default "DRAFT"), `viewCount` | DRAFT / ACTIVE / SOLD / INACTIVE |
| Feed | `feedConfigId`, `feedConfig`, `externalId` | Bulk import ready |
| Relace | `images` (PartImage[]), `orderItems` (OrderItem[]) | PartImage: url, order, isPrimary |
| Timestamps | `createdAt`, `updatedAt` | |

**Indexy:** `supplierId`, `category`, `status`, `price`, `partType`, `feedConfigId`, `externalId`

## 3.3 Gap analysis pro #76v2 §4

| #76v2 §4 field | Existuje? | Akce |
|---|---|---|
| `scanLogId` | ❌ NE | NET NEW — FK na `PartScanLog` |
| `scanType` | ❌ NE | NET NEW — String enum LABEL/BARCODE/VOICE/PHOTO/MANUAL |
| `aiConfidence` | ❌ NE | NET NEW — Float? (0.0-1.0) |
| `rawVisionResponse` | ❌ NE | NET NEW — Json? (raw Claude Vision response pro debug/replay) |
| `voiceSeconds` | ❌ NE | NET NEW — Int? (Whisper duration pro cost tracking) |

**Verdict:** Všech 5 polí **net new**. Žádný refactor existing. **Pure additive migration.**

## 3.4 Open question pro plánovače — Option A vs Option B

**Option A — Denormalized** (přidat 5 polí přímo do `Part`):
- ✅ Jednodušší queries (1 JOIN méně)
- ❌ Part row roste (rawVisionResponse je velký Json blob)
- ❌ Hard delete scan log = lost audit
- ❌ Jeden Part = jen 1 scan attempt (žádný rescan history)

**Option B — Normalized** (separate `PartScanLog` model) — **EVŽEN DOPORUČUJE**:

```prisma
model PartScanLog {
  id                String   @id @default(cuid())
  partId            String
  part              Part     @relation(fields: [partId], references: [id], onDelete: Cascade)
  scanType          String   // LABEL / BARCODE / VOICE / PHOTO / MANUAL
  aiConfidence      Float
  rawVisionResponse Json?
  voiceSeconds      Int?
  createdAt         DateTime @default(now())
  createdById       String
  createdBy         User     @relation(fields: [createdById], references: [id])

  @@index([partId])
  @@index([scanType])
}

model Part {
  // ... existing fields, žádné scan fields ...
  scanLogs          PartScanLog[]
}
```

**Důvody pro Option B:**
1. **5-tier scan flow** implicitně počítá s víc attempts (label → fail → barcode → fail → manual). Každý attempt = entry v logu, ne overwrite.
2. `rawVisionResponse` je velký blob (5-50KB per scan) — denormalizace by nafoukla Part rows ve FTS indexu.
3. **#80 LEGAL audit trail** — pokud zákazník reklamuje ("popis byl AI-generated, nesedí"), potřebujeme kompletní trace všech scan attempts s timestamps a confidence scores.
4. **Cost tracking** pro Whisper API — agregace `SUM(voiceSeconds)` per vrakoviště per měsíc je snadná analytická query bez dotazu na celý Part row.

**Plánovač by měl rozhodnout** (Evžen je READ-ONLY).

## 3.5 BONUS finding — potvrzuje #50

`prisma/schema.prisma:975` `Order.status`:
```prisma
status String @default("PENDING") // PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
```

**`PACKING` NENÍ v enum.** Potvrzuje #50 audit — UI tracker zobrazuje fantom "Balení" step. **Option A cleanup z #50 je správný.**

## 3.6 Pattern note pro plánovače

Prisma v tomto repu používá `String` s comment-style enum místo native `enum`. Implementátor #76a by měl použít **stejný pattern** pro `scanType`:

```prisma
scanType String? // LABEL, BARCODE, VOICE, PHOTO, MANUAL
```

**NE** `enum ScanType { ... }` (konzistentní s existing codebase).

## 3.7 TL;DR — `Part` model

**`Part` model JE healthy a ready k extend.** Žádný refactor, čistě additive migration. Plánovač #76a rozhodne Option A (denormalized) vs Option B (normalized `PartScanLog`). **Evžen doporučuje B**. Žádné existing fields se nemění, zero riziko regrese pro feedConfig import ani FTS.
