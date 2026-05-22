# Evžen Review — Task #28: FooterBase + 4 footer redesign

**Datum:** 2026-04-06
**Reviewer:** Evžen THE KING (READ-ONLY)
**Commit:** `1a65a0b` — `feat(footer): #28 FooterBase + redesign all 4 footers`
**Rozsah review:** 10 souborů v commitu (3 NEW + 6 EDIT + 1 impl doc)

---

## Původní zadání (literálně)

> **Uživatel (task #28):**
> *"[Image #4] ty footery se musí udělat líp"*
>
> **Screenshot ukazoval:**
> - `[DOPLNIT TELEFON]` placeholder text viditelný
> - Jen 2 sloupce
> - Absence právních informací (IČO/DIČ)
> - Hardcoded social URLs nebo žádné social ikony

**Dekompozice podle team-leada (8 bodů):**

1. Žádné `[DOPLNIT*]` text viditelný
2. Footer má 4 sloupce (ne 2) na desktopu
3. Reálné telefon/IČO/DIČ/adresa (skryté pokud placeholder)
4. Social z `companyInfo.social.*`
5. Všechny 4 platformy mají footer vhodný pro kontext
6. Marketplace v PlatformSwitcher sekci (final user korekt)
7. Shop má trust bar s platby + dopravci
8. Orphan `components/web/Footer.tsx` NESMAZÁNO

---

## 1. Žádný `[DOPLNIT*]` text viditelný

### 1.1 Grep verifikace

```
grep -rn "\[DOPLNIT" components/
→ 0 matches
```

Žádná komponenta neobsahuje literal `[DOPLNIT*]` text. Placeholder hodnoty zůstávají pouze v `lib/company-info.ts` (kde je jejich místo — user je nahradí reálnými hodnotami před launchem).

### 1.2 `isPlaceholder()` helper

`lib/company-info.ts:75-78`:
```typescript
export function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  return value.includes("[DOPLNIT");
}
```

- Pokrývá všechny varianty: `[DOPLNIT]`, `[DOPLNIT TELEFON]`, `[DOPLNIT PSC]`, `[DOPLNIT ULICE A CISLO]`
- Null/undefined safe
- Použit jako conditional render guard na všech potenciálně-placeholder polích

### 1.3 Guards v FooterBase.tsx

| Pole | Řádek | Stav |
|------|-------|------|
| `companyInfo.contact.phone` | 153 | `{!isPlaceholder(phone) && (<li>...</li>)}` |
| `companyInfo.ico` | 208 | `{!isPlaceholder(ico) && <li>IČO: {ico}</li>}` |
| `companyInfo.dic` | 209 | `{!isPlaceholder(dic) && <li>DIČ: {dic}</li>}` |
| `companyInfo.address.full` | 210-212 | `{!isPlaceholder(address.full) && (<li>...</li>)}` |
| Bottom bar IČO | 249 | `{!isPlaceholder(ico) && <span>...</span>}` |
| Bottom bar DIČ | 252 | `{!isPlaceholder(dic) && <span>...</span>}` |

**Verdikt bodu 1:** ✅ **ŽÁDNÝ PLACEHOLDER** — uživatelův screenshot s `[DOPLNIT TELEFON]` je mrtvý, guards skryjí všechno nenaplněné. Grep prokázal 0 výskytů v `components/`.

---

## 2. Footer má 4 sloupce (ne 2) na desktopu

### 2.1 Grid definice

`components/common/FooterBase.tsx:60`:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
```

- **mobile (< 640px):** 1 sloupec
- **tablet (≥ 640px):** 2 sloupce
- **desktop (≥ 1024px):** **4 sloupce** ✅

### 2.2 Obsah sloupců

| # | Sloupec | Obsah | Zdroj |
|---|---------|-------|-------|
| 1 | O nás + social | Logo + badge + tagline + 3× social | FooterBase řádky 61-117 |
| 2 | Produkt (per-platform) | Nadpis + 5 linků | `productColumn` prop |
| 3 | Podpora (shared) | Telefon, email, hodiny, FAQ, kontakt, reklamační řád | FooterBase řádky 147-197 |
| 4 | Firma (shared) | Legal name, IČO/DIČ/adresa, O nás, Kariéra | FooterBase řádky 199-230 |

Všechny 4 footery dědí stejný 4-col layout (DRY: 1 sdílený komponent → 4 wrappery).

**Verdikt bodu 2:** ✅ **4 SLOUPCE DESKTOP** — `lg:grid-cols-4` aplikován na ≥ 1024px, uživatelův screenshot s jen 2 sloupci je minulost.

---

## 3. Reálné telefon/IČO/DIČ/adresa (skryté pokud placeholder)

### 3.1 Zdroj dat

`lib/company-info.ts` — single source of truth. FooterBase importuje `companyInfo` + `isPlaceholder` a vykresluje pole jen pokud nejsou placeholder.

### 3.2 Legal info coverage

- **Sloupec 4 "Firma":** legalName (vždy), IČO (jen pokud není placeholder), DIČ (jen pokud není placeholder), adresa full (jen pokud není placeholder), O nás, Kariéra — řádky 199-230
- **Bottom bar:** © + legalName + IČO (jen pokud není placeholder) + DIČ (jen pokud není placeholder) + legal nav (Ochrana OÚ, Obchodní podmínky, Cookies) — řádky 244-280

### 3.3 GDPR compliance — e-commerce legal requirements

Task #28 doplnil **IČO/DIČ na dvou místech** (sloupec 4 + bottom bar) — to je požadavek českého obchodního práva pro e-shopy (§435 OZ identifikace podnikatele). Plus legal nav (Ochrana OÚ, Obchodní podmínky, Cookies) v bottom baru. ✅

**Verdikt bodu 3:** ✅ **REÁLNÁ LEGAL INFO s conditional rendering** — vše z `companyInfo`, skrýváno za `isPlaceholder()` guardy na 6 místech. Po doplnění reálných hodnot v `company-info.ts` se zobrazí automaticky.

---

## 4. Social z `companyInfo.social.*` (ne hardcoded)

### 4.1 Zdroj social URLs

`lib/company-info.ts:46-50`:
```typescript
social: {
  facebook: "https://facebook.com/carmakler",
  instagram: "https://instagram.com/carmakler",
  youtube: "https://youtube.com/@carmakler",
},
```

**3 platformy** v companyInfo. LinkedIn NENÍ v `companyInfo.social` — ale `LinkedinIcon` je v `FooterIcons.tsx` připravena (impl deviation #1: "rezerva na budoucnost").

### 4.2 Use v FooterBase

`FooterBase.tsx:81-116` — 3 social linky, každý conditional:

```tsx
{companyInfo.social.facebook && (
  <a href={companyInfo.social.facebook} target="_blank" rel="noopener noreferrer" ...>
    <FacebookIcon className="w-5 h-5" />
  </a>
)}
```

- `target="_blank" rel="noopener noreferrer"` — security ✅
- `aria-label` na každém linku — accessibility ✅
- `currentColor` SVG (parent `text-gray-500 hover:text-orange-400`) — design consistency ✅
- Conditional render — pokud `companyInfo.social.facebook` je prázdný string/undefined, ikona se nevyrenderuje

**NEHARDCODED:** Žádný `https://facebook.com` root URL (původní pattern před #28). Vše přes `companyInfo.social.*`. ✅

**Verdikt bodu 4:** ✅ **SOCIAL Z COMPANYINFO** — 3 platformy, conditional render, accessible, security-hardened.

---

## 5. Všechny 4 platformy mají footer vhodný pro kontext

### 5.1 Per-platform product column

| Platforma | Product column | Links |
|-----------|---------------|-------|
| **main** (`main/Footer.tsx:3-20`) | "Služby" | Nabídka vozidel, Prodat auto, Jak to funguje, Staň se makléřem, Blog |
| **shop** (`shop/Footer.tsx:3-22`) | "Shop" | Katalog dílů, Košík, Moje objednávky, Vrácení zboží, Reklamace |
| **inzerce** (`inzerce/Footer.tsx:3-20`) | "Inzerce" | Katalog vozidel, Přidat inzerát, Moje inzeráty, Ceník, Tipy prodejcům |
| **marketplace** (`marketplace/Footer.tsx:3-20`) | "Marketplace" | Jak to funguje, Pro investory, Pro dealery, Žádost o přístup, FAQ |

Každá platforma má **vlastních 5 kontextuálně relevantních linků**. ✅

### 5.2 Marketplace — pouze public routes (kritické)

`components/marketplace/Footer.tsx` obsahuje **POUZE public routes**:
- `/` — landing
- `/apply?role=investor`
- `/apply?role=dealer`
- `/apply`
- `/#faq`

**ŽÁDNÉ gated routes** (`/dealer`, `/investor`) — kdyby tam byly, nepřihlášený návštěvník by dostal 307 redirect na `/login`, což je špatný UX. Marketplace middleware (task #27 + #30) gating už nic z footeru neschová. ✅

### 5.3 Per-platform taglines

Každý wrapper má **vlastní tagline** pod logem odrážející positioning:
- main: *"Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů..."*
- shop: *"E-shop s autodíly. Použité díly z vrakovišť i nové aftermarket díly..."*
- inzerce: *"Inzertní platforma pro prodej a nákup vozidel..."*
- marketplace: *"VIP investiční platforma pro flipping vozidel..."*

### 5.4 Per-platform badge

`PLATFORM_BADGE_LABEL` mapa v `FooterBase.tsx:40-45`:
- main: `null` (no badge — čistý CarMakléř brand)
- shop: `"Shop"`
- inzerce: `"Inzerce"`
- marketplace: `"Marketplace"`

Badge se vyrenderuje vedle loga jen pro 3 subdomény — hlavní web má čisté logo. ✅

**Verdikt bodu 5:** ✅ **PER-PLATFORM KONTEXT** — každá z 4 platforem má vlastní product column (5 linků), tagline, badge. DRY přes FooterBase, ale každý wrapper má svůj unique content.

---

## 6. Marketplace v PlatformSwitcher sekci

### 6.1 FooterBase PlatformSwitcher integrace

`components/common/FooterBase.tsx:233-239`:
```tsx
{/* === PLATFORM SWITCHER === */}
<div className="mt-10 pt-6 border-t border-white/10">
  <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
    Platformy CarMakléř
  </h4>
  <PlatformSwitcher current={platformKey} variant="footer" />
</div>
```

- PlatformSwitcher (task #26 komponenta) volán **bez** `hideCurrent` → zobrazí všechny 4 platformy **včetně self**
- `variant="footer"` → vertical `<ul>` s 4 položkami (CarMakléř, Inzerce, Shop, Marketplace)
- `current={platformKey}` → aktuální platforma má orange highlight + `aria-current="page"`
- Sekce je v každém ze 4 footerů (FooterBase sdílený)

### 6.2 Final user korekt splněna

Uživatel v task #26 explicitně korigoval: *"v menu každé subdomény musí být link na všechny ostatní včetně marketplace"* + task #28 final korekt: *"mužeš otevřít to marketplace ale auta, informace tam budou jenom pro registrovany, pro public tam můžeš dat nejaky veřejny info"*.

Task #28 tohle respektuje:
- **Všechny 4 footery** obsahují link na marketplace (PlatformSwitcher bez hideCurrent) ✅
- **Marketplace footer** má vlastní product column s **pouze public routes** — splňuje "public může vidět základní info" ✅
- **Gated stránky** (`/dealer`, `/investor`) nejsou v footeru — chráněny middleware.ts:227-261 (task #30 fix) ✅

**Verdikt bodu 6:** ✅ **MARKETPLACE VŠUDE + PUBLIC/GATED SEPARACE** — footer exposed public info, middleware drží gated content.

---

## 7. Shop má trust bar s platbami + dopravci

### 7.1 ShopTrustBar obsah

`components/shop/ShopTrustBar.tsx`:
- **Payments (4 položky):** Visa, Mastercard, Apple Pay, Google Pay
- **Carriers (5 položek):** Zásilkovna, DPD, PPL, GLS, Česká pošta
- Grid `grid-cols-1 md:grid-cols-2` — 2 sloupce na desktop (platby | dopravci), 1 na mobile
- Border separator `mt-8 pt-6 border-t border-white/10`
- `TrustBadge` helper — white bg rounded badge s `aria-label` + `title`

### 7.2 Wired do shop footer

`components/shop/Footer.tsx:19`:
```tsx
trustBar={<ShopTrustBar />}
```

`FooterBase.tsx:241-242`:
```tsx
{/* === TRUST BAR (only shop) === */}
{trustBar}
```

Umístění: **mezi** PlatformSwitcher sekcí a bottom bar. Jen shop footer předává `trustBar` prop — ostatní 3 wrappery prop neposkytují → FooterBase vyrenderuje `{undefined}` = nic. ✅

### 7.3 TODO(designer) komentář

`components/shop/ShopTrustBar.tsx:1-10`:
```
TODO(designer): Aktuálně text-badges jako placeholder. Nahradit oficiálními
brand SVG v `public/brand/payment-methods/` a `public/brand/carriers/` —
vyžaduje brand asset approval od značek.
```

**Posouzení:** Text-badge fallback je schválený plánem (sekce 2.5 + 8.8). SVG brand assets vyžadují legal approval od Visa/Mastercard/Apple/Google atd., to není scope task #28. Text-badge funkčně dodává trust signal (stávající carriery zmíněny, platby vidí), zatímco čeká na brand assets. **Žádná demo flag nebo hidden chování** — trust bar je viditelný a funkční, jen grafika bude upgrade. ✅

**Verdikt bodu 7:** ✅ **TRUST BAR FUNKČNÍ** — 4 platby + 5 dopravců, jen shop footer, text-badge fallback s explicit TODO(designer) — žádná skrytá věc, designer upgrade je separate task.

---

## 8. Orphan `components/web/Footer.tsx` NESMAZÁNO

### 8.1 Soubor existuje

```
components/web/Footer.tsx → 28 řádků, tracked
```

### 8.2 TODO komentář + dual-write

`components/web/Footer.tsx:1-8`:
```
/**
 * TODO(cleanup): Pravděpodobně orphan — není importován v žádné App Router route.
 * Grep provedeno 2026-04-06, žádné importy nenalezeny.
 * Zachováno pro safety margin — smazat v cleanup tasku po ověření >= 1 týden produkce.
 * Aktivní varianta je v `components/main/Footer.tsx` (viz app/(web)/layout.tsx).
 *
 * Task #28 dual-write: migrováno na FooterBase stejně jako components/main/Footer.tsx.
 */
```

- TODO z task #26 zachováno ✅
- Explicitně rozšířeno o "Task #28 dual-write" poznámku ✅
- Migrováno na FooterBase (stejný pattern jako main/Footer.tsx) ✅

### 8.3 Synchronizace s aktivní variantou

`components/web/Footer.tsx` i `components/main/Footer.tsx` mají **identické props**:
- `platformKey="main"`
- Identický tagline
- Identický productColumn (5 linků: Nabídka vozidel, Prodat auto, Jak to funguje, Staň se makléřem, Blog)

Pokud by se jednou přišlo, že některá route stále importuje orphan `components/web/Footer.tsx`, funkčně by dostala stejný výstup jako `components/main/Footer.tsx`. ✅

**Verdikt bodu 8:** ✅ **ORPHAN ZACHOVÁNO** — dual-write + synchronní s aktivní variantou + explicit TODO. Safety margin dodržen.

---

## Shrnutí bodů zadání

| # | Bod | Stav | Důkaz |
|---|-----|------|-------|
| 1 | Žádné `[DOPLNIT*]` viditelné | ✅ | grep 0 matches, isPlaceholder na 6 místech |
| 2 | 4 sloupce na desktopu | ✅ | `lg:grid-cols-4` + 4 distinct columns (O nás, Produkt, Podpora, Firma) |
| 3 | Reálné telefon/IČO/DIČ/adresa (skryté pokud placeholder) | ✅ | Guards na phone, ico, dic, address.full + bottom bar ico/dic |
| 4 | Social z `companyInfo.social.*` | ✅ | FB/IG/YT conditional, žádný hardcoded URL, target=_blank + noreferrer |
| 5 | Per-platform footer content | ✅ | 4 product columns, 4 taglines, 3 badges (main bez) |
| 6 | Marketplace v PlatformSwitcher sekci | ✅ | FooterBase:238 bez hideCurrent → 4/4 footery obsahují marketplace |
| 7 | Shop trust bar s platby + dopravci | ✅ | 4 platby + 5 dopravců, TODO(designer) přítomen pro brand SVG |
| 8 | Orphan `components/web/Footer.tsx` nesmazáno | ✅ | Existuje, TODO rozšířeno + dual-write migrace + synchronní s main |

**Body zadání: 8/8 ✅**

---

## Cross-check s upstream artefakty

- **Plán (`plan-task-28-footers.md`):** 4-col grid, per-platform wrappers, ShopTrustBar, isPlaceholder helper — vše splněno.
- **Impl report:** 22/23 acceptance criteria ✅ + 1 manual test ponechán pro QA. 5 deviations (všechny v souladu s plánem sekce 6/7/8).
- **QA report (`qa-task-28-footers.md`):** 23/23 PASS, build ✅, lint = baseline (0 nových problémů).

Žádný skrytý drift mezi plánem, implementací a QA. Všechny 4 deviations z impl jsou schválené plánem (LinkedIn rezerva, PlatformSwitcher vertikální variant, PLATFORM_BADGE_LABEL mapa, text-badge fallback).

---

## Pozorování z review

### Žádné skryté stránky

Commit `1a65a0b` nezasahuje do `app/` — footer je navigation component, žádné route se nepřidaly ani neschovaly.

```
git show 1a65a0b --stat | grep "^ app/"
→ 0 matches
```

### DRY faktor

- **Před #28:** ~700 řádků duplicate footer kódu (4 × ~100-130 řádků custom footer + orphan).
- **Po #28:** 280 řádků FooterBase + 5 × ~22 řádků wrappers + 66 řádků ShopTrustBar + 43 řádků FooterIcons.
- **Net change:** −66 řádků celkem (dle commit stat).
- **Single source of truth:** 4-col grid, legal block, PlatformSwitcher integrace — vše v 1 sdíleném komponentu.

### Kontext task #26 → #28

Task #28 správně reusuje `PlatformSwitcher` z task #26 (commit `7e2c373`). Sekce "Platformy CarMakléř" ve FooterBase využívá `variant="footer"` → konzistentní s tím, co jsem schválil v review #26. Žádný parallel implementation ani refactor #26 — čistá kompozice.

### Shop text-badge je "in progress", ne demo

Trust bar je **plně funkční** (payments + carriers viditelné, aria-label, title) — jen vizuální upgrade na brand SVG čeká na designer + brand approval. Nejedná se o "hidden" nebo "demo" stavu — user to uvidí v produkci jako text badges a přečte, které platby/dopravci jsou podporovány. To je validní trust signal. Task #29+ (nebo separate design task) doplní grafiku.

---

## VERDIKT

## ✅ **SCHVÁLENO** (APPROVED)

Task #28 (commit `1a65a0b`) literálně řeší uživatelovu zpětnou vazbu *"ty footery se musí udělat líp"*:

1. **Screenshot problém `[DOPLNIT TELEFON]`** → `isPlaceholder()` guards na phone, ico, dic, address.full v 6 místech + grep 0 matches. Jakmile user doplní reálné hodnoty v `company-info.ts`, zobrazí se automaticky.

2. **2-sloupcový layout** → 4-sloupcový grid (O nás, Produkt, Podpora, Firma) na desktop, responzivní downgrade na 2/1 pro tablet/mobile.

3. **Legal info chybělo** → IČO/DIČ/adresa/legal name ve sloupci 4 + bottom bar (GDPR/§435 OZ compliance, conditional rendering).

4. **Hardcoded social** → `companyInfo.social.*` (FB/IG/YT), conditional render, security headers.

5. **Per-platform context** → 4 distinct product columns, 4 taglines, 3 badges — každá subdoména má vlastní relevantní linky.

6. **Final user korekt marketplace** → marketplace ve všech 4 footerech (PlatformSwitcher), marketplace footer obsahuje pouze public routes (middleware chrání gated).

7. **Trust signals pro shop** → ShopTrustBar s 4 platbami + 5 dopravci, TODO(designer) pro brand SVG (funkčně OK jako text-badges).

8. **Orphan safety margin** → `components/web/Footer.tsx` zachováno + TODO + dual-write migrace na FooterBase.

**Žádné follow-upy z review #28 blokující**. Mimo scope (bude separate task): designer dodá brand SVG pro ShopTrustBar, user doplní reálné IČO/DIČ/telefon/adresu do `company-info.ts` před launchem. Obě závislosti jsou explicitně dokumentované (TODO komentáře).

**Batch #26 + #28 je připraven na prezentaci uživateli po test-chrome ověření.**
