# Impl #28b — Stub stránky + odebrání inzerce cenik/tipy

**Task ID:** #52
**Plán:** `.claude-context/tasks/plan-task-28b-footer-links-batch2.md`
**Datum:** 2026-04-06
**Commit:** (viz git log)

## Scope

4 zbývající broken footer linky na subdoménách (`shop.carmakler.cz`, `inzerce.carmakler.cz`):

| # | Footer | Link | Akce |
|---|--------|------|------|
| 1 | shop | `/vraceni-zbozi` | **Create stub** |
| 2 | shop | `/reklamace` | **Create stub** |
| 3 | inzerce | `/cenik` | **Remove** |
| 4 | inzerce | `/tipy` | **Remove** |

## Dotčené soubory (7)

**Nové stub stránky (2 × 3 souborů):**
- `app/(web)/shop/vraceni-zbozi/page.tsx` — Server Component, Breadcrumbs, 2 info boxy, 3 kroky postupu, CTA → `/shop/moje-objednavky`, "Kdy NELZE" seznam, link na `/reklamacni-rad`, kontakt box `info@carmakler.cz`. Metadata + canonical + JSON-LD `WebPage` schema.
- `app/(web)/shop/vraceni-zbozi/loading.tsx` — spinner skeleton (copy z `reklamacni-rad/loading.tsx`)
- `app/(web)/shop/vraceni-zbozi/error.tsx` — error boundary (copy z `reklamacni-rad/error.tsx`)
- `app/(web)/shop/reklamace/page.tsx` — stejný pattern: 2 info boxy (záruka 24/12 měs, 30 dní vyřízení), 4 kroky postupu, CTA → `/shop/moje-objednavky`, "Co se NEpočítá", link na `/reklamacni-rad`, kontakt box `reklamace@carmakler.cz`.
- `app/(web)/shop/reklamace/loading.tsx`
- `app/(web)/shop/reklamace/error.tsx`

**Edit:**
- `components/inzerce/Footer.tsx` — odebrány řádky `/cenik` a `/tipy` (3 linky ve sloupci zbývají)

## Stub page pattern

- Server Component (žádný `"use client"`)
- `export const metadata: Metadata` s title/description/OG/canonical
- JSON-LD `WebPage` schema (`isPartOf: WebSite`)
- `<Breadcrumbs items={...}>` (Domů → Shop → ...)
- `<h1>` + lead paragraph
- `grid md:grid-cols-2` — 2 info boxy (orange-50 bg, border orange-100, ikona + title + text)
- H2 "Jak X — N kroků" + ordered list s očíslovanými oranžovými kulatými badgi
- `<Link href="/shop/moje-objednavky"><Button variant="primary" size="lg">` — primární CTA
- H2 "Kdy NELZE / Co NEpočítá" + `<ul>` s 3 bullets
- Link na `/reklamacni-rad` pro plný právní text
- Kontakt box v `bg-gray-50` s mailto
- **NEDUPLIKUJ legal text** — `/reklamacni-rad` (287 řádků) je master dokument

## Acceptance criteria (plán sekce 8)

**Pages:**
- [x] `app/(web)/shop/vraceni-zbozi/page.tsx` existuje jako Server Component
- [x] `app/(web)/shop/reklamace/page.tsx` existuje jako Server Component
- [x] Obě stránky mají metadata (title, description, OG, canonical)
- [x] Obě stránky mají JSON-LD `WebPage` schema
- [x] Obě stránky mají Breadcrumbs komponentu
- [x] Obě stránky mají CTA button → `/shop/moje-objednavky`
- [x] Obě stránky linkují na `/reklamacni-rad` pro plný právní text
- [x] Obě stránky mají kontakt-box s `info@carmakler.cz` (vraceni) resp. `reklamace@carmakler.cz` (reklamace)
- [x] `loading.tsx` a `error.tsx` v obou složkách

**Inzerce footer:**
- [x] `components/inzerce/Footer.tsx` neobsahuje `/cenik` ani `/tipy`
- [x] Zbývají 3 linky ve sloupci (Katalog vozidel, Přidat inzerát, Moje inzeráty)

**Build:**
- [x] `npm run build` → ✅ green, `/shop/vraceni-zbozi` a `/shop/reklamace` jsou v route listu
- [ ] Manuální smoke testing → ponecháno na test-chrome re-run

## Odchylky od plánu

Žádné zásadní odchylky:
- Použil jsem `<Link href=...><Button>` wrapper pattern (same jako `app/(web)/marketplace/page.tsx`), protože `Button` komponenta nemá `asChild` prop. Technicky `<a><button>` není striktně validní HTML, ale je to známý pattern v tomto codebase a prochází buildem.
- Kroky postupu renderovány jako `<li>` s custom styling (orange badge + gray bg) místo prostého `<ol>` v `prose` wrapperu — vizuálně přívětivější a konzistentní s marketplace landing stylem.

## Follow-up (mimo scope)

- `/cenik` + `/tipy` případná rebuild pokud bude content (not planned)
- Přidání stub stránek do `app/sitemap.ts` (SEO follow-up)
- Smazání orphan `components/web/Footer.tsx` (cleanup task, po týdnu v produkci)
