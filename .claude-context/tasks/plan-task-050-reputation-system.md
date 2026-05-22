# Plán: TASK-050 — Univerzální reputační systém pro celou platformu

**Datum:** 2026-04-25
**Autor:** Plánovač
**Priorita:** 1
**Odhadovaný rozsah:** ~25 souborů, VELKÝ task
**Závislosti:** TASK-044 (hvězdičkový kariérní systém) — hotovo ✅

---

## Architektura — sdílený základ

### Principy

1. **Trust Score** (0-100) — univerzální metrika napříč všemi produkty, automaticky vypočítaná z dat platformy
2. **Skill Tagy** — jediný uživatelský vstup (jednoduché kliknutí), ŽÁDNÉ formuláře/SMS/recenze
3. **Auto-badges** — automaticky udělené na základě dat (žádný manuální vstup)
4. **Activity signals** — "naposledy aktivní", "odpovídá do X hodin" z reálných dat
5. **Per-produkt metriky** — každý produkt má vlastní sadu relevantních metrik

### Sdílený Prisma model

```prisma
// ============================================
// REPUTAČNÍ SYSTÉM (sdílený základ)
// ============================================

model TrustScore {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])

  // Unified Trust Score (0-100)
  score     Int    @default(0)
  tier      String @default("NEW") // NEW, BRONZE, SILVER, GOLD, PLATINUM
  
  // Per-product scores (0-100 each, null = N/A for this user)
  brokerScore   Int? // Makléř trust
  supplierScore Int? // Dodavatel dílů trust
  dealerScore   Int? // Marketplace dealer trust
  investorScore Int? // Marketplace investor trust
  sellerScore   Int? // Inzerent trust

  // Activity signals
  lastActiveAt       DateTime?
  avgResponseMinutes Int? // Průměrný čas odpovědi v minutách
  responseRate       Int? // % odpovězených dotazů (0-100)

  // Cached metrics (recalculated periodically)
  metricsJson String? // JSON: per-product breakdown

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([score])
  @@index([tier])
}

model SkillTag {
  id       String @id @default(cuid())
  
  // Kdo dostal tag
  targetId String
  target   User   @relation("SkillTagTarget", fields: [targetId], references: [id])
  
  // Kdo dal tag (null = anonymní návštěvník přes token)
  giverId  String?
  giver    User?  @relation("SkillTagGiver", fields: [giverId], references: [id])
  
  // Tag
  tag      String // PROFESSIONAL, FAST, FAIR, COMMUNICATIVE, PRECISE, FRIENDLY
  // Broker: PROFESSIONAL, FAST, FAIR, COMMUNICATIVE, PRECISE, FRIENDLY
  // Supplier: QUALITY_PARTS, FAST_SHIPPING, ACCURATE_DESC, GOOD_PACKAGING
  // Dealer: RELIABLE, TRANSPARENT, GOOD_DEALS, FAST_CLOSING
  
  // Kontext
  context  String // BROKER, SUPPLIER, DEALER, SELLER
  
  // Anti-spam: IP + fingerprint
  ipHash   String?
  
  createdAt DateTime @default(now())

  @@unique([targetId, giverId, tag]) // Jeden tag od jednoho uživatele
  @@index([targetId, context])
  @@index([tag])
}

model AutoBadge {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])

  badge      String // Viz per-product badge katalog níže
  context    String // BROKER, SUPPLIER, DEALER, INVESTOR, SELLER
  unlockedAt DateTime @default(now())

  @@unique([userId, badge])
  @@index([userId])
}
```

### Trust Score výpočet (sdílená logika)

```typescript
// lib/reputation/trust-score.ts

// Tier thresholds
const TIERS = {
  NEW: 0,       // 0-24
  BRONZE: 25,   // 25-49
  SILVER: 50,   // 50-74
  GOLD: 75,     // 75-89
  PLATINUM: 90, // 90-100
} as const;

function getTier(score: number): string {
  if (score >= 90) return "PLATINUM";
  if (score >= 75) return "GOLD";
  if (score >= 50) return "SILVER";
  if (score >= 25) return "BRONZE";
  return "NEW";
}
```

---

## Produkt 1: Makléři (BROKER)

### Datové zdroje (už existují v DB)

