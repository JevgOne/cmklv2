# Plan — Task #53: Instagram-style uživatelský profil

**Datum:** 2026-04-15
**Effort:** L (2-3 dny)

---

## 0. EXISTUJÍCÍ STAV (důležité!)

Profily JIŽ EXISTUJÍ, ale fragmentované:
- `/makler/[slug]/page.tsx` — broker profil (avatar, bio, badges, vehicles grid, contact form)
- `/dodavatel/[slug]/page.tsx` — vrakoviště profil (logo, parts grid)
- `/bazar/[slug]/page.tsx` — autobazar profil (logo, vehicles grid)
- `/muj-ucet/` — buyer dashboard (oblíbené, hlídací pes, garáž, poptávky)

User model (řádek 13) JIŽ MÁ: `avatar`, `bio`, `slug`, `specializations`, `cities`, `level`, `totalSales`.
UserAchievement model (řádek 1529) JIŽ EXISTUJE s achievementKey.
Partner model (řádek 1752) má `logo`, `description`, `slug`.

**Tento plán SJEDNOCUJE všechny profily do jednoho IG-style layoutu a přidává lajky, komentáře a gamifikaci.**

---

## 1. PRISMA SCHEMA

### 1a. Rozšíření User modelu

```prisma
// Na User přidat (za bio, řádek ~40):
coverPhoto        String?   // URL cover image (Cloudinary)
favoriteBrands    String?   // JSON array: ["BMW", "Škoda", "VW"]
city              String?   // Hlavní město (přímé pole, ne JSON)
website           String?   // Osobní web
motto             String?   // Krátké motto/tagline (max 120 znaků)
showPhone         Boolean   @default(false) // Zobrazit telefon na profilu
showEmail         Boolean   @default(false) // Zobrazit email na profilu
profileViews      Int       @default(0)     // Počet návštěv profilu
socialLinks       String?   // JSON: { facebook?, instagram?, linkedin? }
yearsExperience   Int?      // Roky zkušeností v oboru
warehouseAddress  String?   // Adresa skladu (PARTS_SUPPLIER only)
```

**POZOR:** User.cities (řádek 39) je JSON array pro makléře. Nové `city` je single string pro zobrazení na profilu. Nemazat `cities`.

### 1b. ProfileLike model (polymorfní)

```prisma
model ProfileLike {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation("UserProfileLikes", fields: [userId], references: [id], onDelete: Cascade)

  // Polymorfní target — PRÁVĚ JEDEN musí být non-null
  vehicleId  String?
  vehicle    Vehicle?  @relation("VehicleLikes", fields: [vehicleId], references: [id], onDelete: Cascade)
  listingId  String?
  listing    Listing?  @relation("ListingLikes", fields: [listingId], references: [id], onDelete: Cascade)
  partId     String?
  part       Part?     @relation("PartLikes", fields: [partId], references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())

  @@unique([userId, vehicleId])
  @@unique([userId, listingId])
  @@unique([userId, partId])
  @@index([vehicleId])
  @@index([listingId])
  @@index([partId])
}
```

### 1c. ProfileComment model (polymorfní)

```prisma
model ProfileComment {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation("UserProfileComments", fields: [userId], references: [id], onDelete: Cascade)

  // Polymorfní target — PRÁVĚ JEDEN musí být non-null
  vehicleId  String?
  vehicle    Vehicle?  @relation("VehicleComments", fields: [vehicleId], references: [id], onDelete: Cascade)
  listingId  String?
  listing    Listing?  @relation("ListingComments", fields: [listingId], references: [id], onDelete: Cascade)
  partId     String?
  part       Part?     @relation("PartComments", fields: [partId], references: [id], onDelete: Cascade)

  text       String    // Max 500 znaků
  isHidden   Boolean   @default(false) // Admin/owner může schovat

  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([vehicleId])
  @@index([listingId])
  @@index([partId])
  @@index([userId])
}
```

### 1d. ProfileBadge model (gamifikace rozšíření)

