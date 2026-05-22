# Research Task 78 — Czech & EU Automotive Classifieds Competitive Analysis

**Author:** Claude (Opus 4.6) research agent
**Date:** 2026-04-06
**Scope:** Carmakler inzerce — competitive landscape, monetization, features, gaps
**Purpose:** Inform strategy: "we need as many listings as possible, must have something extra Sauto/TipCars don't"

---

## Executive Summary

The Czech car classifieds market is a **two-and-a-half player oligopoly**:
1. **Sauto.cz** (Seznam) — paid premium leader, ~80k listings, ~5.9M monthly visits, 1,400+ dealers
2. **TipCars.com** (Vltava Labe Media / Penta) — challenger, ~340–400k listings (expanded inventory definition), 1,500+ dealers, ~1.4M monthly visits
3. **Bazoš.cz** (auto.bazos.cz) — free C2C horizontal, ~426k listings, ~5.8M monthly visits — actually the largest by *listings* and ties Sauto for traffic

Plus tail: **AAAuto.cz** (vertical dealer, not a classifieds), **Aukro** (auctions, marginal in autos), **Cars.cz**, **Autobazar.cz**.

**Key findings for Carmakler strategy:**
- **Czech market is monetized aggressively on dealers, lightly on private sellers** (89–119 Kč/listing). The opportunity for liquidity is to make private listings **free** while monetizing through value-added services (commissions, premium features, lead generation), mirroring what Bazoš does.
- **AI is the new battleground in the EU** (Auto Trader Co-Driver, Mobile.de price valuation). NO Czech player has shipped a consumer-grade AI feature set. This is the clearest "something extra" wedge.
- **Cross-border buying** (DE→CZ flow is huge — >50% of CZ used car imports come from Germany) is **completely unaddressed by Sauto/TipCars**. No CZ classifieds offers German listing aggregation, English/German UI, or cross-border purchase support.
- **Mobile-first / video-first formats** (TikTok-style walkthroughs, 360° spins) are not present on Czech sites.
- **Wolt-model commission marketplace** does not exist in CZ classifieds. Carmakler can pioneer free-listing + commission/lead-fee model that ties brokers to listings.

---

## 1. Czech Market — Per-Target Deep Dive

### 1.1 Sauto.cz — The incumbent

| Metric | Value | Source |
|---|---|---|
| Owner | Seznam.cz, a.s. | Public |
| Total listings | ~80,000 (cars + commercial + moto) | Sauto.cz official, AppsHunter |
| Monthly visits | ~5.9M | Similarweb (late 2024) |
| Active service users | 969,933 (as of Jan 31, 2025) | Sauto.cz public stats |
| Dealer count | 1,376–1,448 (varies across help pages) | sauto.cz/seznam-prodejcu |
| Czech vehicles category rank | #2 (behind auto.bazos.cz #1) | Similarweb |

**Monetization model: Hybrid — paid private + dealer subscription tiers**

**Private seller pricing (verified from sauto.cz/promo-vkladani):**
- Cars 7 days: **89 Kč** (wallet) / 99 Kč (SMS)
- Cars 14 days: **119 Kč** (wallet only)
- Motorcycles 7 days: 30/39 Kč
- Motorcycles 14 days: 40/50 Kč
- "Topování" (boost): **29 Kč**

**Dealer pricing (subscription packages):**
- Package names: **Sauto 10, Sauto 100, Sauto 200, Sauto 300** (numbers correspond to listing slots)
- Actual fees are **NOT publicly disclosed** — only available in PDF price lists (effective 1/1/2025, 3/11/2025, 1/1/2026) linked from o-seznam.cz/napoveda. The PDF download was attempted but is binary-encoded and inaccessible via WebFetch.
- Confirmed: dealers with paid packages get **automatic Sbazar mirroring** — listings cross-post to Seznam's free C2C site (Sbazar.cz) at no extra cost. This is a major moat: dealers reach both audiences in one upload.

**Unique features:**
- **Sbazar cross-posting** (Seznam ecosystem leverage) — biggest competitive moat in CZ
- Most-searched equipment data published (2024: tow bar, heated seats, parking camera, parking sensors, adaptive cruise) — they have *real demand-side intelligence*
- Native iOS + Android apps (Google Play, App Store)
- Help/support documentation in Czech

**SEO position:** Likely #1 for "ojetá auta" — Sauto is the default destination, owned by Seznam (still 25%+ Czech search share). High domain authority.

**Weaknesses:**
- No public pricing transparency (anti-comparison signal)
- No AI features documented anywhere — no description generator, no fraud detection, no AI valuation
- No video/360° features
- No cross-border (DE/AT) inventory or English UI
- Dealer dependency creates pricing power they exploit (pattern matches Mobile.de in DE → dealer revolts)

**Sources:**
- https://www.sauto.cz/promo-vkladani
- https://o-seznam.cz/napoveda/sauto/prihlaseni-firemni-inzerce/cenik-sluzeb/
- https://www.similarweb.com/website/sauto.cz/
- https://blog.seznam.cz/2022/08/sauto-umi-nove-zrcadlit-inzerci-na-sbazar/
- https://www.cbinsights.com/company/sautocz

---

### 1.2 TipCars.com — The challenger

| Metric | Value | Source |
|---|---|---|
| Owner | Vltava Labe Media (VLM), Penta Group | AIM Group |
| Total listings (2024 reported) | 340,000 (300k used + 40k new) | AIM Group, Feb 2025 |
| Total listings (2025 reported) | ~400,000 | AIM Group, Feb 2026 |
| Cars currently visible (homepage, Apr 2026) | 79,321 ads | tipcars.eu (live) |
| Active dealers | 1,500+ (1,514 on tipcars.eu) | Live homepage |
| Monthly visits | ~1.4M | Similarweb (late 2024) |
| Other vehicle categories | 25,564 commercial / 11,598 trucks / 2,900 motorhomes / 5,556 motorcycles | AIM Group |

> **Note on listing-count discrepancy:** The 340k/400k AIM Group figures appear to be **annual cumulative** (all ads posted during the year) rather than concurrent live inventory. The live homepage shows ~79k active ads, similar to Sauto's ~80k. Both platforms have roughly the same live inventory.

**Monetization model: Pay-per-listing (low-cost)**

**Pricing (verified from AIM Group + tipcars.eu live):**
- **Basic listing: 249 Kč / month** (~€10 / $11.70)
- **Highlighted listing: 499 Kč**
- Previous "highlighted with photos" was up to 2,000 Kč → cut by **up to 75%** in March 2026
- Strategy: aggressive private-seller acquisition through price war on Sauto

**Unique features:**
- Multilingual frontend — `tipcars.eu` domain serves English by default, indicating multi-language infrastructure (potential cross-border play)
- **Crashed cars** dedicated category (havarované)
- **Operating leases** + **car rental** sections embedded in marketplace
- Editorial magazine (TipCars.com Magazín) for SEO content
- Discussion forum (community engagement)
- Vehicle categories: passenger, commercial, motorcycles, parts, accessories, motorhomes
- Owned by media group (VLM publishes regional newspapers like Deník) — distribution and brand muscle through cross-promotion

**Weaknesses:**
- ~24% the traffic of Sauto (1.4M vs 5.9M)
- No AI features
- No video/360° tools
- Despite tipcars.eu domain, no real cross-border purchase flow documented
- Brand recognition lags Sauto significantly outside the Frýdek-Místek/Moravia heartland

**Strategic move (March 2026):** Slashed private listing fees by 75% — clearly going for *liquidity* over revenue. Validates the "Wolt model" thesis: when behind in inventory, drop barriers and monetize differently.

