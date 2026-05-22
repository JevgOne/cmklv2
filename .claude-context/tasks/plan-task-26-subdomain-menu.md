# Plán — Task #26: Menu/Navbar propojení se subdoménami

**Autor:** planovac (agent team)
**Datum:** 2026-04-06
**Task ID:** #26
**Status:** Naplánováno — připraveno k implementaci
**Priorita:** MEDIUM

---

## 1. Cíl

Zajistit, aby ze **všech 4 webových navbarů** (main, inzerce, shop, marketplace) byly konzistentně dostupné linky na všechny 4 platformy přes správné subdoménové URL (production: `carmakler.cz`, `inzerce.carmakler.cz`, `shop.carmakler.cz`, `marketplace.carmakler.cz`; dev fallback: `localhost:3000`, `inzerce.localhost:3000`, atd.).

**Uživatelský problém:** "Když dám inzerce tak to nefunguje, napoj to už když jsou ty subdomeny." Interpretace: když je uživatel na některé subdoméně, nemá jednotný způsob jak se dostat na ostatní platformy — každá subdoména má link jen zpátky na `carmakler.cz`, ale ne křížem (z `shop` na `inzerce`, nebo z `marketplace` na `shop`).

**Druhotně:** Chybí link na marketplace ve všech navbarech/footerech (kromě samotné marketplace subdomény).

---

## 2. Discovery — current state

### 2.1 `lib/urls.ts` — už existuje ✅

Helper je už napsaný a správný:
```typescript
const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000";
const INZERCE_URL = process.env.NEXT_PUBLIC_INZERCE_URL || "http://inzerce.localhost:3000";
const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL || "http://shop.localhost:3000";
const MARKETPLACE_URL = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "http://marketplace.localhost:3000";

function buildUrl(base: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export const urls = {
  main: (path: string = "/") => buildUrl(MAIN_URL, path),
  inzerce: (path: string = "/") => buildUrl(INZERCE_URL, path),
  shop: (path: string = "/") => buildUrl(SHOP_URL, path),
  marketplace: (path: string = "/") => buildUrl(MARKETPLACE_URL, path),
};
```

**Beze změny.** Všechna čtyři volání jsou k dispozici, dev fallback funguje.

