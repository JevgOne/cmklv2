# FINÁLNÍ GAP ANALÝZA — TASK-020 Eshop autodíly

**Datum:** 2026-04-14
**Autor:** Planovač
**Zdroj:** TASK-QUEUE.md řádky 1740–2467 vs. aktuální kód

---

## SOUHRN

| Kategorie | Hotovo | Částečně | Chybí |
|-----------|--------|----------|-------|
| Stránky (UI) | 9 | 2 | 3 |
| API routes | 27 | 0 | 13 |
| Prisma modely | 7 | 3 | 6 |
| Funkce | 12 | 5 | 11 |

**Celková kompletnost: ~60%** — core eshop flow funguje (katalog → detail → košík → checkout → sledování), ale chybí pokročilé funkce (SubOrder, poptávka, garáž, reviews, vizuální search).

---

## PRIORITIZACE GAPŮ

### P0 — KRITICKÉ (zákonná povinnost / broken flow)

#### G-01: Stripe Refund při reklamaci
- **Stav:** CHYBÍ
- **Popis:** Admin může změnit status reklamace na REFUNDED, ale systém NEVOLÁ `stripe.refunds.create()`. Peníze se zákazníkovi nevrátí.
- **Soubor:** `app/api/admin/returns/[id]/route.ts:68-69` — jen nastaví `refundedAt = new Date()`, žádný Stripe call
- **Reference:** Stripe refund funguje správně v `app/api/reservations/[id]/cancel/route.ts:66` — pattern existuje
- **Effort:** S (1-2h)
- **Risk:** Právní — zákon vyžaduje vrácení peněz do 14 dní

#### G-02: SubOrder model (split objednávky per dodavatel)
- **Stav:** CHYBÍ KOMPLETNĚ
- **Popis:** Spec vyžaduje, aby se objednávka s díly od více dodavatelů rozpadla na SubOrders s nezávislým fulfillmentem. Aktuálně Order = flat, 1 doručení, 1 tracking.
- **Chybí:** Prisma model SubOrder, API routes `/api/suborders/[id]/status` + `/api/suborders/[id]/tracking`, checkout flow per-supplier delivery selection, supplier dashboard per-SubOrder management
- **Effort:** XL (3-5 dní)
- **Risk:** Bez SubOrder zákazník nemůže objednat díly od 2 dodavatelů s různým doručením

#### G-03: Rezervace unikátních dílů při checkoutu (30 min)
- **Stav:** CHYBÍ
- **Popis:** Použité díly (quantity=1) se musí rezervovat při zahájení checkoutu na 30 min, aby 2 zákazníci neobjednali totéž. Existující `reservation-expiry` cron je pro VOZY (48h vehicle reservation), ne díly.
- **Chybí:** Part.status='RESERVED' logic v checkout flow, cron pro 30min expiraci, optimistic locking
- **Effort:** M (4-8h)
- **Risk:** Race condition — 2 objednávky na stejný unikátní díl

### P1 — DŮLEŽITÉ (klíčové features ze zadání)

#### G-04: Poptávka dílů (PartRequest + burza)
- **Stav:** CHYBÍ KOMPLETNĚ
- **Popis:** Zákazník nenajde díl → "Poptejte u vrakovišť" → systém rozešle všem dodavatelům → dodavatelé nabídnou → zákazník vybere
- **Chybí:** Prisma modely PartRequest + PartRequestOffer, API routes (3), UI formulář na "0 results" page, supplier portál pro nabídky, email broadcast
- **Effort:** L (2-3 dny)

#### G-05: CustomerGarage ("Moje garáž")
- **Stav:** CHYBÍ KOMPLETNĚ
- **Popis:** Zákazník uloží svůj vůz (VIN/značka/model/rok) → eshop automaticky filtruje kompatibilní díly
- **Chybí:** Prisma model CustomerGarage, API routes (`POST/GET /api/garage`), UI v zákaznickém účtu, auto-filtr v katalogu
- **Effort:** M (4-8h)

#### G-06: Hodnocení dílů/dodavatelů
- **Stav:** CHYBÍ
- **Popis:** Zákazník po nákupu hodnotí (1-5 hvězd + text). Aktuálně existují jen statické testimonials v `/recenze`.
- **Chybí:** Prisma model SupplierReview, API route `POST /api/suppliers/[id]/review`, post-purchase email trigger, zobrazení na detailu dílu + supplier profilu
- **Effort:** M (4-8h)

#### G-07: Notifikace "opět skladem" (customer-facing)
- **Stav:** CHYBÍ
- **Popis:** Zákazník klikne na vyprodaný díl → "Upozornit mě" → email při restock. Existující stock-alerts je pro DODAVATELE (low stock warning), ne zákazníky.
- **Chybí:** API route `POST /api/parts/[id]/notify-stock`, Prisma model/field pro email list, cron trigger při restock
- **Effort:** S (2-4h)

