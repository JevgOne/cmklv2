# Brainstorm: Killer Features pro CarMarketplace

**Datum:** 2026-04-27
**Autor:** Planovac (agent team)
**Kontext:** Marketplace VIP rebrand → CarMarketplace. Musi byt "klenot" platformy, TOP kvalita, unikatni na ceskem trhu.

---

## COMPETITIVE LANDSCAPE

### Primo konkurenti (car investment/flipping)

| Platforma | Zeme | Model | Klicovy insight |
|-----------|------|-------|-----------------|
| **TheCarCrowd** | UK | Fractional ownership syndicatu klasickych aut. Od 2000 GBP. 40+ aut, 6000 clenu. 12.6% prumerny rocni vynas. | Syndikaty s hlasovacim pravem (kdy prodat). Data analytics 10 let trendu. Sprava (pojisteni, uskladneni) included. |
| **Rally** | US | Fractional shares od $20. IPO-style auctions. Sekundarni trh. | App-first, Robinhood-like UX. Gamifikace. Nizky prah vstupu. "Video game" pocit investovani. |
| **aShareX + TheCarCrowd** | US+UK | Frakcionalni aukce. Ferrari shares od $2,500. | Aukce frakci = napeti + engagement. Democratizace luxusu. |
| **MCQ Markets** | US | Frakcionalni vlastnictvi luxury aut (Lamborghini, Ferrari, LFA). | Ultra-premium positioning. |
| **Upshift** | US | Fractional car ownership (uzivani, ne investice). 30% mesicni rust. 20x CAC/LTV. | Sdilene vlastnictvi s moznosti pouzivani = jiny segment. |

### Aukce / Marketplace (inspirace UX)

| Platforma | Klicovy insight |
|-----------|-----------------|
| **Bring a Trailer** | 1.1M useru, 500k bidderu. KOMENTAROVA KOMUNITA = vetting, duvera, engagement. Sniping protection (2min prodlouzeni). Activity Feed s push notifikacemi. |
| **Cars & Bids** | Nulovy seller fee, 4.5% buyer fee (max $4,500). Chat support. Minimalisticky UX. Niche: late-model enthusiast cars. |
| **ACV Auctions** | B2B dealer platform. 22,000 dealeru, $9B GMV. 20-min live aukce. AI inspekce motoru. Standardizovane condition reporty. |

### Fintech inspirace (UX/gamifikace)

| Platforma | Klicovy insight |
|-----------|-----------------|
| **Robinhood** | Benchmark pro investment UX. Onboarding jako "video game". Real-time feedback. Cisty vizual. |
| **Revolut** | Color-coded kategorie. Smooth animace. Points leaderboard. Tydeni cash prize raffle. |
| **Fundrise** | Real-estate crowdfunding. Dashboard: account value, net contribution, net return, portfolio breakdown. Forecasted earnings calculator. |
| **Bricksave** | RE crowdfunding. Live project updates. Real-time portfolio tracking. Transparent reporting. |

### Nastroje pro flippery

| Platforma | Klicovy insight |
|-----------|-----------------|
| **Flipify** | Alerty na nove inzeraty (FB Marketplace, Craigslist) do sekund. Watchlisty s filtry. Cloud bots. $5/mes. |
| **Brego** | AI valuace aut s 99% presnosti. 120+ features na vozidlo. Market analytics pro dealery. |

---

## KILLER FEATURES — 20 "BOMBA" NÁPADU

### Kategorie A: INVESTOR EXPERIENCE (pritalit investory)

#### 1. Live Portfolio Dashboard (inspirace: Revolut + Fundrise)
- **Real-time** hodnota portfolia s animovanym grafem
- Breakdown: investovano / aktualni hodnota / realizovany zisk / ocekavany zisk
- "Unrealized gains" u aktivnich flipu (na zaklade progress baru opravy + trzniho odhadu)
- Timeline vsech transakci (investice → platba → zisk)
- **Proc je to bomba:** Zadna ceska platforma nema Revolut-level investment dashboard pro auta

#### 2. ROI Tracker & Analytics
- Historicky ROI po kazdem flipu (graf)
- Porovnani s benchmarkem (prumerny ROI platformy, S&P 500, sporici ucet)
- Projekce budouciho zisku na zaklade aktualnich investic
- Export do CSV/PDF pro danove ucely
- **Proc je to bomba:** Investori milujou data. Toto je killer retention feature.

#### 3. Deal Score (AI-powered)
- Kazda prilezitost dostane skore 1-100 na zaklade:
  - Historickych dat (jak se podobna auta prodavala)
  - Margin of safety (rozdil mezi nakupni cenou a trzni hodnotou)
  - Dealer track record (uspesnost predchozich flipu)
  - Market trend (roste/klesa poptavka po tomto modelu)
