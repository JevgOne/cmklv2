# PLÁN: SEO meta tagy — kompletní audit celého webu

**Datum:** 2026-05-20
**Priorita:** P1 (SEO základ)
**Typ:** Audit + implementační plán

---

## EXECUTIVE SUMMARY

Audit pokrytí `metadata` / `generateMetadata` exportů na VŠECH page.tsx a layout.tsx souborech v Carmakler projektu. Z celkového počtu ~120 veřejných stránek (web + partner) má **179 souborů** metadata export. Zbývá **~15 SEO-relevantních stránek bez vlastního metadata**.

---

## AUDIT: Stav metadata exportů

### Legenda

- ✅ = má `export const metadata` nebo `export async function generateMetadata`
- ⚠️ = nemá vlastní metadata, ale LAYOUT nadřazené route má → dědí
- ❌ = nemá metadata NIKDE (ani v layout) — SEO problém
- 🔀 = redirect stránka (301) — metadata NEPOTŘEBUJE
- 🔒 = auth-only (admin/PWA) — SEO NEPOTŘEBUJE

---

### A. VEŘEJNÉ STRÁNKY `(web)/` — SEO KRITICKÉ

#### Hlavní stránky
| Stránka | Route | Status |
|---------|-------|--------|
| Homepage | `/` | ✅ `app/(web)/page.tsx` |
| Nabídka vozidel | `/nabidka` | ✅ `app/(web)/nabidka/page.tsx` |
| Chci prodat | `/chci-prodat` | ✅ |
| Jak prodat auto | `/jak-prodat-auto` | ✅ |
| Jak to funguje | `/jak-to-funguje` | ✅ |
| Kolik stojí moje auto | `/kolik-stoji-moje-auto` | ✅ |
| O nás | `/o-nas` | ✅ |
| Kontakt | `/kontakt` | ✅ |
| Kariéra | `/kariera` | ✅ (+ layout) |
| Ceník | `/cenik` | ✅ |
| Recenze | `/recenze` | ✅ (+ layout) |
| Blog | `/blog` | ✅ |
| Služby | `/sluzby` | ✅ |
| Služby/Prověrka | `/sluzby/proverka` | ✅ |
| Služby/Financování | `/sluzby/financovani` | ✅ |
| Služby/Pojištění | `/sluzby/pojisteni` | ✅ |

#### SEO landing pages — Nabídka (ALL ✅)
| Typ | Příklad | Count | Status |
|-----|---------|-------|--------|
| Značky | `/nabidka/skoda` | 16 | ✅ Všechny |
| Modely | `/nabidka/skoda/octavia` | 12 | ✅ Všechny |
| Karoserie | `/nabidka/suv` | 7 | ✅ Všechny |
| Ceny | `/nabidka/do-200000` | 6 | ✅ Všechny |
| Města | `/nabidka/praha` | 8 | ✅ Všechny |
| Detail vozidla | `/nabidka/[slug]` | dynamic | ✅ generateMetadata |
| Porovnání | `/nabidka/porovnani` | 1 | ✅ |

#### Díly eshop
| Stránka | Route | Status |
|---------|-------|--------|
| Katalog dílů | `/dily` | ✅ |
| Katalog kategorie | `/dily/katalog` | ✅ (+ layout) |
| Detail dílu | `/dily/[slug]` | ✅ generateMetadata |
| Kategorie | `/dily/kategorie/[slug]` | ✅ generateMetadata |
| Značka | `/dily/znacka/[brand]` | ✅ generateMetadata |
| Značka+Model | `/dily/znacka/[brand]/[model]` | ✅ generateMetadata |
| Značka+Model+Rok | `/dily/znacka/[brand]/[model]/[rok]` | ✅ generateMetadata |
| Vrakoviště detail | `/dily/vrakoviste/[slug]` | ✅ generateMetadata |
| Košík | `/dily/kosik` | ⚠️ layout má metadata |
| Objednávka | `/dily/objednavka` | ❌ **CHYBÍ** |
| Potvrzení | `/dily/objednavka/potvrzeni` | ⚠️ layout má metadata |