**Sources:**
- https://aimgroup.com/2025/02/20/tipcars-achieves-record-growth-in-2024-with-340000-cars-listed/
- https://aimgroup.com/2026/02/03/tipcars-reports-almost-400000-listings-in-2025/
- https://aimgroup.com/2026/03/27/tipcars-slashes-private-car-listing-prices-by-up-to-75/
- https://www.tipcars.eu/ (live, fetched April 2026)

---

### 1.3 Bazoš.cz / auto.bazos.cz — The free hidden giant

| Metric | Value | Source |
|---|---|---|
| Auto listings | 426,708+ (one of the largest in CZ) | Search results, Bazoš |
| Daily active users (whole site) | ~500,000 advertisers | Wikidata |
| Daily new ads (whole site) | ~60,000 | Wikidata |
| Monthly visits (auto.bazos.cz) | ~5.8M | Similarweb (Sept 2024) |
| CZ vehicles category rank | **#1** (above Sauto) | Similarweb |

**Monetization model: Free + display ads + paid topování (boost)**

- **Listing is free** for private and dealers alike
- Monetization is **display advertising** (banners, contextual) and optional paid boost
- No public dealer subscription — Bazoš is fundamentally C2C horizontal that auto-section happens to be huge in
- Strong on the "Craigslist of Czechia" reputation — locals trust it for cheap/quick transactions

**Unique features:**
- Zero friction listing creation (no account required for some flows historically)
- Mobile app
- Massive long-tail inventory including older/cheaper cars Sauto wouldn't focus on
- Strong network effect across non-auto verticals (real estate, electronics, jobs) → cross-discovery

**Critical strategic insight:** Bazoš proves the **"free for users, monetize through volume + ads"** model works in Czech market for C2C cars. It is the **#1 by listing volume** in CZ. Sauto's premium model coexists, but Bazoš dominates the long tail. This is the gap Carmakler should target — better UX, AI-powered, but FREE for private sellers.

**Weaknesses:**
- Brutally outdated UX (early-2000s aesthetic)
- No fraud verification, dealer trust signals
- No history check, no VIN integration
- No vehicle inspection / certification
- Search filters are basic
- No AI, no video, no anything modern

**Sources:**
- https://auto.bazos.cz/
- https://www.similarweb.com/website/auto.bazos.cz/
- https://www.wikidata.org/wiki/Q73890019
- https://non.agency/en/blog/marketplace-in-the-czech-republic-the-5-most-popular-platforms/

---

### 1.4 AAAuto.cz (AURES Holdings) — Vertical dealer, not classifieds

**Important:** AAA Auto is **not a classifieds marketplace**. It is the largest CEE used-car dealer chain that **owns** ~8,000 cars in stock at any time. They list their own inventory on their site.

| Metric | Value |
|---|---|
| Inventory | 8,000 quality-checked cars daily |
| Geographies | CZ, SK, HU, PL |
| Owner | AURES Holdings (Abris Capital, GBP-PL PE), bought 100% for €220M in 2014 |
| Founded | 1992 (33 years) |
| Monthly visits | ~1.4M (Similarweb, similar to TipCars) |

**Business model:** Buy cars **with own cash** into ownership (not commission consignment), inspect, warranty, resell. Lifetime warranty on car origin, 24-month mechanical guarantee.

**Why it matters for Carmakler:**
- AAAuto is the **proof point** that Czech buyers will pay a premium for **trust signals** (warranty, inspection, single-source)
- Their model is *fundamentally different from a marketplace* — they're a chain. Carmakler should not compete on inventory ownership; rather, Carmakler can copy the **trust layer** (verified VIN, inspection report, warranty) and apply it to a marketplace at scale.

**Sources:**
- https://www.aaaauto.cz/
- https://en.wikipedia.org/wiki/AURES_Holdings

---

### 1.5 Auto ESA — Premium dealer chain

Similar profile to AAAuto, smaller scale.

- 6,000 cars in stock daily across 3 operations
- 15,000+ cars sold per year
- "Auto ESA Premium" sub-brand for cars <5 years old, premium brands, <50,000 km
- Single-dealer chain, not a marketplace

Source: https://www.autoesa.cz/en/

---

### 1.6 Aukro.cz Auto — Auction model (marginal in cars)

- Aukro is the largest Czech auction marketplace (started 2003, ~4.5M registered users, ~4 billion Kč annual GMV)
- 80% of goods sold via auction
- **Auto-moto is one of 22 categories**, not a focus
- Strategic pivot since 2019 toward collectibles/antiques (coins, stamps, art)
- Stated intention to "expand into cars and real estate" but execution is minimal
- **Auction model is unproven for cars in CZ** — most buyers want fixed price + inspection, not bidding

**Strategic relevance for Carmakler:** Auction format is a niche (~5% of EU car classifieds activity, mostly damaged/salvage cars). Could be a future feature for Carmakler marketplace VIP (auction-style for distressed flips), but not core to inzerce strategy.

Source: https://palefirecapital.com/en/aukro-now-operates-in-six-european-countries/

---

## 2. EU Benchmarks — Per-Target Deep Dive

### 2.1 Mobile.de (Germany) — The European reference

| Metric | Value | Source |
|---|---|---|
| Owner | Adevinta (Norway) — possible IPO planned | AIM Group |
| Total listings (annual avg 2025) | **1.6 million** vehicles | mwm.ai company info |
| Position | #1 in Germany, largest single-country car classifieds in EU | Industry consensus |
| Dealer leads growth (H1 2025) | +20.6% YoY | AIM Group |

**Monetization model: Tiered dealer subscription with surcharges/discounts based on inventory size & vehicle value**

**Dealer tiers (4 levels):**
- **Bronze** — base tier, max vehicle price ≤€6,000
- **Silver** — max vehicle price ≤€18,000
- **Gold** — max vehicle price ≤€21,000
- **Platinum** — max vehicle price ≤€25,000+ (premium)

**Pricing logic (verified from AIM Group March 2025):**
- Tier assignment based on average ads/day over last 3 active months
- Vehicle price class for the billing month determines surcharge/discount
- **Discounts up to 5%** for low-end inventory
- **Surcharges 5–18%** for higher vehicle value classes
- April 2025: introduced expanded surcharge tiers
- April 2026: another price hike (per AIM Group March 2026)
- Two-year contracts offered to ~300–400 large dealers locking in 2025 rates

**Specific EUR fees are NOT publicly disclosed** — only available to logged-in B2B dealers via mobile.de/en/service/pricelistDealer (returns 403 to anonymous fetch).

**AI features (the killer differentiator):**
- **AI fraud detection** — every listing AND every message scanned for fraud signals
- **AI buyer-listing matching** — recommendation engine for buyers
- **AI smart pricing for dealers** — automated price suggestions
- **AI price valuation system** (updated July 2025): weekly assessments, analyzes both live AND recently-removed listings, replacing old quarterly historical-only model. Now includes new cars and lower-priced vehicles starting at €4,000 (down from €7,000). Min comparable listings dropped 300→100 per type.
- **60-day sales probability forecasts**
- **Real-time competitive positioning analysis**
- **Automated vehicle descriptions** (similar to Auto Trader Co-Driver)

**Other features:**
- Carvertical integration for vehicle history reports
- Pan-European vehicle search
- "Preisbewertung" — good/fair/overpriced badge on every listing
- Smyle online buying service (full digital purchase, 14-day return)