| Metrika | Zdroj | Tabulka/pole |
|---------|-------|--------------|
| Počet prodejů | `Vehicle` where status=SOLD & brokerId | `Vehicle.status`, `Vehicle.brokerId` |
| Rychlost prodeje | `Vehicle.createdAt` → `Vehicle.soldAt` | Rozdíl v dnech |
| Průměrná provize | `Commission._avg.commission` | `Commission` |
| Kvalita fotek | `VehicleImage.count` per vehicle | `VehicleImage` |
| Odpovědnost na dotazy | `VehicleInquiry.createdAt` → `VehicleInquiry.repliedAt` | `VehicleInquiry` |
| % odpovězených dotazů | `VehicleInquiry` replied vs total | `VehicleInquiry.status` |
| Schválení na 1. pokus | `Vehicle` approved without rejection | `Vehicle.status` history |
| Kariérní úroveň | `User.level` (STAR_1 — STAR_5) | `User.level` |
| Achievements | `UserAchievement` | `UserAchievement` |

### Trust Score — Broker (0-100)

| Složka | Váha | Výpočet |
|--------|------|---------|
| Prodeje | 25% | min(totalSales / 20, 1) × 25 |
| Rychlost prodeje | 15% | avg dnů < 30 = full, < 60 = 75%, < 90 = 50%, else 25% |
| Response rate | 20% | % odpovězených dotazů × 20 |
| Response speed | 15% | avg < 1h = full, < 4h = 75%, < 24h = 50%, else 25% |
| Kvalita fotek | 10% | avg fotek/auto: >= 20 = full, >= 15 = 75%, >= 10 = 50% |
| Kariérní úroveň | 10% | STAR_1=20%, STAR_2=40%, STAR_3=60%, STAR_4=80%, STAR_5=100% |
| Tenure | 5% | Měsíce na platformě: >= 12 = full, >= 6 = 75%, >= 3 = 50% |

### Skill Tagy — Broker

| Tag | Emoji | Popis |
|-----|-------|-------|
| `PROFESSIONAL` | 💪 | Profesionální jednání |
| `FAST` | ⚡ | Rychlé vyřízení |
| `FAIR` | 🤝 | Férový přístup |
| `COMMUNICATIVE` | 📱 | Výborná komunikace |
| `PRECISE` | 🎯 | Přesné informace |
| `FRIENDLY` | 😊 | Příjemné vystupování |

**Mechanismus:** Na veřejném profilu makléře (`/profil/[slug]`) se zobrazí 6 tlačítek s emoji. Návštěvník klikne = +1 ke tagu. Jeden tag od jednoho uživatele/IP (deduplikace přes `@@unique` + `ipHash`).

**Zobrazení:** Tag s počtem: `💪 Profesionální (23)` — seřazené od nejvíc po nejméně.

### Auto-badges — Broker

| Badge | Podmínka | Emoji |
|-------|----------|-------|
| `FAST_RESPONDER` | avgResponseTime < 1h za posledních 30 dní | ⚡ |
| `TOP_SELLER` | >= 5 prodejů za posledních 30 dní | 🏆 |
| `PHOTO_EXPERT` | avg >= 20 fotek/vozidlo | 📸 |
| `VETERAN` | >= 12 měsíců na platformě | 🏅 |
| `PERFECT_RECORD` | >= 10 schválení bez zamítnutí v řadě | ✨ |
| `RESPONSE_KING` | responseRate >= 95% za 30 dní | 💬 |

### Activity Signals — Broker

```
"Naposledy aktivní: dnes" / "před 2 dny" / "před týdnem"
"Obvykle odpovídá do 2 hodin"
"Odpovědnost: 95%"
```

Zdroj: `VehicleInquiry.repliedAt`, `User.updatedAt` / session timestamps.

---

## Produkt 2: Eshop autodíly / Vrakoviště (PARTS_SUPPLIER)

### Datové zdroje (už existují v DB)