```prisma
model ProfileBadge {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation("UserBadges", fields: [userId], references: [id], onDelete: Cascade)
  badgeKey    String   // Viz badge katalog níže
  awardedAt   DateTime @default(now())

  @@unique([userId, badgeKey])
  @@index([userId])
}
```

### 1e. Relace na existujících modelech

Na **User** přidat:
```prisma
  profileLikes    ProfileLike[]    @relation("UserProfileLikes")
  profileComments ProfileComment[] @relation("UserProfileComments")
  profileBadges   ProfileBadge[]   @relation("UserBadges")
```

Na **Vehicle** přidat:
```prisma
  likes    ProfileLike[]    @relation("VehicleLikes")
  comments ProfileComment[] @relation("VehicleComments")
```

Na **Listing** přidat:
```prisma
  likes    ProfileLike[]    @relation("ListingLikes")
  comments ProfileComment[] @relation("ListingComments")
```

Na **Part** přidat:
```prisma
  likes    ProfileLike[]    @relation("PartLikes")
  comments ProfileComment[] @relation("PartComments")
```

---

## 2. API ROUTES

### 2a. GET /api/profile/[slug]
**Auth:** public (některá data jen pro přihlášené)
**Soubor:** `app/api/profile/[slug]/route.ts` (NOVÝ)

**Logika:**
1. Hledat `prisma.user.findFirst({ where: { slug, status: "ACTIVE" } })`
2. Podle `role` určit typ profilu, obsah a statistiky
3. Inkrementovat `profileViews` (jen pokud viewer !== owner, debounce 1x/session)
4. Vrátit:

```typescript
{
  user: {
    id, firstName, lastName, avatar, coverPhoto, bio, city, slug, role,
    level, totalSales, profileViews, favoriteBrands, motto, website,
    socialLinks, yearsExperience,
    showPhone ? phone : null, showEmail ? email : null,
    warehouseAddress, // jen pro PARTS_SUPPLIER
    createdAt,
  },
  stats: { ... }, // Role-specific, viz níže
  badges: ProfileBadge[],
  achievements: UserAchievement[],
  rating: { average: number, count: number } | null,
  // Items se načítají lazy přes tabs API (viz 2b)
}
```

### STATISTIKY — VÝHRADNĚ Z REÁLNÝCH DB DAT (žádné hardcoded!)

**KRITICKÉ:** Pokud uživatel nemá data → zobraz "0" nebo "Zatím žádné". NIKDY nevymýšlej čísla.

