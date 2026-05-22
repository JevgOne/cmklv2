# Audit projektu Carmakler — Gap analýza

**Datum:** 2026-04-25
**Autor:** Plánovač
**Rozsah:** Kompletní codebase — app/, lib/, components/, prisma/

---

## Celkový verdikt

Projekt je **produkčně připravený** ve většině oblastí. Z ~145 web stránek, ~249 API routes, ~50 PWA stránek a ~35 admin stránek je naprostá většina plně implementována. Nalezeno minimum kritických problémů.

**Statistiky:**
- TODO/FIXME komentářů: **4** (z toho 1 v API, 1 v komponentě, 2 v lib)
- Stuby/placeholdery: **3** (admin export, partner messaging, chart labels)
- Chybějící funkce: **5** (viz níže)
- Bugy: **1** známý (CEBIA reportUrl)

---

## A. STUBY A NEIMPLEMENTOVANÉ FUNKCE

### A1. Admin Dashboard — Export button (STUB)
- **Soubor:** `app/(admin)/admin/dashboard/ExportButton.tsx`
- **Problém:** Tlačítko "Export" zobrazí zprávu "Export dat bude brzy dostupný" — neexportuje nic
- **Priorita:** STŘEDNÍ
- **Fix:** Implementovat CSV/Excel export dat z dashboardu

### A2. Partner Messages — jen notifikace (STUB)
- **Soubor:** `app/(partner)/partner/messages/page.tsx`
- **Problém:** Stránka zobrazuje pouze systémové notifikace s textem "Plná komunikace bude brzy k dispozici"
- **Priorita:** NÍZKÁ (partnerský modul je sekundární)
- **Fix:** Implementovat real-time messaging (Pusher je v tech stacku)

### A3. PWA Stats — graf labels (PLACEHOLDER)
- **Soubor:** `app/(pwa)/makler/stats/page.tsx` (řádky 333, 354)
- **Problém:** "bar chart placeholder" a "line chart placeholder" komentáře — grafy fungují ale jsou jednoduché div-based, ne plnohodnotné chart komponenty
- **Priorita:** NÍZKÁ (funguje vizuálně, jen není recharts/chart.js)
- **Fix:** Volitelně nahradit za recharts pro lepší UX

---

## B. TODO/FIXME V KÓDU

### B1. Handover follow-up email
- **Soubor:** `app/api/vehicles/[id]/handover/route.ts:211`
- **TODO:** `TASK-026 — automatický email kupujícímu po 7 dnech (follow-up systém)`
- **Stav:** Vytvoří notifikaci, ale neposílá automatický follow-up email
- **Priorita:** STŘEDNÍ