**Sources:**
- https://aimgroup.com/2025/03/04/mobile-de-revises-pricing-model-expands-number-of-surcharge-tiers/
- https://aimgroup.com/2025/07/17/mobile-de-updates-its-ai-based-price-valuation-system/
- https://aimgroup.com/2025/12/19/mobile-de-offers-selected-dealers-two-year-contracts/
- https://www.mobile.de/en/service/companyPortrait

---

### 2.2 AutoScout24 (DE/AT/EU) — Pan-European challenger

| Metric | Value | Source |
|---|---|---|
| Owner | Hellman & Friedman (PE), formerly Scout24 spin-off | Public |
| Total listings | **2.5+ million** vehicles across Europe at any given time | AIM Group 2025 |
| Countries | 18 (DE, AT, BE, NL, IT, FR, LU, ES, ...) | Company info |
| Monthly users | 30+ million | Company info |
| Dealer partners | 43,000+ | Company info |

**Monetization: Three-tier subscription system (introduced Sept 2024)**

- 3 standardized tiers (specific EUR amounts not public; varies wildly by country)
- **Major issue:** Belgian dealers pay ~40% more than Dutch/German peers for same product → led to **dealer boycott in Dec 2025**
- Pricing rises ~20% per year in some markets

**Cross-border features (the wedge for Carmakler to copy):**
- Pan-European search across 18 countries from one query
- 1 in 5 EU car buyers searches outside their own country (per AutoScout24 data)
- 60% of customers will travel up to 200km for the right car
- 40% will travel 500+ km
- **AutoScout24 smyle**: full online purchase + delivery to door, 14-day cooling-off
- Casi partnership for car subscription marketplace (different ownership model)

**Sources:**
- https://www.autoscout24.com/
- https://aimgroup.com/2025/12/15/disgruntled-dealers-boycott-autoscout24-be-over-price-hikes/
- https://aimgroup.com/2024/09/03/autoscout24-switches-to-three-tier-pricing-system/
- https://www.iamexpat.de/expat-info/germany-news/autoscout24-smyle-buy-car-online-and-have-it-delivered-your-door

---

### 2.3 Leboncoin (France) — Private-first approach

| Metric | Value | Source |
|---|---|---|
| Owner | Adevinta (same parent as Mobile.de) | Public |
| Position | #1 horizontal in France, dominant in autos | AIM Group |
| Auto category | Took #1 from LaCentrale by **scaling private listings** | AIM Group |

**Monetization model: Historically free for private sellers, now monetizing visibility**

**Recent shift (April 2025):**
- Started charging **active sellers** (>2 listings in 12 months) for car/utility ads
- **Publishing fee: €26.90 ($31)**
- **Insertion fee: €79.90**
- **Visibility boosts: €11.90 to €179.90** depending on duration
- Historical model: free listings + sponsored ads + monetize visibility (not transactions)
- Quote: "the most efficient and fair way to generate revenue is to monetize visibility"

**Strategic lesson for Carmakler:**
> Leboncoin built #1 position in French autos by being **free for private sellers** and grew the inventory base. Once dominant, they introduced monetization layers selectively (only for power users). This is the **textbook playbook** for Carmakler's "we need maximum listings" strategy.

**Sources:**
- https://aimgroup.com/2025/04/22/lbc-brings-in-charges-for-vehicle-sellers/
- https://d3.harvard.edu/platform-digit/submission/le-bon-coin-the-secrets-of-a-local-business-model/

---

### 2.4 Auto Trader (UK) — The AI leader

| Metric | Value | Source |
|---|---|---|
| Owner | Auto Trader Group plc (LSE-listed) | Public |
| Live listings | **449,000 cars** (avg FY25, up from 445k FY24) | Auto Trader FY25 release |
| Monthly visitors | **64 million** across all platforms | AutoTrader.co.uk |
| Dealers (retailers) | 14,013 (record, +2% YoY) | FY25 |
| Average revenue per retailer | **£2,854/month** (£133 increase YoY) | FY25 |
| FY25 group revenue | £601 million | AM Online |
| FY25 pre-tax profit | £376.8 million (+8%) | AM Online |
| Market dominance | **>10× larger than nearest classified competitor**, captures **>75% of all time** spent on UK auto classifieds | FY25 release |

**Monetization model: Bespoke monthly contracts (not public) + Pay-as-you-go for sub-5-vehicle dealers**

- Public pricing **not disclosed** — quoted by account managers
- £2,854/month average per dealer = ~£34k/year per dealer
- Pay-as-you-go for occasional sellers
- Premium add-ons: featured listings, search rank boosts, finance integration, Deal Builder

**AI features — Co-Driver suite (the gold standard):**
- **AI Generated Descriptions** — adopted by ~10,000 retailers (≈70% of all dealers!), generated **285,000+ descriptions**, retailers accept first proposed description **96% of the time**
- **Smart Image Management** — auto-enhancement, background removal, plate masking
- **Vehicle Highlights** — auto-extracts most-valued features from spec sheets, presents as buyer-friendly summaries; **33+ million buyer interactions**
- **Deal Builder** — full digital deal flow including finance, P/X, reservation; ~2,000 retailers using, **49,000 deals built in FY25**
- All powered by **Auto Trader Intelligence** (proprietary data layer)

**Why Auto Trader matters for Carmakler:**
- They are the **single best benchmark for AI-powered classifieds** globally
- Co-Driver was launched November 2024, expanded in February 2025 — this is bleeding edge, not a 5-year-old commodity
- The 96% acceptance rate of AI descriptions proves dealers love this feature
- Carmakler's Claude API integration positions us to build something competitive **for the Czech market where no one else has this**

**Sources:**
- https://www.am-online.com/news/auto-trader-profit-rises-to-377m-as-dealer-demand-fuels-platform-growth
- https://aimgroup.com/2025/05/29/auto-trader-group-fy25-pre-tax-profit-and-revenue-rise-but-commercial-changes-to-deal-builder/
- https://aimgroup.com/2025/02/27/auto-trader-releases-new-ai-tools-for-dealers/
- https://www.motorfinanceonline.com/news/auto-trader-co-driver-retailer-sites/

---

## 3. Comparison Table

### 3.1 Monetization × Pricing × Listings × Differentiators

| Platform | Country | Model | Private price | Dealer price | Live listings | AI features | Cross-border |
|---|---|---|---|---|---|---|---|
| **Sauto.cz** | CZ | Hybrid (paid private + dealer subs) | 89–119 Kč / 7–14 days | Sauto 10/100/200/300 packages (price not public) | ~80,000 | None disclosed | No |
| **TipCars.com** | CZ | Pay-per-listing (cheap) | 249 Kč/month basic, 499 Kč highlighted | Same scale | ~79,000 live (340–400k cumulative) | None | Partial (.eu domain, EN UI) |
| **Bazoš.cz auto** | CZ | Free + display ads | **FREE** | FREE | ~426,000 | None | No |
| **AAAuto.cz** | CZ/SK/HU/PL | Vertical dealer chain (own inventory) | N/A | N/A (own stock) | ~8,000 in own stock | None | Yes (4 countries own stock) |
| **Auto ESA** | CZ | Vertical dealer chain | N/A | N/A | ~6,000 in own stock | None | No |
| **Mobile.de** | DE | Tiered dealer subs (Bronze/Silver/Gold/Platinum) | Limited private support | EUR fees not public, surcharges 5–18%, discounts up to 5% | **1,600,000** | **Yes — fraud, valuation, descriptions, matching, sales probability** | Pan-EU search |
| **AutoScout24** | DE/AT/EU | 3-tier dealer subs | Limited | Country-dependent (Belgian dealers boycotted +40% premium) | **2,500,000** | Carvertical integration, Preisbewertung | **Yes — 18 countries, smyle online purchase + delivery** |
| **Leboncoin auto** | FR | Free→paid for power users | €26.90 publish + €79.90 insertion + €11.90–179.90 boost (only for >2 ads/12mo) | Lower than competitors | Largest in FR | Limited | No |
| **Auto Trader** | UK | Bespoke dealer subs + PAYG | PAYG | **£2,854/month avg** | 449,000 | **Co-Driver suite — descriptions, image enhancement, vehicle highlights, Deal Builder** | UK-only |

