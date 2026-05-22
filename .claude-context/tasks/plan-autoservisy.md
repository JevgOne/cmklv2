# Plan: Autoservisy — adresář + recenze servisů

**Task:** #13
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** New Feature (bonusová content/SEO sekce)
**Závažnost:** MEDIUM — content play, ne core business

---

## 1. Cíl a business kontext

Uživatel chce přidat **adresář autoservisů** jako bonusovou sekci platformy:

- **Informace:** Kde je dobrý servis, kde je to špatné, kde lidi okrádají
- **Recenze:** Reálné hodnocení od uživatelů
- **Důvěryhodnost:** Budovat brand CarMakléř jako důvěryhodný zdroj informací
- **SEO:** Lokální vyhledávání ("autoservis Praha recenze") → organický traffic
- **Cross-linking:** Návštěvníci hledající servis → potenciální zákazníci makléřské sítě, inzerce, dílů

**Analogie:** Carmakler = "Google Maps pro autoservisy" s důrazem na české prostředí a čestné hodnocení.

### Pilíře struktury (uživatelský požadavek)

1. **Autorizované servisy** — oficiální značkové servisy (Škoda Auto, BMW, Mercedes), card layout s logem značky
2. **Neoficiální servisy** — nezávislé dílny, garážky, menší servisy, často lepší cena/výkon
3. **Spolupráce s pojišťovnami** — filtr: servisy co spolupracují s pojišťovnami na likvidaci pojistných událostí vs. ty co ne

**Filtrování na seznamu:**
- Typ: `Autorizovaný` / `Neoficiální` / `Všechny`
- Pojišťovny: `Spolupracuje s pojišťovnami` toggle
- + město, kategorie, min. rating (stávající filtry)

---

## 2. Architektura

### URL struktura

```
/autoservisy                        → Seznam servisů + vyhledávání
/autoservisy/[slug]                 → Detail servisu + recenze
/autoservisy/[slug]/recenze         → Formulář pro recenzi (optional, může být inline)
/autoservisy/mesto/[city]           → Servisy v městě (SEO landing: "autoservis Praha")
/autoservisy/kategorie/[category]   → Servisy dle typu (SEO: "karosářské práce Brno")
```

### Proč NOVÝ model (ne rozšíření Partner)

Partner model má těžkou business logiku (Stripe Connect, provize, status pipeline, akvizice). AutoServis je čistě informační/SEO entity s user recenzemi — jiný účel. Smíchání by zkomplikovalo obojí.

---

## 3. Datový model (Prisma Schema)

### Model: AutoServis

