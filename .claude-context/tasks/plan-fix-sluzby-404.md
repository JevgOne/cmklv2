# Plan: FIX /sluzby 404 — přidat index stránku

**Task:** #30
**Issue:** /sluzby vrací HTTP 404
**Autor:** Plánovač
**Datum:** 2026-04-24

---

## ANALÝZA

### Stávající stav:
- `app/(web)/sluzby/` — adresář existuje s:
  - `financovani/page.tsx` — Financování auta (Metadata ✅)
  - `pojisteni/page.tsx` — Pojištění auta (Metadata ✅)
  - `proverka/page.tsx` — Prověrka vozidla (Metadata ✅)
  - `error.tsx` — Error boundary ✅
  - **Žádné `page.tsx`** v root → 404

### Podstránky používají:
- `ServicePage` component z `components/web/ServicePage.tsx`
- Props: `hero`, `steps`, `benefits`, `cta`, `faq`, `breadcrumbLabel`, `currentService`
- `currentService` type: `"proverka" | "financovani" | "pojisteni"`

### Existující odkaz na /sluzby:
- Žádný přímý odkaz v navigaci nenalezen → uživatelé mohou přijít přes URL bar nebo SEO

### Rozhodnutí: Index stránka vs redirect
**Index stránka** (rozcestník) — lepší pro SEO (vlastní metadata, internal linking), lepší UX (uživatel vidí přehled služeb). Redirect by ztratil SEO hodnotu URL `/sluzby`.

---

## IMPLEMENTAČNÍ PLÁN (1 krok)

### Krok 1: Vytvořit `/sluzby` index stránku

**Nový soubor:** `app/(web)/sluzby/page.tsx`

Server Component (pro metadata export):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Služby — financování, pojištění, prověrka vozidla",
  description:
    "Kompletní služby pro nákup i prodej auta. Financování na splátky, srovnání pojištění, prověrka historie vozidla. Vše online, rychle a výhodně.",
  openGraph: {
    title: "Služby | CarMakléř",
    description:
      "Financování, pojištění a prověrka vozidla. Online služby pro chytřejší nákup auta.",
  },
  alternates: pageCanonical("/sluzby"),
};

const services = [
  {
    href: "/sluzby/financovani",
    icon: "🧮",
    title: "Financování auta",
    description:
      "Auto na splátky bez zálohy. Schválení do 30 minut, úrok od 3,9 %.",
  },
  {
    href: "/sluzby/pojisteni",
    icon: "🛡️",
    title: "Pojištění auta",
    description:
      "Srovnání povinného ručení a havarijního pojištění od všech pojišťoven.",
  },
  {
    href: "/sluzby/proverka",
    icon: "🔍",
    title: "Prověrka vozidla",
    description:
      "Kontrola havárií, stočení km, zástav a servisní historie. Report do 30 minut.",
  },
];

export default function SluzbyPage() {
  return (
    <main>
      <Breadcrumbs items={[{ label: "Domů", href: "/" }, { label: "Služby" }]} />

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Naše služby
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Pomůžeme vám s financováním, pojištěním i prověrkou vozidla.
              Vše online, rychle a výhodně.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {services.map((service) => (
              <Link key={service.href} href={service.href} className="no-underline">
                <Card hover className="p-6 h-full text-center">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    {service.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {service.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
```

---

## SOUBORY K EDITACI

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `app/(web)/sluzby/page.tsx` | **CREATE** | Index stránka s rozcestníkem na 3 služby (~70 řádků) |

---

## ACCEPTANCE CRITERIA

- [ ] `/sluzby` vrací HTTP 200 (ne 404)
- [ ] Stránka zobrazuje 3 karty: Financování, Pojištění, Prověrka
- [ ] Každá karta je link na odpovídající podstránku
- [ ] Metadata (title, description, OG) jsou nastavené
- [ ] Breadcrumbs zobrazují "Domů → Služby"
- [ ] Canonical URL je nastavená přes `pageCanonical`
- [ ] Design je konzistentní s ostatními stránkami (Outfit font, orange theme, Card component)
- [ ] Podstránky `/sluzby/financovani`, `/sluzby/pojisteni`, `/sluzby/proverka` stále fungují
- [ ] TypeScript build OK

## ODHAD

- **Složitost:** Triviální (1 nový soubor, ~70 řádků)
- **Risk:** Minimální — žádné závislosti, čistě nová stránka
