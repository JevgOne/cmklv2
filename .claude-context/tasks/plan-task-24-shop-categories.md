# Plán — Task #24: Eshop hierarchické kategorie (Autokelly-style)

**Autor:** planovac (agent team)
**Datum:** 2026-04-06 (update 2026-04-06 po team-lead feedbacku)
**Task ID:** #24
**Status:** Naplánováno — připraveno k implementaci
**Priorita:** HIGH

## 📝 UPDATE 2026-04-06 — team-lead feedback

Team-lead požádal o 3 změny proti původnímu plánu:
1. **Rename `Part.categoryId` → `Part.partCategoryId`** — explicitnější název, vyhne se collision s jinými foreign keys
2. **Route structure: catch-all `[...slug]`** místo dvou-level `[slug]/[subslug]` — škálovatelnější pro neomezenou hloubku
3. **Přidat `partsCount` column do `PartCategory`** — přestože jsem rejecxtoval pro race conditions

Kompletní přepis dotčených sekcí viz **sekce 14 na konci dokumentu**.

---

## 1. Cíl

Nahradit současnou plochou strukturu 12 kategorií (`ENGINE, TRANSMISSION, BRAKES, ...`) v eshopu dílů **hierarchickou strukturou** ve stylu autokelly.cz / automobilovedily24.cz:

- **29 hlavních kategorií** (Motor, Brzdy, Podvozek, Výfuk, Filtry, Karoserie, ...)
- **~150 podkategorií** (Brzdové destičky, Brzdové kotouče, Brzdové hadice, Olejový filtr, Vzduchový filtr, Píst, Pístní kroužky, ...)
- Hierarchický strom (`parent` → `children`) s neomezenou hloubkou (prakticky 2 úrovně stačí pro MVP)
- **Mega menu** v shop navbaru — vizuální přehled skupin + hlavních podkategorií
- **Sidebar tree** na stránce katalog/kategorie — strom s expandovatelnými uzly + count per category
- **Breadcrumb** — `Shop > Brzdy > Brzdové destičky`
- **Kategoriální filtr** v katalog search bar
- **SEO-friendly URL**: `/shop/kategorie/brzdy/brzdove-desticky` místo `?category=BRAKES`

**Uživatelská citace:** "v tom shop si myslim že by to melo mít více kategorii a trošku lepe rozložené, třeba autokelly to ma dobře"

---

## 2. Discovery — současný stav

### 2.1 Prisma schema — `Part.category` je jen `String`

`prisma/schema.prisma` line 886-951:
```prisma
model Part {
  id         String @id @default(cuid())
  slug       String @unique
  supplierId String
  supplier   User   @relation(...)
  category    String // ENGINE, TRANSMISSION, BRAKES, SUSPENSION, BODY, ELECTRICAL, INTERIOR, WHEELS, EXHAUST, COOLING, FUEL, OTHER
  name        String
  // ... další pole
  @@index([category])
}
```

**Žádný `PartCategory` model neexistuje.** `category` je plain string column s 12 known values.

### 2.2 Existující zdroje kategorií

| Soubor | Co obsahuje | Použití |
|--------|-------------|---------|
| `lib/parts-categories.ts` | `PART_CATEGORIES` array s 12 hodnot `{value, label}` | Shop homepage grid, admin form select |
| `lib/validators/parts.ts` | Zod enum `partCategories` s 12 hodnot | API validation, create/update part |
| `lib/seo-data.ts` line 1211-1223 | `PARTS_CATEGORIES` s 11 SEO landing pages (slug, name, description, faqItems) | `/dily/kategorie/[slug]` route |
| `app/(web)/shop/page.tsx` line 48-61 + 138 | `categoryIcons` map + flat grid 4×3 | Shop homepage |
| `app/(web)/shop/katalog/page.tsx` line 39-47 | Tabs s 6 nejpoužívanějšími kategoriemi | Catalog filter |
| `app/(web)/dily/kategorie/[slug]/page.tsx` | Per-category SEO page generovaná z `PARTS_CATEGORIES` | SEO landing |

### 2.3 Dvě paralelní routy — `/shop/*` vs `/dily/*`

Během předchozích tasků vznikly dvě paralelní eshop routy:
- `/shop/*` — novější/aktivní (`page.tsx`, `katalog`, `kosik`, `objednavka`, `produkt`, `moje-objednavky`)
- `/dily/*` — starší s dedikovanými SEO landing pages (`kategorie/[slug]`, `znacka/[slug]`)

**Plán se primárně týká `/shop/*`** jako hlavního eshopu. `/dily/*` SEO stránky zůstávají beze změny (jsou to SEO optimized content pages, ne interaktivní catalog). Můžeme je později migrovat na novou hierarchii samostatně.

### 2.4 Autokelly.cz discovery

Zkusil jsem:
- `WebFetch https://autokelly.cz` — kategorie se načítají dynamicky JS-em, WebFetch vidí jen skeleton (`Hledám, prosím čekejte...`)
- `WebFetch https://autokelly.cz/shop/katalog` — 404
- `WebFetch https://autokelly.cz/page/graficky-katalog-info` — jen 3 navigační linky (KATALOG, PRO DÍLNU, MOJE GARÁŽ)

**Místo toho: `automobilovedily24.cz/nahradni-dily`** — podobný rozsah, statický HTML, kompletní hierarchie viditelná. Reference pro seed data (sekce 5).

---

## 3. Návrh datového modelu

### 3.1 Nový Prisma model: `PartCategory`

```prisma
model PartCategory {
  id          String   @id @default(cuid())

  // Identifikace
  slug        String   @unique    // "brzdy", "brzdove-desticky"
  name        String              // "Brzdy", "Brzdové destičky"

  // Hierarchie (self-relation)
  parentId    String?
  parent      PartCategory?   @relation("PartCategoryTree", fields: [parentId], references: [id])
  children    PartCategory[]  @relation("PartCategoryTree")

  // Prezentace
  icon        String?             // emoji fallback: "🛑", nebo svg/class name
  imageUrl    String?             // volitelný ilustrační obrázek pro mega menu
  description String?             // krátký popis pro category page

  // SEO
  metaTitle       String?
  metaDescription String?

  // Řazení
  sortOrder   Int      @default(0)  // 0 = na začátku; v rámci parenta

  // Vypočítané — aktualizováno jobem nebo triggerem (NE store na write path)
  // Místo toho: spočítané on-the-fly přes `COUNT(*)` nebo materialized view
  // (pozdější optimalizace, ne v MVP)

  // Relace na Parts
  parts       Part[]

  // Status
  isActive    Boolean  @default(true)

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([parentId])
  @@index([slug])
  @@index([sortOrder])
}
```

**Klíčová rozhodnutí:**
- **Self-relation `parent`/`children`** — standardní Prisma pattern pro trees (stejně jako `User.referrer` nebo jiné self-relations v projektu)
- **Slug místo UUID v URL** — SEO-friendly; unique constraint bezpečí
- **`parentId` nullable** — `null` = top-level category (= jeden z 29 hlavních)
- **`sortOrder` per parent** — umožňuje ruční řazení uvnitř skupiny
- **NE ukládat `partsCount`** jako column — race conditions při paralelních insertech a update pipelinu. Místo toho spočítat dynamicky (`_count: { parts: true }` v Prisma include) — Postgres na indexu je rychlý. Pokud později bude hot path, materialized view.
- **`metaTitle`, `metaDescription`** — do DB místo hardcode v seo-data.ts — umožňuje editaci bez redeploye

### 3.2 Rozšíření `Part` modelu

```prisma
model Part {
  // ... existující fieldy ...

  // STÁVAJÍCÍ (NEMAZAT — backward compat během migrace):
  category    String   // ENGINE, TRANSMISSION, ...

  // NOVÉ:
  categoryId  String?
  partCategory PartCategory? @relation(fields: [categoryId], references: [id])

  // ... zbytek ...
  @@index([categoryId])
  // @@index([category]) — KEEP, nemazat
}
```

**Rozhodnutí: backward compatibility**
- Ponechat `category String` field (starý enum)
- Přidat `categoryId String?` nullable pointing na nový model
- Migrace (viz sekce 7) naplní `categoryId` pro existující parts — mapuje `category` string na `PartCategory.slug`:
  - `ENGINE` → category slug `motor`
  - `BRAKES` → category slug `brzdy`
  - atd. (12 mapování)
- Nový write path (admin/supplier form) ukládá **oboje** — `category` (string pro kompat.) + `categoryId` (nový pointer)
- Read path: preferuje `categoryId` + fallback na `category` pokud `partCategory` je `null`
- Po úplné migraci (všechny parts mají `categoryId`) lze v následném tasku dropnout `category String` column

