# Audit: Všechny placeholdery, stuby, mock data a TODO v projektu

**Datum:** 2026-04-28
**Autor:** planovac
**Účel:** Kompletní seznam VŠECH míst kde nejsou reálná data z DB, mock/fake data, stuby, hardcoded čísla.

---

## KATEGORIE A: STUBY — uživatel vidí "Připravujeme" nebo prázdnou stránku

### A1. Partner Documents
- **Soubor:** `app/(partner)/partner/documents/page.tsx:66`
- **Problém:** Tlačítko zobrazuje "Připravujeme" — partneři nemohou nahrávat/stahovat dokumenty
- **Dopad:** STŘEDNÍ — partneři (autobazary) nemají přístup ke smlouvám a dokumentům
- **Fix:** Implementovat upload přes `lib/upload.ts` + seznam dokumentů s download

---

## KATEGORIE B: HARDCODED DATA — team, recenze, testimonials

### B0. Tým na O nás stránce — hardcoded
- **Soubor:** `app/(web)/o-nas/page.tsx:44-63`
- **Problém:** 3 členové týmu (Radim Zajíček, Yevgen Ulyanchenko, Kateřina Fusslová) jsou `const team = [...]`. Přidání/odebrání člena vyžaduje deploy.
- **Dopad:** STŘEDNÍ — nelze spravovat z admin panelu
- **Fix:** TeamMember model v Prisma + admin CRUD + DB query na O nás. Plán: `plan-admin-team-management-20260428.md`
- **Poznámka:** Yevgen title je správně "Zakladatel, CEO & CTO" (řádek 54).

### B0b. Homepage — žádný hardcoded team
- **Soubor:** `app/(web)/page.tsx`
- **Problém:** Homepage NEOBSAHUJE team sekci, ale má hardcoded testimonials (viz B2)
- **Stav:** Homepage stats (featured cars, featured brokers) jsou z DB (Prisma queries) — OK

---

## KATEGORIE B (pokrač.): HARDCODED RECENZE / TESTIMONIALS — fake uživatelské recenze

### B1. Recenze stránka — 100% hardcoded
- **Soubor:** `app/(web)/recenze/page.tsx:22-81`
- **Problém:** Celá stránka recenzí je `"use client"` komponenta s **hardcoded polem 8+ fake recenzí**. Žádný `prisma` import, žádná DB query. Všechny recenze jsou fiktivní (Jana K., Martin D., Tomáš H., Eva S. atd.)
- **Dopad:** VYSOKÝ — uživatelé vidí fake recenze, potenciálně právní problém (klamavá reklama)
- **Fix:** Vytvořit Review model v Prisma, formulář pro sběr recenzí, server component s DB query. Alternativa: napojit na Google Reviews API.

### B2. Homepage testimonials — hardcoded
- **Soubor:** `app/(web)/page.tsx:195-214`
- **Problém:** 3 hardcoded testimonials (Jana K., Martin D., Tomáš H.) — stejné texty jako na /recenze
- **Dopad:** STŘEDNÍ — hlavní stránka zobrazuje fake citáty
- **Fix:** Načítat top 3 recenze z DB (po vyřešení B1)

### B3. "Prodáno průměrně za 20 dní" — hardcoded
- **Soubor:** `app/(web)/page.tsx:176`
- **Problém:** Text `"Prodáno průměrně za 20 dní"` je hardcoded string, ne vypočítaná hodnota z DB
- **Dopad:** NÍZKÝ — marketing claim, ale mohl by být dynamický
- **Fix:** Spočítat z `prisma.vehicle.findMany({ where: { status: "SOLD" } })` průměr (soldAt - createdAt)

### B4. Kariéra — hardcoded pracovní pozice
- **Soubor:** `app/(web)/kariera/page.tsx:32-48`
- **Problém:** 3 pracovní pozice (Automakléř Praha/Brno, Regionální manažer) jsou `const positions = [...]`. Přidání/odebrání pozice vyžaduje deploy.
- **Dopad:** NÍZKÝ-STŘEDNÍ — pokud je kariéra stránka aktivní, pozice by měly být spravovatelné
- **Fix:** Buď admin CRUD pro pozice, nebo přesunout do CMS/env config. NÍZKÁ priorita pokud se pozice nemění často.

---

## KATEGORIE C: MOCK SLUŽBY — vrací fake data když chybí API klíč

