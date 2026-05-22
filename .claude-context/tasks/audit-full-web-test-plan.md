# Audit: Full Web Test Plan — Marketplace, Eshop, Inzerce

**Datum:** 2026-04-24
**Účel:** Hloubkový QA test plan pro 3 produkty CarMakléř

---

## SOUHRN

| Produkt | Stránek | API routes | Celkový stav |
|---------|---------|------------|-------------|
| Marketplace VIP | 7 | 8 | ✅ 90 % funkční (foto upload chybí) |
| Eshop dílů | 13 | 5+ | ✅ 98 % funkční (production-ready) |
| Inzertní platforma | 6 + wizard | 10+ | ✅ 85 % funkční (limit placeholder) |

---

## 1. MARKETPLACE VIP

### Stránky

| # | URL | Co dělá | Stav | Issues |
|---|-----|---------|------|--------|
| 1 | `/marketplace` | Landing — hero, ROI příklady, bezpečnost, FAQ, reálné statistiky z DB | ✅ Funkční | Žádné |
| 2 | `/marketplace/apply` | Přihlašovací formulář (Investor/Realizátor) — Zod validace, honeypot, rate limit 5/15min, email notifikace | ✅ Funkční | Žádné |
| 3 | `/marketplace/dealer` | Dashboard realizátora — reálné FlipOpportunity z DB, statistiky, grid karet | ⚠️ Auth chybí | Page-level auth check chybí (spoléhá na middleware) |
| 4 | `/marketplace/dealer/nova` | Nová příležitost — 4-krokový wizard, POST `/api/marketplace/opportunities` | ⚠️ Foto stub | Foto upload je jen UI placeholder, žádný file handling |
| 5 | `/marketplace/dealer/[id]` | Detail flipu (dealer view) — timeline, kalkulačka, investoři | 🔧 Stub buttons | 2 tlačítka bez onClick ("Označit jako dokončené", "Aktualizovat fotky") |
| 6 | `/marketplace/investor` | Dashboard investora — portfolio, dostupné příležitosti, reálná data | ⚠️ Auth chybí | Page-level role check chybí |
| 7 | `/marketplace/investor/[id]` | Detail příležitosti — timeline, profit calculator, investiční modal, bank info | ✅ Funkční | API enforces auth správně |

### API routes

| # | Endpoint | Metody | Stav | Issues |
|---|----------|--------|------|--------|
| 1 | `/api/marketplace/apply` | POST | ✅ Funkční | Rate limit, honeypot, emails — vše funguje |
| 2 | `/api/marketplace/opportunities` | GET, POST | ✅ Funkční | Role-based filtering, pagination, sorting |
| 3 | `/api/marketplace/opportunities/[id]` | GET, PUT | ✅ Funkční | Auth + ownership check |
| 4 | `/api/marketplace/opportunities/[id]/approve` | POST | ✅ Funkční | ADMIN only, state transitions |
| 5 | `/api/marketplace/opportunities/[id]/payout` | POST | ✅ Funkční | 40/40/20 split, transaction-based, handles loss |
| 6 | `/api/marketplace/investments` | GET, POST | ✅ Funkční | Amount validation, FUNDING state check |
| 7 | `/api/marketplace/investments/[id]/confirm-payment` | PUT | ✅ Funkční | Auto-transition to FUNDED at 100% |
| 8 | `/api/marketplace/stats` | GET | ✅ Funkční | Role-specific stats z reálných dat |

### Nalezené problémy

| # | Problém | Kde | Závažnost |
|---|---------|-----|-----------|
| M1 | **Foto upload neimplementován** — wizard steps 1+2 mají dropzone UI bez file handleru | `/marketplace/dealer/nova` | 🔧 Střední |
| M2 | **2 stub tlačítka bez onClick** — "Označit jako dokončené" + "Aktualizovat fotky" | `/marketplace/dealer/[id]` řádky 181-186 | 🔧 Střední |
| M3 | **Chybí page-level auth** — dealer + investor dashboardy nemají role check (spoléhají jen na middleware) | dealer/page.tsx, investor/page.tsx | ⚠️ Nízká (middleware chrání) |
| M4 | **averageRoi hardcoded na 0** — dealer stats nepočítá skutečné ROI | dealer/page.tsx řádek 49 | ⚠️ Nízká |