### 2.2 `.env.example` — už obsahuje všechny 4 URL vars ✅

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAIN_URL=http://localhost:3000
NEXT_PUBLIC_INZERCE_URL=http://inzerce.localhost:3000
NEXT_PUBLIC_SHOP_URL=http://shop.localhost:3000
NEXT_PUBLIC_MARKETPLACE_URL=http://marketplace.localhost:3000
```

**Beze změny.**

### 2.3 Aktivní routing — `app/(web)/layout.tsx` (line 1-66)

Layout čte `x-subdomain` header (nastavovaný middleware) a přepíná mezi 4 sadami navbar/footer:

```typescript
case "inzerce":  return { navbar: <InzerceNavbar />,  footer: <InzerceFooter />  };
case "shop":     return { navbar: <ShopNavbar />,     footer: <ShopFooter />     };
case "marketplace": return { navbar: <MarketplaceNavbar />, footer: <MarketplaceFooter /> };
case "main":
default:         return { navbar: <MainNavbar />,     footer: <MainFooter />     };
```

To znamená: **4 sady aktivních navbar/footer komponent**:
- `components/main/{Navbar,Footer,MobileMenu}.tsx`
- `components/inzerce/{Navbar,Footer}.tsx`
- `components/shop/{Navbar,Footer}.tsx`
- `components/marketplace/{Navbar,Footer}.tsx`

### 2.4 Orphan soubory — `components/web/{Navbar,Footer,MobileMenu}.tsx`

**Grep prokázal že nejsou importovány v žádné App Router route.** Jediný import je v `components/web/Navbar.tsx` sám volá `./MobileMenu`, ale celý ten modul nikdo nenačítá.

Git status ukazuje všechny 3 soubory jako modified — někdo je nedávno upravoval ale podle discovery je to mrtvý kód. **Akce:** Označit jako legacy / smazat (viz sekce 4.4).

### 2.5 Current state navbarů + co kde chybí

| Komponenta | Aktuální `urls.*` použití | Chybí (cross-platform linky) |
|------------|---------------------------|-------------------------------|
| `components/main/Navbar.tsx` | `urls.inzerce("/")`, `urls.shop("/")` | ❌ Marketplace link |
| `components/main/MobileMenu.tsx` | `urls.inzerce("/")`, `urls.shop("/")` | ❌ Marketplace link |
| `components/main/Footer.tsx` | `urls.inzerce("/")`, `urls.shop("/")` (section "Platformy") | ❌ Marketplace link |
| `components/inzerce/Navbar.tsx` | `urls.main("/")`, `urls.main("/moje-inzeraty")`, `urls.main("/login")` | ❌ Shop + Marketplace (cross) |
| `components/inzerce/Footer.tsx` | — (nečten, pravděpodobně stejný vzor) | ❌ Shop + Marketplace |
| `components/shop/Navbar.tsx` | `urls.main("/")`, `urls.main("/login")` | ❌ Inzerce + Marketplace (cross) |
| `components/shop/Footer.tsx` | — | ❌ Inzerce + Marketplace |
| `components/marketplace/Navbar.tsx` | `urls.main("/")`, `urls.main("/login")` | ❌ Inzerce + Shop (cross) |
| `components/marketplace/Footer.tsx` | — | ❌ Inzerce + Shop |
| `components/pwa/TopBar.tsx` | — (jen interní `/makler/*`) | **BEZE ZMĚNY** — PWA je izolovaný flow |
| `components/web/Navbar.tsx` (orphan) | `href="/inzerce"`, `href="/shop"` — hardcoded | **SMAZAT** (viz 4.4) |
| `components/web/MobileMenu.tsx` (orphan) | hardcoded | **SMAZAT** |
| `components/web/Footer.tsx` (orphan) | hardcoded | **SMAZAT** |

---

## 3. Návrh — „Platform switcher" jako sdílená komponenta

**Problém duplicity:** 4 navbary × 4 footery × linky na 4 platformy = 32 míst které by mohly rozjet. Zavést sdílenou komponentu s konfigurovatelným "current" markerem.

### 3.1 Nová komponenta: `components/ui/PlatformSwitcher.tsx`

```typescript
"use client";
import { urls } from "@/lib/urls";

export type PlatformKey = "main" | "inzerce" | "shop" | "marketplace";

interface Platform {
  key: PlatformKey;
  label: string;
  href: string;
  description: string;
}

const PLATFORMS: Platform[] = [
  { key: "main",        label: "CarMakléř",   href: urls.main("/"),        description: "Hlavní web — auta přes makléře" },
  { key: "inzerce",     label: "Inzerce",     href: urls.inzerce("/"),     description: "Bazar — prodej & koupě aut" },
  { key: "shop",        label: "Shop",        href: urls.shop("/"),        description: "Náhradní díly z vrakovišť" },
  { key: "marketplace", label: "Marketplace", href: urls.marketplace("/"), description: "VIP investiční platforma" },
];

interface Props {
  /** Aktuální platforma — zvýrazní se + stane se nekliknutelná (nebo: vyfiltruje se) */
  current: PlatformKey;
  /** Layout varianta: navbar desktop | navbar mobile | footer */
  variant?: "navbar" | "navbar-mobile" | "footer";
  /** Volitelné — filter out the current platform */
  hideCurrent?: boolean;
}

