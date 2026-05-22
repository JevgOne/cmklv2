# SSR Migrace — Faze 2: Web layouts + kariera

**Datum:** 2026-05-07
**Rozsah:** 3 soubory, ~2-3 hodiny prace
**Zavislost:** Zadna (nezavisi na Fazi 1)

---

## Soubor 1: `app/(web)/muj-ucet/layout.tsx`

### Aktualni stav
- Cely layout je "use client" kvuli `usePathname()` pro zvyrazneni aktivni polozky v navigaci
- Obsahuje: h1 nadpis + sidebar nav (8 polozek) + children slot
- Sidebar nav pouziva `cn()` pro active state na zaklade `pathname`

### Plan
1. **Vytvorit** `components/web/AccountSidebarNav.tsx` — client component
2. **Prevest** `app/(web)/muj-ucet/layout.tsx` na Server Component

### Novy soubor: `components/web/AccountSidebarNav.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/muj-ucet", label: "Přehled", exact: true },
  { href: "/muj-ucet/profil", label: "Můj profil", exact: true },
  { href: "/muj-ucet/profil/setup", label: "Nastavit profil" },
  { href: "/muj-ucet/oblibene", label: "Oblíbené" },
  { href: "/muj-ucet/hlidaci-pes", label: "Hlídací pes" },
  { href: "/muj-ucet/dotazy", label: "Moje dotazy" },
  { href: "/muj-ucet/garaz", label: "Moje garáž" },
  { href: "/muj-ucet/poptavky", label: "Moje poptávky" },
];

export function AccountSidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu účtu" className="lg:w-56 shrink-0">
      <div className="flex lg:flex-col gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2.5 rounded-lg text-sm font-medium no-underline whitespace-nowrap transition-colors",
                isActive
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### Upraveny soubor: `app/(web)/muj-ucet/layout.tsx`

```tsx
import { AccountSidebarNav } from "@/components/web/AccountSidebarNav";

export default function MujUcetLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Můj účet
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <AccountSidebarNav />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
```

### Diff shruti
- **Odebrano:** `"use client"`, `usePathname`, `cn` import, `navItems` definice, inline `<nav>` JSX
- **Pridano:** import `AccountSidebarNav`, pouziti `<AccountSidebarNav />`
- **Beze zmeny:** HTML struktura, CSS tridy, children slot — layout je 1:1 vizualne identicky

---

## Soubor 2: `app/(web)/moje-inzeraty/layout.tsx`

### Aktualni stav
- Identicky pattern jako muj-ucet/layout.tsx — "use client" kvuli `usePathname()`
- Sidebar nav se 2 polozkami

### Plan
1. **Vytvorit** `components/web/InzeratyNav.tsx` — client component
2. **Prevest** `app/(web)/moje-inzeraty/layout.tsx` na Server Component

### Novy soubor: `components/web/InzeratyNav.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/moje-inzeraty", label: "Moje inzeráty", exact: true },
  { href: "/inzerce/pridat", label: "Nový inzerát", exact: true },
];

export function InzeratyNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu inzeratu" className="lg:w-56 shrink-0">
      <div className="flex lg:flex-col gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2.5 rounded-lg text-sm font-medium no-underline whitespace-nowrap transition-colors",
                isActive
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### Upraveny soubor: `app/(web)/moje-inzeraty/layout.tsx`

```tsx
import { InzeratyNav } from "@/components/web/InzeratyNav";

export default function MojeInzeratyLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Moje inzeráty
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <InzeratyNav />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
```

---

## Soubor 3: `app/(web)/kariera/page.tsx`

### Aktualni stav
- "use client" na cele strance (193 radku)
- Stranka je z 95% staticky obsah (benefits, positions, cross-links)
- `CareerForm` (radek 154) — JIZ client component
- **PROBLEM:** `Button onClick={scrollIntoView}` na radku 126-129 — event handler v Positions karte. `Button` je Server Component (bez "use client"), takze `onClick` prop by neslo z SSR page predat.

### Plan
1. **Vytvorit** `components/web/ScrollToFormButton.tsx` — maly client component pro scroll button
2. **Prevest** `app/(web)/kariera/page.tsx` na Server Component
3. **Pridat** `export const metadata` pro SEO

### Novy soubor: `components/web/ScrollToFormButton.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/Button";

export function ScrollToFormButton() {
  return (
    <Button
      variant="primary"
      size="default"
      onClick={() => {
        const el = document.getElementById("kariera-form");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
    >
      Mám zájem
    </Button>
  );
}
```

### Upraveny soubor: `app/(web)/kariera/page.tsx`

Zmeny oproti originalu:

**Radek 1:** Odebrat `"use client";`

**Radek 7:** Pridat import:
```tsx
import { ScrollToFormButton } from "@/components/web/ScrollToFormButton";
```

**Pred `export default`:** Pridat metadata:
```tsx
import type { Metadata } from "next";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Kariéra",
  description: "Staňte se automakléřem. Pracujte flexibilně, vydělejte bez stropu. Otevřené pozice v Praze, Brně a po celé ČR.",
  openGraph: {
    title: "Kariéra | CarMakléř",
    description: "Staňte se automakléřem. Flexibilní práce, provize 5% z každého prodeje.",
  },
  alternates: pageCanonical("/kariera"),
};
```

**Radek 126-129:** Nahradit Button s onClick za:
```tsx
<ScrollToFormButton />
```

**Konkretni diff na radcich 120-131:**
```diff
              <div className="mt-6">
-                 <Button
-                   variant="primary"
-                   size="default"
-                   onClick={() => {
-                     const el = document.getElementById("kariera-form");
-                     if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
-                   }}
-                 >
-                   Mám zájem
-                 </Button>
+                 <ScrollToFormButton />
              </div>
```

**Vse ostatni:** Beze zmeny. Staticke pole `benefits` a `positions` + JSX zustavaji identicky.

### Poznamka k importum po zmene
Vysledne importy page.tsx:
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CareerForm } from "@/components/web/CareerForm";
import { ScrollToFormButton } from "@/components/web/ScrollToFormButton";
import { pageCanonical } from "@/lib/canonical";
```
**Odebrano:** `Button` import (uz neni pouzit primo v page), `"use client"`

---

## Kontrolni checklist po implementaci

Pro kazdy soubor overit:

- [ ] `page.tsx` / `layout.tsx` NEMA "use client" na radku 1
- [ ] HTML renderovany na serveru obsahuje kompletni obsah (curl URL | grep pro klicovy text)
- [ ] Stranky vizualne identicky jako pred zmenou (zadny layout shift)
- [ ] Active nav zvyrazneni funguje spravne (kliknout na kazdy link)
- [ ] `npm run build` projde bez chyb
- [ ] `kariera/page.tsx` ma export metadata

## Poradi implementace

1. `components/web/AccountSidebarNav.tsx` — vytvorit
2. `app/(web)/muj-ucet/layout.tsx` — prevest na SSR
3. `components/web/InzeratyNav.tsx` — vytvorit
4. `app/(web)/moje-inzeraty/layout.tsx` — prevest na SSR
5. `components/web/ScrollToFormButton.tsx` — vytvorit
6. `app/(web)/kariera/page.tsx` — prevest na SSR + metadata

Kazdy krok je nezavisly a testovatelny samostatne. Pokud krok selze, predchozi kroky nejsou dotceny.