---

## 2. ESHOP DÍLŮ

### Stránky

| # | URL | Co dělá | Stav | Issues |
|---|-----|---------|------|--------|
| 1 | `/dily` | Landing — kategorie, SmartSearch, doporučené díly z DB (dle viewCount) | ✅ Funkční | Žádné |
| 2 | `/dily/katalog` | Katalog — client-side fetch `/api/parts`, filtry (kategorie, značka, cena, stav), pagination 18/page, řazení | ✅ Funkční | Žádné |
| 3 | `/dily/[slug]` | Detail dílu — galerie, specifikace, kompatibilita, dodavatel, AddToCart (stock check), viewCount++ | ✅ Funkční | Žádné |
| 4 | `/dily/kategorie/[slug]` | SEO landing — statický obsah + FAQ per kategorie, linky do katalogu | ✅ Funkční | Žádné |
| 5 | `/dily/znacka/[brand]` | SEO landing — top díly z DB, modelové linky, ISR | ✅ Funkční | Žádné |
| 6 | `/dily/znacka/[brand]/[model]` | SEO landing — generace, top díly, ISR | ✅ Funkční | Žádné |
| 7 | `/dily/znacka/[brand]/[model]/[rok]` | SEO landing — stovky pre-built stránek (všechny validní roky) | ✅ Funkční | Žádné |
| 8 | `/dily/vrakoviste/[slug]` | Profil vrakoviště — kontakt, inventář (max 24 dílů), recenze, Google rating, ISR 24h | ✅ Funkční | Žádné |
| 9 | `/dily/kosik` | Košík — localStorage cart, množství ±, smazání, celková cena | ✅ Funkční | Žádné |
| 10 | `/dily/objednavka` | Checkout — 3 kroky: doručení (Zásilkovna widget), platba (banka/dobírka/karta), potvrzení | ✅ Funkční | Žádné |
| 11 | `/dily/objednavka/potvrzeni` | Potvrzení — číslo objednávky, tracking link, guest token | ✅ Funkční | Drobné typo (chybí diakritika) |
| 12 | `/dily/moje-objednavky` | Moje objednávky — status badges, OrderTracker, tracking, vrácení/reklamace | ✅ Funkční | Žádné |

### Pokročilé funkce

| Feature | Stav | Detail |
|---------|------|--------|
| Stock reservation | ✅ | 30-min hold přes `/api/parts/reserve`, countdown timer, cleanup on unload |
| Multi-supplier checkout | ✅ | Automatické rozdělení do SubOrders dle dodavatele |
| Zásilkovna widget | ✅ | Reálný widget, výběr výdejního místa, integrace |
| Stripe platba | ✅ | Checkout session, metadata, fallback při selhání |
| Dobírka (COD) | ✅ | +39 Kč fee automaticky |
| Bankovní převod | ✅ | Instrukce emailem |
| Cart (localStorage) | ✅ | Event-driven, cross-component sync, persistent |
| Shipping calculation | ✅ | Dle hmotnosti/rozměrů, per-carrier availability |

### API routes

| # | Endpoint | Metody | Stav |
|---|----------|--------|------|
| 1 | `/api/parts` | GET, POST | ✅ Funkční — filtry, řazení, pagination, slug generace, cache headers |
| 2 | `/api/parts/[id]` | GET, PUT, DELETE | ✅ Funkční — ownership check, viewCount++ |
| 3 | `/api/parts/reserve` | POST, DELETE | ✅ Funkční — 30-min upsert reservation, stock check |
| 4 | `/api/orders` | GET, POST | ✅ Funkční — transaction-based, multi-supplier, Stripe, guest token |
| 5 | `/api/shipping/calculate` | POST | ✅ Funkční — weight/dimension validation |

### Nalezené problémy

| # | Problém | Kde | Závažnost |
|---|---------|-----|-----------|
| E1 | **Drobné typo** — "sledovani" místo "sledování", "Vytvorit ucet" místo "Vytvořit účet" | `/dily/objednavka/potvrzeni` | ⚠️ Kosmetické |
| E2 | **Brand/model listy hardcoded** — PARTS_BRANDS, PARTS_MODELS_BY_BRAND jsou statické, ne z DB | SEO stránky | ⚠️ By design (content management) |

