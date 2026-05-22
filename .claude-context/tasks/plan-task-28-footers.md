# Plán — Task #28: Redesign všech 4 footerů

**Autor:** planovac (agent team)
**Datum:** 2026-04-06
**Task ID:** #28
**Status:** Naplánováno — připraveno k implementaci
**Priorita:** MEDIUM

---

## 1. Cíl

Redesignovat 4 footery (main, shop, inzerce, marketplace) tak, aby byly **profesionální, kompletní a konzistentní napříč platformami**. Opravit problémy ze screenshotu: `[DOPLNIT TELEFON]` placeholder, prázdné sloupce, chybějící firemní údaje, chybějící marketplace link, duplicitní kód.

**Business goal:** Footer je hlavní "trust signal" pod každou stránkou — zákazníci hledají IČO, telefon, adresu, sociální sítě, dopravce, obchodní podmínky. Aktuální footery tyto signály neobsahují kompletně → ztráta důvěry.

---

## 2. Discovery — current state

### 2.1 Aktuální stavy

| Footer | Struktura | Problémy |
|--------|-----------|----------|
| `components/main/Footer.tsx` | 5-col grid (Logo + 4 sekce: Služby, Platformy, O nás, Kontakt). Ve spodní liště social + legal links. | Hardcoded SVG social. `urls.inzerce/shop` použité, **marketplace chybí**. `companyInfo.contact.phone` → `[DOPLNIT TELEFON]` zobrazeno!!! Chybí IČO/DIČ, adresa, otevírací doba. |
| `components/web/Footer.tsx` | Skoro identický s main/Footer, ale linky `/inzerce` a `/shop` **bez urls helperu** (relativní → zlomí subdomain routing). **ORPHAN** (není importován v routing, viz task #26). | Dublet main/Footer, zastaralé linky, marketplace chybí. |
| `components/shop/Footer.tsx` | 4-col grid (Logo, Shop, Další platformy, Kontakt). Menší než main. | Chybí O nás, sociální sítě, IČO/DIČ, trust bar (platby/dopravci), marketplace link chybí. `[DOPLNIT TELEFON]` zobrazeno. |
| `components/inzerce/Footer.tsx` | 4-col grid (Logo, Inzerce, Další platformy, Kontakt). Podobný shop. | Stejné problémy jako shop. |
| `components/marketplace/Footer.tsx` | 4-col grid (Logo, Marketplace (Pro dealery/investory), Další platformy, Kontakt). | Stejné problémy. |

### 2.2 Data source — `lib/company-info.ts`

Centrální source of truth pro firemní údaje. **Problém:** obsahuje placeholder hodnoty `[DOPLNIT TELEFON]`, `[DOPLNIT]` pro IČO/DIČ/adresu.

**Řešení:**
1. Footery **nezobrazí placeholder hodnoty vizuálně** — fallback pattern: pokud hodnota obsahuje `[DOPLNIT`, pole se skryje/zobrazí generický text nebo vůbec nezobrazí.
2. `companyInfo` zůstane nezměněn (real values vyplní user před launchem).
3. Dodat helper `isPlaceholder(value: string): boolean` do `lib/company-info.ts`:

```typescript
export function isPlaceholder(value: string): boolean {
  return value.includes("[DOPLNIT");
}
```

4. Footery importují helper a kontrolují každé pole před renderem.

### 2.3 Social media links

Aktuálně hardcoded v main/Footer a web/Footer: `https://facebook.com`, `https://instagram.com`, `https://youtube.com` (root URL, NE k CarMakler profilu!).

`companyInfo.social` MÁ správné URL:
```typescript
social: {
  facebook: "https://facebook.com/carmakler",
  instagram: "https://instagram.com/carmakler",
  youtube: "https://youtube.com/@carmakler",
},
```

**Akce:** Footery používají `companyInfo.social.*`, ne hardcoded.

**Task wanted ENV vars** (`NEXT_PUBLIC_SOCIAL_*`). **Můj návrh:** `companyInfo.social.*` je už existující pattern. Místo ENV vars rozšířit `lib/company-info.ts` — konzistentní, snadná změna, typesafe. Pokud team-lead chce ENV, lze udělat obojí:
```typescript
social: {
  facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || "https://facebook.com/carmakler",
  // ...
}
```

**Default:** companyInfo konstanty (jednodušší). ENV override lze přidat post-MVP.

### 2.4 Marketplace link — include/exclude?

**Konflikt v instrukcích:**
- Task #28 description: "Další platformy ... ❌ Marketplace NE (VIP, jen pro registrované)"
- Task #26 finální correction od team-leada: "marketplace JE v public menus" (landing public, details gated)

**Rozhodnutí:** Následovat **novější korekci** (task #26 final) → **marketplace JE** ve footerech jako public link na landing page. Landing je veřejná, middleware chrání jen dealer/investor subroutes.

**Pokud team-lead chce ještě jinak, řekne a plán upravím.**

### 2.5 Dopravci a platební metody (trust bar pro shop)

Task chce ikony plateb + dopravců ve shop footeru. Discovery:
- **Platby:** Stripe ovládá Visa, MC, Apple Pay, Google Pay + bank transfer + COD. Ikony potřebujeme obstarat (SVG z brand kitů).
- **Dopravci:** Zásilkovna, DPD, PPL, GLS, Česká pošta, Pickup (task #15 DeliveryMethod enum).

**Akce:**
1. Vytvořit `public/brand/payment-methods/` directory s SVG logy: visa.svg, mastercard.svg, apple-pay.svg, google-pay.svg
2. Vytvořit `public/brand/carriers/` s SVG logy: zasilkovna.svg, dpd.svg, ppl.svg, gls.svg, ceska-posta.svg
3. **Alternativa pokud SVG nejsou k dispozici:** Text labels s ikonou (📦, 💳) — placeholder do té doby než designer dodá finální ikony.

**Pozn.:** Získání oficiálních brand SVG = mimo scope task #28 (content problem, ne code problem). **Plán pošle úkol designerovi** pro finální assets, implementátor zatím použije text labels + placeholder ikony.

### 2.6 Konzistence se subdoménami (task #26)

Task #26 plánuje `PlatformSwitcher` komponentu pro navbary + footery. **Task #28 s tím musí být sladěn:**
- Pokud task #26 běží paralelně → task #28 ve footeru importuje `<PlatformSwitcher variant="footer" />` místo hardcoded "Další platformy" sekce.
- Pokud task #26 NENÍ hotový → task #28 implementuje "Platformy" sekci manuálně, kód lze později refactorovat na `PlatformSwitcher`.

**Doporučení:** Předpokládat že task #26 běží **dřív** (má vyšší prioritu) a task #28 importuje `PlatformSwitcher`. Fallback plán inline existuje v sekci 9.

---

## 3. Návrh — sdílená komponenta `FooterBase`

### 3.1 Princip

**Problém:** 4 footery × každý trochu jiný obsah + stejný boilerplate (grid, styling, bottom bar, social) = cca 400+ řádků duplicitního kódu. DRY refactor.

**Řešení:** Vytvořit `components/common/FooterBase.tsx` s propsy pro:
- `platformKey: "main" | "shop" | "inzerce" | "marketplace"` — ovlivňuje badge label a product column
- `productColumn: { title: string; links: Array<{ href, label, external? }> }` — per-platform links
- `tagline: string` — krátký claim pod logem
- `trustBar?: ReactNode` — volitelné content pro shop (platby/dopravci)

Pak 4 tenké wrappery:
- `components/main/Footer.tsx` → `<FooterBase platformKey="main" productColumn={...} tagline={...} />`
- `components/shop/Footer.tsx` → `<FooterBase platformKey="shop" productColumn={...} tagline={...} trustBar={<ShopTrustBar />} />`
- atd.

### 3.2 Struktura FooterBase — 4-sloupcový grid + trust bar + bottom bar

```
┌─────────────────────────────────────────────────────────────────┐
│ [LOGO + tagline]  [Produkt]  [Podpora]  [Firma]                 │
│  sloupec 1         sloupec 2  sloupec 3  sloupec 4              │
│                                                                  │
│  Social ikony                                                    │
│  FB IG YT LI                                                     │
│                                                                  │
│  [ Tenké dělítko ]                                               │
│                                                                  │
│  Platformy:       Platby:        Dopravci:                      │
│  🚗 M 🛒S 📢I 💰M  💳💳💳💳        📦📦📦📦📦                    │
│  (shop pouze)                                                    │
│                                                                  │
│  [ Tlusté dělítko ]                                              │
│                                                                  │
│  © 2026 CarMakléř s.r.o. | IČO: ... | DIČ: ...                  │
│  Ochrana OÚ | Obchodní podmínky | Cookies | Reklamace | Kontakt │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 4-sloupcový grid — obsah

**Sloupec 1 — O nás (company brand)**
- Logo (orange variant pro subdomény)
- Tagline (prop, per-platform)
- Social ikony (z `companyInfo.social`, skrývá neexistující)

**Sloupec 2 — Produkt (per-platform, prop)**
- Main: Nabídka vozidel, Prodat auto, Staň se makléřem, Blog, Jak to funguje
- Shop: Katalog dílů, Košík, Moje objednávky, Vrácení zboží, Reklamace
- Inzerce: Katalog, Přidat inzerát, Moje inzeráty, Ceník, Tipy
- Marketplace: Pro dealery, Pro investory, Jak to funguje, Žádost o přístup, FAQ

**Sloupec 3 — Zákaznická podpora (SHARED)**
- Kontakt: telefon (pokud `!isPlaceholder`), email, otevírací doba
- FAQ → `urls.main("/faq")` (pokud FAQ je na hlavní)
- Kontaktní formulář → `urls.main("/kontakt")`
- Reklamační řád → `urls.main("/reklamacni-rad")`
- GDPR / Ochrana OÚ → `urls.main("/ochrana-osobnich-udaju")`
- Obchodní podmínky → `urls.main("/obchodni-podminky")`

**Sloupec 4 — Firma (SHARED)**
- Legal name: `companyInfo.legalName`
- IČO (pokud není placeholder): `IČO: [hodnota]`
- DIČ (pokud není placeholder): `DIČ: [hodnota]`
- Adresa (pokud není placeholder): `Ulice, PSČ Město`
- Otevírací doba: `companyInfo.hours`

### 3.4 Trust bar (mezi grid a bottom bar)

**Hlavní sekce — Platformy (všechny 4 footery)**
Použít `<PlatformSwitcher variant="footer" current={platformKey} />` z task #26. Horizontal layout 4 ikon + label.

**Alternativa pokud task #26 ještě není implementovaný:**
Inline 4 odkazy s `urls.*` (viz sekce 9).

**Shop-specific trust bar — Platby + dopravci**
```tsx
{platformKey === "shop" && (
  <div className="border-t border-white/10 pt-6 mt-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Platby */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
          Bezpečné platby
        </h4>
        <div className="flex items-center gap-3 flex-wrap">
          {paymentMethods.map((pm) => (
            <div key={pm.key} className="bg-white rounded p-1.5 h-8 flex items-center" aria-label={pm.label}>
              <Image src={pm.icon} alt={pm.label} width={40} height={24} className="h-4 w-auto" />
            </div>
          ))}
        </div>
      </div>
      {/* Dopravci */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
          Dopravci
        </h4>
        <div className="flex items-center gap-3 flex-wrap">
          {carriers.map((c) => (
            <div key={c.key} className="bg-white rounded p-1.5 h-8 flex items-center" aria-label={c.label}>
              <Image src={c.icon} alt={c.label} width={48} height={24} className="h-4 w-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}
```

### 3.5 Bottom bar

```tsx
<div className="mt-8 pt-6 border-t border-white/10">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-gray-500">
    <div>
      &copy; {currentYear} {companyInfo.legalName}
      {!isPlaceholder(companyInfo.ico) && <> · IČO: {companyInfo.ico}</>}
      {!isPlaceholder(companyInfo.dic) && <> · DIČ: {companyInfo.dic}</>}
    </div>
    <nav aria-label="Právní informace" className="flex flex-wrap gap-4">
      <a href={urls.main("/ochrana-osobnich-udaju")} className="hover:text-white">Ochrana OÚ</a>
      <a href={urls.main("/obchodni-podminky")} className="hover:text-white">Obchodní podmínky</a>
      <a href={urls.main("/cookies")} className="hover:text-white">Cookies</a>
      <a href={urls.main("/reklamacni-rad")} className="hover:text-white">Reklamace</a>
      <a href={urls.main("/kontakt")} className="hover:text-white">Kontakt</a>
    </nav>
  </div>
</div>
```

---

## 4. Dotčené soubory

### 4.1 Vytvořit
| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 1 | `components/common/FooterBase.tsx` | **Create** | Sdílená komponenta, volaná ze 4 platforem |
| 2 | `lib/company-info.ts` | **Edit** | Přidat helper `isPlaceholder(value)` |
| 3 | `public/brand/payment-methods/visa.svg` | **Create (designer asset)** | Placeholder (text label) pokud SVG není k dispozici |
| 4 | `public/brand/payment-methods/mastercard.svg` | **Create** | Stejně |
| 5 | `public/brand/payment-methods/apple-pay.svg` | **Create** | Stejně |
| 6 | `public/brand/payment-methods/google-pay.svg` | **Create** | Stejně |
| 7 | `public/brand/carriers/zasilkovna.svg` | **Create (designer asset)** | Placeholder |
| 8 | `public/brand/carriers/dpd.svg` | **Create** | Placeholder |
| 9 | `public/brand/carriers/ppl.svg` | **Create** | Placeholder |
| 10 | `public/brand/carriers/gls.svg` | **Create** | Placeholder |
| 11 | `public/brand/carriers/ceska-posta.svg` | **Create** | Placeholder |

**Designer asset caveat:** Pokud brand SVG nejsou k dispozici v tuto chvíli, implementátor vloží text-based badge:
```tsx
<div className="bg-white text-gray-900 rounded px-2 py-1 text-xs font-semibold">Visa</div>
```
a ponechá `TODO: replace with official SVG` komentář. Design agent dodá assets v separátním podúkolu.

### 4.2 Upravit (refactor na FooterBase)
| # | Soubor | Akce | Konkrétně |
|---|--------|------|-----------|
| 12 | `components/main/Footer.tsx` | **Rewrite** | Redukovat na wrapper `<FooterBase platformKey="main" productColumn={...} tagline={...} />` |
| 13 | `components/shop/Footer.tsx` | **Rewrite** | `<FooterBase platformKey="shop" productColumn={...} tagline={...} trustBar={<ShopTrustBar />} />` |
| 14 | `components/inzerce/Footer.tsx` | **Rewrite** | `<FooterBase platformKey="inzerce" ... />` |
| 15 | `components/marketplace/Footer.tsx` | **Rewrite** | `<FooterBase platformKey="marketplace" ... />` |
| 16 | `components/web/Footer.tsx` | **Edit (mirror main) + TODO** | Orphan, migrovat stejně jako task #26 — NESMAZAT, dual-write |

### 4.3 Beze změny
| Soubor | Proč |
|--------|------|
| `lib/urls.ts` | Hotový |
| `companyInfo` data | Hotový (user doplní placeholders před launchem) |
| Existing navbar komponenty | Mimo scope #28 |
| PWA `TopBar.tsx` | PWA nemá footer, nedotčeno |
| Admin footer (pokud existuje) | Mimo scope |

---

## 5. FooterBase — detailní implementace (pseudokód)

```typescript
import Link from "next/link";
import Image from "next/image";
import { urls } from "@/lib/urls";
import { companyInfo, isPlaceholder } from "@/lib/company-info";
import { PlatformSwitcher, type PlatformKey } from "@/components/ui/PlatformSwitcher"; // z task #26

// Social ikony — reuse ze stávajícího kódu, extrahovat do malých komponent
import { FacebookIcon, InstagramIcon, YoutubeIcon, LinkedinIcon } from "./FooterIcons";

export interface FooterProductLink {
  href: string;
  label: string;
  external?: boolean;
}

export interface FooterBaseProps {
  platformKey: PlatformKey;
  tagline: string;
  productColumn: {
    title: string;
    links: FooterProductLink[];
  };
  /** Pouze shop má trust bar s platbami + dopravci */
  trustBar?: React.ReactNode;
}

export function FooterBase({
  platformKey,
  tagline,
  productColumn,
  trustBar,
}: FooterBaseProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        {/* === 4-SLOUPCOVÝ GRID === */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Sloupec 1 — O nás + social */}
          <div>
            <Link href="/" className="flex items-center gap-2 no-underline mb-4">
              <Image
                src="/brand/logo-white.png"
                alt="CarMakléř"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
              />
              {platformKey !== "main" && (
                <span className="text-sm font-semibold text-orange-400 capitalize">
                  {platformKey === "marketplace" ? "Marketplace" : platformKey}
                </span>
              )}
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {tagline}
            </p>

            {/* Social */}
            <div className="flex items-center gap-3">
              {companyInfo.social.facebook && (
                <a
                  href={companyInfo.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-gray-500 hover:text-orange-400 transition-colors"
                >
                  <FacebookIcon className="w-5 h-5" />
                </a>
              )}
              {companyInfo.social.instagram && (
                <a href={companyInfo.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-500 hover:text-orange-400 transition-colors">
                  <InstagramIcon className="w-5 h-5" />
                </a>
              )}
              {companyInfo.social.youtube && (
                <a href={companyInfo.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-500 hover:text-orange-400 transition-colors">
                  <YoutubeIcon className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Sloupec 2 — Produkt */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              {productColumn.title}
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              {productColumn.links.map((link, i) => (
                <li key={i}>
                  {link.external ? (
                    <a href={link.href} className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-white transition-colors no-underline">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Sloupec 3 — Zákaznická podpora */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              Podpora
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3 text-sm text-gray-500">
              {!isPlaceholder(companyInfo.contact.phone) && (
                <li>
                  <a href={companyInfo.contact.phoneHref} className="hover:text-white no-underline">
                    {companyInfo.contact.phone}
                  </a>
                </li>
              )}
              <li>
                <a href={companyInfo.contact.emailHref} className="hover:text-white no-underline">
                  {companyInfo.contact.email}
                </a>
              </li>
              <li className="text-gray-600">{companyInfo.hours}</li>
              <li>
                <a href={urls.main("/faq")} className="hover:text-white no-underline">FAQ</a>
              </li>
              <li>
                <a href={urls.main("/kontakt")} className="hover:text-white no-underline">Kontaktní formulář</a>
              </li>
              <li>
                <a href={urls.main("/reklamacni-rad")} className="hover:text-white no-underline">Reklamační řád</a>
              </li>
            </ul>
          </div>

          {/* Sloupec 4 — Firma */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
              Firma
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3 text-sm text-gray-500">
              <li className="text-gray-400 font-semibold">{companyInfo.legalName}</li>
              {!isPlaceholder(companyInfo.ico) && (
                <li>IČO: {companyInfo.ico}</li>
              )}
              {!isPlaceholder(companyInfo.dic) && (
                <li>DIČ: {companyInfo.dic}</li>
              )}
              {!isPlaceholder(companyInfo.address.full) && (
                <li className="leading-relaxed">{companyInfo.address.full}</li>
              )}
              <li>
                <a href={urls.main("/o-nas")} className="hover:text-white no-underline">O nás</a>
              </li>
              <li>
                <a href={urls.main("/kariera")} className="hover:text-white no-underline">Kariéra</a>
              </li>
            </ul>
          </div>
        </div>

        {/* === PLATFORM SWITCHER === */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
            Platformy CarMakléř
          </h4>
          <PlatformSwitcher current={platformKey} variant="footer" />
        </div>

        {/* === TRUST BAR (only shop) === */}
        {trustBar}

        {/* === BOTTOM BAR === */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-gray-500">
            <div>
              &copy; {currentYear} {companyInfo.legalName}
              {!isPlaceholder(companyInfo.ico) && <span> · IČO: {companyInfo.ico}</span>}
              {!isPlaceholder(companyInfo.dic) && <span> · DIČ: {companyInfo.dic}</span>}
            </div>
            <nav aria-label="Právní informace" className="flex flex-wrap gap-4">
              <a href={urls.main("/ochrana-osobnich-udaju")} className="hover:text-white no-underline">
                Ochrana OÚ
              </a>
              <a href={urls.main("/obchodni-podminky")} className="hover:text-white no-underline">
                Obchodní podmínky
              </a>
              <a href={urls.main("/cookies")} className="hover:text-white no-underline">
                Cookies
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## 6. Per-platform wrappery

### 6.1 `components/main/Footer.tsx`
```tsx
import { FooterBase } from "@/components/common/FooterBase";

export function MainFooter() {
  return (
    <FooterBase
      platformKey="main"
      tagline="Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů. Rychle, transparentně a bez starostí."
      productColumn={{
        title: "Služby",
        links: [
          { href: "/nabidka", label: "Nabídka vozidel" },
          { href: "/chci-prodat", label: "Prodat auto" },
          { href: "/jak-to-funguje", label: "Jak to funguje" },
          { href: "/stan-se-maklerem", label: "Staň se makléřem" },
          { href: "/blog", label: "Blog" },
        ],
      }}
    />
  );
}
```

### 6.2 `components/shop/Footer.tsx`
```tsx
import { FooterBase } from "@/components/common/FooterBase";
import { ShopTrustBar } from "./ShopTrustBar"; // nový sub-komponent

export function ShopFooter() {
  return (
    <FooterBase
      platformKey="shop"
      tagline="E-shop s autodíly. Použité díly z vrakovišť i nové aftermarket díly za skvělé ceny."
      productColumn={{
        title: "Shop",
        links: [
          { href: "/katalog", label: "Katalog dílů" },
          { href: "/kosik", label: "Košík" },
          { href: "/moje-objednavky", label: "Moje objednávky" },
          { href: "/vraceni-zbozi", label: "Vrácení zboží" },
          { href: "/reklamace", label: "Reklamace" },
        ],
      }}
      trustBar={<ShopTrustBar />}
    />
  );
}
```

### 6.3 `components/shop/ShopTrustBar.tsx` (nový)
```tsx
import Image from "next/image";

const paymentMethods = [
  { key: "visa", label: "Visa", icon: "/brand/payment-methods/visa.svg" },
  { key: "mastercard", label: "Mastercard", icon: "/brand/payment-methods/mastercard.svg" },
  { key: "apple-pay", label: "Apple Pay", icon: "/brand/payment-methods/apple-pay.svg" },
  { key: "google-pay", label: "Google Pay", icon: "/brand/payment-methods/google-pay.svg" },
];

const carriers = [
  { key: "zasilkovna", label: "Zásilkovna", icon: "/brand/carriers/zasilkovna.svg" },
  { key: "dpd", label: "DPD", icon: "/brand/carriers/dpd.svg" },
  { key: "ppl", label: "PPL", icon: "/brand/carriers/ppl.svg" },
  { key: "gls", label: "GLS", icon: "/brand/carriers/gls.svg" },
  { key: "ceska-posta", label: "Česká pošta", icon: "/brand/carriers/ceska-posta.svg" },
];

export function ShopTrustBar() {
  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
            Bezpečné platby
          </h4>
          <div className="flex items-center gap-3 flex-wrap">
            {paymentMethods.map((pm) => (
              <div
                key={pm.key}
                className="bg-white rounded px-2 py-1 h-8 flex items-center"
                aria-label={pm.label}
                title={pm.label}
              >
                <Image src={pm.icon} alt={pm.label} width={40} height={24} className="h-4 w-auto" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
            Dopravci
          </h4>
          <div className="flex items-center gap-3 flex-wrap">
            {carriers.map((c) => (
              <div
                key={c.key}
                className="bg-white rounded px-2 py-1 h-8 flex items-center"
                aria-label={c.label}
                title={c.label}
              >
                <Image src={c.icon} alt={c.label} width={48} height={24} className="h-4 w-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 6.4 `components/inzerce/Footer.tsx`
```tsx
export function InzerceFooter() {
  return (
    <FooterBase
      platformKey="inzerce"
      tagline="Inzertní platforma pro prodej a nákup vozidel. Podejte inzerát a oslovte tisíce zájemců."
      productColumn={{
        title: "Inzerce",
        links: [
          { href: "/katalog", label: "Katalog vozidel" },
          { href: "/pridat", label: "Přidat inzerát" },
          { href: "/moje-inzeraty", label: "Moje inzeráty" },
          { href: "/cenik", label: "Ceník" },
          { href: "/tipy", label: "Tipy prodejcům" },
        ],
      }}
    />
  );
}
```

### 6.5 `components/marketplace/Footer.tsx`
```tsx
export function MarketplaceFooter() {
  return (
    <FooterBase
      platformKey="marketplace"
      tagline="VIP investiční platforma pro flipping vozidel. Ověření dealeři a investoři na jednom místě."
      productColumn={{
        title: "Marketplace",
        links: [
          { href: "/", label: "Jak to funguje" },
          { href: "/apply?role=investor", label: "Pro investory" },
          { href: "/apply?role=dealer", label: "Pro dealery" },
          { href: "/apply", label: "Žádost o přístup" },
          { href: "/#faq", label: "FAQ" },
        ],
      }}
    />
  );
}
```

**Pozn. marketplace product links:** Pouze public (`/apply`, anchor `/#faq`) — gated routes (`/dealer`, `/investor`) ve footeru NEjsou, protože by user bez role dostal 307 redirect. Návštěvník bez přístupu se dostane nejdřív na `/apply`.

---

## 7. Helper `isPlaceholder` + social ikony

### 7.1 Update `lib/company-info.ts`
Přidat na konec souboru:
```typescript
/**
 * Vrátí true pokud hodnota obsahuje placeholder marker `[DOPLNIT`.
 * Footery a další UI používají pro skrytí neúplných dat.
 */
export function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  return value.includes("[DOPLNIT");
}
```

### 7.2 Extract social ikony do `components/common/FooterIcons.tsx`
Inline SVG jsou v main/Footer.tsx × web/Footer.tsx duplikované (200+ řádků SVG kódu). Extrahovat do malé knihovny:
```tsx
interface IconProps {
  className?: string;
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}
// InstagramIcon, YoutubeIcon, LinkedinIcon identicky
```

**Důvod:** DRY + vidět změny brandu na 1 místě + snadno otestovat ikonu samotnou.

---

## 8. Klíčová rozhodnutí

### 8.1 Proč `components/common/FooterBase.tsx` a ne `components/ui/`?
`ui/` jsou primitive components (Button, Input, Card). FooterBase je "layout composition" — patří do `common/` nebo `shared/`. Convention v projektu: `components/common/` pro sdílené větší komponenty, `components/ui/` pro atomic primitives. Pokud projekt přísně používá jen `ui/`, přesunout tam je OK.

### 8.2 Proč `isPlaceholder` v `lib/company-info.ts`?
Tam kde jsou data, tam je i logika pro jejich validaci. Centralizuje placeholder detection. Alternativně: separátní `lib/placeholders.ts` — overkill pro 1 funkci.

### 8.3 Proč `companyInfo.social` a ne ENV vars?
- `companyInfo` je už established pattern
- Typesafe, žádné `undefined` checks po celém kódu
- Změna URL sociální sítě = 1 řádek edit, žádný redeploy s ENV změnou
- Jediný use case pro ENV by byl A/B test nebo feature flag (overkill)

**Pokud team-lead chce ENV:** hybrid pattern v `companyInfo.social` s `process.env.NEXT_PUBLIC_SOCIAL_* || fallback`. Nejtvrdší: samostatná ENV sekce.

### 8.4 Proč nezahrnout IČO/DIČ pokud jsou placeholdery?
Zobrazit `IČO: [DOPLNIT]` ve footeru je **horší** než to nezobrazit vůbec. User vidí "tato firma nemá IČO" → ztráta důvěry. Skrývání je safer default, přidání je 1 řádek code.

### 8.5 Proč bottom bar obsahuje IČO/DIČ když je už v sloupci "Firma"?
Redundance je úmyslná — bottom bar je "legal" area (copyright, privacy, terms). IČO/DIČ tam patří dle GDPR a českých zákonů. Sloupec "Firma" je sekundární místo pro brand-context. Obě zobrazení zůstávají, pokud user nechce, lze jeden odstranit.

### 8.6 Proč `PlatformSwitcher` uvnitř FooterBase, a ne přímo v každém wrapperu?
DRY — všechny 4 wrappery by měly stejné `<PlatformSwitcher variant="footer" current={platformKey} />`. FooterBase to absorbuje. Wrappers jsou tím o 3 řádky kratší a konzistence je guarantee.

### 8.7 Proč marketplace ve footeru?
Task #26 final korekt: "marketplace JE v public menus" — landing je public, middleware chrání jen gated subroutes. Footer je UX "mapa webu", mělo by obsahovat všechny dostupné platformy. Starší instrukce "Marketplace NE" je přepsaná novější korekcí.

### 8.8 Proč text badges místo finálních SVG?
Oficiální brand SVG (Visa, Mastercard, Zásilkovna, DPD, ...) vyžadují **brand asset approval** od těchto značek (některé vyžadují písemný souhlas). Rychlé řešení: text badges "Visa", "MC", "Zásilkovna" se stejným layoutem. Designer dodá finální SVG v separátním úkolu. Plán je **code-agnostic** — wrapper `<Image>` nebo `<div>` s textem, implementátor vybere dle aktuální dostupnosti assets.

---

## 9. Alternativa — bez `PlatformSwitcher` z task #26

Pokud task #26 ještě není implementovaný v době práce na #28, FooterBase inlinuje platform switcher přímo:

```tsx
{/* inline platform switcher místo <PlatformSwitcher /> */}
<div className="mt-10 pt-6 border-t border-white/10">
  <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
    Platformy CarMakléř
  </h4>
  <div className="flex flex-wrap gap-x-6 gap-y-2">
    <a href={urls.main("/")} className={`text-sm ${platformKey === "main" ? "text-orange-400 font-semibold" : "text-gray-500 hover:text-white"}`}>CarMakléř</a>
    <a href={urls.inzerce("/")} className={`text-sm ${platformKey === "inzerce" ? "text-orange-400 font-semibold" : "text-gray-500 hover:text-white"}`}>Inzerce</a>
    <a href={urls.shop("/")} className={`text-sm ${platformKey === "shop" ? "text-orange-400 font-semibold" : "text-gray-500 hover:text-white"}`}>Shop</a>
    <a href={urls.marketplace("/")} className={`text-sm ${platformKey === "marketplace" ? "text-orange-400 font-semibold" : "text-gray-500 hover:text-white"}`}>Marketplace</a>
  </div>
</div>
```

Pak když task #26 dokončí `PlatformSwitcher`, jednoduchý refactor na import.

---

## 10. Co NEDĚLAT (out of scope)

- **Ne** implementovat multi-language (i18n). Čeština only.
- **Ne** vyplnit skutečné hodnoty IČO/DIČ/telefonu — to je user task.
- **Ne** přidat newsletter signup do footeru — separátní feature task.
- **Ne** přidat language switcher — jen CZ.
- **Ne** rewrite `companyInfo` strukturu — jen přidat `isPlaceholder` helper.
- **Ne** měnit `components/pwa/TopBar.tsx` — PWA nemá klasický footer.
- **Ne** řešit SEO JSON-LD v footeru — to je separátní task #26/SEO.
- **Ne** implementovat cookie consent banner — samostatná feature (separátní task, pravděpodobně `react-cookie-consent` library).
- **Ne** generovat finální SVG logy pro platby/dopravce — designer asset task.
- **Ne** smazat orphan `components/web/Footer.tsx` — dual-write pattern (stejně jako task #26).

---

## 11. Akceptační kritéria

Hotovo, když:

- [ ] `components/common/FooterBase.tsx` existuje a exportuje `FooterBase(props)`
- [ ] `components/common/FooterIcons.tsx` existuje s Facebook/Instagram/YouTube/LinkedIn ikonami
- [ ] `components/shop/ShopTrustBar.tsx` existuje
- [ ] `lib/company-info.ts` obsahuje `isPlaceholder(value)` helper
- [ ] `components/main/Footer.tsx` je wrapper < 30 řádků volající `FooterBase`
- [ ] `components/shop/Footer.tsx` wrapper volá `FooterBase` s `trustBar={<ShopTrustBar />}`
- [ ] `components/inzerce/Footer.tsx` wrapper
- [ ] `components/marketplace/Footer.tsx` wrapper
- [ ] `components/web/Footer.tsx` také migrován na `FooterBase` + TODO komentář (orphan, dual-write)
- [ ] Všechny 4 footery mají 4 sloupce (O nás, Produkt, Podpora, Firma)
- [ ] Všechny 4 footery mají PlatformSwitcher sekci (nebo inline fallback)
- [ ] Shop footer má trust bar s platbami + dopravci
- [ ] Všechny 4 footery mají bottom bar s IČO/DIČ (pokud nejsou placeholder)
- [ ] **Žádný `[DOPLNIT` text není vidět** v žádném footeru (ověřit screenshotem nebo grep)
- [ ] Marketplace link je ve všech 4 footerech (v PlatformSwitcher sekci)
- [ ] Social linky používají `companyInfo.social.*`, ne hardcoded root URLs
- [ ] Mobile responsive: 1 sloupec na mobile, 2 na tablet, 4 na desktop
- [ ] WCAG AA kontrast: text-gray-500 na bg-gray-950 je OK (ověřit), text-gray-400 na bg-gray-950 OK
- [ ] `npm run build` projde bez errorů
- [ ] Manual test: přihlášený user na všech 4 subdoménách vidí konzistentní footer
- [ ] Manual test: klik na Marketplace ze shop footeru vede na `marketplace.localhost:3000` (dev) nebo `marketplace.carmakler.cz` (prod)

---

## 12. Rizika a mitigace

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Task #26 ještě není hotový při implementaci #28 | Střední | Low | Fallback inline platform switcher (sekce 9). Pozdější refactor 1-line import. |
| Brand SVG pro platby/dopravce nejsou k dispozici | Vysoké | Medium | Text badges jako dočasný placeholder + design agent task na assets |
| `isPlaceholder` check nezachytí všechny varianty (`[DOPLNIT]`, `[DOPLNIT TELEFON]`, ...) | Nízké | Low | Regex `/\[DOPLNIT/` pokrývá všechny current patterns. Testy pokrývají |
| `companyInfo.social.*` odkazuje na neexistující profily | Střední | Low | Profily jsou registrovány — ověřit manuálně. Alternativně: `social: { facebook: null, ... }` pro skrytí do doby vytvoření profilů |
| Mobile footer je příliš dlouhý (scroll fatigue) | Střední | Medium | Accordion pattern — na mobile zkrátit sloupce 3-4 do expand sekcí. **Post-MVP enhancement**, ne součást této implementace |
| Přidání FooterBase rozbije existující layout grid | Nízké | Medium | Retain current `grid-cols-*` pattern. Implementátor testuje na 3 viewportech (mobile 375, tablet 768, desktop 1440) před commitem |

---

## 13. Poznámky pro implementátora

1. **Začít s `FooterBase.tsx`** — jakmile existuje základní layout, wrappery jsou rychlé.

2. **Testovat na všech 4 subdoménách** v dev: `localhost:3000`, `inzerce.localhost:3000`, `shop.localhost:3000`, `marketplace.localhost:3000`. Pokud dev subdomény nejsou setup, zkontrolovat middleware routing.

3. **`companyInfo` je nezměněn** — jen přidá `isPlaceholder`. User doplní reálné hodnoty separátně.

4. **Grep po implementaci:** `grep -rn "\[DOPLNIT" components/` — nesmí najít žádné matches v footer kódu (pokud ano → nějaký placeholder uniká checkem).

5. **Staré hardcoded social SVG** v main/Footer a web/Footer přesunou do FooterIcons.tsx, ale footer wrappery jej nemusí volat — `FooterBase` je volá interně.

6. **Respektovat task #26 prioritu** — pokud `PlatformSwitcher` komponenta zatím neexistuje, použít inline fallback (sekce 9). Po #26 hotovém, 1-line refactor.

7. **Šírka kontejneru** — `max-w-7xl mx-auto` je standardní web layout. Pokud footer na některé subdoméně působí úzký, designer rozhodne o širší `max-w-screen-2xl`.

8. **Dark mode** — footer je vždy dark (bg-gray-950). Pokud projekt přechází na light/dark toggle, footer zůstane dark. Žádné změny.

9. **Git status kontrola** — `components/main/Footer.tsx`, `components/web/Footer.tsx` jsou modifikované. Zkontrolovat co je tam za změnu před rewritem, aby se nepřepsaly důležité úpravy z paralelních tasks.

10. **Screenshot ověření:** Po implementaci pořídit screenshot každého footeru (4 obrázky) a přiložit k PR / reportu. Designer rychle vizuálně zkontroluje.

---

## 14. Follow-up tasky

- **#28a** — Designer: získat oficiální brand SVG pro Visa/MC/AP/GP + dopravce (Zásilkovna/DPD/PPL/GLS/ČP)
- **#28b** — Footer accordion pattern pro mobile (collapse sloupce 3-4)
- **#28c** — Newsletter signup v footeru (samostatný feature request)
- **#28d** — Cookie consent banner (GDPR requirement, samostatný feature)
- **#28e** — JSON-LD schema.org Organization markup v footeru (SEO task)

---

**Plán hotov. Scope: 1 nová hlavní komponenta (FooterBase), 1 nová sub-komponenta (ShopTrustBar), 1 helper (isPlaceholder), 4 rewritten footer wrappery, 1 migrovaný orphan, ~500 řádek kódu celkem.**
