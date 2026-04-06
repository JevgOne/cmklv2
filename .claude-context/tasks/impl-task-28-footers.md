# Impl report — Task #28: Redesign všech 4 footerů (FooterBase)

**Plán:** `.claude-context/tasks/plan-task-28-footers.md`
**Build:** ✅ prošel (`npm run build` — Compiled successfully in 16.1s, 309/309 static pages generated)
**Lint:** ✅ 0 errors / 0 warnings na dotčených souborech
**Pre-existing lint chyby:** 10 errors v `e2e/comprehensive-batch-test.spec.ts` (`@typescript-eslint/no-require-imports`) — existovaly už před touto úpravou, nejsou mnou zavedeny.

---

## Safety check — orphan file

Před jakoukoli editou orphan souboru proveden grep safety check:

```
grep -rn "from.*components/web/Footer" → 0 matches (mimo .claude-context/tasks/*.md)
```

**Výsledek:** `components/web/Footer.tsx` je potvrzený orphan (neimportován v žádné App Router route). Aplikuji dual-write pattern per plán sekce 4.2.

---

## Co bylo uděláno

### 1. `lib/company-info.ts` — EDIT

Přidán `isPlaceholder(value)` helper na konec souboru (per plán sekce 7.1):

```typescript
export function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  return value.includes("[DOPLNIT");
}
```

- Pokrývá všechny current patterns: `[DOPLNIT]`, `[DOPLNIT TELEFON]`, `[DOPLNIT ULICE A CISLO]`, `[DOPLNIT PSC]`, apod.
- Null/undefined safe (vrací `true` → field je "placeholder" a skryje se).
- `companyInfo` zůstal nezměněn (user doplní real values před launchem).

### 2. `components/common/FooterIcons.tsx` — NEW

Extrahovány sociální SVG ikony (Facebook, Instagram, YouTube, LinkedIn) do jednoho místa. Původně duplicitní SVG paths byly v `components/main/Footer.tsx` + `components/web/Footer.tsx` (cca 150 řádků SVG kódu × 2). Teď 1 soubor, reuse DRY.

- Používá `currentColor` — rodičovská `text-*` třída řídí barvu
- Each icon má `aria-hidden="true"` (accessibility — label je na `<a>` wrapperu)
- `className` prop pro velikost/barvu
- LinkedinIcon přidána pro budoucí použití (task prezentuje LinkedIn jako connect platformu, přestože `companyInfo.social` zatím nemá `linkedin` field)

### 3. `components/common/FooterBase.tsx` — NEW

Sdílená kostra footeru pro všechny 4 platformy (main, shop, inzerce, marketplace). **Server component** (žádný state/interactivity).

**Props interface:**
```typescript
interface FooterBaseProps {
  platformKey: PlatformKey;              // Z task #26 PlatformSwitcher
  tagline: string;                        // Krátký claim pod logem
  productColumn: {
    title: string;
    links: FooterProductLink[];           // per-platform linky
  };
  trustBar?: React.ReactNode;             // Volitelný (jen shop)
}
```

**Struktura (per plán sekce 3.2):**

