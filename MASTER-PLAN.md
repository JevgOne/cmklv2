# CarMakléř — MASTER PLÁN VÝVOJE
> Aktualizováno: 21.3.2026
> Stav: V aktivním vývoji

---

## PŘEHLED EKOSYSTÉMU

```
CarMakléř Ekosystém — 4 produkty pod jednou značkou
│
├── 1. MAKLÉŘSKÁ SÍŤ (jádro businessu)
│   ├── carmakler.cz              — Veřejný web (katalog, makléři, landing pages)
│   ├── carmakler.cz/app          — PWA pro makléře (7-krokové nabírání aut, smlouvy, AI asistent)
│   ├── carmakler.cz/admin        — BackOffice admin panel
│   └── Provize: 5% z prodejní ceny, min. 25 000 Kč
│
├── 2. INZERTNÍ PLATFORMA
│   ├── carmakler.cz/inzerat      — Podání inzerátu (soukromí, autobazary, dealeři)
│   ├── carmakler.cz/nabidka      — Společný katalog (makléřské + soukromé inzeráty)
│   └── Monetizace: Premium/TOP inzeráty, měsíční předplatné pro firmy
│
├── 3. ESHOP AUTODÍLY
│   ├── carmakler.cz/dily         — E-shop (použité díly z vrakovišť + aftermarket)
│   ├── carmakler.cz/parts        — PWA pro dodavatele dílů (3-krokové přidání)
│   └── Monetizace: marže na dílech, provize z prodeje
│
└── 4. MARKETPLACE (VIP — uzavřená sekce)
    ├── carmakler.cz/marketplace  — Investiční platforma pro flipping aut
    ├── Ověření dealeři nabízí příležitosti (nákup + oprava + prodej)
    ├── Ověření investoři financují (jeden nebo víc na jedno auto)
    ├── Auto se kupuje na firmu Carmakler (bezpečnost)
    └── Dělení zisku: 40% investor, 40% dealer, 20% Carmakler
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
> Kompletní mobilní aplikace pro makléře v terénu. Offline-first, 7-krokové nabírání aut, smlouvy s digitálním podpisem, AI asistent.
> **TASK-015, TASK-016, TASK-017, TASK-018**

```
A1. PWA Setup + Layout + Dashboard (TASK-015)
├── Serwist PWA (manifest, service worker, offline strategie)
├── Install prompt (výzva k instalaci na homescreen)
├── Layout: bottom nav (Domů, Vozy, ➕Přidat, Provize, Profil), top bar, offline banner
├── Dashboard: pozdrav, statistiky měsíce, CTA "Nabrat auto", rozpracované drafty, notifikace
├── IndexedDB infrastruktura (drafts, vehicles, images, contacts, vinCache, equipmentCatalog, contracts)
├── Background Sync (sync-vehicles, sync-images, sync-contracts)
├── Online/offline detekce (useOnlineStatus hook)
├── Stránka offline draftů (/app/offline)
├── Moje vozy (/app/vehicles) — seznam s filtry a stavy
├── Provize (/app/commissions) — statistiky, historie, výplaty (5% min 25k Kč)
└── Profil (/app/profile) — údaje, Trust Score, statistiky, nastavení notifikací

A2. Nabrat auto — 7-krokový flow (TASK-016)
├── Step 1: Kontakt + navigace (zdroj leadu, předběžné info, kontakt, adresa, Mapy.cz/Google Maps)
├── Step 2: Prohlídka vozu (dokumenty, exteriér+spáry+přelakování, interiér+vytopení, motor, testovací jízda, odmítnutí vozu s důvodem, celkový dojem)
├── Step 3: VIN zadání + dekódování (ruční zadání, validace, duplikát check, vindecoder.eu API, offline cache)
├── Step 4: Fotodokumentace (guided focení s overlay, min 12 fotek, povinné: tachometr+VIN štítek+klíče, komprese 1920px/80%/2MB)
├── Step 5: Údaje + výbava (z VIN zamčené, ruční: palivo/výkon/barva/dveře/místa, km, stav, výbava z katalogu, přednosti)
├── Step 6: Cena + provize + lokace (cena, DPH, live výpočet provize 5%/25k, lokace, popis, AI generování popisu)
├── Step 7: Kontrola + odeslání (preview inzerátu, checklist kompletnosti, odeslání ke schválení)
├── Post-submission: stavy (ke schválení→schváleno/zamítnuto), push notifikace, oprava a znovuodeslání
├── Editace vozu (/app/vehicles/[id]/edit) — pravidla podle stavu (draft=vše, active=omezené, sold=nic)
└── Offline: vše funguje bez internetu, auto-save, background sync

