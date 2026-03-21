# CarMakléř — MASTER PLÁN VÝVOJE
> Aktualizováno: 21.3.2026
> Stav: V aktivním vývoji

---

## PŘEHLED EKOSYSTÉMU

```
CarMakléř Ekosystém
├── carmakler.cz          — Hlavní web portál + admin panel
├── carmakler.cz/makler   — PWA pro makléře
├── carmakler.cz/inzerce  — Bezplatná inzerce pro soukromé prodejce
├── carmakler.cz/shop     — E-shop (díly z vrakovišť + autokosmetika)
└── marketplace.carmakler.cz — Investiční platforma (P3, later)
```

---

## CO JE HOTOVÉ (stav k 21.3.2026)

### Infrastruktura ✅
- [x] Next.js 15 + TypeScript + Tailwind CSS 4
- [x] Prisma + SQLite (dev), připraveno na PostgreSQL (prod)
- [x] NextAuth.js — login, registrace, JWT, role middleware
- [x] Design system — 18 UI komponent
- [x] Brand — logo CarMakléř nasazeno
- [x] Seed data — 12 vozidel, 8 uživatelů, 3 regiony

### Web portál (veřejný) ✅
- [x] Homepage (Autorro styl — hero, služby, vozy, makléři, recenze, CTA)
- [x] Katalog vozidel /nabidka — reálná data z DB, funkční filtry a řazení
- [x] Detail vozu /nabidka/[slug] — galerie, parametry, výbava, kontakt, makléř box
- [x] Chci prodat auto /chci-prodat — landing + formulář
- [x] 4x služby (prověrka, financování, pojištění, výkup) — s formuláři
- [x] O nás, Recenze, Kariéra, Kontakt — kompletní
- [x] Seznam makléřů /makleri — 9 makléřů, filtr
- [x] Profil makléře /makler/[slug] — stats, vozidla, recenze, kontakt
- [x] Login + Registrace — funkční s DB
- [x] Navbar s dropdowny + Footer + Mobile menu

### Inzerce ✅
- [x] Landing /inzerce — "Prodejte své auto. Zdarma."
- [x] Vložení inzerátu /inzerce/pridat — 3-krokový formulář, ukládá do DB
- [x] Soukromé inzeráty se zobrazují v hlavním katalogu /nabidka

### Shop 🔶 (částečně)
- [x] Landing /shop — hero, vyhledávání dílů, kategorie, featured produkty
- [x] Katalog /shop/katalog — tabs, filtry, 9 produktů
- [x] Detail produktu /shop/produkt/[slug] — galerie, specs, kompatibilita
- [ ] Košík a checkout
- [ ] Platební brána
- [ ] Správa produktů v adminu
- [ ] Objednávkový systém

### Admin panel 🔶 (částečně)
- [x] Layout — sidebar, header, responzivní
- [x] Dashboard — reálné počty z DB, schvalování vozidel
- [x] Tabulka makléřů — z DB
- [x] Tabulka vozidel — z DB
- [x] Schválení/zamítnutí vozidla — funkční API
- [ ] Správa uživatelů (přidání, editace, deaktivace)
- [ ] Správa regionů
- [ ] Provizní přehled
- [ ] Nastavení systému
- [ ] Export dat

### API ✅
- [x] GET/POST /api/vehicles — CRUD + filtry
- [x] GET/PATCH /api/vehicles/[id] — detail + editace + change log
- [x] PATCH /api/vehicles/[id]/status — schvalovací workflow
- [x] POST /api/inzerce — vložení soukromého inzerátu
- [x] POST /api/contact — kontaktní formulář
- [x] POST /api/sell-request — chci prodat
- [x] POST /api/auth/register — registrace
- [x] GET /api/admin/brokers — seznam makléřů
- [x] GET /api/admin/vehicles — seznam vozidel
- [x] POST /api/admin/vehicles/[id]/approve — schválení

---

## CO ZBÝVÁ — ROZDĚLENO DO FÁZÍ

---

### FÁZE A: PWA PRO MAKLÉŘE (Kritické — bez toho nejde fungovat)
> Makléř se přihlásí a musí mít kompletní nástroj pro práci

```
A1. Makléř Dashboard (/makler/dashboard)
├── Přehled: moje aktivní vozy, celkové provize, čekající schválení
├── Rychlé akce: Přidat vůz, Zobrazit provize
├── Notifikace: nový dotaz, schválení/zamítnutí vozu
└── Bottom navigation: Dashboard, Vozy, Provize, Profil

A2. Správa vozů (/makler/vozy)
├── Seznam mých vozů s filtrem podle statusu (Draft/Pending/Active/Sold)
├── Přidání vozu — 4-krokový wizard:
│   ├── Krok 1: VIN zadání (+ budoucí VIN scanner)
│   ├── Krok 2: Základní údaje (auto-fill z VIN pokud možné)
│   ├── Krok 3: Fotky (mobilní focení, drag&drop, pořadí)
│   └── Krok 4: Cena + popis + publikace
├── Editace vozu (VIN nelze změnit!)
├── Změna ceny (vyžaduje důvod → change log)
├── Změna statusu (Draft→Pending odeslání ke schválení)
└── Smazání/archivace vozu

A3. Profil makléře (/makler/profil)
├── Editace: jméno, bio, specializace, města, telefon, avatar
├── Veřejný profil preview
└── Nastavení notifikací

A4. Provize (/makler/provize)
├── Přehled: tento měsíc, celkem, čeká na výplatu
├── Historie provizí (tabulka: vůz, cena prodeje, provize, datum)
├── Detail provize (rozpis: makléř 50%, firma 50%)
└── Export do CSV
```