```prisma
// ============================================
// AUTOSERVISY — ADRESÁŘ + RECENZE
// ============================================

model AutoServis {
  id              String   @id @default(cuid())
  slug            String   @unique

  // Základní info
  name            String                     // "Auto Kovář s.r.o."
  description     String?  @db.Text          // Popis servisu
  ico             String?                    // IČO (pro ověření)

  // Adresa
  address         String?                    // Ulice + číslo
  city            String                     // Město (povinné — klíč pro SEO)
  region          String?                    // Kraj
  zip             String?                    // PSČ
  latitude        Float?                     // GPS
  longitude       Float?                     // GPS

  // Kontakt
  phone           String?
  email           String?
  web             String?

  // Otevírací doba (JSON)
  openingHours    String?                    // JSON: [{ day: "Po-Pá", hours: "8:00-17:00" }]

  // Kategorie
  categories      String[]                   // ["mechanika", "karosarna", "pneuservis", "elektro", "diagnostika", "STK"]

  // Brand/quality signály
  brands          String[]                   // Značky aut se kterými pracuje: ["Škoda", "VW", "BMW"]
  certifications  String[]                   // Certifikace: ["autorizovaný servis Škoda", "ISO"]
  images          String[]                   // Fotky servisu (Cloudinary URLs)
  logo            String?                    // Logo servisu

  // Agregované hodnocení (denormalizováno pro výkon)
  averageRating   Float    @default(0)       // Průměrné hodnocení (1-5)
  reviewCount     Int      @default(0)       // Počet recenzí
  recommendRate   Float    @default(0)       // % lidí co doporučuje (0-100)

  // PILÍŘE — typ servisu
  tier            String   @default("NEOFICIALNI")  // AUTORIZOVANY | NEOFICIALNI
  // AUTORIZOVANY = značkový, oficiální dealer servis (Škoda Auto, BMW Praha...)
  // NEOFICIALNI = nezávislé dílny, garážky, menší servisy

  // Spolupráce s pojišťovnami
  insurancePartner Boolean @default(false)   // Spolupracuje s pojišťovnami (likvidace pojistných událostí)
  insuranceNames   String[]                  // ["Česká pojišťovna", "Allianz", "Generali"]

  // Flags
  isVerified      Boolean  @default(false)   // Ověřený CarMakléřem (admin schválil)
  isClaimed       Boolean  @default(false)   // Majitel si claimnul profil
  isPublished     Boolean  @default(true)    // Zobrazit na webu
  isFeatured      Boolean  @default(false)   // Zvýrazněný (promo)

  // Claimnutý owner (optional)
  ownerId         String?
  owner           User?    @relation("ServisOwner", fields: [ownerId], references: [id])

  // Přidáno uživatelem (pokud ne admin)
  addedById       String?
  addedBy         User?    @relation("ServisAdder", fields: [addedById], references: [id])
  source          String   @default("USER")  // USER | ADMIN | IMPORT

  // Recenze
  reviews         ServisReview[]

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Indexy pro vyhledávání
  @@index([city])
  @@index([isPublished])
  @@index([averageRating])
  @@index([reviewCount])
  @@index([isFeatured])
  @@index([isVerified])
  @@index([tier])
  @@index([insurancePartner])
}

model ServisReview {
  id              String   @id @default(cuid())
  servisId        String
  servis          AutoServis @relation(fields: [servisId], references: [id], onDelete: Cascade)

  // Autor
  authorName      String                    // Jméno (pro nepřihlášené)
  authorCity      String?                   // Město autora
  authorUserId    String?                   // Pokud přihlášený uživatel
  author          User?    @relation("ServisReviewer", fields: [authorUserId], references: [id])

  // Hodnocení
  rating          Int                       // 1-5
  recommend       Boolean  @default(true)   // "Doporučili byste tento servis?"
  title           String?                   // "Výborná práce, férová cena"
  text            String   @db.Text         // Detailní text recenze

  // Detailní hodnocení (optional)
  ratingQuality   Int?                      // Kvalita práce (1-5)
  ratingPrice     Int?                      // Poměr cena/výkon (1-5)
  ratingSpeed     Int?                      // Rychlost opravy (1-5)
  ratingComm      Int?                      // Komunikace (1-5)

  // Kontext
  serviceType     String?                   // "oprava motoru", "výměna brzd", "STK"
  vehicleBrand    String?                   // "Škoda Octavia" — jaké auto tam měl
  visitDate       DateTime?                 // Kdy tam byl

  // Moderace
  isPublished     Boolean  @default(false)  // Potřebuje schválení
  isVerified      Boolean  @default(false)  // Ověřená návštěva
  reportCount     Int      @default(0)      // Počet nahlášení
  adminNote       String?                   // Poznámka admina

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([servisId])
  @@index([isPublished])
  @@index([rating])
  @@index([authorUserId])
}
```

### Nové relace na User modelu

```prisma
// Přidat do model User:
ownedServisy       AutoServis[]   @relation("ServisOwner")
addedServisy       AutoServis[]   @relation("ServisAdder")
servisReviews      ServisReview[] @relation("ServisReviewer")
```

---

## 4. Veřejné stránky

### 4a. Seznam servisů — `/autoservisy`

**Route:** `app/(web)/autoservisy/page.tsx`

**Layout:**
- Hero: "Najděte ověřený autoservis" + search bar (město / kategorie)
- Filtrování: město, kategorie, min. rating, ověřené
- Grid karet servisů (2 sloupce desktop, 1 mobile)
- Stránkování

**ServisCard komponenta:**
```
┌──────────────────────────────────────┐
│ [logo]  Auto Kovář s.r.o.       ★4.8│
│         Praha 4                      │
│         Mechanika · Karosárna        │
│         23 recenzí · 96% doporučuje  │
│  ┌──────────┐ ┌────────────────────┐ │
│  │AUTORIZOV.│ │🛡️ Pojišťovny: ČP, │ │
│  │Škoda     │ │   Allianz          │ │
│  └──────────┘ └────────────────────┘ │
│         ✓ Ověřený CarMakléřem        │
└──────────────────────────────────────┘
```