A3. Smlouvy s digitálním podpisem (TASK-017)
├── Typy: zprostředkovatelská smlouva, předávací protokol
├── Generování: automatické předvyplnění z dat vozu + kontaktu
├── Makléř doplní: rodné číslo, OP, bankovní účet prodejce
├── Digitální podpis: canvas (prst na displeji), prodejce + makléř
├── Geolokace + timestamp při podpisu
├── PDF generování s podpisy, odeslání emailem, stažení
└── Offline: generování + podpis bez internetu, sync PDF po připojení

A4. AI Asistent (TASK-018)
├── Plovoucí chat bubble v celé PWA
├── Knowledge base: smlouvy, focení, prohlídky, cenotvorba, právo, procesy Carmakler
├── Kontextové odpovědi (ví na jakém kroku makléř je)
├── Quick actions (nejčastější dotazy)
├── Generování popisů inzerátů z dat vozu
├── Claude API (Sonnet pro rychlost), konverzační paměť, rate limiting
└── Offline: informace o nutnosti připojení
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
├── Provize = 5% z prodejní ceny, minimálně 25 000 Kč
├── Split: 50% makléř / 50% firma
├── Bonus manažer: 5% z firemní části
├── Bonus ředitel: 3% z firemní části
├── Bonusy za pojištění/leasing (pokud dojednáno)
└── Live výpočet provize v PWA při zadávání ceny (motivace makléře)

C3. API endpointy
├── POST /api/vehicles/[id]/sell — označení jako prodané + výpočet provize
├── GET /api/commissions — seznam provizí (filtr: makléř, období)
├── GET /api/commissions/summary — souhrn (tento měsíc, celkem)
├── POST /api/admin/payouts/generate — generování výplat za období
└── PATCH /api/admin/payouts/[id] — schválení výplaty
```

### FÁZE D: INZERTNÍ PLATFORMA — KOMPLETNÍ
> Digitální inzerce aut pro soukromé prodejce, autobazary a dealery. Propojení s makléřskou sítí.
> **TASK-019**

```
D1. Registrace a role
├── Nová role ADVERTISER (inzerent): soukromý / autobazar (IČO+ARES) / dealer
├── Nová role BUYER (kupující): email/Google/Apple login
├── Ověření firem přes ARES API

D2. Podání inzerátu (/inzerat/novy) — 6-krokový flow
├── Krok 1: VIN + dekódování (sdílená logika s makléřským flow)
├── Krok 2: Údaje (značka, model, rok, km, palivo, výkon, barva, karoserie, stav...)
├── Krok 3: Výbava (katalog checkboxů)
├── Krok 4: Fotky (upload z galerie, min. 5, komprese)
├── Krok 5: Cena + popis + lokace + kontakt
├── Krok 6: Preview + odeslání
└── Checkbox "Chci pomoc s prodejem od makléře" → lead pro makléřskou síť

D3. Portál inzerenta (/moje-inzeraty)
├── Dashboard: moje inzeráty, statistiky (zobrazení, dotazy), graf
├── Správa: editace, deaktivace, smazání, označit jako prodáno
├── Dotazy od zájemců (seznam s odpovídáním)
└── Zprávy (messaging inzerent ↔ zájemce)

D4. Funkce pro kupující (registrované)
├── Oblíbené (❤️) — ukládání vozů
├── Hlídací pes — filtr + emailová notifikace při nových vozech
├── Historie dotazů
└── Předvyplněný kontaktní formulář z profilu

D5. Rozšíření katalogu
├── Společný katalog: makléřské + soukromé + dealerské inzeráty
├── Badge rozlišení: "Ověřeno makléřem" / "Autobazar" / "Soukromý" / "TOP"
├── TOP inzeráty nahoře, filtr podle typu prodejce
└── VIN duplikát check napříč celou platformou

