# Audit duplicit — 2026-04-16

**Autor:** PLANOVAČ
**Scope:** celý repozitář `/Users/zen/Projects/cmklv2/cmklv2`
**Cíl:** najít všechno, co je duplicitní, a navrhnout co sloučit / smazat / redirectnout
**Mandát:** JEN AUDIT, žádná implementace

---

## Shrnutí

**Celkem nalezeno 14 duplicit / dead code položek:**

| Kategorie | Vysoký | Střední | Nízký | OK (úmyslné) |
|---|---|---|---|---|
| Routes | 3 | 1 | 1 | — |
| Komponenty | 2 (dead code) | 2 | 1 | — |
| Layouty | — | — | 1 (Navbars/Footers × 4) | ✅ |
| Seed | — | — | — | ✅ |

**Celkem řádků kódu ke smazání/merge: ~3 000+** (jen z identifikovaných duplicit: shop = 12 stránek × ~200 ř., AddListingForm 551 ř., Cart.tsx 181 ř., makler/[slug] 324 ř., dodavatel/[slug] 181 ř.)

**Doporučené pořadí řešení:**
1. **D1 — Dead code smazání** (AddListingForm + Cart.tsx) — 732 ř., 0 rizik, hned
2. **D2 — `/shop/*` vs `/dily/*`** — velký SEO problém, middleware refaktor, 12 stránek
3. **D3 — `/makler/[slug]` → `/profil/[slug]`** — TASK-032 už má plán, čeká na schválení
4. **D4 — `/dodavatel/[slug]` vs `/dily/vrakoviste/[slug]`** — rychlý 301, 181 ř.
5. **D5 — `/prihlaseni` → `/login`** — změnit z `redirect` na `permanentRedirect` (1 řádek)
6. **D6 — FAQ.tsx vs FaqSection.tsx** — komponenta merge, ~80 ř.
7. **D7 — Kalkulátory × 3** — refactor candidate (volitelné, LOW)

---

## 1. Duplicitní routes (VYSOKÝ impact)

| # | URL A | URL B | Entita | Řádky | Doporučení | Task |
|---|-------|-------|--------|---|------------|------|
| R1 | `/shop/*` (12 stránek) | `/dily/*` (12+ stránek) | E-shop autodílů | ~2 400 ř. | **Smazat `/shop/*`, 301 → `/dily/*` ekvivalent** | **NOVÝ** |
| R2 | `/makler/[slug]` | `/profil/[slug]` | Profil makléře | 324 / 679 ř. | Smazat `/makler/[slug]`, 301 → `/profil/[slug]` | #32 existuje |
| R3 | `/dodavatel/[slug]` | `/dily/vrakoviste/[slug]` | Profil vrakoviště | 181 / 412 ř. | **Smazat `/dodavatel/[slug]`, 301 → `/dily/vrakoviste/[slug]`** | **NOVÝ** |
| R4 | `/prihlaseni` | `/login` | Login stránka | 5 / ~200 ř. | Změnit `redirect()` → `permanentRedirect()` (301 místo 307) | **NOVÝ** |

### R1 detail — `/shop/*` vs `/dily/*` (KRITICKÉ)

**Stav:** celý e-shop existuje na DVĚ URL cesty současně. Uživatelsky matoucí, SEO katastrofa (duplicate content), interní odkazy jsou **rozbité napříč oběma**.

