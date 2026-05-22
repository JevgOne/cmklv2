# Plán — Task #49 (FIX #28b): 4 broken footer linky batch 2

**Priorita:** NORMAL (neblokuje ship #26+#28)
**Typ:** Bugfix + 2 nové static stránky
**Zadal:** team-lead 2026-04-06
**Návazný na:** task #44/#47 (#28a), rozšiřuje o 4 subdoménové broken linky nalezené proaktivním sweepem

---

## 1. Cíl

Opravit 4 zbývající broken footer linky na subdoménách (`shop.carmakler.cz`, `inzerce.carmakler.cz`):

| # | Footer | Link | Decision | Reason |
|---|--------|------|----------|--------|
| 1 | shop | `/vraceni-zbozi` | **B — Create stub** `app/(web)/shop/vraceni-zbozi/page.tsx` | E-shop zákazníci očekávají dedikovanou info stránku; právně vhodné |
| 2 | shop | `/reklamace` | **B — Create stub** `app/(web)/shop/reklamace/page.tsx` | Same rationale |
| 3 | inzerce | `/cenik` | **A — Remove** z `components/inzerce/Footer.tsx` | Neplánovaný content (jako „Blog" v #44) |
| 4 | inzerce | `/tipy` | **A — Remove** z `components/inzerce/Footer.tsx` | Neplánovaný content |

## 2. Discovery — klíčové nálezy

### 2.1 Existující „master" legal content
`app/(web)/reklamacni-rad/page.tsx` (287 řádků) už obsahuje **kompletní právní text** — 10 sekcí pokrývajících:
- Záruční doby (24 měs. nové / 12 měs. použité díly)
- Odstoupení od smlouvy (§ 1829 OZ — **14 dní**)
- Uplatnění reklamace (postup, lhůty, formulář)
- Lhůty pro vyřízení (30 kalendářních dní — § 19 ZOS)
- Způsoby vyřízení, náklady, mimosoudní řešení (ČOI, ODR)
- Kontakt `reklamace@carmakler.cz`

**→ Stub stránky NESMÍ duplikovat právní text.** Místo toho: krátké user-friendly summary + **CTA link** na `/reklamacni-rad` pro plný znění + CTA na `moje-objednavky` pro akci.

### 2.2 Per-order flow už funguje
- `app/(web)/shop/moje-objednavky/[id]/vraceni/page.tsx` — client component form s API submission
- `app/(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` — client component form s file upload

**→ Stub landing stránky jsou „brány" pro uživatele: info + CTA vedoucí k seznamu objednávek.** Flow: stub page → /shop/moje-objednavky → per-order form.

### 2.3 Subdoménové routing — ověřeno v `middleware.ts:67-73`
```ts
if (subdomain === "shop") {
  if (pathname.startsWith("/shop") || pathname.startsWith("/dily")) return null;
  const rewriteUrl = new URL(`/shop${pathname}`, request.url);
  return rewriteUrl;
}
```
→ `shop.carmakler.cz/vraceni-zbozi` → rewrite → `/shop/vraceni-zbozi/page.tsx`. Physical page path je `app/(web)/shop/vraceni-zbozi/page.tsx`. ✅

### 2.4 Boilerplate patterns (reference z `reklamacni-rad/`)
- `loading.tsx`: 13 řádků, jednoduchý skeleton s `animate-pulse` — 1 title div + 12 content rows
- `error.tsx`: 10 řádků, `"use client"` + basic error message
- `page.tsx`: Server Component + `export const metadata` + JSON-LD + Breadcrumbs + `<div className="max-w-4xl mx-auto">` + `<div className="prose prose-gray">`

### 2.5 Breadcrumbs komponenta
`components/web/Breadcrumbs.tsx` je sdílená — použitá v `reklamacni-rad/page.tsx:47-52`:
```tsx
<Breadcrumbs items={[
  { label: "Domů", href: "/" },
  { label: "Reklamační řád" },
]} />
```
Na shop subdoméně `/` se rewritne na `/shop/page.tsx` — tedy „Domů" = shop home po rewrite. ✅ OK pro naše stub pages.

## 3. Dotčené soubory

| # | Soubor | Akce | Řádky |
|---|--------|------|-------|
| 1 | `app/(web)/shop/vraceni-zbozi/page.tsx` | **Create** | ~100 |
| 2 | `app/(web)/shop/vraceni-zbozi/loading.tsx` | **Create** | 13 (copy from reklamacni-rad) |
| 3 | `app/(web)/shop/vraceni-zbozi/error.tsx` | **Create** | 10 (copy from reklamacni-rad) |
| 4 | `app/(web)/shop/reklamace/page.tsx` | **Create** | ~100 |
| 5 | `app/(web)/shop/reklamace/loading.tsx` | **Create** | 13 |
| 6 | `app/(web)/shop/reklamace/error.tsx` | **Create** | 10 |
| 7 | `components/inzerce/Footer.tsx` | **Edit** | delete lines 14-15 (`/cenik`, `/tipy`) |

**Pozn.:** `components/shop/Footer.tsx` NEEDITOVAT — linky `/vraceni-zbozi` a `/reklamace` zůstávají, začnou fungovat jakmile stub pages existují.

## 4. Content specifikace — stub stránka `/vraceni-zbozi`

### Struktura (Server Component)
```
<Breadcrumbs [Domů / Shop / Vrácení zboží]>
<h1>Vrácení zboží</h1>
<p className="lead">Máte 14 dní na odstoupení od smlouvy bez udání důvodu.</p>

<div className="grid 2 cols">
  <Box icon="⏱" title="14 dní od převzetí" text="Lhůta běží od doručení, ne od objednávky." />
  <Box icon="📦" title="Nepoužité, v původním obalu" text="Nepoškozené, nenamontované." />
</div>

<h2>Jak vrátit zboží — 3 kroky</h2>
<ol>
  <li>Přihlaste se a v sekci Moje objednávky vyberte objednávku → Vrátit zboží</li>
  <li>Vyplňte důvod vrácení + zvolte položky (formulář uloží žádost)</li>
  <li>Zboží zašlete na adresu [zobrazenou ve formuláři] do 14 dní od odstoupení</li>
</ol>

<CTA button="Přejít na Moje objednávky" href="/shop/moje-objednavky" variant="primary">

<h2>Kdy NELZE vrátit zboží?</h2>
<ul>
  <li>Zboží na míru (upravené na zakázku)</li>
  <li>Použité díly po montáži (změna charakteru)</li>
  <li>Zapečetěné zboží rozbalené z hygienických důvodů (filtry)</li>
</ul>
<p className="note">Plný právní text: <Link href="/reklamacni-rad#odstoupeni">Reklamační řád § 3</Link></p>

<ContactBox>
  <p>Potřebujete pomoc? Ozvěte se na <a href="mailto:info@carmakler.cz">info@carmakler.cz</a></p>
</ContactBox>
```

### Metadata
```ts
export const metadata: Metadata = {
  title: "Vrácení zboží | CarMakler Shop",
  description: "Máte 14 dní na vrácení zakoupených dílů bez udání důvodu. Postup krok-za-krokem a kontakt.",
  openGraph: {
    title: "Vrácení zboží | CarMakler Shop",
    description: "14 dní na odstoupení od smlouvy. Postup vrácení v 3 krocích.",
  },
  alternates: { canonical: `${BASE_URL}/shop/vraceni-zbozi` },
};
```

### JSON-LD
`WebPage` schema — stejný pattern jako `reklamacni-rad/page.tsx:20-31`.

## 5. Content specifikace — stub stránka `/reklamace`

### Struktura
```
<Breadcrumbs [Domů / Shop / Reklamace]>
<h1>Reklamace</h1>
<p className="lead">Zjistili jste vadu? Uplatněte reklamaci online za pár minut.</p>

<div className="grid 2 cols">
  <Box icon="🛠" title="24 měs nové / 12 měs použité díly" />
  <Box icon="⏱" title="30 dní na vyřízení (zákonná lhůta)" />
</div>

<h2>Jak reklamovat — 4 kroky</h2>
<ol>
  <li>Přihlaste se a v sekci Moje objednávky vyberte objednávku → Reklamovat</li>
  <li>Popište závadu + nahrajte min. 2 fotky (povinné)</li>
  <li>Zvolte požadovaný způsob vyřízení (oprava / výměna / sleva / vrácení peněz)</li>
  <li>Do 3 pracovních dní obdržíte RMA číslo a harmonogram vyřízení</li>
</ol>

<CTA button="Přejít na Moje objednávky" href="/shop/moje-objednavky" variant="primary">

<h2>Co se do reklamace NEpočítá?</h2>
<ul>
  <li>Běžné opotřebení při užívání</li>
  <li>Mechanické poškození (např. při montáži)</li>
  <li>Nesprávná montáž nebo nekompatibilní použití</li>
</ul>
<p className="note">Plný právní text: <Link href="/reklamacni-rad">Reklamační řád</Link></p>

<ContactBox>
  <p>Máte dotaz? <a href="mailto:reklamace@carmakler.cz">reklamace@carmakler.cz</a></p>
</ContactBox>
```

### Metadata + JSON-LD — same pattern.

## 6. Edit `components/inzerce/Footer.tsx`

**Původní (řádky 10-17):**
```tsx
links: [
  { href: "/katalog", label: "Katalog vozidel" },
  { href: "/pridat", label: "Přidat inzerát" },
  { href: "/moje-inzeraty", label: "Moje inzeráty" },
  { href: "/cenik", label: "Ceník" },       // ← DELETE
  { href: "/tipy", label: "Tipy prodejcům" }, // ← DELETE
],
```

**Nové:**
```tsx
links: [
  { href: "/katalog", label: "Katalog vozidel" },
  { href: "/pridat", label: "Přidat inzerát" },
  { href: "/moje-inzeraty", label: "Moje inzeráty" },
],
```

**Výsledek:** sloupec má 3 linky místo 5 — vizuálně stále OK, žádné prázdné místo.

## 7. Out of scope

- ❌ Psát plný právní text do stub stránek — `/reklamacni-rad` je master dokument
- ❌ Implementovat server actions/API (formy už existují v `/shop/moje-objednavky/[id]/vraceni` a `[id]/reklamace`)
- ❌ Přidávat nové email aliasy (`reklamace@carmakler.cz` už je v `/reklamacni-rad`)
- ❌ Redesign `components/inzerce/Footer.tsx` nad rámec 2 řádků delete
- ❌ Smazání orphan `components/web/Footer.tsx` (cleanup task #28b není)
- ❌ Přidávat stránky do `sitemap.ts` — můžeme udělat v samostatném SEO tasku pokud team-lead chce, ale footer stub stránky typicky nejdou do sitemapy

## 8. Acceptance criteria

**Pages:**
- [ ] `app/(web)/shop/vraceni-zbozi/page.tsx` existuje jako Server Component
- [ ] `app/(web)/shop/reklamace/page.tsx` existuje jako Server Component
- [ ] Obě stránky mají metadata (title, description, OG, canonical)
- [ ] Obě stránky mají JSON-LD `WebPage` schema
- [ ] Obě stránky mají Breadcrumbs komponentu
- [ ] Obě stránky mají CTA button → `/shop/moje-objednavky`
- [ ] Obě stránky linkují na `/reklamacni-rad` pro plný právní text
- [ ] Obě stránky mají kontakt-box s `info@carmakler.cz` (vraceni) resp. `reklamace@carmakler.cz` (reklamace)
- [ ] `loading.tsx` a `error.tsx` v obou složkách (copy from `reklamacni-rad/`)

**Inzerce footer:**
- [ ] `components/inzerce/Footer.tsx` neobsahuje `/cenik` ani `/tipy`
- [ ] Zbývají 3 linky ve sloupci

**Build + smoke:**
- [ ] `npm run build` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] Manuální check: `shop.carmakler.cz/vraceni-zbozi` → 200, `shop.carmakler.cz/reklamace` → 200
- [ ] Manuální check: `inzerce.carmakler.cz` footer — 3 linky, žádný 404 na ceniku/tipu

## 9. Risks

1. **Overlap s `/reklamacni-rad`** — risk že user bude zmaten, kam kliknout. Mitigation: stub page jasně říká „Plný právní text: Reklamační řád" + má primárně CTA na akci (moje-objednavky).
2. **Shop subdomain navigation** — breadcrumb „Domů" → `/` na shop subdoméně = shop home po rewrite. OK.
3. **Visual consistency** — stub pages použijí stejný `prose prose-gray max-w-none` pattern jako `reklamacni-rad` — žádná odchylka.
4. **SEO** — static content s JSON-LD + metadata + canonical → Google crawlable. Pokud se v budoucnu nezahrne do sitemap, nevadí (linkováno z footer).

## 10. Follow-ups (mimo scope)

- **#28b-seo** — přidat stub pages do `app/sitemap.ts` pokud chce marketolog
- **#28c** — smazat orphan `components/web/Footer.tsx` (cleanup po >= 1 týdnu produkce)
- **#28d** — rebuild `/cenik` + `/tipy` až bude content pro inzerci (zatím not planned)
- **#28e** — kompletní audit všech `<Link href>` napříč všemi 4 platformami + per-subdomain link validation pipeline (mimo scope teď)

## 11. Velikost a čas

- **Změny:** 7 souborů (6 new + 1 edit)
- **Řádků kódu:** ~250 total (~100 vraceni page + ~100 reklamace page + 46 boilerplate + 2 delete)
- **Rizikovost:** nízká (static Server Components, žádná DB/API/auth logika)
- **Testování:** build + lint + manual click-through
- **Souběžnost:** Může běžet paralelně s #45 nebo po něm — team-leadem označeno jako NORMAL priorita

---

## Poznámka pro team-leada

Plán je ready k dispatchi na implementátora. Všechna 4 rozhodnutí jsou v souladu s tvým assignmentem:
- Shop #1/#2 — Variant B (stub pages) ✅
- Inzerce #3/#4 — Variant A (remove) ✅

Žádné open otázky, dispatch ready. Pokud chceš, mohu přidat sekci s přesným markupem pro CTA box / ContactBox komponenty (používám existing `<div>` + Tailwind classes, žádné nové shared components).