**Alternativa: bez backward compat** (čistší, ale rizikovější)
- Ostře přepnout `Part.category` na `categoryId` bez transition period
- Riziko: data loss pokud migrace selže, nutnost downtime
- **NEDOPORUČUJI pro MVP** — bezpečnější je dual-write pattern

---

## 4. Dotčené soubory

### 4.1 Backend/schema
| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 1 | `prisma/schema.prisma` | **Edit** | Přidat model `PartCategory` + rozšíření `Part` (`categoryId`, relation, index) |
| 2 | `prisma/migrations/<timestamp>_part_categories_tree/migration.sql` | **Auto-generate** | `npx prisma migrate dev --name part_categories_tree` |
| 3 | `prisma/seed-part-categories.ts` | **Create** | Seed 29 hlavních + ~150 sub kategorií + backfill `Part.categoryId` |
| 4 | `prisma/seed.ts` | **Edit** | Přidat volání `seedPartCategories()` do hlavního seedu |

### 4.2 Kategoriální data (source of truth)
| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 5 | `lib/parts-category-tree.ts` | **Create** | Const `PART_CATEGORY_TREE` — hierarchický tree s cca 180 uzly (source pro seed + mega menu) |
| 6 | `lib/parts-categories.ts` | **Edit** | Zachovat `PART_CATEGORIES` jako legacy map (12 enum values). Přidat `getCategoryBySlug()`, `getCategoryBreadcrumb()`, `getRootCategories()` — wrappers nad DB dotazem |
| 7 | `lib/validators/parts.ts` | **Edit** | Upravit `createPartSchema.category` — nepoužívat hardcoded enum, místo toho `categoryId: z.string().cuid()` + validace existence v DB (nebo runtime check v API route) |
| 8 | `types/parts.ts` (pokud existuje) | **Edit** | Přidat `PartCategoryWithChildren` type pro strom |

### 4.3 API routes
| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 9 | `app/api/parts-categories/route.ts` | **Create** | `GET` — vrátí celý tree (cached, revalidate = 3600). Pro mega menu + sidebar |
| 10 | `app/api/parts-categories/[slug]/route.ts` | **Create** | `GET` — detail jedné kategorie + breadcrumb + children + parts count |
| 11 | `app/api/parts/route.ts` (pokud existuje) | **Edit** | Filter by `categoryId` místo/vedle `category` string |

### 4.4 Web — navbar + mega menu
| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 12 | `components/shop/Navbar.tsx` | **Edit** | Nahradit link "Katalog dílů" za dropdown "Kategorie" s mega menu |
| 13 | `components/shop/CategoryMegaMenu.tsx` | **Create** | Mega menu — 3-4 sloupce, grouped main categories, hover na hlavní → ukáže subs |

### 4.5 Web — shop homepage
| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 14 | `app/(web)/shop/page.tsx` | **Edit** | Nahradit flat grid (line 138-158) novou komponentou `<CategoryTopGrid>` s 29 hlavními kategoriemi |
| 15 | `components/shop/CategoryTopGrid.tsx` | **Create** | Grid 4 sloupce × 8 řádků = 32 slotů (29 kategorií + 3 na "všechny kategorie", "doporučené", "novinky"). Každá karta: ikona + název + počet dílů |

### 4.6 Web — category pages
| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 16 | `app/(web)/shop/kategorie/[slug]/page.tsx` | **Create** | Stránka hlavní kategorie — breadcrumb, seznam subkategorií, náhledy produktů |
| 17 | `app/(web)/shop/kategorie/[slug]/[subslug]/page.tsx` | **Create** | Stránka podkategorie — breadcrumb, filter, grid produktů |
| 18 | `app/(web)/shop/kategorie/[slug]/loading.tsx` | **Create** | Skeleton loader |
| 19 | `app/(web)/shop/kategorie/[slug]/[subslug]/loading.tsx` | **Create** | Skeleton loader |
| 20 | `components/shop/CategorySidebar.tsx` | **Create** | Sidebar tree — expandovatelný strom všech kategorií, zvýraznění aktivního uzlu, per-node count |
| 21 | `components/shop/CategoryBreadcrumb.tsx` | **Create** | `Shop > Brzdy > Brzdové destičky` — skládá breadcrumb z `parentId` chainu |
| 22 | `components/shop/CategoryCard.tsx` | **Create** | Karta kategorie pro grid view (ikona, název, description, partsCount) |

### 4.7 Web — katalog update
| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 23 | `app/(web)/shop/katalog/page.tsx` | **Edit** | Nahradit `tabs` array s 6 hardcoded hodnotami za sidebar CategorySidebar. Filter `?category=X` → `?categoryId=X` (backward compat query param redirect) |

### 4.8 Admin — form pro vytvoření dílu
| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 24 | Components pro add/edit part form (je v `app/(pwa-parts)` nebo admin) | **Edit** | Nahradit flat category select za hierarchický select (první select = hlavní kategorie, druhý select = podkategorie — dependent dropdown) |

**Implementátor**: Najít form před implementací:
```bash
grep -r "category.*select\|Select.*category" --include="*.tsx" -l | head
```

### 4.9 NEDOTÝKAT (out of scope)
| Soubor | Proč |
|--------|------|
| `app/(web)/dily/*` | Legacy routes se SEO landing pages. Nechat beze změny, migrace samostatným taskem. |
| `lib/seo-data.ts` `PARTS_CATEGORIES` | Legacy SEO data pro `/dily/kategorie/[slug]`. Nechat pro zachování SEO URLs. |
| Existující `Part.category` string column | Zůstává pro backward compat |

---

## 5. Kategoriální strom — seed data

**Zdroj**: Inspirováno `automobilovedily24.cz/nahradni-dily` (29 main + ~150 sub) + doplněno o kategorie typické pro autobazary (tuning, Chiptuning, autokosmetika).

### 5.1 Struktura konstanty `PART_CATEGORY_TREE`