| `/shop/*` soubor | `/dily/*` ekvivalent | Stav |
|---|---|---|
| `app/(web)/shop/page.tsx` (270 ř.) | `app/(web)/dily/page.tsx` (265 ř.) | **Duplikát** (near-identical, oba canonical → oba indexované) |
| `app/(web)/shop/katalog/page.tsx` | `app/(web)/dily/katalog/page.tsx` | Duplikát |
| `app/(web)/shop/kosik/page.tsx` | `app/(web)/dily/kosik/page.tsx` | Duplikát |
| `app/(web)/shop/objednavka/page.tsx` | `app/(web)/dily/objednavka/page.tsx` | Duplikát |
| `app/(web)/shop/objednavka/potvrzeni/page.tsx` | `app/(web)/dily/objednavka/potvrzeni/page.tsx` | Duplikát |
| `app/(web)/shop/moje-objednavky/page.tsx` | `app/(web)/dily/moje-objednavky/page.tsx` | Duplikát (dily LINKUJE na `/shop/moje-objednavky/${id}/vraceni` → **rozbito!**) |
| `app/(web)/shop/moje-objednavky/[id]/vraceni/page.tsx` | — | Jen v shopu |
| `app/(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` | — | Jen v shopu |
| `app/(web)/shop/reklamace/page.tsx` | — | Jen v shopu |
| `app/(web)/shop/vraceni-zbozi/page.tsx` | — | Jen v shopu |
| `app/(web)/shop/produkt/[slug]/page.tsx` | `app/(web)/dily/[slug]/page.tsx` | Duplikát (jiná URL struktura, stejný obsah) |
| `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` | — | Jen v shopu |
| — | `app/(web)/dily/kategorie/[slug]/page.tsx` | Jen v dily (SEO landing) |
| — | `app/(web)/dily/znacka/[brand]/page.tsx` | Jen v dily |
| — | `app/(web)/dily/znacka/[brand]/[model]/page.tsx` | Jen v dily |
| — | `app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx` | Jen v dily |
| — | `app/(web)/dily/vrakoviste/[slug]/page.tsx` | Jen v dily |

**Kanonický:** `/dily/*` (19 stránek, lepší SEO: ISR + JSON-LD + landing pages pro kategorie/značky/modely/roky/vrakoviště).

**Proč `/shop/*` existuje:**
- `middleware.ts:102-106` — subdoména `shop.carmakler.cz` **rewrituje** všechny requesty na `/shop/<path>` interně. Tj. `shop.carmakler.cz/kosik` → internally `/shop/kosik`. Proto `/shop/*` v app/ existuje.
- Ale současně existuje `/dily/*` pro hlavní doménu `carmakler.cz/dily/*`.

**Tedy:** jsme ve stavu kde:
- Subdoména `shop.carmakler.cz/*` = `/shop/*` (270 ř. homepage)
- Hlavní doména `carmakler.cz/dily/*` = `/dily/*` (265 ř. homepage)

**Doporučení:**
1. **Middleware přepsat:** subdoména `shop.*` rewrituje na `/dily/<path>` (ne na `/shop/<path>`).
2. **Doplnit chybějící funkcionality v `/dily/`:** vraceni, reklamace, objednavky/sledovani (4 chybějící stránky).
3. **Smazat `app/(web)/shop/` celé**.
4. **301 redirect (pro starý shop.* subdomain traffic):** po rewrite middleware udělat explicit redirect z `/shop/*` → `/dily/*` (v rámci rewrite subdomain rules) pro případy staré cache.

**Interní odkazy k opravě** (29 souborů linkuje na `/shop`, 20+ na `/dily`):
- `components/web/CartIcon.tsx:17` → `/shop/kosik` → `/dily/kosik`
- `components/web/ProductCard.tsx` → `/shop/produkt/[slug]` → `/dily/[slug]`
- `app/(web)/dily/moje-objednavky/page.tsx:134,137` → **LINKUJE na `/shop/moje-objednavky/${id}/vraceni|reklamace`** (rozbito!) → změnit na `/dily/...`
- Seznam všech `/shop/*` odkazů: 63 výskytů v 29 souborech (viz §6.1 níže)

### R2 detail — `/makler/[slug]` vs `/profil/[slug]` (VYSOKÝ)

**Již řešeno v TASK-032.** Kanonický = `/profil/[slug]`. Plán `plan-task-032-unified-broker-profile.md`. Čeká na schválení + implementaci.

### R3 detail — `/dodavatel/[slug]` vs `/dily/vrakoviste/[slug]` (STŘEDNÍ)

| Soubor | Řádky | Funkcionalita |
|---|---|---|
| `app/(web)/dodavatel/[slug]/page.tsx` | 181 | Profil `Partner` type=VRAKOVISTE. Jednoduché: breadcrumb, header, parts list |
| `app/(web)/dily/vrakoviste/[slug]/page.tsx` | 412 | **Bohatší**: ISR revalidate 86400, generateStaticParams, JSON-LD (Breadcrumb, Store, ItemList, Organization), SupplierReviews, canonical `/dily/vrakoviste/${slug}` |

Oba používají stejný `Partner` model se stejným filtrem (`status: AKTIVNI_PARTNER`, `type: VRAKOVISTE`).