export function PlatformSwitcher({ current, variant = "navbar", hideCurrent = false }: Props) {
  const items = hideCurrent ? PLATFORMS.filter((p) => p.key !== current) : PLATFORMS;
  // ... render podle variant (layout: horizontal row, column list, footer column)
}
```

**Použití v navbarech:**
- `MainNavbar` → `<PlatformSwitcher current="main" variant="navbar" hideCurrent />`
- `InzerceNavbar` → `<PlatformSwitcher current="inzerce" variant="navbar" hideCurrent />`
- atd.

**Použití ve footerech:**
- Sekce "Platformy" (existuje v `components/main/Footer.tsx`) ji nahradí:
  ```tsx
  <div>
    <h3 className="text-sm font-bold uppercase ...">Platformy</h3>
    <PlatformSwitcher current="main" variant="footer" />
  </div>
  ```

### 3.2 Proč sdílená komponenta a ne inline linky?

**PRO:**
- Jedno místo pro přidání budoucí 5. platformy (např. PWA, parts-supplier portal, ...)
- Jednotné popisky ("Inzerce" vs "Bazar" vs "Inzeráty" — momentálně nekonzistentní)
- Jednodušší zvýraznění "current" platformy
- Sníží cyklické úpravy — task #28 (footer redesign) bude použít stejnou komponentu

**PROTI:**
- Další abstrakce. Pokud team-lead preferuje inline linky, plán to podporuje (viz alternativa v sekci 9).

### 3.3 Styling variant

| Variant | Layout | Kde se použije |
|---------|--------|---------------|
| `navbar` | Horizontal row, text links s hover underline | Desktop navbar — obsazuje pravou stranu vedle CTA |
| `navbar-mobile` | Vertical column, stejné jako MobileMenu items | Mobile hamburger menu |
| `footer` | Vertical column, šedá textová barva, bez bg | Footer columns |

Desktop navbar variant bude ale kompaktní — ne "pole 4 platforem" ale běžný nav pattern: 3 text linky + label "Ostatní platformy". Viz konkrétní návrh v sekci 5.

---

## 4. Dotčené soubory

### 4.1 Vytvořit
| # | Soubor | Akce | Proč |
|---|--------|------|------|
| 1 | `components/ui/PlatformSwitcher.tsx` | **Create** | Sdílená komponenta pro cross-subdomain nav |

### 4.2 Upravit navbary (přidat PlatformSwitcher)
| # | Soubor | Akce | Konkrétně |
|---|--------|------|-----------|
| 2 | `components/main/Navbar.tsx` | **Edit** | Nahradit hardcoded Inzerce/Shop linky (line 108-120) za `<PlatformSwitcher current="main" hideCurrent />` |
| 3 | `components/main/MobileMenu.tsx` | **Edit** | Stejná náhrada v mobile variantě |
| 4 | `components/inzerce/Navbar.tsx` | **Edit** | Přidat `<PlatformSwitcher current="inzerce" hideCurrent />` do desktop nav links + mobile menu |
| 5 | `components/shop/Navbar.tsx` | **Edit** | Stejně, `current="shop"` |
| 6 | `components/marketplace/Navbar.tsx` | **Edit** | Stejně, `current="marketplace"` |

**Umístění v navbar:** Vpravo od existujících nav linků (nabídka, katalog, ...) před CTA (login tlačítko). Nebo jako "nativní" 3-4 text linky vedle Nabídky vozidel. Designer agent může rozhodnout finální pattern — plán zachovává flexibilitu.

### 4.3 Upravit footery (přidat PlatformSwitcher)
| # | Soubor | Akce | Konkrétně |
|---|--------|------|-----------|
| 7 | `components/main/Footer.tsx` | **Edit** | Nahradit sekci "Platformy" linky (line 17-24) za `<PlatformSwitcher current="main" variant="footer" />`. Odstranit položku "Provizní systém" (není relevantní cross-platform) |
| 8 | `components/inzerce/Footer.tsx` | **Edit** | Přidat sekci "Platformy" s `<PlatformSwitcher current="inzerce" variant="footer" />` |
| 9 | `components/shop/Footer.tsx` | **Edit** | Stejně, `current="shop"` |
| 10 | `components/marketplace/Footer.tsx` | **Edit** | Stejně, `current="marketplace"` |

**Pozn:** Subdomain footery (inzerce/shop/marketplace) nečteny během discovery, protože jsou mimo hot path. Implementátor by měl přečíst každý a najít kde logicky umístit novou sekci. Plán předpokládá že mají stejnou strukturu jako `components/main/Footer.tsx` (sekce s H3 titulkem + ul se linky).

### 4.4 Orphan files — **migrovat a označit, NE smazat** (update 2026-04-06)

**UPDATE 2026-04-06 (team-lead feedback):** Nemazat orphan soubory v tomto tasku. Migrovat je paralelně s `components/main/*` a označit jako "candidate for deletion" s TODO komentářem. Smazání proběhne v separátním cleanup tasku po ověření že opravdu nikde nejsou importovány (safety margin).

**Důvod:** Git status ukazuje všechny 3 orphan soubory jako modified. Znamená to že je někdo nedávno editoval — možná existuje větev nebo feature flag který je stále používá. Bezpečnější je **dual-write** — držet oba stromy synchronizované, pak v separátním tasku smazat po finálním greptu.

| # | Soubor | Akce | Konkrétně |
|---|--------|------|-----------|
| 11 | `components/web/Navbar.tsx` | **Edit (mirror main)** | Migrovat na `PlatformSwitcher`, přidat TODO komentář na začátek souboru |
| 12 | `components/web/Footer.tsx` | **Edit (mirror main)** | Stejně |
| 13 | `components/web/MobileMenu.tsx` | **Edit (mirror main)** | Stejně |

**TODO komentář na začátek každého orphan souboru:**
```typescript
/**
 * TODO(cleanup): Pravděpodobně orphan — není importován v žádné App Router route.
 * Grep provedeno 2026-04-06, žádné importy nenalezeny.
 * Zachováno pro safety margin — smazat v cleanup tasku po ověření >= 1 týden produkce.
 * Aktivní varianta je v `components/main/[Navbar|Footer|MobileMenu].tsx` (viz app/(web)/layout.tsx).
 */