`lib/parts-category-tree.ts`:
```typescript
export interface CategoryNode {
  slug: string;
  name: string;
  icon?: string;         // emoji nebo SVG ref
  description?: string;
  children?: CategoryNode[];
}

export const PART_CATEGORY_TREE: CategoryNode[] = [
  {
    slug: "motor",
    name: "Motor",
    icon: "⚙️",
    description: "Bloky motoru, hlavy válců, písty, vačkové hřídele a další motorové díly",
    children: [
      { slug: "blok-motoru", name: "Blok motoru" },
      { slug: "hlava-motoru", name: "Hlava motoru" },
      { slug: "klikovy-hridel", name: "Klikový hřídel" },
      { slug: "olejova-vana", name: "Olejová vana" },
      { slug: "olejove-cerpadlo", name: "Olejové čerpadlo" },
      { slug: "pist", name: "Píst" },
      { slug: "pistni-krouzky", name: "Pístní kroužky" },
      { slug: "sada-tesneni-hlavy-valcu", name: "Sada těsnění hlavy válců" },
      { slug: "vackovy-hridel", name: "Vačkový hřídel" },
      { slug: "viko-hlavy-valcu", name: "Víko hlavy válců" },
    ],
  },
  {
    slug: "brzdy",
    name: "Brzdy",
    icon: "🛑",
    description: "Brzdové kotouče, destičky, třmeny, hadice a kompletní brzdové systémy",
    children: [
      { slug: "brzdove-desticky", name: "Brzdové destičky" },
      { slug: "brzdove-kotouce", name: "Brzdové kotouče" },
      { slug: "brzdove-celisti", name: "Brzdové čelisti" },
      { slug: "brzdove-hadice", name: "Brzdové hadice" },
      { slug: "brzdovy-treman", name: "Brzdový třmen" },
      { slug: "brzdovy-buben", name: "Brzdový buben" },
      { slug: "hlavni-brzdovy-valec", name: "Hlavní brzdový válec" },
      { slug: "abs-krouzek", name: "ABS kroužek" },
      { slug: "cidlo-abs", name: "Čidlo ABS" },
      { slug: "brzdova-kapalina", name: "Brzdová kapalina" },
      { slug: "lanko-rucni-brzdy", name: "Lanko ruční brzdy" },
      { slug: "parkovaci-brzdove-celisti", name: "Parkovací brzdové čelisti" },
    ],
  },
  {
    slug: "filtry",
    name: "Filtry",
    icon: "🔲",
    description: "Filtry — olejový, vzduchový, kabinový, palivový",
    children: [
      { slug: "olejovy-filtr", name: "Olejový filtr" },
      { slug: "vzduchovy-filtr", name: "Vzduchový filtr" },
      { slug: "kabinovy-filtr", name: "Kabinový filtr" },
      { slug: "palivovy-filtr", name: "Palivový filtr" },
    ],
  },
  {
    slug: "vyfuk",
    name: "Výfuk",
    icon: "💨",
    description: "Výfukové systémy, katalyzátory, DPF, lambda sondy, turbodmychadla",
    children: [
      { slug: "katalyzator", name: "Katalyzátor" },
      { slug: "filtr-pevnych-castic-dpf", name: "Filtr pevných částic (DPF)" },
      { slug: "lambda-sonda", name: "Lambda sonda" },
      { slug: "turbodmychadlo", name: "Turbodmychadlo" },
      { slug: "agr-ventil", name: "AGR ventil" },
      { slug: "vyfukove-potrubi", name: "Výfukové potrubí" },
      { slug: "zadni-tlumic-vyfuku", name: "Zadní tlumič výfuku" },
    ],
  },
  {
    slug: "podvozek",
    name: "Podvozek",
    icon: "🔩",
    description: "Tlumiče, pružiny, uložení tlumičů, ramena, čepy",
    children: [
      { slug: "tlumice", name: "Tlumiče" },
      { slug: "pruziny", name: "Pružiny" },
      { slug: "sada-pruzin-a-tlumicu", name: "Sada pružin a tlumičů" },
      { slug: "ulozeni-tlumicu", name: "Uložení tlumičů" },
      { slug: "rameno-zaveseni-kol", name: "Rameno zavěšení kol" },
      { slug: "kulovy-cep-ramene", name: "Kulový čep ramene" },
      { slug: "silentblok-stabilizatoru", name: "Silentblok stabilizátoru" },
      { slug: "stabilizator", name: "Stabilizátor" },
      { slug: "tycka-stabilizatoru", name: "Tyčka stabilizátoru" },
      { slug: "lozisko-kola", name: "Ložisko kola" },
      { slug: "naboj-kola", name: "Náboj kola" },
    ],
  },
  {
    slug: "karoserie",
    name: "Karoserie",
    icon: "🚗",
    description: "Nárazníky, blatníky, kapoty, dveře, zpětná zrcátka, světlomety",
    children: [
      { slug: "naraznik", name: "Nárazník" },
      { slug: "blatnik", name: "Blatník" },
      { slug: "kapota", name: "Kapota" },
      { slug: "hlavni-svetlomet", name: "Hlavní světlomet" },
      { slug: "zadni-svetla", name: "Zadní světla" },
      { slug: "mlhovky", name: "Mlhovky" },
      { slug: "blinkr", name: "Blinkr" },
      { slug: "vnejsi-zpetne-zrcatko", name: "Vnější zpětné zrcátko" },
      { slug: "sklo-zpetneho-zrcatka", name: "Sklo zpětného zrcátka" },
      { slug: "celni-sklo", name: "Čelní sklo" },
      { slug: "bocni-sklo", name: "Boční sklo" },
      { slug: "zadni-skla", name: "Zadní skla" },
      { slug: "plastove-nadkoli", name: "Plastové nadkolí" },
    ],
  },
  {
    slug: "elektricky-system",
    name: "Elektrický systém",
    icon: "💡",
    description: "Alternátory, startéry, baterie, pojistky, regulátory",
    children: [
      { slug: "alternator", name: "Alternátor" },
      { slug: "regulator-alternatoru", name: "Regulátor alternátoru" },
      { slug: "starter", name: "Startér" },
      { slug: "autobaterie", name: "Autobaterie" },
      { slug: "pojistka", name: "Pojistka" },
    ],
  },
  {
    slug: "zapalovani",
    name: "Zapalování a žhavení",
    icon: "⚡",
    description: "Zapalovací svíčky, cívky, kabely, žhavící svíčky",
    children: [
      { slug: "zapalovaci-svicky", name: "Zapalovací svíčky" },
      { slug: "zapalovaci-civka", name: "Zapalovací cívka" },
      { slug: "zapalovaci-kabely", name: "Zapalovací kabely" },
      { slug: "zhavici-svicky", name: "Žhavící svíčky" },
    ],
  },
  {
    slug: "chlazeni-motoru",
    name: "Chlazení motoru",
    icon: "❄️",
    description: "Chladiče, vodní čerpadla, termostaty, ventilátory chlazení",
    children: [
      { slug: "chladic-vody", name: "Chladič vody" },
      { slug: "vodni-cerpadlo", name: "Vodní čerpadlo" },
      { slug: "termostat", name: "Termostat" },
      { slug: "ventilator-chlazeni-motoru", name: "Ventilátor chlazení motoru" },
      { slug: "chladici-kapalina", name: "Chladící kapalina" },
      { slug: "vicko-chladice", name: "Víčko chladiče" },
    ],
  },
  {
    slug: "klimatizace",
    name: "Klimatizace",
    icon: "🌡️",
    description: "Kompresory, chladiče, výparníky, vysoušeče klimatizace",
    children: [
      { slug: "kompresor-klimatizace", name: "Kompresor klimatizace" },
      { slug: "chladic-klimatizace", name: "Chladič klimatizace" },
      { slug: "vyparnik-klimatizace", name: "Výparník klimatizace" },
      { slug: "vysousec-klimatizace", name: "Vysoušeč klimatizace" },
    ],
  },
  {
    slug: "topeni-ventilace",
    name: "Topení a ventilace",
    icon: "🔥",
    description: "Radiátory topení, vnitřní ventilátory, ventily topení",
    children: [
      { slug: "radiator-topeni", name: "Radiátor topení" },
      { slug: "vnitrni-ventilator", name: "Vnitřní ventilátor" },
      { slug: "ventil-topeni", name: "Ventil topení" },
    ],
  },
  {
    slug: "palivovy-system",
    name: "Palivový systém",
    icon: "⛽",
    description: "Palivové nádrže, čerpadla, vstřikovače, regulátory tlaku",
    children: [
      { slug: "palivova-nadrz", name: "Palivová nádrž" },
      { slug: "palivove-cerpadlo", name: "Palivové čerpadlo" },
      { slug: "vstrikovaci-trysky", name: "Vstřikovací trysky" },
      { slug: "vysokotlake-cerpadlo", name: "Vysokotlaké čerpadlo" },
      { slug: "regulator-tlaku-paliva", name: "Regulátor tlaku paliva" },
    ],
  },
  {
    slug: "prevodovka",
    name: "Převodovka",
    icon: "🔧",
    description: "Převodové oleje, filtry, těsnění automatické i manuální převodovky",
    children: [
      { slug: "filtr-automaticke-prevodovky", name: "Filtr automatické převodovky" },
      { slug: "olej-do-automaticke-prevodovky", name: "Olej do automatické převodovky" },
      { slug: "prevodovy-olej", name: "Převodový olej" },
      { slug: "tesneni-prevodovky", name: "Těsnění převodovky" },
    ],
  },
  {
    slug: "spojka",
    name: "Spojka",
    icon: "⚙️",
    description: "Spojkové sady, setrvačníky, válce spojky",
    children: [
      { slug: "spojkova-sada", name: "Spojková sada" },
      { slug: "setrvacnik", name: "Setrvačník" },
      { slug: "spojkovy-valec", name: "Spojkový válec" },
      { slug: "pomocny-valec", name: "Pomocný válec" },
    ],
  },
  {
    slug: "rizeni",
    name: "Řízení",
    icon: "🎯",
    description: "Servořízení, kulové čepy, táhla, spojovací tyče",
    children: [
      { slug: "cerpadlo-servorizeni", name: "Čerpadlo servořízení" },
      { slug: "prevodovka-rizeni", name: "Převodovka řízení" },
      { slug: "axialni-tahlo-rizeni", name: "Axiální táhlo řízení" },
      { slug: "kulovy-cep-rizeni", name: "Kulový čep řízení" },
      { slug: "spojovaci-tyc-rizeni", name: "Spojovací tyč řízení" },
    ],
  },
  {
    slug: "pohon-kol",
    name: "Pohon kol",
    icon: "🚙",
    description: "Homokinetické klouby, poloosy, kloubové hřídele",
    children: [
      { slug: "homokineticky-kloub", name: "Homokinetický kloub" },
      { slug: "poloos", name: "Poloosa" },
      { slug: "kloubovy-hridel", name: "Kloubový hřídel" },
    ],
  },
  {
    slug: "remenovy-pohon",
    name: "Řemenový/řetězový pohon",
    icon: "🔄",
    description: "Rozvodové řemeny, řetězy, drážkové řemeny, vodní čerpadla",
    children: [
      { slug: "rozvodovy-remen", name: "Rozvodový řemen" },
      { slug: "rozvodove-retezy", name: "Rozvodové řetězy" },
      { slug: "sada-rozvodoveho-remenu", name: "Sada rozvodového řemene" },
      { slug: "drazkovy-remen", name: "Drážkový řemen" },
      { slug: "vodni-cerpadlo-sada", name: "Vodní čerpadlo + sada" },
    ],
  },
  {
    slug: "kladky",
    name: "Kladky a řemenice",
    icon: "⚙️",
    description: "Řemenice alternátoru, klikového hřídele, vodní pumpy",
    children: [
      { slug: "remenice-alternatoru", name: "Řemenice alternátoru" },
      { slug: "remenice-klikoveho-hridele", name: "Řemenice klikového hřídele" },
      { slug: "remenice-vodni-pumpy", name: "Řemenice vodní pumpy" },
    ],
  },
  {
    slug: "snimace",
    name: "Snímače",
    icon: "📡",
    description: "Čidla teploty, tlaku, otáček, TPMS",
    children: [
      { slug: "cidlo-teploty", name: "Čidlo teploty" },
      { slug: "cidlo-tlaku-oleje", name: "Čidlo tlaku oleje" },
      { slug: "senzor-tlaku-pneumatik", name: "Senzor tlaku v pneumatikách (TPMS)" },
      { slug: "snimac-otacek", name: "Snímač otáček" },
    ],
  },
  {
    slug: "tesneni",
    name: "Těsnění a kroužky",
    icon: "⭕",
    description: "Těsnění pod hlavou, víka ventilů, klikového hřídele",
    children: [
      { slug: "tesneni-pod-hlavou", name: "Těsnění pod hlavou" },
      { slug: "tesneni-vika-ventilu", name: "Těsnění víka ventilů" },
      { slug: "tesnici-krouzek-klikoveho-hridele", name: "Těsnící kroužek klikového hřídele" },
    ],
  },
  {
    slug: "cisteni-skel",
    name: "Čištění skel",
    icon: "🌂",
    description: "Stěrače, lišty, kapaliny do ostřikovačů",
    children: [
      { slug: "list-sterace", name: "List stěrače" },
      { slug: "gumicky-do-steracu", name: "Gumičky do stěračů" },
      { slug: "motor-steracu", name: "Motor stěračů" },
      { slug: "nadobka-ostrikovace", name: "Nádobka ostřikovače" },
      { slug: "tryska-ostrikovace", name: "Tryska ostřikovače" },
      { slug: "kapaliny-do-ostrikovacu", name: "Kapaliny do ostřikovačů" },
    ],
  },
  {
    slug: "hadice-trubky",
    name: "Hadice a trubky",
    icon: "🧵",
    description: "Hadice chladiče, klimatizace, palivové, podtlakové",
    children: [
      { slug: "hadice-chladice", name: "Hadice chladiče" },
      { slug: "hadice-klimatizace", name: "Hadice klimatizace" },
      { slug: "palivova-hadice", name: "Palivová hadice" },
      { slug: "podtlakove-hadicky", name: "Podtlakové hadičky" },
    ],
  },
  {
    slug: "dvere",
    name: "Dveře",
    icon: "🚪",
    description: "Centrální zamykání, madla, zámky, ochranné lišty",
    children: [
      { slug: "centralni-zamykani", name: "Centrální zamykání" },
      { slug: "madlo-dveri", name: "Madlo dveří" },
      { slug: "zamek-dveri", name: "Zámek dveří" },
      { slug: "zamykaci-knoflik", name: "Zamykací knoflík" },
      { slug: "ochranne-listy", name: "Ochranné lišty" },
    ],
  },
  {
    slug: "interier-komfort",
    name: "Interiér a komfort",
    icon: "🛋️",
    description: "Antény, autokoberce, kličky oken, motorky stahování",
    children: [
      { slug: "antena", name: "Anténa" },
      { slug: "autokoberce-na-miru", name: "Autokoberce na míru" },
      { slug: "klicka-okna", name: "Klička okna" },
      { slug: "motorek-stahovani-oken", name: "Motorek stahování oken" },
      { slug: "pedal-akceleratoru", name: "Pedál akcelerátoru" },
    ],
  },
  {
    slug: "releova-ovladaci",
    name: "Relé a ovládací prvky",
    icon: "🔌",
    description: "Relé startéru, centrálního zamykání, vyhřívání",
    children: [
      { slug: "rele-starteru", name: "Relé startéru" },
      { slug: "rele-centralniho-zamykani", name: "Relé centrálního zamykání" },
      { slug: "rele-vyhrivani-zadniho-skla", name: "Relé vyhřívání zadního skla" },
    ],
  },
  {
    slug: "zarovky",
    name: "Žárovky",
    icon: "💡",
    description: "Žárovky hlavních světlometů, mlhovek, interiéru",
    children: [
      { slug: "zarovka-hlavniho-svetlometu", name: "Žárovka hlavního světlometu" },
      { slug: "zarovka-svetla-hmly", name: "Žárovka světla hmly" },
      { slug: "osvetleni-interieru", name: "Osvětlení interiéru" },
    ],
  },
  {
    slug: "kola-pneumatiky",
    name: "Kola a pneumatiky",
    icon: "🛞",
    description: "Letní a zimní pneumatiky, litá a ocelová kola, disky",
    children: [
      { slug: "letni-pneumatiky", name: "Letní pneumatiky" },
      { slug: "zimni-pneumatiky", name: "Zimní pneumatiky" },
      { slug: "celorocni-pneumatiky", name: "Celoroční pneumatiky" },
      { slug: "lita-kola", name: "Litá kola" },
      { slug: "ocelova-kola", name: "Ocelová kola" },
      { slug: "kompletni-kola", name: "Kompletní kola" },
    ],
  },
  {
    slug: "tuning",
    name: "Tuning",
    icon: "🏁",
    description: "Sportovní brzdy, masky, spoilery, chip tuning",
    children: [
      { slug: "sportovni-brzdove-desticky", name: "Sportovní brzdové destičky" },
      { slug: "sportovni-brzdove-kotouce", name: "Sportovní brzdové kotouče" },
      { slug: "sportovni-maska", name: "Sportovní maska" },
    ],
  },
  {
    slug: "autokosmetika",
    name: "Autokosmetika",
    icon: "🧴",
    description: "Vosky, šampony, leštěnky, čističe interiéru",
    children: [
      { slug: "vosky-lestidla", name: "Vosky a leštidla" },
      { slug: "sampony-auta", name: "Šampony na auto" },
      { slug: "cistice-interieru", name: "Čističe interiéru" },
      { slug: "ochrany-laku", name: "Ochrany laku" },
    ],
  },
];
```