**Nikdo nelinkuje na `/dodavatel/[slug]`** (grep: 0 výskytů kromě self-canonical). Je to **orphan route**.

**Doporučení:**
1. Přepsat `/dodavatel/[slug]/page.tsx` na jednořádkový `permanentRedirect(\`/dily/vrakoviste/${slug}\`)` (zachová 301 pro starý externí traffic).
2. Smazat `/dodavatel/[slug]/loading.tsx`.

### R4 detail — `/prihlaseni` → `/login` (NÍZKÝ)

`app/(web)/prihlaseni/page.tsx`:
```tsx
import { redirect } from "next/navigation";
export default function PrihlaseniPage() {
  redirect("/login");  // ← 307 Temporary Redirect
}
```

**Problém:** `redirect()` vytváří **307** (temporary). Pro SEO lepší **301** (permanent). Google consolidating PageRank vyžaduje 301.

**Fix (1 řádek):**
```tsx
import { permanentRedirect } from "next/navigation";
export default function PrihlaseniPage() {
  permanentRedirect("/login");  // ← 308 Permanent (HTTP equivalent of 301)
}
```

---

## 2. Duplicitní komponenty (VYSOKÝ — dead code)

| # | Komponenta A | Komponenta B | Řádky | Stav | Doporučení |
|---|---|---|---|---|---|
| C1 | `components/web/AddListingForm.tsx` | `components/web/listing-form/ListingFormWizard.tsx` | 551 / ~400 | **AddListingForm DEAD CODE** | **SMAZAT AddListingForm.tsx** |
| C2 | `components/web/Cart.tsx` | `components/web/CartIcon.tsx` | 181 / 30 | **Cart.tsx DEAD CODE** | **SMAZAT Cart.tsx** |
| C3 | `components/web/FAQ.tsx` | `components/web/FaqSection.tsx` | 73 / 83 | Oba použité (různé stránky) | **Merge na FAQ.tsx s optional title prop** |
| C4 | `components/web/BrokerBox.tsx` | `components/web/BrokerCard.tsx` | ~130 / 152 | Oba použité (různé kontexty) | Ponechat, OK (viz §2.4) |
| C5 | `LoanCalculator`, `FinancovaniCalc`, `PriceCalculator` | — | 3 × ~100-200 | Všechny použité (různé účely) | Refactor candidate LOW (viz §2.5) |

### C1 detail — `AddListingForm` DEAD CODE (VYSOKÝ)

**Soubor:** `components/web/AddListingForm.tsx` (551 řádků).
**Grep na import:** 0 výskytů v celém codebase (kromě definice sama).
**Historie:** Pravděpodobně stará verze formuláře pro soukromý inzerát, nahrazena wizardem `listing-form/ListingFormWizard.tsx` (tato je používaná v `/inzerce/pridat`).

**Doporučení:** `git rm components/web/AddListingForm.tsx` (551 ř. dead code).

### C2 detail — `Cart.tsx` DEAD CODE (VYSOKÝ)

**Soubor:** `components/web/Cart.tsx` (181 řádků).
**Grep na import:** 0 výskytů (`Cart`-jako-komponenta, distinct od `Cart`-jako-typ v `types/parts.ts`).
**Kontext:** Obsahuje fullscreen cart s `<Link href="/shop/objednavka">` + `<Link href="/shop/kosik">`. Byla to pravděpodobně slide-out cart komponenta, nahrazena samostatnou `/shop/kosik` stránkou a `CartIcon.tsx` v navbaru.

**Doporučení:** `git rm components/web/Cart.tsx` (181 ř. dead code).

### C3 detail — FAQ vs FaqSection (STŘEDNÍ)

**Funkčně identické:**
| | `FAQ.tsx` | `FaqSection.tsx` |
|---|---|---|
| Typ | Client accordion | Client accordion |
| State | `useState<number \| null>` | `useState<number \| null>` |
| Props | `items: FAQItem[]` | `items: FaqSectionItem[], title?: string` |
| Styl | `flex flex-col gap-3` itemy, card-like `rounded-xl border-gray-200` | `border-b` separator, centered title H2, `max-w-3xl` wrapper |
| Použití | `/chci-prodat`, `/makleri/[slug]`, `ServicePage.tsx` | `/jak-prodat-auto`, `/dily/kategorie/[slug]`, `PriceCalculator.tsx` |

