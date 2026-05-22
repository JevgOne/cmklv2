# Plán: Interní prolinkování SEO landing pages

**Vytvořeno:** 2026-04-20
**Task:** #29

---

## 1. Kompletní inventář SEO stránek

### 1.1 Vehicle landing pages (48 statických)

| Typ | Počet | Route pattern | Příklad |
|-----|-------|---------------|---------|
| Značky | 16 | `/nabidka/{brand}` | `/nabidka/skoda` |
| Modely | 12 | `/nabidka/{brand}/{model}` | `/nabidka/skoda/octavia` |
| Karoserie | 7 | `/nabidka/{bodytype}` | `/nabidka/suv` |
| Cenové rozsahy | 5 | `/nabidka/{price}` | `/nabidka/do-200-tisic` |
| Města | 8 | `/nabidka/{city}` | `/nabidka/praha` |

**Shared template:** `components/web/VehicleLandingPage.tsx` (215 řádků)
- Struktura: JSON-LD → Breadcrumbs → Hero → AI Answer Box + Quick Facts → children slot → SEO text → FAQ → CTA → Related links (pill-style `relatedLinks` prop)

**Wrapper:** `components/web/BrandLandingContent.tsx` — generuje relatedLinks z jiných značek, body types, price ranges.

### 1.2 Parts landing pages (~124 statických)

| Typ | Počet | Route pattern | Příklad |
|-----|-------|---------------|---------|
| Kategorie | 11 | `/dily/kategorie/{cat}` | `/dily/kategorie/motory` |
| Značky | 17 | `/dily/znacka/{brand}` | `/dily/znacka/skoda` |
| Modely | ~24 | `/dily/znacka/{brand}/{model}` | `/dily/znacka/skoda/octavia` |
| Model+rok | ~72 | `/dily/znacka/{brand}/{model}/{rok}` | `/dily/znacka/skoda/octavia/2020` |

**Template:** `app/(web)/dily/znacka/[brand]/page.tsx` (200 řádků)
- Struktura: Breadcrumbs → Hero → Models grid → Categories grid → Top parts → SEO content → FAQ → Related brands

### 1.3 Informační a servisní stránky (8)

| Stránka | Route | Priorita (sitemap) |
|---------|-------|---------------------|
| Jak prodat auto | `/jak-prodat-auto` | 0.8 |
| Kolik stojí moje auto | `/kolik-stoji-moje-auto` | 0.8 |
| Prověrka vozidla | `/sluzby/proverka` | 0.7 |
| Financování | `/sluzby/financovani` | 0.7 |
| Pojištění | `/sluzby/pojisteni` | 0.7 |
| Chci prodat | `/chci-prodat` | 0.9 |
| Katalog nabídek | `/nabidka` | 0.9 |
| Porovnání | `/nabidka/porovnani` | — |