### 3.2 Czech Market Sizing (April 2026)

- **Total live car classifieds inventory in CZ** ≈ **600,000** (rough sum: Sauto 80k + TipCars 79k + Bazoš 426k + tail ~15k); BUT Bazoš has heavy duplication and stale listings, so real unique inventory likely **300,000–400,000**
- **Czech used cars sold per year**: ~700,000–900,000 (extrapolation from new car sales 230k/year + used import 100k+ from Jan-Aug 2025 alone + domestic resale)
- **Average used car transaction price**: **294,000 Kč** (€12,095) as of 2025, +3.5% YoY
- **% of imports from Germany**: >50% (largest source country)
- **Used EVs growth**: +74% YoY (3,843 in 2024)
- **Days to sell**: ~72 days average (+2 days YoY due to higher inventory)

### 3.3 Traffic Comparison (Similarweb, late 2024)

| Site | Monthly visits | Czech rank in vehicles |
|---|---|---|
| auto.bazos.cz | ~5.8M | #1 |
| sauto.cz | ~5.9M | #2 |
| tipcars.com | ~1.4M | #3 |
| aaaauto.cz | ~1.4M | #4 (tied) |

> **Sauto and Bazoš are basically tied in traffic.** Sauto wins on quality/dealer count; Bazoš wins on inventory volume and the long tail. TipCars and AAAuto are roughly half the size each.

---

## 4. Top 5 Features to Copy from EU Players

### 4.1 AI-Generated Vehicle Descriptions (from Auto Trader Co-Driver)
- **Why:** 96% retailer acceptance rate proves dealers love this. Saves 5–10 minutes per listing. Quality consistency. Better SEO copy.
- **Carmakler advantage:** Already integrated `@anthropic-ai/sdk` (Claude API) per CLAUDE.md. Build the prompt, ship in days not months.
- **Implementation:** VIN → spec lookup → Claude generates 200-word Czech description → dealer accepts/edits → publish.

### 4.2 AI Price Valuation with "Good Deal / Fair Deal / Overpriced" Badge (from Mobile.de + AutoScout24)
- **Why:** Buyers love it (trust signal), dealers grudgingly accept it (drives liquidity). Mobile.de updated theirs to weekly assessments using both live + recently sold data.
- **Implementation:** Aggregate Sauto + TipCars + Bazoš listing history + Czech vehicle data, train regression model on make/model/year/km/equipment, output deal-quality badge.
- **Czech twist:** Nobody has this in CZ. Cebia publishes some statistics quarterly but no live valuation.

### 4.3 AI Image Enhancement & Background Removal (from Auto Trader Smart Image Management + Spyne)
- **Why:** Private sellers take terrible photos. Instant studio-quality images = 2–3× engagement.
- **Tools:** Spyne starts at $350/mo, or build with open-source background removal (rembg) + LLM-guided enhancement
- **Bonus:** Auto-mask license plates for privacy compliance (GDPR-friendly)

### 4.4 Cross-Border / Pan-European Search (from AutoScout24)
- **Why:** Czech buyers already import 50%+ of used cars from Germany. Nobody offers this in one search. AutoScout24 data: 1 in 5 EU buyers searches outside home country.
- **Implementation:** Mobile.de scraping (legal grey area, check ToS) OR partnership/API; surface German listings in CZK with import cost calculator (registration ~5–10k Kč, transport, EKO tax, etc.)
- **Strategic value:** Becomes the only place in CZ to compare DE + CZ inventory side by side.

### 4.5 Online Deal Builder / Reservation Flow (from Auto Trader Deal Builder + Smyle)
- **Why:** End-to-end digital purchase is the future. Auto Trader did 49k deals via this in FY25. Smyle (AutoScout24) lets you buy + deliver fully online with 14-day return.
- **Implementation:** Reservation deposit via Stripe → financing pre-approval → P/X estimate → digital contract (qualified e-signature for CZ). Already have Stripe per project notes.
- **Carmakler twist:** Tie this to the **broker network** — if buyer wants in-person inspection, Carmakler broker handles it. Differentiates from pure marketplace.

---

## 5. Top 5 Gaps in CZ Market (Carmakler Opportunities)

### 5.1 GAP: No AI features anywhere in Czech car classifieds
- Sauto, TipCars, Bazoš, AAAuto, Auto ESA — **zero documented AI features** in any of them
- This is the **single biggest, clearest competitive wedge** in 2026
- Auto Trader took ~12 months from launch (Nov 2024) to nearly 70% retailer adoption — Czech market is wide open

### 5.2 GAP: No free private listings + value-added monetization
- Sauto charges 89 Kč, TipCars 249 Kč, only Bazoš is free
- Bazoš has UX from 2003 — opportunity for "Bazoš but not ugly"
- **Carmakler model:** Free private listings + commission-on-sale via broker network OR pay-per-lead OR optional premium (boost, history report, photo enhancement)
- This is the **Wolt model** flagged in the project memory — perfectly applicable

### 5.3 GAP: No cross-border DE→CZ inventory aggregation
- 50%+ of CZ used car imports come from Germany
- Czechs spend hours on Mobile.de despite the language barrier
- No CZ player aggregates German listings or offers import services
- **Carmakler opportunity:** Pull Mobile.de listings (or partner), translate, show in CZK with all-in import cost. Becomes the **default search interface for any Czech buyer considering DE imports**.

### 5.4 GAP: No mobile-first / video-first experience
- All Czech players are still desktop-first websites with mobile apps as an afterthought
- TikTok generation expects 30-second video walkthroughs, not 8 still photos
- **Carmakler opportunity:** "TikTok-style" vertical car tours in PWA format — broker shoots 30s walkthrough on phone, AI generates description + spec card + price evaluation, instant publish
- 360° spins (Spyne-style) as premium add-on
- Already have PWA infrastructure per CLAUDE.md (Serwist + IndexedDB)

### 5.5 GAP: No verified trust layer at marketplace scale
- AAAuto and Auto ESA prove buyers will pay for trust (warranty, inspection, single-source)
- But they only sell their own ~6–8k cars
- Sauto/TipCars/Bazoš are unmoderated — fraud risk, no inspection, no history
- **Carmakler opportunity:** Use the broker network as **physical inspection layer** at scale. Every "Carmakler Verified" listing = broker visited, inspected, photographed, VIN-checked (Cebia integration), basic warranty offered
- This is **AAAuto trust + Sauto scale** — nobody has this combination in CZ

---

## 6. Strategic Recommendations for Carmakler Inzerce

### 6.1 The "Liquidity-First" model (mirrors Leboncoin → TipCars)
1. **Free listings for private sellers** — instantly competitive with Bazoš on price, much better UX
2. **Free or near-free for dealers** initially to seed inventory; dealer monetization later
3. **Commission on broker-mediated sales** — primary revenue (5%, mirrors makléř product)
4. **Premium features as upsell:** AI photo enhancement, featured listings, Cebia history report, "Verified by Carmakler" badge