```typescript
async function getProfileStats(userId: string, role: string) {
  switch (role) {
    case "BROKER":
    case "MANAGER":
      return {
        label: "Makléř",
        soldVehicles: await prisma.vehicle.count({
          where: { brokerId: userId, status: "SOLD" },
        }),
        activeVehicles: await prisma.vehicle.count({
          where: { brokerId: userId, status: "ACTIVE" },
        }),
        // Hodnocení — zatím z SupplierReview (budoucí BrokerReview)
        rating: await getAverageRating(userId),
        totalLikesReceived: await countLikesOnUserContent(userId),
      };

    case "PARTS_SUPPLIER":
    case "PARTNER_VRAKOVISTE":
      return {
        label: "Dodavatel dílů",
        soldParts: await prisma.orderItem.count({
          where: {
            supplierId: userId,
            subOrder: { status: "DELIVERED" },
          },
        }),
        activeParts: await prisma.part.count({
          where: { supplierId: userId, status: "ACTIVE" },
        }),
        rating: await prisma.supplierReview.aggregate({
          where: { supplierId: userId, isPublic: true },
          _avg: { rating: true },
          _count: { rating: true },
        }),
        totalLikesReceived: await countLikesOnUserContent(userId),
      };

    case "VERIFIED_DEALER":
      return {
        label: "Ověřený dealer",
        completedFlips: await prisma.flipOpportunity.count({
          where: { dealerId: userId, status: "COMPLETED" },
        }),
        activeFlips: await prisma.flipOpportunity.count({
          where: {
            dealerId: userId,
            status: { in: ["APPROVED", "FUNDING", "FUNDED", "IN_REPAIR", "FOR_SALE"] },
          },
        }),
        // ROI = AVG((actualSalePrice - purchasePrice - repairCost) / (purchasePrice + repairCost) * 100)
        avgROI: await prisma.$queryRaw`
          SELECT COALESCE(
            AVG(
              ("actualSalePrice" - "purchasePrice" - "repairCost")::float
              / NULLIF("purchasePrice" + "repairCost", 0) * 100
            ), 0
          ) as "avgROI"
          FROM "FlipOpportunity"
          WHERE "dealerId" = ${userId}
            AND status = 'COMPLETED'
            AND "actualSalePrice" IS NOT NULL
        `,
        totalLikesReceived: await countLikesOnUserContent(userId),
      };

    case "INVESTOR":
      return {
        label: "Investor",
        totalInvested: await prisma.investment.aggregate({
          where: { investorId: userId, paymentStatus: "CONFIRMED" },
          _sum: { amount: true },
        }),
        completedDeals: await prisma.investment.count({
          where: {
            investorId: userId,
            opportunity: { status: "COMPLETED" },
          },
        }),
        totalReturn: await prisma.investment.aggregate({
          where: { investorId: userId, paidOutAt: { not: null } },
          _sum: { returnAmount: true },
        }),
      };

    case "ADVERTISER":
      return {
        label: "Inzerent",
        activeListings: await prisma.listing.count({
          where: { userId, status: "ACTIVE" },
        }),
        soldListings: await prisma.listing.count({
          where: { userId, status: "SOLD" },
        }),
        totalViews: await prisma.listing.aggregate({
          where: { userId },
          _sum: { viewCount: true },
        }),
        totalLikesReceived: await countLikesOnUserContent(userId),
      };

    case "BUYER":
    default:
      return {
        label: "Uživatel",
        totalLikesGiven: await prisma.profileLike.count({
          where: { userId },
        }),
        totalComments: await prisma.profileComment.count({
          where: { userId },
        }),
        garageSize: await prisma.customerGarage.count({
          where: { userId },
        }),
      };
  }
}

// Helper: spočítat lajky na obsahu uživatele (ne lajky co dal, ale co dostal)
async function countLikesOnUserContent(userId: string): Promise<number> {
  const [vLikes, lLikes, pLikes] = await Promise.all([
    prisma.profileLike.count({ where: { vehicle: { brokerId: userId } } }),
    prisma.profileLike.count({ where: { listing: { userId } } }),
    prisma.profileLike.count({ where: { part: { supplierId: userId } } }),
  ]);
  return vLikes + lLikes + pLikes;
}

// Helper: průměrné hodnocení (SupplierReview)
async function getAverageRating(userId: string) {
  return prisma.supplierReview.aggregate({
    where: { supplierId: userId, isPublic: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
}
```
```

### 2b. GET /api/profile/[slug]/items?tab=vehicles|listings|parts|liked
**Auth:** public
**Soubor:** `app/api/profile/[slug]/items/route.ts` (NOVÝ)

**Logika — auto-population (KLÍČOVÉ):**
- `tab=vehicles` → `prisma.vehicle.findMany({ where: { brokerId: user.id, status: "ACTIVE" } })`
  Include: images (primary), _count: { likes, comments }
- `tab=listings` → `prisma.listing.findMany({ where: { userId: user.id, status: "ACTIVE" } })`
  Include: images (primary), _count: { likes, comments }
- `tab=parts` → `prisma.part.findMany({ where: { supplierId: user.id, status: "ACTIVE" } })`
  Include: images (primary), _count: { likes, comments }
- `tab=flips` → `prisma.flipOpportunity.findMany({ where: { dealerId: user.id, status: { in: ["FOR_SALE", "SOLD", "COMPLETED"] } } })`
  (VERIFIED_DEALER only — marketplace investiční příležitosti)
- `tab=reviews` → `prisma.supplierReview.findMany({ where: { supplierId: user.id, isPublic: true } })`
  Include: buyer (firstName, lastName, avatar, slug), order
- `tab=liked` → `prisma.profileLike.findMany({ where: { userId: user.id }, include: { vehicle, listing, part } })`

Pagination: `?cursor=xxx&limit=12`

**DŮLEŽITÉ:** Žádná duplicace dat! Profil je VIEW nad existujícími Vehicle/Listing/Part tabulkami. Makléř přidá auto přes PWA → automaticky viditelné na profilu. Vrakoviště přidá díl přes PWA-parts → automaticky na profilu.

### 2c. PUT /api/profile/edit
**Auth:** přihlášený (edituje SVŮJ profil)
**Soubor:** `app/api/profile/edit/route.ts` (NOVÝ)

```typescript
const schema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional().nullable(),
  motto: z.string().max(120).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  coverPhoto: z.string().url().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  website: z.string().url().max(200).optional().nullable(),
  favoriteBrands: z.array(z.string()).max(10).optional(),
  socialLinks: z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  }).optional().nullable(),
  yearsExperience: z.number().int().min(0).max(60).optional().nullable(),
  showPhone: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  // PARTS_SUPPLIER only:
  warehouseAddress: z.string().max(300).optional().nullable(),
});
```

**Slug auto-generation:** Pokud user nemá slug → generovat z `firstName-lastName-cuid(5)`, URL-safe (diacritics removed).

### 2d. POST /api/likes
**Auth:** přihlášený
**Soubor:** `app/api/likes/route.ts` (NOVÝ)
**Body:** `{ vehicleId?: string, listingId?: string, partId?: string }`

Validace: právě 1 z vehicleId/listingId/partId musí být non-null.
Toggle: pokud like existuje → smaž (unlike), jinak vytvoř.

**Response:** `{ liked: boolean, totalLikes: number }`

### 2e. DELETE /api/likes
**Auth:** přihlášený
Alternativa k toggle — explicitní unlike. Body stejný jako POST.

### 2f. POST /api/comments
**Auth:** přihlášený
**Soubor:** `app/api/comments/route.ts` (NOVÝ)
**Body:** `{ vehicleId?: string, listingId?: string, partId?: string, text: string }`

Validace:
- právě 1 target non-null
- text 1-500 znaků
- rate limit: max 10 komentářů / 5 min / user

### 2g. DELETE /api/comments/[id]
**Auth:** přihlášený (owner komentáře NEBO admin NEBO owner profilu)

### 2h. GET /api/comments?vehicleId=xxx (nebo listingId/partId)
**Auth:** public
Pagination: `?cursor=xxx&limit=20`
Include: user (firstName, lastName, avatar, slug)

---

## 3. VEŘEJNÁ STRÁNKA — `/profil/[slug]`

**Soubor:** `app/(web)/profil/[slug]/page.tsx` (NOVÝ)

### Layout (Instagram-inspired):

```
┌──────────────────────────────────────────────────┐
│  COVER PHOTO (300px, gradient fallback)          │
│  ┌──────┐                                        │
│  │AVATAR│  Jméno Příjmení                        │
│  │ 120px│  🏷️ Certifikovaný makléř | Praha       │
│  └──────┘  📊 42 prodejů · ⭐ 4.8 · 🏆 TOP      │
│            Bio text here...                       │
│            🚗 BMW · Škoda · Audi (oblíbené)       │
│            [Kontaktovat] [Sdílet profil]          │
├──────────────────────────────────────────────────┤
│  STATS BAR: Vozidla 8 | Lajky 124 | Prodeje 42  │
├──────────────────────────────────────────────────┤
│  TABS: [Vozidla] [Inzeráty] [Díly] [Oblíbené]   │
│  (tabs se zobrazí jen pokud role odpovídá)       │
├──────────────────────────────────────────────────┤
│  GRID (3-4 sloupce, IG style)                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 🚗  │ │ 🚗  │ │ 🚗  │ │ 🚗  │               │
│  │♥ 12 │ │♥ 8  │ │♥ 3  │ │♥ 15 │               │
│  │💬 2 │ │💬 0 │ │💬 1 │ │💬 4 │               │
│  └─────┘ └─────┘ └─────┘ └─────┘               │
│  [Load more...]                                  │
├──────────────────────────────────────────────────┤
│  BADGES SECTION                                  │
│  🏆 TOP Makléř  🎯 10 Prodejů  📸 Foto Pro     │
│  ⚡ Rychlá reakce  🌟 5-star hodnocení           │
└──────────────────────────────────────────────────┘
```

### Role-based tabs:
| Role | Viditelné tabs |
|------|---------------|
| BROKER | Vozidla, Recenze, Oblíbené |
| ADVERTISER | Inzeráty, Oblíbené |
| PARTS_SUPPLIER / PARTNER_VRAKOVISTE | Díly, Recenze, Oblíbené |
| BUYER | Oblíbené |
| ADMIN | Vše |
| INVESTOR | Investice, Oblíbené |
| VERIFIED_DEALER | Marketplace, Vozidla, Oblíbené |

**Tab "Recenze"** = SupplierReview WHERE supplierId = user.id (existující model).
**Tab "Marketplace"** = FlipOpportunity WHERE dealerId = user.id (completed/active).
**Tab "Investice"** = Investment WHERE investorId = user.id (completed deals).

### Komponenty:
- `ProfileHeader.tsx` — cover + avatar + info + stats
- `ProfileTabs.tsx` — client component, tab switching
- `ProfileGrid.tsx` — infinite scroll grid s lajky/komentáři overlay
- `ProfileItemCard.tsx` — karta v gridu (obrázek + ♥ count + 💬 count)
- `ProfileBadges.tsx` — badge display section
- `LikeButton.tsx` — toggle like (srdce animace, optimistic UI)
- `CommentSection.tsx` — komentáře pod položkou (expandable)
- `ShareProfileButton.tsx` — copy link + native share API

### Strategie pro existující profilové stránky:

**DŮLEŽITÉ:** 3 existující profily musí koexistovat s novým `/profil/[slug]`.

| Stávající route | Typ | Strategie |
|----------------|-----|-----------|
| `/makler/[slug]` | User.slug | Zachovat (SEO). Přidat banner "Zobrazit celý profil →" linkující na `/profil/[slug]` |
| `/dily/vrakoviste/[slug]` | Partner.slug | Zachovat (SEO). Sdílet `ProfileHeader` komponentu. Přidat banner → `/profil/[partnerUser.slug]` |
| `/dodavatel/[slug]` | Partner.slug | Zachovat. Banner → `/profil/[partnerUser.slug]` |
| `/bazar/[slug]` | Partner.slug | Zachovat. Banner → `/profil/[partnerUser.slug]` |

**Slug mapping:** Partner.slug (`vrakoviste-brno`) ≠ User.slug (`jan-novak`).
Vrakoviště/bazar stránky používají Partner.slug → potřeba join přes `Partner.userId → User.slug`.
Na `/profil/[slug]` se hledá VŽDY přes User.slug.

**Nemazat stávající stránky** — SEO ranking by se ztratil. Postupně kanonizovat přes `<link rel="canonical">` na `/profil/[slug]`.

---

## 4. EDITACE PROFILU — `/muj-ucet/profil`

**Soubor:** `app/(web)/muj-ucet/profil/page.tsx` (NOVÝ)

### Přidat do layoutu:
V `app/(web)/muj-ucet/layout.tsx` přidat nav item:
```typescript
{ href: "/muj-ucet/profil", label: "Můj profil" },
```

### Formulář:
```
┌─────────────────────────────────────────┐
│  COVER PHOTO                            │
│  [Nahrát cover] [Odebrat]               │
│                                          │
│  AVATAR                                  │
│  [Nahrát avatar] [Odebrat]              │
│                                          │
│  Jméno:      [__________]               │
│  Příjmení:   [__________]               │
│  Bio:        [__________________]       │
│              [__________________]       │
│  Město:      [__________]               │
│  Obl. značky:[BMW] [Škoda] [+Přidat]    │
│                                          │
│  ☐ Zobrazit telefon na profilu          │
│  ☐ Zobrazit email na profilu            │
│                                          │
│  [Uložit změny]                          │
│                                          │
│  Preview: [Zobrazit veřejný profil →]   │
└─────────────────────────────────────────┘
```

Upload obrázků přes Cloudinary (existující upload flow).

---

## 5. LAJKY + KOMENTÁŘE NA KARTÁCH

### LikeButton.tsx
**Soubor:** `components/web/LikeButton.tsx` (NOVÝ)

```typescript
interface LikeButtonProps {
  vehicleId?: string;
  listingId?: string;
  partId?: string;
  initialLiked?: boolean;
  initialCount?: number;
}
```

- Optimistic UI (okamžitý vizuální feedback)
- Srdce animace (CSS scale + color transition)
- Nepřihlášený → redirect na login s callbackUrl

### Integrace do existujících karet:
- `VehicleCard.tsx` — přidat `<LikeButton vehicleId={car.id} />` + like count
- `ProductCard.tsx` (parts) — přidat `<LikeButton partId={part.id} />` + like count
- Detail stránky (`/nabidka/[slug]`, `/dily/[slug]`) — LikeButton + CommentSection

### CommentSection.tsx
**Soubor:** `components/web/CommentSection.tsx` (NOVÝ)

- Expandable (defaultně schované, "Zobrazit komentáře (3)")
- Avatar + jméno (linked to `/profil/[slug]`) + čas + text
- Textarea pro nový komentář (přihlášený)
- Delete button (owner komentáře / owner položky / admin)

---

## 6. GAMIFIKACE — BADGES & LEVELS

### Badge katalog (ProfileBadge.badgeKey):

| Key | Název | Podmínka | Ikona |
|-----|-------|----------|-------|
| `FIRST_SALE` | První prodej | 1 SOLD vehicle/part | 🎯 |
| `FIVE_SALES` | 5 prodejů | 5 SOLD | ⭐ |
| `TEN_SALES` | 10 prodejů | 10 SOLD | 🏅 |
| `FIFTY_SALES` | 50 prodejů | 50 SOLD | 🏆 |
| `PHOTO_PRO` | Foto profesionál | 10+ fotek na 1 item | 📸 |
| `FAST_RESPONDER` | Rychlá reakce | Průměrný response time < 1h | ⚡ |
| `TOP_RATED` | Nejlépe hodnocený | Průměrné hodnocení ≥ 4.5 (min 5 reviews) | 🌟 |
| `VERIFIED` | Ověřený | Onboarding completed | ✅ |
| `POPULAR` | Populární | 50+ lajků celkem | 🔥 |
| `COMMUNITY` | Aktivní komunita | 20+ komentářů napsáno | 💬 |
| `COLLECTOR` | Sběratel | 10+ vozů v garáži | 🚗 |
| `EARLY_ADOPTER` | Průkopník | Registrace před spuštěním | 🌱 |

### Level system (rozšíření stávajícího User.level):

| Level | Podmínka | Label |
|-------|----------|-------|
| JUNIOR | Default | Nováček |
| BROKER | 5+ prodejů NEBO onboarding done | Makléř |
| SENIOR | 20+ prodejů + 4.0+ rating | Senior |
| TOP | 50+ prodejů + 4.5+ rating | TOP Makléř |

Level check se spouští v CRON job (stávající `/api/cron/` infrastruktura) — ne realtime.

### Badge award trigger:
V `lib/badges.ts` (NOVÝ):

```typescript
export async function checkAndAwardBadges(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profileBadges: true,
      _count: {
        select: {
          profileLikes: true,    // lajky co dostal
          profileComments: true, // komentáře co napsal
        },
      },
    },
  });

  const existingKeys = new Set(user.profileBadges.map(b => b.badgeKey));
  const newBadges: string[] = [];

  // Příklad: POPULAR badge
  const totalLikesReceived = await prisma.profileLike.count({
    where: {
      OR: [
        { vehicle: { brokerId: userId } },
        { listing: { userId } },
        { part: { supplierId: userId } },
      ],
    },
  });
  if (totalLikesReceived >= 50 && !existingKeys.has("POPULAR")) {
    newBadges.push("POPULAR");
  }

  // ... další badge checks ...

  if (newBadges.length > 0) {
    await prisma.profileBadge.createMany({
      data: newBadges.map(key => ({ userId, badgeKey: key })),
    });
    // Notifikace uživateli
    // ...
  }
}
```

Volat po: prodej, nový like, nový komentář, dokončení onboardingu.

---

## 7. AUTO-POPULATION — JAK TO FUNGUJE (VŠECHNY ROLE)

**Žádné kopírování dat.** Profil je query-time view:

```
Makléř přidá auto přes PWA
  → Vehicle se vytvoří v DB (status: DRAFT → ACTIVE po schválení)
  → GET /api/profile/[slug]/items?tab=vehicles
  → Query: Vehicle WHERE brokerId = user.id AND status = ACTIVE
  → Automaticky na profilu! Zero extra práce.