**Template:** `components/web/ServicePage.tsx` (155 řádků) — pro 3 service stránky
- Struktura: hero → steps → benefits → CTA slot → FAQ
- **BUG:** ZERO `<Link>` elementů, žádné cross-links (viz Task #24 P0-2)

### 1.4 Dynamické stránky

| Typ | Route pattern | Zdroj dat |
|-----|---------------|-----------|
| Vozidla (detail) | `/nabidka/{slug}` | DB: Vehicle/Listing |
| Profily makléřů | `/profil/{slug}` | DB: User (BROKER) |
| Makléři (tag landing) | `/makleri/{slug}` | DB: Tag (≥2 brokers) |
| Vrakoviště | `/dily/vrakoviste/{slug}` | DB: Partner (VRAKOVISTE) |

### 1.5 Hub/Index stránky

| Stránka | Route | Funkce |
|---------|-------|--------|
| Homepage | `/` | Master hub |
| Nabídka (katalog) | `/nabidka` | Vehicle hub — má cross-links na chci-prodat, sluzby, makleri |
| Shop | `/shop` | Parts hub |
| Inzerce | `/inzerce` | Inzertní hub |
| Makleri | `/makleri` | Broker hub |

**Celkem: ~180+ statických SEO stránek + dynamické stránky (vozidla, makléři, tagy, vrakoviště)**

---

## 2. Současný stav prolinkování

### 2.1 Co funguje dobře ✅

| Oblast | Stav | Detail |
|--------|------|--------|
| Vehicle landing → Vehicle landing (same type) | ✅ DOBRÉ | Každá stránka má `relatedLinks` na ostatní stránky STEJNÉHO typu (město→jiná města, značka→jiné značky) |
| Vehicle landing → Vehicle landing (cross-type) | ✅ ČÁSTEČNÉ | Brand pages linkují na body types + price ranges. City pages linkují na brands + body types + price ranges |
| Parts brand → Parts models | ✅ DOBRÉ | Model grid s klikitatelnými kartami |
| Parts brand → Parts categories | ✅ DOBRÉ | Categories grid pod modely |
| Parts brand → Other parts brands | ✅ DOBRÉ | Related brands sekce na konci |
| `/nabidka` hub → service pages | ✅ DOBRÉ | Cross-linking section: chci-prodat, sluzby/proverka, financovani, pojisteni, makleri, porovnani |
| Global navigation (Navbar+Footer) | ✅ DOBRÉ | Navbar: nabidka, makleri, chci-prodat, inzerce, dily. Footer: o-nas, kariera, kontakt, obchodni-podminky, etc. |
| Makleri tag pages → Related tags | ✅ DOBRÉ | `getRelatedTagsByCoOccurrence()` + `RelatedHashtags` component |
| Breadcrumbs | ✅ DOBRÉ | Všechny landing pages mají breadcrumbs zpět k parent hub |

### 2.2 Co CHYBÍ ❌

| Gap | Závažnost | Detail |
|-----|-----------|--------|
| **Vehicle landings ↛ Parts pages** | CRITICAL | Žádná stránka v `/nabidka/*` nelinkuje na `/dily/*`. Uživatel hledající "ojetá Škoda" nikdy nevidí "Díly pro Škodu" |
| **Parts pages ↛ Vehicle landings** | CRITICAL | Žádná stránka v `/dily/*` nelinkuje na `/nabidka/*`. Uživatel hledající "díly Škoda" nikdy nevidí "Ojetá Škoda" |
| **Info pages ↛ Landing pages** | HIGH | `/jak-prodat-auto` a `/kolik-stoji-moje-auto` linkují JEN na `/chci-prodat`. Near-dead-ends — veškerý PageRank teče do 1 stránky |
| **Service pages ↛ Anything** | CRITICAL | `ServicePage.tsx` nemá ŽÁDNÝ `<Link>`. Zero outgoing cross-links (viz Task #24 P0-2) |
| **Vehicle detail ↛ Services** | HIGH | `/nabidka/[slug]` detail nemá cross-links na prověrku, financování, pojištění (viz Task #24 P0-1) |
| **Vehicle landings ↛ Services** | MEDIUM | VehicleLandingPage nemá links na `/sluzby/*`. Jen CTA na `/chci-prodat` |
| **Vehicle landings ↛ Info pages** | MEDIUM | Žádný landing page nelinkuje na jak-prodat-auto nebo kolik-stoji-moje-auto |
| **Parts categories ↛ Parts brands** | MEDIUM | `/dily/kategorie/{cat}` nebyly plně analyzovány ale pravděpodobně chybí cross-links na brands |
| **Chci-prodat ↛ Alternatives** | MEDIUM | `/chci-prodat` nemá žádné outgoing links kromě breadcrumb (viz Task #24 P1-3) |
| **Profil makléře ↛ CTA** | LOW | `/profil/[slug]` nemá "Prodejte s tímto makléřem" CTA (viz Task #24 P1-4) |

### 2.3 Vizualizace link flow (BEFORE)

```
                    [Homepage]
                   /    |    \
                  /     |     \
           [/nabidka] [/makleri] [/chci-prodat] ← near dead-end
              |           |
     ┌────────┼────────┐  |
     ↓        ↓        ↓  ↓
  [brands] [cities] [body] [tag pages]
     ↕        ↕        ↕      ↕
  (within   (within  (within (related
   type)     type)    type)   tags)

  [/sluzby/*] ← ISLANDS: zero outgoing links
  [/jak-prodat-auto] → [/chci-prodat] ← dead-end chain
  [/kolik-stoji-moje-auto] → [/chci-prodat]

  [/dily/*] ← SEPARATE ECOSYSTEM: no bridge to /nabidka/*
     |
     ├── [/dily/znacka/*] ↔ models ↔ categories
     └── [/dily/kategorie/*]
```

**Problém:** 3 izolované ekosystémy (vehicle, parts, info/service) s minimálními mosty.

---

## 3. Topic Cluster strategie

### 3.1 Pillar-Cluster model

```
PILLAR: /nabidka (vehicle hub)
├── CLUSTER: /nabidka/skoda (brand)
│   ├── /nabidka/skoda/octavia (model)
│   ├── /nabidka/skoda/fabia (model)
│   └── /nabidka/skoda/superb (model)
├── CLUSTER: /nabidka/praha (city)
├── CLUSTER: /nabidka/suv (body type)
├── CLUSTER: /nabidka/do-200-tisic (price range)
└── BRIDGE → /dily/znacka/skoda (brand match)

PILLAR: /dily (parts hub — via /shop)
├── CLUSTER: /dily/znacka/skoda (parts brand)
│   ├── /dily/znacka/skoda/octavia (parts model)
│   │   ├── /dily/znacka/skoda/octavia/2015 (year)
│   │   ├── /dily/znacka/skoda/octavia/2018
│   │   └── /dily/znacka/skoda/octavia/2020
│   └── ...
├── CLUSTER: /dily/kategorie/motory (category)
└── BRIDGE → /nabidka/skoda (brand match)

PILLAR: /chci-prodat (sell hub)
├── SUPPORTING: /jak-prodat-auto (guide)
├── SUPPORTING: /kolik-stoji-moje-auto (tool)
├── SUPPORTING: /sluzby/proverka
├── SUPPORTING: /sluzby/financovani
├── SUPPORTING: /sluzby/pojisteni
└── BRIDGE → /nabidka (buy counterpart)
```

### 3.2 Bridge links — propojení ekosystémů

Klíčový princip: **Stejná značka/model = přirozený most.**

| Z ekosystému | Do ekosystému | Bridge link | Logika |
|--------------|---------------|-------------|--------|
| `/nabidka/skoda` | `/dily/znacka/skoda` | "Díly pro Škoda" | Stejná značka |
| `/nabidka/skoda/octavia` | `/dily/znacka/skoda/octavia` | "Díly pro Octavia" | Stejný model |
| `/dily/znacka/skoda` | `/nabidka/skoda` | "Ojetá Škoda" | Stejná značka |
| `/dily/znacka/skoda/octavia` | `/nabidka/skoda/octavia` | "Ojetá Octavia" | Stejný model |
| Vehicle landings (all) | `/sluzby/proverka` | "Prověrka vozidla" | Servisní doplněk |
| Vehicle landings (all) | `/sluzby/financovani` | "Financování" | Servisní doplněk |
| Service pages | Vehicle landings | "Nabídka vozidel" | Hlavní katalog |
| Info pages | Vehicle landings, services | Multiple links | Topic relevance |

---

## 4. Implementační plán

### FIX-A: Vehicle landing pages → Parts bridge + Services (CRITICAL)

**Soubor:** `components/web/VehicleLandingPage.tsx`

**Co:** Přidat novou sekci "Užitečné odkazy" (nebo rozšířit existující `relatedLinks`) s cross-ecosystem links.

**Implementace — Varianta 1: Nové props + nová sekce:**

Přidat nové optional props do `VehicleLandingPageProps`:
```tsx
interface VehicleLandingPageProps {
  // ... existing props
  /** Cross-ecosystem links to parts, services, etc. */
  crossLinks?: { label: string; href: string; description?: string }[];
}
```

Přidat novou sekci PŘED existující `relatedLinks` (mezi CTA a Related links, cca řádek 191):
```tsx
{/* Cross-ecosystem links */}
{crossLinks && crossLinks.length > 0 && (
  <section className="bg-gray-50 py-10 md:py-14">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Mohlo by vás zajímat
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {crossLinks.map((link, i) => (
          <Link
            key={i}
            href={link.href}
            className="flex flex-col p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all no-underline group"
          >
            <span className="font-medium text-gray-900 group-hover:text-orange-600">
              {link.label}
            </span>
            {link.description && (
              <span className="text-sm text-gray-500 mt-1">{link.description}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  </section>
)}
```

**Implementace — Varianta 2 (JEDNODUŠŠÍ): Rozšířit `relatedLinks` v individual pages:**

Místo změny VehicleLandingPage.tsx, přidat cross-links přímo do `relatedLinks` pole v každé stránce. `relatedLinks` už renderuje flex-wrap pill-style linky — stačí přidat víc items.

**Doporučení: Varianta 2** — méně kódu, využívá existující infrastrukturu. Přidat helper funkci pro generování cross-links.

**Nový helper:** `lib/seo-crosslinks.ts`
```tsx
import { PARTS_BRANDS } from "./seo-data";

interface RelatedLink { label: string; href: string }

/**
 * Generuje cross-ecosystem linky pro vehicle landing page.
 * Přidá: parts bridge (pokud existuje stejná značka), service links.
 */
export function getVehicleCrossLinks(options: {
  brandSlug?: string;
  modelSlug?: string;
}): RelatedLink[] {
  const links: RelatedLink[] = [];
  
  // Bridge: vehicle → parts (stejná značka)
  if (options.brandSlug) {
    const partsBrand = PARTS_BRANDS.find(b => b.slug === options.brandSlug);
    if (partsBrand) {
      if (options.modelSlug) {
        links.push({
          label: `Díly pro ${partsBrand.name} ${options.modelSlug}`,
          href: `/dily/znacka/${options.brandSlug}/${options.modelSlug}`,
        });
      }
      links.push({
        label: `Díly pro ${partsBrand.name}`,
        href: `/dily/znacka/${options.brandSlug}`,
      });
    }
  }
  
  // Service links
  links.push(
    { label: "Prověrka vozidla", href: "/sluzby/proverka" },
    { label: "Financování", href: "/sluzby/financovani" },
    { label: "Pojištění", href: "/sluzby/pojisteni" },
  );
  
  return links;
}

/**
 * Generuje cross-ecosystem linky pro parts landing page.
 * Přidá: vehicle bridge (pokud existuje stejná značka).
 */
export function getPartsCrossLinks(options: {
  brandSlug?: string;
  modelSlug?: string;
}): RelatedLink[] {
  const links: RelatedLink[] = [];
  
  // Bridge: parts → vehicle (stejná značka)
  if (options.brandSlug) {
    // Pozn: BRANDS import z seo-data by vytvořil cyklickou závislost
    // pokud by seo-data importoval z tohoto souboru. Značky testujeme přímo.
    if (options.modelSlug) {
      links.push({
        label: `Ojetá ${options.brandSlug} ${options.modelSlug}`,
        href: `/nabidka/${options.brandSlug}/${options.modelSlug}`,
      });
    }
    links.push({
      label: `Ojetá ${options.brandSlug} — všechny nabídky`,
      href: `/nabidka/${options.brandSlug}`,
    });
  }
  
  // General vehicle catalog
  links.push({ label: "Katalog ojetých vozidel", href: "/nabidka" });
  
  return links;
}
```

**Změny v individual page files:**

**a) Brand pages** (`app/(web)/nabidka/[brand]/page.tsx` nebo `BrandLandingContent.tsx`):
```tsx
import { getVehicleCrossLinks } from "@/lib/seo-crosslinks";

// V generování relatedLinks přidat:
const crossLinks = getVehicleCrossLinks({ brandSlug: brand.slug });
const allRelatedLinks = [...existingRelatedLinks, ...crossLinks];
```

**b) Model pages** (`app/(web)/nabidka/[brand]/[model]/page.tsx`):
```tsx
const crossLinks = getVehicleCrossLinks({ brandSlug, modelSlug });
const allRelatedLinks = [...existingRelatedLinks, ...crossLinks];
```

**c) City, body type, price pages** (nemají brand → jen service links):
```tsx
const crossLinks = getVehicleCrossLinks({}); // jen service links
const allRelatedLinks = [...existingRelatedLinks, ...crossLinks];
```

**d) Parts brand pages** (`app/(web)/dily/znacka/[brand]/page.tsx`):
- Přidat do "Další značky autodílů" sekce:
```tsx
const crossLinks = getPartsCrossLinks({ brandSlug: brand.slug });
// Renderovat jako další linky v related brands section nebo novou sekci
```

**e) Parts model pages** (`app/(web)/dily/znacka/[brand]/[model]/page.tsx`):
```tsx
const crossLinks = getPartsCrossLinks({ brandSlug, modelSlug });
```

