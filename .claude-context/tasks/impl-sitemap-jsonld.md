# Implementace — Sitemap & JSON-LD doplnění

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Zdroj:** plan-sitemap-jsonld-audit.md  
**Status:** ČEKÁ NA IMPLEMENTACI

---

## Přehled úprav

| Fáze | Soubory | Popis |
|------|---------|-------|
| 1 | 3 stránky služeb | Napojit existující `generateServiceJsonLd` |
| 2 | `app/sitemap.ts` | Přidat chybějící stránky |
| 3 | `lib/seo.ts` | 4 nové JSON-LD generátory |
| 4 | 7 stránek | Napojit nové + existující generátory |

**Celkem:** 1 nový kód v lib/seo.ts + 11 souborů k úpravě

---

## FÁZE 1: Napojit Service JSON-LD na 3 stránky služeb

`generateServiceJsonLd` v `lib/seo.ts:148-163` existuje, ale ŽÁDNÁ stránka ho nepoužívá.

### 1.1 — `app/(web)/sluzby/proverka/page.tsx`

**Řádek 2 — přidat import:**
```typescript
import { generateServiceJsonLd } from "@/lib/seo";
```

**Řádek 83-99 — nahradit celou funkci `ProverkaPage`:**
```typescript
export default function ProverkaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateServiceJsonLd({
            name: "Prověrka vozidla",
            description: "Kompletní prověrka historie a technického stavu vozidla. Kontrola havárií, stočení km, zástav a servisní historie. Report do 30 minut.",
            url: "https://carmakler.cz/sluzby/proverka",
            areaServed: "CZ",
          }),
        }}
      />
      <ServicePage
        hero={{
          title: "Kupte auto s jistotou",
          highlight: "s jistotou",
          subtitle:
            "Zjistěte pravdu o autě, než za něj zaplatíte. Report do 30 minut.",
        }}
        steps={steps}
        benefits={benefits}
        cta={<ProverkaForm />}
        faq={faq}
        breadcrumbLabel="Prověrka vozidla"
        currentService="proverka"
      />
    </>
  );
}
```

### 1.2 — `app/(web)/sluzby/financovani/page.tsx`

**Řádek 2 — přidat import:**
```typescript
import { generateServiceJsonLd } from "@/lib/seo";
```

**Řádek 84-101 — nahradit celou funkci `FinancovaniPage`:**
```typescript
export default function FinancovaniPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateServiceJsonLd({
            name: "Financování auta",
            description: "Auto na splátky bez zálohy, úrok od 3,9 %. Online schválení do 30 minut, bez návštěvy pobočky. Porovnání nabídek bank.",
            url: "https://carmakler.cz/sluzby/financovani",
            areaServed: "CZ",
          }),
        }}
      />
      <ServicePage
        hero={{
          title: "Auto na splátky do 30 minut",
          highlight: "do 30 minut",
          subtitle:
            "Bez zálohy, úrok od 3,9 %, schválení online. Porovnáme nabídky bank za vás.",
        }}
        steps={steps}
        benefits={benefits}
        cta={<FinancovaniCalc />}
        faq={faq}
        breadcrumbLabel="Financování"
        currentService="financovani"
      />
    </>
  );
}
```

### 1.3 — `app/(web)/sluzby/pojisteni/page.tsx`

**Řádek 2 — přidat import:**
```typescript
import { generateServiceJsonLd } from "@/lib/seo";
```

**Řádek 84-101 — nahradit celou funkci `PojisteniPage`:**
```typescript
export default function PojisteniPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateServiceJsonLd({
            name: "Pojištění auta",
            description: "Porovnání povinného ručení i havarijního pojištění od všech pojišťoven v ČR. Sjednání online za 3 minuty, zdarma.",
            url: "https://carmakler.cz/sluzby/pojisteni",
            areaServed: "CZ",
          }),
        }}
      />
      <ServicePage
        hero={{
          title: "Povinné ručení i havarijní online",
          highlight: "online",
          subtitle:
            "Porovnáme všechny pojišťovny v ČR a najdeme tu nejlevnější. Sjednáte za 3 minuty, zdarma.",
        }}
        steps={steps}
        benefits={benefits}
        cta={<PojisteniForm />}
        faq={faq}
        breadcrumbLabel="Pojištění"
        currentService="pojisteni"
      />
    </>
  );
}
```