**Badge vizuál dle tier:**
- `AUTORIZOVANY` → oranžový badge "Autorizovaný servis {značka}"
- `NEOFICIALNI` → šedý badge "Nezávislý servis" (nebo žádný badge)
- `insurancePartner: true` → zelený badge "Spolupracuje s pojišťovnami" + seznam pojišťoven

**SEO:**
- title: "Autoservisy — ověřené recenze | CarMakléř"
- JSON-LD: `ItemList` s `LocalBusiness` items
- `revalidate: 3600` (ISR 1h)

### 4b. Detail servisu — `/autoservisy/[slug]`

**Route:** `app/(web)/autoservisy/[slug]/page.tsx`

**Layout:**
- Breadcrumbs: Domů > Autoservisy > {město} > {název}
- Header: název, adresa, rating stars, "Ověřený ✓", kontakt buttons
- Informační grid: otevírací doba, kategorie, značky, certifikace
- Mapa (embed nebo statická)
- Sekce recenzí (inline list + "Napsat recenzi" button)
- Cross-linking: "Hledáte auto? Podívejte se na nabídku v {city}"

**SEO:**
- title: "{name} — recenze autoservis {city} | CarMakléř"
- JSON-LD: `AutoRepair` (= `LocalBusiness` subtype) + `AggregateRating` + `Review[]`
- `generateMetadata()` dynamicky z DB

### 4c. Město landing — `/autoservisy/mesto/[city]`

**Route:** `app/(web)/autoservisy/mesto/[city]/page.tsx`

**Účel:** SEO landing pro "autoservis {město}" queries.

**Obsah:**
- H1: "Autoservisy v {město} — recenze a hodnocení"
- Seznam servisů v daném městě
- Stats: "Průměrné hodnocení servisů v {městě}: 4.2★"
- FAQ: "Kolik stojí servis v {městě}?", "Jak poznat dobrý servis?"
- Cross-link na makléře v daném městě

**SEO:**
- Generované dynamicky pro každé město
- `generateStaticParams()` pro top 50 měst
- JSON-LD: `ItemList` + `BreadcrumbList`

### 4d. Kategorie landing — `/autoservisy/kategorie/[category]`

Analogický pattern k město landingům:
- "Karosárny — kde opravit auto po nehodě"
- "Pneuservisy — přezutí a uskladnění pneumatik"
- "Diagnostika — kde diagnostikovat závadu"

**Kategorie:**
```
mechanika        → Mechanické opravy
karosarna        → Karosářské práce
pneuservis       → Pneuservis
elektro          → Autoelektro
diagnostika      → Diagnostika
stk-emise        → STK a emise
klimatizace      → Klimatizace a chlazení
lakovna          → Lakování
tuning           → Tuning a úpravy
```

---

## 5. API routes

```
POST   /api/autoservisy                      → Přidat nový servis (user/admin)
GET    /api/autoservisy?city=&category=       → Seznam (s filtrováním)
GET    /api/autoservisy/[id]                  → Detail
PUT    /api/autoservisy/[id]                  → Upravit (owner/admin)

POST   /api/autoservisy/[id]/reviews          → Přidat recenzi
GET    /api/autoservisy/[id]/reviews?page=    → Seznam recenzí (paginated)
POST   /api/autoservisy/[id]/reviews/[rid]/report  → Nahlásit recenzi

PUT    /api/admin/autoservisy/[id]            → Admin: schválit/upravit servis
PUT    /api/admin/autoservisy/reviews/[id]    → Admin: schválit/odmítnout recenzi
```

**Validace (Zod):**
- Recenze: min. 20 znaků text, rating 1-5, rate limit 1 recenze/servis/IP/den
- Nový servis: min. name + city, slug auto-generated

---

## 6. Admin panel

### Admin stránka: `/admin/autoservisy`

**Funkce:**
- Seznam servisů s filtry (ověřené, neověřené, claimed)
- Schválit/odmítnout nový servis
- Editovat údaje servisu
- Toggle isVerified, isFeatured
- Přehled recenzí ke schválení

**Komponenty:**
- `components/admin/autoservisy/AdminServisyTable.tsx`
- `components/admin/autoservisy/AdminServisyReviews.tsx`

**Admin sidebar:** Přidat odkaz "Autoservisy" do admin navigace.

---

## 7. Sběr dat

### Fáze 1: Manuální + uživatelské
1. **Admin přidá** top servisy ručně (seed data, 20-50 servisů v hlavních městech)
2. **Uživatelé přidávají** servisy přes formulář "Přidat servis" na `/autoservisy`
3. **Uživatelské recenze** s moderací (isPublished: false → admin schválí)