#### G-08: Srovnání alternativ (OEM cross-reference tabulka)
- **Stav:** CHYBÍ
- **Popis:** Nad výsledky hledání: Originál vs Aftermarket A vs B vs Použitý — tabulka s cenou, výrobcem, zárukou, hodnocením
- **Chybí:** API route `GET /api/parts/compare?oemNumber=XXX`, UI tabulka, PartCrossReference model (dedikovaná tabulka pro křížové reference)
- **Effort:** L (1-2 dny)

#### G-09: SEO — Part detail metadata + Product JSON-LD
- **Stav:** CHYBÍ
- **Popis:** `/dily/[slug]/page.tsx` nemá `generateMetadata()` ani Product JSON-LD schema. Funkce `generatePartProductJsonLd()` existuje v `lib/seo.ts` ale NENÍ použita.
- **Effort:** S (1-2h)

#### G-10: SEO — Sitemap s individuálními díly
- **Stav:** CHYBÍ
- **Popis:** `app/sitemap.ts` obsahuje kategorie a značky, ale NEZAHRNUJE URL jednotlivých dílů (`/dily/[slug]`)
- **Effort:** S (1h)

#### G-11: Part detail — "Více od tohoto dodavatele"
- **Stav:** CHYBÍ
- **Popis:** Na detailu dílu chybí sekce "Další díly od tohoto dodavatele" (spec: "další díly od tohoto dodavatele")
- **Effort:** XS (30min)

#### G-12: Part detail — Dodavatel hodnocení
- **Stav:** CHYBÍ
- **Popis:** Na detailu dílu chybí rating dodavatele a počet prodaných dílů (závisí na G-06)
- **Effort:** XS (30min, po G-06)

### P2 — NICE TO HAVE (pokročilé features)

#### G-13: Vizuální výběr dílu (klikací auto SVG)
- **Stav:** CHYBÍ KOMPLETNĚ
- **Popis:** Interaktivní SVG auta s klikatelnými zónami → přesměrování na kategorii. 3 pohledy (zepředu, zboku, zezadu).
- **Effort:** XL (3-5 dní) — custom SVG + interakce + responsive

#### G-14: Smart Search — NLP parsování
- **Stav:** CHYBÍ
- **Popis:** "brzdové destičky octavia 2017 přední" → automatický rozpad na kategorie+značka+model+rok. Aktuálně jen tsvector fulltext.
- **Chybí:** Tokenizace, slovník synonym, NLP parser
- **Effort:** L (2-3 dny)

#### G-15: Historie hledání + "Hledali jste naposledy"
- **Stav:** CHYBÍ
- **Popis:** Pro přihlášené: DB storage (10 posledních), pro guest: localStorage (5). Na homepage a v searchbar focus.
- **Effort:** M (4-8h)

#### G-16: Cross-sell na detailu vozu
- **Stav:** CHYBÍ
- **Popis:** Na `/nabidka/[slug]` (katalog aut) dole: "Díly pro tento vůz skladem" — matchne brand+model+year → díly z eshopu
- **Chybí:** API route `GET /api/parts/for-vehicle` EXISTS ale UI sekce na vehicle detail page CHYBÍ
- **Effort:** S (2-4h)

#### G-17: Foto vyhledávání (Visual Search — AI)
- **Stav:** CHYBÍ (spec říká "fáze 2")
- **Popis:** Upload fotky dílu → AI rozpoznání → nabídka kompatibilních dílů
- **Effort:** L (2-3 dny)

#### G-18: Autocomplete s rich previews
- **Stav:** ČÁSTEČNĚ
- **Popis:** SmartSearchBar existuje s textovými suggestions. Chybí: obrázky, ceny, sekce (Díly/Kategorie/Vozy/OEM), max 3 per sekce.
- **Effort:** M (4-8h)

#### G-19: Wishlist / oblíbené díly
- **Stav:** ČÁSTEČNĚ
- **Popis:** FavoriteButton existuje ale jen pro VOZY (Listing). Pro díly (Part) chybí.
- **Effort:** S (2-4h) — rozšíření existujícího systému

#### G-20: Partner portál — sekce reklamace
- **Stav:** CHYBÍ
- **Popis:** Dodavatel v PWA portálu nevidí reklamace svých dílů. Admin reklamace existuje, ale supplier view ne.
- **Chybí:** UI v `app/(pwa-parts)/` pro seznam + detail reklamací dodavatele
- **Effort:** M (4-8h)

### P3 — BUDOUCÍ (explicitně "fáze 2" ve spec)

#### G-21: Stripe Connect payout endpoint
- **Stav:** ČÁSTEČNĚ
- **Popis:** Stripe Connect onboarding existuje. Transfer probíhá v webhook (`applyCommissionSplit`). Chybí dedikovaný endpoint `POST /api/stripe/connect/payout` pro manuální výplatu.
- **Effort:** S (1-2h)

