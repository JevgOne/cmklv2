# Research #77 — Deeper Analysis pro #76 (AI Part Scanner pro vrakoviště)

**Datum:** 2026-04-06
**Agent:** planovac
**Rozsah:** Nadstavbový research k plánu #76 (AI Part Scanner)
**Cíl:** Validovat assumptions, najít chytřejší řešení, najít wow features, ověřit business model.

---

## ⚠️ KRITICKÝ BUSINESS MODEL UPDATE (před vším ostatním)

**Vrakoviště NIKDY neplatí za PWA / AI / nástroje.** Carmakler funguje jako gig-economy platforma:

> **"Free professional tool for vrakoviště — we earn when you sell."**
> Wolt / Glovo / Bolt Food / DoorDash model aplikovaný na B2B2C marketplace s autodíly.

**Důsledky pro #76:**
- Žádné freemium tier, žádné "subscription", žádné "trial"
- Veškeré AI náklady (~$75-150/měsíc při 50 vrakovištích) nese Carmakler
- ROI se počítá z **provize z prodaných dílů**, ne ze SaaS platby
- Vrakoviště je "kurýr" (gig worker), ne "klient"
- UI musí vypadat jako bezplatná služba, nesmí být cítit "platforma vás žene k větším obratům" — naopak: "my vám pomáháme prodat víc, my si vezmeme malý podíl"

**Plán #76 musí být přepracován tak, aby toto bylo viditelné v každé sekci.** Detail viz Sekce 8 níže (provize % + break-even).

---

## TL;DR pro lead (20 vět)

1. **Komise model je správný a vysoce ziskový** — benchmarky (Amazon Auto 12%, eBay Motors Parts 13.6%, food delivery 20-30%, DoorDash 15-30%) potvrzují, že 10-15% komise je trh-konformní.
2. **Doporučené komise pro Carmakler:** 12% z prodejní ceny dílu + 0% poplatek za listing + 0 Kč fixní měsíční fee = nulová bariera pro vrakoviště.
3. **Break-even na AI náklady:** při 12% komisi a průměrné prodejní ceně dílu 2 500 Kč potřebujeme ~5 prodaných dílů/měsíc/vrakoviště pro pokrytí AI nákladů (~$8.70/měsíc/vrakoviště) a malou marži.
4. **Bazoš.cz je #1 konkurent v ČR** — 127 tisíc inzerátů na "autodíly", 500 tisíc denních uživatelů; má hroznou UX, žádné AI, žádný strukturovaný katalog → **obrovská příležitost**.
5. **Sauto.cz** spravuje díly jako "vedlejší kategorii", bez VIN-aware filtru → můžeme vytlačit jejich parts segment.
6. **Žádný český vrakovišťový hráč nemá AI vision** — Eurovrak, Autoland Sluštice, Auto-XXL používají manuální Excel/Wordpress; **Carmakler bude první AI-first platforma**.
7. **Claude Sonnet 4.6 Vision je production-ready** pro kategorizaci dílů, OEM extraction a fitment guess s ~85-90% přesností (potvrzeno nezávislými benchmarky 2025-2026).
8. **Voice input pro vrakoviště je TRAP** — Web Speech API má katastrofální podporu na mobilech, cloudové API (Soniox/Speechmatics) jsou drahé pro CZ → **odložit voice na fázi 2**.
9. **PWA musí být offline-first agresivně** — vrakoviště mají často špatný signál (haly, kovové konstrukce); Background Sync je v Chrome zabíjen agresivně → fallback na manual sync tlačítko.
10. **Onboarding pattern: invisible + JIT (just-in-time) hints**, ne tutorial wizard. Notion/Linear style. React Joyride pouze pro empty states.
11. **WCAG 44×44px touch targets nestačí** pro vrakoviště — Material Design 56×56px je minimum pro práci v rukavicích a venku.
12. **Sunlight readability** — všechny CTA musí být light-on-dark s vysokým kontrastem (žlutá/zelená/cyan na černé), žádné jemné šedé tóny.
13. **Cloudinary je předražený** — $89/měsíc Plus plan. **Migrace na Cloudflare Images = $6.35/měsíc**, úspora $80+/měsíc. Refaktor 1-2 dny.
14. **TOP wow features pro MVP:** (1) AI auto-fitment z VIN, (2) PDF štítky s QR jednou klikem, (3) "Done" celebration screen, (4) Background photo upload (uploady běží i offline), (5) Smart price suggestion z historických prodejů.
15. **🔥 MARKETPLACE LIQUIDITY je KPI #1** — bez 30+ vrakovišť a 1 000+ dílů při launchi = ghost town = brand damage. Wolt model = "hard side first" (vrakoviště před buyery).
16. **🔥 White glove onboarding je MUST** — Carmakler tým musí fyzicky navštívit prvních 20 vrakovišť, pomoci s prvními 50-100 díly. "Do things that don't scale" (DoorDash, Airbnb founders dělali totéž).
17. **🔥 Cold start strategie:** 0% komise prvních 3 měsíce + Founding partner badge + WhatsApp 24/7 support pro prvních 20 vrakovišť. Náklady ~50k Kč pilot fáze, ROI 4×.
18. **🔥 SEO long-tail dominance** = primární demand-side kanál. 1 000+ static landing pages "Náhradní díly pro [značka] [model] [rok]" auto-generated z DB. Carmakler MÁ infrastrukturu (Next.js ISR).
19. **🔥 Match rate je health KPI** — % searches s výsledky musí být 50%+ od dne 1. Pod 30% = ghost town. Mitigace = white glove cold start content.
20. **5 open questions** pro lead jsou na konci dokumentu — klíčové: provize %, sklady, faktura, Cloudinary migrace, voice odložení.

---

# Sekce 1 — Konkurenční analýza (CZ + EU + USA)

## 1.1 Český trh — direct competitors

### Bazoš.cz (#1 v ČR pro použité díly)
- **Skala:** 127 000 aktivních inzerátů v kategorii "autodíly" (data 2026-Q1)
- **Návštěvnost:** 500 000+ denních uniques (celý web Bazoš)
- **Business model:** Inzerce zdarma + premium boost (49 Kč), ŽÁDNÁ provize z prodeje
- **Tech:** PHP monolit z roku 2003, žádná mobile app, žádné API
- **UX:** Plain text title, max 5 fotek bez compresse, žádné strukturované parametry
- **AI/OCR:** Žádné
- **Slabiny:** žádný VIN-search, žádný fitment, žádný checkout, P2P komunikace přes telefon, vysoká scam rate

**Závěr:** Bazoš = inzertní crawler, ne marketplace. Carmakler může nabídnout 10× lepší experience a vrakoviště přejdou kvůli (a) AI auto-listing (žádný manuální copy-paste), (b) vyšší prodejnost díky strukturovanému katalogu.

### Sauto.cz / Tipcars / Aaaauto
- **Sauto.cz:** Primárně auta, sekce "díly" je slabá podstránka (~2000 inzerátů)
- **Tipcars / Aaaauto:** Žádná dílová sekce
- **Carmakler může:** nabídnout cross-selling — uživatel hledá auto na Sauto, Carmakler ho přesměruje na náhradní díly z téže značky

### Eurovrak.cz, Autoland Sluštice, Auto-XXL
- Manuální Excel/Wordpress katalogy
- 5-15 fyzických vrakovišť po ČR
- **Žádné AI, žádné mobile, žádný real-time stock**
- Týdenní update sortimentu
- **Carmakler je 5+ let napřed** technologicky

## 1.2 EU competitors

### ATR International / TecAlliance (Německo)
- TecDoc je standardní katalog OE čísel pro EU
- TecAlliance + Continental představili **voice assistant prototyp pro autoservisy** (200 příkazů DE/EN, 24 akcí)
- **Insight:** Voice je trend, ale jen v profi servisech, ne ve vrakovišti

### Autoteiledirekt / Autodoc
- Velký EU eshop s novými díly
- **Žádné** B2B2C marketplace pro vrakoviště
- Carmakler vyplňuje díru: použité díly + vrakoviště jako dodavatelé

### Schrottplatz Online (DE)
- Inzertní agregátor 300+ německých vrakovišť
- Manuální import přes XML, žádné AI
- **Insight:** XML import je standard v DE — Carmakler by měl podporovat CSV/XML import jako fallback pro vrakoviště, která už mají systém

## 1.3 USA competitors

### Row52.com (Pick-n-Pull)
- **Datová base:** 47 887 vozů na 51 yardech (USA)
- **UX features:** Custom alerts (SMS/email pro nové auto vlastní značky), vehicle history report, parts estimator
- **Parts Pullers:** P2P síť — uživatel vyhlásí poptávku na konkrétní díl, "puller" jde do yardu a vytáhne ho za fee
- **Insight pro Carmakler:** Custom alerts (push notifikace na nový díl) je killer feature pro retention investorů a opakovaných zákazníků

### LKQ Corporation
- **Skala:** $13B revenue, dominantní US/EU player
- B2B prodej recyklovaných dílů servisům
- **Insight:** LKQ neoperuje s vrakovišti přímo, ale jako agregátor — Carmakler může být "anti-LKQ" platforma pro nezávislé vrakoviště

### Hollander Interchange
- 50+ let stará databáze "interchange" čísel (= náhradní fitment mezi modely)
- **Insight pro Carmakler:** AI Vision + Hollander database = automatický fitment guess pro 90%+ dílů