| Metrika | Zdroj | Tabulka/pole |
|---------|-------|--------------|
| Počet objednávek | `SubOrder` where supplierId | `SubOrder` |
| Rychlost potvrzení | `SubOrder.createdAt` → status=CONFIRMED | `SubOrder.updatedAt` |
| Rychlost odeslání | `SubOrder.createdAt` → `SubOrder.shippedAt` | `SubOrder` |
| Dodržení dodací lhůty | `SubOrder.shippedAt` → `SubOrder.deliveredAt` | `SubOrder` |
| Reklamace | `ReturnRequest` where type=WARRANTY + subOrderId | `ReturnRequest` |
| Odstoupení | `ReturnRequest` where type=WITHDRAWAL | `ReturnRequest` |
| Existující recenze | `SupplierReview` (1-5 rating + text) | `SupplierReview` |
| Průměrné hodnocení | `SupplierReview._avg.rating` | `SupplierReview` |
| Počet dílů | `Part` where supplierId | `Part` |

### Trust Score — Supplier (0-100)

| Složka | Váha | Výpočet |
|--------|------|---------|
| Hodnocení zákazníků | 25% | `SupplierReview._avg.rating` / 5 × 25 |
| Nízká reklamačnost | 20% | (1 - warrantyReturns / totalOrders) × 20 |
| Rychlost odeslání | 20% | avg < 24h = full, < 48h = 75%, < 72h = 50% |
| Rychlost potvrzení | 10% | avg < 4h = full, < 12h = 75%, < 24h = 50% |
| Počet objednávek | 15% | min(totalOrders / 50, 1) × 15 |
| Sortiment | 10% | min(activeParts / 100, 1) × 10 |

### Skill Tagy — Supplier

| Tag | Emoji | Popis |
|-----|-------|-------|
| `QUALITY_PARTS` | ✅ | Kvalitní díly |
| `FAST_SHIPPING` | 🚀 | Rychlé odeslání |
| `ACCURATE_DESC` | 📋 | Přesný popis stavu |
| `GOOD_PACKAGING` | 📦 | Pečlivé balení |

### Auto-badges — Supplier

| Badge | Podmínka | Emoji |
|-------|----------|-------|
| `ZERO_DEFECT` | 0 WARRANTY reklamací za 90 dní, min 10 objednávek | ✅ |
| `EXPRESS_SHIPPER` | avg odeslání < 24h za 30 dní | 🚀 |
| `TOP_RATED` | avg rating >= 4.5, min 10 recenzí | ⭐ |
| `BIG_CATALOG` | >= 200 aktivních dílů | 📦 |
| `RELIABLE` | >= 50 dokončených objednávek | 🏅 |

### Zobrazení na profilu dodavatele

```
[Trust Score badge: GOLD ★ 78]
[Stars: ★★★★☆ 4.3 (47 recenzí)]
[Auto-badges: 🚀 Express · ✅ Bez reklamací · 📦 Velký sklad]
[Skill Tagy: ✅ Kvalitní díly (31) · 🚀 Rychlé odeslání (18)]
[Activity: "Obvykle potvrzuje do 2 hodin" · "Odesílá do 24 hodin"]
```

---

## Produkt 3: Marketplace VIP (VERIFIED_DEALER / INVESTOR)

### Datové zdroje (už existují v DB)

| Metrika | Zdroj | Tabulka/pole |
|---------|-------|--------------|
| Počet dealů (dealer) | `FlipOpportunity` where dealerId, status=COMPLETED | `FlipOpportunity` |
| Úspěšnost dealů | COMPLETED / total (excluding CANCELLED) | `FlipOpportunity.status` |
| Průměrné ROI | (actualSalePrice - purchasePrice - repairCost) / (purchasePrice + repairCost) | `FlipOpportunity` |
| Rychlost uzavření | `FlipOpportunity.createdAt` → `FlipOpportunity.soldAt` | `FlipOpportunity` |
| Přesnost odhadu | `estimatedSalePrice` vs `actualSalePrice` | `FlipOpportunity` |
| Investice (investor) | `Investment` where investorId | `Investment` |
| ROI investora | `Investment.returnAmount` / `Investment.amount` | `Investment` |
| Výplatní historie | `Investment.paidOutAt` | `Investment` |

### Trust Score — Dealer (0-100)

| Složka | Váha | Výpočet |
|--------|------|---------|
| Track record (completed deals) | 30% | min(completedDeals / 10, 1) × 30 |
| Úspěšnost dealů | 20% | completedDeals / totalDeals × 20 |
| Přesnost odhadů | 20% | avg(|actual - estimated| / estimated < 10%) = full |
| Rychlost uzavření | 15% | avg < 60 dní = full, < 90 = 75%, < 120 = 50% |
| Průměrné ROI | 15% | avgROI >= 20% = full, >= 15% = 75%, >= 10% = 50% |