### C1. TecDoc — CELÝ soubor je mock
- **Soubor:** `lib/tecdoc.ts`
- **Problém:** Celý soubor (200+ řádků) je mock implementace s hardcoded vozidly (TMBAG=Škoda, WVWZZ=VW, WBAPH=BMW...) a 50 generic dílů s fake cenami. Komentář na řádku 1-2: `"TecDoc service — mock implementace / Po získání TecDoc API klíčů (task #21) vyměnit mock za reálné API volání"`
- **Dopad:** VYSOKÝ — donor car VIN dekódování a suggested prices jsou kompletně fake. Každé auto dostane stejné generic díly.
- **Fix:** Získat TecDoc API klíče a implementovat reálné volání. Nebo jiný parts catalog API.
- **Poznámka:** Toto je BUSINESS blokátor — vyžaduje smlouvu s TecDoc.

### C2. CEBIA — mock fallback
- **Soubor:** `lib/cebia.ts:24-89`
- **Problém:** Pokud `CEBIA_API_KEY` není nastaveno nebo je `"dev-mock"` → vrací `mockCebiaReport()` s fake daty (všechno OK, žádné problémy). Pokud API selže → taky fallback na mock.
- **Dopad:** VYSOKÝ — vozidla s podvodnými VIN projdou jako "čisté" v dev/fallback režimu
- **Fix:** Zajistit CEBIA_API_KEY na produkci. Odstranit silent fallback na mock — místo toho zobrazit "Prověrku nelze provést".
- **Poznámka:** Na produkci MŮŽE fungovat správně, POKUD je CEBIA_API_KEY nastaveno. Ověřit env na serveru.

### C3. Shipping carriers — dry-run mode
- **Soubor:** `lib/shipping/base.ts:14-78`, `lib/shipping/carriers/{ppl,dpd,gls,ceska-posta}.ts`
- **Problém:** Pokud carrier API klíče nejsou nastaveny → `dryRunResult()` vrací fake tracking čísla (`DRY-PPL-...`), fake label URL na placehold.co, fake status
- **Dopad:** VYSOKÝ pro eshop — objednávky dostanou fake tracking čísla
- **Fix:** Nastavit API klíče na produkci. Detekovat dry-run v UI a zobrazit upozornění.
- **Poznámka:** Na produkci MŮŽE fungovat správně. Ověřit env.

### C4. Zásilkovna points — mock fallback
- **Soubor:** `app/api/shipping/zasilkovna-points/route.ts:17-33`
- **Problém:** Bez `NEXT_PUBLIC_ZASILKOVNA_API_KEY` → vrací 1 hardcoded výdejní místo (Brno, Joštova 4)
- **Dopad:** STŘEDNÍ — zákazníci vidí jen 1 fake výdejnu
- **Fix:** Nastavit Zásilkovna API key. Client-side widget `Packeta.Widget.pick()` je primární UI — ověřit že funguje.

### C5. Upload — placehold.co fallback
- **Soubor:** `lib/upload.ts:44-47`, `lib/cloudinary.ts:48`
- **Problém:** Bez `UPLOAD_DIR`/`UPLOAD_BASE_URL` → vrací `placehold.co` URL místo skutečného uploadu
- **Dopad:** Na produkci NÍZKÝ (env je nastaveno), v dev EXPECTED
- **Fix:** Ověřit že produkce má env nastaveno. Dev fallback je OK.

---

## KATEGORIE D: TODO KOMENTÁŘE v kódu

### D1. ShopTrustBar — text badges místo SVG ikon
- **Soubor:** `components/shop/ShopTrustBar.tsx:6-8`
- **Problém:** `TODO(designer)`: platební metody (Visa, MC, Apple Pay) a dopravci (Zásilkovna, DPD) zobrazeny jako text badges, ne jako brand SVG ikony
- **Dopad:** NÍZKÝ — vizuální, ne funkční
- **Fix:** Získat brand assets a nahradit text badge za SVG ikony

### D2. Cloudinary migrace script — neúplný
- **Soubor:** `scripts/migrate-cloudinary.ts:58-66`
- **Problém:** `TODO: Part.images (JSON parse), User.avatar, User.documents, Contract.pdfUrl` + `TODO: Implementovat:` — migrační script z Cloudinary na self-hosted není kompletní
- **Dopad:** NÍZKÝ — migrace je jednorázová operace, ne uživatelsky viditelná
- **Fix:** Dokončit pokud je migrace plánovaná

### D3. Pricing aggregate — JSONB query
- **Soubor:** `lib/seo/pricingAggregate.ts:16`
- **Problém:** `TODO #87d` — vyžaduje migraci na PostgreSQL JSONB array path query
- **Dopad:** NÍZKÝ — SEO pricing metadata

---

## KATEGORIE E: MISLEADING KOMENTÁŘE (NE skutečné placeholdery)