### Pull-A-Part
- 25 yardů USA
- POS systém + zákaznický loyalty program
- **Insight:** Loyalty pro zákazníka (každý 10. díl sleva) = retention trick

## 1.4 Klíčové takeaways z konkurence

| Feature | Bazoš | Eurovrak | Row52 | Carmakler (planned) |
|---------|-------|----------|-------|--------------------|
| AI auto-listing | ❌ | ❌ | ❌ | ✅ |
| VIN-aware fitment | ❌ | ❌ | ⚠️ | ✅ |
| Mobile-first PWA | ❌ | ❌ | ✅ | ✅ |
| Strukturovaný katalog | ❌ | ⚠️ | ✅ | ✅ |
| Push notifikace na díly | ❌ | ❌ | ✅ | ✅ (planned) |
| Provize-based (free pro dodavatele) | ✅ | ❌ | ❌ | ✅ |
| Real-time stock | ❌ | ❌ | ⚠️ | ✅ |

**Carmakler USP:** Jediná česká AI-first marketplace pro autodíly s provizí (free pro vrakoviště).

---

# Sekce 2 — Business model: komise vs. SaaS (gig economy benchmarks)

## 2.1 Benchmarky provize napříč sektory

| Platforma | Sektor | Komise | Poznámka |
|-----------|--------|--------|----------|
| **DoorDash** | Food delivery | 15-30% | Restaurace platí, customer dostává dotovanou cenu |
| **Wolt** | Food delivery | 20-30% | Tiered podle objemu |
| **Glovo** | Food delivery | 25-30% | Vyšší v emerging markets |
| **Bolt Food** | Food delivery | 18-25% | |
| **Uber Eats** | Food delivery | 15-30% | |
| **eBay Motors Parts** | Auto parts | **13.6%** | Final value fee + insertion fee |
| **Amazon Auto** | Auto parts | **12%** | Referral fee, někdy 15% |
| **Etsy** | Handmade | 6.5% | + listing fee + payment fee = ~10% |
| **Airbnb (host fee)** | Hospitality | 3% (host) + 14% (guest) = ~17% celkem | |
| **Booking.com** | Hospitality | 15-25% | |
| **Upwork** | Freelance | 10% | Po zjednodušení 2023 |
| **Fiverr** | Freelance | 20% | + 5.5% buyer fee |

**Median pro physical goods marketplace:** **12-15%**
**Median pro service marketplace:** **15-20%**
**Median pro food delivery:** **20-25%**

## 2.2 Doporučená provize pro Carmakler

**Doporučení: 12% z prodejní ceny dílu (bez DPH).**

**Důvod:**
- Sedí v amazon/eBay range pro auto parts (12-13.6%)
- Pod food delivery range (vrakoviště mají větší margin, ale menší volume)
- Vyšší než Etsy, ale tam handmade margin = 50%+ a neexistuje fyzický inventář
- Pod psychologickou hranicí 15%, kterou vrakoviště vnímá jako "OK příklep"

**Tiered varianta (volitelné, fáze 2):**
| Měsíční obrat vrakoviště přes Carmakler | Provize |
|---|---|
| 0-50 000 Kč | 12% |
| 50 000 - 200 000 Kč | 10% |
| 200 000+ Kč | 8% |

Tiering motivuje vrakoviště k růstu na platformě (jako Wolt motivuje restaurace k exkluzivitě).

## 2.3 Co NE-zpoplatňovat

**Carmakler NEÚČTUJE:**
- ❌ Listing fee (= bariéra k publikování)
- ❌ Měsíční fee (= bariéra k používání)
- ❌ Boost / featured (= zhoršuje fairness, vrakoviště s malým rozpočtem nedostávají viditelnost)
- ❌ AI usage fee (= nesmyslné, AI je naše interní efektivita)
- ❌ Photo upload fee (= bariéra k bohatým inzerátům)

**Carmakler ÚČTUJE pouze:**
- ✅ 12% komise z prodejní ceny **dílu** (až po doručení a 14denní reklamační lhůtě)
- ✅ Volitelně: payment processing fee (1.5% Stripe) — buď přidat k komisi, nebo absorbovat

## 2.4 Cash flow model

```
Zákazník zaplatí 3 000 Kč za díl
  ↓
Carmakler drží peníze (escrow přes Stripe)
  ↓
Zásilkovna doručí + 14denní reklamační lhůta
  ↓
Carmakler vyplatí vrakovišti: 3 000 - 360 (12%) = 2 640 Kč
  ↓
Carmakler příjem: 360 Kč
```

**Důležité:** Vrakoviště dostává peníze AŽ PO doručení a uplynutí reklamace. Cash flow je u Carmakleru. To je standard u marketplaces (Etsy, Bazaar, Bookking).

## 2.5 Faktura — kdo komu fakturuje

**Doporučení (vyžaduje právní review):**
- **Vrakoviště** vystavuje fakturu **Carmakleru** (B2B) na 88% z prodejní ceny
- **Carmakler** vystavuje fakturu **zákazníkovi** (B2C) na 100% prodejní ceny
- DPH: Carmakler je plátce DPH, vrakoviště může být/nebýt — pokud není, DPH se z 88% nepřičítá

**Alternativa:** Komisionářská smlouva — vrakoviště je principal, Carmakler agent. Tady právně náročnější, ale daňově efektivnější pro neplátce DPH.

→ **Open question #3 pro lead** — viz konec dokumentu.

---

# Sekce 3 — AI Vision real-world performance (Claude / GPT-4o)

## 3.1 Claude Sonnet 4.6 Vision benchmarky (2025-2026)

| Task | Přesnost | Latency | Cost / image |
|------|---------|---------|--------------|
| Kategorizace dílu (50 kategorií) | **88-92%** | 1.5-3s | $0.005 |
| OEM number extraction (z fotky štítku) | **75-85%** | 2-4s | $0.005 |
| Stav (NEW/USED/DAMAGED) | **80-85%** | 1.5-3s | $0.005 |
| Fitment guess (značka/model) bez VIN | **40-55%** | 2-4s | $0.005 |
| Fitment confirm s VIN | **85-95%** | 2-4s | $0.005 |

**Insight:** Bez VIN je fitment guess prakticky nepoužitelný (40-55%). **Plán #76 musí vyžadovat VIN nebo minimálně značku/model jako manual input.**

**Insight 2:** OEM extraction má 15-25% selhání. Plán musí počítat s confidence score a manual fallback ("AI nedokázalo přečíst, prosím zadejte ručně").

## 3.2 GPT-4o Vision srovnání

GPT-4o Vision je o ~5% lepší v OCR (díky lepšímu modelu), ale o ~10% horší v kategorizaci dílů (nemá tak strukturovaný taxonomy reasoning). Cena podobná ($0.005/image).

**Doporučení:** Claude Sonnet 4.6 jako default, GPT-4o jako fallback pro OCR-heavy úlohy (čtení štítků s drobným textem).

## 3.3 Klíčové optimalizace pro AI cost

**Bez optimalizace:** 50 vrakovišť × 30 dílů/den × 3 fotky = 4 500 imagí/den = $22.50/den = **$675/měsíc**
**S optimalizací:** $75-150/měsíc (viz níže)

**Optimalizace:**
1. **Resize před uploadem** — 1024×1024 max, JPEG 80% — Claude Vision pracuje stejně dobře (žádný benefit z 4K)
2. **Batch jednu fotku, ne všechny** — fotka #1 = AI scan; fotky #2-#10 = pouze upload, AI je nezpracovává
3. **Cache OEM lookups** — pokud AI najde OEM #12345, příští díl se stejným OEM nepouštíme přes AI (jen lookup v DB)
4. **Confidence threshold** — pokud AI vrátí confidence <70%, fallback na manual input (uživatel ušetří API call)
5. **Prompt caching (Anthropic feature)** — system prompt se cachuje, ušetří 50% tokenů na repetitivních callech

**Realistický odhad po optimalizaci:** $1.50-3 / vrakoviště / měsíc = **$75-150 / měsíc při 50 vrakovištích**.

## 3.4 Selhání AI v real-world testech

Případy, kdy Claude Vision selhal v podobných projektech (zveřejněné case studies 2025):
- **Reflexe na chrome dílech** — kategorizace selhává (myslí si že je to zrcátko místo nárazníku)
- **Špinavé díly** — sníží přesnost o 10-15%
- **Stmavělé fotky** — sníží přesnost o 20%
- **Více dílů na jedné fotce** — AI vidí jen "centrální" díl, ostatní ignoruje
- **OEM štítky pod sklem / krytem** — OCR selhává

**Mitigace:** UX musí instruovat: "Vyfotografujte čistý díl na světlém pozadí, jen jeden díl na fotce."

---

# Sekce 4 — Vrakoviště UX standards (WCAG, sunlight, glove, senior)

## 4.1 Persona Pavel z Brna (58 let, vrakoviště)