**Rozdíl:** `FaqSection` přidá kolem sebe wrapper (`<section className="py-12 md:py-16">`, `<h2>` title, `max-w-3xl`), `FAQ` je raw. Takže FAQ se musí obalit explicitně.

**Doporučení:** Merge do `FAQ.tsx` s optional props:
```tsx
export interface FAQProps {
  items: FAQItem[];
  title?: string;  // pokud je, obalit do <section> + H2
  variant?: "card" | "divider";  // card = rounded-xl border; divider = border-b only
}
```
Tím nahradí oba, `FaqSection.tsx` lze smazat. ~80 ř. savings + konzistence UI.

### C4 detail — BrokerBox vs BrokerCard (OK)

**Ponechat** — různé use-cases:
- `BrokerBox.tsx` — contact-form-focused, s 2 CTA („Napsat zprávu" scroll-to-form + „Zavolat {phone}"), použit na `/nabidka/[slug]` (detail vozu u makléře). **Těžký na actions.**
- `BrokerCard.tsx` — profile-preview card, s „Zobrazit profil" + volitelně „Kontaktovat" tel link, použit na `/makleri/[slug]` tag landing (TASK-054). **Lehký na preview.**

Oba používají TagPill, Badge, avatar initials. **70% překryv.** Ale různý layout a CTA logika.

**Doporučení:** Ponechat. Při refactoru (budoucí TASK): možná spojit do `<BrokerTile variant="contact|preview" />`, ale to je nice-to-have.

### C5 detail — Kalkulátory × 3 (NÍZKÝ)

| Komponenta | Použitá kde | Co počítá |
|---|---|---|
| `LoanCalculator.tsx` | `/nabidka/[slug]` (detail vozu) | Měsíční splátka úvěru na auto |
| `PriceCalculator.tsx` | `/kolik-stoji-moje-auto` | Odhad ceny auta k prodeji |
| `FinancovaniCalc.tsx` | `/sluzby/financovani` | Financování vozu (úvěr vs leasing vs hotovost) |

**3 různé účely** → ne-duplikát v plném smyslu. Ale:
- `LoanCalculator` a `FinancovaniCalc` počítají podobnou matematiku (úrok, splátka, doba) — **překryv možný**.
- Má smysl zvážit sdílený `useLoanMath()` hook nebo `lib/loan.ts` helper + 3 presentational komponenty.

**Doporučení LOW:** Ponechat samostatné, ale při příštím refactoru extraktovat matematiku do `lib/finance.ts`. **Nespěchá.**

---

## 3. Duplicitní layouty — Navbars / Footers (OK, úmyslné)

**Stav:** 4 Navbars + 4 Footers per product section.

| Soubor | Velikost | Použitý kde |
|---|---|---|
| `components/main/Navbar.tsx` | 10 846 B / ~300 ř. | Hlavní carmakler.cz |
| `components/shop/Navbar.tsx` | 5 183 B / ~150 ř. | shop subdoména |
| `components/inzerce/Navbar.tsx` | 5 006 B / ~150 ř. | inzerce subdoména |
| `components/marketplace/Navbar.tsx` | 4 513 B / ~130 ř. | marketplace subdoména |
| `components/main/Footer.tsx` | 617 B | main |
| `components/shop/Footer.tsx` | 725 B | shop |
| `components/inzerce/Footer.tsx` | 541 B | inzerce |
| `components/marketplace/Footer.tsx` | 666 B | marketplace |
| `components/common/FooterBase.tsx` | — | Sdílený základ (pravděpodobně) |
| `components/common/FooterIcons.tsx` | — | Sdílené ikony |

**Všechny 4 jsou importovány v `app/(web)/layout.tsx`** — aplikace renderuje podle aktuální subdomény jeden z nich. To je **ÚMYSLNÉ** (per-product branding).

**Doporučení:** Ponechat. Při budoucím refactoru zvážit `<Navbar variant="main|shop|inzerce|marketplace" />` s společným základem — ale teď low-value, vysoký risk regrese.

---

## 4. Legacy soubory / dead code