- Vizualni indikator: zelena/zluta/cervena
- **Proc je to bomba:** AI deal scoring neexistuje v CR. Snizuje strach z investovani.

#### 4. Auto-Invest (pasivni investovani)
- Investor nastavi: max investice na flip, min Deal Score, preferovane znacky/segmenty
- System automaticky investuje kdyz nove deals splni kriteria
- "Set and forget" — jako Robinhood recurring investments
- **Proc je to bomba:** Snizuje treni. Investor nemusi kontrolovat platformu denne.

#### 5. Investment Tiers / Levels
- Bronze (1-3 flipy) → Silver (4-10) → Gold (11-25) → Platinum (25+)
- Vyssi tier = prioritni pristup k novym dealum, nizsi fee, exkluzivni deals
- Vizualni badge v profilu
- **Proc je to bomba:** Gamifikace + retence + motivace investovat vic.

### Kategorie B: DEALER/REALIZÁTOR EXPERIENCE

#### 6. Smart Deal Calculator s AI Price Prediction
- Dealer zada VIN nebo znacku/model/rok/km
- AI predikce: trzni cena, optimalni prodejni cena, ocekavany cas prodeje
- Na zaklade vlastnich historickych dat + trzni data (jen vlastni data, ZADNY scraping)
- **Proc je to bomba:** Dealer vi presne kolik muze vydelat PRED nakupem auta.

#### 7. Dealer Reputation System
- Hvezdickove hodnoceni na zaklade: uspesnost flipu, dodrzovani casoveho planu, ROI pro investory
- Verejny profil s historii flipu
- "Top Dealer" badge pro nejlepsi realizatory
- **Proc je to bomba:** Buduje duveru investoru. Motivuje dealery k lepsimu vysledku.

#### 8. Flip Progress Tracker (real-time)
- Vizualni timeline s milniky: Nakup → Preprava → Oprava (%) → Foceni → Inzerce → Prodej
- Dealer nahraje fotky z opravy → investor vidi progress
- Push notifikace investorum pri kazdem milniku
- **Proc je to bomba:** Transparentnost = duvera. Investor vi presne co se deje s jeho penezi.

#### 9. Repair Cost Estimator
- Na zaklade fotky/popisu AI odhadne naklady na opravu
- Databaze typickych oprav pro dane modely
- Pomaha dealerovi presneji kalkulovat a investorovi overit realnost kalkulace
- **Proc je to bomba:** Snizuje riziko spatnych kalkulaci.

### Kategorie C: COMMUNITY & SOCIAL

#### 10. Deal Discussion / Comment Section (inspirace: Bring a Trailer)
- Kazdy flip ma diskuzi kde investori mohou klast otazky dealerovi
- Komunita pomaha vettovat dealy (zkuseni investori radi novackum)
- Expert komentare od mechaniku/odborníku
- **Proc je to bomba:** BaT's comment section je HLAVNI duvod jejich uspechu. Social proof + engagement.

#### 11. Investor Leaderboard
- Top investori podle: celkovy ROI, pocet flipu, celkovy zisk
- Mesicni/rocni zebricek
- Anonymizovane (prezdivky) pro soukromi
- **Proc je to bomba:** Kompetitivni prvek. Motivace investovat vic a chytreji.

#### 12. Referral Program s Real Rewards
- Investor pozve kamarada → oba dostanou bonus k prvni investici (napr. 500 Kc kredit)
- Dealer pozve dealera → bonus za prvni uspesny flip
- Viralni smycka
- **Proc je to bomba:** Organicky rust. Nizke CAC.

### Kategorie D: PLATFORM & TECH

#### 13. Live Auction Countdown (inspirace: BaT + ACV)
- Nove dealy se "oteviraji" v planovanych casech (napr. kazde pondeli 10:00)
- Countdown timer na homepage
- Push notifikace pred startem
- "First come, first served" pro limitovane investicni sloty
- **Proc je to bomba:** Urgency + FOMO = vyssi conversion. Rutinni navstevnost.

#### 14. Sjednoceny Deal Detail s Tabs
- Jeden URL pro deal: `/marketplace/deals/[id]`
- Tabs: Prehled | Financni kalkulace | Fotogalerie | Oprava (progress) | Diskuze | Investori
- Role-based viditelnost (investor vidi sve, dealer vidi vse)
- **Proc je to bomba:** Cistsi UX nez momentalni flat page. Snadnejsi orientace.

#### 15. PWA pro Investory (mobile-first)
- Offline pristup k portfoliu
- Push notifikace (novy deal, zmena stavu, vyplata)
- Quick invest z mobilu (1-tap)
- Widget na home screen s aktualni hodnotou portfolia
- **Proc je to bomba:** 80%+ uzivatelu prijde z mobilu. PWA = app-like experience bez App Store.