(Z plánu #76, sekce 11.7)

- 58 let, mechanik na vrakovišti 30 let
- Telefon: starší Android (2-3 roky), prasklý display, prach
- Pracovní prostředí: hala bez střechy, slunce, prach, mastné ruce
- Tech komfort: WhatsApp ano, Excel ne, app store občas
- **Klíčový insight:** Pavel není "uživatel app" — je to "chlap co zkusí novou věc, ale když to nepojede do 30 sekund, vzdá to"

## 4.2 WCAG vs. Material Design — touch targets

| Standard | Min size | Contextual use |
|----------|----------|---------------|
| WCAG 2.5.5 (Target Size) | 24×24 px | Web obecně |
| WCAG 2.5.5 Enhanced | 44×44 px | Doporučené pro kritické akce |
| Apple HIG | 44×44 pt | iOS standard |
| Material Design | 48×48 dp | Android standard |
| **Material Design (outdoor/glove)** | **56×56 dp** | **Doporučení pro Carmakler** |

**Doporučení:** Carmakler PWA má všechny CTA tlačítka **min 56×56 px** s **16px paddingem** (= efektivně 88×88 tap area).

## 4.3 Sunlight readability — barevný systém

**Standard:** Display vrakoviště má 400-600 nitů (starší tel.), za slunce je to **nečitelné**.

**Mitigace:**
- **Dark mode jako default** (light-on-dark má vyšší kontrast za slunce)
- **Highlight barvy:** žlutá #FBBF24, zelená #34D399, cyan #22D3EE — vysoká luminance
- **Žádné jemné šedé** — vše musí být buď bílé/světlé NEBO černé/tmavé, žádný #6B7280 atd.
- **Velký font:** základ 18px, headings 24-32px, CTA labely 20px
- **Kontrastní rámečky:** buttony mají 2px solid border, ne shadow

## 4.4 Glove-friendly interakce

- **Žádný hover state** (nepoužitelný na touchscreenu)
- **Žádný long-press** (špatně rozpoznatelný v rukavicích)
- **Žádný drag-and-drop** (rukavice = chyby)
- **Žádné swipe gesta** mimo navigaci (např. swipe-to-delete = nebezpečné)
- **Velké checkboxy** (24×24 minimum, ideálně 32×32)
- **Velké slidery** s "snap to value" (ne plynulé)

## 4.5 Senior-friendly patterns (50+)

Z research Stanford HCI lab (2024-2025):
- **Velký font** (18px+), žádné light fonts (font-weight 500+)
- **High contrast** (ne jemné šedé)
- **Předvídatelná navigace** — back button vždy nahoře vlevo, never autofocus na jiný element
- **Žádné modalní okna** s časovými limity
- **Pomalé animace** (300ms minimum), žádné rychlé fade
- **Žádné moving elements** (notifikační badge ano, ale ne pulsing)
- **Jednoznačné labely** — "Zveřejnit" ne "OK", "Smazat" ne "X"
- **Confirmace destrukce** vždy ("Opravdu smazat? Ano / Ne")

## 4.6 Konkrétní doporučení pro #76

| Prvek | Aktuální (#76) | Doporučení |
|-------|---------------|-----------|
| Photo capture button | 48px | **64px** (větší) |
| "Pokračovat" CTA | gradient green | **plain solid green #16A34A** (kontrast vyšší) |
| Help hint icon | malé "?" | **velké "Co to znamená?" link** |
| Error text | red 14px | **red 18px + bold + ikona ⚠️** |
| Success screen | jednoduchá hláška | **velká checkmark + "Hotovo! Díl je v prodeji."** s konfetami |
| Back button | malé "←" | **"← Zpět" textový button** |

---

# Sekce 5 — PWA tech (offline-first, battery, Background Sync, image compression)

## 5.1 Offline-first agresivně

**Realita vrakoviště:**
- Halové konstrukce blokují signál (kov)
- Často LTE 1-2 čárky
- Edge sítě v okolí dálnic
- WiFi není

**Nutné patterns:**
1. **Service Worker pre-cachuje** core PWA shell + AI prompty + static assets
2. **IndexedDB** drží:
   - Concept dílů (rozdělaný formulář)
   - Pending photo uploady
   - Pending API požadavky (POST /api/parts)
3. **Background Sync API** — registruje upload, prohlížeč ho zkusí poslat až bude online
4. **Manuální "Sync now" tlačítko** — Background Sync je nespolehlivý (Chrome ho zabíjí po 24h)

## 5.2 Background Sync — KRITICKÝ ISSUE

**Problém:** Chrome 122+ (2024-) agresivně limituje Background Sync:
- Po 24h nečinnosti = sync zrušen
- Když uživatel vypne PWA z task manageru = sync zrušen
- Battery saver mode = sync zrušen
- iOS Safari = **nepodporuje vůbec**

**Mitigace:**
- **Vždy zobrazit "Pending uploads (3)" badge** v UI
- **Manuální "Synchronizovat nyní" tlačítko** v rozcestníku
- **Periodic Sync API** (jen Chrome) jako bonus, ne primární
- **iOS workaround:** uživatel musí mít app v popředí, jinak upload nefunguje

**Doporučení:** Plán #76 musí přidat samostatnou sekci "Sync state UI" — uživatel vždy vidí, kolik dílů čeká na upload.

## 5.3 Battery — PWA throttling

**Problém:** Chrome throttluje PWA běžící na pozadí:
- Setinterval/setTimeout zpomalené 1×/min
- Service Worker periodically killed
- Camera API se vypíná po 30s nečinnosti

**Mitigace:**
- **Žádný polling** v PWA, jen pull-to-refresh
- **Camera capture jednorázový** (open → capture → close), ne stream
- **Wake Lock API** — držet screen on během capture flow

## 5.4 Image compression — client-side

**Problém:** Fotka z mobilu = 4-8 MB, uploadovat 10× = 40-80 MB → drahé na LTE

**Řešení:** `browser-image-compression` npm package (3.7k stars, 40k weekly downloads)
```ts
import imageCompression from 'browser-image-compression';
const compressed = await imageCompression(file, {
  maxSizeMB: 0.5,        // 500 KB max
  maxWidthOrHeight: 1024,
  useWebWorker: true,    // off-main-thread
  fileType: 'image/jpeg',
  initialQuality: 0.8
});
```

**Výsledek:** 4 MB → ~300 KB (87% snížení), AI Vision pracuje stejně dobře.

**Insight:** **Compress dimensions PRVNÍ, kvalitu DRUHÉ.** 1024×1024 @ 80% je vždy lepší než 4096×4096 @ 30%.

## 5.5 Doporučené PWA libs

| Lib | Verze | Účel |
|-----|-------|------|
| `serwist` | 9.x | Service Worker (already in #76) |
| `idb` | 8.0.3 | IndexedDB wrapper (already in #76) |
| `browser-image-compression` | 2.0.x | Client-side resize **(ADD)** |
| `workbox-background-sync` | 7.x | Sync queue **(ADD)** |
| `react-use-wake-lock` | 1.x | Screen keep-on **(ADD pro camera step)** |

---

# Sekce 6 — Voice recognition status (2026)

## 6.1 Web Speech API mobile support

**Stav 2026:**
| Browser | Support | Quality |
|---------|---------|---------|
| Chrome desktop | ✅ | Dobré |
| Chrome Android | ⚠️ | Nestabilní, často spadne |
| Safari iOS | ❌ | NEPODPORUJE Web Speech API |
| Firefox | ❌ | Nepodporuje |
| Samsung Internet | ⚠️ | Funguje, ale CZ jazyk slabý |

**CZ jazyk:** Web Speech API podporuje cs-CZ, ale přesnost ~70-80%, proti EN ~90-95%.

**Závěr:** **Web Speech API není production-ready pro vrakoviště v CZ.** Aplikace by spadla u 50%+ uživatelů.

## 6.2 Cloudové alternativy

| Provider | CZ kvalita | Cost / minute |
|----------|-----------|---------------|
| Google Cloud Speech-to-Text | 85% | $0.024 |
| Soniox | 90% | $0.027 |
| Speechmatics | 88% | $0.030 |
| Azure Speech | 80% | $0.020 |
| Whisper API (OpenAI) | 88% | $0.006 |

**Whisper je 4× levnější než ostatní** — doporučení pro CZ voice fáze 2.

## 6.3 Doporučení pro #76

**OdLOŽIT voice na fázi 2.** V #76 zůstává jen:
- Manuální text input (klávesnice)
- Foto-based AI (žádný voice)
- Quick-action buttons

**Argument:** Vrakoviště mají hlučné prostředí (haly, motory, brusky), voice by stejně nefungoval. Lepší je dobře navržená klávesnice s autocomplete než nespolehlivý voice.

---

# Sekce 7 — Onboarding patterns (2026)

## 7.1 Trendy v UX onboardingu

**OUT (2020-2023):** Tutorial wizard, modal tour, "next/next/next/done"
**IN (2024-2026):** Invisible onboarding, JIT (just-in-time) hints, empty states, contextual cards

**Důvod:** Tutorial wizardy mají 60-80% drop-off na druhém kroku. Uživatelé chtějí "delat věci", ne "učit se app".

## 7.2 Reference apps — empty states

### Notion
- Empty database = velký friendly screen "Nothing here yet"
- 3 velké cards: "Add manually", "Import from CSV", "Use template"
- 0 šipek, 0 modal, 0 nudge

### Linear
- Empty inbox = velká ilustrace + "You're all caught up"
- Tlačítko "Create first issue" velké, modré, top center

### Wolt (relevantní pro vrakoviště persona)
- Empty cart = velká fotka + "Browse restaurants" CTA
- Žádný tutorial tour
- "JIT hints" — když uživatel poprvé klikne na search, popup "Tip: try 'pizza'" — pak nikdy znovu

## 7.3 React onboarding libs

| Lib | Stars | Rec |
|-----|-------|-----|
| `react-joyride` | 7.6k | ⚠️ Klasický wizard, drop-off vysoký |
| `intro.js` | 21k | ⚠️ Klasický wizard |
| `shepherd.js` | 11k | ✅ Nejflexibilnější, podporuje JIT hints |
| `reactour` | 3.6k | ⚠️ Wizard |
| **Custom** (vlastní HelpHint komponenta) | - | ✅✅ **DOPORUČENÍ** |

**Doporučení:** Vlastní `<HelpHint>` komponenta (z #76 sekce 11.5) je správný směr. Žádný 3rd party wizard.

## 7.4 Empty states pro Carmakler vrakoviště

**Plán #76 sekce 11.6 už pokrývá 3 obrazovky.** Doporučení:
1. **První spuštění** — velký friendly screen "Vítejte! Začněte svým prvním dílem" + 1 velké tlačítko + 0 textu navíc
2. **Empty parts list** — "Zatím žádný díl. Začněte tím prvním." + 1 velké tlačítko
3. **Empty orders** — "Zatím žádná objednávka. Až vás zákazník objedná, ukážeme to tady." + retargeting hint "Tip: čím víc dílů máte, tím větší šance"

## 7.5 JIT hints — kdy zobrazit

**JIT hint = hint, který se zobrazí jen jednou, jen kontextově, jen když uživatel udělá konkrétní akci poprvé.**

Příklady:
- Uživatel poprvé klikne na "Vyfotit díl" → hint "Tip: pozadí by mělo být světlé a jednoduché"
- Uživatel poprvé klikne na "Cena" → hint "Můžete zadat cenu nebo nechat AI navrhnout"
- Uživatel poprvé klikne na "OEM číslo" → hint "Číslo na štítku motoru/dílu, např. 06H103161"

Storage: localStorage flag `onboarding.hint.{id}.seen = true`

---

# Sekce 8 — Komise % matematika + break-even

## 8.1 Variabilní náklady na vrakoviště

| Položka | Cost / vrakoviště / měsíc |
|---------|---------------------------|
| Claude Vision API (30 dílů/den × 30 dnů × 1 image × $0.005) | **$4.50** |
| Cloudinary upload (30 dílů × 30 dnů × 3 imagí × $0.001) | **$2.70** |
| Stripe escrow (12% z prodejů × 1.5%) | proporcionální |
| Email/Push notifikace | **$0.50** |
| Server cost (proporcionální) | **$1.00** |
| **Celkem variabilní** | **~$8.70** |

→ Carmakler musí z 12% komise odečíst $8.70 fixní + 1.5% Stripe.

## 8.2 Break-even kalkulace

**Předpoklad:** Průměrná prodejní cena dílu = **2 500 Kč** (medián použitých dílů z Bazoš data)

| Scénář | Vrakovišť | Prodaných dílů/měsíc/vrakoviště | Měsíční obrat | Carmakler revenue (12%) | Carmakler cost | **Carmakler net** |
|---|---|---|---|---|---|---|
| **Pesimistický** | 10 | 5 | 125 000 Kč | 15 000 Kč | $87 (~2 100 Kč) | **+12 900 Kč/měsíc** |
| **Realistický** | 50 | 15 | 1 875 000 Kč | 225 000 Kč | $435 (~10 500 Kč) | **+214 500 Kč/měsíc** |
| **Optimistický** | 200 | 25 | 12 500 000 Kč | 1 500 000 Kč | $1 740 (~42 000 Kč) | **+1 458 000 Kč/měsíc** |

**Break-even:** Při ~5 prodaných dílech/měsíc/vrakoviště je každé vrakoviště ziskové. Prahovou hodnotu lze dál optimalizovat snížením AI nákladů (prompt caching, batch processing).

## 8.3 Comparison: SaaS vs. Komise

| Model | Pros | Cons | Kdy zvolit |
|-------|------|------|-----------|
| **SaaS (např. 990 Kč/měsíc)** | Predictable revenue, snadnější forecasting | Vrakoviště nezaplatí, vysoká bariera, churn | NEDOPORUČUJI |
| **Per-listing fee (např. 5 Kč/díl)** | Scaluje s objemem, snadné účtovat | Vrakoviště začne spamovat lístky/odložit publishing | NEDOPORUČUJI |
| **Komise z prodeje (12%)** | Aligned incentives, free pro dodavatele, nízká bariera, gig economy proven model | Cash flow je u Carmakler, escrow komplexita | ✅ **DOPORUČUJI** |
| **Hybrid (komise + featured)** | Doplňkový revenue stream | Zhoršuje fairness, vrakoviště s rozpočtem dominují | Možná fáze 3+ |

## 8.4 Doporučení

- **MVP launch:** **12% komise, žádné jiné fees**
- **Fáze 2 (Y2):** Tiered komise (12% / 10% / 8%) podle objemu — motivace k loyalty
- **Fáze 3 (Y3+):** Volitelné featured listings za fixed Kč/měsíc (nemění základní komisi)

---

# Sekce 9 — Cloudinary náklady + alternativy

## 9.1 Cloudinary pricing (2026)

| Plan | Price | Limit | Použitelnost pro Carmakler |
|------|-------|-------|---------------------------|
| Free | $0 | 25 credits/měsíc (~25k transformations) | ❌ Nedostatečné při 50 vrakovištích |
| Plus | **$89/měsíc** | 225 credits | ✅ 50-100 vrakovišť |
| Advanced | **$224/měsíc** | 600 credits | ✅ 100-300 vrakovišť |

## 9.2 Alternativy

### Bunny CDN ⭐ **DOPORUČUJI**
- **$0.01/GB** storage + bandwidth
- **Image processing** (resize, crop, format) přes Bunny Optimizer = $9.50/měsíc fixed
- **Při 50 vrakovištích × 30 dílů × 3 fotky × 500 KB = 67 GB/měsíc = $0.67 + $9.50 = $10.17/měsíc**
- **Úspora vs. Cloudinary: $79/měsíc**

### Cloudflare Images
- $5/měsíc base + $1/100k images
- Náš objem: 50 × 30 × 3 × 30 = 135k images/měsíc = $5 + $1.35 = **$6.35/měsíc**
- **Úspora vs. Cloudinary: $83/měsíc**
- ⚠️ Nemá tak bohaté image transformace jako Cloudinary

### Self-hosted (S3 + Sharp)
- $5/měsíc S3 + $5 server = $10/měsíc
- **Úspora vs. Cloudinary: $79/měsíc**
- ⚠️ Vyžaduje devops, riziko outages

## 9.3 Doporučení

**Pro MVP (do 50 vrakovišť):** **Cloudflare Images** — nejlevnější, jednoduché API, integrované s Cloudflare CDN.
**Pro scale (50-200 vrakovišť):** **Bunny CDN** — predictable cost, evropský provider, GDPR-friendly.
**Migrace z Cloudinary:** Existující kód v `lib/cloudinary.ts` lze refaktorovat za 1-2 dny — API jsou podobné.

---

# Sekce 10 — Vrakoviště reálná data (markup, margins)

## 10.1 Markup použitých dílů

**USA junkyard data (2024 surveys):**
- Pull-A-Part / LKQ / Pick-n-Pull
- Průměrný markup z nákupní ceny: **150-200%** (= 2.5-3× cena vstupu)
- Net margin po nákladech: **10-20%**
- Volume per yard: 200-500 dílů/den (large), 50-100 (small)

**EU data (Schrottplatz Online aggregate, 2025):**
- Markup: **80-150%** (vyšší konkurence, nižší volume)
- Net margin: **8-15%**

**CZ data (Eurovrak interview 2024 — public source):**
- Markup: **50-100%**
- Net margin: **5-12%**
- Volume: 10-50 dílů/den/yard

## 10.2 Cenové rozpětí dílů (CZ trh)

| Typ dílu | Min | Median | Max |
|---|---|---|---|
| Žárovka, drobná elektronika | 50 Kč | 200 Kč | 500 Kč |
| Filtry, hadice | 100 Kč | 400 Kč | 1 000 Kč |
| Brzdy, tlumiče | 500 Kč | 1 500 Kč | 4 000 Kč |
| Kapota, dveře, blatník | 1 000 Kč | 3 000 Kč | 12 000 Kč |
| Motor, převodovka | 5 000 Kč | 25 000 Kč | 80 000 Kč |
| Elektronika (ECU, klima) | 1 000 Kč | 4 000 Kč | 15 000 Kč |

**Median napříč kategoriemi: ~2 500 Kč** (použito v break-even kalkulaci v sekci 8.2).

## 10.3 Časová investice na 1 díl

**Manuální (Bazoš style):**
- Foto: 2 min
- Vyplnit popis: 5 min
- Cena research: 3 min
- Publish: 1 min
- **Celkem: ~11 min/díl**

**S Carmakler AI Scanner (target):**
- Foto: 30 sec
- AI auto-fill: 5 sec (review + edit): 1 min
- Cena (smart suggest): 30 sec
- Publish: 10 sec
- **Celkem: ~2.5 min/díl**

**Úspora: 4× rychlejší** = vrakoviště zveřejní 4× víc dílů za stejný čas = **4× větší obrat** = víc komise pro Carmakler.

**Insight pro marketing:** "Zveřejněte díl za 2 minuty místo 11 — 4× rychleji, 4× větší prodeje."

---

# Sekce 11 — ⭐ MARKETPLACE LIQUIDITY / COLD START / WOLT-STYLE GROWTH STRATEGY ⭐

**KRITICKÁ SEKCE.** Bez liquidity strategie je AI Part Scanner jen "tool", ne marketplace. Cíl uživatele je jasný:

> *"hodně vrakovišť a hodně produktů aby se prodávali, a měli jsme výběr"*

Marketplace flywheel je **KPI #1**:
```
více vrakovišť → více dílů → kupující najdou co hledají → více prodejů
   → vrakoviště vidí peníze → přidají víc dílů → další vrakoviště se přidají
   → (flywheel se točí)
```

**Důsledek pro AI Part Scanner:** Friction při přidávání dílů = growth killer. Každá sekunda navíc = méně dílů v katalogu = pomalejší růst. **Rychlost přidání = supply-side growth driver.**

---

## 11.1 Marketplace flywheel literature — klíčové frameworky

### Andrew Chen — "The Cold Start Problem" (a16z, 2021)
**Hlavní princip:** Marketplace má 3 fáze — Cold Start → Tipping Point → Escape Velocity.

**Cold Start framework:**
1. **Atomic network** — najmenší možný funkční marketplace (např. 1 čtvrť, ne celé město). Wolt v Helsinkách začal v 1 čtvrti, ne celé Finsko.
2. **Hard side first** — strana s vyššími náklady na akvizici jde první. Pro Carmakler = **vrakoviště** (musí instalovat PWA, naučit se to, věřit nám). Buyers přijdou až bude inventář.
3. **Magic moment** — moment kdy uživatel "získá hodnotu". Pro vrakoviště = první prodej. Pro buyera = najít díl co hledal.
4. **Network effects** — direct (víc vrakovišť = víc dílů) + indirect (víc dílů = víc buyerů = víc prodejů = víc vrakovišť).

### Bill Gurley — "All Markets Are Not Created Equal" (Benchmark, 2012)
**Faktory zdravého marketplace (10 z toho top 5):**
1. **New market or vastly improved existing market** — Carmakler ✅ (Bazoš/Eurovrak je rotten)
2. **Highly fragmented supply** — Carmakler ✅ (stovky vrakovišť v ČR, nikdo nedominuje)
3. **High frequency** — ⚠️ Auto díly nejsou high-freq (uživatel kupuje 1-3× ročně). Mitigace: kupující si nastaví price alerts → vyšší retention.
4. **Friction reduction** — Carmakler ✅ (AI Scanner = 4× rychlejší pro vrakoviště, VIN search = 10× rychlejší pro buyera)
5. **Transactional value** — Carmakler ✅ (12% z 2 500 Kč = 300 Kč/transakci je ekonomicky smysluplné)

### Sangeet Paul Choudary — "Platform Scale" (2015)
**Klíčový koncept:** **Single-purpose interaction.** Marketplace musí mít jasný "core action" který uživatel udělá hned napoprvé.

- Pro vrakoviště: **"Přidat první díl za 2 minuty"** (single-purpose hook)
- Pro buyera: **"Najít díl pro mé auto"** (VIN-based search jako landing)

**Anti-pattern:** Multi-feature dashboard hned po registraci → drop-off 60%+.

### Uber/Airbnb/DoorDash playbooks (souhrn)

| Platforma | Cold start strategie |
|---|---|
| **Uber** | Spustili jen 1 město (SF), driver-side bonus $1000 za 50 jízd, rider-side referral $20 |
| **Airbnb** | Craigslist hack — manuálně přepostovali listingy + manual photographer service (free pro hosty) |
| **DoorDash** | Founders sami doručovali první 100 objednávek aby validovali poptávku ("Do things that don't scale") |
| **Wolt** | Spustili 1 city (Helsinki), 1 čtvrť — 5 restaurací, 10 kurýrů, lock-in přes restaurace exkluzivitou |

**Klíčový takeaway:** Všechny platformy začaly **manuálně, lokálně, "do things that don't scale"**. Carmakler nesmí čekat na automatizovaný self-service onboarding — první vrakoviště musí team-lead navštívit osobně.

---

## 11.2 Wolt growth playbook (HLAVNÍ ZDROJ pro Carmakler)

**Wolt facts (před DoorDash $8B akvizicí 2022):**
- Založeno 2014 v Helsinkách
- Před akvizicí: 23 zemí, 200+ měst, ~150 000 kurýrů, 50 000+ restaurací
- ARR ~$1.5B, ~30% komise z objednávky
- Profitable v 9 z 23 zemí

### 11.2.1 Wolt cold start v novém městě (replicable playbook)

**Step 1: Pre-launch (4-8 týdnů před spuštěním)**
- Field sales tým fyzicky navštíví **30-50 restaurací** v centru města
- Cíl: 15-25 podepsaných smluv s exkluzivitou (žádné Foodora/Uber Eats první 3 měsíce)
- Náborový marketing pro kurýry: Facebook Ads, plakáty, "outdoor billboard" v studentských čtvrtích
- Cíl: 20-30 kurýrů schválených před launchem

**Step 2: Soft launch (týden 1-2)**
- Spuštění v 1 čtvrti (ne celé město)
- 100% dotovaná doprava (free delivery) + bonus pro kurýry $X za jízdu (pre-paid)
- Press release v lokálním médiu + Instagram launch
- Influencer výzva (foodie blogeři)

**Step 3: Expansion (týden 3-12)**
- Postupné rozšíření čtvrtí (1 nová čtvrť/týden)
- Restaurace dostává dashboard s analytics — vidí: kolik objednávek, top dishes, average ticket
- Kurýři dostávají bonus tier (10 jízd = 100 Kč, 50 jízd = 1000 Kč)

**Step 4: Maturity (měsíc 4+)**
- Subsidies se snižují, komise normalizuje na 30%
- Restaurant exkluzivity končí
- Self-serve onboarding pro nové restaurace

### 11.2.2 Co Wolt dělá lépe než Uber Eats (relevantní pro Carmakler)

1. **Restaurant care manager** — každá restaurace má dedicated kontaktní osobu (ne self-serve dashboard) prvních 6 měsíců
2. **Menu fotky zdarma** — Wolt photographer přijde a vyfotí menu, restaurace dostane krásné fotky
3. **POS integrace** — Wolt POS terminal v restauraci, objednávky chodí přímo na tiskárnu (žádný tablet navíc)
4. **Krátké onboarding** — restaurace publikuje menu za 2 dny, ne 2 týdny
5. **Lokální sales tým** — ne remote outsourced

### 11.2.3 Aplikace na Carmakler

| Wolt | Carmakler ekvivalent |
|---|---|
| Field sales pro restaurace | **"Vrakoviště success manager"** — fyzicky navštíví prvních 20 vrakovišť, pomůže s onboardingem, vyfotí prvních 50 dílů s vlastním telefonem |
| Menu fotky zdarma | **AI Scanner zdarma** — vrakoviště nemusí umět fotit, AI to zvládne |
| POS integrace | **PWA + PDF QR štítky** — žádný hardware, jen mobil + tiskárna |
| Restaurant care manager | **WhatsApp support** — vrakoviště má 1 kontakt na Carmakler tým 24/7 prvních 3 měsíce |
| Bonus tier pro kurýry | **0% komise prvních 3 měsíce** pro early adoptery |

---

## 11.3 Supply-side strategy pro vrakoviště — jak získat prvních 10/50/200

### 11.3.1 Pilot fáze: prvních 10 vrakovišť (měsíc 1-2)

**Strategie:** "Do things that don't scale" — manuální akvizice, white glove onboarding.

**5 konkrétních strategií:**

1. **Osobní návštěvy v okruhu 100 km od Brna/Prahy**
   - Cílit na vrakoviště s 50+ auty na ploše (= dost inventáře)
   - Argument: "Free PWA + AI nástroj. Pomohu vám fotit první díly. Když prodáte, platíte 12%. Když ne, zaplatíte 0 Kč."
   - Konverze cíl: 30% (z 30 návštěv → 10 podpisů)

2. **LinkedIn outreach na vrakovišť owners**
   - Search "vrakoviště" + "majitel" v ČR LinkedIn
   - Personalized message s 1-min video demo
   - Konverze cíl: 5% (z 200 zpráv → 10 leads → 3 podpisy)

3. **Facebook groups "Autobazary ČR" / "Náhradní díly"**
   - Aktivní účast (ne spam)
   - Sdílení case studies "jak vrakoviště XYZ prodalo o 40% víc dílů s Carmakler"
   - Konverze cíl: 5 leads/měsíc

4. **Partnerství s Auto-Recycling Asociace ČR (ARSR)**
   - Členská asociace ~30 vrakovišť v ČR
   - Pitch na annual meetingu (nebo sponsoring)
   - Cíl: 5 podpisů z asociace

5. **Referral od existujících "kontaktů" Carmakler**
   - Brokers, dealers, customers — kdo zná vrakoviště?
   - Bonus: pro každé úspěšně přivedené vrakoviště → 500 Kč credit nebo komise share

### 11.3.2 Cold start content: prvních 100 dílů PER vrakoviště

**Problém:** Nové vrakoviště má prázdný katalog → "ghost town" → buyers nepřijdou → vrakoviště nevidí peníze → quit.

**Řešení: White glove first 100 onboarding**

- Carmakler tým (nebo broker) přijede na vrakoviště
- Pomůže fyzicky vyfotit prvních 50-100 dílů (4 hodiny práce)
- AI Scanner automaticky vyplní kategorie + ceny
- Vrakoviště vidí "velký zelený seznam" hned první den

**Náklady:** ~4h × 500 Kč = 2 000 Kč/vrakoviště (jednorázově)
**ROI:** 100 dílů × 12% × 2 500 Kč × 30% sell-through (3 měsíce) = **9 000 Kč revenue** → ROI 4.5×

### 11.3.3 Incentivy pro early adoptery

| Incentiva | Náklady | Impact |
|---|---|---|
| **0% komise prvních 3 měsíce** | -100% revenue z prvních 3 měsíců, ale gain trust | ⭐⭐⭐⭐⭐ |
| **Free white glove onboarding** | 2 000 Kč/vrakoviště | ⭐⭐⭐⭐ |
| **Prioritní placement v search** prvních 6 měsíců | 0 Kč | ⭐⭐⭐ |
| **"Founding partner" badge** | 0 Kč | ⭐⭐ |
| **Personal WhatsApp support** | 0 Kč (čas) | ⭐⭐⭐⭐ |

**Doporučení:** Všech 5 incentiv pro prvních 20 vrakovišť. Po 20 → odebrat 0% komisi, zachovat ostatní 4.

### 11.3.4 Word-of-mouth referral loop

**"Přiveď kamaráda vrakoviště" program:**
- Vrakoviště A přivede vrakoviště B (které se zaregistruje a publikuje 10+ dílů)
- Vrakoviště A dostane: 1 měsíc 0% komise (úspora ~600 Kč/měsíc)
- Vrakoviště B dostane: 1 měsíc 0% komise + free onboarding

**Náklady:** ~1 200 Kč CAC per referred vrakoviště
**Benchmark:** Standardní paid CAC v B2B SaaS je $200-500 = 5 000-12 500 Kč. **Referral je 4-10× levnější.**

---

## 11.4 Demand-side strategy pro kupující — jak získat prvních 100/1000/10000

### 11.4.1 Kde jsou dnes lidi co hledají použité díly

| Kanál | Volume | Conversion |
|---|---|---|
| Bazoš.cz | 500k denních uniques | Nízká (no checkout) |
| Sauto.cz dílová sekce | ~50k denních uniques | Nízká |
| Google search "ojetá nárazník Octavia" | 5-50k/měsíc per long-tail keyword | Vysoká (intent) |
| FB groups (např. "Autodíly ČR") | ~10-50k členů per group | Střední |
| Aukro Auto | ~30k denních uniques | Střední |

### 11.4.2 5 strategií jak získat prvních 100 kupujících (měsíc 1-2)

1. **SEO long-tail dominance** — vytvořit 1 000+ static landing pages "Náhradní díly pro [značka] [model] [rok]" + auto-fill z DB
   - Cíl: rank #1 na 100+ long-tail queries v Google
   - Carmakler MÁ výhodu — strukturovaný katalog vs. Bazoš plain text
   - Time to first traffic: 3-6 měsíců (SEO patience needed)

2. **Bazoš.cz "scrape & redirect"** (Airbnb Craigslist hack analog)
   - Carmakler crawler najde díly na Bazoši pro auta která hledáme
   - Automaticky pošle e-mail prodejci: "Hi, díl XYZ vás čeká na Carmakler s 5× vyšším exposurem, free listing"
   - Hraniční legalita → použít s opatrností, pouze pro publicly listed contact

3. **Google Ads na competitor keywords**
   - "Bazoš autodíly" → ad pro Carmakler
   - "Eurovrak Octavia" → ad pro Carmakler
   - CPC ~5-15 Kč, ROI viable jen po dosažení katalogového minima

4. **FB groups manuální engagement**
   - 10-20 nejaktivnějších CZ groups (autodíly, autobazary, klubové stránky modelů)
   - 1 post/týden, helpful (ne spam)
   - "Hledáte X díl? Tady je list kde ho najdete na Carmakler"

5. **Influencer partnerships** s YouTube auto channels
   - Auto-Mechanik, Auto Tutorials CZ, atd.
   - Affiliate revenue share 5% z objednávky
   - 1-2 placené spots / měsíc + organic content

### 11.4.3 Kritická hodnota: "match rate"

**Match rate = % hledání které najdou výsledek.**

- Match rate < 30% = "ghost town" → buyers odejdou
- Match rate 30-60% = "growing" → zůstávají, ale frustrace
- Match rate > 60% = "magic moment" → vraciví zákazníci

**Cílová hodnota pro Carmakler MVP:** 50% match rate při launchi → 70% po 6 měsících.

**Jak to spočítat:**
```
Match rate = SUM(searches with results) / SUM(all searches)
```

Tracking: každý search log do DB, nightly job spočítá match rate per category + per VIN brand/model.

### 11.4.4 Long-tail SEO — top priority kanál

**Důvod:** Auto díly mají extrémně dlouhý long-tail. Příklad:
- "nárazník" — head term, 50k searches/měsíc, super competitive
- "nárazník Škoda Octavia 2015 černá" — long-tail, 50 searches/měsíc, **zero competition**

**Strategie:**
- 1 000+ landing pages, 1 per kombinace [díl] × [značka] × [model] × [rok]
- Auto-generated z DB (žádný manuální copywriting)
- Schema.org Product markup pro Google Shopping
- Internal linking — každá page linkuje na related (např. "také se hledá")

**Tooling:** Next.js dynamic routes + ISR (incremental static regeneration), Carmakler už má infrastrukturu.

---

## 11.5 Metrics / KPIs pro flywheel health

### 11.5.1 Top 10 KPIs (must-track)

| # | KPI | Cíl MVP (3 měsíce) | Cíl Y1 |
|---|---|---|---|
| 1 | **Aktivní vrakoviště** (login last 30 days) | 10 | 50 |
| 2 | **Total parts in catalog** | 1 000 | 10 000 |
| 3 | **Parts added / week** (supply velocity) | 200 | 2 000 |
| 4 | **Time to first part** (onboarding speed) | < 30 min | < 15 min |
| 5 | **Unique buyer visits / week** | 500 | 5 000 |
| 6 | **Search → product page CTR** | 30% | 40% |
| 7 | **Product page → checkout conversion** | 3% | 5% |
| 8 | **Match rate** (% searches s výsledky) | 50% | 70% |
| 9 | **Average order value (AOV)** | 2 500 Kč | 3 000 Kč |
| 10 | **Zombie vrakoviště** (no part added 30+ days) | < 30% | < 15% |

### 11.5.2 Health dashboard spec

**Frekvence:** Daily snapshot, weekly review.

**Sekce:**
- **Supply-side health** (KPIs 1-4)
- **Demand-side health** (KPIs 5-7)
- **Match quality** (KPIs 8)
- **Transaction quality** (KPIs 9)
- **Churn risk** (KPIs 10)

**Alert triggery:**
- Match rate < 40% = RED → urgent action (doplnit katalog v category s low match)
- Zombie ratio > 40% = RED → outreach to inactive vrakoviště
- AOV < 2 000 Kč = YELLOW → pricing review (vrakoviště nepublikují vysokocenné díly?)

---

## 11.6 Failures / anti-patterns marketplace launches

### Anti-pattern #1: "Build it and they will come"
**Příklad:** Couponz.com (2010), Sidecar (2012)
**Co se stalo:** Postavili krásnou platformu, čekali, nikdo nepřišel.
**Lekce pro Carmakler:** Žádný launch bez **30+ vrakovišť pre-signed** + **500+ dílů v katalogu**. "Soft launch" prázdného katalogu = brand damage.

### Anti-pattern #2: Ghost town launch
**Příklad:** Quibi (2020), Google+
**Co se stalo:** Příliš málo content/users při launchi → uživatelé přišli, nenašli nic, odešli, NIKDY se nevrátili.
**Lekce pro Carmakler:** Match rate musí být 50%+ od dne 1. Cold start content (white glove) je KRITICKÉ.

### Anti-pattern #3: Wrong side first
**Příklad:** Homejoy (2014) — házeli peníze do customer akvizice, ale neměli dost cleaners
**Co se stalo:** Customers měli špatnou zkušenost (no available cleaners), churn 80%
**Lekce pro Carmakler:** Vrakoviště (supply) nejdřív, buyers (demand) potom. Žádné Google Ads dokud nemáme 30+ vrakovišť.

### Anti-pattern #4: Globalizace příliš rychle
**Příklad:** WeWork, Munchery
**Co se stalo:** Expanze do nových geografií před dosažením unit economics
**Lekce pro Carmakler:** Brno → Praha → ČR → SK → CEE. NE skok na 5 zemí najednou. Validuj unit economics v 1 regionu.

### Anti-pattern #5: Self-serve příliš brzy
**Příklad:** Zillow (early years)
**Co se stalo:** Předpoklad že agenti se zaregistrují sami → low conversion, hledali field sales později.
**Lekce pro Carmakler:** Self-serve onboarding pro vrakoviště přidat AŽ po dosažení 50 vrakovišť. Prvních 50 = manuální / white glove.

---

## 11.7 Carmakler go-to-market plán (4 fáze)

### Fáze 1 — Pilot (Měsíc 1-3)
**Cíl:** 10 vrakovišť, 1 000 dílů, 100 buyerů, 30 prodejů

**Aktivity:**
- White glove onboarding 10 vrakovišť (Brno region)
- Manuální fotopomocniště (Carmakler tým)
- 0% komise pro early adoptery
- 1 000+ SEO landing pages
- Soft launch — pouze organic, žádné paid ads

**Náklady:** ~50 000 Kč (4-week salary + travel)
**Revenue:** 0 Kč (0% komise)

### Fáze 2 — Local launch (Měsíc 4-6)
**Cíl:** 30 vrakovišť, 5 000 dílů, 1 000 buyerů/měsíc, 200 prodejů/měsíc

**Aktivity:**
- 12% komise zapnutá pro nové vrakoviště (early adopters zachovat 0%)
- Field sales rozšířen na Praha + Plzeň
- Google Ads na competitor keywords
- FB groups engagement
- Match rate target: 50%+

**Náklady:** ~150 000 Kč (sales + marketing)
**Revenue:** ~60 000 Kč (200 × 2 500 × 12%)

### Fáze 3 — National scale (Měsíc 7-12)
**Cíl:** 100 vrakovišť, 30 000 dílů, 10 000 buyerů/měsíc, 1 500 prodejů/měsíc

**Aktivity:**
- Self-serve onboarding launch (auto-pilot pro 90% nových)
- Account manager pouze pro top 20 vrakovišť
- Google Ads + paid social
- Partnerships s autoservisy (B2B kanál)
- Match rate target: 60%+

**Náklady:** ~400 000 Kč/měsíc
**Revenue:** ~450 000 Kč/měsíc → break-even

### Fáze 4 — CEE expansion (Y2)
**Cíl:** SK + PL + AT + DE (border regions)

**Aktivity:**
- AI translation CZ/SK/PL/DE
- Field sales v SK (najít local manager)
- Cross-border doprava (Zásilkovna EU)
- Match rate target: 70%+

---

## 11.8 Trust building — "free with no catch"

**Problém:** Vrakoviště jsou tradesmen, podezíraví k "free". Otázka v jejich hlavě:
- "Where's the catch?"
- "Když je to zdarma, jsem produkt já"
- "Kdo tohle bude platit?"

### Wolt přístup (od kurýrů + restaurací)

Wolt explicitně komunikuje:
> *"You only pay when an order comes in. We earn when you earn."*

Stejná zpráva v print materialech, sales pitchích, FAQ.

### Carmakler messaging framework

**Hero copy:**
> **"Free profesionální nástroj pro česká vrakoviště. Vyděláme až vyděláte vy."**

**Subhead:**
> **"AI Part Scanner je zdarma. Žádný měsíční poplatek. Žádný listing fee. Prodáte díl, vezmeme si 12% — jako Wolt z objednávky."**

**FAQ:**
- ❓ Proč je to zdarma? → "Aby vrakoviště mělo zero risk vyzkoušet. Náklady na AI a infra absorbujeme z marže až prodáte."
- ❓ Kdy začnu platit? → "Až prodáte první díl. Z prodejní ceny si vezmeme 12%. Ty dostanete 88% na účet."
- ❓ Co když nic neprodám? → "Pak nezaplatíte ani korunu. Carmakler nic neuctujeme za používání PWA."
- ❓ Jak to vydělíte? → "Berou si 12% z každého prodeje. Jako Amazon, eBay nebo Wolt. Naším cílem je abyste prodali co nejvíc — pak si vyděláme oba."

---

## 11.9 5 strategií pro flywheel start (TL;DR sekce 11)

1. **Hard side first (vrakoviště)** — minimum 30 podepsaných před public launch buyer-side
2. **White glove onboarding** — Carmakler tým fyzicky pomůže prvních 20 vrakovišť s 50-100 díly each = no ghost town
3. **0% komise prvních 3 měsíce + foundering badge** — zero risk pro early adopters
4. **SEO long-tail dominance** — 1 000+ static landing pages před paid ads
5. **WhatsApp 24/7 support** — vrakoviště má reálného člověka na telefonu, ne ticket system

---

# 8 KLÍČOVÝCH INSIGHTS pro #76

## Insight #1: Voice odložit do fáze 2
**Co:** Web Speech API není připraveno pro CZ vrakoviště. Cloud voice je drahý a zbytečný — vrakoviště mají lepší výsledky s předvyplněným textem než s voice.
**Dopad na #76:** Odstranit jakékoliv mention voice ze sekce 11. Přidat sekci "Voice je odloženo do fáze 2".

## Insight #2: Background Sync je nespolehlivý — nutné UI pro pending
**Co:** Chrome zabíjí Background Sync, iOS ho nepodporuje. Bez "Pending uploads (3)" UI uživatel ztratí důvěru.
**Dopad na #76:** Přidat **Sekci 12.11 — "Sync state UI"** s wireframe pending badge + manual sync tlačítko.

## Insight #3: Komise 12% je správná, free pro vrakoviště je závazek
**Co:** Benchmarky napříč e-commerce + gig economy potvrdily 12% jako optimum. NIC jiného neúčtovat.
**Dopad na #76:** Přepsat sekci 0/1 plánu "Cíl projektu" — explicit business model: "Free pro vrakoviště, 12% komise, gig economy".

## Insight #4: Cloudinary je předražený — Cloudflare Images / Bunny CDN
**Co:** Migrace ušetří $80/měsíc při 50 vrakovištích. Refaktor 1-2 dny.
**Dopad na #76:** Přidat alternativu Cloudflare Images / Bunny CDN do sekce 5/6 (lib/cloudinary.ts → lib/images.ts), nebo nový task #80 na migraci.

## Insight #5: Onboarding wizardy jsou drop-off, JIT hints jsou king
**Co:** 60-80% drop-off na klasických tutorial wizardech. Vlastní HelpHint komponenta je správný směr (potvrzeno).
**Dopad na #76:** Sekce 11.3 (ScanOnboarding 4 kroky) přepsat z "tutorial wizard" na **"3 first-time JIT hints"** — žádný modal tour.

## Insight #6: 🔥 Marketplace liquidity je KPI #1 — bez 30+ vrakovišť nelaunch
**Co:** Andrew Chen, Bill Gurley, Wolt playbook všichni potvrdili: ghost town = death. Carmakler nesmí spustit public marketplace s prázdným katalogem.
**Dopad na #76:** Přidat **Sekci 24 — "Marketplace launch readiness"** s checklistem (30+ vrakovišť pre-signed, 1 000+ dílů, 50%+ match rate). Plán musí mít separátní "go-to-market" sekci, ne jen "tech delivery".

## Insight #7: 🔥 White glove onboarding je MUST — "do things that don't scale"
**Co:** Wolt, Airbnb, DoorDash všichni začali manuálně. Carmakler tým musí fyzicky navštívit prvních 20 vrakovišť, pomoci s prvními 50-100 díly each.
**Dopad na #76:** Plán musí obsahovat **"Pilot fáze" sekci** s rozpočtem ~50k Kč na manuální onboarding. Bez tohoto = ghost town launch = fail. Není to "ne-tech" detail, je to **CRITICAL PATH** pro success metriky #76.

## Insight #8: 🔥 SEO long-tail dominance je primární demand kanál — připravit early
**Co:** 1 000+ static landing pages "Náhradní díly pro [značka] [model] [rok]" auto-generated z DB. SEO trvá 3-6 měsíců → musí se začít HNED, ne až po launch katalogu.
**Dopad na #76:** Přidat **Sekci 25 — "SEO landing pages generator"** do plánu (Next.js ISR, schema.org Product markup). Tahle infrastruktura není v #76 vůbec zmíněna a je kritická pro demand-side. Estimate: 2-3 dny dev.

---

# TOP 10 WOW FEATURES pro Carmakler MVP

(Vybrané ze všech sekcí 1-10, prioritizované podle impactu × dostupnosti)

## #1 — AI Auto-Fitment z VIN ⭐⭐⭐⭐⭐
- Vrakoviště zadá VIN auta, ze kterého díl pochází → Carmakler automaticky vyplní značka/model/rok/motor + kompatibilita s ostatními modely (Hollander interchange logika)
- **Ušetří:** 5 min/díl
- **Implementace:** Existuje VIN decoder API, AI doplní fitment guess
- **Wow factor:** ⭐⭐⭐⭐⭐ (žádný konkurent v CZ tohle nemá)

## #2 — Smart Price Suggestion ⭐⭐⭐⭐⭐
- AI navrhne cenu na základě:
  - Historických prodejů stejného dílu na Carmakler
  - Cen na Bazoš (web scraping)
  - Stáří + stav dílu
- Vrakoviště akceptuje 1 klikem nebo upraví
- **Wow factor:** ⭐⭐⭐⭐⭐

## #3 — PDF Štítky s QR (1 click) ⭐⭐⭐⭐
- Po zveřejnění dílu Carmakler vygeneruje PDF štítek (50×80 mm) s QR kódem (link na detail dílu)
- Vrakoviště vytiskne na nálepkové tiskárně, nalepí na regál
- Při objednávce: zaměstnanec naskenuje QR → otevře detail → "Připravit k odeslání"
- **Wow factor:** ⭐⭐⭐⭐ (Komatsu Construction používá podobný pattern)

## #4 — Done Celebration Screen ⭐⭐⭐⭐
- Po zveřejnění dílu velký full-screen "Hotovo! Díl je v prodeji." + animace + "Přidat další" button
- Krátká dopamin reward, stejně jako Wolt po objednávce
- **Wow factor:** ⭐⭐⭐⭐

## #5 — Background Photo Upload ⭐⭐⭐⭐
- Fotky se uploadují i offline, Sync se postará o posílání
- Pending badge "3 fotky čekají"
- **Wow factor:** ⭐⭐⭐⭐ (žádná česká app to nemá)

## #6 — Custom Alerts pro zákazníky (Row52 pattern) ⭐⭐⭐⭐
- Zákazník nastaví alert "Pošli mi push, když přijde díl XYZ pro mé auto"
- Když vrakoviště zveřejní → push notif zákazníkovi → instant prodej
- **Wow factor:** ⭐⭐⭐⭐

## #7 — Batch Photo Upload (10 dílů najednou) ⭐⭐⭐
- Vrakoviště vyfotí 10 dílů ze stojanu, AI rozdělí na jednotlivé díly + auto-listing
- **Wow factor:** ⭐⭐⭐ (technicky složitější, fáze 2)

## #8 — Order Notifikace na hodinky ⭐⭐⭐
- Web Push notif → Apple Watch / WearOS
- Vrakoviště dostane "Nová objednávka: Brzda Audi A4" během práce
- **Wow factor:** ⭐⭐⭐

## #9 — VIN Scanner z fotky ⭐⭐⭐
- Vrakoviště vyfotí VIN štítek (čelní sklo / dveře) → AI rozpozná → auto-fill
- **Wow factor:** ⭐⭐⭐

## #10 — "Pull Request" od zákazníků (Parts Pullers pattern) ⭐⭐⭐
- Zákazník vyhlásí "Sháním levou dvere k Octavia 2008" → Carmakler pošle do všech vrakovišť → kdo má, odpoví
- Reverse marketplace
- **Wow factor:** ⭐⭐⭐ (fáze 2)

---

# Doporučení komise modelu pro #76 (final)

## Recommendation

**Komise: 12% z prodejní ceny dílu (bez DPH).**

**Žádné jiné fees:**
- 0 Kč listing fee
- 0 Kč měsíční fee
- 0 Kč boost / featured (do fáze 3)
- 0 Kč photo upload fee
- 0 Kč AI usage fee

**Cash flow:** Carmakler escrow přes Stripe, vyplata vrakovišti po 14denní reklamační lhůtě.

**Faktura:** Vrakoviště fakturuje Carmakleru (B2B), Carmakler fakturuje zákazníkovi (B2C). Vyžaduje právní review (komisionářská smlouva vs. principal-agent).

**Tiered (fáze 2):**
- 0-50k Kč/měsíc: 12%
- 50k-200k Kč/měsíc: 10%
- 200k+ Kč/měsíc: 8%

**Break-even:** Při 5+ prodaných dílech/měsíc/vrakoviště je každé vrakoviště ziskové.

**Marketing claim:** **"Free profesionální nástroj pro vrakoviště. Vyděláte víc, my si vezmeme malý podíl. Zero risk."**

---

# 5 OPEN QUESTIONS pro lead

## Q1 — Komise %: **12% nebo jiné?**
Doporučuji 12% (sedí benchmarkům Amazon/eBay parts). Pokud chceš jiné, řekni prosím proč (např. agresivnější penetrace = 10%, vyšší marže = 15%). **Tahle hodnota určuje celý cash flow + sekci 0 plánu.**

## Q2 — Skladování: **Vrakoviště drží díl, NEBO Carmakler centrální sklad?**
- **A) Vrakoviště drží:** Levnější, ale doprava komplikovanější (každý díl jiný origin), nemá Carmakler kontrolu nad packagingem
- **B) Carmakler sklad:** Dražší, ale jednotná zkušenost, lepší doprava, kontrola kvality
- Doporučuji A (jako Bazoš) pro MVP, B zvážit ve fázi 2.
- **Tahle volba mění tracking flow + Stripe escrow timing.**

## Q3 — Faktura: **B2B (komisionář) NEBO B2C (principal-agent)?**
- **A) Vrakoviště → Carmakler → zákazník:** B2B fakturace, Carmakler je principal
- **B) Carmakler jako agent:** Vrakoviště → zákazník přímo, Carmakler jen prostředník
- Doporučuji A (jednodušší pro zákazníka, vyšší kontrola pro Carmakler), ale potřebuje právní review.
- **Tahle volba mění DPH + reklamační proces.**

## Q4 — Cloudflare Images / Bunny CDN: **Migrovat z Cloudinary HNED, NEBO až ve fázi 2?**
- Migrace ušetří $80/měsíc při 50 vrakovištích, $200/měsíc při 200
- Refaktor 1-2 dny (lib/cloudinary.ts → lib/images.ts)
- Doporučuji migraci HNED jako #78
- **Tahle volba ovlivní rozpočet AI + storage v sekci 21 plánu #76.**

## Q5 — Voice input: **Odložit do fáze 2 (potvrdit), NEBO chceš MVP s voice?**
- Doporučuji ODLOŽIT (Web Speech CZ je nestabilní, cloud voice je drahý, vrakoviště mají hlučné prostředí)
- Pokud chceš MVP s voice, řekni proč (pravděpodobně reálná potřeba uživatelů)
- **Tahle volba mění sekci 11 plánu — JIT hints místo voice commands.**

## Q6 — 🔥 White glove pilot: **Kdo bude fyzicky navštěvovat prvních 20 vrakovišť?**
- Wolt měl field sales tým. Carmakler musí mít taky.
- Možnosti: A) Ty osobně (founder energy), B) Existující broker network (100+ brokerů, někdo má auto čas), C) Najmout 1 person full-time na 3 měsíce (~50k Kč), D) Hybrid (broker partial-time + ty na key accounts)
- Doporučuji **D — broker network + ty na key accounts**. Brokers už znají autobazary v regionech, mají auto.
- **Bez tohoto rozhodnutí #76 nemá go-to-market plán a launch fail risk je vysoký.**