**Celkem**: 29 hlavních + přibližně 150 subkategorií = ~180 uzlů.

### 5.2 Seed funkce `seedPartCategories()`

`prisma/seed-part-categories.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
import { PART_CATEGORY_TREE, type CategoryNode } from "@/lib/parts-category-tree";

const prisma = new PrismaClient();

export async function seedPartCategories() {
  console.log("[seed] Seeding part categories...");

  // 1. Vytvořit/update hlavních kategorií
  for (let i = 0; i < PART_CATEGORY_TREE.length; i++) {
    const root = PART_CATEGORY_TREE[i];
    const created = await prisma.partCategory.upsert({
      where: { slug: root.slug },
      update: { name: root.name, icon: root.icon, description: root.description, sortOrder: i },
      create: {
        slug: root.slug,
        name: root.name,
        icon: root.icon,
        description: root.description,
        sortOrder: i,
      },
    });

    // 2. Podkategorie
    if (root.children) {
      for (let j = 0; j < root.children.length; j++) {
        const child = root.children[j];
        await prisma.partCategory.upsert({
          where: { slug: child.slug },
          update: { name: child.name, parentId: created.id, sortOrder: j },
          create: {
            slug: child.slug,
            name: child.name,
            parentId: created.id,
            sortOrder: j,
          },
        });
      }
    }
  }

  console.log(`[seed] Part categories seeded: ${PART_CATEGORY_TREE.length} top + ${
    PART_CATEGORY_TREE.reduce((sum, c) => sum + (c.children?.length ?? 0), 0)
  } subs`);

  // 3. Backfill categoryId pro existující Parts
  await backfillPartCategoryIds();
}

async function backfillPartCategoryIds() {
  // Mapování starý enum → nový slug
  const legacyMap: Record<string, string> = {
    ENGINE: "motor",
    TRANSMISSION: "prevodovka",
    BRAKES: "brzdy",
    SUSPENSION: "podvozek",
    BODY: "karoserie",
    ELECTRICAL: "elektricky-system",
    INTERIOR: "interier-komfort",
    WHEELS: "kola-pneumatiky",
    EXHAUST: "vyfuk",
    COOLING: "chlazeni-motoru",
    FUEL: "palivovy-system",
    OTHER: "motor", // fallback — "OTHER" je nešťastný, mapujeme na motor jako default
  };

  for (const [legacy, newSlug] of Object.entries(legacyMap)) {
    const newCategory = await prisma.partCategory.findUnique({ where: { slug: newSlug } });
    if (!newCategory) {
      console.warn(`[seed] Missing new category for legacy ${legacy} → ${newSlug}`);
      continue;
    }
    const updated = await prisma.part.updateMany({
      where: { category: legacy, categoryId: null },
      data: { categoryId: newCategory.id },
    });
    if (updated.count > 0) {
      console.log(`[seed] Backfilled ${updated.count} parts from ${legacy} → ${newSlug}`);
    }
  }
}
```