---

## FÁZE 2: Doplnit chybějící stránky do sitemap

**Soubor:** `app/sitemap.ts`

### 2.1 — Rozšířit statické stránky (řádek 94-131, za `zasady-cookies`)

**Za řádek 131 (zavírací `];` pole `staticPages`) — vložit PŘED `];` tyto položky:**

```typescript
    // Chybějící veřejné stránky
    {
      url: `${BASE_URL}/jak-to-funguje`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/marketplace`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/marketplace/apply`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/inzerce/katalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/shop/katalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/dily/katalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/shop/vraceni-zbozi`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/shop/reklamace`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/nabidka/porovnani`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
```

### 2.2 — Přidat dynamické autobazar stránky (za `blogPages` blok, před `return`)

**Za řádek 315 (konec blogPages bloku), PŘED řádek 317 (`return [`):**

```typescript
  // Dynamické stránky — autobazary (partner landing pages)
  let bazarPages: MetadataRoute.Sitemap = [];
  try {
    const bazars = await prisma.partner.findMany({
      where: { status: "AKTIVNI_PARTNER", type: "AUTOBAZAR" },
      select: { slug: true, updatedAt: true },
    });

    bazarPages = bazars.map((b) => ({
      url: `${BASE_URL}/bazar/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB nedostupná
  }

  // Dynamické stránky — inzeráty (aktivní listings)
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    });

    listingPages = listings.map((l) => ({
      url: `${BASE_URL}/inzerce/katalog/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // DB nedostupná
  }
```

### 2.3 — Přidat do return array

**Řádek 317-333 — nahradit return:**

```typescript
  return [
    ...staticPages,
    ...brandPages,
    ...modelPages,
    ...bodyTypePages,
    ...pricePages,
    ...cityPages,
    ...partsCategoryPages,
    ...partsBrandPages,
    ...partsModelPages,
    ...partsModelYearPages,
    ...vehiclePages,
    ...brokerPages,
    ...tagPages,
    ...partnerPages,
    ...bazarPages,
    ...listingPages,
    ...blogPages,
  ];
```

**POZNÁMKA:** Redirect stránky (`/dodavatel/[slug]`, `/h/[slug]`, `/tag/[slug]`, `/makler/[slug]`) NESMÍ být v sitemap — jsou to 301 redirecty.

---

## FÁZE 3: Nové JSON-LD generátory v `lib/seo.ts`

**Přidat na konec souboru `lib/seo.ts` (za řádek 511):**

```typescript

// --- Nové generátory (sitemap-jsonld-audit FÁZE 3) ---

/**
 * LocalBusiness JSON-LD — pro /kontakt a partner stránky.
 * Schema.org subtype AutomotiveBusiness.
 */
export interface LocalBusinessJsonLdData {
  name: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
  };
  geo?: { latitude: number; longitude: number };
  openingHours?: string;
  image?: string;
  priceRange?: string;
}

export function generateLocalBusinessJsonLd(biz: LocalBusinessJsonLdData): string {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutomotiveBusiness",
    name: biz.name,
    description: biz.description,
    url: biz.url,
  };

  if (biz.telephone) jsonLd.telephone = biz.telephone;
  if (biz.email) jsonLd.email = biz.email;
  if (biz.image) jsonLd.image = biz.image;
  if (biz.priceRange) jsonLd.priceRange = biz.priceRange;
  if (biz.openingHours) jsonLd.openingHours = biz.openingHours;

  if (biz.address) {
    jsonLd.address = {
      "@type": "PostalAddress",
      addressCountry: "CZ",
      ...(biz.address.streetAddress && { streetAddress: biz.address.streetAddress }),
      ...(biz.address.addressLocality && { addressLocality: biz.address.addressLocality }),
      ...(biz.address.addressRegion && { addressRegion: biz.address.addressRegion }),
      ...(biz.address.postalCode && { postalCode: biz.address.postalCode }),
    };
  }

  if (biz.geo) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: biz.geo.latitude,
      longitude: biz.geo.longitude,
    };
  }

  return JSON.stringify(jsonLd);
}

/**
 * AggregateRating + Review[] JSON-LD — pro /recenze.
 * Emituje Organization s aggregateRating a individuálními reviews.
 */