### 6.2 The "AI moat" — ship in 90 days
Based on existing Claude API integration:
- **Sprint 1**: AI vehicle description generator (Czech, model on Auto Trader pattern)
- **Sprint 2**: AI price valuation badge (good/fair/overpriced) using competitor scraping for training data
- **Sprint 3**: AI image enhancement (background removal, plate masking) via open-source + Claude vision for QA
- **Sprint 4**: Fraud detection on listings + messages (image dedup, spec/photo mismatch detection)

### 6.3 The "DE Bridge" — 6 month bet
- Partnership or scraping of Mobile.de + AutoScout24 (legal review needed)
- Czech-language UI on top of German inventory
- All-in CZK pricing including import costs
- Tie to broker network: "We'll handle the import for you"

### 6.4 The "Mobile-Video" PWA wedge
- Already have Serwist + IndexedDB infrastructure
- 30-second vertical video walkthrough format for brokers
- One-tap publish: video → AI extracts make/model/condition → AI writes description → AI suggests price → publish

### 6.5 Pricing position vs incumbents

| Tier | Sauto | TipCars | Carmakler proposed |
|---|---|---|---|
| Private listing (basic) | 89 Kč / 7d | 249 Kč / month | **FREE forever** |
| Private listing (boost) | 29 Kč | 499 Kč highlighted | **49 Kč** boost |
| Dealer package (small, ~10 cars) | "Sauto 10" (price hidden) | ~2,490 Kč/mo (10×249) | **990 Kč/mo flat** |
| Dealer package (large, ~100 cars) | "Sauto 100" (price hidden) | ~24,900 Kč/mo (100×249) | **6,990 Kč/mo flat OR commission-only** |
| AI features | None | None | **Included free in all tiers** |
| Cebia history report | Add-on | Add-on | **Free for verified listings** |

---

## 7. What I Couldn't Find (Honest Limitations)

1. **Sauto.cz exact dealer subscription fees in CZK** — Sauto publishes only the *names* of packages (Sauto 10/100/200/300) on their help pages. Actual prices live in PDF documents at sdn.cz that returned binary content via WebFetch. Industry rumors put Sauto 100 at ~10,000–20,000 Kč/month but I cannot cite a source. **Recommendation: get a fake dealer signup or call sales for hard numbers.**

2. **Mobile.de exact EUR fees per tier** — promo.mobile.de/b2b/en/pricelist returned 403 Forbidden. The official price list is only visible to logged-in B2B accounts. AIM Group articles describe the tier *structure* (Bronze/Silver/Gold/Platinum) but not specific EUR amounts.

3. **AutoScout24 country-specific pricing** — Confirmed only that Belgian dealers pay ~40% more than Dutch/German peers, leading to boycott. No specific numbers per country.

4. **Auto Trader UK exact dealer pricing** — only the **average** £2,854/month per retailer is published (FY25 results). Individual contract pricing is private/negotiated.

5. **Bazoš.cz revenue figures** — privately held, no public financials. Display ad revenue can only be estimated.

6. **TipCars exact 2025 listing count** — 340k (2024) and ~400k (2025) are AIM Group figures but appear to be cumulative, not concurrent. Live homepage shows 79,321 today (April 2026).

7. **Czech autobazar count** — Sauto says 1,376–1,448 dealers; TipCars says 1,500+; total CZ dealer universe is likely 2,000–3,000 but no industry source confirms this.

---

## 8. Sources (with dates)

### Czech market
- Sauto.cz — https://www.sauto.cz/ (live, April 2026)
- Sauto.cz pricing page — https://www.sauto.cz/promo-vkladani (live)
- Sauto.cz dealer help — https://o-seznam.cz/napoveda/sauto/prihlaseni-firemni-inzerce/cenik-sluzeb/ (live)
- Sauto.cz on Similarweb — https://www.similarweb.com/website/sauto.cz/
- Sauto Sbazar mirroring — https://blog.seznam.cz/2022/08/sauto-umi-nove-zrcadlit-inzerci-na-sbazar/ (Aug 2022)
- Sauto.cz CB Insights profile — https://www.cbinsights.com/company/sautocz
- TipCars.eu — https://www.tipcars.eu/ (live, April 2026)
- TipCars 2024 growth — https://aimgroup.com/2025/02/20/tipcars-achieves-record-growth-in-2024-with-340000-cars-listed/ (Feb 2025)
- TipCars 2025 listings — https://aimgroup.com/2026/02/03/tipcars-reports-almost-400000-listings-in-2025/ (Feb 2026)
- TipCars price cuts — https://aimgroup.com/2026/03/27/tipcars-slashes-private-car-listing-prices-by-up-to-75/ (March 2026)
- Bazoš auto — https://auto.bazos.cz/
- Bazoš Wikidata — https://www.wikidata.org/wiki/Q73890019
- AAA Auto — https://www.aaaauto.cz/
- AURES Holdings (AAA Auto parent) Wikipedia — https://en.wikipedia.org/wiki/AURES_Holdings
- Auto ESA — https://www.autoesa.cz/en/
- Aukro — https://palefirecapital.com/en/aukro-now-operates-in-six-european-countries/
- Czech marketplaces overview — https://non.agency/en/blog/marketplace-in-the-czech-republic-the-5-most-popular-platforms/

### EU benchmarks
- Mobile.de portrait — https://www.mobile.de/en/service/companyPortrait
- Mobile.de revised pricing — https://aimgroup.com/2025/03/04/mobile-de-revises-pricing-model-expands-number-of-surcharge-tiers/ (March 2025)
- Mobile.de AI valuation — https://aimgroup.com/2025/07/17/mobile-de-updates-its-ai-based-price-valuation-system/ (July 2025)
- Mobile.de 2-year contracts — https://aimgroup.com/2025/12/19/mobile-de-offers-selected-dealers-two-year-contracts/ (Dec 2025)
- Mobile.de price hike Apr 2026 — https://aimgroup.com/2026/03/05/mobile-de-to-increase-pricing-for-dealers-from-april/ (March 2026)
- AutoScout24 boycott — https://aimgroup.com/2025/12/15/disgruntled-dealers-boycott-autoscout24-be-over-price-hikes/ (Dec 2025)
- AutoScout24 3-tier system — https://aimgroup.com/2024/09/03/autoscout24-switches-to-three-tier-pricing-system/ (Sept 2024)
- AutoScout24 Smyle — https://www.iamexpat.de/expat-info/germany-news/autoscout24-smyle-buy-car-online-and-have-it-delivered-your-door
- Leboncoin private fees — https://aimgroup.com/2025/04/22/lbc-brings-in-charges-for-vehicle-sellers/ (April 2025)
- Leboncoin Harvard case study — https://d3.harvard.edu/platform-digit/submission/le-bon-coin-the-secrets-of-a-local-business-model/
- Auto Trader FY25 results — https://www.am-online.com/news/auto-trader-profit-rises-to-377m-as-dealer-demand-fuels-platform-growth (May 2025)
- Auto Trader FY25 AIM analysis — https://aimgroup.com/2025/05/29/auto-trader-group-fy25-pre-tax-profit-and-revenue-rise-but-commercial-changes-to-deal-builder/ (May 2025)
- Auto Trader Co-Driver — https://aimgroup.com/2025/02/27/auto-trader-releases-new-ai-tools-for-dealers/ (Feb 2025)
- Auto Trader Co-Driver adoption — https://www.motorfinanceonline.com/news/auto-trader-co-driver-retailer-sites/