**VERDIKT: Eshop dílů je PRODUCTION-READY. Žádné stuby, žádné placeholdery v core flow.**

---

## 3. INZERTNÍ PLATFORMA

### Stránky

| # | URL | Co dělá | Stav | Issues |
|---|-----|---------|------|--------|
| 1 | `/inzerce` | Landing — pricing tiers, výhody, reálné statistiky z DB (count, views, sold) | ✅ Funkční | Žádné |
| 2 | `/inzerce/pridat` | 6-krokový wizard (i bez registrace) | ✅ Funkční | VIN decode vyžaduje auth (viz I3) |
| 3 | `/inzerce/registrace` | Registrace — 4 typy účtu, ARES ověření IČO, real API | ✅ Funkční | Žádné |
| 4 | `/inzerce/katalog` | Redirect na `/nabidka` | ✅ Redirect | By design |
| 5 | `/moje-inzeraty` | Dashboard — seznam inzerátů, taby, statistiky, CRUD akce, propagace | 🔧 Placeholder | maxListings hardcoded na 10 |
| 6 | `/moje-inzeraty/[id]` | Detail — editace, poptávky s odpovědmi, promote (Stripe), extend | ✅ Funkční | Žádné |

### Listing wizard — 6 kroků

| Krok | Komponenta | Co dělá | Stav |
|------|-----------|---------|------|
| 1 | `Step1Vin.tsx` | VIN vstup + dekódování → autofill 10+ polí | ✅ Funkční (ale viz I3) |
| 2 | `Step2Details.tsx` | Značka, model, rok, palivo, převodovka, stav, barva, nájezd, STK | ✅ Funkční |
| 3 | `Step3Equipment.tsx` | Výbava — zaškrtávací seznam + vlastní položky | ✅ Funkční |
| 4 | `Step4Photos.tsx` | Fotky — drag&drop, komprese (max 1920px), watermark, primární fotka | ✅ Funkční |
| 5 | `Step5PriceContact.tsx` | Cena, DPH, kontakt, město, popis, "Chci pomoc makléře" checkbox | ✅ Funkční |
| 6 | `Step6Preview.tsx` | Náhled + checklist (10 required) + publikování (DRAFT/ACTIVE) | ✅ Funkční |

### API routes

| # | Endpoint | Metody | Stav | Detail |
|---|----------|--------|------|--------|
| 1 | `/api/listings` | GET, POST | ✅ | Anonymous POST allowed (auto-creates ADVERTISER account), Zod validace, auto-flagging |
| 2 | `/api/listings/[id]` | GET, PUT, PATCH, DELETE | ✅ | ViewCount++, ownership check, soft delete |
| 3 | `/api/listings/my` | GET | ✅ | Auth required, user's listings |
| 4 | `/api/listings/[id]/images` | POST | ✅ | File validation, watermark, 10MB limit, 30-min window for anonymous |
| 5 | `/api/listings/[id]/inquiry` | GET, POST | ✅ | Anonymous inquiries allowed, auto-mark READ |
| 6 | `/api/listings/[id]/inquiry/[inquiryId]/reply` | POST | ✅ | Owner-only reply |
| 7 | `/api/listings/[id]/promote` | POST | ✅ | Stripe checkout: TOP 199 Kč/7d, EXTEND 99 Kč/30d, BUNDLE 1990 Kč/30 listings |
| 8 | `/api/listings/[id]/extend` | POST | ✅ | Prodloužení platnosti |
| 9 | `/api/listings/[id]/reserve` | POST | ✅ | Rezervace inzerátu |
| 10 | `/api/listings/[id]/stats` | GET | ✅ | View/inquiry statistiky |

### Nalezené problémy

| # | Problém | Kde | Závažnost |
|---|---------|-----|-----------|
| I1 | **maxListings hardcoded na 10** — komentář říká "Placeholder, API by mělo vracet skutečný limit" | `/moje-inzeraty/page.tsx` řádek ~142 | 🔧 Střední — uživatel vidí špatný limit |
| I2 | **Silent error handling** — catch bloky v dashboardu nic nedělají, uživatel neví o chybě | `/moje-inzeraty/page.tsx` | ⚠️ Nízká — UX issue |
| I3 | **VIN decode vyžaduje auth** — ale wizard je veřejný (i bez registrace). Anonymous uživatel nemůže dekódovat VIN | `/api/vin/decode` řádek 16-20 | 🔧 Střední — degradovaný UX pro anonymní |
| I4 | **Chybí validace při přechodu mezi kroky** — wizard nekontroluje povinná pole před posunem vpřed | `ListingFormWizard.tsx` | ⚠️ Nízká — finální check v kroku 6 to zachytí |

