# Plan: Redesign hodnocení makléřů — lepší vizuál

**Task:** #28
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Enhancement (vizuální redesign + datový model)
**Závažnost:** MEDIUM-HIGH — důvěra v makléře je klíčová konverze

---

## 1. Aktuální stav — KRITICKÉ PROBLÉMY

### A: Review model NEMÁ vztah k makléři (CRITICAL)

```prisma
model Review {
  id          String   @id @default(cuid())
  authorName  String
  authorCity  String?
  text        String   @db.Text
  rating      Int      @default(5)
  type        String   @default("GENERAL")
  isPublished Boolean  @default(false)
  isFeatured  Boolean  @default(false)
  source      String?
  // ❌ CHYBÍ: brokerId, userId — recenze NENÍ navázána na konkrétního makléře!
}
```

**Problém:** Review je "recenze platformy CarMakléř", ne "recenze makléře Jana Nováka". Není žádný `brokerId`. Když uživatel hodnotí službu konkrétního makléře, hodnocení se nikde neukáže na profilu toho makléře.

### B: Na profilu makléře NEEXISTUJE sekce recenzí

`ProfileClient.tsx` (1107 řádků) neobsahuje žádnou referenci na "review", "recenze" ani "hodnocení". Profil makléře ukazuje:
- Header (avatar, jméno, trust score, badges)
- O mně (bio, motto, brands)
- Specializace (typy aut, služby, jazyky)
- Kontakt (telefon, web, sociální sítě)
- Vozidla/Inzeráty/Díly (tabbed grid)

**→ Žádné recenze od klientů!**

### C: Existující reputation systém je "systémový", ne "lidský"

Profil má robustní reputation systém, ale vše je **automatické/systémové**:
- `TrustScore` — vypočítaný algoritmus (response time, response rate, sales count)
- `AutoBadges` — automaticky udělované odznaky (FAST_RESPONDER, TOP_SELLER)
- `SkillTags` — crowd-sourced tagy (PROFESSIONAL, FAST, FAIR) — interaktivní, ale jednoduché

**Chybí:** Skutečné textové recenze od klientů — "Prodal mi Octavii, výborná komunikace, doporučuji."

### D: Kontrast s autoservisy — ty mají LEPŠÍ reviews

ServisReview model má:
- `recommend` boolean
- `title` — nadpis recenze
- `ratingQuality`, `ratingPrice`, `ratingSpeed`, `ratingComm` — 4 detailní hodnocení
- `serviceType`, `vehicleBrand` — kontext
- Vizuálně: doporučení badge, detailní ratings, service type tag

**→ Autoservisy mají lepší review systém než makléři. To je špatně.**

---

## 2. Návrh řešení

### 2.1 Rozšířit Review model o vazbu na makléře

**Přidat do `Review`:**

```prisma
model Review {
  // Existující pole zůstanou...
  
  // NOVÉ — vazba na makléře
  brokerId    String?
  broker      User?    @relation("BrokerReviews", fields: [brokerId], references: [id])
  
  // NOVÉ — detailní hodnocení makléře
  ratingCommunication Int?    // Komunikace (1-5)
  ratingSpeed         Int?    // Rychlost jednání (1-5)
  ratingFairness      Int?    // Férovost (1-5)
  ratingProfessionalism Int?  // Profesionalita (1-5)
  
  // NOVÉ — kontext
  vehicleBrand  String?        // Jaké auto se řešilo
  recommend     Boolean?       // Doporučuje makléře
  
  // NOVÉ — verifikace
  isVerified    Boolean @default(false)  // Ověřený nákup/prodej přes platformu
  
  @@index([brokerId])
}
```

**Pozn.:** `brokerId` je nullable — existující Reviews (platformové) zůstanou bez vazby. Nové reviews mohou být vázané na makléře.

### 2.2 Nový model `BrokerReview` (ALTERNATIVA — DOPORUČENO)

**Místo rozšiřování Review modelu vytvořit NOVÝ model**, analogicky jak ServisReview je oddělený od Review:

```prisma
model BrokerReview {
  id              String   @id @default(cuid())
  
  // Vazba na makléře
  brokerId        String
  broker          User     @relation("BrokerReviews", fields: [brokerId], references: [id], onDelete: Cascade)
  
  // Autor
  authorName      String
  authorCity      String?
  authorUserId    String?           // Pokud je přihlášený
  author          User?    @relation("ReviewAuthor", fields: [authorUserId], references: [id])
  
  // Celkové hodnocení
  rating          Int               // 1-5 celkově
  recommend       Boolean  @default(true)
  text            String   @db.Text
  
  // Detailní hodnocení (1-5, nullable)
  ratingCommunication   Int?   // Komunikace
  ratingSpeed           Int?   // Rychlost jednání
  ratingFairness        Int?   // Férovost ceny/podmínek
  ratingProfessionalism Int?   // Profesionalita a znalosti
  
  // Kontext transakce
  transactionType String?     // "SALE" | "PURCHASE" | "CONSULTATION"
  vehicleBrand    String?     // Jaké auto se řešilo
  vehicleModel    String?
  
  // Verifikace
  isVerified      Boolean  @default(false)   // Ověřená transakce přes platformu
  vehicleId       String?                    // Reference na vozidlo (pro verifikaci)
  
  // Moderace
  isPublished     Boolean  @default(false)
  isFeatured      Boolean  @default(false)
  reportCount     Int      @default(0)
  adminNote       String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([brokerId])
  @@index([isPublished])
  @@index([rating])
  @@index([authorUserId])
}
```

**Proč nový model místo rozšíření:**
1. Review je platformová recenze (CarMakléř obecně), BrokerReview je recenze konkrétního makléře — jiná entita
2. Pattern konzistentní se ServisReview (autoservisy mají vlastní model)
3. Žádná zpětná nekompatibilita — existující Reviews zůstanou nedotčené
4. Oddělená admin správa, API, validace

### 2.3 Agregované metriky na User modelu

Přidat do User (denormalizované pro rychlý přístup):

```prisma
// V model User přidat:
brokerAvgRating     Float   @default(0)
brokerReviewCount   Int     @default(0)
brokerRecommendRate Float   @default(0)  // % doporučení
```

Aktualizovat při každém publish/unpublish BrokerReview (trigger v API).

---

## 3. Vizuální návrh — Profil makléře

### 3.1 Souhrnný rating blok (nový na profilu)

```
┌─────────────────────────────────────────────────────────┐
│  Hodnocení od klientů                                    │
│                                                          │
│  ┌───────────┐   Celkové hodnocení                      │
│  │           │   ★★★★★ 4.8 z 5                        │
│  │   4.8     │   23 recenzí · 96% doporučuje            │
│  │   ★★★★★  │                                          │
│  │           │   5★ ████████████████████████████ 18     │
│  └───────────┘   4★ ██████████                    4     │
│                  3★ ██                            1     │
│                  2★                               0     │
│                  1★                               0     │
│                                                          │
│  ┌──────────────┬──────────────┬──────────────┬────────┐│
│  │ Komunikace   │ Rychlost     │ Férovost     │ Profi  ││
│  │ ★★★★★ 4.9   │ ★★★★★ 4.7   │ ★★★★☆ 4.5   │ ★★★★★ ││
│  │              │              │              │  4.8   ││
│  └──────────────┴──────────────┴──────────────┴────────┘│
└─────────────────────────────────────────────────────────┘
```

### 3.2 Karta recenze (vizuální upgrade)

```
┌─────────────────────────────────────────────────────────┐
│  ┌────┐  Jan K.  ·  Praha  ·  15. 3. 2026              │
│  │ JK │  ★★★★★                                         │
│  └────┘  ✅ Ověřený prodej                              │
│                                                          │
│  Prodej Škoda Octavia                                    │
│                                                          │
│  "Skvělá zkušenost s prodejem auta přes CarMakléře.     │
│  Makléř Petr byl profesionální, komunikativní a celý    │
│  proces zvládl za 2 týdny. Doporučuji!"                 │
│                                                          │
│  ┌────────────┬────────────┬────────────┬──────────────┐│
│  │ Komunikace │ Rychlost   │ Férovost   │ Profesional. ││
│  │ ★★★★★      │ ★★★★★      │ ★★★★☆      │ ★★★★★       ││
│  └────────────┴────────────┴────────────┴──────────────┘│
│                                                          │
│  👍 Doporučuje tohoto makléře                            │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Formulář recenze (na profilu makléře)

```
┌─────────────────────────────────────────────────────────┐
│  Ohodnoťte makléře [jméno]                               │
│                                                          │
│  Celkové hodnocení *                                     │
│  ★ ★ ★ ★ ★                                              │
│                                                          │
│  Jak hodnotíte?                                          │
│  ┌────────────┬────────────┬────────────┬──────────────┐│
│  │ Komunikace │ Rychlost   │ Férovost   │ Profesional. ││
│  │ ★ ★ ★ ★ ★ │ ★ ★ ★ ★ ★ │ ★ ★ ★ ★ ★ │ ★ ★ ★ ★ ★  ││
│  └────────────┴────────────┴────────────┴──────────────┘│
│  (nepovinné — stačí celkové hodnocení)                   │
│                                                          │
│  Typ transakce                                           │
│  ○ Prodej auta  ○ Nákup auta  ○ Konzultace              │
│                                                          │
│  Značka vozidla (nepovinné)                              │
│  [Škoda ▾]                                               │
│                                                          │
│  Vaše jméno *           Město (nepovinné)                │
│  [Jan N.        ]       [Praha           ]               │
│                                                          │
│  Vaše zkušenost * (min. 20 znaků)                        │
│  [                                            ]          │
│  [                                            ]          │
│  [                                            ]          │
│                                                          │
│  ☑ Doporučuji tohoto makléře                             │
│                                                          │
│  [Odeslat recenzi]                                       │
│                                                          │
│  ℹ Recenze bude zveřejněna po ověření administrátorem   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Implementační plán