### E1. Makléř stats grafy — komentář říká "placeholder" ale data JSOU reálná
- **Soubor:** `app/(pwa)/makler/stats/page.tsx:138,337,358`
- **Problém:** Komentáře říkají `"placeholder data pro grafy"` a `"bar chart placeholder"`, ale kód na řádcích 146-153 používá REÁLNÉ `prisma.commission.aggregate()` queries. Data jsou z DB, ne fake.
- **Dopad:** ŽÁDNÝ — komentáře jsou zavádějící, data jsou reálná
- **Fix:** Smazat/upravit zavádějící komentáře

### E2. Makléř training video — placeholder pro embed
- **Soubor:** `app/(pwa)/makler/onboarding/training/page.tsx:46`
- **Problém:** `"Placeholder for video — replace src with actual YouTube/Vimeo embed"` — chybí skutečné training video
- **Dopad:** NÍZKÝ — business content, ne technický problém
- **Fix:** Business tým musí natočit a nahrát video

---

## KATEGORIE F: DEV SEED DATA (správné — NE problém)

### F1. prisma/seed.ts — seed data pro development
- **Soubor:** `prisma/seed.ts`
- **Problém:** Obsahuje seed data včetně placehold.co URL pro obrázky
- **Dopad:** ŽÁDNÝ — seed je jen pro dev, ne pro produkci
- **Fix:** Žádný — toto je expected behavior

---

## SOUHRNNÁ TABULKA

| # | Soubor | Typ | Závažnost | Uživatelsky viditelné? |
|---|--------|-----|-----------|----------------------|
| A1 | partner/documents/page.tsx | STUB | STŘEDNÍ | ANO — "Připravujeme" |
| B0 | o-nas/page.tsx | HARDCODED TEAM | STŘEDNÍ | ANO — 3 členové týmu |
| B1 | recenze/page.tsx | FAKE DATA | VYSOKÝ | ANO — 8+ fake recenzí |
| B2 | page.tsx (homepage) | FAKE DATA | STŘEDNÍ | ANO — 3 fake testimonials |
| B3 | page.tsx (homepage) | HARDCODED | NÍZKÝ | ANO — "20 dní" claim |
| B4 | kariera/page.tsx | HARDCODED | NÍZKÝ-STŘEDNÍ | ANO — 3 pozice |
| C1 | lib/tecdoc.ts | MOCK SERVICE | VYSOKÝ | ANO — fake díly/ceny |
| C2 | lib/cebia.ts | MOCK FALLBACK | VYSOKÝ* | Závisí na env |
| C3 | lib/shipping/base.ts | DRY-RUN | VYSOKÝ* | Závisí na env |
| C4 | zasilkovna-points/route.ts | MOCK FALLBACK | STŘEDNÍ* | Závisí na env |
| C5 | lib/upload.ts | DEV FALLBACK | NÍZKÝ* | Závisí na env |
| D1 | ShopTrustBar.tsx | TODO | NÍZKÝ | ANO — text místo ikon |
| D2 | migrate-cloudinary.ts | TODO | NÍZKÝ | NE |
| D3 | pricingAggregate.ts | TODO | NÍZKÝ | NE |
| E1 | makler/stats/page.tsx | MISLEADING | ŽÁDNÝ | NE — data jsou reálná |
| E2 | onboarding/training | PLACEHOLDER | NÍZKÝ | ANO — chybí video |

\* = Na produkci závisí na tom, zda jsou nastaveny správné env proměnné (API klíče).

---

## DOPORUČENÉ AKCE (seřazeno podle priority)

### 1. OKAMŽITĚ — ověřit produkční env proměnné
Zkontrolovat na serveru zda existují:
- `CEBIA_API_KEY` (ne "dev-mock")
- `UPLOAD_DIR` + `UPLOAD_BASE_URL`
- `NEXT_PUBLIC_ZASILKOVNA_API_KEY`
- Carrier API klíče (PPL, DPD, GLS, Česká pošta)

Pokud chybí → eshop objednávky dostávají fake tracking, CEBIA check je fake, upload neukládá soubory.

### 2. VYSOKÁ PRIORITA — recenze (B1, B2)
Nahradit fake recenze reálným systémem (DB model + formulář + server component). Případně Google Reviews integrace.

### 3. STŘEDNÍ PRIORITA — partner documents (A1)
Implementovat upload + seznam dokumentů. Malý effort, odstraní jediný STUB.

### 4. NÍZKÁ PRIORITA — TecDoc integrace (C1)
Business rozhodnutí — vyžaduje smlouvu s TecDoc. Mock je funkční pro demo, ale fake ceny jsou problém.

### 5. NÍZKÁ PRIORITA — kosmetické (D1, E1, B3)
ShopTrustBar SVG ikony, smazání zavádějících komentářů, dynamický "průměrná doba prodeje".
