# SSR Migrace — Faze 5: Katalogy s filtry

**Datum:** 2026-05-07
**Rozsah:** 2 stranky k migraci, 1 sdileny client component, ~4-5 hodin prace
**Zavislost:** Zadna (nezavisi na predchozich fazich)
**Reference:** `app/(web)/nabidka/page.tsx` — vzorovy SSR katalog s filtry

---

## Prehled stranek

| Stranka | Radku | Aktualni stav | Plan |
|---------|-------|---------------|------|
| `app/(web)/inzerce/katalog/page.tsx` | 9 | JIZ SSR (redirect na /nabidka) | **ZADNA PRACE** |
| `app/(web)/shop/katalog/page.tsx` | 355 | "use client", fetch `/api/parts` | SSR + client island |
| `app/(web)/dily/katalog/page.tsx` | 372 | "use client", fetch `/api/parts` | SSR + client island |

**Skutecny rozsah:** 2 stranky + 1 sdileny client component.

---

## Soubor 1: `app/(web)/inzerce/katalog/page.tsx`

### Aktualni stav (9 radku)
```tsx
import { redirect } from "next/navigation";
export default function InzerceKatalogPage() {
  redirect("/nabidka");
}
```

### Verdikt
**JIZ SSR.** Jen redirect, zadny "use client". **Zadna prace.**

---

## Soubor 2: `app/(web)/shop/katalog/page.tsx` (355 radku)

### Aktualni stav
- Cela stranka je "use client"
- Pouziva `useSearchParams()` + `useRouter()` + `useState` pro filtry
- Client-side fetch na `/api/parts?...` pres `useCallback` + `useEffect`
- **Filtry:** category tabs (7 kategorii), brand select (8 znacek), condition select (4 stavy), price range (min/max), sort select (4 moznosti), inStock checkbox
- **Paginace:** button `onClick` s `setPage()` — NE Link-based
- **Komponenty:** `ProductCard`, `Tabs`, `Select`, `Input`, `Button`
- **Helper funkce:** `conditionToStars()` — prevod condition na cislo hvezd

### Plan

1. **Vytvorit** `components/web/PartsFilters.tsx` — sdileny client component pro filtry (pouzity i pro dily/katalog)
2. **Prepsat** `app/(web)/shop/katalog/page.tsx` na Server Component s Prisma query

### Architektura (SSR page + client island)

```
shop/katalog/page.tsx (SERVER)
  |— metadata export (SEO)
  |— revalidate = 300 (ISR)
  |— searchParams: Promise<Record<string, string>>
  |— Prisma query (prevzata z /api/parts GET handler)
  |— JSON-LD structured data
  |
  |— <PartsFilters variant="shop" resultCount={total} />  (CLIENT ISLAND)
  |— <ProductCard> grid                                     (SERVER — static render)
  |— Link-based pagination                                  (SERVER — <Link> components)
```

### Novy soubor: `components/web/PartsFilters.tsx`

```tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";

const tabs = [
  { value: "vse", label: "Vse" },
  { value: "ENGINE", label: "Motor" },
  { value: "BODY", label: "Karoserie" },
  { value: "BRAKES", label: "Brzdy" },
  { value: "SUSPENSION", label: "Podvozek" },
  { value: "ELECTRICAL", label: "Elektro" },
  { value: "INTERIOR", label: "Interior" },
];

const brandOptions = [
  { value: "Skoda", label: "Skoda" },
  { value: "Volkswagen", label: "Volkswagen" },
  { value: "BMW", label: "BMW" },
  { value: "Audi", label: "Audi" },
  { value: "Mercedes-Benz", label: "Mercedes-Benz" },
  { value: "Hyundai", label: "Hyundai" },
  { value: "Toyota", label: "Toyota" },
  { value: "Ford", label: "Ford" },
];

const conditionOptions = [
  { value: "", label: "Vse" },
  { value: "NEW", label: "Nove" },
  { value: "USED_GOOD", label: "Pouzite — velmi dobry" },
  { value: "USED_FAIR", label: "Pouzite — dobry" },
  { value: "REFURBISHED", label: "Repasovane" },
];

const partTypeOptions = [
  { value: "", label: "Vse" },
  { value: "USED", label: "Pouzite" },
  { value: "NEW", label: "Nove" },
  { value: "AFTERMARKET", label: "Aftermarket" },
];

const sortOptions = [
  { value: "newest", label: "Nejnovejsi" },
  { value: "cheapest", label: "Nejlevnejsi" },
  { value: "expensive", label: "Nejdrazsi" },
  { value: "popular", label: "Nejoblibenejsi" },
];

interface PartsFiltersProps {
  variant: "shop" | "dily";
  resultCount: number;
}

export function PartsFilters({ variant, resultCount }: PartsFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page"); // reset strankovani pri zmene filtru
      const basePath = variant === "dily" ? "/dily/katalog" : "/shop/katalog";
      router.push(`${basePath}?${params.toString()}`);
    },
    [searchParams, router, variant]
  );

  const activeTab = searchParams.get("category") || "vse";

  return (
    <>
      {/* Category tabs */}
      <div className="mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(val) => updateParam("category", val === "vse" ? "" : val)}
        />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm mb-6 sm:mb-8">
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-end",
          variant === "dily" ? "lg:grid-cols-7" : "lg:grid-cols-5"
        )}>
          <Select label="Znacka vozu" placeholder="Vsechny znacky"
            options={brandOptions}
            value={searchParams.get("brand") || ""}
            onChange={(e) => updateParam("brand", e.target.value)} />

          {/* condition select — jen pro shop variant */}
          {variant === "shop" && (
            <Select label="Stav" placeholder="Vse"
              options={conditionOptions}
              value={searchParams.get("condition") || ""}
              onChange={(e) => updateParam("condition", e.target.value)} />
          )}

          {/* partType + manufacturer — jen pro dily variant */}
          {variant === "dily" && (
            <>
              <Select label="Typ dilu" placeholder="Vse"
                options={partTypeOptions}
                value={searchParams.get("partType") || ""}
                onChange={(e) => updateParam("partType", e.target.value)} />
              <Input label="Vyrobce" placeholder="TRW, Bosch..."
                value={searchParams.get("manufacturer") || ""}
                onChange={(e) => updateParam("manufacturer", e.target.value)} />
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Input label="Cena od" placeholder="0" type="number"
              value={searchParams.get("minPrice") || ""}
              onChange={(e) => updateParam("minPrice", e.target.value)} />
            <Input label="Cena do" placeholder="50 000" type="number"
              value={searchParams.get("maxPrice") || ""}
              onChange={(e) => updateParam("maxPrice", e.target.value)} />
          </div>

          <Select label="Razeni" options={sortOptions}
            value={searchParams.get("sort") || "newest"}
            onChange={(e) => updateParam("sort", e.target.value)} />

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
              Dostupnost
            </span>
            <label className="flex items-center gap-2 cursor-pointer py-3">
              <input type="checkbox"
                checked={searchParams.get("inStock") === "true"}
                onChange={(e) => updateParam("inStock", e.target.checked ? "true" : "")}
                className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
              <span className="text-[15px] font-medium text-gray-700">Pouze skladem</span>
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
```

**POZNAMKA:** `cn()` import z `@/lib/utils` nutny pridat. Diakritika v labelech (Znacka, Skoda atd.) musi byt zachovana s diakritikou v realne implementaci — plan pouziva ASCII pro jednoduchost.

**Klic:** `updateParam()` pouziva `router.push()` pro navigaci — kazda zmena filtru vytvori novou URL, coz triggeruje SSR re-render. Reset `page` param pri zmene filtru (radek "params.delete('page')").

### Upraveny soubor: `app/(web)/shop/katalog/page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/web/ProductCard";
import { PartsFilters } from "@/components/web/PartsFilters";
import { Button } from "@/components/ui/Button";
import { pageCanonical } from "@/lib/canonical";

export const revalidate = 300; // ISR: 5 minut