### B2. ShopTrustBar — payment method badges
- **Soubor:** `components/shop/ShopTrustBar.tsx:6`
- **TODO(designer):** Text-badges místo oficiálních SVG log platebních metod a přepravců
- **Stav:** Čeká na brand asset approval (task #28 sekce 2.5)
- **Priorita:** NÍZKÁ (funkční, jen vizuálně nedotažené)

### B3. Parts SEO query — substring match
- **Soubor:** `lib/seo/pricingAggregate.ts:16` + `lib/seo/partsItemList.ts:7`
- **TODO #87d:** JSON array query používá `contains` (substring) místo JSONB path query
- **Stav:** Může vrátit false positives (hledání "Škoda" matchne "Škoda Roomster")
- **Priorita:** NÍZKÁ (malý dopad na pricing aggregace)

### B4. Zásilkovna XML parsing
- **Soubor:** `lib/shipping/README.md:188`
- **Stav:** Zásilkovna API vrací XML, parsuje se regexem místo proper XML parserem
- **Priorita:** NÍZKÁ (funguje pro současné use-cases, ale křehké)

---

## C. ZNÁMÉ BUGY

### C1. CEBIA mock report — reportUrl = null
- **Soubor:** `lib/cebia.ts:132-141`
- **Problém:** Mock CEBIA report v dev mode vrací `reportUrl: null`
- **Dopad:** UI které očekává URL může být broken v dev mode
- **Fix:** Vrátit placeholder URL místo null

---

## D. CHYBĚJÍCÍ LOADING/ERROR SOUBORY

### Pokryté oblasti (DOBRÉ):
- `app/(web)/` — 58 loading.tsx souborů, pokrývá všechny hlavní sekce
- `app/(admin)/` — 29 loading.tsx souborů, plné pokrytí
- `app/(pwa)/` — 41 loading.tsx souborů, plné pokrytí

### Chybějící (NEKRITICKÉ):
Tyto stránky nemají vlastní loading.tsx ale dědí z parent layout:
- `app/(web)/overeni-emailu/*` — intentionally minimal (success/error pages)
- `app/(web)/zapomenute-heslo/` — client-side form
- `app/(web)/reset-hesla/[token]/` — client-side form
- `app/(web)/h/[slug]/` — hashtag landing page
- `app/(web)/dodavatel/[slug]/` — supplier profile
- `app/(web)/tag/[slug]/` — tag landing page
- `app/(pwa-parts)/` — žádný loading.tsx v celé sekci

**Priorita:** NÍZKÁ — parent layouts zajišťují fallback loading state

---

## E. FUNKČNÍ OBLASTI — BEZ PROBLÉMŮ

### E1. Web stránky (145+ stránek)
- Hlavní flow (nabídka, inzerce, díly, marketplace) — plně implementováno
- SEO landing pages (značky, modely, města, cenové rozsahy) — kompletní
- Profily (makléři, dodavatelé, partneři) — kompletní
- Registrace/login/onboarding — kompletní
- Služby (prověrka, financování, pojištění) — kompletní

### E2. API routes (249 routes)
- CRUD pro všechny entity — kompletní
- Auth/role checks — konzistentní pattern
- Zod validace — přítomna na ~240+ routes
- Error handling — try-catch na všech routes

### E3. Admin panel (35 stránek)
- Dashboard, vozidla, inzerce, makléři, leady, uživatelé — kompletní
- Manažerský modul (tým, schvalování, bonusy) — kompletní
- Eshop (feedy, objednávky, reklamace, dodavatelé, díly) — kompletní
- Finance (platby, výplaty) — kompletní
- Marketplace, partneři — kompletní
- Tagy — kompletní

### E4. PWA Makléř (46 stránek)
- Dashboard, nabírání aut, smlouvy, kontakty — kompletní
- Onboarding (5 kroků) — kompletní
- Statistiky, leaderboard, provize — kompletní
- Quick mode, messages, leads — kompletní

### E5. PWA Parts Supplier (13 stránek)
- Dashboard, přidávání dílů, objednávky — kompletní
- Onboarding, profil — kompletní

### E6. Partner modul (19 stránek)
- Dashboard, vozidla, díly, objednávky, leady — kompletní
- Statistiky, profil, fakturace — kompletní

### E7. Integrace
- Claude API (AI asistent, generování popisů) — kompletní
- Cloudinary (upload obrázků) — kompletní s dev fallback
- ARES (IČO ověření) — kompletní
- CEBIA (VIN check) — kompletní s mock fallback
- Stripe (platby) — kompletní
- Resend (emaily) — kompletní
- Shipping (5 přepravců) — kompletní s dry-run mode
- SMS (GoSMS/Twilio) — kompletní s dev mode

---

## F. CHYBĚJÍCÍ FUNKCE (dosud neimplementováno)

Tyto funkce jsou zmíněny v zadání/TASK-QUEUE ale nemají implementaci:

### F1. Blog/Magazín
- **Stav:** Neexistuje (`app/(web)/blog/` je prázdné)
- **Reference:** TASK-043 (plán vytvořen v `plan-task-043-blog.md`)

### F2. Kariérní systém s hvězdičkami
- **Stav:** Stávající systém (Tipař/Junior/Senior/Expert) funguje, přepis na hvězdičky plánován
- **Reference:** TASK-044 (plán v `plan-task-044-broker-stars.md`, implementace probíhá)

### F3. AI Price Valuation (automatický odhad ceny)
- **Stav:** Neimplementováno — `api/assistant/price-estimate/route.ts` existuje jako basic endpoint
- **Reference:** Zmíněno v CLAUDE.md jako budoucí feature

### F4. Real-time notifikace (Pusher)
- **Stav:** Pusher je v tech stacku ale real-time push notifikace nejsou plně integrovány
- **Částečně:** PWA notification preferences existují, email notifikace fungují

### F5. Offline sync (Background Sync)
- **Stav:** Service Worker + IndexedDB je v tech stacku, basic offline page existuje
- **Částečně:** `app/(pwa)/makler/offline/page.tsx` existuje jako offline fallback

---

## G. SHRNUTÍ PRIORIT

| # | Problém | Priorita | Typ |
|---|---------|----------|-----|
| A1 | Admin Export button (stub) | STŘEDNÍ | STUB |
| B1 | Handover follow-up email (TODO) | STŘEDNÍ | NEIMPLEMENTOVÁNO |
| C1 | CEBIA reportUrl null (bug) | NÍZKÁ | BUG |
| A2 | Partner messages (stub) | NÍZKÁ | STUB |
| B2 | ShopTrustBar SVG badges | NÍZKÁ | DESIGN |
| B3 | Parts SEO substring query | NÍZKÁ | TECH_DEBT |
| B4 | Zásilkovna XML parser | NÍZKÁ | TECH_DEBT |
| A3 | Stats chart placeholder | NÍZKÁ | IMPROVEMENT |
| F1-F5 | Chybějící features | BACKLOG | PLANNED |

**Celkově:** Projekt je v dobrém stavu. Žádné kritické stuby ani broken funkce. Hlavní gaps jsou plánované features (blog, hvězdičky) které už mají implementační plány.