D6. Monetizace
├── Základní inzerát zdarma (limit: 1 soukromý, 5 firma)
├── Premium/TOP inzerát (zvýraznění, vyšší pozice)
├── Měsíční předplatné pro neomezené inzeráty (autobazary)
└── Ceny nastavitelné v admin panelu
```

### FÁZE E: ESHOP AUTODÍLY — KOMPLETNÍ
> E-shop s použitými díly z vrakovišť + aftermarket díly. PWA pro dodavatele.
> **TASK-020**

```
E1. Veřejný eshop (/dily)
├── Homepage: VIN vyhledávání, výběr vozu (značka→model→rok), kategorie dílů
├── Katalog: filtrování (kategorie, vůz, cena, stav, dostupnost, lokalita)
├── Detail dílu: galerie, popis, kompatibilita, dodavatel+hodnocení, dostupnost
├── VIN kompatibilita: zákazník zadá VIN → vidí jen kompatibilní díly
└── Banner: "Máte vrakoviště? Přidávejte díly přes naši aplikaci"

E2. Košík a objednávky
├── Košík (localStorage + context)
├── Checkout: dodací údaje → doprava (osobní/zásilkovna/PPL/ČP) → platba (převod/karta/dobírka) → potvrzení
├── Sledování stavu: přijata → zpracovává se → odesláno → doručeno
├── Email notifikace (potvrzení, stav, tracking)
└── Stripe platby (fáze 2, v MVP převod + dobírka)

E3. PWA pro dodavatele dílů (/parts) — TASK-020
├── Nová role PARTS_SUPPLIER, registrace + ověření (IČO/ARES, schválení BackOffice)
├── Dashboard: aktivní díly, prodané, tržby, objednávky k vyřízení
├── Přidání dílu — 3 jednoduché kroky:
│   ├── Krok 1: Fotka (kamera, min 1, doporučeno 3-5)
│   ├── Krok 2: Údaje (název/kategorie, stav, kompatibilita=značka+model+rok nebo VIN zdroje, OEM číslo)
│   └── Krok 3: Cena + DPH + množství + doručení → publikovat
├── Hromadný import z CSV/Excel (šablona ke stažení)
├── Správa objednávek: nové → potvrdit → zabalit → odeslat (tracking) → hotovo
├── Push notifikace na novou objednávku
└── Offline: přidání dílu bez internetu, sync po připojení

E4. Správa v admin panelu
├── Schvalování dodavatelů
├── Správa kategorií dílů
├── Přehled objednávek
└── Statistiky: obraty, top dodavatelé, nejprodávanější díly
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

### FÁZE H: MARKETPLACE — INVESTIČNÍ PLATFORMA (VIP, uzavřená)
> Uzavřená platforma pro flipping aut. Ověření dealeři + ověření investoři.
> **TASK-021**

```
H1. Přístup a ověřování
├── Landing page: "Investujte do aut s ověřeným výnosem", jak to funguje, FAQ
├── Žádost o přístup — Dealer: firma, IČO, adresa servisu, reference, fotky servisu → schválení BackOffice
├── Žádost o přístup — Investor: jméno, zkušenosti, plánovaný objem, KYC (občanka) → schválení BackOffice
├── Nové role: INVESTOR, VERIFIED_DEALER
└── Uzavřená sekce — bez schválení žádný přístup

H2. Dealer dashboard (/marketplace/dealer)
├── Přidat příležitost — 4 kroky:
│   ├── Krok 1: Auto k nákupu (odkud, značka, model, stav, fotky, nákupní cena)
│   ├── Krok 2: Plán opravy (seznam oprav + ceny + doby, celkové náklady)
│   ├── Krok 3: Prodejní odhad (odhadovaná prodejní cena, zdůvodnění, auto-kalkulace ROI)
│   └── Krok 4: Odeslání ke schválení BackOffice
├── Auto-kalkulace: celková investice, očekávaný zisk, ROI%, dělení 40/40/20
├── Správa flipu: timeline (financováno→koupeno→v opravě→opraveno→na prodej→prodáno→vyplaceno)
├── Fotky průběhu opravy (budování důvěry investorů)
└── Reporting: skutečné vs odhadované náklady

H3. Investor dashboard (/marketplace/investor)
├── Dostupné příležitosti: karta s fotkami, ROI, dealer rating, stav financování, tlačítko "Investovat"
├── Investování: modal s výběrem částky (min 10k), výpočet podílu, pokyny k platbě (var. symbol)
├── Víc investorů na jedno auto — výnos poměrově podle vkladu
├── Portfolio: aktivní investice (stav, fotky opravy), dokončené (výnos, ROI)
├── Statistiky: celkem investováno, vyděláno, průměrné ROI, peníze v oběhu
└── Výplata: po prodeji finální kalkulace, výplata na účet, stav "Vyplaceno"

H4. BackOffice správa (/admin/marketplace)
├── Schvalování žádostí (dealeři, investoři)
├── Schvalování investičních příležitostí
├── Potvrzení příchozích plateb od investorů
├── Správa probíhajících flipů
├── Finální kalkulace po prodeji, výplata podílů
└── Přehled: celkový objem, aktivní flipy, průměrné ROI

H5. Právní framework
├── Konzultace s právníkem (ČNB regulace?)
├── Neslibovat konkrétní výnosy — "očekávaný", "odhadovaný"
├── Podmínky investování + disclaimer o riziku
├── Investiční smlouva mezi investorem a Carmakler s.r.o.
└── KYC dokumenty šifrovat (GDPR)
```