### FÁZE B: ADMIN PANEL KOMPLET
> BackOffice musí mít plnou kontrolu

```
B1. Správa uživatelů (/admin/users)
├── Seznam všech uživatelů (všechny role)
├── Detail uživatele (profil, vozidla, provize, aktivita)
├── Schválení nového makléře (PENDING → ACTIVE)
├── Deaktivace makléře (přeřazení jeho vozů)
├── Přiřazení makléře k manažerovi
├── Přiřazení k regionu
└── Změna role

B2. Správa regionů (/admin/regions)
├── CRUD regionů
├── Přiřazení měst k regionům
└── Regionální ředitelé — přehled

B3. Provize — admin view (/admin/commissions)
├── Přehled všech provizí (filtry: makléř, období, status)
├── Generování výplat (měsíční uzávěrka)
├── Schválení výplaty
├── Export pro účetnictví
└── Dashboard: celkový obrat, provize firma vs makléři

B4. Správa vozů — rozšíření (/admin/vehicles)
├── Detailní fronta ke schválení (checklist: fotky OK, VIN OK, cena OK)
├── Hromadné akce (schválení, zamítnutí, archivace)
├── History log — kdo co kdy změnil
├── Flagované změny (velká sleva, km dolů) — přehled
└── Statistiky: průměrná doba prodeje, konverze

B5. Nastavení (/admin/settings)
├── Provizní sazby (editovatelné)
├── Minimální provize
├── Email šablony
├── Systémové notifikace
└── Export/Import dat
```

### FÁZE C: PROVIZNÍ SYSTÉM
> Jádro business modelu

```
C1. Databáze — nové modely
├── Commission (provize: vozidlo, makléř, částka, status)
├── Payout (výplata: makléř, období, částka, status)
├── BonusCommission (pojištění, leasing)
└── Rozšíření Vehicle o: soldPrice, soldAt, commissionCalculated

C2. Výpočet provize
├── Automaticky při označení vozu jako SOLD
├── Provize = 5% z prodejní ceny (min 25 000 Kč)
├── Split: 50% makléř / 50% firma
├── Bonus manažer: 5% z firemní části
├── Bonus ředitel: 3% z firemní části
└── Bonusy za pojištění/leasing (pokud dojednáno)

C3. API endpointy
├── POST /api/vehicles/[id]/sell — označení jako prodané + výpočet provize
├── GET /api/commissions — seznam provizí (filtr: makléř, období)
├── GET /api/commissions/summary — souhrn (tento měsíc, celkem)
├── POST /api/admin/payouts/generate — generování výplat za období
└── PATCH /api/admin/payouts/[id] — schválení výplaty
```

### FÁZE D: INZERCE — DOKONČENÍ
> Soukromí prodejci potřebují správu svých inzerátů

```
D1. Správa mých inzerátů (/inzerce/moje)
├── Login/registrace pro soukromé prodejce (jednodušší než makléř)
├── Seznam mých inzerátů
├── Editace inzerátu
├── Smazání/deaktivace inzerátu
├── Statistiky: zobrazení, dotazy
└── Prodloužení inzerátu

D2. Komunikace prodejce ↔ kupující
├── Kontaktní formulář na inzerátu → email prodejci
├── Notifikace o zájmu
└── (budoucí: chat)

D3. Boost/Topování (monetizace — LATER)
├── Topování za 199 Kč / 24h
├── Zvýraznění za X Kč / 7 dní
└── Platební brána (Stripe/GoPay)
```

### FÁZE E: SHOP — DOKONČENÍ
> E-shop musí fungovat end-to-end

```
E1. Košík
├── Přidání produktu do košíku (localStorage + state)
├── Změna množství
├── Odebrání položky
├── Sidebar/drawer košík
├── Trvalý mezi stránkami (context/zustand)
└── Počet položek v navbaru

E2. Checkout
├── Krok 1: Dodací údaje (jméno, adresa, telefon, email)
├── Krok 2: Doprava (Zásilkovna 69 Kč, PPL 299 Kč, osobní odběr zdarma)
├── Krok 3: Platba (karta, převod, dobírka)
├── Krok 4: Shrnutí + potvrzení
└── Potvrzovací email

E3. Objednávky
├── DB modely: Order, OrderItem
├── Správa objednávek v adminu
├── Stavy: Nová → Zaplacená → Odeslaná → Doručená
├── Tracking number
└── Email notifikace o stavu

E4. Správa produktů (admin)
├── CRUD produktů
├── Kategorie (strom)
├── Fotky, varianty, sklad
├── Správa vraků (zdroj dílů)
└── Import/export

E5. Platební brána
├── Stripe nebo GoPay integrace
├── Webhook pro potvrzení platby
└── Automatická změna stavu objednávky
```