```

**Bezpečnostní kontrola před jakýmkoliv zásahem:** Implementátor spustí:
```bash
grep -rn "from.*components/web/Navbar" --include="*.tsx" --include="*.ts" .
grep -rn "from.*components/web/Footer" --include="*.tsx" --include="*.ts" .
grep -rn "from.*components/web/MobileMenu" --include="*.tsx" --include="*.ts" .
```

**Rozhodovací strom:**
- **0 matches mimo samotný soubor:** Migrovat na `PlatformSwitcher` + TODO komentář (orphan potvrzen)
- **≥1 match v app/ nebo components/:** Orphan NENÍ — poslat zprávu team-leadu, zanést do plánu, ne migrovat bez instrukcí
- **Match jen v `components/web/*.tsx` self-imports (např. Navbar importuje MobileMenu):** Orphan je celá triáda, ale musí se migrovat jako celek, ne jednotlivě

**Budoucí cleanup task `#26a`:** Po 1-2 týdnech stabilního běhu bez incidentů, spustit final grep a pokud stále orphan, smazat trojici ve stand-alone commitu s jasnou zprávou.

### 4.5 Beze změny
| Soubor | Proč |
|--------|------|
| `lib/urls.ts` | Helper je kompletní a funkční |
| `.env.example` | Má všechny 4 NEXT_PUBLIC_*_URL vars |
| `components/pwa/TopBar.tsx` | PWA je izolovaný flow pro makléře, cross-platform linky tam nejsou součástí UX |
| `app/(web)/layout.tsx` | Routing už funguje přes `x-subdomain` header |
| `middleware.ts` / `lib/subdomain.ts` | Subdomain detection funguje (jinak by layout už teď nepřepínal) |

---

## 5. Vizuální návrh — navbar platform switcher

### 5.1 Desktop — main navbar (reference)

**Současný stav:**
```
[Logo]  Nabídka vozidel  Inzerce  Shop  Služby▼  O nás▼  Recenze  [Prodat auto] [Přihlásit]
```

**Po implementaci (hideCurrent = filtruje `main`, takže jen 3 linky):**
```
[Logo]  Nabídka vozidel  |  Inzerce  Shop  Marketplace  |  Služby▼  O nás▼  ...  [CTA]
```

Rozdělovače `|` mohou být subtle `border-l border-gray-200 mx-1` mezi group "Nabídka" (interní main content) a group "Ostatní platformy". Nebo bez rozdělovače — designer rozhodne.

### 5.2 Desktop — subdomain navbar (inzerce/shop/marketplace)

**Současný stav (shop):**
```
[Logo Shop]  Katalog dílů  Košík  Moje objednávky  [🛒] carmakler.cz [Přihlásit]
```

**Po implementaci:**
```
[Logo Shop]  Katalog dílů  Košík  Moje objednávky  |  CarMakléř  Inzerce  Marketplace  [🛒] [Přihlásit]
```

Link `CarMakléř` (hlavní web) nahrazuje současné `carmakler.cz`. `Inzerce` + `Marketplace` jsou nové linky.

**Důvod filtrování current:** Uživatel je už na shopu — link "Shop → Shop" nemá smysl. `hideCurrent={true}` skryje aktuální platformu.

### 5.3 Mobile

Mobile menu má vertikální list. Platform switcher:
```
Katalog dílů
Košík
Moje objednávky
───────────────
OSTATNÍ PLATFORMY
CarMakléř
Inzerce
Marketplace
───────────────
[Přihlásit]
```

Uppercase H3 "OSTATNÍ PLATFORMY" jako separátor před sekcí.

### 5.4 Footer

Sekce `Platformy` zůstává v gridu 5-column footer. Obsah:
```
PLATFORMY
CarMakléř
Inzerce
Shop
Marketplace
```

Zde se `hideCurrent` NEpoužívá — footer bývá canonical index všech platforem, OK zobrazit všechny včetně aktuální.

---

## 6. PlatformSwitcher — detailní implementace (pseudokód pro designer/developer)

```typescript
"use client";
import { urls } from "@/lib/urls";

export type PlatformKey = "main" | "inzerce" | "shop" | "marketplace";

const PLATFORMS = [
  {
    key: "main" as const,
    label: "CarMakléř",
    mobileLabel: "Hlavní web",
    href: urls.main("/"),
  },
  {
    key: "inzerce" as const,
    label: "Inzerce",
    mobileLabel: "Inzerce vozidel",
    href: urls.inzerce("/"),
  },
  {
    key: "shop" as const,
    label: "Shop",
    mobileLabel: "Shop — autodíly",
    href: urls.shop("/"),
  },
  {
    key: "marketplace" as const,
    label: "Marketplace",
    mobileLabel: "Marketplace (VIP)",
    href: urls.marketplace("/"),
  },
];

interface Props {
  current: PlatformKey;
  variant?: "navbar" | "navbar-mobile" | "footer";
  hideCurrent?: boolean;
  className?: string;
}

export function PlatformSwitcher({
  current,
  variant = "navbar",
  hideCurrent = false,
  className = "",
}: Props) {
  const items = hideCurrent
    ? PLATFORMS.filter((p) => p.key !== current)
    : PLATFORMS;

  if (variant === "navbar") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {items.map((p) => (
          <a
            key={p.key}
            href={p.href}
            aria-current={p.key === current ? "page" : undefined}
            className={`text-sm font-medium transition-colors no-underline px-4 py-2 rounded-lg hover:bg-gray-50 ${
              p.key === current
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {p.label}
          </a>
        ))}
      </div>
    );
  }

  if (variant === "navbar-mobile") {
    return (
      <div className={className}>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mt-6 mb-2 px-1">
          Ostatní platformy
        </p>
        {items.map((p) => (
          <a
            key={p.key}
            href={p.href}
            aria-current={p.key === current ? "page" : undefined}
            className={`block text-base font-medium py-3 no-underline border-b border-gray-100 ${
              p.key === current ? "text-orange-600" : "text-gray-900 hover:text-orange-500"
            }`}
          >
            {p.mobileLabel}
          </a>
        ))}
      </div>
    );
  }

  // variant === "footer"
  return (
    <ul className={`list-none p-0 m-0 flex flex-col gap-3 ${className}`}>
      {items.map((p) => (
        <li key={p.key}>
          <a
            href={p.href}
            aria-current={p.key === current ? "page" : undefined}
            className={`text-sm transition-colors no-underline ${
              p.key === current
                ? "text-orange-400 font-semibold"
                : "text-gray-500 hover:text-white"
            }`}
          >
            {p.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
```

**Pozor na `"use client"`:** Komponenta musí být client, protože `urls.*` helpery čtou `process.env.NEXT_PUBLIC_*` hodnoty v runtime. V produkci Next.js je nahradí při buildu, ale client-side env vars jsou standard pattern. Alternativně: odvodit hodnoty v server-side parent a předat jako props (komplikuje API, nedoporučuji).

**Aktualizace:** `urls.ts` už NEpoužívá `"use client"` a běží server-side — Next.js inlinuje `NEXT_PUBLIC_*` do buildu. Takže `PlatformSwitcher` MŮŽE být server component, pokud neobsahuje state/interactivity. Aby byl kompatibilní s mobile menu (které je client), nechme client component pro jednoduchost.

---

## 7. Klíčová rozhodnutí

### 7.1 Proč sdílená komponenta místo inline linků?
4 subdomain variants × 3 pozice (navbar desktop / navbar mobile / footer) × 3-4 linky = ~40 míst k ruční údržbě. Komponenta komprimuje na 1 místo. Task #28 (redesign footerů) tuto komponentu znovu využije.

### 7.2 Proč `<a>` místo `<Link>`?
`next/link` provádí client-side routing — **nefunguje přes subdoménové hranice**. Pokud by šel přes subdoménu, Next.js by se snažil `router.push()` na URL s jiným originem, což vyhodí error nebo full page reload bez prefetch. Všechny `urls.*` linky musí být `<a>`. Konvence v `components/main/*` už to tak dělá.

### 7.3 `hideCurrent={true}` v navbaru, `hideCurrent={false}` ve footeru
Navbar: UX pravidlo — neuvažovat o „vraťte se sem, kde jste". Current platforma ve sticky navbaru je redundantní šum.
Footer: Canonical index — ukazuje kompletní seznam všech platforem (including current) jako "mapa webu".

### 7.4 Proč NESmazat `components/web/{Navbar,Footer,MobileMenu}.tsx` v tomto tasku? (REVIDOVÁNO)

**Původní návrh:** ~~smazat orphan soubory~~
**REVIZE 2026-04-06 (team-lead):** Migrovat oba stromy (`components/main/*` + `components/web/*`), označit orphan jako candidate pro budoucí cleanup task.

**Argumenty pro zachování:**
- Git status ukazuje modifications → někdo je nedávno editoval, nevíme proč. Mohou být součástí rozdělané feature branch nebo experimentální flag.
- Safety margin — pokud by náhodou byl skrytý import který grep nezachytil (dynamický import, server action, ...), smazání by rozbilo deploy.
- Dual-write pattern je standardní backwards-compat technika pro refactoring.
- Cleanup v separátním tasku = čistší git history, snadnější rollback.

**Riziko zachování:** Dva zdroje pravdy. Řešení: TODO komentář na orphanu jasně označí že je to legacy, ostatní vývojáři budou editovat main variantu.

**Cleanup task `#26a`** (follow-up) smaže orphany po 1-2 týdnech produkčního běhu.

### 7.5 Proč neměnit `components/pwa/TopBar.tsx`?
PWA je samostatný flow pro makléře. Makléři nepotřebují cross-platform linky ve svém nástroji — PWA je "work mode" pro jeden účel (nabírání aut). Jejich UX je izolovaný. Pokud v budoucnu bude makléř potřebovat rychlý přístup na shop/inzerce, lze přidat samostatně.

### 7.6 Environment vars — už existují
`.env.example` má všechny 4. Žádný edit.

**Production deployment TODO (není součást code task, jen pro info tvému DevOpsovi):**
- Nastavit v Vercel (nebo kde se deployuje) produkční hodnoty:
  ```
  NEXT_PUBLIC_MAIN_URL=https://carmakler.cz
  NEXT_PUBLIC_INZERCE_URL=https://inzerce.carmakler.cz
  NEXT_PUBLIC_SHOP_URL=https://shop.carmakler.cz
  NEXT_PUBLIC_MARKETPLACE_URL=https://marketplace.carmakler.cz
  ```
- DNS záznamy pro 3 subdomény (CNAME na root app)
- HTTPS certifikáty (Vercel automatická Lets Encrypt pro subdomény)

### 7.7 Co s session cookies přes subdomény?
**Out of scope tohoto tasku** — ale důležité pro roadmap. Momentálně NextAuth cookies jsou na doméně origin, takže login na `carmakler.cz` se NEPROPAGUJE na `inzerce.carmakler.cz`. User by musel loginout na každé subdoméně zvlášť. Řešení: nastavit cookie domain na `.carmakler.cz` (s tečkou) — to sdílí cookie napříč všemi subdoménami. Patří do samostatného tasku (auth flow).

---

## 8. Co NEDĚLAT (out of scope)

- **Ne** redesignovat footery — to je task #28 (Footer redesign). Toto je jen migrace na `urls.*` a přidání marketplace linku.
- **Ne** vyřešit cross-subdomain cookie sharing pro auth
- **Ne** vyřešit state sdílení (košík, compare) napříč subdoménami — to je separátní problém
- **Ne** přidat i18n do platform labels — čeština only pro MVP
- **Ne** reworkovat mobile menu layout — jen přidat platform switcher sekci, struktura zůstává
- **Ne** měnit `lib/urls.ts` ani `.env.example` — jsou hotové
- **Ne** dotýkat se `components/pwa/TopBar.tsx` (viz 7.5)
- **Ne** dotýkat se admin UI (`app/(admin)/`) — admin je na hlavní doméně, neřeší subdomain routing
- **Ne** přidávat analytics tracking do linků (z kliku na cross-platform link) — to je marketing task

---

## 9. Alternativa — bez sdílené komponenty (jednodušší, více duplicitní)

Pokud team-lead preferuje inline linky místo sdílené komponenty:

### Varianta B: Inline `<a>` linky

V každém navbaru/footeru ručně přidat linky:
```tsx
<a href={urls.inzerce("/")}>Inzerce</a>
<a href={urls.shop("/")}>Shop</a>
<a href={urls.marketplace("/")}>Marketplace</a>
```

**Odhad:** 9 souborů × ~20 řádek = ~180 řádek k úpravě. Komponenta zkracuje na ~100 (1 nová komponenta + 9 jednoduchých importů).

**Pokud preferuješ Variant B**, řekni mi a upravím plán. Jinak default jde Variant A (sdílená komponenta).

---

## 10. Akceptační kritéria

Hotovo, když:

- [ ] `components/ui/PlatformSwitcher.tsx` existuje a exportuje `PlatformSwitcher` + typ `PlatformKey`
- [ ] Komponenta podporuje 3 varianty: `navbar`, `navbar-mobile`, `footer`
- [ ] Komponenta podporuje `hideCurrent` prop
- [ ] Komponenta používá `urls.*` z `lib/urls.ts` a `<a>` tagy (ne `<Link>`)
- [ ] `MainNavbar` používá `<PlatformSwitcher current="main" hideCurrent />`
- [ ] `MainMobileMenu` používá `<PlatformSwitcher current="main" variant="navbar-mobile" hideCurrent />`
- [ ] `MainFooter` section "Platformy" používá `<PlatformSwitcher current="main" variant="footer" />`
- [ ] `InzerceNavbar` obsahuje platform switcher s `current="inzerce"`
- [ ] `ShopNavbar` obsahuje platform switcher s `current="shop"`
- [ ] `MarketplaceNavbar` obsahuje platform switcher s `current="marketplace"`
- [ ] `InzerceFooter` obsahuje platform switcher s `current="inzerce"` a `variant="footer"`
- [ ] `ShopFooter` stejně
- [ ] `MarketplaceFooter` stejně
- [ ] `components/web/Navbar.tsx` migrován na `PlatformSwitcher` + TODO komentář (dual-write safety)
- [ ] `components/web/Footer.tsx` migrován na `PlatformSwitcher` + TODO komentář
- [ ] `components/web/MobileMenu.tsx` migrován na `PlatformSwitcher` + TODO komentář
- [ ] `npm run build` projde bez errorů (oba stromy paralelně funkční)
- [ ] `components/pwa/TopBar.tsx` zůstává beze změny
- [ ] Marketplace link je zahrnut ve **všech 4 navbarech** (main, inzerce, shop, marketplace)
- [ ] Marketplace link je zahrnut ve **všech 4 footerech**
- [ ] Manuální test:
  - Dev: `http://localhost:3000` → main navbar → klik Inzerce → jde na `http://inzerce.localhost:3000/` ✓
  - Dev: `http://shop.localhost:3000` → shop navbar → klik Inzerce → jde na `http://inzerce.localhost:3000/` ✓
  - Dev: `http://marketplace.localhost:3000` → marketplace navbar → klik Shop → jde na `http://shop.localhost:3000/` ✓
  - Current platform je zvýrazněná nebo skrytá podle `hideCurrent`

---

## 11. Poznámky pro implementátora

1. **Komponentu psát jako `"use client"`** jen pokud bude obsahovat useState/onClick. Pro čistě statické linky stačí server component → Next.js inlinuje `NEXT_PUBLIC_*` do buildu.

2. **PlatformSwitcher = 3 layout varianty v jednom komponentu.** Pokud to designer preferuje rozdělit na `<PlatformSwitcherNav>` + `<PlatformSwitcherFooter>`, jdou 2 komponenty — stále používají stejné `PLATFORMS` pole (jeden source of truth).

3. **Mobile menu v `MainMobileMenu.tsx`** — přečíst soubor před úpravou. Task #18 + jiné tasks ho taky upravovaly. Konflikty git řešit manuálně.

4. **`components/main/MobileMenu.tsx` vs `components/web/MobileMenu.tsx`** — v `components/main/` je ta aktivní (viz layout.tsx), v `components/web/` je orphan. Aktivní má smazat a nahradit Main variantu.

5. **Inzerce/Shop/Marketplace footery** — nejsou přečtené v plánu (nemám plán je měnit dramaticky). Před úpravou každý přečíst, najít logické umístění sekce "Platformy" (obvykle v gridu kolem sekce "Služby" / "O nás"). Konzistentní s `components/main/Footer.tsx` strukturou.

6. **Git status před implementací** ukáže že `components/web/*` jsou modifikované. To je z minulých sessions. **Při mazání git nebude protestovat** — modifikace se smažou spolu se souborem. Ale dát pozor aby mazání bylo součást commitu, ne otevřené working tree.

7. **Vyhnout se nepotřebnému editování současných inline dropdownů** (Služby, O nás v `MainNavbar`). Ty nejsou součástí platform switcher — zůstávají beze změny.

8. **Ověřit middleware funguje** — `middleware.ts` by měl nastavovat `x-subdomain` header. Pokud ne, layout vždy použije `default` → `MainNavbar` a switcher by ukázal `current="main"` i na subdoméně. Ověření: přidat `console.log` do `app/(web)/layout.tsx`, navštívit `shop.localhost:3000`, očekávat `subdomain === "shop"`.

9. **`PlatformSwitcher` je `components/ui/*`** protože je sdílený mezi main/inzerce/shop/marketplace. Ale není to "atomic ui primitive" jako `Button` nebo `Card` — je to "layout component". Alternativa: `components/common/` nebo `components/platform/`. Lokace je otázka taste, ne funkčnosti.