### Krok 1: Prisma model + migrace

**Soubor:** `prisma/schema.prisma`

1. Přidat `BrokerReview` model (viz §2.2)
2. Přidat agregované pole na User: `brokerAvgRating`, `brokerReviewCount`, `brokerRecommendRate`
3. Přidat relace: `User.brokerReviews` (BrokerReview[])

**Migrace:** `npx prisma migrate dev --name add-broker-reviews`

### Krok 2: API endpoint pro broker reviews

**Soubory:**

| Soubor | Typ | Detail |
|--------|-----|--------|
| `app/api/brokers/[slug]/reviews/route.ts` | NEW | GET (public) + POST (rate-limited) |

**GET `/api/brokers/[slug]/reviews`:**
- Vrátí published BrokerReviews pro makléře
- Paginace (limit, offset)
- Seřazeno: newest first
- Zahrnuje detailní hodnocení

**POST `/api/brokers/[slug]/reviews`:**
- Zod validace (authorName, rating 1-5, text min 20, recommend, detailní ratings optional)
- Rate limit: 3 req / 10 min per IP
- Vytvoří s `isPublished: false`
- Notifikace adminu
- Recalculate aggregate ratings na User (jen při publish z admin)

**Zod schema:**

```typescript
const brokerReviewSchema = z.object({
  authorName: z.string().min(2).max(100),
  authorCity: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(20).max(5000),
  recommend: z.boolean().default(true),
  transactionType: z.enum(["SALE", "PURCHASE", "CONSULTATION"]).optional(),
  vehicleBrand: z.string().max(50).optional(),
  vehicleModel: z.string().max(50).optional(),
  ratingCommunication: z.number().int().min(1).max(5).optional(),
  ratingSpeed: z.number().int().min(1).max(5).optional(),
  ratingFairness: z.number().int().min(1).max(5).optional(),
  ratingProfessionalism: z.number().int().min(1).max(5).optional(),
});
```

### Krok 3: Utility pro agregaci ratings

**Soubor:** `lib/broker-reviews.ts` (NEW)

```typescript
export async function recalculateBrokerRatings(brokerId: string) {
  const reviews = await prisma.brokerReview.findMany({
    where: { brokerId, isPublished: true },
    select: { rating: true, recommend: true },
  });
  
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const recommendRate = count > 0
    ? reviews.filter(r => r.recommend).length / count * 100
    : 0;
  
  await prisma.user.update({
    where: { id: brokerId },
    data: {
      brokerAvgRating: Math.round(avg * 10) / 10,
      brokerReviewCount: count,
      brokerRecommendRate: Math.round(recommendRate),
    },
  });
}

// Rating breakdown (5★ count, 4★ count, ...)
export async function getBrokerRatingBreakdown(brokerId: string) {
  const reviews = await prisma.brokerReview.findMany({
    where: { brokerId, isPublished: true },
    select: { rating: true },
  });
  
  const breakdown = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0
      ? Math.round(reviews.filter(r => r.rating === stars).length / reviews.length * 100)
      : 0,
  }));
  
  return breakdown;
}

// Průměry detailních hodnocení
export async function getBrokerDetailedRatings(brokerId: string) {
  const reviews = await prisma.brokerReview.findMany({
    where: { brokerId, isPublished: true },
    select: {
      ratingCommunication: true,
      ratingSpeed: true,
      ratingFairness: true,
      ratingProfessionalism: true,
    },
  });
  
  const avg = (field: keyof typeof reviews[0]) => {
    const vals = reviews.map(r => r[field]).filter((v): v is number => v !== null);
    return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null;
  };
  
  return {
    communication: avg("ratingCommunication"),
    speed: avg("ratingSpeed"),
    fairness: avg("ratingFairness"),
    professionalism: avg("ratingProfessionalism"),
  };
}
```