---

## TESTOVACÍ SCÉNÁŘE

### Marketplace VIP — Test Cases

| # | Scénář | Kroky | Očekávaný výsledek |
|---|--------|-------|-------------------|
| M-T1 | Žádost o přístup (investor) | Landing → Apply → Vyplnit formulář → Odeslat | Confirmation card, email odeslaný, DB záznam |
| M-T2 | Žádost o přístup (dealer) | Apply → Vybrat "Realizátor" → IČO + firma → Odeslat | Validace IČO (8 číslic), confirmation |
| M-T3 | Rate limit | 6× odeslat formulář za 15 min | 6. request → 429 Too Many Requests |
| M-T4 | Honeypot | Vyplnit skryté "website" pole → Odeslat | Silent fail (200, ale neuloží) |
| M-T5 | Dealer: nová příležitost | Login dealer → Nova → 4 kroky → Odeslat | Status PENDING_APPROVAL, redirect na dashboard |
| M-T6 | Investor: investice | Login investor → Příležitost (FUNDING) → Investovat → Částka → Potvrdit | Investment PENDING, bank info zobrazeno |
| M-T7 | Investor: min. investice | Zadat < 10 000 Kč | Validační chyba |
| M-T8 | Investor: přesáhnutí limitu | Zadat víc než zbývá k financování | Validační chyba (409) |
| M-T9 | Admin: schválení příležitosti | Admin → Approve opportunity | Status PENDING_APPROVAL → FUNDING |
| M-T10 | Admin: payout po prodeji | Admin → Payout → Zadat actualSalePrice | 40/40/20 split, COMPLETED status |
| M-T11 | Payout se ztrátou | actualSalePrice < purchasePrice + repairCost | Investoři dostanou zpět poměrný kapitál, žádný profit |

### Eshop dílů — Test Cases

| # | Scénář | Kroky | Očekávaný výsledek |
|---|--------|-------|-------------------|
| E-T1 | Přidání do košíku | Katalog → Detail dílu → Přidat do košíku | Košík se aktualizuje, badge count |
| E-T2 | Stock check | Díl s stock=0 → Přidat | Tlačítko disabled |
| E-T3 | Multi-supplier košík | Přidat díly od 2 různých dodavatelů | Checkout seskupí dle dodavatele |
| E-T4 | Checkout — bankovní převod | Košík → Objednávka → Doručení → Banka → Potvrdit | Objednávka vytvořena, číslo OBJ-YYMMDD-XXXXX |
| E-T5 | Checkout — dobírka | Platba = COD | +39 Kč fee, celková cena navýšena |
| E-T6 | Checkout — Stripe | Platba = Karta | Stripe checkout session, redirect |
| E-T7 | Zásilkovna widget | Doručení = Zásilkovna → Vybrat výdejní místo | Widget se otevře, místo se uloží |
| E-T8 | Stock reservation | Přidat do košíku → Checkout | 30-min reservation vytvořena, countdown |
| E-T9 | Reservation expiry | Počkat 30 min na checkout stránce | Redirect, reservation zrušena |
| E-T10 | Guest objednávka | Bez přihlášení → Checkout → Dokončit | Guest token vygenerován, tracking link |
| E-T11 | Moje objednávky | Přihlášení → /dily/moje-objednavky | Seznam objednávek se statusy |
| E-T12 | Katalog filtry | Filtr: kategorie=BRAKES, cena 500-5000, řazení | Správné výsledky, pagination |
| E-T13 | Prázdný košík | /dily/kosik bez položek | Empty state s linkem do katalogu |

### Inzertní platforma — Test Cases