#### Shop (aftermarket díly)
| Stránka | Route | Status |
|---------|-------|--------|
| Shop hlavní | `/shop` | ✅ |
| Shop katalog | `/shop/katalog` | ✅ (+ layout) |
| Produkt detail | `/shop/produkt/[slug]` | ✅ generateMetadata |
| Reklamace | `/shop/reklamace` | ✅ |
| Vrácení zboží | `/shop/vraceni-zbozi` | ✅ |
| Košík | `/shop/kosik` | ⚠️ layout má metadata |
| Sledování objednávky | `/shop/objednavky/sledovani/[token]` | ✅ |
| Potvrzení | `/shop/objednavka/potvrzeni` | ⚠️ layout má metadata |

#### Makléři
| Stránka | Route | Status |
|---------|-------|--------|
| Seznam makléřů | `/makleri` | ✅ (+ layout) |
| Detail makléře | `/makleri/[slug]` | ✅ generateMetadata |
| Profil (new) | `/profil/[slug]` | ✅ generateMetadata |
| Bazar detail | `/bazar/[slug]` | ✅ generateMetadata |

#### Inzerce
| Stránka | Route | Status |
|---------|-------|--------|
| Hlavní | `/inzerce` | ✅ |
| Katalog | `/inzerce/katalog` | ❌ **CHYBÍ** |
| Registrace | `/inzerce/registrace` | ⚠️ layout má metadata |
| Přidat inzerát | `/inzerce/pridat` | ⚠️ layout má metadata |

#### Marketplace
| Stránka | Route | Status |
|---------|-------|--------|
| Landing | `/marketplace` | ✅ |
| Apply | `/marketplace/apply` | ✅ |
| Dealer dashboard | `/marketplace/dealer` | ✅ (+ layout) |
| Dealer nová nabídka | `/marketplace/dealer/nova` | ✅ |
| Deal detail | `/marketplace/deals/[id]` | ✅ |
| Investor dashboard | `/marketplace/investor` | ✅ |

#### Blog
| Stránka | Route | Status |
|---------|-------|--------|
| Seznam | `/blog` | ✅ |
| Článek | `/blog/[slug]` | ✅ generateMetadata |
| Kategorie | `/blog/kategorie/[slug]` | ✅ generateMetadata |

#### Právní & info
| Stránka | Route | Status |
|---------|-------|--------|
| Obchodní podmínky | `/obchodni-podminky` | ✅ |
| Ochrana osobních údajů | `/ochrana-osobnich-udaju` | ✅ |
| Reklamační řád | `/reklamacni-rad` | ✅ |
| Zásady cookies | `/zasady-cookies` | ✅ |
| Pro makléře | `/pro-maklere` | ❌ **CHYBÍ** |

#### Auth & utility stránky
| Stránka | Route | Status |
|---------|-------|--------|
| Login | `/login` | ✅ (+ layout) |
| Registrace | `/registrace` | ✅ (+ layout) |
| Registrace makléř | `/registrace/makler` | ✅ (+ layout) |
| Registrace partner | `/registrace/partner` | ✅ (+ layout) |
| Registrace dodavatel | `/registrace/dodavatel` | ✅ (+ layout) |
| Zapomenuté heslo | `/zapomenute-heslo` | ✅ (+ layout) |
| Ověření emailu | `/overeni-emailu/[token]` | ✅ |
| Ověření úspěch | `/overeni-emailu/uspech` | ✅ |
| Ověření chyba | `/overeni-emailu/chyba` | ✅ |
| Notifikace | `/notifikace/[token]` | ✅ |
| Nastavení profilu | `/muj-ucet/profil/setup` | ✅ |
| Platba | `/nabidka/[slug]/platba` | ✅ |
| Platba úspěch | `/nabidka/[slug]/platba/uspech` | ⚠️ Nepotřebuje SEO |
| Dodavatel detail | `/dodavatel/[slug]` | 🔀 redirect → `/dily/vrakoviste/[slug]` |

#### Redirect stránky (301) — NEPOTŘEBUJÍ metadata
| Route | Redirectuje na | Status |
|-------|---------------|--------|
| `/h/[slug]` | `/makleri/[slug]` | 🔀 OK |
| `/tag/[slug]` | `/makleri/[slug]` | 🔀 OK |
| `/dodavatel/[slug]` | `/dily/vrakoviste/[slug]` | 🔀 OK |
| `/makler/[slug]` | `/profil/[slug]` | 🔀 OK |
| `/prihlaseni` | `/login` | 🔀 OK |
| `/auth/prihlasit` | `/login` (next.config) | 🔀 OK |

---

### B. AUTH-ONLY STRÁNKY — SEO NEPOTŘEBUJÍ