---

## 6. UI/UX — Mega menu design

### 6.1 Navbar dropdown

**Současný stav** (`components/shop/Navbar.tsx` line 24-30):
```tsx
<Link href="/katalog" className="...">Katalog dílů</Link>
```

**Po implementaci:**
```tsx
<div className="relative group">
  <button className="...">
    Kategorie <ChevronDownIcon />
  </button>
  <div className="absolute top-full left-0 ... invisible group-hover:visible">
    <CategoryMegaMenu categories={tree} />
  </div>
</div>
```

### 6.2 CategoryMegaMenu layout (desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  KATEGORIE                                                  │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ MOTOR       │ BRZDY       │ PODVOZEK    │ KAROSERIE       │
│ ─────────── │ ─────────── │ ─────────── │ ───────────     │
│ Blok motoru │ Destičky    │ Tlumiče     │ Nárazník        │
│ Hlava       │ Kotouče     │ Pružiny     │ Blatník         │
│ Píst        │ Hadice      │ Ložiska     │ Kapota          │
│ Vačkový...  │ Třmen       │ Stabilizát. │ Světlomety      │
│ Víko hlavy  │ Brzd. kap.  │ Ramena      │ Zrcátka         │
│             │             │             │                  │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│ FILTRY      │ VÝFUK       │ KLIMATIZACE │ ELEKTRICKÝ SYS. │
│ Olejový     │ Katalyzátor │ Kompresor   │ Alternátor      │
│ Vzduchový   │ DPF         │ Chladič     │ Startér         │
│ Kabinový    │ Lambda      │ Výparník    │ Baterie         │
│ Palivový    │ Turbo       │             │                  │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│ CHLAZENÍ    │ PALIVO      │ PŘEVODOVKA  │ VŠECHNY →       │
│ ...         │ ...         │ ...         │ (29 kategorií)  │
└─────────────┴─────────────┴─────────────┴─────────────────┘
```

**Layout specs:**
- Šířka: ~960px (max-w-4xl), centered nebo odskok z logo edge
- Padding: 24px vnější
- Grid: 4 sloupce × 3 řádky (12 zobrazených hlavních kategorií), poslední buňka je link na `Všechny kategorie`
- Každá buňka:
  - Titulek hlavní kategorie — velký bold (`text-base font-bold text-gray-900`)
  - 5 nejpopulárnějších subs — clickable, menší (`text-sm text-gray-500 hover:text-orange-500`)
  - Link na hlavní kategorii přes titulek (celá buňka je link-skupina)
- Sticky CTA dole: `Zobrazit všechny kategorie →` s orange text

### 6.3 Která 12 zobrazit v mega menu?

Z 29 hlavních vybíráme 11 + 1 slot na "Všechny →":
1. Motor
2. Brzdy
3. Podvozek
4. Karoserie
5. Filtry
6. Výfuk
7. Klimatizace
8. Elektrický systém
9. Chlazení motoru
10. Palivový systém
11. Převodovka
12. **Všechny kategorie →**

Kritérium: **nejčastěji vyhledávané** kategorie pro autodíly. Ostatních 18 je dostupných přes link "Všechny kategorie" → jde na `/shop/kategorie/` landing s full treem.

### 6.4 Mobile mega menu

Na mobile není "mega menu" realistické. Nahradit za:
- Tap na "Kategorie" otevře drawer/accordion s 29 hlavními kategoriemi
- Tap na hlavní → expand inline seznam podkategorií
- Alternativa: tap na hlavní → full screen s podkategoriemi + back button

Implementace: reuse `<CategorySidebar>` komponenty (sekce 6.6) v mobile menu drawer.

### 6.5 Shop homepage grid (`components/shop/CategoryTopGrid.tsx`)

```
┌───────┬───────┬───────┬───────┐
│ 🛑    │ ⚙️    │ 🔩    │ 🚗    │
│ BRZDY │ MOTOR │ POD.  │ KAR.  │
│ 1 234 │ 892   │ 654   │ 445   │
├───────┼───────┼───────┼───────┤
│ 🔲    │ 💨    │ ❄️    │ 💡    │
│ FILT. │ VÝFUK │ CHL.  │ ELEK. │
│ 234   │ 456   │ 123   │ 789   │
├───────┼───────┼───────┼───────┤
│ ...   │ ...   │ ...   │ ...   │
└───────┴───────┴───────┴───────┘
```

8 kategorií × 4 sloupce = 32 slotů. Zobrazí buď všech 29 + 3 speciální ("Všechno", "Doporučené", "Novinky") nebo 28 + "Zobrazit všechny". Designer rozhodne finální vzhled.

### 6.6 Sidebar tree (`components/shop/CategorySidebar.tsx`)

```
┌─ KATEGORIE ─────────┐
│ Motor            12 │  ← click = expand
│   Blok motoru    3  │
│   Píst           5  │  ← aktuální zvýrazněná
│   Vačkový hřídel 1  │
│ Brzdy            45 │
│ Podvozek         23 │
│ Karoserie        67 │
│ ...                 │
└─────────────────────┘
```

Použitá v:
- `/shop/kategorie/[slug]/page.tsx` — sidebar nalevo, obsah napravo
- `/shop/katalog` — sidebar nahradí současné `tabs` array

### 6.7 Breadcrumb (`components/shop/CategoryBreadcrumb.tsx`)

```
Shop  >  Brzdy  >  Brzdové destičky
```

Generuje se z `parentId` chainu — iteruje `parent.parent.parent...` pokud existují hlouby > 2.

---

## 7. Migrace a deployment

### 7.1 Pořadí kroků

1. **Pull latest** — začít z čisté `main` bez work-in-progress
2. **Edit `schema.prisma`** — přidat `PartCategory` model + rozšířit `Part`
3. **Generate migration:** `npx prisma migrate dev --name part_categories_tree`
   - Vytvoří migration SQL
   - Aplikuje na dev DB
   - Regeneruje Prisma client
4. **Create `lib/parts-category-tree.ts`** — const tree
5. **Create `prisma/seed-part-categories.ts`** — seed funkce
6. **Edit `prisma/seed.ts`** — zavolat `seedPartCategories()` po ostatních seedech
7. **Run seed:** `npx prisma db seed` — vytvoří 180 kategorií + backfillne existující Parts
8. **Ověřit v Prisma Studio:** `npx prisma studio` — manuálně zkontrolovat tree + počty
9. **Implement API routes** (body 9-10-11)
10. **Implement UI komponenty** (body 12-22)
11. **Upravit admin form** (bod 24)
12. **Smoke test** — nákup dílu přes `/shop/kategorie/brzdy/brzdove-desticky`

### 7.2 Rollback plán

Pokud migrace selže:
```bash
npx prisma migrate resolve --rolled-back part_categories_tree
git checkout prisma/schema.prisma
```

Prisma migrate dev nevadí revertovat před novu migraci — jen smazat _all_ generated SQL z `prisma/migrations/part_categories_tree/`.

### 7.3 Production deployment

1. Merge do main
2. Vercel (nebo kde se deployuje) spustí `npx prisma migrate deploy` v build step
3. Spustit seed přes one-shot script: `npx tsx prisma/seed-part-categories.ts --production`
4. Verify: 180 kategorií existuje + všechny existující parts mají `categoryId`
5. Smoke test production URL

**POZOR:** Seed musí být **idempotentní** (upsert místo create) — aby po redeploye nevznikly duplikáty.

---

## 8. Klíčová rozhodnutí

### 8.1 Proč inline const `PART_CATEGORY_TREE` + DB seed místo hardcode v DB jen?

**PRO inline const:**
- Source of truth je v gitu — changes jdou code review
- Typed TypeScript — refaktoring (rename category) je bezpečný
- Seed může být re-runable bez ztráty dat (upsert by slug)
- Mega menu a sidebar mohou načíst strom z **statického importu** (rychlejší než DB query na každý request) — fallback na DB query pro dynamic data (partsCount)

**PROTI:**
- Dva zdroje pravdy (const + DB) — musí se synchronizovat přes seed
- Nelze editovat kategorii z admin UI bez deploye

**Kompromis:** Const je primární zdroj pro **strukturu** (slug, name, hierarchy). DB umožňuje **doplňování** (description, metaTitle, metaDescription, icon — to se seeduje z const ale admin může editovat v DB). Po editaci z admin UI seed NEPŘEPÍŠE (protože update: { ...fields } je explicitní pouze pro strukturální data).

**Aktualizace v plánu:** Seed by měl `update` blok obsahovat jen `name`, `parentId`, `sortOrder` — ne `description`, `icon`. Admin editace description/icon nebude přepsána při re-runu seedu.

### 8.2 Proč 2 úrovně stromu, ne víc?

Autokelly/automobilovedily24 mají prakticky 2 úrovně (Main → Sub). Žádná Sub → SubSub. Proto: seed strukturovaný na 2 úrovně, ale `parentId` je rekurzivní — kdybychom v budoucnu chtěli 3. úroveň, stačí přidat childrens. **Plán žádné striktní limity.**

### 8.3 Proč `categoryId` nullable?

Backward compat: existující parts z první phasy nemají `categoryId` ještě před backfillem. Po úspěšné migraci a ověření že 100% parts má `categoryId`, můžeme v followup tasku udělat `categoryId String` (non-null) + migrace která updatuje schema.

### 8.4 Proč neschovat `Part.category` enum string hned?

Viz sekce 3.2. Dual-write pattern pro bezpečnou migraci. Drop column jde samostatně po validaci.

### 8.5 Co s `lib/validators/parts.ts` Zod enum?

**Problém:** Zod `z.enum(["ENGINE", ...])` je compile-time list. Když přidáme dynamic kategorie z DB, nelze je tam dát.

**Řešení:**
- `createPartSchema.categoryId: z.string().cuid()` — validuje formát, ne existenci
- API route (v `app/api/parts/route.ts`) si doplňuje runtime check: `const exists = await prisma.partCategory.findUnique({ where: { id } });` — vrací 400 pokud ne
- Stará validace `category: z.enum(...)` → přejmenovat na `legacyCategory` a deprecate, nebo úplně odstranit + ostrá migrace v následném taksu

**Backward compat path:** API může dočasně přijímat **oboje** — starý `category: "BRAKES"` string ZNB `categoryId: "cl..."` cuid — pokud je poslán starý, lookup `PartCategory` by slug `legacyMap[category]`.

### 8.6 Proč route `/shop/kategorie/[slug]/[subslug]?` a ne `/shop/kategorie/[...slugs]`?

Next.js 15 `[...slugs]` catch-all je flexibilní ale neumožňuje `generateStaticParams` snadno pro 2-úrovňový tree bez exploze `all(main) × all(sub)`. Dvouúrovňový `[slug]` + `[slug]/[subslug]` je jednodušší pro:
- `generateStaticParams` per layer
- Breadcrumb build (explicit 2 layers)
- SEO sitemap generation

Pokud budou v budoucnu 3+ úrovně, můžeme migrovat na catch-all.

### 8.7 Proč NE používat `categoryMarkups JSON` na `User` (supplier)?

V `User` modelu (prisma/schema.prisma line 1522) je `categoryMarkups String?` JSON field s category → markup mapping. Používá se pro automatic pricing.

**Akce:** **Nevyužívat pro nový tree.** Tenhle JSON field je legacy pro 12-value enum, po migraci bude potřeba refactoring (samostatný task). V tomto tasku pouze **nerozbít** — pricing logika by měla fungovat beze změny, protože `Part.category` string zůstává.

---

## 9. Co NEDĚLAT (out of scope)

- **Ne** migrovat `/dily/*` legacy routes — ty zůstávají se svými SEO landing pages (`PARTS_CATEGORIES` v `lib/seo-data.ts`)
- **Ne** dropnout `Part.category String` column — dual-write pattern, drop je samostatný task
- **Ne** psát admin UI pro správu kategorií (add/edit/delete category) — seed je zdroj pravdy, úprava jde code review
- **Ne** řešit `categoryMarkups` refactoring pro supplier User model
- **Ne** implementovat per-category FAQ content jako v `/dily/kategorie/[slug]` — to je SEO feature legacy routes
- **Ne** auto-categorize existing parts AI-em — backfill je na legacy mapping (12 → 12 top-level kategorií); fine-grained re-categorization (ENGINE → konkrétní "Píst") nechat na supplierovi nebo admin editu
- **Ne** implementovat vyhledávání v rámci kategorie s full-text indexem — existující `searchVector` na `Part` funguje cross-category
- **Ne** řešit i18n (EN/DE) názvů kategorií — čeština only
- **Ne** vytvářet migration pro `User.categoryMarkups` JSON schema update — to refactoring tasku
- **Ne** smazat `lib/parts-categories.ts` — zatím zůstává pro admin form select legacy path; deprekovat v followup tasku

---

## 10. Akceptační kritéria

### 10.1 Backend
- [ ] `prisma/schema.prisma` obsahuje `PartCategory` model se self-relation
- [ ] `Part` má nové pole `categoryId String?` + relation `partCategory`
- [ ] `npx prisma migrate dev` projde bez erroru
- [ ] `npx prisma db seed` vytvoří 29 top + ~150 sub kategorií
- [ ] Po seedu jsou existující `Part` záznamy mají `categoryId` pro 12 legacy enum hodnot
- [ ] `lib/parts-category-tree.ts` obsahuje const `PART_CATEGORY_TREE` s kompletním stromem
- [ ] `prisma/seed-part-categories.ts` je idempotentní (re-run nevytvoří duplikáty)

### 10.2 API
- [ ] `GET /api/parts-categories` vrací hierarchický tree (cached 1h)
- [ ] `GET /api/parts-categories/[slug]` vrací detail + children + parts count
- [ ] `GET /api/parts?categoryId=X` filtruje parts podle nové kategorie
- [ ] Starý query param `?category=BRAKES` buď stále funguje (backward compat) nebo redirect na `categoryId`

### 10.3 UI — mega menu
- [ ] `components/shop/CategoryMegaMenu.tsx` existuje
- [ ] `components/shop/Navbar.tsx` používá mega menu místo hardcoded `Katalog dílů` linku
- [ ] Mega menu zobrazuje 11 hlavních kategorií + 5 subcategorií per column + "Všechny kategorie" CTA
- [ ] Mobile menu má accordion s hierarchickou strukturou

### 10.4 UI — stránky kategorie
- [ ] `/shop/kategorie/brzdy` — stránka hlavní kategorie se sidebar stromem + grid subcategorií/produktů
- [ ] `/shop/kategorie/brzdy/brzdove-desticky` — stránka podkategorie s gridem produktů
- [ ] Breadcrumb zobrazuje `Shop > Brzdy > Brzdové destičky`
- [ ] Sidebar tree expanduje/kolapsuje uzly, zvýrazňuje aktivní
- [ ] `loading.tsx` + `error.tsx` existují pro obě routy
- [ ] `generateStaticParams()` vrací slugs pro všech 29 + 150 kategorií (SEO)
- [ ] `generateMetadata()` generuje `metaTitle`, `metaDescription`, `canonical` URL

### 10.5 UI — shop homepage
- [ ] `app/(web)/shop/page.tsx` používá `<CategoryTopGrid>` místo flat map
- [ ] Grid zobrazuje 29 hlavních kategorií s ikony + partsCount
- [ ] Klik na kartu → navigace na `/shop/kategorie/[slug]`

### 10.6 UI — katalog update
- [ ] `app/(web)/shop/katalog/page.tsx` má sidebar `<CategorySidebar>` místo tabs
- [ ] Aktuální filter se přepíná přes klik v sidebaru
- [ ] Backward compat: `?category=BRAKES` query param se resolvuje na `categoryId` a zobrazí správnou kategorii

### 10.7 Admin/supplier
- [ ] Add/edit part form má dependent dropdown (hlavní kategorie → dynamický seznam subkategorií)
- [ ] Uloží `categoryId` + `category` string (dual-write)
- [ ] Existující parts nelze vytvořit bez kategorie (required)

### 10.8 Build + smoke test
- [ ] `npm run build` projde bez TypeScript errorů
- [ ] Manuální smoke test: 
  - Home → klik Shop → Kategorie → Brzdy → Brzdové destičky
  - Produkt → Přidat do košíku → Objednávka → Checkout
- [ ] Existing orders s legacy `category` string stále fungují (backward compat)

---

## 11. Poznámky pro implementátora

1. **Začít s backendem** — schema + migrace + seed jako atomic PR. UI může jít v followup PRu.

2. **`PART_CATEGORY_TREE` const je velký (180 uzlů)** — rozhodni se buď:
   - Všechno v jednom souboru (`lib/parts-category-tree.ts`) — jednoduchá ale 500+ řádků
   - Per-main-category soubory (`lib/parts-category-tree/brzdy.ts`, `motor.ts`, ...) + index — čistší ale víc boilerplate
   - Doporučuji: **single file pro MVP**, refactor pokud bude overwhelming

3. **Mega menu musí být performant** — tree načítat jednou při load, cachovat do React state / context. Ne fetch na každý hover. Ideálně: server-side rendered data injection přes `RootProvider`.

4. **Pozor na hydration mismatch** — mega menu je interactive (hover), musí být `"use client"`. Tree data předat jako props ze server komponenty.

5. **`generateStaticParams` pro 180 routes může build zpomalit** — Next.js 15 je rychlý, ale sleduj build time. Pokud >30s pro tenhle segment, přepnout na ISR (`revalidate = 3600`).

6. **Konzistence slugů mezi tree a SEO** — pokud některý slug (např. `brzdy`) koliduje se slugem v `PARTS_CATEGORIES` z `lib/seo-data.ts` (route `/dily/kategorie/brzdy`), tak OK — to je jiný route (`/dily` vs `/shop`). Není to konflikt, jen **pozor na SEO canonical**: `/shop/kategorie/brzdy` by měl mít distinct canonical URL odlišný od `/dily/kategorie/brzdy`. Nebo redirekt z jednoho na druhý.

7. **Partial seed run během dev** — pro testing stačí 2-3 hlavní kategorie (Motor, Brzdy, Filtry) + jejich subs. Celý tree seedovat až při merge do main.

8. **Naming konvence slugů:**
   - Bez diakritiky (`brzdy`, ne `brzdý`)
   - Dash-separated (`brzdove-desticky`)
   - Lowercase
   - Matchovat české pojmy (ne anglické)

9. **`CategoryNode` type v const** — pokud plánuješ používat i pro runtime tree (ne jen seed), rozšiř o optional `partsCount?: number` field a fill-it-in server-side.

10. **Budoucí refactor `lib/seo-data.ts`** — po úspěšné migraci do nového modelu můžeme synchronizovat SEO data do DB a smazat `PARTS_CATEGORIES` konstantu. Ale to je post-MVP.

11. **Testování seedu:** Před pushem na main spustit:
    ```bash
    npx prisma migrate reset --skip-seed && npx prisma migrate deploy && npx prisma db seed
    ```
    — vyzkouší clean DB boot + seed + backfill.

12. **Monitoring po deploy:** Po produkčním deployi zkontrolovat:
    - `SELECT COUNT(*) FROM "PartCategory";` — očekáváme 180
    - `SELECT COUNT(*) FROM "Part" WHERE "categoryId" IS NULL;` — očekáváme 0 po backfillu
    - Manuální test `/shop/kategorie/brzdy` → 200 OK + grid produktů

13. **Roll-forward strategy pokud backfill minul některé parts:** Drop 12 legacy enum, admin ručně upraví přes UI. Pokud >10 parts jsou nullable, write migration ad-hoc script a re-run backfill.

---

## 14. UPDATE 2026-04-06 — team-lead feedback refactor

### 14.1 Rename `categoryId` → `partCategoryId`

**Původní (nesprávné):**
```prisma
model Part {
  categoryId   String?
  partCategory PartCategory? @relation(fields: [categoryId], references: [id])
  @@index([categoryId])
}
```

**Nové (team-lead spec):**
```prisma
model Part {
  // ... existing fields ...
  category       String   // ENGINE, TRANSMISSION, ... (LEGACY, dual-write)
  partCategoryId String?
  partCategory   PartCategory? @relation(fields: [partCategoryId], references: [id])
  @@index([partCategoryId])
  // @@index([category]) — KEEP
}
```

**Důvod rename:**
- `categoryId` je příliš generické — v User modelu je dealerId/brokerId/..., v Order je supplierId/buyerId/... Explicitní prefix `partCategoryId` koresponduje s relation name `partCategory` a prevence collisions pokud v budoucnu přibude jiný categoryId (např. vehicleCategoryId).
- Konzistence s existing pattern v projektu: `Vehicle.brokerId`, `Order.buyerId`, `Part.supplierId` — všechna foreign keys mají explicit entity prefix.

**Dopad na seed:**
Všechna `categoryId` v `prisma/seed-part-categories.ts` backfill SQL se mění na `partCategoryId`:
```sql
-- Původní:
UPDATE "Part" SET "categoryId" = (SELECT id FROM "PartCategory" WHERE slug = ...)

-- Nové:
UPDATE "Part" SET "partCategoryId" = (SELECT id FROM "PartCategory" WHERE slug = ...)
```

**Dopad na API routes a Prisma queries:**
Grep `categoryId` v `app/api/parts/**` a `components/shop/**` → každý výskyt rename na `partCategoryId`. Stejně v TypeScript types (`PartCategoryWithChildren`, Prisma include/where clauses).

**Dopad na Zod validators:**
```typescript
// lib/validators/parts.ts
export const createPartSchema = z.object({
  // Původní:
  // categoryId: z.string().cuid(),
  // Nové:
  partCategoryId: z.string().cuid(),
  // ...
});
```

**Dopad na admin form:**
Form field `name="categoryId"` → `name="partCategoryId"`.

**Migration rename:**
Pokud už existuje migrace z původního planu, vytvořit další migraci `prisma/migrations/<ts>_rename_category_id_to_part_category_id/migration.sql`:
```sql
ALTER TABLE "Part" RENAME COLUMN "categoryId" TO "partCategoryId";
ALTER INDEX "Part_categoryId_idx" RENAME TO "Part_partCategoryId_idx";
-- Foreign key constraint name remains, Prisma auto-generates
```

Pokud migrace ještě neběžela, prostě upravit původní migration file před spuštěním.

### 14.2 Catch-all route `/shop/kategorie/[...slug]`

**Původní (2-level, omezené):**
```
app/(web)/shop/kategorie/[slug]/page.tsx         ← main category
app/(web)/shop/kategorie/[slug]/[subslug]/page.tsx ← sub category
```

**Nové (catch-all, neomezená hloubka):**
```
app/(web)/shop/kategorie/[...slug]/page.tsx      ← main + sub + sub-sub + ...
app/(web)/shop/kategorie/[...slug]/loading.tsx
```

**Rozhodování logicky:**
```typescript
// app/(web)/shop/kategorie/[...slug]/page.tsx

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  // slug = ["brzdy"] → main category
  // slug = ["brzdy", "brzdove-desticky"] → subcategory
  // slug = ["brzdy", "brzdove-desticky", "kotoucove"] → sub-subcategory (teoreticky)

  const lastSlug = slug[slug.length - 1];

  // Najít kategorii dle posledního slugu
  const category = await prisma.partCategory.findUnique({
    where: { slug: lastSlug },
    include: {
      parent: { include: { parent: true } }, // breadcrumb chain
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { parts: true } } },
      },
      _count: { select: { parts: true } },
    },
  });

  if (!category) {
    notFound();
  }

  // Verify breadcrumb path matches URL
  // (pokud user zadá /shop/kategorie/motor/brzdove-desticky — chybný path)
  const breadcrumbSlugs = buildBreadcrumbSlugs(category); // např. ["brzdy", "brzdove-desticky"]
  if (breadcrumbSlugs.join("/") !== slug.join("/")) {
    // Redirect na správný URL pro SEO — canonical
    redirect(`/shop/kategorie/${breadcrumbSlugs.join("/")}`);
  }

  // Načíst produkty
  const products = await prisma.part.findMany({
    where: category.children.length === 0
      ? { partCategoryId: category.id }          // leaf category → jen přímé produkty
      : { partCategory: { parentId: category.id } }, // parent category → produkty všech dětí (nebo jen přímé — design choice)
    take: 24,
    // ...
  });

  return <CategoryView category={category} products={products} />;
}

export async function generateStaticParams() {
  const categories = await prisma.partCategory.findMany({
    where: { isActive: true },
    select: { slug: true, parent: { select: { slug: true, parent: { select: { slug: true } } } } },
  });

  return categories.map((cat) => {
    const slugs: string[] = [];
    let current: typeof cat.parent = cat.parent;
    while (current) {
      slugs.unshift(current.slug);
      current = current.parent as typeof current;
    }
    slugs.push(cat.slug);
    return { slug: slugs };
  });
}
```

**Helper `buildBreadcrumbSlugs(category)`** (nový v `lib/parts-categories.ts`):
```typescript
export function buildBreadcrumbSlugs(category: {
  slug: string;
  parent?: { slug: string; parent?: { slug: string } | null } | null;
}): string[] {
  const slugs: string[] = [category.slug];
  let current = category.parent;
  while (current) {
    slugs.unshift(current.slug);
    current = current.parent ?? null;
  }
  return slugs;
}
```

**Výhody catch-all:**
- Budoucí sub-sub-kategorie (3+ levels) funguje bez refactoru
- Jedna route handles all depths = DRY
- `generateStaticParams` automaticky enumerátuje všechny paths

**Nevýhody:**
- Složitější dynamic type `slug: string[]`
- Canonical redirect logic nutný pro SEO
- Loading.tsx se sdílí pro všechny hloubky (OK, je to generic skeleton)

**Dopad na další soubory:**
- `components/shop/CategoryBreadcrumb.tsx` — input type je `string[]` místo `{main, sub}`
- Linky v `CategoryCard`, `CategoryMegaMenu`, `CategorySidebar` — všechny generují URL přes `/shop/kategorie/${slugs.join("/")}`
- `PARTS_CATEGORIES` legacy routes `/dily/kategorie/[slug]` zůstávají nezměněny (mimo scope této změny)

**Sitemap.ts update:**
```typescript
// app/sitemap.ts
const categoryPaths: string[] = [];
for (const cat of allCategories) {
  const slugs = buildBreadcrumbSlugs(cat);
  categoryPaths.push(`/shop/kategorie/${slugs.join("/")}`);
}
```

### 14.3 `partsCount` column v `PartCategory`

**Původní návrh (rejected):** Dynamic `_count: { parts: true }` v každém query. Důvod rejectu: race conditions při paralelních writes, stale reads, a při leaf categories to není dostupné přes include (bylo by potřeba join přes children).

**Team-lead rozhodnutí:** Přidat column `partsCount Int @default(0)` a aktualizovat **explicitně při write operacích**. Tolerujeme eventual consistency s manual refresh job (cron).

**Schema update:**
```prisma
model PartCategory {
  id          String @id @default(cuid())
  slug        String @unique
  name        String
  parentId    String?
  parent      PartCategory?  @relation("PartCategoryTree", fields: [parentId], references: [id])
  children    PartCategory[] @relation("PartCategoryTree")
  icon        String?
  imageUrl    String?
  description String?
  metaTitle   String?
  metaDescription String?
  sortOrder   Int    @default(0)

  // NEW:
  partsCount  Int    @default(0)  // Cached — aktualizovat při part create/update/delete

  parts       Part[]
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([parentId])
  @@index([slug])
  @@index([sortOrder])
  @@index([partsCount]) // pro "most popular categories" sortování
}
```

**Kdy `partsCount` aktualizovat (dual-write)**

Každá Part CRUD operace musí updatovat `partsCount` v ovlivněných kategoriích:

1. **Create Part** (`app/api/parts/route.ts POST`):
```typescript
await prisma.$transaction(async (tx) => {
  const part = await tx.part.create({ data });

  if (part.partCategoryId) {
    // Increment direct category
    await tx.partCategory.update({
      where: { id: part.partCategoryId },
      data: { partsCount: { increment: 1 } },
    });
    // Increment all parents (recursive)
    await incrementParentCounts(tx, part.partCategoryId, 1);
  }

  return part;
});
```

2. **Update Part category** (if `partCategoryId` changes):
```typescript
await prisma.$transaction(async (tx) => {
  const oldPart = await tx.part.findUnique({ where: { id } });
  const updated = await tx.part.update({ where: { id }, data });

  if (oldPart?.partCategoryId !== updated.partCategoryId) {
    if (oldPart?.partCategoryId) {
      await tx.partCategory.update({
        where: { id: oldPart.partCategoryId },
        data: { partsCount: { decrement: 1 } },
      });
      await incrementParentCounts(tx, oldPart.partCategoryId, -1);
    }
    if (updated.partCategoryId) {
      await tx.partCategory.update({
        where: { id: updated.partCategoryId },
        data: { partsCount: { increment: 1 } },
      });
      await incrementParentCounts(tx, updated.partCategoryId, 1);
    }
  }
});
```

3. **Delete Part**:
```typescript
await prisma.$transaction(async (tx) => {
  const part = await tx.part.findUnique({ where: { id } });
  if (part?.partCategoryId) {
    await tx.partCategory.update({
      where: { id: part.partCategoryId },
      data: { partsCount: { decrement: 1 } },
    });
    await incrementParentCounts(tx, part.partCategoryId, -1);
  }
  await tx.part.delete({ where: { id } });
});
```

**Helper `incrementParentCounts`:**
```typescript
// lib/parts-categories.ts
async function incrementParentCounts(
  tx: Prisma.TransactionClient,
  categoryId: string,
  delta: number
): Promise<void> {
  const category = await tx.partCategory.findUnique({
    where: { id: categoryId },
    select: { parentId: true },
  });

  if (category?.parentId) {
    await tx.partCategory.update({
      where: { id: category.parentId },
      data: { partsCount: { increment: delta } },
    });
    // Recurse for grandparent
    await incrementParentCounts(tx, category.parentId, delta);
  }
}
```

**Proč recursive increment parents?**
- User na `/shop/kategorie/brzdy` očekává vidět count včetně všech subcategory parts ("Brzdy (230)")
- Bez recursive increment by leaf categories měli true count, ale parent categories by měli 0

**Reconciliation cron job** (follow-up task, ne součást MVP):
```typescript
// scripts/reconcile-parts-count.ts
// Spouští se nightly, opraví drift pokud write transactions selhaly
async function reconcile() {
  const categories = await prisma.partCategory.findMany();
  for (const cat of categories) {
    const realCount = await countAllPartsUnder(cat.id);
    if (realCount !== cat.partsCount) {
      await prisma.partCategory.update({
        where: { id: cat.id },
        data: { partsCount: realCount },
      });
      console.log(`[reconcile] ${cat.slug}: ${cat.partsCount} → ${realCount}`);
    }
  }
}
```

**Backfill v seed:**
```typescript
// prisma/seed-part-categories.ts po backfill Part.partCategoryId:
await recalculateAllPartsCounts();

async function recalculateAllPartsCounts() {
  const categories = await prisma.partCategory.findMany({
    orderBy: { parentId: "desc" }, // leaf-first
  });

  for (const cat of categories) {
    const directCount = await prisma.part.count({
      where: { partCategoryId: cat.id },
    });
    const childrenSum = await prisma.partCategory.aggregate({
      where: { parentId: cat.id },
      _sum: { partsCount: true },
    });
    const total = directCount + (childrenSum._sum.partsCount ?? 0);

    await prisma.partCategory.update({
      where: { id: cat.id },
      data: { partsCount: total },
    });
  }
}
```

**⚠️ Varování pro implementátora:**
- `partsCount` MŮŽE být stale (race condition při concurrent writes)
- Tolerance: ±1-5 při vysokém load. Pro 99% UX use case OK.
- **Pokud** se projeví drift, reconciliation cron (follow-up `#24a`) ho opraví.
- **Alternativa k full reconciliation:** při každém category page view, porovnat cached count s live count pokud delta > threshold a update async. **NE v MVP** — optimize later.

### 14.4 Aktualizované acceptance criteria (doplnění)

Přidat k sekci 11:
- [ ] Prisma model `Part` má column `partCategoryId` (NE `categoryId`)
- [ ] Prisma model `PartCategory` má column `partsCount` s `@default(0)` a `@@index([partsCount])`
- [ ] Route `app/(web)/shop/kategorie/[...slug]/page.tsx` funguje pro různou hloubku: `/brzdy`, `/brzdy/brzdove-desticky`, `/motor/pohyb`
- [ ] Canonical redirect pokud URL path neodpovídá skutečné breadcrumb chain
- [ ] `generateStaticParams` enumuje všechny kategoriální paths
- [ ] `createPartSchema` používá `partCategoryId` (ne `categoryId`)
- [ ] Part CRUD operace updatují `partsCount` v ovlivněných kategoriích (direct + všechny parents) v transaction
- [ ] Seed skript volá `recalculateAllPartsCounts()` po backfillu
- [ ] Grep `\bcategoryId\b` v `app/api/parts/**` a `components/shop/**` → 0 hits (vše rename)
- [ ] Build + lint prošly

### 14.5 Aktualizované rizika

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| `partsCount` drift při concurrent writes | Střední | Low (UX cosmetic) | Reconciliation cron v follow-up `#24a` |
| Catch-all route canonical redirect loop | Nízké | High | Test: vytvořit kategorii s URL path mismatch, ověřit 1 redirect + správný URL |
| Rename `categoryId` → `partCategoryId` chyba na call sites | Střední | Medium | Grep před commit, TypeScript strict mode zachytí většinu |
| Recursive `incrementParentCounts` stack overflow u hluboké hierarchie | Nízké (max 3 levels v MVP) | Low | Max depth je 3 (main → sub → sub-sub). Žádný risk pro MVP. |

### 14.6 Follow-up tasky (updated)

- **#24a** — Reconciliation cron pro `partsCount` drift correction (nightly)
- **#24b** — Materialized view pro `partsCount` (pokud scale > 10k parts)
- **#24c** — Admin UI pro category manage (add/edit/reorder) — zatím jen DB seed + Prisma Studio
- **#24d** — Migrace `/dily/kategorie/[slug]` legacy SEO routes na novou strukturu (nebo keep jako redirects)

---

**Plán update hotov. Klíčové změny:** `partCategoryId` rename (v celém codebase), `[...slug]` catch-all route (s canonical redirect logikou), `partsCount` column s dual-write pattern (s varováním o race conditions + follow-up reconciliation cron).
