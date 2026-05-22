# Plán #76v2 — AI Part Scanner pro vrakoviště (STD + 5-tier flow + Wolt model)

**Typ:** Implementační plán v2 (žádný kód v tomto dokumentu)
**Datum:** 2026-04-06
**Verze:** v2 (rewrite po #77 research findings + uživatelských rozhodnutích)
**Plánovač:** planovac
**Návazné na:** Research #75 (`research-task-75.md`) + #77 (`research-task-77.md`)
**Schválená varianta:** STD (Claude Vision + ML Kit barcode + bez TecDoc v MVP)
**Cílový PWA:** `(pwa-parts)` — vrakoviště PWA pro PARTS_SUPPLIER + PARTNER_VRAKOVISTE

---

## 0. Business model — Wolt 1:1 marketplace (ZÁKLAD)

> **KRITICKÉ:** Tento celý plán **stojí na business modelu Wolt/Glovo/Bolt/DoorDash 1:1**. Vrakoviště NIKDY neplatí za PWA, AI scanner, hosting ani featury. Carmakler vydělává **výhradně z komise** z prodaných dílů. Pokud se model změní, vrať se na začátek a re-plánuj.

### 0.1 Komisionářský model — variable komise 12-20%

**Uživatelské rozhodnutí (2026-04-06):**
> *"ja bych dal 12-20% s tím že podle domluvy se to nastaví v admin panelu pro vrakoviste"*

| Atribut | Hodnota |
|---|---|
| **Default komise** | 15 % (default pro nové vrakoviště) |
| **Range** | 12 % – 20 % |
| **Per-vrakoviště override** | ANO — admin nastaví v PartnerDetail |
| **Kdo nastavuje** | ADMIN, BACKOFFICE (NE BROKER, NE vrakoviště samo) |
| **Audit log** | ANO — kdo, kdy, jaká stará/nová hodnota, důvod |
| **Early adopters (pilot)** | 0 % komise první 3 měsíce (viz §25 Pilot Phase) |

### 0.2 Prisma schema — `Partner.commissionRate`

```prisma
model Partner {
  // ... existing fields ...

  // === NOVÉ POLE PRO #76v2 ===
  commissionRate    Decimal  @default(15.00) @db.Decimal(4, 2)
  // Range: 12.00 - 20.00 (validated v API + admin UI)
  // Default: 15.00 (střed range)
  // Pilot: lze nastavit 0.00 prvních 3 měsíce manuálně

  commissionRateAt  DateTime @default(now())
  // Kdy byla naposledy změněna (pro reporting)

  commissionLog     PartnerCommissionLog[]
}

model PartnerCommissionLog {
  id           String   @id @default(cuid())
  partnerId    String
  partner      Partner  @relation(fields: [partnerId], references: [id], onDelete: Cascade)

  oldRate      Decimal  @db.Decimal(4, 2)
  newRate      Decimal  @db.Decimal(4, 2)
  reason       String?  // např. "Pilot ukončen", "Volume discount", "Strategic partnership"

  changedById  String
  changedBy    User     @relation(fields: [changedById], references: [id])
  changedAt    DateTime @default(now())

  @@index([partnerId, changedAt])
}
```

**Migrace:**
```bash
npx prisma migrate dev --name add_partner_commission_rate
```

**Pozn.:** Existující `Partner` záznamy dostanou default 15 %. Pro pilot vrakoviště v Praze admin manuálně sníží na 0 % v `PartnerDetail` UI (timer 3 měsíce — možno automatizovat cron jobem v fázi 2).

### 0.3 Admin UI — slider v PartnerDetail

**Cesta:** `app/(admin)/admin/partners/[id]/page.tsx`

**Nový section "Komise":**

```
┌─────────────────────────────────────────┐
│ KOMISE                                   │
├─────────────────────────────────────────┤
│  Aktuální sazba: 15.00 %                 │
│  ├─ Naposledy změněna: 2026-04-01         │
│  └─ Změnil: admin@carmakler.cz            │
│                                          │
│  ◄ ──●─────────── ►   12.0  ●  20.0     │
│                                          │
│  [Důvod změny: ___________________]      │
│  [    Uložit změnu (Audit log)    ]      │
│                                          │
│  ─── Historie změn ───                   │
│  • 2026-04-01: 12% → 15% (admin: …)      │
│  • 2026-01-15: 0% → 12% (admin: pilot…)  │
└─────────────────────────────────────────┘
```

**Komponenty:**
- `CommissionRateSlider.tsx` — Range slider 12-20 s 0.5 % step + numeric input
- `CommissionHistoryList.tsx` — Tabulka audit logu
- `CommissionEditDialog.tsx` — Modal s důvodem (required text)

**API endpoint:** `PATCH /api/admin/partners/[id]/commission`
- Auth: ADMIN/BACKOFFICE only
- Body: `{ newRate: number 12-20, reason: string }`
- Action:
  1. Validate range (12 ≤ newRate ≤ 20) — Zod
  2. Insert `PartnerCommissionLog` (with old + new + actor + reason)
  3. Update `Partner.commissionRate` + `commissionRateAt`
  4. Trigger Pusher event `partner-commission-updated` (optional, fáze 2)
  5. Return 200 + updated Partner

### 0.4 Stripe Connect split payment — dynamicky

**Stávající stav:** Stripe checkout flat platí Carmakler (existuje #17 webhook).

**#76v2 změna:** Při webhook `checkout.session.completed` → fetch part → fetch supplier (User → Partner) → use `Partner.commissionRate` pro split:

```ts
// V app/api/stripe/webhook/route.ts (rozšíření existujícího)
const orderItems = await prisma.orderItem.findMany({
  where: { orderId },
  include: { part: { include: { supplier: { include: { partner: true } } } } },
});

for (const item of orderItems) {
  const partner = item.part.supplier.partner;
  const commissionRate = partner?.commissionRate ?? 15; // Decimal → Number

  const grossAmount = item.price * item.quantity;
  const carmaklerFee = Math.round(grossAmount * (commissionRate / 100));
  const supplierPayout = grossAmount - carmaklerFee;

  // Ulož do OrderItem (audit) + transfer Stripe Connect
  await prisma.orderItem.update({
    where: { id: item.id },
    data: {
      commissionRateApplied: commissionRate,
      carmaklerFee,
      supplierPayout,
    },
  });

  // Stripe Connect transfer
  if (partner?.stripeAccountId) {
    await stripe.transfers.create({
      amount: supplierPayout,
      currency: "czk",
      destination: partner.stripeAccountId,
      transfer_group: `order_${orderId}`,
    });
  }
}
```

**Nové fieldy v `OrderItem`:**

```prisma
model OrderItem {
  // ... existing ...

  commissionRateApplied  Decimal? @db.Decimal(4, 2)  // Snapshot komise při prodeji
  carmaklerFee           Int?                         // Carmakler keep
  supplierPayout         Int?                         // Vrakoviště dostane
}
```

**Důležité:** `commissionRateApplied` je snapshot — když admin změní komisi NA budoucí prodeje, staré objednávky se NEPŘEPOČÍTÁVAJÍ.

### 0.5 Reporting — average komise across platform

**Endpoint:** `GET /api/admin/reports/commission-summary` (ADMIN only)

**Response:**
```json
{
  "totalPartners": 47,
  "avgCommissionRate": 14.8,
  "rateDistribution": {
    "0": 12,    // pilot vrakoviště
    "12-13": 5,
    "13-15": 18,
    "15-17": 8,
    "17-20": 4
  },
  "totalRevenueY2D": 1250000,
  "carmaklerFeesY2D": 187500,
  "suppliersPayoutY2D": 1062500
}
```

**Použití:** Admin dashboard widget "Průměrná komise: 14.8% (47 vrakovišť)" + drill-down chart.

### 0.6 Komisionářský model — fakturace

**KRITICKÉ — čeká na #80 LEGAL review před launch:**

| Tok | Kdo komu | Doklad |
|---|---|---|
| Zákazník platí dílu | Zákazník → Carmakler (Stripe) | Faktura Carmakler → zákazník (cena dílu vč. DPH) |
| Carmakler payout | Carmakler → Vrakoviště (Stripe Connect) | Vrakoviště faktura Carmakleru za **služby** (dodaný díl mínus komise) |
| Carmakler komise | Vrakoviště → Carmakler | Carmakler faktura vrakovišti za **zprostředkování** (komise % z brutto) |

**Důsledky:**
- Vrakoviště musí být plátce DPH (nebo neplátce s explicit handlingem)
- Carmakler je komisionář v rámci § 577 ObčZ
- Reklamace: Carmakler primárně řeší (B2C), pak regres na vrakoviště
- **Task #80 LEGAL** musí vyřešit DPH, reklamace, OZ, ZOS — PŘED launch

**Tento plán neimplementuje legal logiku** — pouze technickou infrastrukturu (komise rate + payout split). Legal text v ObchPodm + Reklamačním řádu je out-of-scope #76v2.

### 0.7 Vrakoviště drží díl (žádný centrální sklad)

**Model:** Vrakoviště drží díl ve vlastním skladu, Carmakler nemá fyzický kontakt. Po objednávce:
1. Vrakoviště dostane notifikaci (PWA push + email)
2. Vrakoviště zabalí + vytiskne ŠÍ Carmakler shipping label (existing #17)
3. Vrakoviště předá kurýrovi (Zásilkovna, DPD, PPL, GLS — existing #15)
4. Tracking pro zákazníka přes Carmakler interface (existing #21)

**Důsledek pro #76v2:**
- Žádný "warehouse mode" v plánu
- Žádný centrální sklad
- Žádný transfer dílů mezi vrakovišti
- Stock count = vrakovišťní lokální stock (nikoliv Carmakler aggregated)

### 0.8 Wolt model — implications pro #76v2 plán

| Wolt princip | Carmakler aplikace | Dopad na #76v2 |
|---|---|---|
| Free tool for supply | PWA + AI scanner ZDARMA | Žádný subscription gate, žádný "premium" tier |
| Commission jen z transakcí | 12-20 % z prodaného dílu | Žádný "per scan" charge, AI cost je Carmakler cost |
| White glove onboarding | Owner field sales (viz §25) | Pilot region Praha + osobní training |
| Liquidity = KPI #1 | 30+ vrakovišť, 1000+ dílů (viz §24) | AI scanner musí "wow" první kontakt — TIME-TO-FIRST-PART < 5 min |
| Founding member status | Zlatý badge, 0 % komise 3 měsíce | UI badge ve vrakovišti detailu |

**Klíčový insight:** Pokud AI scanner není **WOW factor** při first impression, vrakoviště nepoužije PWA, neexistují díly, neexistuje liquidita, marketplace umírá. **AI scanner = supply-side flywheel trigger.**

---

## 1. Cíl

Implementovat **wow-factor "AI scanner"** feature do PWA vrakoviště, který umožní dodavatelům přidat díl do katalogu **vyfocením místo ručního vyplnění formuláře**. Systém musí pokrýt **5 tierů** od ideálního případu (čitelný štítek) až po fallback (neznámý díl, ruční zadání), bez dead-end stavu pro uživatele. Po uložení vygenerovat vlastní QR štítek pro inventarizaci.

**Klíčové vlastnosti:**
- Offline-first (vrakoviště pracuje u rozebíraného auta venku, špatné připojení)
- Žádný dead-end — každý tier má jasnou cestu vpřed
- Auto-fill formuláře z AI extrakce → user pouze potvrzuje + doplní cenu/stav
- PDF tisk QR štítku po uložení → inventarizace přes vlastní kódy
- Cost-efficient (~$0,005/scan při použití Claude Sonnet 4.5)

---

## 2. Architektura — 5-tier flow

```
                    ┌─────────────────────────────────┐
                    │   /parts/scan  (PWA entrypoint) │
                    │   Camera + tier picker          │
                    └─────────────┬───────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
       [TIER 1]            [TIER 1.5]          [TIER 3 / 4]
   "Mám štítek"        "Mám barcode"       "Nemám štítek"
              │                   │                   │
              ▼                   ▼                   │
    Foto štítku          Camera ZXing scan            │
              │                   │                   │
    POST /scan-label         barcode found?           │
       (Claude Vision)           │                    │
              │              ┌───┴───┐                │
              ▼              ▼       ▼                │
    confidence ≥ 0.6?    string    null               │
              │                   │                   │
    ┌─────────┴─────────┐         │                   │
    ▼                   ▼         │                   │
  YES                  NO         │                   │
 [TIER 1]            [TIER 2]     │                   │
  Auto-fill          Manual       │                   │
  fields ✨          OEM input    │                   │
    │                   │         │                   │
    │                   ▼         │                   │
    │              user typuje    │                   │
    │              kód z fotky    │                   │
    │                   │         │                   │
    └────────┬──────────┴─────────┘                   │
             │                                         │
             │       ┌─────────────────────────────────┘
             │       │
             │       ▼
             │  Foto celého dílu
             │       │
             │  POST /scan-part
             │       │
             │  ┌────┴────┐
             │  ▼         ▼
             │ recognized? unknown
             │  │         │
             │ [TIER 3]  [TIER 4]
             │ Auto-fill  Generate
             │ category   visual desc
             │ + brand    "kovová trubka 30 cm…"
             │  │         │
             │  └────┬────┘
             │       │
             ▼       ▼
        ┌──────────────────────┐
        │  ScanResult preview  │
        │  user edit + confirm │
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │  Existing 3-step      │
        │  wizard pre-filled    │
        │  (DetailsStep,        │
        │   PricingStep)        │
        └──────────┬───────────┘
                   ▼
            POST /api/parts
            (existing endpoint)
                   ▼
        ┌──────────────────────┐
        │  [TIER 5] Po uložení │
        │  Generate qrSlug     │
        │  → Show "Vytisknout  │
        │     štítek" CTA      │
        └──────────┬───────────┘
                   ▼
            GET /api/parts/[id]/label.pdf
                   ▼
            User vytiskne na A4
            nebo Brother QL
                   ▼
        ┌──────────────────────┐
        │  Inventory mode:     │
        │  Sken QR později →   │
        │  /parts/by-qr/[slug] │
        │  → redirect na       │
        │  /parts/[id] detail  │
        └──────────────────────┘
```

**Klíčové designové principy:**
- Jeden vstupní bod (`/parts/scan`) s tier pickerem, ne 3 oddělené flows
- Každý tier končí v ScanResult preview screen → user potvrdí/upraví
- ScanResult vždycky předá data do existujícího `parts/new` wizardu (Details + Pricing zůstávají)
- Žádný tier nezamkne uživatele — vždy existuje "zadat ručně" tlačítko

---

## 3. Vstupní stav — co už máme

| Komponenta | Stav | Cesta |
|------------|------|-------|
| Anthropic SDK | ✅ instalován | `@anthropic-ai/sdk@^0.80.0` (used in `app/api/assistant/*`) |
| Cloudinary upload | ✅ funguje | `app/api/upload/route.ts` (preset `parts`) |
| Service Worker (Serwist) | ✅ funguje | `serwist@^9.5.7` + `@serwist/next` + `public/sw.js` |
| Online/offline detekce | ✅ hotová | `OnlineStatusProvider` + `OfflineBanner` použité v `(pwa-parts)/layout.tsx` |
| IndexedDB wrapper | ✅ instalován | `idb@^8.0.3` |
| QR generování | ✅ instalován | `qrcode@^1.5.4` + `@types/qrcode@^1.5.6` |
| PDF generování | ✅ instalován | `jspdf@^4.2.1` |
| Framer Motion | ✅ instalován | `framer-motion@^12.38.0` |
| 3-step add wizard | ✅ existuje | `app/(pwa-parts)/parts/new/page.tsx` (Photo→Details→Pricing) |
| Part model + API | ✅ existuje | `prisma/schema.prisma:888-948`, `app/api/parts/route.ts` |
| `oemNumber` field | ✅ existuje | `Part.oemNumber String?` (nepřejmenovat na `oemCode`!) |
| `partNumber` field | ✅ existuje | `Part.partNumber String?` |
| Existing Claude prompts | ✅ reference | `app/api/assistant/generate-description/route.ts` (model `claude-sonnet-4-6-20250514`) |
| Role gating | ✅ funguje | middleware + `/api/parts` whitelist `PARTS_SUPPLIER, PARTNER_VRAKOVISTE, ADMIN, BACKOFFICE` |

**Chybí (k přidání):**
| Komponenta | Stav | Co s tím |
|------------|------|----------|
| `@zxing/browser` | ❌ chybí | `npm i @zxing/browser @zxing/library` (~150 KB gzipped) |
| `qrSlug` na Part modelu | ❌ chybí | Prisma migration |
| `scanConfidence`, `scanMethod` na Part | ❌ chybí | Prisma migration |
| `lib/claude-vision.ts` wrapper | ❌ chybí | Nový soubor |
| `lib/pdf-label.ts` | ❌ chybí | Nový soubor |
| `lib/parts/scan-queue.ts` (IndexedDB) | ❌ chybí | Nový soubor |
| Scan API endpoints | ❌ chybí | 4 nové route handlery |
| `/parts/scan/page.tsx` | ❌ chybí | Nová stránka |
| `ScanCameraCapture`, `TierSelector`, `ScanResult`, `BarcodeScanner`, `ConfidenceIndicator`, `QrLabelDownloadButton` | ❌ chybí | 6 nových komponent |
| `ScanStat` model | ❌ chybí | Optional pro cost tracking — viz §13 |

→ **Klíčový insight:** ~70 % infrastruktury už máme. Tento plán je o **napojení existujících kostek**, ne o stavbě od základů.

---

## 4. Database changes — Prisma diff

### 4.1 Part model — přidat 4 fieldy

```prisma
model Part {
  // ... existing fields ...

  // === NOVÉ POLE PRO #76 ===
  qrSlug          String? @unique  // unikátní slug pro QR (random hash, ne SEO)
  scanConfidence  Float?           // 0.0–1.0 pokud byla použita AI scan
  scanMethod      String?          // STICKER_OCR | BARCODE | METAL_OCR | VISUAL_AI | MANUAL
  scanCostUsd     Float?           // pro cost monitoring (sum cost všech scan calls pro tento part)

  // ... rest of existing fields ...

  @@index([qrSlug])
}
```

**Pozn.:**
- `oemNumber String?` **už existuje** — NEPŘIDÁVAT `oemCode`. Task description používá název `oemCode`, ale Part má `oemNumber` (a `partNumber`). Zachovat existující.
- `qrSlug` je nullable kvůli backward compatibility — staré dily nemají QR; generuje se až při prvním requestu na PDF.
- `scanMethod` jako string (ne enum) pro snadnou rozšiřitelnost — convention via constants v `lib/parts/scan-methods.ts`.
- `scanCostUsd` zanedbatelně malý decimal, ale agreguje se do měsíčního reportu.

### 4.2 Volitelný nový model — ScanLog (rate limiting + audit)

**Pokud chceme cost limiting + audit log:**

```prisma
model PartsScanLog {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  scanType     String   // SCAN_LABEL | SCAN_PART | DESCRIBE_PART | BARCODE_FALLBACK | VOICE_TRANSCRIBE
  partId       String?  // nullable — některé scany nedokončí v Part (dropouty)
  imageUrl     String?  // Cloudinary URL fotky, kterou uživatel vyfotil
  costUsd      Float
  confidence   Float?
  voiceSeconds Decimal? @db.Decimal(6, 2)  // v2 NEW — pro VOICE_TRANSCRIBE Whisper API audit
  rawResponse  Json?    // pro debugging, anonymized
  success      Boolean
  errorMessage String?
  createdAt    DateTime @default(now())

  @@index([userId, createdAt])
  @@index([createdAt])
  @@index([scanType, createdAt])  // v2 NEW — split reporting Vision vs Whisper costs
}
```

**v2 NEW field `voiceSeconds`:** Pro voice input (§6.6) ukládáme délku audio v sekundách → umožňuje per-user kvótu (§13 50/den/user) + cost reporting per scan type. Decimal(6,2) = max 9999.99 sekund per záznam (víc než dost pro 60s recording limit).

**STD doporučení:** přidat. Bez logu nelze efektivně rate-limitovat per user (např. 100 scanů/den) ani sledovat náklady. Implementační overhead je malý (~30 řádků).

**MIN alternativa:** Nepřidávat, počítat cost agregovaně přes Anthropic dashboard (manuální sledování).

### 4.3 Migration command

```bash
npx prisma migrate dev --name add_part_scanner_fields
```

Pozor na migration drift — `prisma/schema.prisma:900` má `searchVector Unsupported("tsvector")?` (viz #54). Migrace musí být kompatibilní s tím schématem (Postgres-only feature).

---

## 5. Backend — API endpoints

### 5.1 `POST /api/parts/scan-label` — Tier 1 (Claude Vision OCR)

**Cesta:** `app/api/parts/scan-label/route.ts`

**Účel:** User vyfotil **štítek/sticker** na dílu. Endpoint pošle foto Claude Sonnet 4.5 Vision API se strukturovaným promptem, dostane JSON s extrahovanými poli, vrátí klientovi.

**Auth:** Session check + role whitelist (stejná jako `/api/parts` POST).

**Rate limiting:** 100 scanů/den per user (přes `PartsScanLog` count).

**Request schema (Zod):**
```ts
const scanLabelRequestSchema = z.object({
  imageUrl: z.string().url(),  // už uploadované na Cloudinary přes /api/upload
  hint: z.string().max(200).optional(),  // volitelný uživatelský hint, např. "je to ECU jednotka"
});
```

**Response schema (Zod):**
```ts
const scanLabelResponseSchema = z.object({
  success: z.boolean(),
  confidence: z.number().min(0).max(1),
  oemNumber: z.string().nullable(),
  manufacturer: z.string().nullable(),
  partTypeGuess: z.string().nullable(),       // free text, např. "fuel injector"
  categoryGuess: z.enum([
    "ENGINE","TRANSMISSION","BRAKES","SUSPENSION","BODY",
    "ELECTRICAL","INTERIOR","WHEELS","EXHAUST","COOLING","FUEL","OTHER"
  ]).nullable(),
  rawText: z.string(),  // všechno co Vision přečetl, pro debugging i fallback
  warnings: z.array(z.string()),  // např. "Image is rotated", "Low contrast"
  costUsd: z.number(),
});
```

**Vysoká úroveň logiky:**
1. Auth + role check
2. Validate request (Zod)
3. Rate limit check (PartsScanLog count za posledních 24 h)
4. Stáhnout image z Cloudinary (signed URL → fetch buffer)
5. Volat `lib/claude-vision.ts:scanLabel(imageBuffer, hint)`
6. Parse Claude JSON response → mapovat na response schema
7. Insert PartsScanLog record (success=true)
8. Return 200 + payload

**Error handling:**
- Anthropic API down/timeout → vrátit 503 + ulož log s success=false
- Confidence < 0,3 → success=true, ale UI zobrazí Tier 2 fallback
- Image > 10 MB → 400 (Cloudinary už limit má, ale defenzivně check)

### 5.2 `POST /api/parts/scan-part` — Tier 3 (Visual identification)

**Cesta:** `app/api/parts/scan-part/route.ts`

**Účel:** User vyfotil **celý díl** (ne štítek). Vision identifikuje typ dílu, kategorii, případně značku/model podle vizuálních znaků (logo, tvar).

**Auth + rate limit:** stejné jako 5.1.

**Request schema:**
```ts
const scanPartRequestSchema = z.object({
  imageUrl: z.string().url(),
  hint: z.string().max(200).optional(),
});
```

**Response schema:**
```ts
const scanPartResponseSchema = z.object({
  success: z.boolean(),
  confidence: z.number().min(0).max(1),
  category: z.enum([...]).nullable(),
  partName: z.string().nullable(),         // např. "Přední světlomet levý"
  brandGuess: z.string().nullable(),
  description: z.string(),                  // 2-3 věty popisu
  visualFeatures: z.array(z.string()),      // ["plastový", "černý", "halogen"]
  costUsd: z.number(),
});
```

**Logika:** stejná jako 5.1, ale jiný prompt — viz §8.

### 5.3 `POST /api/parts/describe-photo` — Tier 4 (Visual fallback)

**Cesta:** `app/api/parts/describe-photo/route.ts`

**Účel:** User vyfotil neznámý díl, který AI nepoznala, ale chce **alespoň pomocný popis** ("kovová ohnutá trubka, cca 30 cm, oxidovaná"), který si může editovat.

**Pozn.:** Toto je oddělený endpoint od `scan-part`, protože:
- Má jiný prompt (free-form description, ne kategorizace)
- Logicky to dává smysl i jako "pomocný" tool, ne jen tier fallback
- Lze ho v budoucnu reuse z `parts/new` wizardu jako "vygeneruj popis z fotky"

**Request schema:**
```ts
const describePhotoRequestSchema = z.object({
  imageUrl: z.string().url(),
  language: z.enum(["cs", "en"]).default("cs"),
});
```

**Response schema:**
```ts
const describePhotoResponseSchema = z.object({
  description: z.string(),  // Markdown text, ~50–150 slov
  costUsd: z.number(),
});
```

### 5.4 `GET /api/parts/[id]/label.pdf` — Tier 5 (PDF QR štítek)

**Cesta:** `app/api/parts/[id]/label.pdf/route.ts`

**Účel:** Vrátí PDF s QR kódem (slug + ID), nameem dílu, cenou a OEM číslem. User vytiskne na obyčejnou tiskárnu.

**Auth:** Resource-owner check (`part.supplierId === user.id || isAdmin`).

**Query params:**
```ts
const labelPdfQuerySchema = z.object({
  format: z.enum(["A4_8up", "A4_24up", "brother_62x29", "brother_29x90"]).default("A4_8up"),
  copies: z.coerce.number().int().min(1).max(50).default(1),
});
```

**Logika:**
1. Auth + ownership check
2. Načíst Part by id
3. Pokud `part.qrSlug` neexistuje → vygenerovat (`crypto.randomBytes(8).toString("hex")`) a uložit do DB
4. Vytvořit QR PNG/SVG z URL `https://carmakler.cz/parts/by-qr/{qrSlug}`
5. Renderovat PDF přes `lib/pdf-label.ts:renderLabelPdf({ part, qrDataUrl, format, copies })`
6. Stream response s `Content-Type: application/pdf` + `Content-Disposition: attachment; filename="part-{slug}.pdf"`

**Pozn.:** PDF se NEukládá do Cloudinary — generuje se on-demand. Brother QL printers (62×29 mm) jsou industry standard pro thermal labely, A4 8-up je pro běžné kanceláře.

### 5.5 `GET /api/parts/by-qr/[qrSlug]` — Tier 5 (Lookup)

**Cesta:** `app/api/parts/by-qr/[qrSlug]/route.ts`

**Účel:** User v PWA nascanuje vlastní QR štítek → endpoint vyhledá Part by qrSlug a vrátí ID.

**Auth:** Public (na čtení) — interní QR neobsahuje senzitivní data.

**Response:**
```ts
{ partId: string, slug: string, name: string, status: string }
```

**Frontend handling:** Klient po fetchi vykoná `router.push("/parts/{partId}")` (eshop detail) nebo `/parts/my/{partId}` (vrakoviště-side, pokud je owner).

**Alternativní design:** Nemít API, ale **server-side rewrite** v middleware: `/parts/by-qr/{qrSlug}` → `/parts/{slug}`. Plus: jeden méně API call. Mínus: middleware už je dost komplikovaný (subdoménová logika), přidávat tam DB lookup je risk. **Doporučuju API endpoint, ne middleware rewrite.**

### 5.6 `POST /api/parts/scan-stats` — volitelný (admin/dashboard)

**Cesta:** `app/api/parts/scan-stats/route.ts` (ADMIN/BACKOFFICE only)

Vrací agregaci `PartsScanLog` — kolik scanů/den, kolik cost/měsíc, top users. **Out of scope MVP, ale endpoint vyhradit URL pro budoucí dashboard.**

---

## 6. lib/ utility soubory

### 6.1 `lib/claude-vision.ts` — wrapper okolo Anthropic SDK

**Cesta:** `lib/claude-vision.ts`

**Veřejné API:**
```ts
export async function scanLabel(image: Buffer, hint?: string): Promise<ScanLabelResult>
export async function scanPart(image: Buffer, hint?: string): Promise<ScanPartResult>
export async function describePhoto(image: Buffer, language: "cs" | "en"): Promise<{ description: string; costUsd: number }>
```

**Vnitřní logika:**
- Singleton `Anthropic` client (env `ANTHROPIC_API_KEY`)
- Konstanta `MODEL = "claude-sonnet-4-6-20250514"` (stejný model jako existující assistant routes)
- Helper `imageToBase64(buffer): { data: string; mediaType: string }`
- Helper `parseJsonStrict(text): unknown` — extrahuje JSON z markdown code-blocks pokud Claude vrátí ` ```json {...} ``` `
- Helper `calculateCost(usage): number` — spočítá USD podle Anthropic billing modelu (input + output tokens × cena)
- Strukturovaný prompt v EN (per CLAUDE.md global rules: "Web searches v EN, Reasoning v EN, lepší kvalita")
- JSON schema response (Anthropic doporučuje "Respond with JSON only, no prose" + příklad)

**Error handling:**
- `AnthropicError` → propagate
- JSON parse error → log + throw `ScanParseError` (klient ukáže "Zkusit znovu" tlačítko)
- Empty response → throw `ScanEmptyError`

### 6.2 `lib/pdf-label.ts` — PDF QR štítek generátor

**Cesta:** `lib/pdf-label.ts`

**Veřejné API:**
```ts
export async function renderLabelPdf(input: {
  part: { id: string; name: string; price: number; oemNumber?: string | null; qrSlug: string };
  format: "A4_8up" | "A4_24up" | "brother_62x29" | "brother_29x90";
  copies: number;
}): Promise<Buffer>
```

**Vnitřní implementace:**
- Použít `jspdf` + `qrcode` npm packages (oba už máme)
- `QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 1 })` → base64 PNG
- `jsPDF` instance s `unit: "mm"`, `format` podle parametru
- Layout per format:
  - **A4_8up:** 2 sloupce × 4 řádky štítků 99×67 mm (Avery L7165 standard)
  - **A4_24up:** 3 × 8 štítků 70×35 mm (Avery L7159)
  - **brother_62x29:** jediný štítek 62×29 mm (continuous label)
  - **brother_29x90:** jediný štítek 29×90 mm (vertical)
- Každý štítek obsahuje:
  - QR vlevo (cca 25×25 mm)
  - Vpravo: name (max 30 znaků, truncate), cena formátovaná `1 234 Kč`, OEM number (pokud existuje), drobné Carmakler logo (text "carmakler.cz" 6pt)
- Vrátit `pdf.output("arraybuffer")` jako Buffer

**Pozor:** `jspdf` v Node prostředí (server-side route) potřebuje `import jsPDF from "jspdf"` (default export). Test, že buildí v Next.js 15 server runtime — `jspdf` je čistý JS, mělo by to fungovat.

### 6.3 `lib/parts/scan-queue.ts` — IndexedDB offline queue

**Cesta:** `lib/parts/scan-queue.ts`

**Účel:** Když vrakoviště pracuje offline, foto se zařadí do IndexedDB queue. Po online se pošle.

**Veřejné API:**
```ts
export type QueuedScan = {
  id: string;          // uuid client-side
  type: "SCAN_LABEL" | "SCAN_PART" | "DESCRIBE";
  imageBlob: Blob;
  hint?: string;
  createdAt: number;
  status: "pending" | "uploading" | "done" | "failed";
  result?: unknown;
  error?: string;
};

export async function enqueueScan(scan: Omit<QueuedScan, "id" | "createdAt" | "status">): Promise<string>
export async function listScans(): Promise<QueuedScan[]>
export async function processQueue(): Promise<void>  // volá se po online event
export async function clearScan(id: string): Promise<void>
```

**Implementace:**
- Použít `idb` (už máme) — open `carmakler-scans` DB, store `scans` s key `id`
- `processQueue()` čte všechny `pending`, postupně upload na `/api/upload` → `/api/parts/scan-*` → uloží result do queue → notify UI
- Background sync registrace v service workeru (`navigator.serviceWorker.ready.sync.register("part-scans")`) — Serwist umí
- Event listener v `OnlineStatusProvider` → on `online` event volá `processQueue()`

**Pozn.:** Background Sync API je dostupné na Chromu/Edge, ne na Safari/Firefox v plném rozsahu. Fallback: standardní `online` event listener funguje všude.

### 6.4 `lib/parts/scan-methods.ts` — konstanty

**Cesta:** `lib/parts/scan-methods.ts`

```ts
export const SCAN_METHODS = {
  STICKER_OCR: "STICKER_OCR",
  BARCODE: "BARCODE",
  METAL_OCR: "METAL_OCR",
  VISUAL_AI: "VISUAL_AI",
  MANUAL: "MANUAL",
} as const;

export type ScanMethod = (typeof SCAN_METHODS)[keyof typeof SCAN_METHODS];

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,    // → green badge, auto-fill all
  MEDIUM: 0.6,  // → yellow badge, auto-fill but encourage review
  LOW: 0.0,     // → red badge, fall back to Tier 2
} as const;

export const RATE_LIMITS = {
  SCANS_PER_DAY_PER_USER: 100,
  COST_LIMIT_USD_PER_DAY_PER_USER: 1.0,  // $1/den = ~200 scanů
} as const;
```

### 6.5 `lib/parts/image-preprocess.ts` — client-side compression (NOVÉ v v2)

**Cesta:** `lib/parts/image-preprocess.ts`

**Účel:** Mobilní fotky z fotoaparátu mají typicky 4–8 MB JPEG při 4032×3024 px. To je zbytečné pro Claude Vision (input tokens) i pro Cloudinary (bandwidth). Klient před uploadem zmenší foto na ~300–500 KB při 1920×1920 max — bez ztráty čitelnosti štítků.

> **Změna v v2:** Původní plán doporučoval **DIY canvas resize** (~30 řádků). Po team-lead review (#76v2) přecházíme na npm lib **`browser-image-compression`** — production-tested, handluje EXIF rotation automaticky, Web Worker support (ne-blocking UI), iOS Safari kompatibilní. Lib je ~10 KB gzipped, cena za robustnost je akceptovatelná.

**Veřejné API:**
```ts
import imageCompression from "browser-image-compression";

export type CompressedImage = {
  blob: Blob;
  width: number;
  height: number;
  sizeKb: number;
  originalSizeKb: number;
};

export async function preprocessImage(file: File): Promise<CompressedImage> {
  const originalSizeKb = Math.round(file.size / 1024);

  // KROK 1 — dimensions FIRST (důležitější než quality pro Vision OCR)
  // Vrakoviště fotí štítky → max 1920px stačí pro čitelný text
  // Cíl: max 1920 dimensions, pak až quality
  const options = {
    maxSizeMB: 0.5,             // ~500 KB strop
    maxWidthOrHeight: 1920,     // dimensions FIRST (per #77 research)
    useWebWorker: true,         // ne-blocking UI
    fileType: "image/jpeg" as const,
    initialQuality: 0.85,       // quality DRUHÉ
  };

  const compressedFile = await imageCompression(file, options);

  // Get dimensions for downstream Vision warnings
  const dims = await getImageDimensions(compressedFile);

  return {
    blob: compressedFile,
    width: dims.width,
    height: dims.height,
    sizeKb: Math.round(compressedFile.size / 1024),
    originalSizeKb,
  };
}

async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
}
```

**Použití v `ScanCameraCapture.tsx`:**
```ts
const handleFileSelect = async (file: File) => {
  setProcessing(true);
  try {
    const { blob, sizeKb, originalSizeKb } = await preprocessImage(file);
    console.log(`Compressed: ${originalSizeKb} KB → ${sizeKb} KB`);
    // Upload compressed blob to /api/upload
    const formData = new FormData();
    formData.append("file", blob, "scan.jpg");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    // ...
  } finally {
    setProcessing(false);
  }
};
```

**EXIF rotation:** `browser-image-compression` automaticky čte EXIF Orientation a aplikuje rotaci na výstupní canvas. Nedíky tomu **NEPOTŘEBUJEME** přidávat samostatnou `exifr` lib (kontrast s původním plánem v §11.1 row #8 a §11.9). 

**Důvod priority dimensions PŘED quality:** Per #77 research insight: "Dimensions reduction is 5-10× more impactful for size than quality reduction. 1920×1920 @ q=85 is visually indistinguishable from 4032×3024 @ q=85 for OCR purposes, but 4× smaller file." → Cíl je 1920px maximum dimension, pak upravit quality.

**Acceptance:**
- 4 MB iPhone foto → < 500 KB output (8× compression)
- Štítek čitelný na 1920px (test: scan 100×60mm Bosch label v Sprintu B)
- iOS Safari kompatibilní (browser-image-compression má v 2.x library iOS support)
- Web Worker = UI nezamrzne při kompresi 8 MB foto

---

### 6.6 `lib/parts/voice-input.ts` — Whisper API + Web Speech fallback (NOVÉ v v2)

> **Změna v v2:** Původní plán vyloučil voice input v §20 (Out of scope: "Voice input pro doplnění popisu — MVP text only"). Team-lead po review s uživatelem **OVERRIDE**: voice input ZŮSTÁVÁ v MVP. Důvod: vrakoviště pracuje s rukama plnýma oleje → text input na telefonu je friction → diktování popisu dílu je výrazně rychlejší. Uživatelská citace: *"oni to budou asi delat v kanceláři takze to vioce je dobry podle me"*.

**Cesta:** `lib/parts/voice-input.ts`

**Strategie 2-tier:**
1. **Tier A — OpenAI Whisper API (server-side)** — primární. Funguje na **všech** prohlížečích včetně iOS Safari. Kvalita je nejvyšší (multilingual včetně češtiny). Cena: $0,006/minutu (cca $0,001 per typický 10-sekundový popis dílu).
2. **Tier B — Web Speech API (browser-side)** — fallback **jen pro Chrome desktop/Android**. Zdarma, real-time, ale **nefunguje na iOS Safari** (Apple to záměrně neimplementuje). Dáme ho jen jako "rychlá alternativa" pokud Whisper API fail/cost limit.

**Veřejné API:**
```ts
export type VoiceInputResult = {
  text: string;
  language: string;        // "cs" detected
  durationSec: number;
  costUsd: number;         // 0 pro Web Speech, ~$0.001 pro Whisper
  source: "whisper" | "web-speech";
};

export type VoiceCapability = {
  whisperAvailable: boolean;   // vždy true (server-side)
  webSpeechAvailable: boolean; // detekce browseru
};

export function detectVoiceCapability(): VoiceCapability {
  const webSpeech = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  return { whisperAvailable: true, webSpeechAvailable: webSpeech };
}

// Web Speech API — browser-side (Chrome only)
export async function transcribeWebSpeech(opts: {
  onPartial?: (text: string) => void;
  language?: string;
}): Promise<VoiceInputResult> {
  // ... uses webkitSpeechRecognition, returns final transcript
}

// Whisper API — server-side via /api/parts/transcribe
export async function transcribeWhisper(audioBlob: Blob): Promise<VoiceInputResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "voice.webm");
  const res = await fetch("/api/parts/transcribe", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Whisper API failed");
  return await res.json();
}
```

**Server-side endpoint `/api/parts/transcribe` (přidat do §5):**
- POST multipart `audio: Blob`
- Auth + role check (PARTS_SUPPLIER+)
- Rate limit 50 transcribes/den/user (~$0,30/den max)
- Forward audio to OpenAI Whisper API (`whisper-1` model, language="cs")
- Log do `PartsScanLog` (scanMethod="VOICE_TRANSCRIBE", costUsd)
- Return `{ text, language, durationSec, costUsd }`

**npm dependency:**
```bash
npm i openai  # OpenAI SDK pro Whisper API
```
Velikost: ~50 KB. Pokud team-lead nechce další SDK, lze volat raw fetch na `https://api.openai.com/v1/audio/transcriptions` (multipart, ~30 LOC).

**ENV:**
- `OPENAI_API_KEY` (Whisper) — nový env var, přidat do `.env.example`

**UI komponent (přidat do §7):** `components/pwa-parts/parts/VoiceDescriptionInput.tsx` (~120 LOC):
- Textarea + tlačítko 🎤 "Diktovat popis"
- Tap → start recording (MediaRecorder API), max 60s
- Visual: red pulsing dot + počítadlo "0:15 / 1:00"
- Tap znovu → stop → upload to `/api/parts/transcribe`
- Detekce: pokud `webSpeechAvailable === true` → použít Web Speech (real-time, zdarma) 
- Pokud iOS / no Web Speech → MediaRecorder + Whisper fallback
- Po transcribe: textarea preplní transcript, user může editovat

**Použití:**
- Sekundární — formuláře jsou primární input
- Voice je **enhancement**, ne replacement
- Pole, kde má smysl: `description` (volný text 50–200 znaků)
- NE vhodné pro: numerické pole, OEM kód (Whisper má problémy s alfanumerickými kódy)

**Náklady (přidat do §13):**
- 50 vrakovišť × 100 dílů/měsíc × 50 % použije voice × 10s průměr = 4 167 minut/měsíc voice
- Pokud 100% Whisper: 4167 × $0,006 = **$25/měsíc** (negligible)
- Pokud 50/50 split (Web Speech free + Whisper): **$12/měsíc**
- Total Claude Vision + Whisper v early stage: **$75–150/měsíc** (per team-lead update)

**Acceptance:**
- iPhone Safari uživatel může diktovat 30s popis → Whisper transcript v textarea
- Chrome Android uživatel získá real-time transcript přes Web Speech (zdarma)
- Recording timer + visual feedback (pulsing red dot)
- Whisper API timeout (10s) → user-friendly error: "Diktování se nepodařilo, zkuste znovu nebo napište ručně"

---

## 7. Frontend — PWA komponenty

### 7.1 `app/(pwa-parts)/parts/scan/page.tsx` — entrypoint

**Cesta:** `app/(pwa-parts)/parts/scan/page.tsx` (Client Component)

**Účel:** Hlavní stránka scanneru. Drží state machine pro 5 tierů, řídí flow.

**State:**
```ts
type ScanFlowState =
  | { phase: "tier-pick" }
  | { phase: "capture", tier: 1 | 2 | 3 | 4 }
  | { phase: "uploading", tier: number }
  | { phase: "scanning", tier: number, imageUrl: string }
  | { phase: "result", tier: number, scanData: ScanResult }
  | { phase: "manual-fallback", tier: 2, imageUrl: string }
  | { phase: "wizard-handoff", details: PartDetails, photos: string[] }
```

**Render:** Switch-case pro každou phase → odpovídající child component.

**Flow handlers:** každý tier handler je async funkce, která:
1. Upload foto na Cloudinary (`/api/upload?preset=parts`)
2. Pošle scan request na příslušný `/api/parts/scan-*` endpoint
3. Pokud confidence < threshold → shift do tier-fallback phase
4. Pokud success → shift do "result" phase s předvyplněným formulářem

**Po confirm:** `router.push("/parts/new?prefill=" + base64(JSON.stringify({ details, photos, scanMethod, scanConfidence })))` → existující 3-step wizard převezme s pre-filled state.

### 7.2 `components/pwa-parts/parts/ScanCameraCapture.tsx`

**Účel:** Camera capture s preview. Buď používá nativní `<input type="file" capture="environment">` (pattern z existujícího `PhotoStep.tsx`) nebo `getUserMedia` + `<canvas>` snapshot pro lepší UX.

**STD doporučení:** Začít s `<input capture="environment">` (jednodušší, funguje všude, žádné MediaStream permissions). Pokud potřebujeme live preview pro Tier 1.5 (barcode), použít `getUserMedia` jen tam.

**Props:**
```ts
type Props = {
  onCapture: (file: File) => void;
  onCancel: () => void;
  hint?: string;  // např. "Vyfotografujte štítek dílu"
};
```

**UX:**
- Velký full-screen preview area
- Na vrchu hint text ("Vyfotografujte štítek dílu")
- Spodek: button "Otevřít foťák" (input) + "Zrušit"
- Po výběru souboru: `onCapture(file)` callback
- Pokud `getUserMedia` mode: live preview + capture button (kruhový white)

### 7.3 `components/pwa-parts/parts/TierSelector.tsx`

**Účel:** Initial picker — user vybere "co má".

**Props:**
```ts
type Props = {
  onSelect: (tier: 1 | 2 | 3 | 4) => void;
};
```

**UX:** 4 velké tlačítka na výšku obrazovky:
1. **"Mám čitelný štítek"** (Tier 1) — ikona štítek, doporučená cesta
2. **"Mám barcode/QR"** (Tier 1.5) — ikona barcode, instant scan
3. **"Vyfotografuji celý díl"** (Tier 3) — ikona díl, AI rozpozná
4. **"Zadám ručně"** (Tier 4) — ikona klávesnice, fallback

Každé tlačítko = card s ikonou + nadpis + 1 řádek popisu + chevron.

### 7.4 `components/pwa-parts/parts/ScanResult.tsx`

**Účel:** Preview obrazovka po AI scan. Ukazuje co bylo extrahováno, user potvrzuje/upravuje.

**Props:**
```ts
type Props = {
  imageUrl: string;
  scanData: {
    method: ScanMethod;
    confidence: number;
    extractedFields: {
      name?: string;
      oemNumber?: string;
      manufacturer?: string;
      category?: string;
      description?: string;
    };
    warnings?: string[];
  };
  onConfirm: (editedFields) => void;
  onRetry: () => void;
  onManualFallback: () => void;
};
```

**UX:**
- Top: foto preview (čtverec, contain)
- Pod fotkou: ConfidenceIndicator (zelená/žlutá/červená bar)
- Form fields, každý s ikonou ✨ (AI extracted) — user může editovat
- Warnings (collapsible): "AI nemohla přečíst manufacturer — zkontrolujte"
- Bottom: 2 buttons:
  - Primary: "Pokračovat (předvyplněno)"
  - Secondary: "Nehraje to — zadat ručně"
- Tertiary: "Zkusit znovu" (re-scan stejnou fotku, někdy retry změní výsledek)

### 7.5 `components/pwa-parts/parts/BarcodeScanner.tsx`

**Účel:** Live barcode scan přes ZXing-JS browser camera.

**Props:**
```ts
type Props = {
  onDetect: (barcode: string, format: string) => void;
  onCancel: () => void;
};
```

**Implementace:**
- `import { BrowserMultiFormatReader } from "@zxing/browser"`
- `useEffect` mount: instantiate reader, request camera, attach to `<video>` ref
- `reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => { if (result) onDetect(result.getText(), result.getBarcodeFormat()) })`
- Cleanup: `reader.reset()` v useEffect cleanup
- UX: full-screen video preview s scanning rámečkem (CSS animace)
- Fallback button "Nemůžu nascanovat — vyfotografovat místo toho" → přechod na Tier 1 (Claude Vision OCR)

**Pozor na permissions:** Camera API vyžaduje HTTPS a uživatelské povolení. Pokud user permission odmítne → ukázat instrukce.

### 7.6 `components/pwa-parts/parts/ConfidenceIndicator.tsx`

**Účel:** Vizuální indikator confidence (0–1) jako horizontální bar + label.

**Props:**
```ts
type Props = {
  confidence: number;  // 0..1
  label?: string;
};
```

**UX:**
- Bar: 100% width, height 6px, rounded
- Color:
  - ≥ 0.8 → green-500
  - ≥ 0.6 → yellow-500
  - < 0.6 → red-500
- Pod barem: label "AI si je jistá" / "AI nejistá — zkontrolujte" / "AI selhala"
- Animace přechodu (Framer Motion `layout` + `animate`)

### 7.7 `components/pwa-parts/parts/QrLabelDownloadButton.tsx`

**Účel:** Po uložení Part — tlačítko pro stažení PDF s QR štítkem. Ukáže se v `parts/my/[id]` detailu.

**Props:**
```ts
type Props = {
  partId: string;
  defaultFormat?: "A4_8up" | "brother_62x29";
};
```

**UX:**
- Button "Vytisknout štítek" → otevře dropdown s formátem (A4 8 ks, A4 24 ks, Brother 62×29, Brother 29×90)
- Klik na format → fetch `/api/parts/[id]/label.pdf?format=...&copies=1` → trigger download
- Alternativně: malý dialog s preview počet kopií + "Stáhnout PDF"

### 7.8 Integrace s existujícím `parts/new/page.tsx`

**Změny v `app/(pwa-parts)/parts/new/page.tsx`:**

1. Číst `searchParams.prefill` (base64-encoded JSON) v `useSearchParams()` hooku
2. Pokud prefill existuje → parsnout, předvyplnit `photos`, `details` state
3. Skoknout přímo na step 2 (Details), když má photos pre-filled
4. Přidat malý badge "Předvyplněno z AI scan" na vrchu stránky (s confidence indicator + "edit", "remove" buttons)

**Změna v `parts/page.tsx` nebo dashboard:** přidat CTA na `/parts/scan` jako primární metodu přidání (vedle "Přidat ručně" → `/parts/new`).

**Změna v `parts/my/[id]/page.tsx`** (pokud existuje, jinak vytvořit): přidat `<QrLabelDownloadButton partId={part.id} />` do detailu.

---

## 8. Claude Vision prompty

**Pravidlo:** Všechny prompty v EN per CLAUDE.md global rules ("AI modely mají 15-20% lepší výkon v EN"). Output JSON, parse server-side, mapovat na české labely v UI.

### 8.1 Tier 1 — `scanLabel()` prompt

**System prompt:**
```
You are a specialized OCR system for automotive parts identification. You analyze photos of stickers, labels, and tags found on used auto parts in a salvage yard context.

Your task:
1. Read all visible text on the label/sticker in the image
2. Extract the OEM part number (manufacturer's primary identifier)
3. Identify the manufacturer (Bosch, Continental, Denso, Hella, Valeo, etc.)
4. Guess the part type and category from the text
5. Estimate your confidence (0.0 to 1.0)

Output ONLY a single JSON object, no prose, no markdown code blocks. Schema:

{
  "confidence": number 0-1,
  "oemNumber": string or null,
  "manufacturer": string or null,
  "partTypeGuess": string or null,
  "categoryGuess": "ENGINE" | "TRANSMISSION" | "BRAKES" | "SUSPENSION" | "BODY" | "ELECTRICAL" | "INTERIOR" | "WHEELS" | "EXHAUST" | "COOLING" | "FUEL" | "OTHER" | null,
  "rawText": string (all readable text),
  "warnings": array of strings (e.g. "Image is rotated", "Low contrast", "Partial label visible")
}

Notes:
- Bosch part numbers are typically 10 digits starting with 04 (original), 09 (remanufactured), or F0 (common rail)
- If you see only barcode/QR with no readable number, set oemNumber to null and confidence to ~0.4
- If the entire label is unreadable, return confidence 0.0 and rawText as empty string
- categoryGuess must match exactly one of the enum values, or be null
```

**User prompt:** image attachment + optional hint:
```
Please analyze this label.{hint ? ` Hint from user: ${hint}` : ""}
```

### 8.2 Tier 3 — `scanPart()` prompt

**System prompt:**
```
You are a specialized visual identification system for used automotive parts. You analyze photos of WHOLE PARTS (not labels) to identify what they are.

Your task:
1. Identify what type of part this is (based on shape, size, materials, mounting points)
2. Categorize into one of the standard categories
3. Suggest a Czech part name (friendly, e.g. "Přední světlomet levý" not "left front headlight")
4. Identify visual features (material, color, brand markings if visible)
5. Generate a 2-3 sentence description in Czech that a salvage yard worker could use

Output ONLY a single JSON object, no prose, no markdown code blocks. Schema:

{
  "confidence": number 0-1,
  "category": "ENGINE" | "TRANSMISSION" | "BRAKES" | "SUSPENSION" | "BODY" | "ELECTRICAL" | "INTERIOR" | "WHEELS" | "EXHAUST" | "COOLING" | "FUEL" | "OTHER" | null,
  "partName": string in Czech or null,
  "brandGuess": string or null,
  "description": string in Czech (2-3 sentences),
  "visualFeatures": array of strings in Czech
}

Notes:
- If you cannot identify the part with reasonable confidence (>0.3), return confidence 0.2 and category null
- partName should be specific where possible (e.g. "Přední světlomet levý" not just "Světlomet")
- visualFeatures should be useful for buyers (color, material, condition indicators)
```

### 8.3 Tier 4 — `describePhoto()` prompt

**System prompt:**
```
You are a helpful assistant that describes photos of automotive parts in plain Czech (or English).

Your task: Generate a 50-150 word description of what you see in the image. Focus on:
- Physical attributes (shape, size, color, material)
- Condition indicators (rust, scratches, wear)
- Any visible text, logos, or markings
- What it might be (only if reasonably confident)

Write in Czech (or English if requested). Plain text, no markdown, no JSON. The description will be shown to a salvage yard worker who will use it as a starting point for their listing.

Be honest about uncertainty: "vypadá to jako…" (looks like…) is fine, "definitivně je to…" (definitely is…) is not.
```

**User prompt:**
```
Please describe this part in {language === "cs" ? "Czech" : "English"}.
```

---

## 9. API kontrakty (souhrn)

| Endpoint | Method | Auth | Request body | Response |
|----------|--------|------|--------------|----------|
| `/api/parts/scan-label` | POST | session + role | `{ imageUrl, hint? }` | scanLabelResponseSchema |
| `/api/parts/scan-part` | POST | session + role | `{ imageUrl, hint? }` | scanPartResponseSchema |
| `/api/parts/describe-photo` | POST | session + role | `{ imageUrl, language? }` | `{ description, costUsd }` |
| `/api/parts/[id]/label.pdf` | GET | owner | query: `format`, `copies` | `application/pdf` stream |
| `/api/parts/by-qr/[qrSlug]` | GET | public | (qrSlug v URL) | `{ partId, slug, name, status }` |

Všechny endpointy:
- Validate Zod request schema, return 400 on parse failure
- Return 401 pokud nepřihlášen
- Return 403 pokud nemá role / není owner
- Return 429 pokud rate limit překročen
- Return 500 + log při unexpected error
- CORS: same-origin only (default Next.js chování)

---

## 10. PWA flow obrazovky (8 screens)

### Screen 1 — Tier picker
- TopBar "Přidat díl" + back button
- 4 velké cards (TierSelector)
- Subtle text dolů: "Po uložení vygenerujeme QR pro tisk štítku"

### Screen 2A — Camera capture (Tier 1/3/4)
- Full-screen `<input>`-based capture (přesměruje na native camera UI)
- Po vyfocení → návrat s File objektem
- Loading spinner "Nahrávám fotku…" během uploadu na Cloudinary

### Screen 2B — Live barcode scanner (Tier 1.5)
- Full-screen video preview (`<video>` element)
- Scanning rámeček (CSS animovaný)
- Helper text "Namiřte na barcode/QR"
- Bottom: "Nemůžu nascanovat" (přechod na Tier 1)
- Bottom: "Zrušit"

### Screen 3 — Scanning ("AI pracuje")
- Loading screen s gradient + spinner
- Text: "Načítáme štítek…" / "Hledáme díl…" (per tier)
- Animated dots (Framer Motion)
- Cca 2–4 sekundy

### Screen 4 — ScanResult (high confidence)
- Top: foto thumbnail
- ConfidenceIndicator green
- Form (read-only inputs s edit ikonkou):
  - ✨ Název (suggested)
  - ✨ Kategorie (suggested)
  - ✨ OEM číslo
  - ✨ Výrobce
- Botom: primary button "Pokračovat → cena"
- Tertiary button: "Zkusit znovu"

### Screen 5 — ScanResult (low confidence) → Tier 2 fallback
- Stejný layout jako Screen 4, ale:
- ConfidenceIndicator red/yellow
- Warning banner: "AI nemohla přečíst všechno — zkontrolujte"
- Form fields editable, předvyplněné jen tam, kde je confidence > 0
- Helper text: "Pokud je to špatně, můžete to opravit nebo zkusit znovu"

### Screen 6 — Wizard handoff (DetailsStep + PricingStep)
- Existující 3-step wizard, ale step 1 (PhotoStep) je už hotový
- Top of step 2: small badge "✨ Předvyplněno z AI scan (confidence 87%)" + "x" button (clear pre-fill)
- User potvrdí/upraví details + vyplní price
- Publish button → POST `/api/parts`

### Screen 7 — Success + QR download
- Po POST 201 → success screen
- Animace check-mark
- "Díl byl přidán do katalogu"
- Card: thumbnail + name + cena + status badge
- 2 buttons:
  - Primary: "Vytisknout QR štítek" → `<QrLabelDownloadButton />`
  - Secondary: "Přidat další díl" → reset → Screen 1
- Tertiary: "Přejít na seznam dílů"

### Screen 8 — Inventory mode (po sken QR později)
- User v PWA opět otevře `/parts/scan` → Tier 1.5 → naskenuje **vlastní QR**
- ZXing detekuje QR → URL `https://carmakler.cz/parts/by-qr/{qrSlug}`
- Frontend rozpozná own-domain URL → fetch `/api/parts/by-qr/{qrSlug}` → router push na `/parts/my/{partId}` (ne na nový scan flow)
- User vidí detail → může editovat cenu, stav, stock

---

## 11. UX pro laiky (MUST HAVE)

> **Constraint:** Vrakoviště NEJSOU tech-savvy. Cílovka jsou starší chlapi v montérkách, telefony si pamatují tlačítkové. Tato sekce je **závazný akceptační rámec** — pokud výsledná implementace nevede ke scénářům A a B níže, je to rework.

### 11.1 15 pravidel UX (závazná, must-have)

| # | Pravidlo | Implementační dopad |
|---|----------|---------------------|
| 1 | **Velká tlačítka** — min **56px** výška (NE 44px Apple HIG default — vrakoviště pracuje ve špinavém prostředí, prst na rukavici, na slunci, 55+ věk). Touch target 56×56 minimum, primary CTA 64px. | `<Button size="xxl">` nebo `min-h-[56px]` na všech CTA. Primary publish CTA `min-h-[64px]`. Nový variant `xxl` pokud `Button` nemá. **Background:** #77 research insight #2 — touch targets jsou primární accessibility blocker pro 55+ uživatele. |
| 2 | **Jasné CZ texty bez tech žargonu** — vždy uživatelsky zaměřené | Viz §11.2 — překlady tech errorů. NEVER show raw API errors. |
| 3 | **Ikony + texty** — každé tlačítko má ikonu (kameru, štítek, ručně), ne jen text | `TierSelector.tsx` = ikony + label + popis. SVG ikony z Heroicons. |
| 4 | **JIT hints místo wizard tour** — wizardy mají 60-80% drop-off rate (#77 research insight #5). Místo full-screen tour: kontextové bublinky, které se objeví **pouze tam, kde uživatel zaváhá** (>3s nečinnost) | Nový `JustInTimeHint.tsx` komponent + `useIdleHint` hook. Watch interval 3s, pokud user nečinný v formulářovém poli → fade-in tooltip s tipem. NE wizard tour celého flow. **Stará verze** ScanOnboarding 4-krokového tutoriálu je **OUT** — místo toho welcome screen s 1 větou ("Vyfoťte štítek, my ho přečteme") + auto-start camera. |
| 5 | **Tooltips/help texty** u každého pole — "co sem napsat" + příklad | `<HelpHint>` komponent (info ikona + tap → popover). U formulářových polí v `parts/new`. Příklady: "Kód dílu: např. 0124515091 (najdete na štítku Bosch/Hella)". |
| 6 | **Empty states s návodem** — vždy s CTA | Pro prázdný `/parts/scan/queue`, `/parts/my`. Pattern: ikona + nadpis "Zatím nic nepřidáno" + popis + tlačítko "Začít →". |
| 7 | **Vizuální guide pro fotku** — overlay rámeček "vyfoťte štítek sem" | `ScanCameraCapture.tsx` v "label" módu má SVG overlay (white dashed border 80% width × 40% height, centered) + label nahoře "Vyfoťte štítek dílu sem". |
| 8 | **Auto-detekce orientace** — pokud user fotí naležato, AI to zvládne (rotation in EXIF) | **v2:** Řešeno přes `browser-image-compression` v §6.5 — handluje EXIF Orientation automaticky během preprocess. Žádný samostatný `exifr` lib. Server-side Claude Vision EXIF rotation handluje sám, ale my máme jistotu protože už po §6.5 preprocess je foto canvas-rotated do správné orientace. |
| 9 | **Žádné technické chyby** — všechny errory přeložené do "lidštiny" | Centrální mapping `lib/parts/error-messages.ts`. Mapuje API status codes + error keys → CZ user-friendly text. Viz §11.2. |
| 10 | **Confirmation dialog jen u destruktivních akcí** — "Opravdu smazat?" ANO/NE | NE confirmation pro "Uložit", "Pokračovat". ANO confirmation pro "Smazat fotku", "Smazat scan z queue". Použít existing `<ConfirmDialog>` pattern (pokud existuje, jinak inline). |
| 11 | **Žádné nested menus** — flat navigation, max 1 level deep | `/parts/scan` je entry, child screens jsou jen `/parts/scan/queue` (volitelná). Žádné `/parts/scan/settings/advanced/...`. |
| 12 | **Offline indicator vždy viditelný** — ikonka WiFi v rohu | Reuse existing `OfflineBanner.tsx` (top-of-page sticky). Plus `<OfflineDot>` v TopBar PWA (zelená/červená tečka). |
| 13 | **Big "ULOŽIT" button na konci každého kroku** — žádné malé tlačítka v rohu | `<Button size="xxl" className="w-full">` pinned na bottom safe-area s `position: sticky`. Vždy primary brand color. |
| 14 | **Progress indicator** — "Krok X z Y" + vizuální bar | Reuse `AddPartWizard` progress bar (už existuje). Pro `/parts/scan` přidat `ScanProgress.tsx` — "Krok 1 z 4: Vyfoťte štítek". |
| 15 | **Žádný overlay/modal pro důležité akce** — pokud user zavře omylem, ztratí progress | Wizardy jsou full-page, NE modaly. Pokud user opustí page → state machine uloží draft do `sessionStorage` (pro recovery). Modaly jen pro confirmation dialogy a help tooltips. |

---

### 11.2 Mapping tech error → user-friendly CZ texty

Centralizovat v `lib/parts/error-messages.ts` a používat NA VŠECH errorových místech v scan flow + parts wizardu:

| Tech error / status | ❌ Tech text (NEUKAZOVAT) | ✅ User-friendly CZ text |
|---|---|---|
| `OCR_LOW_CONFIDENCE` | "Failed to extract OEM code: confidence 0.42 < threshold 0.7" | "Štítek se nepodařilo přečíst. Zkuste vyfotit znovu z větší blízkosti, nebo napište kód ručně." |
| `IMAGE_TOO_LARGE` (HTTP 413) | "Upload error: 413 Payload Too Large" | "Fotka je moc velká. Zkuste menší rozlišení nebo se přibližte." |
| `RATE_LIMIT_EXCEEDED` (HTTP 429) | "Rate limit exceeded: 100/100 daily quota" | "Dnes jste přidali už hodně dílů (100). Pokračujte zítra nebo nás kontaktujte." |
| `CAMERA_PERMISSION_DENIED` | "NotAllowedError: Permission denied" | "Telefon nedovolil zapnout kameru. V nastavení Chrome povolte přístup ke kameře pro tuto stránku." |
| `OFFLINE_QUEUE_FULL` | "IndexedDB quota exceeded" | "Máte už 20 fotek čekajících na odeslání. Připojte se k internetu, ať se mohou odeslat." |
| `VISION_API_TIMEOUT` | "Anthropic API timeout after 30s" | "AI nestihla odpovědět včas. Zkuste fotku pořídit znovu." |
| `INVALID_IMAGE_FORMAT` | "Unsupported MIME type: image/heic" | "Tento formát fotky není podporován. Použijte JPG nebo PNG." |
| `NETWORK_ERROR` (offline submit) | "fetch failed: NetworkError" | "Nemáte připojení k internetu. Fotku jsme uložili — odešleme ji jakmile budete online." |
| `DUPLICATE_PART` | "Unique constraint violation: oemNumber" | "Tento díl už máte v katalogu. Chcete přidat další kus?" → ANO/NE |
| `CONFIDENCE_OK_BUT_NO_CATEGORY` | "Category extraction null" | "Štítek jsme přečetli, ale nevíme jakou kategorii vybrat. Vyberte ji prosím ručně." |
| `PDF_GENERATION_FAILED` | "jspdf error: ENOENT font Outfit" | "Štítek se nepodařilo vytvořit. Zkuste to znovu, nebo nás kontaktujte." |

**Vzor použití v komponentě:**
```ts
// V ScanResult.tsx — pseudokód, NE k implementaci v plánu
import { translateError } from "@/lib/parts/error-messages";
const friendly = translateError(apiError); // → "Štítek se nepodařilo přečíst..."
setUserMessage(friendly);
```

---

### 11.3 ~~Onboarding 4-krokový tutorial~~ → DEPRECATED v2 — nahrazeno JIT hints (§11.11)

> **DEPRECATED v #76v2:** 4-krokový full-screen tutorial **NEDĚLAT**. #77 research insight #5 prokázal 60-80% drop-off rate u wizardových onboarding flowů. Místo toho **JustInTimeHint** pattern (§11.11.4) + welcome screen s 1 větou + auto-start camera.
>
> **Welcome screen (NÁHRADA):**
> - Po prvním otevření `/parts/scan`: 1 obrazovka, 1 věta ("Vyfoťte štítek dílu, my ho přečteme") + 1 velké tlačítko "📷 Začít" (`min-h-[64px]`)
> - Po tap → state machine ihned na camera capture (žádné další step screens)
> - Flag `scan-welcome-seen=true` v `localStorage`
> - "Skip" / "Přeskočit" link v rohu se NEPOUŽÍVÁ — celý screen je 1-tap
>
> **Komponent:** `ScanWelcomeScreen.tsx` (~30 LOC, NE swipeable carousel, NE Framer Motion AnimatePresence). Plnohodnotný onboarding probíhá kontextově za běhu pomocí JIT hints (§11.11.4).
>
> Důvod změny: #77 research, ověřeno na podobných B2B mobile apps (Wolt, Bolt). Hard delete starého `ScanOnboarding.tsx` plánu.

---

### 11.4 Vizuální guide pro fotku — `ScanCameraCapture` overlay

Když uživatel klikne "Vyfotit štítek" (Tier 1), `ScanCameraCapture.tsx` v módu `label`:
- Zapne nativní fotoaparát přes `<input type="file" accept="image/*" capture="environment">` (NE getUserMedia — spolehlivější na low-end androidech)
- **POZOR:** native camera má vlastní UI — overlay nemůžeme injectovat tam přímo. Místo toho:
  - **Pre-capture instruction screen** (full-screen) PŘED otevřením kamery: SVG schéma "umístěte štítek do rámečku" + tlačítko "Otevřít fotoaparát". Toto je naše overlay.
  - **Post-capture review screen**: po vyfocení ukázat thumbnail s SVG overlay rámečku a textem "Je štítek v rámečku? Pokud ne, zopakovat foto".

**Placeholder layouts:**
```
PRE-CAPTURE                          POST-CAPTURE
┌──────────────────────┐             ┌──────────────────────┐
│  Vyfoťte štítek      │             │  Je štítek čitelný?  │
│                      │             │                      │
│  ┌──────────────┐    │             │  ┌──────────────┐    │
│  │              │    │             │  │ [thumbnail]  │    │
│  │   ŠTÍTEK     │    │             │  │   s frame    │    │
│  │   SEM        │    │             │  │   overlay    │    │
│  │              │    │             │  │              │    │
│  └──────────────┘    │             │  └──────────────┘    │
│                      │             │                      │
│  💡 Tip: foťte zblíz-│             │  [📷 Znovu] [✓ OK]   │
│  ka, dobré osvětlení │             │                      │
│                      │             │                      │
│  [📷 OTEVŘÍT KAMERU] │             │                      │
└──────────────────────┘             └──────────────────────┘
```

---

### 11.5 Tooltips / HelpHint pattern

Komponent `<HelpHint text="..." />` (~30 řádků):
- Renderuje malou ⓘ ikonu (16×16) inline vedle labelu
- Tap → popover (Framer Motion fade-in) s textem + příkladem
- Auto-close na tap mimo
- Reuse v `parts/new` formuláři pro každé pole, kde uživatel může váhat

**Příklady použití:**
| Pole | HelpHint text |
|---|---|
| OEM kód | "Číslo na štítku, např. 0124515091. Bývá vytištěno tučně. Pokud nevíte, nechte prázdné." |
| Kategorie | "Vyberte typ dílu — např. Elektrika, Brzdy, Motor." |
| Stav (NEW/USED/DAMAGED) | "USED = použitý funkční. DAMAGED = poškozený, ale prodejný (např. praskla plastová záslepka)." |
| Cena | "Cena za 1 kus včetně DPH. Pokud více kusů, doplníte množství níže." |
| Kompatibilní značky | "Auta, na která díl pasuje. Pokud nevíte, zkuste hledat OEM kód na Googlu." |

---

### 11.6 Empty states

| Obrazovka | Empty state design |
|---|---|
| `/parts/scan/queue` (offline queue prázdná) | 🟢 Velká ikona "wifi-check" + "Vše synchronizováno" + "Žádné fotky nečekají na odeslání." + tlačítko "← Zpět ke skenování" |
| `/parts/my` (žádné díly) | 📦 Velká ikona prázdné krabice + "Zatím jste nepřidali žádný díl." + tlačítko "Začít fotkou →" → vede na `/parts/scan` |
| `parts/scan` po vyčištění failed scan | "Chybné foto smazáno." + tlačítko "Vyfotit znovu" |

---

### 11.7 Acceptance scénáře (závazné — implementace musí podporovat)

**Scénář A — Happy path Tier 1:**
> Pavel z vrakoviště Brno, 58 let, telefon Samsung A14. Otevře PWA, klikne "Přidat díl", kamera se zapne, vyfotí štítek z alternátoru, vidí "AI čte štítek..." (3s), pak vidí předvyplněnou formu "Bosch alternátor 14V 90A, kód 0124515091, kategorie Elektrika". Klepne "Uložit". Hotovo.

**Cesta klikání (max 4 kliknutí):**
1. Tap "Přidat díl" (TopBar nebo dashboard CTA) → `/parts/scan`
2. Tap "📷 Vyfotit štítek" (TierSelector default tier 1) → kamera
3. (mimo aplikaci: vyfotit + native confirm v kameře)
4. Tap "✓ Uložit" na ScanResult / parts/new pricing step

**Akceptační kritéria:**
- ≤ 4 kliknutí v happy path
- Žádný technický text na obrazovce
- Auto-fill viditelně označený "AI vyplnilo" badgem (zelený)
- Confidence indicator zobrazený (vysoké confidence = ✅ "Skvělá kvalita", střední = ⚠️ "Zkontrolujte prosím", nízké = ❌ fallback to Tier 2)

---

**Scénář B — Fallback Tier 3 (žádný štítek):**
> Pavel fotí starou polosvícenu reflektoru, štítek je odpadlý. AI nic nepřečte. UI nabídne "Zkusit znovu" / "Napsat kód ručně" / "Nevím, vyfotit celý díl". Pavel klikne "Vyfotit celý díl". AI rozpozná "reflektor přední, pravděpodobně Audi/VW skupina". Pavel doplní cenu, klikne "Uložit". Hotovo.

**Cesta klikání (max 6 kliknutí):**
1. Tap "Přidat díl" → `/parts/scan`
2. Tap "📷 Vyfotit štítek" (default Tier 1) → kamera
3. (mimo aplikaci: foto)
4. UI: low confidence → 3 možnosti → tap "📦 Vyfotit celý díl" (Tier 3)
5. (mimo aplikaci: foto celého dílu)
6. Tap "✓ Uložit" na ScanResult/wizard

**Akceptační kritéria:**
- ZERO technical jargon (žádné "OCR failed", "confidence 0.42", "ML inference error")
- Každý fallback krok má JASNÉ tlačítko s textem **akce** (NE "Try again" ale "📷 Zkusit znovu")
- 3 možnosti vždy zobrazené najednou (NE skryté za "more options")
- Stav fotky (Tier 1 attempt) se zachová (sessionStorage), uživatel se k němu může vrátit přes "← Zpět"

---

### 11.8 Reference best-in-class B2B mobile UX

Doporučené reference pro implementatora a designera (k inspiraci):
- **Wolt courier app** — best-in-class B2B mobile UX pro neexpertní uživatele (kuriéři). Velká tlačítka, jasná hierarchie, minimum textu, hodně ikon.
- **Glovo partner app** — onboarding flow pro restaurace, dobrý příklad krok-za-krokem tutoriálu.
- **Toyota Diagnostic Tool (techstream)** — utilitní UX pro mechaniky, ukázka jak prezentovat tech data laicky.
- **Bolt Driver app** — offline-first patterns, queue indikátory, friendly error states.

Před implementací doporučuji 30-min review těchto apps v emulátoru / browseru — je to **volný research**, ne hard requirement.

---

### 11.9 Dopad na ostatní sekce plánu

| Sekce | Dopad |
|---|---|
| §6 (lib/) | Přidat `lib/parts/error-messages.ts` (mapping) + opt. `exifr` import v `claude-vision.ts` |
| §7 (komponenty) | Přidat `ScanOnboarding.tsx` + `HelpHint.tsx` + `ScanProgress.tsx`. `ScanCameraCapture.tsx` rozšířit o pre/post-capture screens. `TierSelector.tsx` design overhaul (velké ikony + text). |
| §17 (npm deps) | Volitelně `exifr@7.x` (~10 KB) pro EXIF rotation. Bez tohoto Claude Vision auto-rotation funguje, ale post-capture review zobrazí neotočený thumb. |
| §18 (impl pořadí) | Sprint E (Polish) rozšířit o: onboarding, error messages, HelpHint, empty states. Sprint E je teď ~30 % větší. |
| §21 (velikost) | +2 nové komponenty + 1 lib + 1 dep + cca 200–300 LOC. Plán odhaduje teď **~1700–2300 LOC** místo 1500–2000. |

---

### 11.10 Co NEJDE měřit automatem (manuální QA)

UX kvalita musí být **manuálně otestována s laickou personou**. Doporučení:
- Najít 1–2 reálné vrakovišťní zaměstnance (nebo proxy: rodič/prarodič 55+) a nechat je projít scénář A i B bez jakékoliv asistence
- Sledovat: kde zaváhají, kde čtou nahlas, kde stisknou špatné tlačítko, jaké slovo nepochopí
- Cíl: 100 % completion bez asistence pro oba scénáře
- Tento test je součástí Sprint F (QA + ship) — viz §18

---

### 11.11 Sync state UI + Dark mode + JIT hints (NOVÉ v v2)

> Tato podsekce sjednocuje 3 nové UX prvky vyžadované team-leadem v rewrite #76v2:
> 1. **Dark mode jako default** (světlost vrakoviště, oslnění)
> 2. **Sync state UI** (Background Sync API je cross-browser nespolehlivý)
> 3. **JustInTimeHint pattern** (náhrada za onboarding wizard z §11.3)

#### 11.11.1 Dark mode jako DEFAULT (NE jen toggle)

**Kontext:** Vrakoviště pracuje venku → telefon na slunci → bílé pozadí oslňuje + spotřebovává 2× víc baterie na OLED. Vrakoviště pracuje v garáži → tmavé prostředí → bílé pozadí oslňuje. Žádný use case není pro `bg-white`.

**Implementace:**
- `app/(pwa-parts)/layout.tsx` → přidat `<html className="dark">` (force dark)
- Tailwind `darkMode: "class"` (už je v configu)
- VŠECHNY komponenty `pwa-parts/*` MUSÍ mít explicitní `dark:bg-zinc-900`, `dark:text-zinc-100`, `dark:border-zinc-700`
- Testovat na fyzickém telefonu na slunci (Pixel/Samsung mid-range)
- **NE** prefer-color-scheme media query — vrakoviště admin OS settings nezná
- **NE** toggle v PWA settings — zbytečná komplexita pro MVP, dark = forced
- Color scheme: `bg-zinc-900` (background), `bg-zinc-800` (cards), `text-zinc-100` (text), `text-orange-400` (primary CTA accent), `border-zinc-700` (dividers)
- Camera capture screen: `bg-black` (max kontrast s bílým štítkem)

**Acceptance:**
- Žádný `bg-white` v `(pwa-parts)/*` (lint rule grep)
- Camera viewfinder = pure black background
- Primary CTA `bg-orange-500 dark:bg-orange-600` (slightly darker for OLED)

---

#### 11.11.2 Sync state UI — Background Sync nespolehlivý

**Problém:** Background Sync API má **partial support** — Chrome ✅, Edge ✅, Safari ❌, Firefox ❌. Vrakoviště používající iPhone (~30 % CZ market share) nemá fungující background sync. Musíme to **viditelně řešit v UI**.

**Strategie:**
1. **Detect support** v `lib/parts/scan-queue.ts`:
   ```ts
   export function isBackgroundSyncSupported(): boolean {
     return "serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype;
   }
   ```
2. **Pokud podporováno:** registrujeme `sync.register("part-scans-queue")` po každém offline submitu (Chrome)
3. **Pokud NE podporováno (Safari/Firefox):** spustit polling fallback — `setInterval(checkOnline, 10s)`, při online → flush queue ručně
4. **Vždy:** UI musí ukazovat aktuální stav queue (NE skrýt before user)

**SyncStatusBadge komponent (`components/pwa-parts/SyncStatusBadge.tsx`):**

| Stav | Vizuál | Text | Akce |
|---|---|---|---|
| `synced` | 🟢 zelená tečka | "Vše uloženo" (mikro-text v rohu) | žádná |
| `pending_offline` | 🟡 žlutá tečka + počet | "3 fotky čekají — připojte se k internetu" | tap → `/parts/scan/queue` |
| `syncing` | 🔵 modrý spinner + počet | "Odesílám 2 z 5..." | žádná (user nemá co dělat) |
| `failed` | 🔴 červená tečka + počet | "2 fotky se nepodařilo odeslat" | tap → `/parts/scan/queue` (retry button) |

**Umístění:**
- Persistent v TopBar PWA (vždy viditelný badge vedle user avatar)
- Top of `/parts/scan` page (větší banner při `pending_offline` nebo `failed`)
- Po každém scan submit → toast "Uloženo lokálně, odešle se až bude internet" (pokud offline)

**Queue page (`/parts/scan/queue`) — required, NE optional:**
- Seznam pending scans (thumbnail + tier + relativní čas "před 5 min")
- Per-item: tlačítko "Odeslat teď" (manual retry), "Smazat"
- Bulk: "Odeslat všechny", "Smazat všechny"
- Auto-refresh každých 5s pokud existuje pending item
- Empty state per §11.6

**Acceptance:**
- iPhone Safari uživatel **vidí** že 3 fotky čekají + může tap → manual retry
- Nikdy ne situace "fotka zmizela do prázdna" (která se stala v současné PhotoStep implementaci — viz QA #64 BLOCKER #2)

---

#### 11.11.3 Sync state hooks + state management

**Nový hook `useSyncQueueState()`** (`hooks/useSyncQueueState.ts`):
```ts
type QueueState = "synced" | "pending_offline" | "syncing" | "failed";
interface QueueStatus {
  state: QueueState;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: number | null;
}

export function useSyncQueueState(): QueueStatus {
  // 1. Subscribe to IndexedDB changes (custom event "scan-queue-update")
  // 2. Subscribe to navigator.onLine changes
  // 3. Return derived state
}
```

**Trigger eventů:**
- `lib/parts/scan-queue.ts` po každém `enqueue()`/`dequeue()`/`fail()` → `window.dispatchEvent(new CustomEvent("scan-queue-update"))`
- `online` / `offline` events → re-derive state

**Acceptance:**
- Badge v TopBar updates **immediately** po každé akci (žádný hard refresh)
- State persists přes reload (z IndexedDB, ne in-memory)

---

#### 11.11.4 JustInTimeHint pattern (náhrada za onboarding tour)

**Princip:** Místo full-screen tutoriálu (60-80 % drop-off rate per #77 research) zobrazíme tipy **kontextově**, **jen tam kde uživatel váhá**.

**Detekce váhání:** Hook `useIdleHint(fieldRef, threshold=3000)`:
- Listener `focus` → start timer 3s
- Listener `input` / `change` / `blur` → reset timer
- Po 3s nečinnosti na focused poli → trigger hint
- Po hint shown 1× → flag `localStorage.setItem(\`jit-hint-shown-${fieldId}\`, "true")` → nikdy neshow stejný hint znovu

**Komponent `JustInTimeHint.tsx` (~50 LOC):**
- Floating tooltip (Framer Motion fade + slide) anchored na pole
- Obsahuje 1 větu + 1 příklad + tlačítko "Rozumím" (zavře) nebo "Více" (rozbalí HelpHint popover §11.5)
- Auto-close po 8s (pokud user nezareagoval)
- Žlutá orange-500 border + bg-zinc-800 (dark mode)

**Mapování polí → hints (`lib/parts/jit-hints.ts`):**
| Pole | Hint text | Příklad |
|---|---|---|
| OEM kód | "Najdete na štítku dílu, většinou tučně" | "0124515091 (Bosch alternátor)" |
| Cena | "Zadejte celkovou cenu za 1 kus" | "1500 Kč" |
| Stav (NEW/USED/DAMAGED) | "USED = funkční, DAMAGED = poškozený ale prodejný" | — |
| Kompatibilní značky | "Auta, kde díl pasuje. Můžete víc značek najednou" | "Škoda, VW, Audi" |
| Foto štítku | "Foťte zblízka, štítek vyplní celý rámeček" | — |

**Acceptance:**
- Hint se zobrazí **maximálně 1×** per pole per uživatel (nikdy spam)
- User může každý hint zavřít bez rušivého overlay
- NEBLOKUJE input — uživatel může stále psát, hint je floating

---

#### 11.11.5 Co tato podsekce přidává k §6/§7/§17

| Sekce | Změna |
|---|---|
| §6 (lib/) | Přidat `lib/parts/jit-hints.ts` (mapping pole → hint text) + rozšířit `lib/parts/scan-queue.ts` o event dispatch |
| §7 (komponenty) | Přidat: `SyncStatusBadge.tsx`, `JustInTimeHint.tsx`, `ScanWelcomeScreen.tsx` (náhrada za ScanOnboarding) |
| §6 (hooks) | Přidat: `hooks/useSyncQueueState.ts`, `hooks/useIdleHint.ts` |
| §10 (PWA flow) | Welcome screen → camera (1 step), NE 4-step tutorial. Queue page se stává **required** screen. |
| §17 (deps) | Žádné nové npm packages — vše vanilla React + Framer Motion (už máme) |
| §21 (velikost) | +3 komponenty + 2 hooks + 1 lib + cca 250–350 LOC. Nový odhad **~1900–2400 LOC** (původně ~1700–2300 LOC) |

---

## 12. Offline-first design

### 12.1 Service Worker (Serwist) konfigurace

**Změny v `public/sw.js`** (Serwist generated, nutno regenerovat přes config):
- Cache route `/parts/scan` (precache)
- NetworkFirst strategy pro `/api/parts/scan-*` (s 5s timeout fallback to queue)
- Background Sync registrace pro tag `part-scans-queue`

**Pozn.:** Serwist 9.x generates SW from config in `next.config.ts`. Nutno přidat do `serwist` config:
```ts
runtimeCaching: [
  {
    urlPattern: /\/api\/parts\/scan-/,
    handler: "NetworkFirst",
    options: {
      cacheName: "scans-api",
      networkTimeoutSeconds: 5,
      backgroundSync: { name: "part-scans-queue", options: { maxRetentionTime: 24 * 60 } }
    }
  }
]
```

### 12.2 IndexedDB queue

Viz §6.3. Klíčové:
- Při offline: foto se uloží jako Blob do queue, ne na Cloudinary
- UI ukáže toast "Foto uloženo offline — odešleme po připojení"
- Background sync nebo `online` event → `processQueue()` → upload + scan + uložit result do queue
- User vidí seznam pending scanů v `/parts/scan/queue` (volitelná stránka)

### 12.3 UI states

| State | UI element | Behavior |
|-------|-----------|----------|
| Online + scan ready | Normal scanner UI | Ihned zpracovat |
| Online + scan submitting | Spinner "AI pracuje" | Block input |
| Offline + new scan | Banner "Offline mode — uloží se po připojení" | Foto → queue |
| Offline + queue not empty | Badge "X scanů ve frontě" | Sklikem zobrazit queue |
| Online recovery + queue not empty | Toast "Synchronizuji X scanů…" | Auto-process |

### 12.4 Limity

- IndexedDB má per-origin storage limit (typicky 50 MB+ na desktop, 20% disku na mobil)
- Foto blob ~1–3 MB každý → queue do 20 fotek bezpečně
- Pokud uživatel přidá > 20 offline scanů → upozornění "Připojte se brzy, queue se zaplnila"

---

## 13. Cost monitoring & rate limiting

### 13.1 Náklady (revized v v2)

> **v2 update:** Náklady přepočítány s reálnými cenami z dokumentace + zahrnuty Whisper API náklady (§6.6 voice input). Cílový rozsah pro early stage je **$75–150/měsíc** (per team-lead update).

**Předpoklad provozu — early stage (~Q2 2026):**
- **Vrakovišť aktivních:** 10 vrakovišť (Praha pilot)
- **Dílů přidávaných:** 100 dílů/vrakoviště/měsíc = 1000 dílů/měsíc
- **Scanů (Claude Vision):** 1,5 scan/díl × 1000 = 1500 Vision scans
- **Voice transcribes:** ~30 % dílů využije voice diktování = 300 voice/měsíc, průměr 15s = 75 minut

| Položka | Calc | $/měsíc |
|---|---|---|
| Claude Sonnet 4.5 Vision | 1500 × $0,005 | $7,50 |
| OpenAI Whisper API | 75 min × $0,006 | $0,45 |
| Cloudinary (free tier) | 4500 fotek/měsíc, 25k limit | $0 |
| **Total early stage** | | **~$8/měsíc** |

**Při škálování — mid stage (~Q3-Q4 2026):**
- 30 vrakovišť × 200 dílů/měsíc = 6000 dílů/měsíc
- 9000 Vision scans + 1500 voice transcribes (375 minut)

| Položka | Calc | $/měsíc |
|---|---|---|
| Claude Sonnet 4.5 Vision | 9000 × $0,005 | $45 |
| OpenAI Whisper API | 375 min × $0,006 | $2,25 |
| Cloudinary (Plus tier) | 27k fotek > free | $89 |
| **Total mid stage** | | **~$136/měsíc** |

**Při full scale (~Q1 2027):**
- 50+ vrakovišť, 15 000 scans/měsíc = ~$75/měsíc Vision + ~$5 Whisper + ~$89 Cloudinary = **~$170/měsíc**

**Závěr:** Plán zůstává v $75–150/měsíc range pro většinu prvního roku. Cloudflare R2 migration (odložená na Q4+) by snížila storage cost z $89 → ~$15.

### 13.2 Rate limiting

**Per-user limity (z `lib/parts/scan-methods.ts`):**
- 100 scanů/den
- $1/den cost cap (~200 scanů Sonnet)

**Implementace:** v každém scan endpoint:
```ts
const recentScans = await prisma.partsScanLog.count({
  where: {
    userId: session.user.id,
    createdAt: { gte: new Date(Date.now() - 24*60*60*1000) }
  }
});
if (recentScans >= RATE_LIMITS.SCANS_PER_DAY_PER_USER) {
  return NextResponse.json({ error: "Denní limit překročen", retryAfter: "tomorrow" }, { status: 429 });
}
```

### 13.3 Monitoring

- `PartsScanLog` agreguje cost per user per day
- ADMIN dashboard endpoint `/api/parts/scan-stats` (out of MVP, ale URL vyhradit)
- Alert: pokud denní cost překročí $5 → email do admin (cron, mimo MVP)

---

## 14. PDF QR layout (detail)

### 14.1 Format A4_8up (Avery L7165 — 8 štítků na A4)

```
┌──────────────────────────────────────┐
│  ┌──────┐  Přední světlomet  │  ...  │
│  │ [QR] │  levý halogen       │       │
│  │      │  4 500 Kč           │       │
│  └──────┘  OEM: 1Z0941017A    │       │
│           carmakler.cz         │       │
├──────────────────────────────────────┤
│  ...                                  │
└──────────────────────────────────────┘
```

- Štítek 99 × 67 mm
- QR 25 × 25 mm vlevo
- Vpravo: Name 14pt bold (truncate na 30 znaků), Cena 18pt orange-500, OEM 9pt mono, "carmakler.cz" 6pt gray
- 8 štítků na A4 (2 × 4)

### 14.2 Format brother_62x29 (Brother QL thermal label)

- Štítek 62 × 29 mm
- QR 24 × 24 mm vlevo
- Vpravo: jen Name (truncate na 20 znaků) 10pt bold + Cena 12pt
- Použití: vrakoviště s Brother QL-820NWB tiskárnou (nákup ~5 000 Kč)

### 14.3 QR obsah

- URL: `https://carmakler.cz/parts/by-qr/{qrSlug}` (rezolved to detail)
- Error correction level: M (15% damage tolerance)
- Encoding: UTF-8 alphanumeric
- Min size: 25 mm (čitelné z 30 cm)

### 14.4 PDF metadata

```ts
pdf.setProperties({
  title: `Carmakler - Štítek pro díl ${part.name}`,
  subject: `OEM: ${part.oemNumber || "n/a"}`,
  creator: "Carmakler PWA",
});
```

---

## 15. 3 varianty MIN/STD/MAX (jako delta)

### MIN — Bez QR tisku, bez offline queue

**Co MENĚ než STD:**
- Žádný `lib/pdf-label.ts` (Tier 5 — vynechat PDF)
- Žádný `qrSlug` field (nepřidávat do schématu)
- Žádný `/api/parts/[id]/label.pdf` endpoint
- Žádný `/api/parts/by-qr/[slug]` endpoint
- Žádný offline queue (`lib/parts/scan-queue.ts`) — pokud offline, scan-button disabled
- Žádný `PartsScanLog` model (cost monitoring jen přes Anthropic dashboard)
- 3 nové endpointy místo 5
- 4 nové komponenty místo 6 (žádný `QrLabelDownloadButton`, žádný `BarcodeScanner`)

**Co stejné jako STD:**
- 5-tier flow (Tier 1, 2, 3, 4)
- Claude Vision integrace
- Auto-fill formuláře
- Confidence indicator

**Velikost:** ~50 % STD práce
**Time-to-ship:** rychleji
**Limit:** žádný offline → vrakoviště v terénu nemůže pracovat
**Doporučení:** **Nevyhovuje** zadání ("offline-first PWA" je požadavek)

### STD — Tento plán (rekapitulace)

- 5-tier flow s pickerem
- Claude Vision (label OCR + part visual ID + describe-photo)
- ZXing barcode scan
- IndexedDB queue + Background Sync
- PDF QR štítek (A4 + Brother QL)
- `PartsScanLog` audit + rate limiting
- 5 endpointů, 6 komponent, 4 lib soubory, 1 Prisma migration
- Provoz ~$50–150/měsíc

### MAX — STD + štítkovač integrace + TecDoc

**Co VÍCE než STD:**
- **Brother QL printer integration** přes Web USB API (Chrome only) — direct print bez PDF kroku
- **TecDoc lookup** v scan-label endpointu → po extraktu OEM number autocompletace `compatibleBrands`, `compatibleModels`, `compatibleYearFrom/To` z TecDoc DB
  - Vyžaduje TecDoc API license (low-thousands EUR/year)
  - Nový lib: `lib/tecdoc.ts` wrapper
  - Cache v Redis nebo DB (TTL 30 dní)
- **Multi-source fallback:** pokud TecDoc nemá match → zkusit Levam, NHTSA vPIC, vindecoder.eu paralelně
- **Custom Roboflow model** trained na CZ vrakovišťních štítcích (po 6 měsících provozu STD a sběru 500+ fotek)
- **Cost dashboard** v admin panelu — `/api/parts/scan-stats` UI
- **Offline cache TOP 100 OEM výrobců** v IndexedDB (preload při PWA registration)

**Velikost:** ~250 % STD práce
**Provoz:** $300–500/měsíc + TecDoc license
**Doporučení:** **Out of scope MVP** — uživatel řekl "OK $50–300/měsíc Claude API", nepokrývá TecDoc license. Vrátit se po MVP launch + měření.

---

## 16. Edge cases

### 16.1 Velké foto (> 10 MB)

- Cloudinary upload preset má limit 10 MB (`/api/upload/route.ts:6`)
- Mobil capture často generuje 4–8 MB JPEG → OK
- Pokud user nahraje DSLR foto 20 MB → 400 z `/api/upload`
- **Mitigation v v2:** client-side preprocess přes `browser-image-compression` (§6.5) — vždy zmenší na max 1920×1920 dimensions + ~500 KB. Output je vždy ≤ 1 MB → Cloudinary nikdy nevrátí 413. EXIF rotation handled automaticky. Web Worker = ne-blocking UI.

### 16.2 EXIF rotation

- Mobile photos mají EXIF Orientation tag
- Cloudinary auto-orientuje při uploadu (default behavior)
- Frontend preview používá `<img>` který respektuje EXIF v moderních prohlížečích
- **Žádná akce potřeba**, ale otestovat na iPhone (nejčastější issue)

### 16.3 Low confidence (Tier 1 → Tier 2)

- Pokud `scanLabel` vrátí confidence < 0.6:
  - UI **NEFAILUJE**, zobrazí ScanResult v "low confidence mode"
  - Explicit warning + fields editable
  - Tlačítko "Zadat OEM ručně" → focus na input
- User vždy může pokračovat, žádný dead-end

### 16.4 Vision API timeout

- Anthropic SLA: typicky < 5s, ale občas 10–30s
- `/api/parts/scan-*` route má `runtime: "nodejs"` + Vercel default timeout 60s
- Frontend timeout: 30s s abort controller → after timeout zobrazí "Trvá to dlouho — zkusit znovu?"
- Background queue (offline scenario): při timeout retry 2× s exponential backoff

### 16.5 Camera permission denied

- ZXing barcode scanner vyžaduje camera permission
- Pokud denied → zobrazit instrukce "Otevřete nastavení prohlížeče → Carmakler → Camera → Allow" + screenshoty
- Fallback: input file capture (jen 1 foto) místo live scan

### 16.6 Duplicate qrSlug

- `crypto.randomBytes(8).toString("hex")` = 16 znaků hex = 64 bit entropy
- Collision chance pro 1M dílů: ~1 z 18 milionů → zanedbatelné
- Defenzivně: pokud `prisma.part.create` selže s P2002 (unique violation) → retry s novým slugem

### 16.7 PDF generování selhá

- jspdf v Next.js server runtime: ověřeno funkční pro `app/api/test-pdf` patterns, ale net bez záruky
- **Smoke test v PR:** generovat dummy PDF v lokálním dev prostředí
- Pokud selže → fallback na client-side PDF generation (jspdf v browser je 100% stabilní, ale větší bundle)

### 16.8 User scanuje **cizí** QR (např. od jiného vrakoviště)

- `/api/parts/by-qr/[qrSlug]` je public, vrátí Part info
- Frontend rozpozná že část NE-patří current userovi → redirect na **public detail** `/dily/{slug}` (eshop), ne na `/parts/my/{id}`
- Uživatel vidí "Toto je díl jiného vrakoviště, můžete koupit"

### 16.9 Velmi malý/nečitelný štítek

- Claude Vision warning: "Image is rotated", "Low contrast"
- UI zobrazí warning + suggestion "Vyfotografujte zblízka, dobré osvětlení, kolmo"
- Tlačítko "Vyfotografovat znovu" → zpět na Camera capture

### 16.10 Rate limit překročen (429)

- UI zobrazí toast: "Dosáhli jste denního limitu 100 scanů. Pokračujte zítra nebo zadejte ručně."
- Manual fallback flow je vždy dostupný (stávající `/parts/new` wizard)

---

## 17. Závislosti / npm packages k přidání

```bash
# Barcode scanning (Tier 1.5)
npm i @zxing/browser @zxing/library

# Client-side image compression (§6.5) — v2 NEW required
npm i browser-image-compression

# OpenAI Whisper API SDK (§6.6 voice input) — v2 NEW required
npm i openai
```

**Velikost:**
- `@zxing/*`: ~150 KB gzipped (browser only)
- `browser-image-compression`: ~10 KB gzipped (browser only, Web Worker)
- `openai`: ~50 KB gzipped (server only — neimportovat z browser bundle)

**Runtime split:**
- Browser bundle: `@zxing/*`, `browser-image-compression` (~160 KB total)
- Server bundle: `openai` (jen v `app/api/parts/transcribe/route.ts`)

**ENV vars (přidat do `.env.example`):**
- `OPENAI_API_KEY` — pro Whisper API (§6.6)

**Pozn.:** `qrcode`, `jspdf`, `idb`, `@anthropic-ai/sdk`, `framer-motion` — **už máme**, žádný další install.

**Změna oproti v1:** v1 doporučovalo "NEpřidávat browser-image-compression, dělej canvas DIY". v2 to mění — npm lib je production-tested, handluje EXIF + iOS Safari + Web Worker, +10 KB je akceptovatelná cena za robustnost (per #77 research insight #4). v1 také vyloučilo voice input úplně (§20) — v2 to mění a přidává `openai` SDK (§6.6).

---

## 18. Implementační pořadí (recommended sequence)

**Sprint A — Backend foundation (1. fáze)**
1. Prisma migration: přidat `qrSlug`, `scanConfidence`, `scanMethod`, `scanCostUsd` na Part + nový `PartsScanLog` model
2. `lib/parts/scan-methods.ts` (konstanty)
3. `lib/claude-vision.ts` (wrapper, prompty)
4. `app/api/parts/scan-label/route.ts` (POST endpoint + Zod schémata)
5. `app/api/parts/scan-part/route.ts`
6. `app/api/parts/describe-photo/route.ts`
7. Smoke test: curl/Postman → Anthropic → response

**Sprint B — Frontend Core (2. fáze)**
8. `app/(pwa-parts)/parts/scan/page.tsx` (entry, state machine, scaffold)
9. `components/pwa-parts/parts/TierSelector.tsx`
10. `components/pwa-parts/parts/ScanCameraCapture.tsx` (input-based first)
11. `components/pwa-parts/parts/ConfidenceIndicator.tsx`
12. `components/pwa-parts/parts/ScanResult.tsx`
13. Integration: `parts/new/page.tsx` reads `?prefill=` searchParam
14. End-to-end happy path test (Tier 1: foto → scan → result → wizard → save)

**Sprint C — Barcode + Tier 1.5 (3. fáze)**
15. `npm i @zxing/browser @zxing/library`
16. `components/pwa-parts/parts/BarcodeScanner.tsx`
17. Tier 1.5 flow integration v scan/page.tsx
18. Test: scan EAN-13 z testovacího obalu

**Sprint D — QR + PDF (4. fáze)**
19. `lib/pdf-label.ts` (jspdf + qrcode)
20. `app/api/parts/[id]/label.pdf/route.ts`
21. `app/api/parts/by-qr/[qrSlug]/route.ts`
22. `components/pwa-parts/parts/QrLabelDownloadButton.tsx`
23. Integration v parts/my detail page
24. Test: stáhnout PDF, vytisknout, scan QR → redirect

**Sprint E — Offline + Polish (5. fáze)**
25. `lib/parts/scan-queue.ts` (IndexedDB)
26. Service worker config update (`next.config.ts` Serwist runtime caching)
27. Background sync registration
28. Offline mode UI (queue badge, banner)
29. Animace + haptické feedback (Framer Motion + Vibration API)
30. Empty states, error states, dark mode check
31. Cost monitoring: PartsScanLog rate limit enforcement

**Sprint F — QA + ship (6. fáze)**
32. Manual test all 5 tiers + 10 edge cases
33. Test offline scenario (DevTools throttle)
34. Test PDF print na různých formátech
35. Lint + build + e2e
36. Dispatch QA na kontrolora
37. Test-Chrome browser test
38. Ship

**Pozn.:** Sprintové bloky lze dispatchovat **jeden implementator dispatch per sprint**, ne all-at-once. Plán je velký — rozdělit minimálně Backend + Frontend Core jako 2 separátní implementator dispatche.

---

## 19. Open questions pro leada

> **v2 cleanup:** Q1 (canvas resize), Q5 (retention), Q-business-model byly **vyřešeny** team-leadem v rewrite #76v2:
> - **Q1 image resize:** Resolved — `browser-image-compression` lib (§6.5)
> - **Q-business model:** Resolved — Wolt 1:1, komise 12-20% admin-configurable (§0)
> - **Q-pilot:** Resolved — Praha + okolí, owner Phase 1 field sales (§25)
> - **Q-onboarding:** Resolved — JIT hints místo wizard tour (§11.11.4)
> - **Q-touch targets:** Resolved — 56px / 64px primary CTA (§11.1 #1)
> - **Q-dark mode:** Resolved — forced dark default (§11.11.1)
> - **Q-voice input:** Resolved — Whisper + Web Speech (§6.6)
> - **Q-Cloudflare migration:** Resolved — odloženo na Q4+ 2026

**Zbývající otevřené otázky pro implementatora (technical-only):**

1. **Rate limit: per user nebo per supplier (Partner)?**
   100 scanů/den/user — ale pokud Partner_VRAKOVISTE má více zaměstnanců přihlášených, mají sdílený limit nebo individuální? Doporučuju **per user** (jednodušší), v MAX variantě by se mohlo řešit per Partner přes přidání `partnerId` na `PartsScanLog`.
   → Decision: per user OK?

2. **PDF formáty: kolik podporovat v MVP?**
   Doporučuju **2 formáty v MVP**: A4_8up (běžné kanceláře) + brother_62x29 (Brother QL — pokud nějaké vrakoviště má). Ostatní (A4_24up, 29x90) jako follow-up po feedbacku.
   → Decision: 2 formáty OK?

3. **Tier 5 — kdy generovat qrSlug?**
   Možnost A: při create Part (eager) — jednoduché, ale plýtvá místem pro draft party
   Možnost B: lazy při prvním requestu na PDF (doporučuju)
   → Decision: lazy?

4. **PartsScanLog retention?**
   Logy mohou narůstat (1500/měsíc → 18k/rok). Smazat starší než 90 dní cron jobem? Nebo držet všechny pro audit?
   → Decision: 90 dní retention nebo unlimited?

5. **Whisper API rate limit?**
   §6.6 navrhuje 50 transcribes/den/user (~$0,30/den max). Stačí to pro reálný use case (vrakoviště dělá ~100 dílů/den, ~50 % použije voice = 50 transcribes)?
   → Decision: 50/den OK nebo zvýšit na 100?

---

## 20. Out of scope (NEDĚLAT v MVP)

- ❌ TecDoc API integration → MAX varianta, follow-up `#76b`
- ❌ Custom YOLO trained model → po 6 měsících provozu + sběru fotek
- ❌ Brother QL Web USB direct print → MAX varianta
- ❌ Hollander Interchange API
- ❌ Multi-source DB reconciliation (Levam, vindecoder.eu paralelně)
- ❌ Cost monitoring admin dashboard UI (jen API endpoint, ne UI)
- ❌ Continuous learning pipeline (ML feedback loop z user opravných edits)
- ❌ Apple/Google Wallet pass generation (NotionTake-Wallet QR)
- ❌ Barcode tisk samostatně (jen v rámci PDF QR štítku)
- ❌ Bulk scan mode (více fotek najednou) — MVP single-photo flow
- ❌ Cross-suppplier QR sharing (vrakoviště A scanuje QR vrakoviště B) — řeší se přes eshop detail, ne přes scan flow

> **Pozn. v2:** Voice input pro popis dílu byl v v1 v této sekci jako "out of scope". v #76v2 byl **přesunut do MVP** (§6.6) na základě team-lead override + uživatelské zpětné vazby ("vrakoviště pracuje v kanceláři, voice je dobrý"). Whisper API ($0,006/min) primary + Web Speech API Chrome fallback.

> **Pozn. v2:** Cloudflare R2 / migration storage byla zvažována jako levnější alternativa Cloudinary. **Odloženo na Q4+ 2026** — MVP zůstává Cloudinary (90 fotek/měsíc × 50 vrakovišť = ~4500 fotek/měsíc, Cloudinary free tier 25k stačí, migrace by byla předčasná optimalizace).

---

## 21. Velikost a rizika (revized v v2)

**Změny v souborech (v2):**
- **Nové soubory:** ~21 (původně 14)
  - 6 `lib/` soubory (přidáno: `image-preprocess.ts`, `voice-input.ts`, `jit-hints.ts`)
  - 6 `app/api/` route handlers (přidáno: `transcribe`, `admin/partners/[id]/commission`, `admin/reports/commission-summary`)
  - 1 `app/(pwa-parts)/parts/scan/page.tsx`
  - 9 nových komponent v `components/pwa-parts/parts/` (přidáno: `SyncStatusBadge`, `JustInTimeHint`, `ScanWelcomeScreen`, `VoiceDescriptionInput`)
  - 3 admin komponenty (`CommissionRateSlider`, `CommissionHistoryList`, `CommissionEditDialog`)
  - 2 hooks (`useSyncQueueState`, `useIdleHint`)
  - 1 Prisma migration soubor (Part fields + PartsScanLog + PartnerCommissionLog + Partner.commissionRate)
- **Upravené soubory:** ~6 (původně 4)
  - `prisma/schema.prisma` (Part model + 2 new models + Partner.commissionRate)
  - `app/(pwa-parts)/parts/new/page.tsx` (read prefill, error handling fix)
  - `next.config.ts` (Serwist runtime caching)
  - `package.json` (`@zxing/*` + `browser-image-compression` + `openai`)
  - `app/(pwa-parts)/layout.tsx` (force dark mode)
  - `.env.example` (`OPENAI_API_KEY`)
- **Nové řádky kódu:** ~2200–2800 (původně 1500–2000)
  - +250 LOC sekce 0 (commission system)
  - +350 LOC sekce 11.11 (sync UI + JIT hints + dark mode)
  - +200 LOC sekce 6.5/6.6 (image preprocess + voice)
  - +150 LOC sekce 24/25 (launch readiness + pilot)

**Risks (revized):**
1. **Claude Vision accuracy v reálných podmínkách** — research #75 odhaduje 50–95 % dle typu štítku. Reálnou accuracy zjistíme až po měření v produkci. Mitigace: confidence threshold + Tier 2/4 fallback (žádný dead-end).
2. **Cost runaway** — pokud user dělá 100 scanů/den à $0,005, je to $0,50/den/user × 50 vrakovišť = $25/den = $750/měsíc. Mitigace: rate limit 100/den + cost cap $1/den + admin cost dashboard alert (§13).
3. **Service Worker komplexnost** — Background Sync API je flaky na Safari/Firefox. Mitigace: §11.11.2 Sync state UI s manual retry queue page (vždy dostupný fallback).
4. **PDF rendering server-side** — `jspdf` v Next.js server runtime *měl by* fungovat (čistý JS), ale není 100% jistota. Mitigace: smoke test na začátku Sprintu D, fallback na client-side generation.
5. **TypeScript strict mode + Anthropic SDK types** — vision API response types jsou v `@anthropic-ai/sdk` discriminated union (`{ type: "text", text: string } | { type: "image", source: ... }`). Existing pattern v `assistant/generate-description/route.ts:82-83` ukazuje, jak to handle.
6. **(NOVÉ v v2) Whisper API rate limit** — OpenAI free tier 50 RPM. Pokud 50 vrakovišť diktuje současně → 429. Mitigace: §13 rate limit 50/den/user + queueing v `/api/parts/transcribe`.
7. **(NOVÉ v v2) Komise admin UI complexity** — slider + history + audit log = ~3 nové komponenty. Mitigace: použít existing admin UI patterns z `admin/partners/[id]`, žádné custom widgets.
8. **(NOVÉ v v2) Pilot phase loneliness** — 10 vrakovišť v Praze nestačí pro liquidity (per #77 marketplace insight). Mitigace: §25 pilot phase + white-glove onboarding 30+ vrakovišť before launch.

---

## 22. Recommended dispatch sekvence pro implementatora

**Doporučená velikost dispatche:** ne celý plán najednou, ale **2–3 implementator volání** rozdělené dle Sprintů §18:

1. **#76a** — Sprint A + B (Backend + Frontend Core, ~60 % plánu) — happy path Tier 1, 2, 4
2. **#76b** — Sprint C + D (Barcode + PDF QR, ~25 % plánu)
3. **#76c** — Sprint E (Offline + polish, ~15 % plánu)

Mezi každým: kontrolor QA + případně test-chrome browser test → feedback loop → další sprint.

**Pokud team-lead chce all-in-one:** dispatch celý plán jednomu implementatorovi, ale počítej s **velkou PR** (~25 souborů, ~2000 řádků), těžkou na review.

---

## 23. Souhrn pro team-leada (revized v v2)

**Co tento plán v2 dodává navíc oproti v1:**
- **§0** — Wolt 1:1 marketplace business model + variable komise 12-20% admin-configurable + Stripe Connect dynamic split + audit log
- **§6.5** — `browser-image-compression` lib (NE DIY canvas) + EXIF rotation + Web Worker
- **§6.6** — Voice input: Whisper API ($0,006/min) primary + Web Speech API Chrome fallback
- **§11.11** — Sync state UI + dark mode forced + JIT hints (náhrada wizard tour)
- **§13** — Reálné cost čísla $75-150/měsíc s Whisper API
- **§24** — Launch Readiness Checklist (30+ vrakovišť, 1000+ dílů, 50%+ match rate)
- **§25** — Pilot Phase + White Glove Onboarding (Praha, owner Phase 1)

**Co plán dodává celkově:**
- 5-tier scan flow s pickerem (žádný dead-end)
- Claude Sonnet 4.5 Vision OCR (label) + visual ID (whole part) + describe (fallback)
- Voice input pro popis dílu (Whisper + Web Speech fallback)
- ZXing barcode scanner (offline-capable, free)
- IndexedDB queue + Background Sync (offline-first per CLAUDE.md) + manuální retry queue UI
- PDF QR štítek pro inventarizaci (jspdf + qrcode, oba už máme)
- Cost monitoring přes PartsScanLog + rate limit 100/den/user
- Wolt 1:1 commission marketplace s admin slider 12-20%
- Auto-fill existing 3-step wizard přes `?prefill=` searchParam
- 21 nových souborů, 6 upravených, 3 npm deps (`@zxing/*`, `browser-image-compression`, `openai`)

**Co plán NEDODÁVÁ (out of MVP):**
- TecDoc lookup, custom YOLO, Brother direct print, Cloudflare R2 storage migration

**5 open questions** v §19 — všechny TECHNICAL-only (rate limits, PDF formats, retention). Business questions byly vyřešeny v rewrite.

**Doporučené dispatch:** rozdělit na **4** implementator volání:
1. **#76a** — Sprint A (DB + Backend basics) + §0 commission system
2. **#76b** — Sprint B (Frontend Core) + §6.5 image preprocess + §11.11 dark mode
3. **#76c** — Sprint C+D (Barcode + PDF QR + voice §6.6)
4. **#76d** — Sprint E+F (Offline sync UI + JIT hints + QA + ship)

Mezi každým: kontrolor QA + případně test-chrome browser test → feedback loop → další sprint.

🎯 Plán v2 je dispatch-ready. Před #76a dispatch: čekáme na #80 LEGAL review komisionářského modelu (§0.6) — bez toho nelze nasadit Stripe Connect split production.

---

## 24. Launch Readiness Checklist (NOVÉ v v2)

> **Účel:** Před prvním reálným launchem (target: konec Q2 2026) musí být splněny tyto podmínky. Tato sekce je závazný gate — bez splnění **NELAUNCHUJEME** (per #77 marketplace research insight: cold-start problem se neopraví v prod, musí být řešen před launch).

### 24.1 Supply-side readiness (vrakoviště)

| # | Kritérium | Cíl | Měření | Stav |
|---|---|---|---|---|
| 1 | **Aktivní vrakoviště** | ≥ 30 vrakovišť signed-up + onboarded | Admin partners count `where status="ACTIVE"` | ⏳ |
| 2 | **Geografická distribuce** | Min 5 krajů ČR pokryto | `Partner.region` distinct count | ⏳ |
| 3 | **Aktivně přidávající** | ≥ 60 % vrakovišť přidalo ≥ 5 dílů v posledních 14 dnech | `Part.createdAt > now() - 14d GROUP BY supplierId` | ⏳ |
| 4 | **Onboarding completion** | ≥ 80 % vrakovišť dokončilo PWA setup (foto QR scan, první díl) | Internal `OnboardingFlag` model | ⏳ |
| 5 | **Cena per díl** | Průměrná cena 500-3000 Kč (cílový segment použité díly) | `AVG(price) FROM Part WHERE status="ACTIVE"` | ⏳ |

### 24.2 Inventory readiness (díly)

| # | Kritérium | Cíl | Měření | Stav |
|---|---|---|---|---|
| 6 | **Total active díly** | ≥ 1000 dílů v katalogu | `COUNT(Part) WHERE status="ACTIVE"` | ⏳ |
| 7 | **Coverage TOP 20 značek** | Min 50 dílů per top značka (ŠKODA, VW, Audi, Ford, Hyundai, Toyota, BMW, Opel) | `COUNT GROUP BY compatibleBrands` | ⏳ |
| 8 | **Coverage TOP 10 kategorií** | Min 30 dílů per top kategorie (motor, brzdy, světla, skla, výfuk) | `COUNT GROUP BY category` | ⏳ |
| 9 | **Foto kvalita** | ≥ 90 % dílů má alespoň 1 foto | `COUNT(PartImage) / COUNT(Part)` | ⏳ |
| 10 | **OEM kompletnost** | ≥ 50 % dílů má `oemNumber` vyplněno (klíčové pro AI matching) | `COUNT WHERE oemNumber IS NOT NULL` | ⏳ |

### 24.3 Demand-side readiness (kupující)

| # | Kritérium | Cíl | Měření | Stav |
|---|---|---|---|---|
| 11 | **Search match rate** | ≥ 50 % uživatelských searches vrátí ≥ 1 výsledek | Track via `SearchLog.resultsCount > 0` | ⏳ |
| 12 | **VIN-based search match** | ≥ 30 % VIN searches vrátí ≥ 1 kompatibilní díl | `SearchLog WHERE searchType="VIN"` | ⏳ |
| 13 | **Zero-result search top 100** | < 10 % searches z top 100 dotazů vrací 0 výsledků | Periodic report | ⏳ |
| 14 | **/dily SEO indexed** | ≥ 100 stránek indexovaných v Google | Search Console | ⏳ |

### 24.4 Tech readiness

| # | Kritérium | Cíl | Měření | Stav |
|---|---|---|---|---|
| 15 | **Vision API uptime** | ≥ 99 % success rate na `/api/parts/scan-label` | `PartsScanLog success/total` | ⏳ |
| 16 | **Vision confidence avg** | Avg confidence ≥ 0,7 na real production fotky | `AVG(scanConfidence)` | ⏳ |
| 17 | **PWA install conversion** | ≥ 40 % vrakovišť nainstalovalo PWA na home screen | `BeforeInstallPromptEvent` track | ⏳ |
| 18 | **Page load TTI mobile** | < 3s na 3G fast (Praha real-world test) | Lighthouse + RUM | ⏳ |
| 19 | **Stripe Connect onboarding** | 100 % aktivních vrakovišť má completed Stripe Connect | `Partner.stripeAccountId IS NOT NULL` | ⏳ |
| 20 | **Cloudinary storage** | < 80 % free tier (25k fotek = 20k threshold) | Cloudinary dashboard | ⏳ |

### 24.5 Business readiness

| # | Kritérium | Cíl | Stav |
|---|---|---|---|
| 21 | **Komisionářský model legal review** | ✅ Schváleno právníkem (#80 LEGAL) | ⏳ |
| 22 | **GDPR cookies + privacy policy** | ✅ Updated pro vrakovišťní data + commission disclosures | ⏳ |
| 23 | **Reklamační proces dokumentován** | ✅ Komu reklamovat (vrakoviště nebo Carmakler), workflow v admin panelu | ⏳ |
| 24 | **DPH model** | ✅ Faktury vrakoviště → Carmakler (komise) + Carmakler → kupující (full price) | ⏳ |
| 25 | **Customer support kapacita** | ≥ 1 osoba dostupná 9-17 (chat + email pro vrakoviště + kupující) | ⏳ |

### 24.6 GO/NO-GO decision matrix

| Stav | Akce |
|---|---|
| **20+/25 splněno** | 🟢 GO — public launch, paid marketing on |
| **15-19/25 splněno** | 🟡 SOFT LAUNCH — invite-only beta, no marketing, řešit chybějící |
| **< 15/25 splněno** | 🔴 NO-GO — pokračovat v pilot fázi (§25), nepřesouvat na public |

**Owner:** Product Owner + Team Lead společně. Checklist se reviewuje **týdně** v dashboardu.

---

## 25. Pilot Phase + White Glove Onboarding (NOVÉ v v2)

> **Účel:** Před public launch potřebujeme 3-6 měsíců pilot fáze v jednom regionu (Praha + okolí), kde majitel + tým osobně objedou vrakoviště, pomohou s onboardingem, sbírají feedback, iterují plán. Toto je standard u marketplace startupů (Wolt, Bolt, DoorDash) a per #77 research insight #6 je **must-have** pro řešení cold-start problému.

### 25.1 Pilot scope

- **Region:** Praha + Středočeský kraj (50 km radius)
- **Timing:** M1-M3 = pilot soft launch / M4-M6 = expansion / M7-M12 = scale
- **Cíl počet vrakovišť:** **30+** signed-up + onboarded do M3 (před public launch §24)
- **Cíl počet dílů:** **1000+** dílů aktivních do M3
- **Cíl GMV:** Není explicitně tracked v pilot — focus na liquidity, NE revenue

### 25.2 Phase 1 (M1-M3): Owner-led field sales

> Citace uživatele (team-lead orchestration): *"Q6 — já jako majitel, pak pujdeme dal jak budeme mít regionalní manazery"*

**Kdo:** Majitel Carmakler (osobně) + 1 brigádník na podporu (volitelné)

**Aktivity:**
- Find list 100+ vrakovišť v Praze + Středočeském (Google Maps + autobazary CZ register)
- Cold call / cold visit — fyzicky objet 50 vrakovišť za M1 (target: 10 onboarded)
- Demo PWA na tabletu / telefonu majitele přímo na vrakovišti
- White-glove onboarding: foto první díl WITH the owner during visit (žádný self-service screen)
- Foto prvních 5 dílů — owner ukáže workflow + diskutuje feedback
- Sales pitch: **0% komise prvních 3 měsíce + Founding Member status** (§0.1) → low-risk pro vrakoviště

**Time investment:**
- ~40 vrakovišť/měsíc × 1 hod visit + 30 min admin = 60 hodin/měsíc majitele
- Travel time: ~20 hodin/měsíc (Praha okolí)
- Total: ~80 hodin/měsíc = ~2/3 majitele full-time

**Budget Phase 1:**
- Cestovné (auto + benzín) — ~5000 Kč/měsíc
- Demo zařízení (1 tablet Lenovo M10 ~5000 Kč jednorázově)
- Brigádník volitelně (~15000 Kč/měsíc pokud potřeba)
- Marketing materiály (letáky, vizitky, samolepky s QR — ~5000 Kč jednorázově)
- **Total Phase 1 (M1-M3):** ~50 000 Kč

### 25.3 Phase 2 (M4-M6): Regionální manageři

> Citace uživatele: *"pak pujdeme dal jak budeme mít regionalní manazery"*

**Kdo:** Majitel + 1-2 noví regionální manageři (kontraktor / part-time)

**Aktivity:**
- Owner stáhne se z field sales (max 20 % času) → focus na produkt + náboru regional managers
- Regional manager objíždí Brno + Plzeň + Ostrava (3 nová města)
- Reuse Phase 1 playbook + materials
- Owner provede shadowing první 2 týdny každého nového regional managera

**Cíl počet do M6:** 80+ vrakovišť total (50 nová z Phase 2)

**Budget Phase 2 (M4-M6):**
- 2× regional manager × 30 000 Kč/měsíc × 3 měsíce = 180 000 Kč
- Cestovné + materiály = 30 000 Kč
- **Total Phase 2:** ~210 000 Kč

### 25.4 Phase 3 (M7-M12): Broker overflow

> Citace uživatele: *"popřípade na to dáme také zvlášt maklere pokud by toho bylo moc"*

**Kdo:** Existing Carmakler broker network (recyklace existing channel) + případně dedicated parts sales reps

**Aktivity:**
- Existing brokeři dostávají 5 % komise z first deal každého vrakoviště, které přivedou (referral)
- Brokeři už mají network v automotive industry → snadné intro
- Dedicated parts sales rep (full-time) v jednom regionu (až overflow)

**Cíl do M12:** 200+ vrakovišť total

### 25.5 Founding Member program (§0.1 ref)

První 30 vrakovišť (Praha pilot, M1-M3) získává:
- **Zlatý badge** "Founding Member" v profilu (vidí kupující v eshopu)
- **0 % komise prvních 3 měsíce** (instead of 12-20 %)
- **Snížená komise následných 9 měsíců** — 8 % místo 12-15 %
- **Direct line to owner** (osobní WhatsApp / mobil) — feedback & support
- **Public co-marketing** — wherever Carmakler vystupuje (PR, blog, eventy), founding members jsou jmenované

**Smlouva ad-hoc:** Komise rate v `Partner.commissionRate` se nastaví na 0 přes admin slider (§0.3). Po 3 měsících auto-trigger (cron) na 8 %.

### 25.6 Feedback collection mechanism

**3 channels:**
1. **In-app feedback** — `<FeedbackButton>` v PWA TopBar, opens textarea + screenshot, posílá na `feedback@carmakler.cz`
2. **Bi-weekly check-in calls** — owner / regional manager volá každé 2 týdny každé pilot vrakoviště (~15 min)
3. **Quarterly NPS survey** — 1 otázka NPS (0-10) + 2 follow-up otázky email blast

**Aggregation:**
- Sheety / Notion DB pro feedback ledger (shared mezi owner + designer + developer)
- Týdenní sync (30 min) team review feedback → action items

### 25.7 Acceptance — kdy ukončit pilot a launchnout?

Pilot fáze je úspěšná když:
- ≥ 30 vrakovišť signed up (24.1 #1)
- ≥ 1000 dílů v katalogu (24.2 #6)
- ≥ 50 % search match rate (24.3 #11)
- NPS ≥ 30 (positive na vrakovišťní straně)
- ≥ 80 % vrakovišť dokončilo onboarding (24.1 #4)

**→ Trigger §24 GO/NO-GO matrix → public launch**

### 25.8 Risk mitigations specific to pilot

| Risk | Mitigation |
|---|---|
| Vrakoviště odmítnou používat tech | 0% komise + white-glove onboarding + osobní support |
| PWA bugs in production | Pilot je defacto staging — bugs jsou očekávané, fast iteration |
| Owner overworked | Phase 2 transition po M3 — strict deadline |
| Cold start search match rate < 50 % | Phase 1 priority: kvantita vrakovišť + diversita značek (§24.2 #7) |
| Negative reviews early | Founding members pečlivě pre-vetted, all bug reports tracked + responded < 24 h |

---

## 26. Verze + changelog

| Verze | Datum | Změny |
|---|---|---|
| v1 | 2026-04-04 | Initial plan: 5-tier scan, Claude Vision, ZXing, PDF QR, offline-first, 23 sekcí |
| **v2** | **2026-04-06** | **Rewrite po #77 research + uživatelských rozhodnutích:** přidáno §0 (Wolt 1:1 commission), §6.5 (image preprocess npm lib), §6.6 (voice input Whisper), §11.11 (sync UI + dark mode + JIT hints), §13 reálné costy, §24 (launch readiness), §25 (pilot phase). Onboarding wizard §11.3 deprecated → JIT hints. Voice removed from §20 out-of-scope. Touch targets 44px → 56px. Cloudflare R2 odložen na Q4+. |

🎯 Plán v2 je dispatch-ready (po #80 LEGAL).