```

Kompletní mapování per role:

| Role | Zdroj dat | Query |
|------|-----------|-------|
| BROKER | PWA makléř → Vehicle | `Vehicle WHERE brokerId = user.id AND status = ACTIVE` |
| ADVERTISER | Web inzerát → Listing | `Listing WHERE userId = user.id AND status = ACTIVE` |
| PARTS_SUPPLIER | PWA-parts → Part | `Part WHERE supplierId = user.id AND status = ACTIVE` |
| VERIFIED_DEALER | Marketplace → FlipOpportunity | `FlipOpportunity WHERE dealerId = user.id AND status IN (FOR_SALE, SOLD, COMPLETED)` |
| INVESTOR | Marketplace → Investment | `Investment WHERE investorId = user.id AND paymentStatus = CONFIRMED` |
| ALL | Lajky → ProfileLike | `ProfileLike WHERE userId = user.id` |
| SUPPLIER roles | Recenze → SupplierReview | `SupplierReview WHERE supplierId = user.id AND isPublic = true` |

**Dealer specifika:** FlipOpportunity.photos (JSON array) se parseuje pro grid karty. Zobrazit: brand+model+year, purchasePrice→estimatedSalePrice, status badge.

---

## 8. SLUG GENEROVÁNÍ

V `lib/profile-slug.ts` (NOVÝ):

```typescript
import { prisma } from "@/lib/prisma";