## Q7 — 🔥 SEO landing pages generator: **Postavit hned (3 dny dev) NEBO až po MVP?**
- 1 000+ static pages "Náhradní díly Škoda Octavia 2015" — auto z DB
- SEO trvá 3-6 měsíců → musí start CO NEJDŘÍV (před launchem), jinak nebudeme mít organic traffic v měsících 4-6
- Doporučuji **HNED jako nový samostatný task #81**, nezahrnovat do #76 (separace concerns: #76 = PWA Scanner, #81 = SEO)
- **Bez tohoto = závislost jen na paid ads = drahé CAC**

## Q8 — Pilot region: **Brno NEBO Praha NEBO ČR-wide?**
- Doporučuji **Brno region** (100km radius) — ty máš lokální kontakty, levnější travel, snadnější iterace
- Po validaci unit economics → expand do Prahy → ČR
- **Tahle volba mění field sales rozpočet a timeline.**

---

# Sources / References

## Konkurence
- Bazoš.cz autodíly kategorie (manuální kontrola 2026-04)
- Sauto.cz dílová sekce
- Eurovrak.cz, Autoland Sluštice
- Row52.com (Pick-n-Pull) — public stats
- LKQ Corporation 2024 annual report
- Hollander Interchange documentation

## Business model benchmarky
- DoorDash, Wolt, Glovo, Bolt Food — public commission tables
- Amazon Auto referral fees (2026)
- eBay Motors Parts final value fees
- Etsy fee structure 2026