export interface ReviewJsonLdData {
  author: string;
  reviewBody: string;
  ratingValue: number;
  datePublished?: string;
}

export interface AggregateRatingJsonLdData {
  organizationName: string;
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
  reviews?: ReviewJsonLdData[];
}

export function generateAggregateRatingJsonLd(data: AggregateRatingJsonLdData): string {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.organizationName,
    url: "https://carmakler.cz",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: data.ratingValue,
      reviewCount: data.reviewCount,
      bestRating: data.bestRating ?? 5,
      worstRating: data.worstRating ?? 1,
    },
  };

  if (data.reviews && data.reviews.length > 0) {
    jsonLd.review = data.reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewBody: r.reviewBody,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.ratingValue,
        bestRating: data.bestRating ?? 5,
      },
      ...(r.datePublished && { datePublished: r.datePublished }),
    }));
  }

  return JSON.stringify(jsonLd);
}

/**
 * JobPosting JSON-LD — pro /kariera.
 * Generuje jednu pracovní pozici pro Google for Jobs.
 */
export interface JobPostingJsonLdData {
  title: string;
  description: string;
  location: string;
  employmentType?: string;
  baseSalary?: { minValue: number; maxValue: number; currency?: string };
  datePosted?: string;
  validThrough?: string;
}

export function generateJobPostingJsonLd(job: JobPostingJsonLdData): string {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    hiringOrganization: {
      "@type": "Organization",
      name: "Carmakler",
      sameAs: "https://carmakler.cz",
      logo: "https://carmakler.cz/brand/logo-color.png",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "CZ",
      },
    },
    datePosted: job.datePosted ?? new Date().toISOString().slice(0, 10),
  };

  if (job.employmentType) jsonLd.employmentType = job.employmentType;
  if (job.validThrough) jsonLd.validThrough = job.validThrough;

  if (job.baseSalary) {
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.baseSalary.currency ?? "CZK",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.baseSalary.minValue,
        maxValue: job.baseSalary.maxValue,
        unitText: "MONTH",
      },
    };
  }

  return JSON.stringify(jsonLd);
}

/**
 * Person JSON-LD — pro /profil/[slug] (broker profile pages).
 */
export interface PersonJsonLdData {
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  worksFor?: string;
  address?: string;
  description?: string;
}

export function generatePersonJsonLd(person: PersonJsonLdData): string {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    url: person.url,
    worksFor: {
      "@type": "Organization",
      name: person.worksFor ?? "Carmakler",
      url: "https://carmakler.cz",
    },
  };

  if (person.image) jsonLd.image = person.image;
  if (person.jobTitle) jsonLd.jobTitle = person.jobTitle;
  if (person.description) jsonLd.description = person.description;
  if (person.address) {
    jsonLd.address = {
      "@type": "PostalAddress",
      addressLocality: person.address,
      addressCountry: "CZ",
    };
  }

  return JSON.stringify(jsonLd);
}
```

---

## F��ZE 4: Napojit JSON-LD na stránky bez něj

### 4.1 — `app/(web)/kariera/page.tsx` — JobPosting

**POZOR:** Stránka je `"use client"` (řádek 1). JSON-LD nelze přidat přímo — potřeba buď:
- (A) Vytvořit `kariera/layout.tsx` s metadata + JSON-LD (DOPORUČENO — stejný pattern jako recenze)
- (B) Přidat JSON-LD inline do client componenty (funguje, ale metadata export nelze)

**Doporučeno: Vytvořit `app/(web)/kariera/layout.tsx`:**

```typescript
import type { Metadata } from "next";
import { generateJobPostingJsonLd } from "@/lib/seo";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Kariéra — staňte se automakléřem",
  description:
    "Hledáme automakléře v Praze, Brně a dalších městech. Flexibilní práce, výdělek bez stropu, kompletní školení.",
  alternates: pageCanonical("/kariera"),
};