export async function generateProfileSlug(firstName: string, lastName: string): Promise<string> {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // Check uniqueness
  let slug = base;
  let counter = 1;
  while (await prisma.user.findFirst({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}
```

Generovat automaticky při:
- Registraci (pokud slug je null)
- Prvním přístupu na `/muj-ucet/profil` (pokud slug je null)

---

## 9. POŘADÍ IMPLEMENTACE

1. **Prisma migrace** — User extensions (coverPhoto, motto, website, socialLinks, yearsExperience, warehouseAddress, showPhone, showEmail, profileViews, city, favoriteBrands) + ProfileLike + ProfileComment + ProfileBadge
2. **Slug generování** — `lib/profile-slug.ts` + auto-generate pro existující users bez slug
3. **API routes** — GET /api/profile/[slug] (s role-specific stats), GET items, PUT edit, POST/DELETE likes, POST/DELETE comments
4. **Veřejná stránka** — `/profil/[slug]` s ProfileHeader, ProfileTabs, ProfileGrid (role-adaptive)
5. **LikeButton + CommentSection** — komponenty + integrace na VehicleCard, ProductCard, detail pages
6. **Editace profilu** — `/muj-ucet/profil` + layout nav update + Cloudinary upload
7. **Badge systém** — `lib/badges.ts` + ProfileBadges component + cron trigger
8. **Existující profily update** — banner "Celý profil →" na `/makler/[slug]`, `/dodavatel/[slug]`, `/bazar/[slug]`, `/dily/vrakoviste/[slug]`

---

## 10. STOP THRESHOLDS

- **STOP-1:** Prisma migrace selhává → eskaluj, nepokračuj
- **STOP-2:** Polymorfní like/comment constraint nelze vynutit na DB úrovni (Prisma nemá CHECK constraint) → aplikační validace stačí, pokračuj
- **STOP-3:** Cloudinary upload pro cover/avatar nefunguje → použij stávající upload pattern z Vehicle images, eskaluj jen pokud ten taky nefunguje

---

## 11. COMMIT
```
feat: add Instagram-style profile with likes, comments & badges
```