### Trust Score — Investor (0-100)

| Složka | Váha | Výpočet |
|--------|------|---------|
| Počet investic | 30% | min(totalInvestments / 10, 1) × 30 |
| Objem investic | 25% | min(totalAmount / 5_000_000, 1) × 25 |
| Spolehlivost plateb | 25% | confirmedPayments / totalInvestments × 25 |
| Tenure | 20% | Měsíce na platformě: >= 12 = full |

### Skill Tagy — Dealer

| Tag | Emoji | Popis |
|-----|-------|-------|
| `RELIABLE` | 🤝 | Spolehlivý partner |
| `TRANSPARENT` | 🔍 | Transparentní jednání |
| `GOOD_DEALS` | 💎 | Kvalitní příležitosti |
| `FAST_CLOSING` | ⚡ | Rychlé uzavření dealů |

### Auto-badges — Dealer

| Badge | Podmínka | Emoji |
|-------|----------|-------|
| `PROVEN_DEALER` | >= 5 completed deals | 🏆 |
| `HIGH_ROI` | avg ROI >= 20% | 📈 |
| `ACCURATE_ESTIMATOR` | avg odhad přesnost >= 90% | 🎯 |
| `FAST_FLIPPER` | avg uzavření < 60 dní | ⚡ |

### Auto-badges — Investor

| Badge | Podmínka | Emoji |
|-------|----------|-------|
| `ACTIVE_INVESTOR` | >= 5 investic | 💰 |
| `BIG_PORTFOLIO` | celková investice >= 2M Kč | 🏦 |
| `RELIABLE_PAYER` | 100% potvrzených plateb | ✅ |

---

## Produkt 4: Inzerce (ADVERTISER)

### Datové zdroje (už existují v DB)

| Metrika | Zdroj | Tabulka/pole |
|---------|-------|--------------|
| Počet inzerátů | `Listing` where userId | `Listing` |
| Úspěšnost prodejů | SOLD / total | `Listing.status` |
| Rychlost odpovědi | `Inquiry.createdAt` → `Inquiry.repliedAt` | `Inquiry` |
| % odpovězených dotazů | replied / total inquiries | `Inquiry.status` |
| Kvalita fotek | `ListingImage.count` per listing | `ListingImage` |
| Views/inquiry ratio | `Listing.viewCount` → `Listing.inquiryCount` | `Listing` |
| Flagování | `Listing.flagged` | `Listing` |
| Premium statusy | `Listing.isPremium` | `Listing` |

### Trust Score — Seller (0-100)

| Složka | Váha | Výpočet |
|--------|------|---------|
| Response rate | 25% | % odpovězených Inquiry × 25 |
| Response speed | 20% | avg < 2h = full, < 8h = 75%, < 24h = 50% |
| Úspěšnost prodejů | 20% | soldListings / totalListings × 20 |
| Kvalita inzerátů | 15% | avg fotek >= 15 = full, >= 10 = 75%, >= 5 = 50% |
| Bez flagů | 10% | flaggedListings == 0 = full, 1 = 50%, 2+ = 0% |
| Zkušenost | 10% | min(totalListings / 10, 1) × 10 |

### Skill Tagy — Seller

| Tag | Emoji | Popis |
|-----|-------|-------|
| `HONEST` | ✅ | Přesné informace |
| `RESPONSIVE` | 📱 | Rychlé odpovědi |
| `FAIR_PRICE` | 💰 | Férová cena |
| `GOOD_PHOTOS` | 📸 | Kvalitní fotky |

### Auto-badges — Seller

| Badge | Podmínka | Emoji |
|-------|----------|-------|
| `QUICK_RESPONDER` | avg response < 2h, min 5 dotazů | ⚡ |
| `EXPERIENCED_SELLER` | >= 5 prodaných inzerátů | 🏅 |
| `CLEAN_RECORD` | 0 flagovaných inzerátů, min 3 inzeráty | ✅ |
| `PHOTO_PRO` | avg >= 15 fotek/inzerát | 📸 |

---

## Implementační plán

### Fáze 1: DB modely + sdílená logika (základ)