### Fáze 2: Import z veřejných zdrojů (LATER)
- **Firmy.cz API** — Kategorie "autoservisy" (data: název, adresa, telefon)
- **Google Places API** — Rating, review count, otevírací doba
- **ARES (Ministerstvo financí)** — IČO validace, obchodní rejstřík

**POZOR:** NIKDY nestahovat recenze z Googlu nebo jiných platforem. Pouze vlastní recenze od uživatelů. Google rating/count je OK jako referenční údaj.

### Fáze 3: Claim & Verify (LATER)
- Majitel servisu si může "claimnout" profil (verifikace přes IČO nebo telefon)
- Claimnutý profil: majitel edituje údaje, odpovídá na recenze
- Ověřený CarMakléřem: admin fyzicky prověřil servis

---

## 8. SEO strategie

### Klíčová slova (cílový traffic)

| Query | Měsíční objem (CZ) | Obtížnost |
|-------|-------------------|-----------|
| autoservis Praha | 3 600 | Střední |
| autoservis Brno | 1 900 | Střední |
| autoservis recenze | 720 | Nízká |
| autoservis [město] | 200-1000 | Nízká |
| karosárna Praha | 880 | Nízká |
| pneuservis [město] | 500-2000 | Nízká |

### JSON-LD Structured Data

**Seznam:** `ItemList` + `ListItem` (AutoRepair)
**Detail:** `AutoRepair` (subtype of LocalBusiness) + `AggregateRating` + `Review[]`

Existující helper: `generateLocalBusinessJsonLd()` v `lib/seo.ts` — rozšířit o `AutoRepair` type.

### Meta tagy

**Seznam:** "Autoservisy v {městě} — {count} ověřených servisů s recenzemi | CarMakléř"
**Detail:** "{name} — autoservis {city} | {rating}★ z {count} recenzí | CarMakléř"

### Internal linking

- Homepage → "Najděte ověřený servis" card
- Nabídka/[slug] → "Potřebujete servis? Najděte ověřený autoservis v {city}"
- Makleri/[slug] → "Doporučené servisy v regionu"
- Blog → Články "Jak poznat poctivý servis" → /autoservisy

---

## 9. Napojení na existující ekosystém

### Cross-linking z autoservisů
- Detail servisu → "Hledáte auto? Podívejte se na nabídku v {city}" → /nabidka
- Detail servisu → "Potřebujete díly? Najděte na CarMakléř" → /dily
- Detail servisu → "Prodáváte auto? Náš makléř v {city} vám pomůže" → /makleri

### Cross-linking NA autoservisy
- Nabídka vozidel → "Nejbližší ověřený servis" widget
- Profil makléře → "Doporučené servisy" sekce
- Kontaktní stránka → "Hledáte servis?" odkaz
- Footer → "Autoservisy" v navigaci

### Budoucí propojení
- Makléř doporučuje servisy → "Doporučení od makléřů" badge na servisu
- After-sale email → "Gratulujeme k novému autu! Zde jsou ověřené servisy ve vašem městě"
- PWA → Makléř vidí servisy v okolí → může doporučit zákazníkovi

---

## 10. Soubory k vytvoření

### Prisma Schema
| Soubor | Typ |
|--------|-----|
| `prisma/schema.prisma` | EDIT — přidat AutoServis + ServisReview + User relace |
| `prisma/migrations/` | NEW — migrace |

### Veřejné stránky
| Soubor | Popis |
|--------|-------|
| `app/(web)/autoservisy/page.tsx` | Seznam servisů |
| `app/(web)/autoservisy/layout.tsx` | Layout |
| `app/(web)/autoservisy/loading.tsx` | Loading skeleton |
| `app/(web)/autoservisy/[slug]/page.tsx` | Detail servisu |
| `app/(web)/autoservisy/[slug]/loading.tsx` | Loading |
| `app/(web)/autoservisy/[slug]/not-found.tsx` | 404 |
| `app/(web)/autoservisy/mesto/[city]/page.tsx` | Město landing |
| `app/(web)/autoservisy/kategorie/[category]/page.tsx` | Kategorie landing |
| `app/(web)/autoservisy/opengraph-image.tsx` | OG obrázek |

