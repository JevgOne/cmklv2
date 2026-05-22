# Evžen Review — Task #26: PlatformSwitcher (subdomain cross-linking)

**Datum:** 2026-04-06
**Reviewer:** Evžen THE KING (READ-ONLY)
**Commit:** `7e2c373` — `feat(nav): #26 PlatformSwitcher — subdomain cross-linking`
**Rozsah review:** 15 souborů v commitu (1 NEW + 13 EDIT + 1 impl doc)

---

## Původní zadání (literálně)

> **Uživatel (task #26):**
> "uprav pak menu, když dam inzerce tak to nefunguje napoj to už když jsou ty subdomeny"
>
> **Uživatelova korekce (před startem task #26):**
> "v menu každé subdomény musí být link na všechny ostatní **včetně marketplace**"

**Dekompozice:**
1. Menu musí propojovat subdomény (klik na "Inzerce" → opravdu otevře `inzerce.carmakler.cz`)
2. Marketplace MUSÍ být ve všech 4 menu + footer
3. PWA `TopBar` (makléř app) NESMÍ být dotčen — jiný flow
4. Žádné skryté stránky (pravidlo admin)
5. Orphan `components/web/*` NESMAZÁNY — jen označeny TODO (safety margin)
6. Deviation od plánu musí být opodstatněné

---

## 1. Menu skutečně propojuje subdomény

### 1.1 `<a>` tagy, ne `<Link>` (cross-origin compatibility)

`components/ui/PlatformSwitcher.tsx` používá **pouze** `<a>` tagy:
- řádek 72 — variant `navbar`
- řádek 105 — variant `navbar-mobile`
- řádek 131 — variant `footer`

**Proč to je kritické:** `next/link` přepíše klik na client-side router push, který nefunguje přes `origin` hranice. Pro cross-subdomain navigaci (`carmakler.cz` → `inzerce.carmakler.cz`) musí browser udělat plný HTTP request, což umožňuje jen native `<a>`. ✅

### 1.2 URLs z `lib/urls.ts`, ne hardcoded

```tsx
const PLATFORMS: Platform[] = [
  { key: "main", ..., href: urls.main("/") },
  { key: "inzerce", ..., href: urls.inzerce("/") },
  { key: "shop", ..., href: urls.shop("/") },
  { key: "marketplace", ..., href: urls.marketplace("/") },
];
```

`urls.*` helpery v `lib/urls.ts` produkují plné subdomain URLs (z `NEXT_PUBLIC_*_URL` env var, které Next.js inlinuje do buildu). Single source of truth — na dev `localhost:3000`, na prod `inzerce.carmakler.cz`. ✅

### 1.3 Grep verifikace použití

Všech 14 očekávaných souborů importuje a volá `PlatformSwitcher`:

| Soubor | current | variant | hideCurrent | theme |
|--------|---------|---------|-------------|-------|
| `main/Navbar.tsx:108` | main | default (navbar) | ✅ | light |
| `main/MobileMenu.tsx:86` | main | navbar-mobile | ✅ | light |
| `main/Footer.tsx` *(v commitu 7e2c373)* | main | footer | ❌ | light |
| `inzerce/Navbar.tsx:46` | inzerce | navbar (desktop) | ✅ | light |
| `inzerce/Navbar.tsx:105` | inzerce | navbar-mobile | ✅ | light |
| `inzerce/Footer.tsx:54` | inzerce | footer | ❌ | light |
| `shop/Navbar.tsx:47` | shop | navbar (desktop) | ✅ | light |
| `shop/Navbar.tsx:110` | shop | navbar-mobile | ✅ | light |
| `shop/Footer.tsx:54` | shop | footer | ❌ | light |
| `marketplace/Navbar.tsx:40` | marketplace | navbar (desktop) | ✅ | **dark** |
| `marketplace/Navbar.tsx:92` | marketplace | navbar-mobile | ✅ | **dark** |
| `marketplace/Footer.tsx:49` | marketplace | footer | ❌ | light |
| `web/Navbar.tsx:118` | main | navbar | ✅ | light |
| `web/MobileMenu.tsx:92` | main | navbar-mobile | ✅ | light |
| `web/Footer.tsx:101` | main | footer | ❌ | light |

**Pattern:**
- Navbar = `hideCurrent` → na `inzerce.carmakler.cz` se nezobrazí link "Inzerce" (user je tam), zobrazí se zbývající 3 platformy včetně marketplace
- Footer = bez `hideCurrent` → canonical index, zobrazí všechny 4 platformy včetně self

**Verdikt bodu 1:** ✅ **PROPOJENÍ FUNGUJE** — opustit původ (client router push) nahrazeno nativním `<a>` s build-time injektovaným subdomain URL. Klik na "Inzerce" otevře `inzerce.carmakler.cz` jak uživatel chtěl.

---

## 2. Marketplace JE ve všech 4 menu/footer

Původní plán (před user korekcí) marketplace ponechával mimo subdomain navbarky. Uživatel na to upozornil explicitně — "včetně marketplace". Ověření:

### 2.1 Marketplace v navbarech

`PLATFORMS` array obsahuje marketplace jako 4. položku (řádek 32-36). S `hideCurrent={true}` na každé subdoméně:

| Subdoména | Zobrazené platformy v navbaru |
|-----------|-------------------------------|
| main (`carmakler.cz`) | Inzerce, Shop, **Marketplace** |
| inzerce (`inzerce.carmakler.cz`) | CarMakléř, Shop, **Marketplace** |
| shop (`shop.carmakler.cz`) | CarMakléř, Inzerce, **Marketplace** |
| marketplace (`marketplace.carmakler.cz`) | CarMakléř, Inzerce, Shop |

Marketplace má vlastní entry + je ve všech 3 ostatních. ✅

### 2.2 Marketplace ve footerech

Všechny 4 footery volají `PlatformSwitcher variant="footer"` **bez** `hideCurrent`. Důsledek: footer je canonical index a ukazuje všechny 4 platformy **včetně self**.

Marketplace footer (řádek 49): `<PlatformSwitcher current="marketplace" variant="footer" />` → vyrenderuje CarMakléř + Inzerce + Shop + Marketplace (self highlighted). ✅

**Verdikt bodu 2:** ✅ **MARKETPLACE VŠUDE** — uživatelova korekce splněna, 4/4 navbary i 4/4 footery obsahují marketplace link.

---

## 3. PWA TopBar NENÍ dotčen

### 3.1 Grep verification

```
grep "PlatformSwitcher" components/pwa/TopBar.tsx
→ 0 matches
```

### 3.2 Commit verification

```
git show 7e2c373 --stat
→ 15 files changed, žádný v components/pwa/
```

PWA TopBar (makléř app) má úplně jiný flow — broker je přihlášený, pracuje pouze v makléřské síti, nepotřebuje cross-subdomain switcher. Plán to respektuje v sekci 4.5 ("PWA `TopBar` — NEMĚNIT"). ✅

**Verdikt bodu 3:** ✅ **PWA NEDOTČENO** — 0 zásahů do `components/pwa/`.

---

## 4. Žádné skryté stránky

PlatformSwitcher je **navigation komponenta**, ne route. Žádný `app/**/page.tsx` nebyl přidán ani skryt. Commit neobsahuje žádný soubor v `app/`:

```
git show 7e2c373 --stat | grep "^ app/"
→ 0 matches
```

**Verdikt bodu 4:** ✅ **ŽÁDNÉ SKRYTÉ STRÁNKY**.

---

## 5. Orphan soubory NESMAZÁNY — jen označeny TODO

### 5.1 Stále existují

```
components/web/Navbar.tsx       ✅ (tracked, existuje)
components/web/MobileMenu.tsx   ✅ (tracked, existuje)
components/web/Footer.tsx       ✅ (tracked, existuje)
```

### 5.2 TODO komentáře přítomny (ověřeno čtením řádků 1-6)

**`components/web/Navbar.tsx`** (řádky 1-6):
```
/**
 * TODO(cleanup): Pravděpodobně orphan — není importován v žádné App Router route.
 * Grep provedeno 2026-04-06, žádné importy nenalezeny.
 * Zachováno pro safety margin — smazat v cleanup tasku po ověření >= 1 týden produkce.
 * Aktivní varianta je v `components/main/Navbar.tsx` (viz app/(web)/layout.tsx).
 */
```

**`components/web/Footer.tsx`** (řádky 1-6): identický pattern, odkaz na `main/Footer.tsx`.

**`components/web/MobileMenu.tsx`** (řádky 1-6): identický pattern, odkaz na `main/MobileMenu.tsx`.

### 5.3 Dual-write pattern

Všechny 3 orphan soubory byly **migrovány na PlatformSwitcher** (i když jsou orphan), aby se nezkaznila synchronicita s aktivními `components/main/*`. Pokud by se někdy dne přišlo, že jsou stále reference, fallback bude funkčně identický s produkcí.

**Verdikt bodu 5:** ✅ **SAFETY MARGIN DODRŽEN** — orphan soubory zachovány, označeny, migrovány. Žádné riziko neochoty-smazáním, žádné riziko funkčního driftu.

---

## 6. Deviation od plánu — opodstatněné

Impl report deklaruje 3 odchylky. Moje posouzení každé:

### 6.1 Server component místo `"use client"`

**Plán (sekce 3.1):** `"use client"` — výchozí předpoklad.
**Plán (sekce 6 — aktualizace):** _"`urls.ts` už NEpoužívá `"use client"` a běží server-side... `PlatformSwitcher` MŮŽE být server component."_
**Implementace:** Server component.

**Posouzení:** Plán explicitně tuto deviation předvídal a povolil. Komponenta nemá `useState`/`useEffect`/`onClick` (kromě opt prop `onLinkClick`, který funguje v RSC → CC boundary protože rodič `MobileMenu` je už client). Server component šetří JS bundle. ✅ **OPODSTATNĚNO**.

### 6.2 Odstraněný `carmakler.cz` fallback v subdomain navbarech

**Plán:** nepřikazoval odstranění.
**Implementace:** Odstraněn.

**Posouzení:** V subdomain navbarech byl původně samostatný `<a href="https://carmakler.cz">CarMakléř</a>` link + teprve potom PlatformSwitcher. PlatformSwitcher **už obsahuje** entry "CarMakléř" (key=main) → duplikát. Ponechání obou = 2× link na main subdomain, user confusion. Odstranění je cleanup, ne feature loss. ✅ **OPODSTATNĚNO**.

### 6.3 Odstraněná "Pro makléře" položka z MainFooter

**Plán (sekce 4.3):** _"Odstranit položku 'Provizní systém' (není relevantní cross-platform)"_ — explicitní instrukce jen pro Provizní systém.
**Implementace:** Také odstraněna položka "Pro makléře" (`/kariera`) ze sekce "Platformy".

**Posouzení:** `/kariera` je career page, ne cross-platform link. Míchat kariéru s 4 platformami by bylo uživatelsky matoucí. Instrument-consistent aplikace stejné logiky jako u Provizního systému. "Kariéra" je v MainFooter stále přítomna v sekci "O nás" (ověřeno ve verze commitu 7e2c373, řádek ~23). ✅ **OPODSTATNĚNO**.

**Verdikt bodu 6:** ✅ **3/3 DEVIATIONS OPRÁVNĚNÉ** — všechny tři jsou menší konzistentní úpravy, žádná nezavádí UX regresi ani funkčně neredukuje rozsah.

---

## Shrnutí bodů zadání

| # | Bod | Stav | Důkaz |
|---|-----|------|-------|
| 1 | Menu propojuje subdomény | ✅ | `<a>` + `urls.*` + PLATFORMS (148 řádků komponenty) |
| 2 | Marketplace ve všech 4 menu + footer | ✅ | 4/4 navbary (hideCurrent+3), 4/4 footery (canonical 4) |
| 3 | PWA TopBar nedotčen | ✅ | grep 0 matches, commit 0 `pwa/` souborů |
| 4 | Žádné skryté stránky | ✅ | commit 0 `app/` souborů |
| 5 | Orphan `components/web/*` zachovány + TODO | ✅ | 3/3 soubory existují, 3/3 mají TODO řádky 1-6 |
| 6 | 3 deviations opodstatněné | ✅ | Server component (plán povolil), carmakler.cz (duplikát), Pro makléře (konzistence) |

**Body zadání: 6/6 ✅**

---

## Cross-check s upstream artefakty

- **Plán (`plan-task-26-subdomain-menu.md`):** 20 acceptance criteria, všech 20 splněno.
- **Impl report (`impl-task-26-subdomain-menu.md`):** 21 checkboxů, 20 ✅ + 1 "ponecháno pro QA" (manuální subdomain test).
- **QA report (`qa-task-26-platformswitcher.md`):** 20/20 PASS, build ✅, lint −1 (improvement).

Všechny 3 upstream artefakty souhlasí. Žádný skrytý drift.

---

## Pozorování mimo scope task #26 (informační, neblokující)

Během review jsem zjistil, že `components/main/Footer.tsx` byl následně (post-7e2c373) přepsán na thin wrapper nad `components/common/FooterBase.tsx` (untracked, task #28 WIP). To je OUTSIDE scope task #26 a nemá vliv na verdikt této review. Task #26 v commitu `7e2c373` je úplný a správný.

---

## VERDIKT

## ✅ **SCHVÁLENO** (APPROVED)

Task #26 (commit `7e2c373`) literálně řeší uživatelovo zadání:

1. **"uprav pak menu, když dam inzerce tak to nefunguje napoj to už když jsou ty subdomeny"** → PlatformSwitcher s `<a>` + build-time injektovanými subdomain URLs. Klik na "Inzerce" teď skutečně otevře `inzerce.carmakler.cz`.

2. **"včetně marketplace"** → Marketplace ve všech 4 navbarech (hideCurrent+3) i všech 4 footerech (canonical 4).

3. Všechna admin pravidla (žádné skryté stránky, PWA nedotčeno, orphan safety margin) dodržena.

4. 3 deviations od plánu jsou opodstatněné a plán je buď povolil (server component) nebo jsou nepsané konzistentní mikroúpravy (carmakler.cz duplikát, "Pro makléře" cleanup).

**Žádné doporučené follow-upy z tohoto review.** Task #28 (footers refactor) běží nezávisle.