**Krok 1 — Prisma modely** (`prisma/schema.prisma`)
- Přidat `TrustScore`, `SkillTag`, `AutoBadge` modely (viz výše)
- Přidat relace na `User` model:
  ```prisma
  // Na User model přidat:
  trustScore     TrustScore?
  skillTagsReceived SkillTag[] @relation("SkillTagTarget")
  skillTagsGiven    SkillTag[] @relation("SkillTagGiver")
  autoBadges        AutoBadge[]
  ```
- Migrace: `npx prisma migrate dev`

**Krok 2 — Sdílená logika** (`lib/reputation/`)
```
lib/reputation/
├── trust-score.ts        ← Výpočet unified Trust Score + tiers
├── broker-score.ts       ← Broker-specific kalkulace
├── supplier-score.ts     ← Supplier-specific kalkulace
├── dealer-score.ts       ← Dealer-specific kalkulace
├── investor-score.ts     ← Investor-specific kalkulace
├── seller-score.ts       ← Advertiser-specific kalkulace
├── skill-tags.ts         ← CRUD pro skill tagy + anti-spam
├── auto-badges.ts        ← Badge unlock logic per context
└── recalculate.ts        ← Cron/trigger pro přepočet scores
```

**Krok 3 — API routes**
```
app/api/reputation/
├── [userId]/score/route.ts    ← GET: veřejný Trust Score + badges + tags
├── [userId]/tags/route.ts     ← POST: přidat skill tag (rate-limited)
└── recalculate/route.ts       ← POST: admin trigger pro přepočet (cron)
```

**STOP-1:** Migrace. Pokud drift, standardní `migrate reset --force`.

---

### Fáze 2: Broker reputation (UI)

**Krok 4 — Trust Score badge komponenta** (sdílená)
```tsx
// components/ui/TrustScoreBadge.tsx
interface TrustScoreBadgeProps {
  score: number;      // 0-100
  tier: string;       // NEW, BRONZE, SILVER, GOLD, PLATINUM
  size?: "sm" | "md" | "lg";
}
// Zobrazení: kruhový gauge s číslem + barevný tier label
// NEW = gray, BRONZE = amber, SILVER = slate, GOLD = yellow, PLATINUM = purple
```

**Krok 5 — Skill Tag UI komponenta** (sdílená)
```tsx
// components/ui/SkillTags.tsx
interface SkillTagsProps {
  tags: { tag: string; count: number }[];
  targetId: string;
  context: string;
  interactive?: boolean; // true = návštěvník může kliknout
}
// Zobrazení: řada emoji tlačítek s počtem
// Klik = POST /api/reputation/[userId]/tags
```

**Krok 6 — Auto-badge UI** (sdílená)
```tsx
// components/ui/AutoBadges.tsx
interface AutoBadgesProps {
  badges: { badge: string; unlockedAt: string }[];
  context: string;
}
// Zobrazení: řada emoji badges s tooltipem
```

**Krok 7 — Integrace do ProfileClient.tsx**
- Na veřejném profilu makléře (`/profil/[slug]`) přidat:
  - Trust Score badge (místo smazaných verification badges)
  - Skill Tagy (6 klikatelných emoji)
  - Auto-badges řada
  - Activity signals ("Odpovídá do 2h", "Aktivní dnes")
- Pozice: pod jméno a hvězdičkovou úroveň, nad stats row

**Krok 8 — Integrace do BrokerCard.tsx**
- Přidat mini Trust Score badge (číslo + tier barva)
- Top 3 skill tagy (jen emoji + počet, bez textu)

---

### Fáze 3: Supplier reputation (UI)

**Krok 9 — Profil dodavatele** — dodavatelé nemají veřejný profil jako makléři. Reputace se zobrazuje:
- Na stránce dílu (`/dily/[slug]`) v sidebar "O prodejci"
- Na stránce výsledků hledání jako badge vedle jména vrakoviště
- V PWA dodavatele jako interní score (motivace)

**Krok 10 — Supplier detail component**
```tsx
// components/web/SupplierReputation.tsx
// Zobrazení: Trust Score + stars z SupplierReview + auto-badges + activity
// Použití: /dily/[slug] sidebar
```

---

### Fáze 4: Marketplace + Inzerce reputation