#### Admin `(admin)/` — 🔒 Všechny za auth
- Layout má `export const metadata` → stačí
- Jednotlivé admin stránky: 15+ pages, většina má vlastní metadata
- **Bez SEO relevance** — crawler se nedostane za login

#### PWA Makléř `(pwa)/` — 🔒 Všechny za auth
- Layout má `export const metadata` → stačí
- ~25 stránek, většina BEZ vlastního metadata
- **Bez SEO relevance** — PWA je app, ne web

#### PWA Parts `(pwa-parts)/` — 🔒 Všechny za auth
- Layout BEZ metadata (⚠️ ale nepotřebuje pro SEO)
- Jednotlivé stránky většinou mají metadata
- **Bez SEO relevance**

#### Partner `(partner)/` — 🔒 Většina za auth
- Onboarding stránky mají metadata
- Dashboard stránky mají metadata
- **Bez SEO relevance**

---

## NALEZENÉ PROBLÉMY

### P1: Stránky s CHYBĚJÍCÍM metadata (SEO-kritické)

| # | Route | Problém | Dopad |
|---|-------|---------|-------|
| 1 | `/inzerce/katalog` | Chybí metadata | Google zobrazí fallback title z layout |
| 2 | `/pro-maklere` | Chybí metadata | Recruiting landing page bez SEO |
| 3 | `/dily/objednavka` | Chybí metadata | Checkout, low SEO priority ale consistency |

### P2: Stránky s metadata z LAYOUT (ne vlastním)

Tyto stránky dědí metadata z nadřazeného layout.tsx — funkčně OK, ale mají generický title/description:

| Route | Layout metadata | Problém |
|-------|----------------|---------|
| `/inzerce/registrace` | layout.tsx | Generický title pro registraci |
| `/inzerce/pridat` | layout.tsx | Generický title pro přidání |
| `/shop/kosik` | layout.tsx | OK pro checkout |
| `/dily/kosik` | layout.tsx | OK pro checkout |

### P3: Podmíněné metadata (risky pattern)

Některé SEO stránky mají pattern:
```tsx
export const metadata: Metadata = brand ? { title: "..." } : {};
```

Pokud `brand`/`city`/`priceRange` lookup vrátí `undefined`, metadata bude prázdný objekt `{}` → fallback na layout title.

**Dotčené stránky:** Všechny SEO landing pages pod `/nabidka/` (značky, modely, karoserie, ceny, města).

**Riziko:** LOW — data jsou statická z `lib/seo-data.ts`, ale pokud se změní slug mapping, stránka ztratí metadata tiše.

### P4: Chybí Open Graph image strategy

- Většina stránek nemá `openGraph.images`
- Dynamické stránky (`/nabidka/[slug]`, `/blog/[slug]`) by měly mít OG image z dat
- Statické stránky by měly mít fallback OG image

### P5: Chybí `robots` directive na auth stránkách

Auth stránky (login, registrace, zapomenuté heslo) by měly mít:
```tsx
robots: { index: false, follow: false }
```

Aktuálně jsou indexovatelné → Google může zobrazit login page ve výsledcích.

---

## IMPLEMENTAČNÍ PLÁN

### Fix 1: Přidat chybějící metadata (P1)

#### `/inzerce/katalog/page.tsx`
```tsx
export const metadata: Metadata = {
  title: "Inzeráty aut | Carmakler",
  description: "Prohlédněte si inzeráty aut od soukromých prodejců i autobazarů. Kvalitní inzerce s ověřenými fotografiemi.",
  openGraph: {
    title: "Inzeráty aut | Carmakler",
    description: "Prohlédněte si inzeráty aut od soukromých prodejců i autobazarů.",
  },
};
```

#### `/pro-maklere/page.tsx`
```tsx
export const metadata: Metadata = {
  title: "Staňte se makléřem | Carmakler",
  description: "Připojte se k síti certifikovaných automakléřů Carmakler. Provize 5% z prodejní ceny, kompletní podpora a technologie.",
  openGraph: {
    title: "Staňte se makléřem | Carmakler",
    description: "Připojte se k síti certifikovaných automakléřů.",
  },
};
```

#### `/dily/objednavka/page.tsx`
```tsx
export const metadata: Metadata = {
  title: "Objednávka dílů | Carmakler",
  description: "Dokončete objednávku autodílů.",
  robots: { index: false, follow: false },
};
```