const positions = [
  {
    title: "Automakléř",
    location: "Praha",
    description: "Pomáhejte klientům s prodejem a nákupem vozidel. Zajišťujte kompletní servis od prvního kontaktu po předání klíčů.",
    salary: { minValue: 40000, maxValue: 80000 },
  },
  {
    title: "Automakléř",
    location: "Brno",
    description: "Pomáhejte klientům s prodejem a nákupem vozidel. Zajišťujte kompletní servis od prvního kontaktu po předání klíčů.",
    salary: { minValue: 40000, maxValue: 80000 },
  },
  {
    title: "Regionální manažer",
    location: "Celá ČR",
    description: "Řiďte tým makléřů a rozvíjejte region. Zodpovídejte za výkon, kvalitu služeb a růst v přiděleném regionu.",
    salary: { minValue: 50000, maxValue: 100000 },
  },
];

export default function KarieraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {positions.map((pos, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJobPostingJsonLd({
              title: pos.title,
              description: pos.description,
              location: pos.location,
              employmentType: "CONTRACTOR",
              baseSalary: pos.salary,
            }),
          }}
        />
      ))}
      {children}
    </>
  );
}
```

**DŮLEŽITÉ:** Pokud se vytvoří `kariera/layout.tsx` s `metadata`, ODSTRANIT duplicitní metadata z `kariera/page.tsx` (pokud tam je — aktuálně tam není, protože je `"use client"`).

### 4.2 — `app/(web)/recenze/layout.tsx` — vylepšit AggregateRating

Stávající JSON-LD (řádky 20-31) je manuální inline objekt. Nahradit voláním nového generátoru.

**Řádek 1 — přidat import:**
```typescript
import { generateAggregateRatingJsonLd } from "@/lib/seo";
```

**Řádky 20-31 — nahradit `reviewJsonLd` proměnnou:**
```typescript
const reviewJsonLdStr = generateAggregateRatingJsonLd({
  organizationName: "CarMakléř",
  ratingValue: 4.8,
  reviewCount: 8,
  reviews: [
    { author: "Jana K.", reviewBody: "Prodej proběhl hladce a rychle. Auto bylo prodané za 12 dní.", ratingValue: 5 },
    { author: "Martin D.", reviewBody: "Konečně někdo, kdo se o všechno postará.", ratingValue: 5 },
    { author: "Lucie N.", reviewBody: "Makléř byl profesionální, vždy dostupný.", ratingValue: 5 },
  ],
});
```

**Řádek 42 — nahradit `JSON.stringify(reviewJsonLd)`:**
```typescript
dangerouslySetInnerHTML={{ __html: reviewJsonLdStr }}
```

### 4.3 — `app/(web)/inzerce/page.tsx` — WebPage JSON-LD

**Zjistit zda je Server nebo Client Component.** Pokud Server Component:

**Přidat import:**
```typescript
import { generateWebPageJsonLd } from "@/lib/seo";
```

**Na začátek return JSX přidat:**
```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: generateWebPageJsonLd({
      name: "Inzerce vozidel",
      description: "Prodejte auto online. Inzertní platforma CarMakléř pro soukromé prodejce, autobazary a dealery.",
      url: "https://carmakler.cz/inzerce",
    }),
  }}
/>
```

### 4.4 — `app/(web)/shop/page.tsx` — WebPage JSON-LD

**Přidat import + script tag (stejný pattern):**
```typescript
import { generateWebPageJsonLd } from "@/lib/seo";
```

```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: generateWebPageJsonLd({
      name: "Eshop autodíly",
      description: "Nové i použité autodíly z českých vrakovišť. Hledejte podle VIN, značky nebo kategorie.",
      url: "https://carmakler.cz/shop",
    }),
  }}
/>
```

### 4.5 — `app/(web)/profil/[slug]/page.tsx` — Person JSON-LD

Stránka již má JSON-LD. Přidat Person JSON-LD vedle stávajícího.

**Přidat import:**
```typescript
import { generatePersonJsonLd } from "@/lib/seo";
```

**V komponentě, kde se renderuje profil, přidat script tag s daty z brokera:**
```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: generatePersonJsonLd({
      name: `${broker.firstName} ${broker.lastName}`,
      url: `https://carmakler.cz/profil/${broker.slug}`,
      image: broker.avatar || undefined,
      jobTitle: "Automakléř",
      address: broker.region || undefined,
    }),
  }}