#### 16. Smart Notifications Engine
- Personalizovane notifikace na zaklade investicniho profilu:
  - "Novy deal ve vasem oblíbenem segmentu (Skoda Octavia)"
  - "Vas flip byl prodan! Zisk: 28,500 Kc"
  - "Oprava flipu X dokoncena — fotky z opravy"
  - "Novy rekordni ROI na platforme: 34%"
- Kanaly: in-app, push, email (preference)
- **Proc je to bomba:** Engagement driver #1.

### Kategorie E: FINANCNI & BUSINESS FEATURES

#### 17. Escrow Payment System
- Investice jde na escrow ucet (Carmakler nebo Stripe)
- Uvolneni az po splneni podminek (schvaleni, nakup auta)
- Automaticka distribuce zisku po prodeji
- **Proc je to bomba:** Bezpecnost. Investor vi ze penize jsou v bezpeci do splneni podminek.

#### 18. Portfolio Diversification Advisor
- AI doporucuje diverzifikaci: "Mate 80% v Skodach. Zvazili jste VW nebo BMW?"
- Risk score portfolia
- Doporuceni na zaklade trzních trendu
- **Proc je to bomba:** Unikatni. Ukazuje ze platforma se stara o investory.

#### 19. Tax Report Generator
- Automaticky generuje danovy prehled za rok
- Format kompatibilni s ceskym danovym priznanim
- Export PDF/CSV
- **Proc je to bomba:** Prakticky uzitecne. Snizuje administrativni zatez investora.

#### 20. White-Label / SaaS Potential
- CarMarketplace technologie jako SaaS pro jine trhy (nemovitosti, luxury goods)
- Podobne jako TheCarCrowd ktery licencuje svou platformu
- **Proc je to bomba:** Dlouhodobe — multiplier na revenue. Ale az po overeni produktu.

---

## BUSINESS MODEL — NOVY MODEL (POTVRZENO 2026-04-27)

### Zakladni princip:

1. **Carmakler** = **5% z PRODEJNI CENY vozu** (fixni, vzdy, nepodleha vyjednavani)
2. **Zbytek zisku** = **vyjednavani dealer ↔ investor** (offer/counter-offer)
3. Kazdy deal muze mit **JINY split** — neni zadny fixni pomer

### Vyjednavaci flow (Offer/Counter-Offer):

```
DEALER vytvori deal → navrh: "Chci 50% ze zisku"
                         ↓
INVESTOR vidi navrh → bud SCHVALI (50/50)
                    → nebo posle PROTINABIDKU: "Nabizim ti 40%"
                         ↓
DEALER vidi protinabidku → bud SCHVALI (40/60 ve prospech investora)
                        → nebo posle dalsi nabidku: "45%?"
                         ↓
... opakuje se dokud SHODA nebo TIMEOUT/ODMÍTNUTI
```

### Priklad kalkulace:

| Polozka | Castka |
|---------|--------|
| Nakup auta | 300,000 Kc |
| Opravy | 50,000 Kc |
| **Prodejni cena** | **450,000 Kc** |
| Provize Carmakler (5% z 450,000) | **22,500 Kc** |
| Cisty zisk k rozdeleni | **77,500 Kc** |

| Scenar | Dealer navrhl | Investor odpovedel | Vysledek: Dealer | Vysledek: Investor |
|--------|--------------|--------------------|-----------------|--------------------|
| A | 50/50 | Schvalil | 38,750 Kc | 38,750 Kc |
| B | 50/50 | Protinabidka 40/60 | 31,000 Kc | 46,500 Kc |
| C | 60/40 | Protinabidka 45/55 → Dealer schvalil | 34,875 Kc | 42,625 Kc |

### Dalsi priklady (ruzne dealy, ruzne splity):

| Auto | Nakup | Oprava | Prodej | CM 5% | Zisk | Deal split | Dealer | Investor |
|------|-------|--------|--------|-------|------|------------|--------|----------|
| Skoda Octavia | 180,000 | 45,000 | 299,000 | 14,950 | 59,050 | 50/50 | 29,525 | 29,525 |
| VW Golf VII | 165,000 | 30,000 | 259,000 | 12,950 | 51,050 | 40/60 | 20,420 | 30,630 |
| BMW 320d F30 | 220,000 | 65,000 | 389,000 | 19,450 | 84,550 | 45/55 | 38,048 | 46,503 |

### Implementacni dopady:

| Co je treba | Detail |
|-------------|--------|
| **DB schema** | Novy model `DealNegotiation` — offers, counter-offers, status (PENDING/ACCEPTED/REJECTED/EXPIRED), timestamps |
| **ProfitCalculator** | Dynamicky — dealer zadava svuj navrh %, investor vidi kalkulaci a muze menit |
| **Deal Detail page** | Novy tab/sekce "Vyjednavani" s historiou nabidek |
| **API** | Nove endpointy: POST offer, POST counter-offer, POST accept, POST reject |
| **Notifikace** | Push/email pri kazde nabidce/protinabidce |
| **Payout API** | Musi cist dohodnuty split z DealNegotiation (ne hardcoded 40/40/20) |
| **Landing page texty** | Aktualizovat — misto "40/40/20" popisat vyjednavaci model |
| **FAQ** | Aktualizovat odpoved "Jak se deli zisk?" |
| **Timeout logika** | Co kdyz se nedohodnou? Automaticky expiry po X dnech? Default split? |

### OTEVRENE OTAZKY:

1. **Timeout** — co kdyz se dealer a investor nedohodnou? Automaticky fallback 50/50? Nebo se deal zrusi?
2. **Min/Max split** — muze dealer navrhnout 90/10? Nebo je nejaký limit (napr. max 60/40)?
3. **Kdy se vyjednava** — pred investici (investor vi dopred podminky) nebo az po prodeji?
4. **Vickrat investorou** — kdyz je vic investoru v jednom dealu, vyjednava kazdy zvlast s dealerem?
5. **Binding** — je schvaleny split pravne zavazny? Smlouva?

### Dalsi monetizace (budouci faze):

| Feature | Revenue Model | Odhad |
|---------|--------------|-------|
| **Premium Analytics** | Mesicni subscription pro investory (299-999 Kc/mes) | Extra data, AI deal scoring, auto-invest |
| **Featured Deals** | Dealer plati za prioritni zobrazeni | Jednorazovy poplatek za bump |
| **Urgent Funding** | Vyssi fee za rychlejsi financovani (24h vs 7 dni) | +1-2% z objemu |
| **CEBIA/History Reports** | Integrace CEBIA s markup | 50-100 Kc/report margin |
| **Insurance Partnership** | Provize z pojisteni flipovanych aut | Affiliate fee |
| **Education / Masterclass** | Online kurzy o investovani do aut | 1,999-4,999 Kc/kurz |

---

## PRIORITIZACE — CO IMPLEMENTOVAT PRVNE

### MUST HAVE (MVP+):
1. **P1:** Zmena provizniho modelu na 5% + OFFER/COUNTER-OFFER vyjednavani (KRITICKE — novy business model)
2. **F8:** Flip Progress Tracker (transparentnost = duvera)
3. **F16:** Smart Notifications (engagement + vyjednavaci notifikace)
4. **F1:** Live Portfolio Dashboard (investor retention)
5. **F3:** Deal Score (AI) — i zakladni verze

### SHOULD HAVE (v1.1):
6. **F7:** Dealer Reputation System
7. **F10:** Deal Discussion / Comment Section
8. **F14:** Sjednoceny Deal Detail s Tabs
9. **F2:** ROI Tracker & Analytics
10. **F15:** PWA pro investory

### NICE TO HAVE (v2.0):
11. **F4:** Auto-Invest
12. **F5:** Investment Tiers
13. **F6:** Smart Deal Calculator s AI
14. **F13:** Live Auction Countdown
15. **F11:** Investor Leaderboard

### FUTURE (v3.0+):
16. **F17:** Escrow Payment System (Stripe)
17. **F18:** Portfolio Diversification Advisor
18. **F19:** Tax Report Generator
19. **F12:** Referral Program
20. **F20:** White-Label SaaS

---

## SOUHRN: CO DELA CARMARKETPLACE UNIKATNI

| Dimenze | Sauto/Bazos/TipCars | CarMarketplace |
|---------|---------------------|----------------|
| **Model** | Inzerce (kupujici hledá) | Investment platform (investori financuji flipy) |
| **Riziko kupujiciho** | Kupujici nese vsechno riziko | Auto na firmu Carmakler. Escrow. Garance. |
| **Transparentnost** | Zadna (prodejce muze lhat) | Real-time progress, fotky z opravy, AI scoring |
| **Komunita** | Zadna | Diskuze, leaderboard, reputace dealeru |
| **Data** | Zadna analytics | Portfolio dashboard, ROI tracking, AI predikce |
| **Mobile** | Zastaraly web | PWA mobile-first, push notifikace |
| **Gamifikace** | Zadna | Tiers, badges, leaderboard, countdown |

**Jednou vetou:** CarMarketplace je "Revolut pro investovani do aut" — Robinhood-level UX, BaT-level komunita, Fundrise-level portfolio tracking. Nic takoveho v CR (ani v EU mimo UK) neexistuje.