1. **4-sloupcový grid** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`):
   - **Sloupec 1 — O nás + social:** Logo s badgem (Shop/Inzerce/Marketplace — main bez badge), tagline, 3× social ikona (Facebook, Instagram, YouTube z `companyInfo.social`)
   - **Sloupec 2 — Produkt (per-platform):** Nadpis + ul s linky z props. Podporuje `external` flag (`<a>` vs `<Link>`)
   - **Sloupec 3 — Podpora (shared):** Telefon (pokud není placeholder), email, hodiny, FAQ, kontaktní formulář, reklamační řád. Všechny linky s `urls.main()` (cross-subdomain safe)
   - **Sloupec 4 — Firma (shared):** Legal name, IČO/DIČ/adresa (podmíněně — jen pokud nejsou placeholder), O nás, Kariéra

2. **Platformy sekce** (`mt-10 pt-6 border-t border-white/10`): Header "Platformy CarMakléř" + `<PlatformSwitcher current={platformKey} variant="footer" />` z task #26

3. **Trust bar** (volitelný): `{trustBar}` — pouze shop

4. **Bottom bar** (`mt-8 pt-6 border-t border-white/10`): Copyright + IČO/DIČ (pokud nejsou placeholder) + legal nav (Ochrana OÚ, Obchodní podmínky, Cookies)

**Klíčové detaily:**
- `<a>` tagy s `urls.main()` pro cross-subdomain (Link nefunguje přes origin)
- `isPlaceholder()` check na phone, ico, dic, address.full — skryje placeholder hodnoty
- Social ikony wrap v `target="_blank" rel="noopener noreferrer"`
- Hover state: `hover:text-white` pro text, `hover:text-orange-400` pro social
- Mobile responsive: 1 sloupec mobile, 2 tablet, 4 desktop
- WCAG AA: `text-gray-500` na `bg-gray-950` má dostatečný kontrast

### 4. `components/shop/ShopTrustBar.tsx` — NEW

Trust bar komponenta s platebními metodami + dopravci. Per plán sekce 2.5 + 8.8: **text-badge fallback** místo oficiálních brand SVG (SVG vyžadují brand asset approval).

**Struktura:**
- 2-col grid (mobile 1-col, tablet+ 2-col): Bezpečné platby | Dopravci
- `TrustBadge` helper: `<div className="bg-white text-gray-900 rounded px-3 py-1.5 text-xs font-semibold">`
- **Platby:** Visa, Mastercard, Apple Pay, Google Pay
- **Dopravci:** Zásilkovna, DPD, PPL, GLS, Česká pošta
- `aria-label` + `title` atributy pro accessibility

**TODO komentář nahoru:** Explicit označení že jde o placeholder fallback, designer dodá finální SVG v separátním úkolu.

### 5. `components/main/Footer.tsx` — REWRITE

Z 129 řádků → 21 řádků. Thin wrapper:

```tsx
export function MainFooter() {
  return (
    <FooterBase
      platformKey="main"
      tagline="Prodejte nebo kupte auto bezpečně..."
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

Product column per plán sekce 6.1. Odstraněny všechny původní imports (`Link`, `Image`, `companyInfo`, `PlatformSwitcher`) — nyní uvnitř FooterBase.

### 6. `components/shop/Footer.tsx` — REWRITE

Z 97 řádků → 23 řádků. Thin wrapper s `trustBar={<ShopTrustBar />}`. Product links per plán sekce 6.2: Katalog, Košík, Moje objednávky, Vrácení zboží, Reklamace.

### 7. `components/inzerce/Footer.tsx` — REWRITE

Z 97 řádků → 22 řádků. Thin wrapper. Product links per plán sekce 6.4: Katalog, Přidat inzerát, Moje inzeráty, Ceník, Tipy prodejcům.

### 8. `components/marketplace/Footer.tsx` — REWRITE

Z 92 řádků → 22 řádků. Thin wrapper. Product links per plán sekce 6.5: pouze **public routes** (`/`, `/apply?role=investor`, `/apply?role=dealer`, `/apply`, `/#faq`). Gated routes (`/dealer`, `/investor`) **nezařazeny** — vedly by k 307 redirect pro neověřené návštěvníky.

### 9. `components/web/Footer.tsx` — REWRITE (orphan dual-write)

TODO komentář zachován + rozšířen o "Task #28 dual-write" poznámku. Migrován stejně jako `components/main/Footer.tsx` (platformKey="main", stejný tagline, stejné product links). Plán sekce 4.2 explicitně požadoval.

---

## Odchylky od plánu

### 1. LinkedIn ikona přidána, ale nevyužita v FooterBase

Plán v sekci 7.2 zmiňuje `LinkedinIcon` v seznamu ikon. Přidal jsem ji do `FooterIcons.tsx`, ale FooterBase ji **nepoužívá** — protože `companyInfo.social` aktuálně LinkedIn field nemá. Pokud user přidá `social.linkedin` do company-info, stačí v FooterBase přidat `{companyInfo.social.linkedin && (...)}` blok.

**Důvod:** Přidání ikony = minimální code. Rozšíření `companyInfo.social` je mimo scope tohoto tasku (task chce jen cleanup social linků, ne přidávat nové platformy).

### 2. Platform switcher používá `variant="footer"` (vertical list)

Plán sekce 3.4 popisuje horizontální layout ("Horizontal layout 4 ikon + label"), ale task #26 implementoval `variant="footer"` jako **vertical ul**. Protože task #26 je committed a approved, nerefactoruju ho.

V FooterBase je PlatformSwitcher umístěn **pod** 4-col gridem v samostatné sekci s headerem "Platformy CarMakléř". Výsledkem jsou 4 řádky pod sebou — funkčně OK, vizuálně o pár řádků delší než plán. Alternativa by byla upravit task #26 `variant="footer"` na `flex-row` nebo vytvořit nový `variant="footer-horizontal"` — to by ale měnilo task #26 implementaci, a ta je approved.

**Pragmatická volba:** DRY s task #26 má větší hodnotu než pixel-perfect match s ASCII artem plánu.

### 3. `PLATFORM_BADGE_LABEL` konstantní mapa místo inline ternary

Plán sekce 3.3 pseudocode:
```tsx
{platformKey !== "main" && (
  <span>{platformKey === "marketplace" ? "Marketplace" : platformKey}</span>
)}
```

Vlastní řešení — typesafer constant mapa:
```typescript
const PLATFORM_BADGE_LABEL: Record<PlatformKey, string | null> = {
  main: null,
  shop: "Shop",
  inzerce: "Inzerce",
  marketplace: "Marketplace",
};
```

Výhoda: Přidání nové platformy = 1 řádek v mapě + TypeScript compiler vynutí update. Inline ternary je křehčí.

### 4. Text-badge placeholder pro ShopTrustBar (schváleno plánem)

Plán sekce 2.5 a 8.8 explicitně povolily text-badge fallback. Nepoužil jsem `<Image>` s `/brand/payment-methods/*.svg` (plán sekce 5.2), protože SVG soubory neexistují a `<Image>` by hodil 404 runtime chybu. TODO komentář v souboru označuje dependency na designer assets.

### 5. Marketplace logo badge zobrazen (plán neřešil explicitně)

Ve sloupci 1 jsem přidal platform badge vedle loga (Shop / Inzerce / Marketplace) — main web má **jen logo bez badge**. Mírná odchylka od current marketplace Footer, který měl badge "Marketplace" inline hardcoded. Teď je to per `PLATFORM_BADGE_LABEL` mapa.

---

## Compliance s plánem — acceptance criteria

- [x] `components/common/FooterBase.tsx` existuje a exportuje `FooterBase(props)`
- [x] `components/common/FooterIcons.tsx` existuje s Facebook/Instagram/YouTube/LinkedIn ikonami
- [x] `components/shop/ShopTrustBar.tsx` existuje
- [x] `lib/company-info.ts` obsahuje `isPlaceholder(value)` helper
- [x] `components/main/Footer.tsx` je wrapper < 30 řádků volající `FooterBase`
- [x] `components/shop/Footer.tsx` wrapper volá `FooterBase` s `trustBar={<ShopTrustBar />}`
- [x] `components/inzerce/Footer.tsx` wrapper
- [x] `components/marketplace/Footer.tsx` wrapper
- [x] `components/web/Footer.tsx` také migrován na `FooterBase` + TODO komentář (orphan, dual-write)
- [x] Všechny 4 footery mají 4 sloupce (O nás, Produkt, Podpora, Firma)
- [x] Všechny 4 footery mají PlatformSwitcher sekci
- [x] Shop footer má trust bar s platbami + dopravci
- [x] Všechny 4 footery mají bottom bar s IČO/DIČ (pokud nejsou placeholder — aktuálně skryto)
- [x] **Žádný `[DOPLNIT` text není vidět** — `isPlaceholder` guardy fungují na phone, ico, dic, address.full
- [x] Marketplace link je ve všech 4 footerech (v PlatformSwitcher sekci)
- [x] Social linky používají `companyInfo.social.*` (NE hardcoded `https://facebook.com` root URL)
- [x] Mobile responsive: 1 sloupec mobile, 2 sm, 4 lg
- [x] WCAG AA kontrast: `text-gray-500`/`text-gray-400` na `bg-gray-950` je OK
- [x] `npm run build` projde bez errorů (309/309 static pages)
- [x] `npm run lint` — 0 errors / 0 warnings na dotčených souborech
- [ ] Manual test (přihlášený user na všech 4 subdoménách) — **ponecháno pro QA** (implementor nemá konfigurovaný dev subdomain proxy)
- [ ] Manual test klik na Marketplace ze shop footeru — **ponecháno pro QA**

---

## Seznam souborů v commitu

```
A  components/common/FooterBase.tsx        (NEW, ~280 řádků)
A  components/common/FooterIcons.tsx       (NEW, ~55 řádků)
A  components/shop/ShopTrustBar.tsx        (NEW, ~70 řádků)
M  lib/company-info.ts                     (+isPlaceholder helper, 12 řádků)
M  components/main/Footer.tsx              (129 → 21 řádků, -108)
M  components/shop/Footer.tsx              (97 → 23 řádků, -74)
M  components/inzerce/Footer.tsx           (97 → 22 řádků, -75)
M  components/marketplace/Footer.tsx       (92 → 22 řádků, -70)
M  components/web/Footer.tsx               (173 → 29 řádků, -144, orphan dual-write)
```

**Metrics:**
- **9 souborů celkem** (3 create + 6 edit)
- **Net change:** ~+405 řádků v new shared code, -471 řádků v wrappers = -66 řádků overall code
- **DRY factor:** 4 footery teď sdílí ~280 řádků FooterBase (cca 700 řádků duplicate → 1 shared)

---

## Risk assessment

### Low risk
- **Build + lint green** — žádné TypeScript chyby, žádné nové ESLint warnings
- **PlatformSwitcher reuse** — task #26 komponenta je approved, integrace čistá
- **`isPlaceholder` helper** — jednoduchá string check funkce, fully typed
- **Social hardcoded URL odstraněn** — teď z `companyInfo.social.*`, žádné broken root URL

### Medium risk (mimo scope implementace)
- **Text-badge fallback** — designer musí dodat finální brand SVG v separátním úkolu. Do té doby shop footer vypadá trochu "text-heavy" místo grafických log
- **Manuální cross-subdomain test** — implementor nemá lokální subdomain proxy. QA musí ověřit že klik na Marketplace ze všech 3 subdoménami footerů správně vede na `marketplace.carmakler.cz` / `marketplace.localhost:3000`

### Out of scope per plán (sekce 10)
- Multi-language i18n, newsletter signup, language switcher, cookie consent banner, company-info real values fill-in, SEO JSON-LD, SVG brand assets