**Rozsah:** ~15 řádků nový soubor `lib/seo-crosslinks.ts` + ~5 řádků per page file (16+ files)
**Priorita:** P0 — největší SEO impact (propojení 2 izolovaných ekosystémů)

---

### FIX-B: Info pages → Multiple destinations (HIGH)

**Soubory:**
- `app/(web)/jak-prodat-auto/page.tsx` (~50 řádků)
- `app/(web)/kolik-stoji-moje-auto/page.tsx` (similar)

**Problém:** Obě stránky linkují JEN na `/chci-prodat`. Jsou near-dead-ends — veškerý PageRank teče do 1 stránky.

**Implementace:** Přidat "Související články a nástroje" sekci na konec stránky:

```tsx
import Link from "next/link";

// Na konci stránky (před </main> nebo po posledním <section>):
<section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <h2 className="text-2xl font-bold text-gray-900 mb-6">
    Související články a nástroje
  </h2>
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <Link href="/kolik-stoji-moje-auto" className="...">
      Ocenění vozidla
    </Link>
    <Link href="/sluzby/proverka" className="...">
      Prověrka vozidla
    </Link>
    <Link href="/sluzby/financovani" className="...">
      Financování
    </Link>
    <Link href="/nabidka" className="...">
      Katalog ojetých vozidel
    </Link>
    <Link href="/makleri" className="...">
      Najít makléře
    </Link>
    <Link href="/sluzby/pojisteni" className="...">
      Pojištění vozidla
    </Link>
  </div>
</section>
```