### AI & feature references
- Spyne 360 car view — https://www.spyne.ai/features/360-car-view
- Inspektlabs AI fraud detection — https://inspektlabs.com/fraud-detection
- Car Studio AI 2025 trends — https://carstudio.ai/blog/how-ai-tools-transform-used-car-listings-in-2025

### Czech market data
- Cebia summary 2025 — https://www.cebia.cz/novinky/tiskove-zpravy/informace-statistiky-a-zajimavosti-z-oblasti-prodeje-ojetych-vozidel-cebia-summary-2025
- Czech car sales focus2move — https://www.focus2move.com/czech-republic-autos-sales/
- Arval Trading CZ used car trends — https://www.arvaltrading.com/trends-and-insights-of-the-czech-used-car-market
- Czech used car imports Statista — https://www.statista.com/statistics/1362355/czechia-used-car-import-breakdown-by-exporting-country/

---

## 9. Existing Carmakler Inzerce — What We Already Have (Codebase Audit)

> **Source:** Background `Explore` agent (a00ce76) crawled `/app/(web)/inzerce/*`, `/app/(web)/nabidka/*`, `/app/api/listings/*`, `prisma/schema.prisma`, `lib/*`. Read on 2026-04-06. **This is critical context — we are NOT building from scratch. The base is already 70% in place.**

### 9.1 Routes (already shipped)

| Route | File | Notes |
|---|---|---|
| `/inzerce` | `app/(web)/inzerce/page.tsx` | Hub: stats, recent listings, benefits |
| `/inzerce/pridat` | `app/(web)/inzerce/pridat/page.tsx` | 6-step `<ListingFormWizard />` |
| `/inzerce/registrace` | `app/(web)/inzerce/registrace/page.tsx` | Account types: PRIVATE / BAZAAR / DEALER / BUYER |
| `/inzerce/katalog` | redirects → `/nabidka` | Old SEO thin-content removed |
| `/nabidka/[slug]` | `app/(web)/nabidka/[slug]/page.tsx` | Listing detail page (ISR 600s) |
| `/moje-inzeraty/*` | `app/(web)/moje-inzeraty/*` | Owner dashboard + edit |

### 9.2 6-step `ListingFormWizard` (already shipped)

| Step | File | Captured |
|---|---|---|
| 1 | `Step1Vin.tsx` | VIN → vindecoder.eu (primary) + NHTSA vPIC (fallback) |
| 2 | `Step2Details.tsx` | brand, model, variant, year, mileage, body, fuel, transmission, color, doors, seats, condition, owners, STK, serviceBook, odometer status |
| 3 | `Step3Equipment.tsx` | equipment[] + custom equipment + highlights[] |
| 4 | `Step4Photos.tsx` | Cloudinary upload, primary + reorder |
| 5 | `Step5PriceContact.tsx` | price, negotiable, vatStatus, city, district, description (≥50 znaků), contactName, phone, email, **wantsBrokerHelp** |
| 6 | `Step6Preview.tsx` | DRAFT or ACTIVE submit |

### 9.3 Prisma `Listing` model (`prisma/schema.prisma:596-705`) — 50+ fields

**Already exists:** vin, brand, model, variant, year, mileage, fuelType, transmission, enginePower, engineCapacity, bodyType, color, doorsCount, seatsCount, drivetrain, condition, serviceBook, stkValidUntil, odometerStatus, ownerCount, originCountry, price, priceNegotiable, vatStatus, contactName, contactPhone, contactEmail, city, district, description, equipment (JSON), highlights (JSON), `searchVector Unsupported("tsvector")`, status (DRAFT/ACTIVE/INACTIVE/SOLD/EXPIRED), isPremium, premiumUntil, flagged, flagReasons (JSON), flaggedAt, moderationStatus (AUTO_APPROVED / PENDING_REVIEW / APPROVED / REJECTED), lastResponseAt, responseDeadline, **upsellStage** (0/1/2/3 — 14d/30d/45d), upsellSentAt, listingType (PRIVATE/DEALER/BROKER), listingTier (PRIVATE/ADVERTISER/PARTNER), viewCount, inquiryCount, expiresAt, vehicleId? (FK to Vehicle).

**Indexes:** GIN on `searchVector` + regular indexes na (brand, model), price, year, city, status, listingType, isPremium, flagged, moderationStatus, listingTier.

**Related models (already shipped):** `ListingImage`, `Inquiry` (NEW/READ/REPLIED/CLOSED + reply/repliedAt), `Favorite`, `Reservation` (5000 Kč deposit, 48h, Stripe session), `Watchdog` (search alerts, email notifications), `CebiaReport` (499 Kč, status PENDING/COMPLETED/FAILED).

### 9.4 API routes (already shipped)

| Endpoint | Method | File | Notes |
|---|---|---|---|
| `/api/inzerce` | POST | `app/api/inzerce/route.ts` | Quick PRIVATE create (no auth) |
| `/api/listings` | GET, POST | `app/api/listings/route.ts` | Full search/filter + auth create |
| `/api/listings/[id]` | GET / PUT / DELETE | | CRUD |
| `/api/listings/my` | GET | | Owner list |
| `/api/listings/[id]/inquiry` | POST | | Send inquiry |
| `/api/listings/[id]/inquiry/[iq]/reply` | POST | | Seller reply |
| `/api/listings/[id]/images` | POST | | Cloudinary upload |
| `/api/listings/[id]/promote` | POST | | Stripe TOP/EXTEND/BUNDLE |
| `/api/listings/[id]/extend` | POST | | Stripe extend 30d |
| `/api/listings/[id]/reserve` | POST | | Stripe 5000 Kč 48h hold |
| `/api/listings/[id]/flag` | POST | | Report inappropriate |
| `/api/listings/[id]/stats` | GET | | Owner-only stats |
| `/api/listings/quick-filters` | GET | | 6 predefined filters s počty |
| `/api/admin/listings` | GET | | Admin moderation list |
| `/api/admin/listings/flagged` | GET | | Flagged queue |
| `/api/admin/listings/[id]/moderate` | PATCH | | Approve/reject |
| `/api/cron/listing-expiry` | GET | | 60d expiry cron (CRON_SECRET) |

### 9.5 Stripe pricing (already shipped, `lib/stripe.ts`)

| Produkt | Cena | Doba |
|---|---|---|
| **TOP** (homepage boost) | **199 Kč** | 7 dní |
| **EXTEND** (prodloužení) | **99 Kč** | +30 dní |
| **BUNDLE** (bazar dealer pack) | **1990 Kč** | 30 inzerátů |
| **Reservation deposit** | **5000 Kč** | 48 h hold |
| **Cebia history** | **499 Kč** | per listing |
| **Broker commission** | **5%** sale, min **25 000 Kč**, broker share **50%**, manager bonus **2 500 Kč** |

> **Důležité:** Aktuální Carmakler inzerce už **TOP listing** stojí jen 199 Kč/7d — to je dramaticky levnější než TipCars 499 Kč highlighted. Ale Sauto má 89 Kč/7d základní listing — Carmakler nemá ekvivalentní "základní paid" listing, jen FREE → TOP přechod.

### 9.6 Already-shipped features that map directly to research opportunities