### FÁZE F: INTEGRACE & KOMUNIKACE
> Propojení s externími službami

```
F1. Email systém (Resend)
├── Šablony: registrace, schválení, zamítnutí, nový dotaz, provize
├── Transakční emaily pro všechny akce
└── Hromadné emaily (admin)

F2. VIN dekodér
├── Vlastní DB nebo API (NHTSA fallback)
├── Auto-fill údajů při zadání VIN
└── VIN validace (formát, checksum)

F3. Mapy.cz API
├── Geocoding (adresa → souřadnice)
├── Zobrazení lokace vozu na mapě
└── "Vozy v okolí" feature

F4. Export na portály
├── XML feed pro Sauto.cz
├── XML feed pro TipCars.cz
├── Automatická synchronizace (cron)
└── Správa exportů v adminu

F5. Push notifikace (PWA)
├── Service worker setup
├── Nový dotaz na vůz
├── Schválení/zamítnutí inzerátu
├── Nová provize
└── Systémové notifikace
```

### FÁZE G: BOOM FUNKCE (diferenciace od konkurence)
> To co nás odliší od Sauto, TipCars, Bazoše

```
G1. Live viewers — "5 lidí si právě prohlíží"
├── Pusher real-time
├── Anonymní tracking
└── Badge na detailu vozu

G2. Smart Search (AI)
├── "SUV automat do 500k" → parsování dotazu
├── OpenAI/Claude API
├── Doporučení alternativ
└── Kvíz "Pomoz mi vybrat auto"

G3. Trust Score
├── Výpočet 0-100 na základě: verifikace, fotky, popis, historie, makléř
├── Automatický update
├── Badge na kartě vozu
└── Vysvětlení skóre pro uživatele

G4. Anonymní chat
├── Real-time messaging (Pusher)
├── Bez registrace pro kupujícího
├── Šablony zpráv
└── Notifikace makléři

G5. Hlídač ceny
├── Uložené filtry
├── Email notifikace při nových vozech
├── Price drop alert
└── Týdenní souhrn

G6. Rezervace prohlídek
├── Kalendář makléře
├── Výběr termínu kupujícím
├── SMS ověření
└── Připomínky
```

### FÁZE H: MARKETPLACE (P3 — podpultovka)
> Investiční platforma — invite only

```
H1. DB modely — MarketplaceDealer, MarketplaceInvestor, MarketplaceDeal, MarketplaceInvestment
H2. Dealer dashboard — vytvoření dealu, kalkulace, fotky, updates
H3. Investor dashboard — portfolio, nové příležitosti, výnosy
H4. Admin — schvalování dealů, správa obchodníků a investorů
H5. Deal lifecycle: Draft → Funding → Bought → Repair → Selling → Done
H6. Notifikace a reporting
```

---

## DOPORUČENÉ POŘADÍ IMPLEMENTACE

```
SPRINT 1 (teď):  A1-A2 — Makléř dashboard + správa vozů
SPRINT 2:        A3-A4 + C1-C3 — Profil + provize
SPRINT 3:        B1-B3 — Admin komplet
SPRINT 4:        E1-E3 — Shop košík + checkout
SPRINT 5:        F1-F2 — Emaily + VIN dekodér
SPRINT 6:        D1-D2 — Inzerce správa
SPRINT 7:        G1-G3 — Trust Score, Live viewers, AI search
SPRINT 8:        F3-F5 — Mapy, export, push notifikace
SPRINT 9:        E4-E5 + B4-B5 — Shop admin + platby
SPRINT 10:       G4-G6 — Chat, hlídač, rezervace
SPRINT 11:       H1-H6 — Marketplace
```

---

## DATABÁZE — CHYBĚJÍCÍ MODELY

K existujícím (User, Region, Vehicle, VehicleImage, VehicleChangeLog) přidat:

```
Commission          — provize z prodeje
Payout              — výplata makléři
ShopProduct         — produkt v e-shopu
ShopCategory        — kategorie produktů
ShopOrder           — objednávka
ShopOrderItem       — položka objednávky
WreckedCar          — vrak (zdroj dílů)
MarketplaceDealer   — obchodník (marketplace)
MarketplaceInvestor — investor
MarketplaceDeal     — investiční deal
MarketplaceInvestment — investice do dealu
```

---

## DEPLOYMENT PLAN

```
DEV:      localhost:3000 (SQLite) ← TEĎ JSME TADY
STAGING:  carmakler-staging.vercel.app (PostgreSQL Neon)
PROD:     carmakler.cz (PostgreSQL Neon, custom doména)

Subdomény:
├── marketplace.carmakler.cz → samostatný deploy nebo route group
├── inzerce → /inzerce route (součást hlavní appky)
└── shop → /shop route (součást hlavní appky)
```

---

*Kompletní specifikace jednotlivých modulů viz ~/carmakler/docs/*