| # | Soubor | Řádky | Důvod | Doporučení |
|---|---|---|---|---|
| L1 | `components/web/AddListingForm.tsx` | 551 | Nikde neimportováno, nahrazeno `ListingFormWizard` | **SMAZAT** |
| L2 | `components/web/Cart.tsx` | 181 | Nikde neimportováno, nahrazeno `CartIcon` + `/shop/kosik` stránka | **SMAZAT** |
| L3 | `app/(web)/shop/*` (12 stránek) | ~2 000 | Nahrazeno `/dily/*` (viz R1) | **SMAZAT po R1 middleware refactor** |
| L4 | `app/(web)/dodavatel/[slug]/page.tsx` + `loading.tsx` | 181 | Nahrazeno `/dily/vrakoviste/[slug]` | **REDIRECT + SMAZAT** |

**Žádné soubory s `legacy`, `deprecated`, `v1`, `old` v názvu** — naštěstí, pouze v obsahu 4 souborů (webhook, PhotosStep, e2e test, storage.ts) — tam jsou to zmínky v komentářích/dokumentaci, ne kódové flagy.

---

## 5. Duplicitní data / seed

**Žádné duplicitní seedy** nalezeny.
- `prisma/seed.ts` (100 createů/upsertů) — hlavní seed (User, Vehicle, Tag, atd.)
- `prisma/seed-partners.ts` (1 create) — separátní partnerský seed (pouze `Partner` model, pravděpodobně z firmy.cz importu)

**Doporučení:** Ponechat — orthogonal účely.

---

## 6. Dodatečné poznatky (šum stojící za zmínku, ne-duplikáty)

### 6.1 /shop → /dily link rozbité napříč

Grep ukázal, že **`/dily/moje-objednavky/page.tsx:134,137`** obsahuje:
```tsx
<Link href={`/shop/moje-objednavky/${order.id}/vraceni`}>
<Link href={`/shop/moje-objednavky/${order.id}/reklamace`}>
```
**Diagnóza:** Když uživatel vstoupí na `/dily/moje-objednavky` a klikne „Vrácení", dostane se na `/shop/moje-objednavky/...` — míchané URL, matoucí. **Fix v R1**.

### 6.2 3 sell-car cesty (UX ambiguity, NE code duplicate)

| URL | Účel | Komponenta |
|---|---|---|
| `/chci-prodat` | CTA na makléřskou službu (hand off) | `SellCarForm` |
| `/inzerce/pridat` | DIY soukromý inzerát | `ListingFormWizard` |
| `/jak-prodat-auto` | SEO article/guide (read-only) | článek + `FaqSection` |

**Nejsou kódové duplikáty**, ale uživatel může být zmatený — která cesta je pro něj? **Product strategy question**, ne technický audit. Flagujeme jako poznámku pro product-owner.

### 6.3 Přidané landing stránky pro `/nabidka/*` (SEO)

`app/(web)/nabidka/<brand|model|city|fuel|priceRange>/page.tsx` — 40+ stránek pro SEO brand/model/city/fuel/price landing. **Ne duplikát**, ale masivní SEO plocha. Drží se konvence `[brand]`, `[brand]/[model]`, `[city]`, `[fuel]`, `do-XXXXXX`. OK, ale **stojí za monitoring** — lze generovat dynamicky.

---

## 7. Doporučené pořadí řešení (priorita)

### Vlna 1 — Quick wins (0-30 min každá)

| # | Úkol | Risk | Effort |
|---|---|---|---|
| **W1.1** | **Smazat `components/web/AddListingForm.tsx`** (551 ř. dead) | **0** | 5 min |
| **W1.2** | **Smazat `components/web/Cart.tsx`** (181 ř. dead) | **0** | 5 min |
| **W1.3** | **`/prihlaseni` změnit `redirect` → `permanentRedirect`** (1 řádek) | **0** | 2 min |
| **W1.4** | **`/dodavatel/[slug]` → 1-line `permanentRedirect('/dily/vrakoviste/${slug}')`, smazat `loading.tsx`** | **LOW** (grep potvrdil 0 interních odkazů) | 15 min |

**Očekávaný výsledek:** 732+ ř. kódu pryč, 1 301 redirect, žádná regrese.

### Vlna 2 — Komponenty

| # | Úkol | Risk | Effort |
|---|---|---|---|
| **W2.1** | **FAQ + FaqSection merge** — rozšířit `FAQ.tsx` o `title?` a `variant?` props, upravit 6 importů, smazat `FaqSection.tsx` | **STŘEDNÍ** (6 stránek musí otestovat) | 1 h |