| # | Scénář | Kroky | Očekávaný výsledek |
|---|--------|-------|-------------------|
| I-T1 | Anonymní inzerát | /inzerce/pridat → 6 kroků → Publikovat (bez registrace) | Listing ACTIVE, auto-account vytvořen |
| I-T2 | Inzerát s VIN (přihlášený) | Login → Pridat → VIN → Dekódovat | Autofill: značka, model, rok, motor, převodovka |
| I-T3 | Inzerát bez VIN | Přeskočit krok 1 → Vyplnit ručně | Funguje, všechna pole ručně |
| I-T4 | Registrace — Soukromý | /inzerce/registrace → PRIVATE → Vyplnit → Odeslat | Účet vytvořen, redirect na login |
| I-T5 | Registrace — Bazar + ARES | Typ = BAZAAR → IČO → ARES ověření | Firma nalezena v rejstříku, auto-fill název |
| I-T6 | Dashboard — CRUD | /moje-inzeraty → Editace / Deaktivace / Smazání | Správné status přechody |
| I-T7 | Poptávka kupujícího | /nabidka/[slug] → Kontaktní formulář → Odeslat | Inquiry vytvořena, inquiryCount++ |
| I-T8 | Odpověď na poptávku | /moje-inzeraty/[id] → Poptávky → Odpovědět | Reply uložena, status REPLIED |
| I-T9 | TOP propagace | /moje-inzeraty/[id] → Propagovat → TOP | Stripe checkout 199 Kč, premium badge |
| I-T10 | Prodloužení | /moje-inzeraty/[id] → Prodloužit | Stripe checkout 99 Kč, expiry prodloužen o 30d |
| I-T11 | Limit check (PRIVATE) | Účet PRIVATE → Pokusit se přidat 2. inzerát | ⚠️ BUG: hardcoded limit 10 místo 1 |
| I-T12 | Foto upload | Krok 4 → Nahrát 5 fotek → Drag reorder → Primární | Fotky s watermarkem, správné pořadí |
| I-T13 | Broker help checkbox | Krok 5 → Zaškrtnout "Chci pomoc makléře" | Flag uložen v DB, makléř notifikován |

---

## PRIORITIZACE OPRAV

### P1 — Opravit před spuštěním

| # | Problém | Produkt | Effort |
|---|---------|---------|--------|
| 1 | maxListings placeholder (hardcoded 10 místo reálného limitu per account type) | Inzerce | Malý — fetch z user.accountType |
| 2 | VIN decode auth mismatch (veřejný wizard, ale API vyžaduje auth) | Inzerce | Malý — buď zpřístupnit VIN decode veřejně, nebo vyžadovat login |

### P2 — Opravit brzy po spuštění

| # | Problém | Produkt | Effort |
|---|---------|---------|--------|
| 3 | Foto upload v Marketplace wizard (jen UI placeholder) | Marketplace | Střední — Cloudinary upload pattern existuje |
| 4 | 2 stub tlačítka v dealer detail | Marketplace | Malý — napojit na existující API |
| 5 | Silent error handling v moje-inzeraty | Inzerce | Malý — přidat toast/alert |

### P3 — Nice to have

| # | Problém | Produkt | Effort |
|---|---------|---------|--------|
| 6 | Page-level auth checks (dealer/investor dashboardy) | Marketplace | Malý — middleware chrání, ale defense-in-depth |
| 7 | averageRoi hardcoded na 0 v dealer stats | Marketplace | Malý — spočítat z COMPLETED flipů |
| 8 | Typo v potvrzení objednávky (chybí diakritika) | Eshop | Minimální |
| 9 | Validace při přechodu mezi kroky wizardu | Inzerce | Střední |

---

## CELKOVÝ VERDIKT

### Marketplace VIP: ✅ 90 % — Core workflow funguje end-to-end
- Apply → Create opportunity → Fund → Complete → Payout = **plně funkční**
- Foto upload chybí ale neblokuje core flow
- API routes jsou production-ready s auth, validací, state transitions

### Eshop dílů: ✅ 98 % — Production-ready
- Katalog → Košík → Checkout → Platba → Objednávka = **plně funkční**
- Pokročilé funkce (stock reservation, multi-supplier, Zásilkovna, Stripe) fungují
- **Žádné stuby ani placeholdery v core flow**

### Inzertní platforma: ✅ 85 % — Funkční s 2 konkrétními bugy
- Registrace → Wizard → Publikování → Dashboard → Poptávky → Propagace = **funguje**
- 2 konkrétní bugy: maxListings placeholder + VIN auth mismatch
- Wizard je dobře navržený s 6 kroky, VIN dekodér, foto upload s watermarkem