### Fix 2: Přidat `robots: noindex` na auth stránky

Stránky, které by neměly být v Google indexu:
```tsx
// Přidat do metadata exportu:
robots: { index: false, follow: false }
```

Dotčené stránky:
- `/login/page.tsx`
- `/registrace/page.tsx` (a všechny sub-routes)
- `/zapomenute-heslo/page.tsx`
- `/overeni-emailu/*`
- `/muj-ucet/*`
- `/nabidka/[slug]/platba/*`
- `/dily/objednavka/*`
- `/shop/kosik/*`

### Fix 3: OG Image strategy

#### Varianta A: Statický fallback (RYCHLE)
```tsx
// app/layout.tsx — globální fallback
export const metadata: Metadata = {
  // ... existing
  openGraph: {
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
};
```

#### Varianta B: Dynamický OG image generator (LEPŠÍ)
```
app/api/og/route.tsx — @vercel/og (nebo next/og)
```

Generuje OG obrázek s:
- Logem Carmakler
- Názvem stránky/vozidla
- Hlavním obrázkem (u vozidel)
- Cenou (u vozidel)

Použití v `generateMetadata`:
```tsx
openGraph: {
  images: [`/api/og?title=${encodeURIComponent(vehicle.title)}&image=${vehicle.mainImage}&price=${vehicle.price}`],
}
```

**DOPORUČENÍ:** Začít s Varianta A (statický fallback), pak přidat Varianta B pro dynamické stránky.

### Fix 4: Shared metadata utility

Vytvořit helper pro konzistentní metadata:

```tsx
// lib/metadata.ts
import type { Metadata } from "next";

const SITE_NAME = "Carmakler";
const DEFAULT_DESCRIPTION = "Prodej aut s makléřem, autodíly z vrakovišť, investiční příležitosti.";
const OG_IMAGE = "/og-default.png";

export function createMetadata(opts: {
  title: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  path?: string;
}): Metadata {
  const title = `${opts.title} | ${SITE_NAME}`;
  const description = opts.description || DEFAULT_DESCRIPTION;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      images: [{ url: opts.image || OG_IMAGE, width: 1200, height: 630 }],
      ...(opts.path && { url: `https://carmakler.cz${opts.path}` }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [opts.image || OG_IMAGE],
    },
    ...(opts.noIndex && { robots: { index: false, follow: false } }),
  };
}
```

---

## DIFF SUMMARY

| Soubor | Změna | Priorita |
|--------|-------|----------|
| `lib/metadata.ts` | NOVÝ — shared metadata helper | P1 |
| `app/(web)/inzerce/katalog/page.tsx` | Přidat `export const metadata` | P1 |
| `app/(web)/pro-maklere/page.tsx` | Přidat `export const metadata` | P1 |
| `app/(web)/dily/objednavka/page.tsx` | Přidat metadata + noindex | P2 |
| `app/(web)/login/page.tsx` | Přidat `robots: noindex` | P2 |
| `app/(web)/registrace/page.tsx` | Přidat `robots: noindex` | P2 |
| `app/(web)/zapomenute-heslo/page.tsx` | Přidat `robots: noindex` | P2 |
| `app/layout.tsx` | Přidat globální OG image fallback | P2 |
| `app/api/og/route.tsx` | NOVÝ — OG image generator (fáze 2) | P3 |

---

## TESTOVÁNÍ

1. **Meta tag verifikace:**
   ```bash
   # Pro každou stránku:
   curl -s https://carmakler.cz/inzerce/katalog | grep -E '<title>|<meta name="description"|<meta property="og:'
   ```

2. **Google Rich Results Test:**
   - https://search.google.com/test/rich-results

3. **Social media preview:**
   - https://developers.facebook.com/tools/debug/
   - https://cards-dev.twitter.com/validator

4. **Lighthouse SEO audit:**
   ```bash
   npx lighthouse https://carmakler.cz --only-categories=seo
   ```

---

## STOP PRAVIDLA

- **STOP-1:** Pokud `lib/seo-data.ts` nemá slug pro některou SEO stránku → stránka vrací `{}` metadata → přidat slug nebo fallback
- **STOP-2:** Pokud OG image generator je příliš pomalý (> 500ms) → použít statický fallback
- **STOP-3:** Pokud `robots: noindex` na auth stránkách smaže existující indexaci v Google → počkat na re-crawl (týdny)
