# Implementace P0-01: Obchodni podminky

**Status:** HOTOVO
**Datum:** 2026-04-04
**Implementator:** Claude Agent

---

## Co bylo udelano

Vytvorena stranka `/obchodni-podminky` s kompletnimi obchodnimi podminkami dle ceske legislative. Obsahuje 11 sekci pokryvajicich e-shop, inzertni sluzby, maklerske sluzby a marketplace.

### Vytvorene soubory

| Soubor | Popis |
|--------|-------|
| `app/(web)/obchodni-podminky/page.tsx` | Hlavni stranka s 11 sekcemi, SEO metadata, JSON-LD, Breadcrumbs |
| `app/(web)/obchodni-podminky/loading.tsx` | Skeleton loading state |
| `app/(web)/obchodni-podminky/error.tsx` | Error fallback ("use client") |

### Upravene soubory

| Soubor | Zmena |
|--------|-------|
| `app/sitemap.ts` | Pridano `/obchodni-podminky` do staticPages (priority 0.4, monthly) |

### Obsah stranky

11 sekci: Uvodni ustanoveni, Objednavkovy proces, Ceny a platby, Dodani zbozi, Odstoupeni od smlouvy, Reklamace a zaruka, Inzertni sluzby, Maklerske sluzby, Marketplace, Ochrana udaju, Zaverecna ustanoveni.

Interni odkazy: `/reklamacni-rad`, `/ochrana-osobnich-udaju`
Externi odkazy: COI (www.coi.cz), ODR platforma (ec.europa.eu)

## Poznamky

- Texty obsahuji `[DOPLNIT]` placeholder pro firemni udaje (ICO, adresa, tel.)
- MUSI byt revidovano pravnikem pred launchem
- Po P1-07 (centralizace kontaktu) nahradit placeholders za `companyInfo.*`

## Overeni

- [x] page.tsx, loading.tsx, error.tsx vytvoreny
- [x] SEO metadata (title, description, openGraph, canonical)
- [x] JSON-LD WebPage schema
- [x] Breadcrumbs komponenta
- [x] 11 sekci s h2 nadpisy
- [x] Interni odkazy na /reklamacni-rad a /ochrana-osobnich-udaju
- [x] Externi odkazy s target=_blank a rel=noopener
- [x] Pridano do sitemap.ts