### Komponenty
| Soubor | Popis |
|--------|-------|
| `components/web/ServisCard.tsx` | Karta servisu (pro grid) |
| `components/web/ServisReviewForm.tsx` | Formulář recenze |
| `components/web/ServisReviewList.tsx` | Seznam recenzí s filtrováním |
| `components/web/ServisSearchBar.tsx` | Vyhledávání (město + kategorie) |
| `components/web/ServisDetailHeader.tsx` | Header detailu servisu |
| `components/web/ServisCategories.tsx` | Kategorie pills |

### API routes
| Soubor | Popis |
|--------|-------|
| `app/api/autoservisy/route.ts` | GET (seznam) + POST (přidat) |
| `app/api/autoservisy/[id]/route.ts` | GET (detail) + PUT (edit) |
| `app/api/autoservisy/[id]/reviews/route.ts` | GET + POST recenze |
| `app/api/admin/autoservisy/route.ts` | Admin CRUD |
| `app/api/admin/autoservisy/reviews/[id]/route.ts` | Admin moderace recenzí |

### Admin
| Soubor | Popis |
|--------|-------|
| `app/(admin)/admin/autoservisy/page.tsx` | Admin seznam |
| `components/admin/autoservisy/AdminServisyTable.tsx` | Tabulka |

### SEO
| Soubor | Popis |
|--------|-------|
| `lib/seo.ts` | EDIT — přidat `generateAutoRepairJsonLd()` |

---

## 11. Implementační fáze

### Fáze 1: MVP (první iterace)

**Rozsah:** Základní adresář + recenze. Admin přidává servisy ručně.

1. Prisma schema (AutoServis + ServisReview)
2. Migrace
3. Seed data (20-50 servisů z hlavních měst)
4. `/autoservisy` — seznam s vyhledáváním
5. `/autoservisy/[slug]` — detail + inline recenze
6. API routes (CRUD + recenze)
7. Admin stránka
8. OG obrázek
9. Cross-linking (footer + homepage)

**Odhad:** ~25 souborů, ~2000 řádků

### Fáze 2: SEO landings (po MVP)

10. `/autoservisy/mesto/[city]` — město landings
11. `/autoservisy/kategorie/[category]` — kategorie landings
12. JSON-LD structured data
13. Sitemap rozšíření
14. FAQ sekce

### Fáze 3: Growth (pozdější)

15. "Přidat servis" formulář pro uživatele
16. Claim profilu (majitel servisu)
17. Import z Firmy.cz / ARES
18. Google Places rating sync
19. Makléř doporučení
20. PWA integrace

---

## 12. STOP pravidla

- **STOP-1:** Autoservisy jsou INFORMAČNÍ sekce, ne transakční. Žádné platby, provize, ani objednávky. Čistě content + SEO.
- **STOP-2:** NIKDY nestahovat recenze z Googlu, Firmy.cz, nebo jiných platforem. Pouze VLASTNÍ recenze od uživatelů. Google rating/count je OK jako referenční info.
- **STOP-3:** Recenze VŽDY vyžadují admin schválení (isPublished: false). Bez moderace hrozí spam/falešné recenze.
- **STOP-4:** Slug generovat z `name + city` (ne jen name — "Auto Kovář" existuje v každém městě). Pattern: `auto-kovar-praha-4`.
- **STOP-5:** Neblokovat MVP na SEO landings — města/kategorie landing pages mohou přijít v Fázi 2.
- **STOP-6:** Nepřidávat Claim profilu v MVP — to je komplexní flow (verifikace, email, admin approval). Nechat na Fázi 3.

---

## 13. Acceptance Criteria (MVP / Fáze 1)

- [ ] AutoServis a ServisReview modely v Prisma schema
- [ ] Úspěšná migrace (`npx prisma migrate dev`)
- [ ] Stránka `/autoservisy` zobrazuje seznam servisů
- [ ] Filtrování podle města a kategorie
- [ ] Detail `/autoservisy/[slug]` zobrazuje info + recenze
- [ ] Formulář pro novou recenzi funguje (POST → DB s isPublished: false)
- [ ] Admin stránka `/admin/autoservisy` — CRUD servisů
- [ ] Admin může schválit/odmítnout recenzi
- [ ] OG obrázek pro `/autoservisy`
- [ ] Cross-link ve footeru
- [ ] JSON-LD `AutoRepair` na detail stránce
- [ ] `npm run build` projde bez chyb
- [ ] České diakritiky v slugech fungují správně