**Efekt:** Z 1 outgoing link → 7+ outgoing links. Distribuce PageRank do celé site.
**Rozsah:** ~20 řádků per file (2 files)
**Priorita:** P1

---

### FIX-C: ServicePage.tsx cross-links (CRITICAL — viz Task #24 P0-2)

Toto je již detailně naplánováno v `plan-crosslinking-fixes-20260420.md` FIX P0-2. 

**Stručně:** Přidat `import Link`, nový `currentService` prop, cross-linking sekce po FAQ s linky na: ostatní 2 služby, /nabidka, /chci-prodat, /jak-prodat-auto.

**Rozsah:** ~25 řádků do ServicePage.tsx + 1 řádek per service page (3 files)
**Priorita:** P0

---

### FIX-D: Vehicle detail cross-links (CRITICAL — viz Task #24 P0-1)

Již detailně naplánováno v `plan-crosslinking-fixes-20260420.md` FIX P0-1.

**Stručně:** Přidat "Doplňkové služby" sekci do `/nabidka/[slug]/page.tsx` po Cebia+LoanCalculator sekcích. Linky na: prověrku, financování, pojištění.

**Rozsah:** ~30 řádků (2 render paths: vehicle + listing)
**Priorita:** P0

---

### FIX-E: Parts category pages → brand bridge (MEDIUM)