export const metadata: Metadata = {
  title: "Katalog dilu a prislusenstvi",
  description: "Prohlednete si nabidku autodilu a prislusenstvi. Nove i pouzite dily s garanci kvality.",
  openGraph: {
    title: "Katalog dilu | CarMakler",
    description: "Autodily a prislusenstvi — nove, pouzite i repasovane. Rychle doruceni.",
  },
  alternates: pageCanonical("/shop/katalog"),
};

// Helper: condition -> stars pro ProductCard
function conditionToStars(condition: string): number | undefined {
  switch (condition) {
    case "NEW": return undefined;
    case "USED_GOOD": return 4;
    case "USED_FAIR": return 3;
    case "USED_POOR": return 2;
    case "REFURBISHED": return 5;
    default: return undefined;
  }
}

export default async function KatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  // --- Build Prisma where clause (prevzato z /api/parts GET handler) ---
  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (params.category) where.category = params.category;
  if (params.condition) where.condition = params.condition;
  if (params.brand) where.compatibleBrands = { contains: params.brand };

  if (params.minPrice || params.maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (params.minPrice) priceFilter.gte = parseInt(params.minPrice, 10);
    if (params.maxPrice) priceFilter.lte = parseInt(params.maxPrice, 10);
    where.price = priceFilter;
  }

  if (params.inStock === "true") where.stock = { gt: 0 };

  // --- Sorting ---
  type SortOrder = "asc" | "desc";
  let orderBy: Record<string, SortOrder>[];
  switch (params.sort) {
    case "cheapest": orderBy = [{ price: "asc" }]; break;
    case "expensive": orderBy = [{ price: "desc" }]; break;
    case "popular": orderBy = [{ viewCount: "desc" }]; break;
    default: orderBy = [{ createdAt: "desc" }]; break;
  }

  // --- Pagination ---
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = 18;
  const skip = (page - 1) * limit;

  // --- Prisma query (paralelni fetch) ---
  const [parts, total] = await Promise.all([
    prisma.part.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        supplier: {
          select: { id: true, firstName: true, lastName: true, companyName: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.part.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // --- JSON-LD ---
  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Katalog autodilu — CarMakler",
    description: "Autodily a prislusenstvi pro vsechny znacky.",
    numberOfItems: total,
    itemListElement: parts.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://carmakler.cz/shop/${p.slug}`,
      name: p.name,
    })),
  };

  // --- Helper: build pagination URL ---
  const buildPageUrl = (p: number) => {
    const urlParams = new URLSearchParams(params);
    urlParams.set("page", String(p));
    return `/shop/katalog?${urlParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }} />

      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Katalog dilu a prislusenstvi
          </h1>
          <p className="text-gray-500 mt-2">
            <span className="font-bold text-orange-500">{total}</span> produktu v nabidce
          </p>
        </div>
      </section>

      {/* Filters (CLIENT ISLAND) + Grid (SERVER) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PartsFilters variant="shop" resultCount={total} />

        {/* Product grid — SERVER rendered */}
        {parts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parts.map((part) => (
              <ProductCard
                key={part.id}
                partId={part.id}
                name={part.name}
                compatibility={
                  part.compatibleBrands
                    ? JSON.parse(part.compatibleBrands).join(", ")
                    : "Univerzalni"
                }
                condition={conditionToStars(part.condition)}
                price={part.price}
                badge={part.partType === "NEW" ? "new" : part.partType === "AFTERMARKET" ? "aftermarket" : "used"}
                slug={part.slug}
                image={part.images[0]?.url}
                stock={part.stock}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">&#128269;</span>
            <h3 className="text-xl font-bold text-gray-900">Zadne dily nenalezeny</h3>
            <p className="text-gray-500 mt-2">Zkuste zmenit filtry nebo hledejte v jine kategorii.</p>
          </div>
        )}

        {/* Link-based pagination — SERVER rendered */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            {page > 1 && (
              <Link href={buildPageUrl(page - 1)} className="no-underline">
                <Button variant="outline" size="default">&larr; Predchozi</Button>
              </Link>
            )}
            <span className="text-sm text-gray-500">Stranka {page} z {totalPages}</span>
            {page < totalPages && (
              <Link href={buildPageUrl(page + 1)} className="no-underline">
                <Button variant="outline" size="default">Dalsi &rarr;</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Diff shruti — shop/katalog
- **Odebrano:** `"use client"`, `useState` (8x), `useEffect`, `useCallback`, `useSearchParams`, `useRouter`, `fetchParts()` callback, `loading` state, skeleton loader, button-based pagination
- **Pridano:** `import { prisma }`, `import { PartsFilters }`, `searchParams: Promise<...>` prop, Prisma where clause, Prisma findMany+count, `export const metadata`, `export const revalidate`, JSON-LD, Link-based pagination
- **Zachovano:** HTML struktura, CSS tridy, ProductCard grid, conditionToStars helper, category/brand/condition/price/sort/inStock filtry
- **Zmena paginace:** button onClick → `<Link href>` (SSR-compatible, SEO-crawlable)

---

## Soubor 3: `app/(web)/dily/katalog/page.tsx` (372 radku)

### Aktualni stav
- Cela stranka je "use client" (vcetne Suspense wrapperu)
- Identicky pattern jako shop/katalog ALE navic:
  - **Extra filtry:** `partType` select (3 moznosti), `manufacturer` text input
  - **PartRequestForm** v empty state ("Nenasli jste? Poptejte u vrakovist!")
  - **basePath="/dily"** prop na ProductCard
  - **Suspense wrapper** s `KatalogFallback` — v SSR verzi NENI POTREBA (server renderuje kompletni HTML)
- Fetch na `/api/parts?...` — stejny API endpoint jako shop/katalog

### Plan

1. **Pouzit sdileny** `components/web/PartsFilters.tsx` s `variant="dily"` (uz vytvoreny v kroku 2)
2. **Prepsat** `app/(web)/dily/katalog/page.tsx` na Server Component

### Upraveny soubor: `app/(web)/dily/katalog/page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/web/ProductCard";
import { PartsFilters } from "@/components/web/PartsFilters";
import { PartRequestForm } from "@/components/web/PartRequestForm";
import { Button } from "@/components/ui/Button";
import { pageCanonical } from "@/lib/canonical";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Katalog autodilu",
  description: "Pouzite i nove autodily z overenych vrakovist a dodavatelu. Hledejte podle znacky, kategorie nebo VIN.",
  openGraph: {
    title: "Katalog autodilu | CarMakler",
    description: "Autodily z overenych vrakovist. Pouzite, nove i aftermarket dily.",
  },
  alternates: pageCanonical("/dily/katalog"),
};