---

## DOPORUČENÉ POŘADÍ IMPLEMENTACE

```
SPRINT 1 (teď):  TASK-015      — PWA setup + layout + dashboard + offline infrastruktura
SPRINT 2:        TASK-016      — Nabrat auto (7-krokový flow) + post-submission + editace
SPRINT 3:        TASK-017+018  — Smlouvy + AI asistent
SPRINT 4:        C1-C3         — Provizní systém (5% min 25k, výpočty, výplaty)
SPRINT 5:        B1-B5         — Admin panel komplet
SPRINT 6:        TASK-019      — Inzertní platforma (registrace, podání inzerátu, hlídací pes)
SPRINT 7:        F1-F2         — Emaily (Resend) + VIN dekodér integrace
SPRINT 8:        TASK-020      — Eshop autodíly + PWA pro vrakoviště
SPRINT 9:        G1-G3         — Trust Score, Live viewers, AI search
SPRINT 10:       F3-F5         — Mapy.cz, export na portály, push notifikace
SPRINT 11:       G4-G6         — Chat, hlídač ceny, rezervace prohlídek
SPRINT 12:       TASK-021      — Marketplace (investiční platforma, právní příprava)
```

---

## DATABÁZE — CHYBĚJÍCÍ MODELY

K existujícím (User, Region, Vehicle, VehicleImage, VehicleChangeLog) přidat:

```
Makléřská síť (TASK-015–018):
├── Commission          — provize z prodeje (5% min 25k)
├── Payout              — výplata makléři
├── Contract            — smlouvy (zprostředkovatelská, předávací protokol)
├── Notification        — notifikace makléřů
├── AiConversation      — chat historie s AI asistentem
└── SellerContact       — CRM kontakty prodejců

Inzertní platforma (TASK-019):
├── Listing             — inzerát (standalone nebo propojený s Vehicle)
├── ListingImage        — fotky inzerátu
├── Inquiry             — dotazy na inzerát
└── Watchdog            — hlídací pes (uložené filtry + notifikace)

Eshop autodíly (TASK-020):
├── Part                — autodíl (použitý/nový/aftermarket)
├── PartImage           — fotky dílu
├── Order               — objednávka
└── OrderItem           — položka objednávky

Marketplace (TASK-021):
├── FlipOpportunity     — investiční příležitost (nákup+oprava+prodej)
└── Investment          — investice do příležitosti (investor+částka+podíl)

Rozšíření User role:
├── ADVERTISER          — inzerent (soukromý/autobazar/dealer)
├── BUYER               — registrovaný kupující
├── PARTS_SUPPLIER      — dodavatel dílů (vrakoviště)
├── INVESTOR            — ověřený investor (marketplace)
└── VERIFIED_DEALER     — ověřený dealer (marketplace)
```

---

## DEPLOYMENT PLAN

```
DEV:      localhost:3000 (SQLite) ← TEĎ JSME TADY
STAGING:  carmakler-staging.vercel.app (PostgreSQL Neon)
PROD:     carmakler.cz (PostgreSQL Neon, custom doména)

Routy (vše pod jednou Next.js appkou):
├── carmakler.cz/              → Veřejný web (katalog, makléři, landing)
├── carmakler.cz/app/          → PWA pro makléře
├── carmakler.cz/parts/        → PWA pro dodavatele dílů
├── carmakler.cz/inzerat/      → Inzertní platforma (podání inzerátu)
├── carmakler.cz/moje-inzeraty/→ Portál inzerenta
├── carmakler.cz/dily/         → Eshop autodíly
├── carmakler.cz/marketplace/  → Marketplace (VIP investice)
├── carmakler.cz/admin/        → BackOffice admin panel
└── carmakler.cz/api/          → API routes
```

---

*Kompletní specifikace jednotlivých modulů viz TASK-QUEUE.md (TASK-015 až TASK-021)*
*Aktualizováno: 21.3.2026*