**Krok 11 — Dealer/Investor profil na marketplace**
- Trust Score + auto-badges na marketplace dashboard
- Track record vizualizace (completed deals, ROI chart)

**Krok 12 — Seller reputation na inzertní platformě**
- Trust Score badge na inzerátu vedle jména prodejce
- Skill tagy na detailu inzerátu
- "Obvykle odpovídá do X hodin" signal

---

### Fáze 5: Automatický přepočet

**Krok 13 — Recalculation cron**
```typescript
// lib/reputation/recalculate.ts
// Spouštět 1× denně (nebo po každé relevantní akci)
// 
// Trigger points:
// - Vehicle SOLD → recalculate broker score
// - SubOrder DELIVERED → recalculate supplier score
// - FlipOpportunity COMPLETED → recalculate dealer score
// - Investment CONFIRMED → recalculate investor score
// - Inquiry REPLIED → recalculate seller score
// - SkillTag created → no recalculation needed (just display)
```

**Krok 14 — Auto-badge unlock triggers**
Přidat do existujících API routes:
- `api/vehicles/[id]/handover/route.ts` → check broker badges
- `api/payments/[id]/confirm/route.ts` → check supplier badges
- `api/marketplace/deals/[id]/complete/route.ts` → check dealer badges

---

## Přehled souborů

### Nové soubory

| # | Soubor | Popis |
|---|--------|-------|
| 1 | `lib/reputation/trust-score.ts` | Sdílený Trust Score výpočet + tiers |
| 2 | `lib/reputation/broker-score.ts` | Broker-specific kalkulace |
| 3 | `lib/reputation/supplier-score.ts` | Supplier-specific kalkulace |
| 4 | `lib/reputation/dealer-score.ts` | Dealer-specific kalkulace |
| 5 | `lib/reputation/investor-score.ts` | Investor-specific kalkulace |
| 6 | `lib/reputation/seller-score.ts` | Advertiser-specific kalkulace |
| 7 | `lib/reputation/skill-tags.ts` | CRUD + anti-spam pro skill tagy |
| 8 | `lib/reputation/auto-badges.ts` | Badge unlock logic |
| 9 | `lib/reputation/recalculate.ts` | Denní přepočet všech scores |
| 10 | `app/api/reputation/[userId]/score/route.ts` | GET: veřejný score |
| 11 | `app/api/reputation/[userId]/tags/route.ts` | POST: přidat skill tag |
| 12 | `app/api/reputation/recalculate/route.ts` | POST: admin trigger |
| 13 | `components/ui/TrustScoreBadge.tsx` | Kruhový gauge s Trust Score |
| 14 | `components/ui/SkillTags.tsx` | Klikatelné emoji tagy |
| 15 | `components/ui/AutoBadges.tsx` | Řada auto-badges |
| 16 | `components/ui/ActivitySignal.tsx` | "Odpovídá do 2h" signal |
| 17 | `components/web/SupplierReputation.tsx` | Reputace dodavatele na webu |

### Editované soubory

| # | Soubor | Změna |
|---|--------|-------|
| 18 | `prisma/schema.prisma` | Přidat TrustScore, SkillTag, AutoBadge + User relace |
| 19 | `app/(web)/profil/[slug]/ProfileClient.tsx` | Trust Score + Skill Tagy + Auto-badges + Activity |
| 20 | `app/(web)/profil/[slug]/page.tsx` | Fetch reputation dat |
| 21 | `components/web/BrokerCard.tsx` | Mini Trust Score + top tagy |
| 22 | `app/(web)/makleri/page.tsx` | Include reputation v dotazu |
| 23 | `app/(web)/page.tsx` | Include reputation pro homepage karty |
| 24 | `app/(web)/dily/[slug]/page.tsx` | Supplier reputation sidebar |
| 25 | `app/api/vehicles/[id]/handover/route.ts` | Trigger broker score recalc |

---

## Vizuální design — Trust Score

### Kruhový gauge

```
      ╭──────╮
     │  78   │ ← číslo ve středu
     │ GOLD  │ ← tier label
      ╰──────╯
   ████████░░░░ ← progress bar (78%)
```