**Soubor:** `app/(web)/dily/kategorie/[category]/page.tsx`

**Co:** Přidat "Oblíbené značky pro {category}" sekci s linky na `/dily/znacka/{brand}`.

**Implementace:**
```tsx
import { PARTS_BRANDS } from "@/lib/seo-data";

// Na konci stránky:
<section>
  <h2>Oblíbené značky — {categoryName}</h2>
  <div className="flex flex-wrap gap-3">
    {PARTS_BRANDS.slice(0, 8).map(brand => (
      <Link key={brand.slug} href={`/dily/znacka/${brand.slug}`}>
        {brand.name}
      </Link>
    ))}
  </div>
</section>
```

**Rozsah:** ~15 řádků
**Priorita:** P2

---

### FIX-F: `/chci-prodat` → alternatives (MEDIUM — viz Task #24 P1-3)

Již naplánováno v `plan-crosslinking-fixes-20260420.md` FIX P1-3.

**Stručně:** Přidat "Nejste si jistí?" sekci po FAQ s linky na: jak-prodat-auto, kolik-stoji-moje-auto, sluzby/proverka, nabidka, makleri.

**Rozsah:** ~20 řádků
**Priorita:** P1

---

### FIX-G: Broker profile CTA (LOW — viz Task #24 P1-4)