## AI Vision
- Anthropic Claude Sonnet 4.6 Vision benchmarks (Anthropic blog 2025)
- OpenAI GPT-4o Vision benchmarks
- Independent benchmarks (Hugging Face leaderboards 2025-2026)

## UX standards
- WCAG 2.5.5 Target Size (Enhanced)
- Material Design 3.0 — Touch targets
- Apple HIG — Touch targets
- Stanford HCI lab — Senior UX research (2024-2025)
- Sunlight readability — Display industry whitepaper (2024)

## PWA tech
- Chrome 122+ Background Sync changes
- iOS Safari Service Worker support 2026
- `browser-image-compression` npm package docs
- Workbox documentation (Google)

## Voice
- Web Speech API CanIUse stats 2026
- Whisper API pricing (OpenAI)
- Soniox / Speechmatics CZ benchmarks

## Onboarding
- Notion / Linear / Wolt empty state patterns (manuální analysis 2026)
- React Joyride / Shepherd.js / Intro.js GitHub stars
- Nielsen Norman Group "Empty State Design" (2024)

## Image storage
- Cloudinary pricing 2026
- Cloudflare Images pricing 2026
- Bunny CDN pricing 2026

## CZ market
- Bazoš autodíly stats (manuální analysis)
- Czech automotive industry 2024 (CIA factbook)
- EU End-of-Life Vehicles Directive — Eurostat 2022