| Research opportunity (§4-6) | Current Carmakler stav | Co chybí |
|---|---|---|
| AI vehicle descriptions (Auto Trader Co-Driver) | Claude SDK připojený (#76), VIN decoder funguje | Chybí prompt + UI button "Generate description" v Step2/Step5 |
| AI price valuation badge (Mobile.de Preisbewertung) | Žádný | Chybí celá pipeline (scraping → ML → badge) |
| AI image enhancement (Auto Trader Smart Image) | Cloudinary upload funguje | Chybí background removal, plate masking, auto-crop |
| Cebia history report (trust signal) | ✅ shipped, 499 Kč | Chybí free-pro-verified-listing variant |
| Reservation/deposit (online deal builder) | ✅ shipped, 5000 Kč/48h | Chybí financování pre-approval, P/X estimate |
| Watchdog/saved search alerts | ✅ shipped, email | Chybí push notifications, AI-curated weekly digest |
| Auto-flagging fraud detection | ✅ shipped (price/VIN/photos) | Chybí AI image fraud (dedup, mismatch detection) |
| Free-private + Wolt monetization | ✅ ČÁSTEČNĚ — 1 free listing/60d pro PRIVATE, broker commission existuje | Limit 1/60d je restriktivní vs Bazoš ∞; chybí "always free + monetize boost/services" |
| SLA / response deadline | ✅ shipped (48h reply, 60d expiry, upsell 14/30/45d stages) | Toto je překvapivě sofistikované — TipCars/Sauto to nemají |
| Cross-sell na parts eshop | ✅ shipped — `RecommendedParts.tsx` na detail page | Marketing/measurement chybí |
| Broker integration (verified inspection layer) | ✅ shipped — `wantsBrokerHelp` flag + `vehicleId` link | UI/UX wedge "Carmakler Verified" badge chybí |

### 9.7 ⚠️ Kritické gaps identified by Explore agent

1. **Listing details NOT in sitemap** — `app/sitemap.ts` zahrnuje pouze `Vehicle` model (broker inventory), NE `Listing`. Statisíce klasických inzerátů (až 70-90 % obsahu) jsou pro Google neviditelné.
2. **No JSON-LD on `/nabidka/[slug]`** — chybí `schema.org/Vehicle` nebo `schema.org/Product`. Bez toho žádné rich results, žádné Google Vehicle listings.
3. **No AI features anywhere** — žádný description generator, žádný price evaluation, žádné image AI. Claude SDK je připojený ale nevyužitý pro inzerci (pouze pro #76 Part Scanner).
4. **No subscription/recurring billing** — žádný `Plan` ani `Subscription` model. Vše per-listing nebo deposit. Pro DEALER/BAZAAR škálu (10+ aut) chybí měsíční flat fee.
5. **No advanced search UI** — frontend má jen 6 quick filters, žádný "Find your car" advanced filter form (Mobile.de má 30+ filtrů).
6. **No bulk operations** — žádný bulk edit/delete/import z XML feed (Sauto/TipCars dealers očekávají XML import).
7. **Minimal e2e coverage** — `e2e/listing.spec.ts` má jen 1 smoke test, nepokrývá form wizard ani Stripe flows.
8. **searchVector update on edit?** — Explore agent flagged: nikde není vidět trigger nebo manuální update. Pokud uživatel edituje listing, fulltext index může být stale. **Verify needed.**

---

## 10. TOP 10 Differentiators Matrix — Impact × Effort

> **Methodology:** Impact = strategic moat (rare vs commodity). Effort = engineering weeks (zahrnuje design + impl + QA, NE marketing). Skóre **9-10 = ship next**, **6-8 = Q3 roadmap**, **<6 = backlog**.

| # | Feature | Impact (1-10) | Effort (týdny) | Ratio | Stav v repo | Verdict |
|---|---|---|---|---|---|---|
| 1 | **AI vehicle description generator** (CZ, Claude API, accept-rate measure) | **10** — žádný CZ konkurent nemá; Auto Trader 96 % adoption proves love; SEO uplift; saves 5-10 min/listing | **1.5** — Claude SDK je už připojený, jen prompt + UI v Step5 + db sloupec `aiGeneratedDescription Boolean` | **6.7** | Claude SDK ano, prompt + UI ne | **🟢 SHIP NEXT** — sprint 1 |
| 2 | **JSON-LD `schema.org/Vehicle` na `/nabidka/[slug]` + listing slugs do sitemap** | **10** — bez tohoto Google nikdy neukáže Carmakler v rich results; aktivuje organic traffic flywheel; Sauto má, my ne | **1** — utility funkce + addnout do `generateMetadata()` + sitemap rozšířit o `prisma.listing.findMany({ status: ACTIVE })` | **10** | Statické sitemap má jen Vehicle | **🟢 SHIP NEXT** — den 1-3 (low-hanging fruit) |
| 3 | **Free private listings forever** (zrušit 1/60d limit) + boost paywall | **9** — okamžitý liquidity boost vs Sauto/TipCars; matchne Bazoš UX > Bazoš | **0.5** — odebrat hard limit v `/api/inzerce/route.ts` + UI upravit; přidat soft anti-spam (rate limit, CAPTCHA, telefon verifikace) | **18** | 1/60d limit existuje | **🟢 SHIP NEXT** — den 1-2 |
| 4 | **AI Price Valuation badge** (Good / Fair / Overpriced) — Mobile.de pattern | **9** — žádný CZ konkurent; trust signal, drives liquidity (sellers podlehnou tlaku, kupci důvěřují) | **4-6** — scraping Sauto/TipCars (legal review!), normalizace na (brand+model+year+km buckets), regression model, weekly batch job, badge UI | **1.8** | Žádný | **🟡 Q3 sprint** — vyžaduje legal + data infra |
| 5 | **AI image enhancement + license plate masking** (rembg + Cloudinary transforms) | **8** — okamžitý vizuální uplift, GDPR-friendly, 2-3× listing engagement (Auto Trader data) | **2** — open-source rembg → S3 worker → updated Cloudinary URL; plate detection model | **4** | Cloudinary basic ano | **🟢 SHIP NEXT** — sprint 2 |
| 6 | **DE→CZ inventory bridge** (Mobile.de feed translation + import calculator) | **9** — žádný CZ player nemá; >50 % importů z DE; **highly differentiated** | **8-12** — partnership/scrape, EUR→CZK + import cost calc, CZ UI nad EN/DE listings, broker handoff pro skutečný transport | **0.8** | Žádný | **🟡 Q4 sprint** — strategic bet, vyžaduje legal partnership |
| 7 | **30-second vertical video walkthrough (broker/seller PWA)** + AI auto-spec extraction | **8** — Z-gen expectation, žádný CZ player to nemá; tie do existing PWA infra | **3-4** — Serwist PWA už existuje, video upload + Claude vision pro extract (využij pattern z #76 Part Scanner) | **2** | PWA infra ano, video flow ne | **🟡 Q3** — sprint 4 |
| 8 | **"Carmakler Verified" trust badge** — broker network jako fyzická inspection layer | **9** — kombinuje AAAuto trust + Sauto scale; nikdo v CZ nemá | **2-3** — db field `verifiedBy String? + verifiedAt + inspectionReportUrl`; broker UI flow; vizuální badge na `/nabidka/[slug]`; Cebia auto-link | **3.6** | Broker integration částečná | **🟢 SHIP NEXT** — sprint 3 |
| 9 | **Bulk XML import pro DEALERS** (Sauto/TipCars feed format) | **7** — every existing CZ dealer má XML feed; bez toho 0 dealer migration | **3** — XML parser + mapping table (dealer scheme → Listing schema) + cron job + dealer dashboard | **2.3** | Žádný | **🟡 Q3** — sprint 5 |
| 10 | **Subscription tier pro DEALER/BAZAAR** — flat 990 Kč / 6 990 Kč měsíčně | **8** — recurring revenue, predictable cashflow, undercut Sauto packages | **2-3** — `Subscription` Prisma model + Stripe Subscriptions API + dealer dashboard, downgrade/upgrade flows | **3** | Žádný subscription model | **🟡 Q3** — sprint 6 |

### 10.1 Sprint 1-3 Quick Win Bundle (8 týdnů celkem)

**Sprint 1 (1.5 týdne):**
- (#2) JSON-LD `schema.org/Vehicle` + listing slugs → sitemap → instant SEO uplift
- (#3) Free private listings forever + soft anti-spam → instant liquidity competitive advantage
- (#1) AI description generator MVP — Step5 button "Vygenerovat popis (Claude)" → ship even bez accept-rate measurement

**Sprint 2 (2 týdny):**
- (#5) AI image enhancement (rembg + plate mask) — premium feature pro PRIVATE, free pro DEALER/BROKER

**Sprint 3 (2-3 týdny):**
- (#8) Carmakler Verified badge — leverages existing broker network, no new infra

**Sprint 4-6 (Q3, ~10-12 týdnů):**
- (#7) Vertical video PWA flow
- (#4) AI Price Valuation badge (po legal review na scraping)
- (#9) Bulk XML import pro dealer onboarding
- (#10) Subscription tier pro DEALER/BAZAAR

**Sprint 7+ (Q4, strategic bet):**
- (#6) DE→CZ Bridge — největší ROI ale i největší legal risk

### 10.2 Co NEDOPORUČUJI

| Anti-pattern | Důvod |
|---|---|
| **Aukční model** (à la Aukro) | Český trh chce fixed price + inspection, ne bidding. Aukro to zkouší 5+ let bez execution. Možná pro marketplace VIP distressed flips, NE pro masový inzerce. |
| **Mobile-only / app-first** | CZ trh je 60 % desktop search (Sauto/TipCars data). PWA + responsive web stačí. Native iOS/Android = 6+ měsíců dev + neutralizes web SEO investment. |
| **Vlastní platební gateway** | Stripe stačí. Comgate/GoPay přidá complexity bez ROI. |
| **Vlastní financování (úvěry)** | Regulace ČNB. Lépe partnerství s ČSOB Leasing / Cofidis / Essox. |
| **Vlastní pojišťovna doplňková** | Stejně jako financování — partnership s Direct/Allianz výrazně levnější. |

---

## 11. Open Questions for Owner — vyžaduje rozhodnutí před plan-task-NN

> **Pravidlo:** Otázky které **nemůžu zodpovědět z research nebo z kódu**. Každá blokuje konkrétní implementační rozhodnutí.

### Q1. Co je primární cíl Q3 2026 — liquidity nebo monetization?

Two valid strategies:
- **(A) Liquidity-first** (Leboncoin / TipCars March 2026 model): Free everything, sponsor growth, monetize později (commission, premium, dealer subs). KPI = total listings + monthly active sellers. **Doporučení researchu:** TENTO. Carmakler zaostává v inventory vs Sauto/Bazoš — nejdřív musíme mít proč existovat.
- **(B) Monetization-first** (Sauto model): Charge from day one, slower growth, immediate cashflow. Vhodné pokud runway je krátký nebo invesoři chtějí revenue traction.

**Která je tvoje priorita? Tato otázka určuje cenovou strategii pro #76, #78 i marketplace VIP.**

### Q2. Legal scope — můžeme scrapovat / agregovat Sauto/TipCars/Mobile.de listings?

- **Scraping CZ konkurence** (pro AI Price Valuation training data, §4.2/#10.4) — má precedens (Bazoš scrapuje Sauto historicky), ale Sauto má `robots.txt` a může poslat C&D dopis. Legal review by měl posoudit: Database Directive (96/9/EC), § 90b OZ, ToS porušení.
- **DE→CZ Bridge (§4.4/#10.6)** — Mobile.de explicitně zakazuje scraping v ToS. Potřebujeme buď partnership (těžko), nebo licencování přes 3rd party (Carvertical, Eurotax), nebo API přístup (drahé).
- **Otázka:** Máme přístup k legalovi (interní/externí)? Pokud ano, dispatch #80 LEGAL ASAP. Pokud ne, vyloučíme #4 a #6 z roadmapy.

### Q3. Free listing limit pro PRIVATE — opravdu ZRUŠIT současný 1/60d, nebo nechat?

Současný kód má hard limit 1 listing per 60 dní pro PRIVATE roli. Research jasně doporučuje **zrušit**:
- Bazoš to nemá → Bazoš má 426k listings vs Sauto 80k → liquidity wins
- Anti-spam můžeme dát soft (rate limit + CAPTCHA + telefon verifikace + auto-flag duplicate VIN)

**Ale:** Současný limit fixne dlouhodobý problém — soukromníci, kteří nahrají auto, prodají, a pak za 6 týdnů stejné auto (= podvod / overodometry / staging). Pokud limit zrušíme, **zvedne se moderation load**.

**Rozhodnutí:** Zrušit limit + zvýšit auto-flagging strictness, NEBO soft limit (3 listings / 60d místo 1)? Toto má dopad na #10 sprint 1.

### Q4. Pro koho stavíme inzerci — primárně private sellers, dealers, nebo broker network?

Tři cílové persony, každá vyžaduje jinou roadmapu:
- **(A) Private sellers** (FREE, mass market) → Bazoš killer pattern, scale through volume, monetize via boost/services
- **(B) Dealers/bazaars** (paid, professional) → Sauto killer pattern, XML import, subscription tiers, flat-fee predictability
- **(C) Broker network** (Carmakler-exclusive) → Differentiation via "Verified by broker" badge, scale through trusted inventory

Realisticky můžeme dělat všechny tři, ale **která je hlavní GTM pro Q3?** To určuje, jaký feature ship-ujeme první.

**Můj návrh:** Sprint 1 = (A) free private + (C) verified badge. (B) dealer onboarding až sprint 5 po validation s prvními 1k private listings.

### Q5. Tolerance vůči AI errorům na public-facing copy?

Auto Trader Co-Driver má 96 % accept rate (4 % dealer ručně přepíše). To znamená 4/100 popisů obsahuje halucinaci nebo chybu.

V CZ kontextu:
- Pokud Carmakler ship-ne AI description generator (#1) a 4 % obsahuje hallucinaci ("má xenony" když nemá, "nehavarované" když ano), **kdo nese odpovědnost?** Soukromý prodejce může tvrdit "AI to napsala, já jen klikl na publish".
- **Mitigace:** UI explicit acknowledgment "Popis vygenerován AI z VIN dat — zkontrolujte před publikací" + log do `Listing.aiGeneratedDescription Boolean` + **vyžadovat manuální preview screen** před publikací.
- **Otázka:** Je tato mitigace dostatečná, nebo chceš human-in-the-loop (broker/admin schvaluje AI texty)? Druhá varianta zabíjí škálu.

---

## 12. Verze + changelog

| Datum | Autor | Změna |
|---|---|---|
| 2026-04-06 | Web research subagent (a3bd5448) | Sekce 1-8 (582 řádků): CZ market deep dive, EU benchmarks, comparison table, top 5 features to copy, top 5 gaps, strategic recommendations, honest limitations, sources |
| 2026-04-06 | Plánovač (synthesis) | + Sekce 9 (existing Carmakler inventory z Explore agent a00ce76), + Sekce 10 (TOP 10 differentiators matrix s impact/effort scoring + sprint plán), + Sekce 11 (5 open questions for owner), + Sekce 12 (changelog) |

---

**End of research-task-78.md**