Již naplánováno v `plan-crosslinking-fixes-20260420.md` FIX P1-4.
**Priorita:** P2

---

## 5. Nové reusable utility: `lib/seo-crosslinks.ts`

Centrální místo pro generování cross-ecosystem linků. Eliminuje duplikaci a zajistí konzistenci.

**Exporty:**
```tsx
// Vehicle → Parts + Services
getVehicleCrossLinks({ brandSlug?, modelSlug? }): RelatedLink[]

// Parts → Vehicle
getPartsCrossLinks({ brandSlug?, modelSlug? }): RelatedLink[]

// Info/Service → Related content
getInfoPageCrossLinks(currentPage: string): RelatedLink[]

// Generic service links
getServiceLinks(exclude?: string): RelatedLink[]
```

**Proč centrální utility:**
- 16+ stránek bude volat `getVehicleCrossLinks` — bez utility by se logika kopírovala
- Zajistí že bridge linky jsou symetrické (vehicle→parts A parts→vehicle)
- Snadné přidání nových bridge linků v budoucnu (marketplace, inzerce)

---

## 6. Sitemap alignment

Současný `app/sitemap.ts` (309 řádků) je **dobře strukturovaný** a zahrnuje všechny stránky. Priority odpovídají důležitosti:

| Typ | Priorita | Stav |
|-----|----------|------|
| Homepage | 1.0 | ✅ OK |
| /nabidka, /chci-prodat | 0.9 | ✅ OK |
| Brand landing pages | 0.8 | ✅ OK |
| Info pages (jak-prodat-auto, kolik-stoji-moje-auto) | 0.8 | ✅ OK |
| Model, city, body type, price pages | 0.7 | ✅ OK |
| Service pages | 0.7 | ✅ OK |
| Parts brands, categories | 0.6-0.7 | ✅ OK |
| Broker profiles, tags | 0.6 | ✅ OK |

**Žádné změny v sitemap nejsou potřeba** — sitemap správně indexuje všechny stránky. Problém je v interních linkách NA stránkách, ne v sitemapu.

---

## 7. Breadcrumbs alignment

Všechny VehicleLandingPage stránky mají breadcrumbs: `Domů → Nabídka → {Current}`.
Parts stránky mají: `Domů → Díly → Značka → {Brand} → {Model}`.

**Breadcrumbs jsou v pořádku.** Nepotřebují změny — fungují jako hierarchická navigace. Cross-linking je doplňková horizontální navigace.

---

## 8. Vizualizace link flow (AFTER)

```
                       [Homepage]
                      /    |    \
                     /     |     \
              [/nabidka]←→[/makleri]←→[/chci-prodat]
                  |    \              ↕       ↕
         ┌────────┼─────\────┐  [jak-prodat] [kolik-stoji]
         ↓        ↓      ↓   ↓      ↕           ↕
      [brands]  [cities] [body] [price]  ←→  [/sluzby/*]
         ↕        ↕        ↕     ↕               ↕
      (within   (within  (within (within    (cross-link
       type)     type)    type)   type)      to all)
         |                                       |
         |    ←── BRIDGE LINKS (FIX-A) ──→       |
         ↓                                       ↓
      [/dily/znacka/*] ←→ [/dily/kategorie/*]
         ↕                       ↕
      [/dily/znacka/*/model]  [brand links]
         ↕
      [/dily/znacka/*/model/rok]
```

**Klíčový rozdíl:** 3 izolované ekosystémy jsou nyní propojené přes bridge links (vehicle ↔ parts) a service cross-links (vehicle ↔ services ↔ info pages).

---

## 9. Implementační pořadí