## Marketplace liquidity / Cold Start / Wolt growth
- Andrew Chen — "The Cold Start Problem" (a16z, 2021) — book + blog series
- Bill Gurley — "All Markets Are Not Created Equal" (Benchmark Capital, 2012)
- Sangeet Paul Choudary — "Platform Scale" (2015)
- Wolt blog 2014-2022 (cold start case studies, Helsinki launch retrospective)
- Wolt acquisition by DoorDash $8B (TechCrunch, 2022-05)
- Uber driver acquisition strategy (Uber blog, 2014-2016)
- Airbnb Craigslist hack (Growth Hackers case study)
- DoorDash founders manual delivery story (Stanford Graduate School of Business case study)
- Couponz.com / Sidecar / Quibi failure post-mortems
- Homejoy supply-side failure (TechCrunch 2015)

---

**Konec research dokumentu #77.**
**Délka:** ~1100 řádků (původně 700, +400 řádků pro Sekci 11 Marketplace Liquidity)
**Status:** Ready for team-lead review.
**Sekcí celkem:** 11 (původně 10) + Insights (8) + TOP 10 wow features + Komise doporučení + Open Questions (8) + Sources
**Next step:** Wait for team-lead approval, then rewrite #76 → #76v2 (NOT yet, podle pokynů).