Barvy tierů:
- **NEW** (0-24): `bg-gray-100 text-gray-500`
- **BRONZE** (25-49): `bg-amber-100 text-amber-700`
- **SILVER** (50-74): `bg-slate-100 text-slate-600`
- **GOLD** (75-89): `bg-yellow-100 text-yellow-700` + subtle glow
- **PLATINUM** (90-100): `bg-purple-100 text-purple-700` + shimmer effect

### Skill Tagy — layout

```
💪 23  ⚡ 18  🤝 15  📱 12  🎯 8  😊 6
```

Na hover: tooltip s popisem ("Profesionální jednání")
Na klik (pokud interactive): animace +1, POST na API

### Auto-badges — layout

```
⚡ Rychlá odpověď · 🏆 Top prodejce · 📸 Foto expert
```

Badges jako pills s emoji + text, seřazené chronologicky (nejnovější první).

---

## Anti-spam pro Skill Tagy

1. **Deduplikace:** `@@unique([targetId, giverId, tag])` — přihlášený uživatel může dát každý tag jen jednou
2. **IP hash:** Pro nepřihlášené — `ipHash` (SHA256 IP) + cookie token
3. **Rate limiting:** Max 10 tagů / IP / 24h
4. **Cooldown:** Min 5s mezi tagy od stejného IP
5. **Žádné odebírání:** Jednou daný tag nelze odebrat (jen přidat)
6. **Minimum threshold:** Zobrazit tag na profilu jen pokud count >= 3

---

## Relationship k TASK-046

TASK-046 (profil redesign) plánoval `BrokerReview` model. **TASK-050 NAHRAZUJE tento přístup**:
- Místo klasických recenzí (formuláře, SMS) → Skill Tagy (jednoduché kliknutí)
- Místo `BrokerReview.rating` (1-5) → Trust Score (auto-calculated, 0-100)
- Místo `ReputationBadge` (★ 4.8, 12 recenzí) → `TrustScoreBadge` (78 GOLD)

**TASK-046 Fáze 1 (BrokerReview model) se RUŠÍ** — nahrazena TASK-050.
**TASK-046 Fáze 2-4 (layout redesign) zůstávají** — ale s Trust Score místo BrokerReview.
**TASK-046 Fáze 5 (review submission flow) se RUŠÍ** — žádné formuláře/emaily.

---

## Acceptance criteria

1. ✅ Sdílené Prisma modely (TrustScore, SkillTag, AutoBadge) fungují pro všechny 4 produkty
2. ✅ Trust Score (0-100) se automaticky počítá z dat platformy — ŽÁDNÝ manuální vstup
3. ✅ 5 tier úrovní (NEW → PLATINUM) s vizuálním rozlišením
4. ✅ Skill Tagy fungují jako jednoduché kliknutí (tap-based), anti-spam ochrana
5. ✅ Auto-badges se odemykají automaticky na základě dat
6. ✅ Activity signals ("odpovídá do X hodin") z reálných dat
7. ✅ Broker profil zobrazuje Trust Score + Skill Tagy + Auto-badges + Activity
8. ✅ BrokerCard na homepage zobrazuje mini Trust Score
9. ✅ Supplier reputation na stránce dílu
10. ✅ Dealer/Investor reputation na marketplace
11. ✅ Seller reputation na inzerátu
12. ✅ Denní automatický přepočet scores
13. ✅ ŽÁDNÉ formuláře, ŽÁDNÉ SMS, ŽÁDNÉ klasické recenze
14. ✅ Existující `SupplierReview` zachován (doplněk k Trust Score)

## STOP pravidla

| # | Podmínka | Akce |
|---|----------|------|
| STOP-1 | Prisma migrace selže | Řešit drift standardním postupem |
| STOP-2 | Anti-spam skill tagů nedostatečný (botnet) | Přidat CAPTCHA nebo remove feature |
| STOP-3 | Trust Score formula neodpovídá realitě | Konzultovat s product ownerem, upravit váhy |

## Doporučené pořadí implementace

1. **Fáze 1** (modely + logika) — základ, bez UI
2. **Fáze 2** (broker UI) — nejvíc viditelné, nejdůležitější
3. **Fáze 5** (přepočet) — aby scores fungovaly v reálném čase
4. **Fáze 3** (supplier UI) — druhý produkt
5. **Fáze 4** (marketplace + inzerce) — třetí a čtvrtý produkt
