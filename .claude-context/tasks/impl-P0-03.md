# Implementace P0-03: Reklamacni rad

**Status:** HOTOVO
**Datum:** 2026-04-04
**Implementator:** Claude Agent

---

## Co bylo udelano

Vytvorena stranka `/reklamacni-rad` se zakonnym reklamacnim radem pro e-shop s autodily. Obsahuje 10 sekci vcetne vizualnich karet pro zarucni doby.

### Vytvorene soubory

| Soubor | Popis |
|--------|-------|
| `app/(web)/reklamacni-rad/page.tsx` | Hlavni stranka s 10 sekcemi, vizualni karty, SEO metadata, JSON-LD |
| `app/(web)/reklamacni-rad/loading.tsx` | Skeleton loading state |
| `app/(web)/reklamacni-rad/error.tsx` | Error fallback |

### Upravene soubory

| Soubor | Zmena |
|--------|-------|
| `app/sitemap.ts` | Pridano `/reklamacni-rad` do staticPages |

### Obsah stranky

10 sekci: Obecna ustanoveni, Zarucni doby, Odstoupeni od smlouvy (14 dni), Uplatneni reklamace, Lhuty pro vyrizeni, Zpusoby vyrizeni, Naklady, Mimosoudni reseni, Kontaktni udaje, Formular.

Vizualni karty:
- Zelena karta: 24 mesicu (nove dily) — bg-green-50
- Oranzova karta: 12 mesicu (pouzite dily) — bg-orange-50
- Modra karta: 30 dnu (zakonny limit vyrizeni) — bg-blue-50

Kontakty: reklamace@carmakler.cz, COI ADR (Stepanska 567/15), ODR platforma

## Overeni

- [x] 10 sekci renderovano
- [x] Vizualni karty zarucnich dob (24m/12m)
- [x] Karta 30 dnu zakonny limit
- [x] Postup odstoupeni od smlouvy krok po kroku
- [x] Kontakt na COI ADR spravny
- [x] Odkaz na /obchodni-podminky
- [x] Pridano do sitemap.ts