### Krok 4: UI komponenty

| Soubor | Typ | Detail |
|--------|-----|--------|
| `components/web/BrokerReviewSection.tsx` | NEW | Celá sekce recenzí na profilu makléře |
| `components/web/BrokerReviewCard.tsx` | NEW | Jednotlivá karta recenze s detailním hodnocením |
| `components/web/BrokerReviewForm.tsx` | NEW | Formulář pro odeslání recenze makléře |
| `components/web/BrokerRatingSummary.tsx` | NEW | Souhrnný blok (celkový rating + breakdown bar + detailní) |
| `components/web/RatingBreakdownBar.tsx` | NEW | Progress bar breakdown (5★→1★) |
| `components/web/DetailedRatingDisplay.tsx` | NEW | 4-sloupcové detailní hodnocení (komunikace, rychlost...) |

### Krok 4a: `BrokerRatingSummary.tsx`

**Hlavní souhrnný blok:**
- Velké číslo (4.8) s hvězdičkami
- Počet recenzí + % doporučení
- Breakdown bar: horizontální progress bary (5★ → 1★) s počty
- 4 detailní hodnocení (komunikace, rychlost, férovost, profesionalita) — průměry

**Design notes:**
- Breakdown bar: orange (#F97316) na šedém pozadí
- Responsive: na mobile stack vertically, na desktop vedle sebe
- Konzistentní s orange brand

### Krok 4b: `BrokerReviewCard.tsx`

**Karta jedné recenze:**
- Avatar iniciály (kruh s barvou z hash jména) — NE img, jde o anonymní autory
- Jméno, město, datum
- Celkový rating (hvězdy)
- Verified badge (✅ Ověřený prodej) pokud `isVerified`
- Transaction type badge (Prodej/Nákup/Konzultace)
- Text recenze
- 4 mini rating bary (komunikace, rychlost, férovost, profi) — jen pokud vyplněno
- "Doporučuje" indicator (palec nahoru + zelený text)

**Design notes:**
- Card s jemným border (gray-200) a hover efektem
- Avatar circle: hash jména → color z palety (orange, blue, green, purple, red)
- Verified badge: zelená ikona + text

### Krok 4c: `BrokerReviewForm.tsx`

**Formulář:**
- Celkové hvězdičkové hodnocení (interactive, hover efekt, 1-5)
- 4 detailní hodnocení (optional) — každé jako row s label + interactive stars
- Typ transakce — radio buttons (Prodej/Nákup/Konzultace)
- Značka + model vozidla (optional, selecty)
- Jméno (required), Město (optional)
- Text (textarea, min 20 znaků)
- Doporučení checkbox (default checked)
- Submit → POST `/api/brokers/[slug]/reviews`

**UX:**
- Detailní hodnocení se ukáže po zadání celkového (progressive disclosure)
- Stars mají hover efekt (preview) + click (set)
- Real-time character count na textarea
- Success state: zelený alert + reset form

### Krok 5: Integrace do profilu

**Soubor:** `app/(web)/profil/[slug]/page.tsx` (EDIT)

Přidat do `getProfileData()`:
```typescript
// Fetch broker reviews
const [brokerReviews, brokerReviewCount, ratingBreakdown, detailedRatings] = await Promise.all([
  prisma.brokerReview.findMany({
    where: { brokerId: user.id, isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  }),
  prisma.brokerReview.count({
    where: { brokerId: user.id, isPublished: true },
  }),
  getBrokerRatingBreakdown(user.id),
  getBrokerDetailedRatings(user.id),
]);
```

**Soubor:** `app/(web)/profil/[slug]/ProfileClient.tsx` (EDIT)

Přidat novou sekci po "O mně" a před "Vozidla":

```tsx
{/* Recenze od klientů — NOVÁ SEKCE */}
{(user.role === "BROKER" || user.role === "MANAGER" || user.role === "REGIONAL_DIRECTOR") && (
  <BrokerReviewSection
    brokerId={user.id}
    brokerSlug={user.slug!}
    brokerName={`${user.firstName} ${user.lastName}`}
    avgRating={user.brokerAvgRating}
    reviewCount={user.brokerReviewCount}
    recommendRate={user.brokerRecommendRate}
    reviews={brokerReviews}
    breakdown={ratingBreakdown}
    detailedRatings={detailedRatings}
    isOwner={isOwner}
  />
)}
```

### Krok 6: Rating na BrokerCard

**Soubor:** `components/web/BrokerCard.tsx` (EDIT)

Přidat do karty makléře:
- ★ 4.8 (23 recenzí) — vedle jména nebo pod trust score
- Pokud `brokerReviewCount > 0`: zobrazit rating + count
- Pokud `brokerReviewCount === 0`: nezobrazovat nic (ne "Žádné recenze")

### Krok 7: Admin správa broker reviews

**Soubor:** `components/admin/BrokerReviewsManager.tsx` (NEW)

Pattern z `ReviewsManager.tsx` — tabulka s:
- Filtr: Published / Awaiting / All
- Per review: jméno makléře, autor, rating, text (zkrácený), datum
- Akce: Publish, Unpublish, Delete
- Publish → recalculate agregované metriky

**API endpoint:** `app/api/admin/broker-reviews/route.ts` (NEW)
- GET: seznam s filtrací
- PUT `[id]`: publish/unpublish
- DELETE `[id]`: smazat

### Krok 8: Automatická verifikace (OPTIONAL — Fáze 2)

Když se dokončí prodej/nákup vozidla přes platformu:
1. Systém vytvoří `BrokerReview` se `isVerified: true`, `vehicleId: vehicle.id`
2. Kupující/prodávající dostane email s odkazem na doplnění recenze
3. Recenze s `isVerified: true` se zobrazí s green ✅ badge

**Toto je OPTIONAL feature pro budoucnost.** V MVP stačí manuální reviews.

---

## 5. JSON-LD Structured Data

Na profilu makléře přidat `AggregateRating` schema:

```json
{
  "@type": "Person",
  "name": "Petr Novák",
  "jobTitle": "Automobilový makléř",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.8,
    "reviewCount": 23,
    "bestRating": 5,
    "worstRating": 1
  },
  "review": [
    {
      "@type": "Review",
      "reviewRating": { "@type": "Rating", "ratingValue": 5 },
      "author": { "@type": "Person", "name": "Jan K." },
      "reviewBody": "Skvělá zkušenost..."
    }
  ]
}
```

**Soubor:** `lib/seo.ts` (EDIT) — přidat `generateBrokerProfileJsonLd()`

---

## 6. Seznam souborů

### Krok 1 — DB:

| Soubor | Typ | Detail |
|--------|-----|--------|
| `prisma/schema.prisma` | EDIT | +BrokerReview model, +User aggregate fields |
| Migrace SQL | NEW | create BrokerReview + aggregate columns |

### Krok 2-3 — API + Logic:

| Soubor | Typ | Detail |
|--------|-----|--------|
| `app/api/brokers/[slug]/reviews/route.ts` | NEW | GET + POST broker reviews |
| `lib/broker-reviews.ts` | NEW | recalculate, breakdown, detailed ratings |
| `app/api/admin/broker-reviews/route.ts` | NEW | Admin CRUD |

### Krok 4 — UI komponenty:

| Soubor | Typ | Detail |
|--------|-----|--------|
| `components/web/BrokerReviewSection.tsx` | NEW | Celá sekce (summary + list + form) |
| `components/web/BrokerReviewCard.tsx` | NEW | Karta jedné recenze |
| `components/web/BrokerReviewForm.tsx` | NEW | Formulář pro recenzi makléře |
| `components/web/BrokerRatingSummary.tsx` | NEW | Souhrnný rating blok |
| `components/web/RatingBreakdownBar.tsx` | NEW | Progress bar breakdown (5★→1★) |
| `components/web/DetailedRatingDisplay.tsx` | NEW | 4-sloupcový detailní rating |

### Krok 5-7 — Integrace:

| Soubor | Typ | Detail |
|--------|-----|--------|
| `app/(web)/profil/[slug]/page.tsx` | EDIT | Fetch broker reviews data |
| `app/(web)/profil/[slug]/ProfileClient.tsx` | EDIT | Přidat BrokerReviewSection |
| `components/web/BrokerCard.tsx` | EDIT | Přidat rating display |
| `components/admin/BrokerReviewsManager.tsx` | NEW | Admin správa |
| `lib/seo.ts` | EDIT | +generateBrokerProfileJsonLd() |

### Celkem: 11 NEW + 5 EDIT

---

## 7. Prioritizace

### Fáze 1 — MVP (MUST):

1. BrokerReview Prisma model + migrace
2. API endpoint (GET + POST)
3. BrokerReviewForm (formulář na profilu)
4. BrokerReviewCard (zobrazení recenzí)
5. BrokerRatingSummary (souhrnný blok)
6. Integrace do ProfileClient
7. Admin správa (publish/unpublish)

### Fáze 2 — Enhancement (SHOULD):

8. RatingBreakdownBar (5★→1★ breakdown)
9. DetailedRatingDisplay (4 detailní hodnocení)
10. Rating na BrokerCard
11. JSON-LD structured data
12. Recalculate triggers

### Fáze 3 — Polish (NICE-TO-HAVE):

13. Automatická verifikace po transakci
14. Email reminder "Ohodnoťte svého makléře"
15. "Nejlépe hodnocení makléři" sekce na homepage
16. Review filtering (nejnovější, nejlepší, nejhorší)

---

## 8. Design specifikace

### Barevný systém:

| Element | Barva | Tailwind |
|---------|-------|----------|
| Hvězdy (filled) | Orange | `text-orange-400` |
| Hvězdy (empty) | Gray | `text-gray-200` |
| Breakdown bar (fill) | Orange | `bg-orange-400` |
| Breakdown bar (bg) | Light gray | `bg-gray-100` |
| Verified badge | Green | `text-green-600 bg-green-50` |
| Recommend indicator | Green | `text-green-600` |
| Avatar circle | Hash-based | `bg-orange-100`, `bg-blue-100`, `bg-green-100`, `bg-purple-100` |
| Transaction badge | Type-based | SALE=green, PURCHASE=blue, CONSULTATION=gray |

### Typografie:

| Element | Styl |
|---------|------|
| Velké rating číslo | `text-4xl font-bold text-gray-900` |
| Review text | `text-sm text-gray-700 leading-relaxed` |
| Author name | `text-sm font-semibold text-gray-900` |
| Meta info (město, datum) | `text-xs text-gray-500` |
| Section heading | `text-lg font-bold text-gray-900` |
| Detail rating label | `text-xs text-gray-500` |

### Responsive:

- **Desktop:** Summary + reviews side by side (grid-cols-3: summary 1col + reviews 2col)
- **Tablet:** Summary full width, reviews 2-col grid
- **Mobile:** Vše stacked, summary compact (číslo + hvězdy inline)

---

## 9. STOP pravidla

- **STOP-1:** NESMÍ mazat ani měnit existující `Review` model — platformové recenze jsou jiná entita. Vytvořit NOVÝ `BrokerReview`.
- **STOP-2:** NESMÍ zobrazovat recenze na profilu, které nejsou `isPublished: true` — admin musí schválit.
- **STOP-3:** Detailní hodnocení (komunikace, rychlost, férovost, profi) jsou VŽDY optional — uživatel může zadat jen celkové hodnocení.
- **STOP-4:** Rate limit na POST reviews: 3 req / 10 min per IP (konzistentní s existujícím Review API).
- **STOP-5:** Verified badge (`isVerified`) se nastavuje POUZE systémově (po dokončení transakce) nebo adminem — NIKDY uživatelem.
- **STOP-6:** Profil owner NESMÍ vidět své vlastní reviews jinak než ostatní návštěvníci. Žádný "delete my review" button.
- **STOP-7:** Agregované metriky (avg, count, recommend%) se přepočítávají JEN při publish/unpublish — ne při vytvoření review.

---

## 10. Acceptance Criteria

### Fáze 1:
- [ ] `BrokerReview` model v Prisma s detailními hodnoceními
- [ ] Profil makléře zobrazuje sekci "Hodnocení od klientů"
- [ ] Souhrnný rating: číslo + hvězdy + count + % doporučení
- [ ] Breakdown bar: 5★ → 1★ s horizontálními progress bary
- [ ] Karta recenze: avatar, jméno, město, datum, rating, text, recommend
- [ ] Formulář: celkový rating + text + jméno + typ transakce + doporučení
- [ ] Admin může publish/unpublish broker reviews
- [ ] Rate limit na POST (3 req / 10 min)
- [ ] `npm run build` projde

### Fáze 2:
- [ ] Detailní hodnocení (4 kategorie) v kartě i formuláři
- [ ] Verified badge na ověřených transakcích
- [ ] Rating zobrazený na BrokerCard (seznam makléřů)
- [ ] JSON-LD AggregateRating na profilu