#### G-22: Shipping — velké díly restriction (>30kg)
- **Stav:** CHYBÍ
- **Popis:** weight/dimensions jsou na Part modelu, ale žádná logika neomezuje carrier options pro díly >30kg nebo >120cm
- **Effort:** S (2-4h)

#### G-23: POST /api/shipping/calculate endpoint
- **Stav:** CHYBÍ
- **Popis:** Kalkulace dopravného per SubOrder. Aktuálně flat prices v `lib/shipping/prices.ts`.
- **Effort:** S (2-4h, po G-02 SubOrder)

---

## CHYBĚJÍCÍ PRISMA MODELY

| Model | Status | Priorita |
|-------|--------|----------|
| SubOrder | CHYBÍ | P0 |
| PartRequest | CHYBÍ | P1 |
| PartRequestOffer | CHYBÍ | P1 |
| PartCrossReference | CHYBÍ | P1 |
| SupplierReview | CHYBÍ | P1 |
| CustomerGarage | CHYBÍ | P1 |

## CHYBĚJÍCÍ POLE NA EXISTUJÍCÍCH MODELECH

| Model | Pole | Status |
|-------|------|--------|
| Part | sourceVin | CHYBÍ |
| Part | conditionNote | CHYBÍ |
| Part | deliveryOptions | CHYBÍ (hardcoded in UI) |
| Order | stripePaymentIntentId | CHYBÍ (je na Reservation, ne na Order) |

## CHYBĚJÍCÍ API ROUTES (13)

| Route | Priorita |
|-------|----------|
| PUT /api/suborders/[id]/status | P0 |
| PUT /api/suborders/[id]/tracking | P0 |
| POST /api/part-requests | P1 |
| GET /api/part-requests | P1 |
| POST /api/part-requests/[id]/offer | P1 |
| GET /api/parts/compare?oemNumber=XXX | P1 |
| GET /api/parts/[id]/alternatives | P1 |
| POST /api/garage | P1 |
| GET /api/garage | P1 |
| POST /api/parts/[id]/notify-stock | P1 |
| POST /api/suppliers/[id]/review | P1 |
| POST /api/shipping/calculate | P2 |
| POST /api/parts/visual-search | P3 |

---

## DOPORUČENÝ POSTUP IMPLEMENTACE

### Vlna 1 — Security + Legal (1-2 dny)
1. **G-01** Stripe Refund v returns (S) — zákonná povinnost
2. **G-03** Rezervace dílů 30min (M) — race condition prevence
3. **G-09** SEO metadata + Product JSON-LD (S)
4. **G-10** Sitemap s díly (S)

### Vlna 2 — Core Business (3-5 dní)
5. **G-02** SubOrder model + checkout refactor (XL) — klíčový pro multi-supplier
6. **G-11** "Více od dodavatele" na detailu (XS)

### Vlna 3 — Engagement Features (3-5 dní)
7. **G-04** Poptávka dílů / burza (L)
8. **G-05** CustomerGarage (M)
9. **G-06** Reviews system (M)
10. **G-07** "Opět skladem" notifikace (S)

### Vlna 4 — Advanced Search + UX (3-5 dní)
11. **G-08** Srovnání alternativ (L)
12. **G-14** NLP smart search (L)
13. **G-15** Historie hledání (M)
14. **G-18** Rich autocomplete (M)

### Vlna 5 — Polish + Phase 2 (volitelné)
15. **G-13** Vizuální SVG selector (XL)
16. **G-16** Cross-sell na vozu (S)
17. **G-17** Visual Search AI (L)
18. **G-19** Wishlist díly (S)
19. **G-20** Partner portál reklamace (M)
20. **G-21** Stripe payout endpoint (S)
21. **G-22** Large part shipping restriction (S)
22. **G-23** Shipping calculate endpoint (S)

---

## CO JE HOTOVÉ (pro kontext)

- Homepage eshopu s kategoriemi a PartsSearch
- Katalog s filtrováním a řazením
- Detail dílu s galerií, kompatibilitou, AddToCart
- Košík (localStorage)
- 3-step checkout (delivery → payment → confirmation)
- Guest checkout + tracking token
- Order tracking page
- Objednávkový flow (create → confirm → ship → deliver)
- Admin reklamace (list + detail + status management)
- Customer return request flow
- Feed import (XML/CSV/JSON) s cron
- Admin feeds management
- Admin parts management + bulk actions + supplier filter
- Admin suppliers + onboarding approval
- PWA supplier dashboard + 3-step add wizard + CSV import
- 5 carrier integrations (dry-run mode)
- Zásilkovna widget + XML API
- OEM lookup s normalizací
- Smart search (tsvector + pg_trgm) + OEM detection
- Stock alerts cron (supplier-facing)
- SEO URL structure (kategorie/značka/model/rok)
- Breadcrumbs + FAQ schema na kategoriích
- Dynamic sitemap (kategorie + značky, BEZ jednotlivých dílů)
- Stripe Connect onboarding + webhook transfers
- CRON_SECRET security na všech 11 endpoints
- Offline support (IndexedDB + drafts)