function conditionToStars(condition: string): number | undefined {
  switch (condition) {
    case "NEW": return undefined;
    case "USED_GOOD": return 4;
    case "USED_FAIR": return 3;
    case "USED_POOR": return 2;
    case "REFURBISHED": return 5;
    default: return undefined;
  }
}

function getPartTypeBadge(partType: string): "used" | "new" | "aftermarket" {
  switch (partType) {
    case "NEW": return "new";
    case "AFTERMARKET": return "aftermarket";
    default: return "used";
  }
}

export default async function DilyKatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  // --- Build Prisma where clause ---
  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (params.category) where.category = params.category;
  if (params.partType) where.partType = params.partType;
  if (params.brand) where.compatibleBrands = { contains: params.brand };
  if (params.manufacturer) {
    where.manufacturer = { contains: params.manufacturer, mode: "insensitive" as const };
  }

  if (params.minPrice || params.maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (params.minPrice) priceFilter.gte = parseInt(params.minPrice, 10);
    if (params.maxPrice) priceFilter.lte = parseInt(params.maxPrice, 10);
    where.price = priceFilter;
  }

  if (params.inStock === "true") where.stock = { gt: 0 };

  // --- Sorting ---
  type SortOrder = "asc" | "desc";
  let orderBy: Record<string, SortOrder>[];
  switch (params.sort) {
    case "cheapest": orderBy = [{ price: "asc" }]; break;
    case "expensive": orderBy = [{ price: "desc" }]; break;
    case "popular": orderBy = [{ viewCount: "desc" }]; break;
    default: orderBy = [{ createdAt: "desc" }]; break;
  }

  // --- Pagination ---
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = 18;
  const skip = (page - 1) * limit;

  const [parts, total] = await Promise.all([
    prisma.part.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        supplier: {
          select: { id: true, firstName: true, lastName: true, companyName: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.part.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Katalog autodilu — CarMakler",
    description: "Pouzite i nove autodily z overenych vrakovist.",
    numberOfItems: total,
    itemListElement: parts.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://carmakler.cz/dily/${p.slug}`,
      name: p.name,
    })),
  };

  const buildPageUrl = (p: number) => {
    const urlParams = new URLSearchParams(params);
    urlParams.set("page", String(p));
    return `/dily/katalog?${urlParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }} />

      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Katalog dilu a prislusenstvi
          </h1>
          <p className="text-gray-500 mt-2">
            <span className="font-bold text-orange-500">{total}</span> produktu v nabidce
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PartsFilters variant="dily" resultCount={total} />

        {parts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parts.map((part) => (
              <ProductCard
                key={part.id}
                partId={part.id}
                name={part.name}
                compatibility={
                  part.compatibleBrands
                    ? JSON.parse(part.compatibleBrands).join(", ")
                    : "Univerzalni"
                }
                condition={conditionToStars(part.condition)}
                price={part.price}
                badge={getPartTypeBadge(part.partType)}
                slug={part.slug}
                image={part.images[0]?.url}
                stock={part.stock}
                basePath="/dily"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">&#128269;</span>
            <h3 className="text-xl font-bold text-gray-900">Zadne dily nenalezeny</h3>
            <p className="text-gray-500 mt-2 mb-6">
              Zkuste zmenit filtry nebo hledejte v jine kategorii.
            </p>
            {/* PartRequestForm — CLIENT ISLAND, zachovan z originalu */}
            <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 shadow-sm border border-orange-100">
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                Nenasli jste? Poptejte u vrakovist!
              </h4>
              <p className="text-gray-500 text-sm mb-4">
                Popiste jaky dil hledáte a overena vrakoviste vam posli nabidky.
              </p>
              <PartRequestForm prefillQuery={params.q ?? undefined} />
            </div>
          </div>
        )}

        {/* Link-based pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            {page > 1 && (
              <Link href={buildPageUrl(page - 1)} className="no-underline">
                <Button variant="outline" size="default">&larr; Predchozi</Button>
              </Link>
            )}
            <span className="text-sm text-gray-500">Stranka {page} z {totalPages}</span>
            {page < totalPages && (
              <Link href={buildPageUrl(page + 1)} className="no-underline">
                <Button variant="outline" size="default">Dalsi &rarr;</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Diff shruti — dily/katalog
- **Odebrano:** `"use client"`, `Suspense` wrapper, `KatalogFallback`, `useState` (9x), `useEffect`, `useCallback`, `useSearchParams`, `fetchParts()`, `loading` state, skeleton loader, button-based pagination, `DilyKatalogInner` wrapper
- **Pridano:** `import { prisma }`, `import { PartsFilters }`, `searchParams: Promise<...>`, Prisma where clause (s `partType` + `manufacturer` navic oproti shop), `export const metadata`, `export const revalidate`, JSON-LD, Link-based pagination
- **Zachovano:** HTML struktura, CSS tridy, ProductCard s `basePath="/dily"`, PartRequestForm v empty state, conditionToStars + getPartTypeBadge helpery

### Rozdily oproti shop/katalog
| Aspekt | shop/katalog | dily/katalog |
|--------|-------------|-------------|
| Filtry | category, brand, condition, price, sort, inStock | category, brand, **partType**, **manufacturer**, price, sort, inStock |
| Grid cols | lg:grid-cols-5 | lg:grid-cols-7 |
| Empty state | Jednoduchy text | Text + **PartRequestForm** (client island) |
| basePath | default (/shop) | `/dily` |
| PartsFilters variant | `"shop"` | `"dily"` |
| JSON-LD URL | `/shop/{slug}` | `/dily/{slug}` |

---

## Prisma query — zdrojovy pattern

Oba SSR katalogy pouzivaji **identicky** Prisma query pattern jako `app/api/parts/route.ts` (radky 88-181):

```typescript
// Sdileny vzor:
const [parts, total] = await Promise.all([
  prisma.part.findMany({
    where,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      supplier: { select: { id: true, firstName: true, lastName: true, companyName: true } },
    },
    orderBy,
    skip,
    take: limit,
  }),
  prisma.part.count({ where }),
]);
```

**Dulezite:** Po migraci na SSR se `/api/parts` GET endpoint **STALE POUZIVA** pro:
- Client-side vyhledavani (search bar, AJAX autocomplete)
- PWA offline cache
- Externi integrace

Endpoint NEMAZAT, jen SSR stranky ho preskakuji.

---

## Poznamky pro implementatora

### 1. Diakritika
Plan pouziva ASCII pro jednoduchost. V realne implementaci ZACHOVAT ceskou diakritiku presne dle originalu (Skoda → Skoda, Katalog dilu → Katalog dilu atd.). Viz original soubory.

### 2. `cn()` import v PartsFilters
`PartsFilters.tsx` pouziva `cn()` pro dynamicky grid class — pridat `import { cn } from "@/lib/utils"`.

### 3. PartRequestForm prefill
V dily/katalog empty state se predava `params.q` (search query) do `PartRequestForm`. V originalu se pouziva `searchParams.get("q")` — v SSR verzi je to `params.q`.

### 4. Suspense NENI POTREBA
Original dily/katalog ma `<Suspense fallback={<KatalogFallback />}>` — v SSR verzi toto ODEBRAT. Server renderuje kompletni HTML, skeleton neni potreba. Next.js automaticky pouzije `loading.tsx` pokud existuje.

### 5. ProductCard kompatibilita
`ProductCard` je pravdepodobne client component (s add-to-cart tlacitkem). SSR page mu predava props jako server-side data. Overit, ze `ProductCard` nema problem s `compatibleBrands` jako parsed JSON (ne string).

### 6. ISR revalidate
`revalidate = 300` (5 min) — shodne s nabidka/page.tsx. Filtrovane vysledky se budou cachovat per-URL (kazda kombinace filtru = samostatny ISR entry).

### 7. SEO vylepseni
- `metadata` export → title, description, openGraph, alternates pro canonical URL
- JSON-LD `ItemList` schema → prvnich 10 polozek jako ListItem
- Link-based paginace → crawlovatelne Googlem (oproti button onClick ktery Google nevidi)

---

## Kontrolni checklist po implementaci

Pro kazdy soubor overit:

- [ ] `page.tsx` NEMA "use client" na radku 1
- [ ] HTML renderovany na serveru obsahuje kompletni product grid (curl URL | grep pro nazev dilu)
- [ ] Filtry funguji — zmena filtru aktualizuje URL a zobrazi spravne vysledky
- [ ] Category tabs funguji — klik na kategorii filtruje dily
- [ ] Paginace funguje — Link-based, spravne URL
- [ ] Empty state zobrazen kdyz zadne vysledky (dily: vcetne PartRequestForm)
- [ ] `npm run build` projde bez chyb
- [ ] ISR funguje — prvni load pomaly, druhy rychly (cached)
- [ ] JSON-LD pritomno v `<head>` (view source)
- [ ] Metadata pritomna — `<title>`, `<meta name="description">`, OG tagy

## Poradi implementace

1. `components/web/PartsFilters.tsx` — vytvorit sdileny client component
2. `app/(web)/shop/katalog/page.tsx` — prepsat na SSR
3. `app/(web)/dily/katalog/page.tsx` — prepsat na SSR
4. `app/(web)/inzerce/katalog/page.tsx` — **SKIP** (uz je SSR)

Kazdy krok je testovatelny samostatne. Krok 2 a 3 zavisi na kroku 1.

---

## Odhad casu

| Krok | Cas |
|------|-----|
| PartsFilters.tsx | 1.5h |
| shop/katalog SSR | 1.5h |
| dily/katalog SSR | 1h (sdili Prisma pattern + PartsFilters) |
| Testovani + ladeni | 0.5-1h |
| **Celkem** | **4.5-5h** |