| Pořadí | Fix | Priorita | Rozsah | Soubory |
|--------|-----|----------|--------|---------|
| 1 | FIX-C: ServicePage.tsx cross-links | P0 | ~25 řádků | `ServicePage.tsx` + 3 service pages |
| 2 | FIX-D: Vehicle detail cross-links | P0 | ~30 řádků | `nabidka/[slug]/page.tsx` |
| 3 | FIX-A: Vehicle↔Parts bridge + service pills | P0 | ~60 řádků | `lib/seo-crosslinks.ts` + 16+ page files |
| 4 | FIX-B: Info pages → multiple destinations | P1 | ~40 řádků | `jak-prodat-auto`, `kolik-stoji-moje-auto` |
| 5 | FIX-F: /chci-prodat alternatives | P1 | ~20 řádků | `chci-prodat/page.tsx` |
| 6 | FIX-E: Parts category → brand bridge | P2 | ~15 řádků | `dily/kategorie/[category]/page.tsx` |
| 7 | FIX-G: Broker profile CTA | P2 | ~15 řádků | `profil/[slug]/ProfileClient.tsx` |

**Celkový rozsah:** ~205 řádků nového kódu + 1 nový soubor (`lib/seo-crosslinks.ts`)

---

## 10. STOP pravidla pro implementátora

### STOP-1: Build musí projít
```bash
npm run build 2>&1 | tail -20
# Pokud FAIL → opravit PŘED pokračováním
```

### STOP-2: Žádné nové runtime errory
- Cross-links musí být statické (no DB queries, no async)
- Linky musí vést na existující routes (ověřit existence page.tsx)
- `Link` import musí být z `next/link` (ne HTML `<a>`)

### STOP-3: Testovatelnost
Po každém FIX-u musí být testovatelné:
- Manuálně: otevřít stránku → ověřit viditelnost nových linků
- Chrome test: proklikat nové linky → ověřit že vedou na správné stránky (ne 404)

### STOP-4: Rozsah
- NEPŘIDÁVAT nové stránky
- NEPŘIDÁVAT nové features (jen linky)
- NEMĚNIT existující layout/design — jen přidat sekce
- NEMĚNIT sitemap.ts (není potřeba)

---

## 11. Očekávaný SEO impact

### Metriky

| Metrika | BEFORE | AFTER |
|---------|--------|-------|
| Cross-ecosystem links (vehicle↔parts) | 0 | ~130+ (16 brand pages × 2 directions + model pages) |
| Service links z landing pages | 0 | ~48+ (all vehicle landings × 3 services) |
| Info page outgoing links | 2 (jen /chci-prodat) | 14+ (7 per page × 2 pages) |
| ServicePage outgoing links | 0 | 15+ (5 per page × 3 pages) |
| /chci-prodat outgoing links | 0 | 5+ |
| Total new internal links | — | **~210+** |

### SEO efekt
1. **PageRank distribution:** Info a service stránky přestanou být dead-ends → PageRank se rozloží rovnoměrněji
2. **Crawl depth:** Parts stránky budou dosažitelné z vehicle stránek (a naopak) bez nutnosti projít homepage
3. **Topical relevance:** Google lépe pochopí vztah mezi "ojetá Škoda" a "díly Škoda" → posílení obou skupin v SERPech
4. **User engagement:** Uživatel na vehicle detail uvidí relevant services → nižší bounce rate, vyšší page depth
5. **Long-tail coverage:** Cross-ecosystem links vytvoří path pro Googlebot k proindexování hlubších parts stránek (model+rok)

---

## 12. Závislosti na jiných tasks

| Task | Závislost | Detail |
|------|-----------|--------|
| Task #24 (cross-linking fixes) | **OVERLAPS** — FIX-C, FIX-D, FIX-F, FIX-G jsou již naplánované tam | Implementátor by měl vzít oba plány a sloučit. Tento plán rozšiřuje Task #24 o FIX-A (vehicle↔parts bridge), FIX-B (info pages), FIX-E (parts categories) |
| Task #22 (cross-linking audit) | **SOURCE** — tento plán je postaven na auditech z Task #22 | Viz `audit-crosslinking-20260420.md` |
| Task #23 (inzerce loading) | Nezávislý | Ale FIX-A bridge links předpokládají že vehicle+parts pages fungují |

---

## Shrnutí

**180+ SEO stránek** ve 3 izolovaných ekosystémech (vehicle, parts, info/services) potřebuje **~210+ nových interních linků** přes 7 implementačních fixů. Centrální `lib/seo-crosslinks.ts` utility zajistí konzistentní a symetrické bridge linky. P0 fixy (ServicePage, vehicle detail, vehicle↔parts bridge) mají největší SEO impact a měly by být implementovány jako první.