### Vlna 3 — TASK-032 (už má plán)

| # | Úkol | Risk | Effort | Stav |
|---|---|---|---|---|
| **W3.1** | **Unify broker profile** — viz `plan-task-032-unified-broker-profile.md` | STŘEDNÍ | 3-4 h | Plán hotový, čeká na schválení |

### Vlna 4 — /shop vs /dily (KRITICKÉ)

| # | Úkol | Risk | Effort |
|---|---|---|---|
| **W4.1** | **Middleware refactor** — subdoména shop.* rewrite `/shop/<path>` → `/dily/<path>` | **VYSOKÝ** (middleware changes jsou risk) | 1 h |
| **W4.2** | **Doplnit chybějící funkce v /dily/** — vraceni, reklamace, objednavky/sledovani (4 stránky) | STŘEDNÍ | 2 h |
| **W4.3** | **Opravit 63 interních odkazů** `/shop/*` → `/dily/*` | STŘEDNÍ | 1-2 h |
| **W4.4** | **Smazat `app/(web)/shop/` celé** (12 stránek, ~2000 ř.) | STŘEDNÍ (po W4.1-3) | 30 min |
| **W4.5** | **Explicit 301 redirect `/shop/*` → `/dily/*`** (pro staré cache) | LOW | 15 min |
| **W4.6** | **Sitemap update** — změnit na `/dily/*` only | LOW | 10 min |

**Varování:** W4 je velký refactor, navrhuji **samostatný TASK** (TASK-034 „Sjednotit /shop a /dily") s vlastním plánem.

### Vlna 5 — Kalkulátory (volitelné)

| # | Úkol | Risk | Effort |
|---|---|---|---|
| **W5.1** | Extraktovat matematiku do `lib/finance.ts`, 3 kalkulátory → prezentační | LOW | 2 h |

**Not urgent.** Nice-to-have refactor.

---

## 8. Souhrn akce — kolik řádků odstranit?

| Akce | Řádky pryč | Risk |
|---|---|---|
| Dead code smazání (W1.1, W1.2) | **732** | 0 |
| /prihlaseni fix (W1.3) | 0 (jen change) | 0 |
| /dodavatel redirect (W1.4) | 170 (z 181 → 11) | LOW |
| FAQ merge (W2.1) | ~80 | STŘEDNÍ |
| TASK-032 /makler redirect (W3.1) | ~310 (z 324 → ~10) | STŘEDNÍ |
| /shop smazání (W4.1-5) | ~2 000 | VYSOKÝ |
| **CELKEM** | **~3 300 ř.** | |

---

## 9. Otázky pro team-leada

**Q1:** Vlna 1 (quick wins W1.1-W1.4) — udělat HNED v samostatných micro-taskách (každý ≤15 min) nebo bundle do jednoho commitu „cleanup dead code"?
- **Doporučení:** 4 samostatné micro-tasky, každý jako samostatný commit. Snadné revertovat, clear git history.

**Q2:** Vlna 4 (`/shop` vs `/dily`) — vytvořit **TASK-034** a zpracovat až po TASK-032?
- **Doporučení:** ANO, TASK-034 je velký refactor s vlastním plánem. Přednost TASK-032 (mladší, blokuje user frustration dneska).

**Q3:** Vlna 5 (kalkulátory) — zařadit do backlogu nebo smáznout z doporučení?
- **Doporučení:** Backlog, nízká priorita. Nejprve R1-R4 + C1-C3.

**Q4:** Navbars × 4 — opravdu ponechat, nebo zvážit TASK-035 „unified Navbar with variants"?
- **Doporučení:** **Ponechat.** High risk regrese, low value. Odložit na později. Při příštím větším redesignu.

---

## 10. Memory poznámky

- `project_recurring_tsvector_drift.md` — při spouštění `npm run build` nebo `prisma generate` na lokále možné tsvector drift, standardní fix `migrate reset --force`
- `feedback_git_reset_approval.md` — každá vlna = samostatný commit, žádné reset/amend
- `feedback_no_parallel_impl_test.md` — po každé vlně IMPL sekvenčně, ne paralelně s test-chrome

---

**END OF AUDIT**