/>
```

### 4.6 — `app/(web)/bazar/[slug]/page.tsx` — LocalBusiness JSON-LD

**Přidat import:**
```typescript
import { generateLocalBusinessJsonLd } from "@/lib/seo";
```

**V komponentě, kde se renderují partner data, přidat:**
```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: generateLocalBusinessJsonLd({
      name: partner.name,
      description: partner.description || `Autobazar ${partner.name} — ověřený partner CarMakléř.`,
      url: `https://carmakler.cz/bazar/${partner.slug}`,
      telephone: partner.phone || undefined,
      email: partner.email || undefined,
      address: partner.city ? {
        streetAddress: partner.address || undefined,
        addressLocality: partner.city,
        addressRegion: partner.region || undefined,
        postalCode: partner.zip || undefined,
      } : undefined,
      geo: partner.latitude && partner.longitude ? {
        latitude: partner.latitude,
        longitude: partner.longitude,
      } : undefined,
    }),
  }}
/>
```

### 4.7 — `app/(web)/makleri/page.tsx` — ItemList JSON-LD

**Přidat import:**
```typescript
import { generateItemListJsonLd } from "@/lib/seo";
```

**Implementátor musí zkontrolovat, zda stránka načítá seznam makléřů.** Pokud ano, přidat:
```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: generateItemListJsonLd(
      brokers.map((b) => `https://carmakler.cz/profil/${b.slug}`)
    ),
  }}
/>
```

---

## STOP kritéria

1. [ ] `/sluzby/proverka` má Service JSON-LD v HTML source
2. [ ] `/sluzby/financovani` má Service JSON-LD v HTML source
3. [ ] `/sluzby/pojisteni` má Service JSON-LD v HTML source
4. [ ] `app/sitemap.ts` obsahuje jak-to-funguje, marketplace, marketplace/apply, inzerce/katalog, shop/katalog, dily/katalog, shop/vraceni-zbozi, shop/reklamace, nabidka/porovnani
5. [ ] `app/sitemap.ts` obsahuje dynamické bazarPages a listingPages
6. [ ] `lib/seo.ts` má 4 nové generátory: `generateLocalBusinessJsonLd`, `generateAggregateRatingJsonLd`, `generateJobPostingJsonLd`, `generatePersonJsonLd`
7. [ ] `/kariera` má JobPosting JSON-LD (přes layout.tsx)
8. [ ] `/recenze` layout používá `generateAggregateRatingJsonLd` s reviews
9. [ ] `npm run build` projde bez chyb
10. [ ] Žádné redirect stránky v sitemap (dodavatel, h, tag, makler jsou 301)

---

## Pořadí implementace (doporučení)

1. **FÁZE 3 první** — přidej generátory do `lib/seo.ts` (na ně závisí vše ostatní)
2. **FÁZE 1** — napoj Service JSON-LD na 3 služby (nejjednodušší, quick win)
3. **FÁZE 2** — doplň sitemap
4. **FÁZE 4** — napoj zbylé stránky (kariera layout, recenze upgrade, inzerce, shop, profil, bazar, makleri)

---

## Soubory k vytvoření

| # | Soubor | Popis |
|---|--------|-------|
| 1 | `app/(web)/kariera/layout.tsx` | Layout s metadata + JobPosting JSON-LD |

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 2 | `lib/seo.ts` | +4 generátory (~180 řádků) |
| 3 | `app/sitemap.ts` | +9 statických URL, +2 dynamické skupiny |
| 4 | `app/(web)/sluzby/proverka/page.tsx` | +import, wrap v <> s Service JSON-LD |
| 5 | `app/(web)/sluzby/financovani/page.tsx` | +import, wrap v <> s Service JSON-LD |
| 6 | `app/(web)/sluzby/pojisteni/page.tsx` | +import, wrap v <> s Service JSON-LD |
| 7 | `app/(web)/recenze/layout.tsx` | Nahradit inline JSON-LD za generateAggregateRatingJsonLd |
| 8 | `app/(web)/inzerce/page.tsx` | +WebPage JSON-LD |
| 9 | `app/(web)/shop/page.tsx` | +WebPage JSON-LD |
| 10 | `app/(web)/profil/[slug]/page.tsx` | +Person JSON-LD |
| 11 | `app/(web)/bazar/[slug]/page.tsx` | +LocalBusiness JSON-LD |
| 12 | `app/(web)/makleri/page.tsx` | +ItemList JSON-LD |

---

*Připraveno: 2026-04-26*  
*Copy-paste ready pro implementátora*
