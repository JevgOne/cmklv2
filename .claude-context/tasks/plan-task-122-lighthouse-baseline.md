---
task_id: 122
queue_id: 107
type: PLAN
agent: planovac
status: draft
created: 2026-04-07
estimate: M (medium)
related_tasks:
  - "#82 PERF — plan-task-82.md (parent — Phase 1-5 perf hybrid strategy)"
  - "#82b TEST-CHROME (#106) — subdomain rewrite verification (parallel P0 BLOCKER)"
  - "#82d IMPL Phase 1 — route group split (blockedBy: #107 + #106)"
  - "#82e-#82h IMPL Phase 2-5 — sequenční (každá phase trigger after-snapshot)"
  - "#123 IMPL — implementace tohoto plánu (developer)"
  - "#91 SEO MVP slice — completed, ROI = 0% dokud Phase 1"
---

# #107 (#82c) PLAN — Lighthouse baseline benchmark

## 0 — Executive summary (TL;DR)

**Cíl:** Vytvořit reprodukovatelný Lighthouse baseline benchmark systém, který poskytne **before-Phase-1 snapshot** Core Web Vitals + Lighthouse skóre pro `https://carmakler.cz` + 3 subdomény, abychom mohli kvantifikovat perf benefit Phase 1-5 z plan-task-82.md.

**Klíčové rozhodnutí (k schválení):**
- **Tooling:** Lighthouse CI (`@lhci/cli`) jako primary, samostatný `lighthouse` CLI jako fallback pro one-shot debug. NE Chrome DevTools manual (nereprodukovatelné).
- **Target:** **PRODUCTION** (`https://carmakler.cz` etc.) — ne lokální dev server. Důvod: chceme reálné CDN/cold-start metriky které představují skutečnou uživatelskou zkušenost.
- **Throttling default:** Mobile slow 4G (`provided` profil v lhci) — per CLAUDE.md mobile-first. Druhý preset: desktop pro srovnání.
- **Runy per page:** 5 (median agregace) — Lighthouse má cca ±10% varianci, 5 runů potlačí outliers.
- **Storage:** `.claude-context/perf/baseline-2026-04-07/` s JSON files per page + summary markdown.
- **Reporting:** Markdown tabulka před/po Phase, automatický diff via `lhci-compare` + custom script.
- **CI integration:** **NE** — manual one-shot per Phase trigger. Důvod: lhci proti produkci v každém PR by spotřeboval ~10 min builds + spam Vercel resources, ROI low.
- **Deliverables pro #123 IMPL:** (a) `lighthouserc.json` config, (b) `scripts/lighthouse-baseline.sh` automation, (c) `.claude-context/perf/baseline-2026-04-07.json` první snapshot, (d) `.claude-context/perf/methodology.md` doc, (e) `scripts/lighthouse-compare.ts` before/after diff generator, (f) `lhci/` artifacts directory v `.gitignore` (raw HTML reports).

**Estimate:** M (medium) — ~4-6 h dev work pro #123 (lhci setup + 9 URL benchmark + compare script + first baseline run + commit + dokumentace).

**Sequencing:** #107 PLAN (tento) → schválení → #123 IMPL → first baseline run → commit → unblock #82d IMPL Phase 1.

---

## 1 — Background + cíl

### 1.1 Proč #82c potřebujeme

Plan-task-82.md (#82 PERF) identifikoval že celý `app/(web)/*` strom je dynamický (SSR-on-every-request) kvůli `(web)/layout.tsx:47 await headers()` bug. Phase 1 (route group split) tento bug odstraní → ~95 z 124 stránek se stane SSG/ISR-cached.

**Bez baseline measurement:**
- Nelze prokázat že Phase 1 přinesla měřitelný benefit
- Nelze quantifikovat ROI z #82 práce (~7-12 dnů calendar pro 5 phase)
- Nelze validovat AC v plan-task-82.md §12 metriky úspěchu (které mluví o "TTFB < 100 ms", "LCP improvement +300-600 ms" atd.)
- #91 SEO MVP ROI claim ("0% dokud Phase 1") bude verbální, ne measurable

**S baseline measurement:**
- Per-Phase before/after comparison s konkrétními ms hodnotami
- Quantified improvement: "homepage LCP 4.2s → 1.8s, -57%"
- Audit trail v `.claude-context/perf/` pro post-deploy reflection
- Dárce pro #87e (geo-benchmark monitoring) — sdílení metodologie

### 1.2 Cíl plánu

Specifikovat **all-in-one implementační plán** který developer #123 IMPL může 1:1 realizovat. Plán pokrývá:
1. Tooling rozhodnutí (lhci vs alternatives)
2. Page selection (kterých 9 URL)
3. Metric selection (které Core Web Vitals + Lighthouse score)
4. Methodology (runs, throttling, network, device)
5. Storage formátu (JSON snapshot files)
6. Reporting (markdown diff tables)
7. Automation script (.sh + .ts)
8. CI integration decision (manual one-shot vs CI workflow)
9. Sequencing kdy triggerovat after-snapshots
10. Acceptance criteria pro #123 IMPL

---

## 2 — Tooling decision

### 2.1 Kandidáti

| Tool | Pros | Cons | Verdict |
|------|------|------|---------|
| **`@lhci/cli` (Lighthouse CI)** | Designed for benchmark suites, JSON reports, baseline storage, comparison built-in, reuse Lighthouse engine | Setup overhead, vyžaduje Node 20+, lhci server (optional) | ✅ **PRIMARY** |
| **`lighthouse` CLI (samostatný)** | Jednoduchý, one-shot, ad-hoc debug | Nemá baseline storage, diff manuální, žádný batch mode | ✅ **FALLBACK** pro debug |
| **Chrome DevTools manual** | UI-driven, real Chrome, easy single-test | Nereprodukovatelné, nelze automatizovat, žádný history | ❌ **NE** |
| **PageSpeed Insights API** | Google-hosted, žádný local install, "real" CrUX data | Limit 25k requests/day, throttling fixed (slow 4G + Moto G4 — neguarantujeme stejné Chrome ver.), kombinace lab+field data zmate before/after porovnání | ❌ **NE** primary; možná P3 enrichment |
| **WebPageTest** | Komplexnější filmstrip, multi-location | Paid pro batch + private, slow CI integration | ❌ **NE** |
| **Vercel Speed Insights** | Vercel-native, real RUM | Vyžaduje `@vercel/speed-insights` package + Vercel deployment, RUM != lab data | ❌ **NE** primary; možná P3 doplnění po Phase 5 |

### 2.2 Rozhodnutí

**Primary:** `@lhci/cli` ≥ 0.13 (dev dep). Vyjmenované důvody:
- Reprodukovatelný (locked Chrome version z `chrome-launcher`)
- Batch mode přes `lighthouserc.json` URL list
- JSON output s konzistentní strukturou pro diff
- Built-in `assert` block (může fail CI pokud regression)
- Median aggregation z N runů
- Single binary `npx lhci collect` + `npx lhci upload`

**Fallback:** `lighthouse` CLI (peer dep z lhci) pro ad-hoc one-page debug:
```bash
npx lighthouse https://carmakler.cz/dily --preset=desktop --output=html --output-path=./debug.html
```

**Decision rationale:**
- Tým už má Playwright + Vitest → další test runner přijatelný overhead
- Žádný stávající perf baseline → nemůžeme zděděné lhci config využít
- Pre-Phase 1 stav je "all SSR" → high variance, potřebujeme median z 5 runů

### 2.3 NodeJS version compatibility

CI workflow používá `NODE_VERSION: "20"`. `@lhci/cli@0.13.x` vyžaduje Node ≥ 16, s Node 20 ✅ kompatibilní.

---

## 3 — Pages to benchmark (9 URL)

### 3.1 Selection criteria

Pages musí pokrývat:
1. **Vysoký SEO traffic potential** (homepage, SEO landing, /dily) — ROI Phase 1 benefitu
2. **Reprezentativní bucket coverage** — A (SSG), B (ISR), C (SSR with prisma), E (CSR client)
3. **Per-subdomain coverage** — main, inzerce, shop, marketplace
4. **Mix template kompexit** — homepage (hero + stats), listing (24 cards), detail (1 entity + related), CSR katalog
5. **Existence v produkci** — vyhneme se 404 (důvod: dummy seed dat na prod nemáme; sample IDs musí být real)

### 3.2 Final list — 9 URLs

| # | URL | Bucket (z plan-82) | Důvod |
|---|-----|-------------------|-------|
| 1 | `https://carmakler.cz/` | C → ISR (post Phase 1) | Homepage — highest traffic, hero stats |
| 2 | `https://carmakler.cz/nabidka/skoda/octavia` | A → SSG | Largest SEO landing wins (currently SSR despite being static) |
| 3 | `https://carmakler.cz/dily` | C → ISR | Parts homepage, latest 12 parts |
| 4 | `https://carmakler.cz/dily/vrakoviste/{slug}` | B → ISR (#91 ROI route) | **#91 SEO MVP ROI critical** — currently broken ISR |
| 5 | `https://carmakler.cz/dily/katalog` | E → SSR shell + island (Phase 5) | CSR katalog — shows JS bundle bloat |
| 6 | `https://carmakler.cz/inzerce` | C → ISR | Subdomain template variant |
| 7 | `https://carmakler.cz/marketplace` | D → SSR (zůstává) | Subdomain control — should NOT improve significantly |
| 8 | `https://carmakler.cz/o-nas` | C → ISR | Stats query page, future cache target |
| 9 | `https://carmakler.cz/jak-to-funguje` | A → SSG | Static landing currently misclassified ISR |

**Total:** 9 URLs × 2 presets (mobile, desktop) × 5 runs = **90 Lighthouse runs per benchmark**.
**Wall time:** ~10-15 minutes total (1 run ≈ 8-12 s).

### 3.3 Subdomain handling

> **Důležité:** Aktuálně `https://inzerce.carmakler.cz/` a `https://shop.carmakler.cz/` rewriteují interně na `/inzerce/*` a `/dily/*` (přes middleware). Pro #82c BASELINE benchmarkujeme **canonical paths na main domain** (`/inzerce`, `/dily`), nikoli subdomain hosts. Důvody:
> 1. #82b verifikuje subdomain bug → výsledek může změnit DNS approach
> 2. URL na main domain jsou stable target, subdomain stav je in flux
> 3. Lhci vyžaduje `assertions.url` match — držet to konzistentní

**Po Phase 1 + #82b verify:** Pokud subdomény fungují správně (route group split + DNS), lze přidat per-subdomain run jako separate batch. Plán to NEFIXUJE pro baseline — to je P3 follow-up.

### 3.4 Sample slugs (k ověření před baseline runem)

`{slug}` v URL #4 musí být **real production slug** (ne 404). Před baseline runem developer #123 spustí:
```bash
curl -sI https://carmakler.cz/dily/vrakoviste/auto-vrakoviste-praha
# pokud 200 → použít, pokud 404 → fetch z `prisma.partner.findFirst({ where: { type: "VRAKOVISTE", status: "AKTIVNI_PARTNER" }, select: { slug: true } })`
```

**Acceptance:** All 9 URLs must return HTTP 200 in baseline run. 4xx/5xx → STOP, fix URL list, re-run.

---

## 4 — Metrics + thresholds (Core Web Vitals 2025)

### 4.1 Tracked metrics (z lhci JSON output)

| Metric | Lighthouse audit ID | Unit | "Good" threshold (2025) | Why we track |
|--------|---------------------|------|-------------------------|--------------|
| **LCP** (Largest Contentful Paint) | `largest-contentful-paint` | ms | ≤ 2500 ms | Core Web Vital — main perceptual loading speed |
| **INP** (Interaction to Next Paint) | `interaction-to-next-paint` | ms | ≤ 200 ms | Core Web Vital — replaced FID in March 2024 |
| **CLS** (Cumulative Layout Shift) | `cumulative-layout-shift` | unitless | ≤ 0.1 | Core Web Vital — visual stability |
| **FCP** (First Contentful Paint) | `first-contentful-paint` | ms | ≤ 1800 ms | First paint of any DOM content |
| **TBT** (Total Blocking Time) | `total-blocking-time` | ms | ≤ 200 ms | Lab proxy for INP (real INP needs RUM) |
| **TTFB** (Time to First Byte) | `server-response-time` | ms | ≤ 800 ms | Server response — direct measure of SSR vs CDN cache hit |
| **Speed Index** | `speed-index` | ms | ≤ 3400 ms | Visual progress over time |
| **Performance Score** | `categories.performance.score × 100` | 0-100 | ≥ 90 | Aggregate Lighthouse score |
| **Accessibility Score** | `categories.accessibility.score × 100` | 0-100 | ≥ 90 | A11y WCAG audit (#82 reused) |
| **Best Practices Score** | `categories['best-practices'].score × 100` | 0-100 | ≥ 90 | Modern best practices (HTTPS, deprecated APIs, etc.) |
| **SEO Score** | `categories.seo.score × 100` | 0-100 | ≥ 90 | Lighthouse SEO audit (titles, meta, viewport) |
| **JS Bundle Size** (transferred) | `total-byte-weight` + `resource-summary.script.transferSize` | KB | ≤ 200 KB JS | Phase 5 katalog refactor target |

### 4.2 Lab vs Field

**Lighthouse measures lab data** (synthetic device, throttled network) — NE real-user RUM (Field/CrUX). Důsledek:
- INP zde je **TBT** (lab proxy), ne reálný INP z user interaction
- CrUX field data lze opt-in přes PageSpeed Insights API, ale to je P3 enrichment, ne baseline

**Důsledek pro reporting:** Vždy označit "Lab data, slow 4G mobile, 5-run median" v kontextu. Nikdy nepřipisovat lab čísla jako "skutečnou uživatelskou zkušenost".

### 4.3 Lighthouse version locking

`@lhci/cli@0.13.x` peer-deps `lighthouse@11.x`. Lock obě verze v `package.json` exact (nikoli `^`):
```json
{
  "devDependencies": {
    "@lhci/cli": "0.13.0",
    "lighthouse": "11.7.1"
  }
}
```
**Důvod:** Lighthouse mezi major verses změnil weight constants (např. v9 → v10 přidal INP); srovnání baseline (v11.7.1) → after-Phase-1 (v11.x.x) musí být same version. Při bumpu Lighthouse → re-run baseline + označit jako new epoch.

---

## 5 — Methodology (runs, throttling, devices)

### 5.1 Number of runs

**5 runs per (URL × preset)**, agregace = **median**.

**Rationale:**
- Lighthouse má známou variance ±5-10% mezi runy (CPU contention, network jitter)
- 5 runs s median je `lhci collect`'s default — lhci to handluje automaticky přes `numberOfRuns: 5`
- 3 runs by bylo levnější ale méně robustní; 10 runs by zlepšilo robustness o ~5% za 2x čas — 5 je sweet spot
- Median (ne mean) = robustní vůči outlier (jediný velký GC pause v #3 nezničí výsledek)

### 5.2 Network throttling presets

**Preset A — Mobile (default, primary):**
- `formFactor: "mobile"`
- `throttlingMethod: "simulate"` (ne devtools — simulate je deterministic, nezávislý na CPU host)
- `screenEmulation: { mobile: true, width: 360, height: 640, deviceScaleFactor: 2.625, disabled: false }` (Moto G4 default)
- `throttling.cpuSlowdownMultiplier: 4` (Lighthouse default for mobile)
- `throttling: { rttMs: 150, throughputKbps: 1638.4, requestLatencyMs: 562.5, downloadThroughputKbps: 1474.5600000000002, uploadThroughputKbps: 675 }` (Slow 4G)

**Preset B — Desktop (secondary, srovnání):**
- `formFactor: "desktop"`
- `screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }`
- `throttling.cpuSlowdownMultiplier: 1`
- `throttling: { rttMs: 40, throughputKbps: 10240, ... }` (Cable)

> **Mobile-first rationale:** CLAUDE.md říká "Mobile-first přístup". 65% českého auto-search trafficu je mobile (Sklik insights). Mobile baseline je primary KPI. Desktop slouží jako kontrola "headroom" (jak rychlé to je v ideálních podmínkách).

### 5.3 User Agent + locale

- `emulatedUserAgent: "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse"` (mobile preset default)
- Locale: `--locale=cs-CZ` — důležité pro českou stránku (ovlivňuje font loading, JS bundles s i18n keys)

### 5.4 Auth & cookies

**Žádný auth.** Všechny benchmarkované URLs jsou public (žádné `/muj-ucet/*` v listu §3.2).
- Cookies clearnuté mezi runy (lhci default)
- Žádný persistence storage state

### 5.5 Handling cold-start vs cached

Lhci defaultně dělá první "warm-up" run (discarded) ne. **Toto chování v lhci 0.13 NEINICIALIZUJE warm-up** — každý ze 5 runů je cold pro browser cache. Důsledek: prvních ~2-3 runy mohou ukázat horší TTFB pokud Vercel/CDN edge cache je cold. Median to robustně ignoruje.

**Důležité:** Lhci proti production NEMÁ explicit cache invalidation — jsme závislí na Vercel/CDN behaviour. Pre-Phase 1 (vše SSR) → cold start je every request anyway, baseline reflektuje real worst case.

### 5.6 Concurrent vs sequential

`numberOfRuns: 5`, `parallel: false` (default) — Lighthouse runs sequentially per URL. Důvod: paralelní runy by spotřebovaly stejný CPU/network → variance ↑ → median méně reliable.

**Total wall time estimate:**
- 9 URLs × 2 presets × 5 runs × ~10s/run = **~900s = 15 min**
- Plus lhci startup/teardown: ~17 min total

---

## 6 — Storage format

### 6.1 Directory structure

```
.claude-context/
  perf/
    methodology.md                   ← jak se měří, version of Lighthouse, throttling
    baseline-2026-04-07/             ← baseline epoch (jen 1× pre-Phase 1)
      mobile/
        run-summary.json             ← lhci output: 9 URLs × 5 runs medians
        homepage.json                ← raw lhci JSON per URL (debugging)
        nabidka-skoda-octavia.json
        dily.json
        dily-vrakoviste-{slug}.json
        dily-katalog.json
        inzerce.json
        marketplace.json
        o-nas.json
        jak-to-funguje.json
      desktop/
        run-summary.json
        ... (same 9 files)
      summary.md                     ← human-readable markdown table
      meta.json                      ← { lighthouse_version, chrome_version, run_date, git_commit, env: 'production' }
    after-phase-1/                   ← po #82d Phase 1 IMPL deploy
      mobile/...
      desktop/...
      summary.md
      meta.json
      diff-vs-baseline.md            ← auto-generated diff table
    after-phase-2/                   ← po #82e
      ...
    after-phase-5/                   ← po #82h (final)
      ...
```

### 6.2 `meta.json` schema

```json
{
  "epoch": "baseline",
  "phase_completed": null,
  "run_date": "2026-04-08T12:34:56Z",
  "lighthouse_version": "11.7.1",
  "lhci_version": "0.13.0",
  "chrome_version": "120.0.6099.71",
  "git_commit": "e8f2ef3",
  "git_branch": "main",
  "target_env": "production",
  "target_base_url": "https://carmakler.cz",
  "preset": ["mobile", "desktop"],
  "runs_per_url": 5,
  "url_count": 9,
  "total_runs": 90,
  "wall_time_seconds": 1024,
  "operator": "developer-#123",
  "notes": "Pre-Phase-1 baseline. (web)/layout.tsx:47 await headers() bug active — all routes SSR."
}
```

### 6.3 `run-summary.json` schema (per preset)

Vychází z lhci `assert` JSON output, normalizováno do flat tabulky:

```json
{
  "preset": "mobile",
  "epoch": "baseline",
  "results": [
    {
      "url": "https://carmakler.cz/",
      "median_run_index": 2,
      "metrics": {
        "lcp_ms": 4287,
        "inp_ms": null,
        "cls": 0.05,
        "fcp_ms": 2103,
        "tbt_ms": 540,
        "ttfb_ms": 812,
        "speed_index_ms": 4012,
        "performance_score": 47,
        "accessibility_score": 92,
        "best_practices_score": 96,
        "seo_score": 100,
        "total_byte_weight_kb": 1840,
        "script_transfer_size_kb": 312
      },
      "raw_runs": [
        { "lcp_ms": 4501, "fcp_ms": 2200, ... },
        { "lcp_ms": 4287, "fcp_ms": 2103, ... },
        { "lcp_ms": 4156, "fcp_ms": 2050, ... },
        { "lcp_ms": 4310, "fcp_ms": 2150, ... },
        { "lcp_ms": 4178, "fcp_ms": 2090, ... }
      ]
    },
    { "url": "https://carmakler.cz/nabidka/skoda/octavia", ... },
    ...
  ]
}
```

> **`raw_runs`** je důležitý pro post-mortem outlier analysis. Pokud po Phase 1 vidíme variance se zvýšila, raw_runs umožní identifikovat anomálie.

### 6.4 Git tracking decision

**Track v gitu:** `.claude-context/perf/**/run-summary.json`, `meta.json`, `summary.md`, `diff-vs-baseline.md`, `methodology.md`. Tedy **strukturovaná data + reporty**.

**NE track:** raw HTML reports z lhci (`.lighthouseci/` artifacts), `.lighthouseci/lhr-*.html` — tyto jsou velké (~1-2 MB každý), low signal-to-noise pro git history. Add do `.gitignore`:
```
.lighthouseci/
```

> **Zdůvodnění:** Strukturované JSON ~50 KB total per epoch, reporty ~500 KB. Acceptable git history bloat. Raw HTML jsou debug-only, dev je vygeneruje když potřebuje.

---

## 7 — Reporting format

### 7.1 `summary.md` (per epoch)

Generated by `scripts/lighthouse-summary.ts` z `run-summary.json`.

```markdown
# Lighthouse Baseline — Epoch: baseline (Pre-Phase-1)

**Run date:** 2026-04-08 12:34:56 UTC
**Lighthouse:** 11.7.1 / Chrome 120.0.6099.71
**Git commit:** e8f2ef3 (main)
**Target:** production (https://carmakler.cz)
**Methodology:** 9 URLs × 2 presets × 5 runs = 90 Lighthouse runs (median agregace)

## Mobile (Slow 4G, Moto G Power CPU 4×, 360×640)

| URL | Perf | LCP | TBT | CLS | TTFB | FCP | SI | A11y | SEO |
|-----|-----:|----:|----:|----:|-----:|----:|---:|-----:|----:|
| / | 47 | 4287 | 540 | 0.05 | 812 | 2103 | 4012 | 92 | 100 |
| /nabidka/skoda/octavia | 52 | 3891 | 421 | 0.03 | 723 | 1843 | 3645 | 95 | 100 |
| /dily | 49 | 4012 | 480 | 0.04 | 765 | 1980 | 3812 | 93 | 98 |
| /dily/vrakoviste/{slug} | 44 | 4582 | 612 | 0.06 | 901 | 2280 | 4254 | 91 | 98 |
| /dily/katalog | 31 | 5102 | 850 | 0.08 | 745 | 2410 | 4823 | 89 | 92 |
| /inzerce | 48 | 4123 | 502 | 0.05 | 798 | 2034 | 3920 | 92 | 99 |
| /marketplace | 51 | 3950 | 460 | 0.04 | 780 | 1990 | 3756 | 94 | 100 |
| /o-nas | 50 | 3982 | 490 | 0.05 | 790 | 2010 | 3812 | 94 | 100 |
| /jak-to-funguje | 53 | 3823 | 410 | 0.03 | 715 | 1820 | 3601 | 96 | 100 |
| **Median** | **49** | **4012** | **490** | **0.05** | **780** | **2010** | **3812** | **93** | **100** |

## Desktop (Cable, 1350×940, CPU 1×)

(stejná tabulka)

## Bundle weight

| URL | Total KB | JS KB | Img KB |
|-----|---------:|------:|-------:|
| / | 1840 | 312 | 980 |
| /dily/katalog | 2540 | 645 | 720 |
| ... | ... | ... | ... |
```

### 7.2 `diff-vs-baseline.md` (per phase epoch)

Generated by `scripts/lighthouse-compare.ts` z `baseline-*/run-summary.json` + `after-phase-N/run-summary.json`.

```markdown
# Lighthouse Phase 1 Improvement vs Baseline

**Baseline:** 2026-04-08 (commit e8f2ef3) — pre route group split
**After Phase 1:** 2026-04-15 (commit abc1234) — post #82d IMPL

## Mobile — improvement table

| URL | LCP Δ | TBT Δ | TTFB Δ | Perf Δ | Verdict |
|-----|------:|------:|-------:|-------:|---------|
| / | -2087ms (-49%) | -340ms (-63%) | -762ms (-94%) | +35 (47→82) | ✅ MAJOR |
| /nabidka/skoda/octavia | -2891ms (-74%) | -371ms (-88%) | -698ms (-97%) | +41 (52→93) | ✅ MAJOR (SSG win) |
| /dily/vrakoviste/{slug} | -2782ms (-61%) | -512ms (-84%) | -851ms (-94%) | +44 (44→88) | ✅ #91 ROI realized |
| /dily/katalog | -502ms (-10%) | -50ms (-6%) | -45ms (-6%) | +5 (31→36) | ⚠️ Minor — Phase 5 needed |
| /marketplace | -50ms (-1%) | -10ms (-2%) | -30ms (-4%) | 0 (51→51) | ⚪ No change (expected — SSR by design) |
| **Median** | -2087ms (-52%) | -340ms (-69%) | -762ms (-97%) | +35 | |

## Per-route bucket validation

| Bucket | Routes | Expected behavior | Observed |
|--------|--------|-------------------|----------|
| A — SSG | / + /nabidka/* + /jak-to-funguje | TTFB < 100ms (CDN edge) | ✅ TTFB 35-78ms |
| B — ISR | /dily/vrakoviste/{slug} | TTFB < 150ms (CDN cache hit) | ✅ TTFB 50ms (cache hit), 320ms (revalidate) |
| C — ISR | / homepage, /dily, /inzerce | TTFB < 200ms | ✅ TTFB 80-150ms |
| D — SSR | /marketplace | TTFB ≥ 500ms (no change) | ✅ 750ms (unchanged) |
| E — CSR | /dily/katalog | LCP ≥ 4s (Phase 5 not yet) | ✅ 4600ms (no change yet) |

## Acceptance criteria z plan-task-82.md §12 metriky

| Metric | Target (z plan-82) | Baseline | After P1 | Status |
|--------|--------------------|----:|------:|:------:|
| TTFB homepage | < 100 ms (cache hit) | 812 ms | 50 ms | ✅ |
| TTFB SEO landing | < 50 ms (CDN edge) | 723 ms | 35 ms | ✅ |
| Perf score / | +20 | 47 | 82 | ✅ +35 |
| Vercel cache hit ratio | > 60% | (RUM N/A pre-fix) | (TBD post-deploy 7d) | ⏳ |
```

### 7.3 Reporting frequency

| Trigger | Output | Where to read |
|---------|--------|---------------|
| Baseline (1× pre-Phase 1) | `baseline-2026-04-07/summary.md` | Manual review by team-lead before #82d dispatch |
| Po #82d Phase 1 | `after-phase-1/diff-vs-baseline.md` | Validate AC1.1-AC1.7 in plan-task-82.md §6.1 |
| Po #82e Phase 2 | `after-phase-2/diff-vs-baseline.md` (cumulative) | Phase 2 cleanup verification |
| Po #82f Phase 3 | `after-phase-3/diff-vs-baseline.md` | Bucket C ISR migrace verification |
| Po #82g Phase 4 | `after-phase-4/diff-vs-baseline.md` | Mutation hooks invalidation check |
| Po #82h Phase 5 | `after-phase-5/diff-vs-baseline.md` (final) | Katalog SSR shell, Phase 5 AC5.4 (-50% JS) |

---

## 8 — Automation scripts

### 8.1 `lighthouserc.json` (lhci config)

```json
{
  "ci": {
    "collect": {
      "url": [
        "https://carmakler.cz/",
        "https://carmakler.cz/nabidka/skoda/octavia",
        "https://carmakler.cz/dily",
        "https://carmakler.cz/dily/vrakoviste/REPLACE_WITH_REAL_SLUG",
        "https://carmakler.cz/dily/katalog",
        "https://carmakler.cz/inzerce",
        "https://carmakler.cz/marketplace",
        "https://carmakler.cz/o-nas",
        "https://carmakler.cz/jak-to-funguje"
      ],
      "numberOfRuns": 5,
      "settings": {
        "preset": "perf",
        "locale": "cs-CZ",
        "throttlingMethod": "simulate",
        "formFactor": "mobile",
        "screenEmulation": {
          "mobile": true,
          "width": 360,
          "height": 640,
          "deviceScaleFactor": 2.625,
          "disabled": false
        },
        "throttling": {
          "rttMs": 150,
          "throughputKbps": 1638.4,
          "requestLatencyMs": 562.5,
          "downloadThroughputKbps": 1474.56,
          "uploadThroughputKbps": 675,
          "cpuSlowdownMultiplier": 4
        }
      }
    },
    "upload": {
      "target": "filesystem",
      "outputDir": "./.lighthouseci"
    }
  }
}
```

> **Note:** Pro desktop preset → druhý config soubor `lighthouserc.desktop.json` se stejnou strukturou ale `formFactor: "desktop"` + `throttling.cpuSlowdownMultiplier: 1` + Cable network.

### 8.2 `scripts/lighthouse-baseline.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# Lighthouse baseline collector — #82c
# Runs lhci collect for both presets, normalizes output, generates summary.

EPOCH="${1:-baseline-$(date -u +%Y-%m-%d)}"
PERF_DIR=".claude-context/perf/${EPOCH}"

echo "[lhci] Epoch: ${EPOCH}"
echo "[lhci] Output: ${PERF_DIR}"

mkdir -p "${PERF_DIR}/mobile" "${PERF_DIR}/desktop"

# Sanity check — all URLs return 200
echo "[lhci] Sanity check: all 9 URLs HTTP 200..."
URLS=(
  "https://carmakler.cz/"
  "https://carmakler.cz/nabidka/skoda/octavia"
  "https://carmakler.cz/dily"
  "https://carmakler.cz/dily/vrakoviste/REPLACE_WITH_REAL_SLUG"
  "https://carmakler.cz/dily/katalog"
  "https://carmakler.cz/inzerce"
  "https://carmakler.cz/marketplace"
  "https://carmakler.cz/o-nas"
  "https://carmakler.cz/jak-to-funguje"
)
for url in "${URLS[@]}"; do
  status=$(curl -sI -o /dev/null -w "%{http_code}" "$url" || echo "ERR")
  if [ "$status" != "200" ]; then
    echo "[lhci] ❌ FAIL: $url returned $status"
    exit 1
  fi
done
echo "[lhci] ✅ All URLs OK"

# Collect mobile preset
echo "[lhci] Mobile preset: 9 URLs × 5 runs..."
npx lhci collect --config=lighthouserc.mobile.json
mv .lighthouseci/* "${PERF_DIR}/mobile/" || true

# Collect desktop preset
echo "[lhci] Desktop preset: 9 URLs × 5 runs..."
npx lhci collect --config=lighthouserc.desktop.json
mv .lighthouseci/* "${PERF_DIR}/desktop/" || true

# Normalize JSON → run-summary.json (custom script)
echo "[lhci] Normalizing JSON output..."
npx tsx scripts/lighthouse-normalize.ts "${PERF_DIR}/mobile" > "${PERF_DIR}/mobile/run-summary.json"
npx tsx scripts/lighthouse-normalize.ts "${PERF_DIR}/desktop" > "${PERF_DIR}/desktop/run-summary.json"

# Generate summary.md
echo "[lhci] Generating summary.md..."
npx tsx scripts/lighthouse-summary.ts "${PERF_DIR}" > "${PERF_DIR}/summary.md"

# Generate meta.json
echo "[lhci] Writing meta.json..."
npx tsx scripts/lighthouse-meta.ts "${PERF_DIR}" "${EPOCH}"

echo "[lhci] ✅ Done. Output: ${PERF_DIR}/summary.md"
```

### 8.3 `scripts/lighthouse-normalize.ts` (TypeScript)

Reads raw lhci JSON output (multiple `lhr-*.json` files per URL), extracts metrics, computes median per URL, outputs `run-summary.json` (per §6.3 schema).

**Key logic:**
```typescript
// Pseudo-code
import fs from "node:fs";
import path from "node:path";

interface LhrJson {
  finalUrl: string;
  audits: Record<string, { numericValue?: number; score?: number }>;
  categories: Record<string, { score: number }>;
}

function extractMetrics(lhr: LhrJson) {
  return {
    lcp_ms: lhr.audits["largest-contentful-paint"]?.numericValue ?? null,
    fcp_ms: lhr.audits["first-contentful-paint"]?.numericValue ?? null,
    tbt_ms: lhr.audits["total-blocking-time"]?.numericValue ?? null,
    cls: lhr.audits["cumulative-layout-shift"]?.numericValue ?? null,
    ttfb_ms: lhr.audits["server-response-time"]?.numericValue ?? null,
    speed_index_ms: lhr.audits["speed-index"]?.numericValue ?? null,
    performance_score: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    accessibility_score: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
    best_practices_score: Math.round((lhr.categories["best-practices"]?.score ?? 0) * 100),
    seo_score: Math.round((lhr.categories.seo?.score ?? 0) * 100),
  };
}

function median<T>(arr: T[], key: keyof T): number | null {
  const values = arr.map((r) => r[key] as unknown as number).filter((v) => v != null);
  if (values.length === 0) return null;
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

// Main: group lhr-*.json by URL → compute median per metric → emit run-summary.json
```

### 8.4 `scripts/lighthouse-summary.ts`

Reads `mobile/run-summary.json` + `desktop/run-summary.json` from epoch dir, generates `summary.md` markdown table per §7.1.

### 8.5 `scripts/lighthouse-compare.ts` (before/after diff)

```bash
npx tsx scripts/lighthouse-compare.ts \
  --baseline .claude-context/perf/baseline-2026-04-07 \
  --after .claude-context/perf/after-phase-1
```

Outputs `diff-vs-baseline.md` (§7.2 format) into the `--after` directory. Computes:
- Δ ms (absolute) and Δ % (relative)
- Verdict (✅ MAJOR if -20%+, ⚠️ Minor if -5 to -20%, ⚪ No change, ❌ REGRESSION if +5%+)
- Bucket validation (per §7.2 table)
- AC mapping (per §7.2 table)

### 8.6 `scripts/lighthouse-meta.ts`

Writes `meta.json` (per §6.2 schema) into epoch dir. Reads:
- `npx lighthouse --version` → `lighthouse_version`
- `npx lhci --version` → `lhci_version`
- Chrome version z `chrome.runtimeVersion` v lhr JSON
- `git rev-parse HEAD` → `git_commit`
- `git rev-parse --abbrev-ref HEAD` → `git_branch`

---

## 9 — CI integration decision

### 9.1 Options

**Option A — Manual one-shot per Phase trigger** (RECOMMENDED)
- Developer/QA spustí `npm run lighthouse:baseline` lokálně po dokončení každé Phase
- Output commitne do `.claude-context/perf/after-phase-N/`
- Pros: žádný CI cost, žádný spam Vercel resources, dev má kontrolu nad timing
- Cons: vyžaduje manual discipline, nelze auto-fail PR pokud Phase regression

**Option B — CI workflow on every PR**
- Lhci proti production v GitHub Actions on PR open/update
- Auto-fail pokud regression > 5%
- Pros: automatic regression detection
- Cons: ~17 min per PR, spam Vercel resources, 90 LH runs × every PR = noisy CrUX, lhci proti production je weird (hits prod cache)

**Option C — Scheduled cron 1× denně**
- GitHub Actions cron: `0 4 * * *` (daily 04:00 UTC)
- Compares to last day baseline, alerts in Slack if regression
- Pros: continuous monitoring without PR spam
- Cons: žádný direct action on regression, needs Slack webhook setup, false alarms from CrUX/Vercel cache cold-start

### 9.2 Verdict: Option A

**Doporučení:** **Option A — manual one-shot per Phase trigger.**

**Důvody:**
1. Phase 1-5 jsou one-time refactor work, ne ongoing iterace → continuous monitoring není potřeba
2. lhci proti production v každém PR = 90 LH runs × 5 PRs/day = 450 runs/day = pollution baseline (Vercel cache stratification)
3. Manual run dává devovi kontrolu — může zvolit "stable production state" (žádný deploy v posledních 30 min)
4. Per-Phase trigger jasně asociuje after-snapshot s konkrétním deploy → audit trail jasný
5. Žádný CI cost, žádný GitHub Actions minute waste

**Future:** Po Phase 5 dokončena → reconsider Option C (scheduled cron) jako P3 ongoing monitoring (separate task #TBD).

### 9.3 npm scripts to add

```json
{
  "scripts": {
    "lighthouse:baseline": "bash scripts/lighthouse-baseline.sh baseline-$(date -u +%Y-%m-%d)",
    "lighthouse:after-phase-1": "bash scripts/lighthouse-baseline.sh after-phase-1",
    "lighthouse:after-phase-2": "bash scripts/lighthouse-baseline.sh after-phase-2",
    "lighthouse:after-phase-3": "bash scripts/lighthouse-baseline.sh after-phase-3",
    "lighthouse:after-phase-4": "bash scripts/lighthouse-baseline.sh after-phase-4",
    "lighthouse:after-phase-5": "bash scripts/lighthouse-baseline.sh after-phase-5",
    "lighthouse:compare": "tsx scripts/lighthouse-compare.ts"
  }
}
```

---

## 10 — Deliverables pro #123 IMPL

### 10.1 Files to create

| Path | Type | Purpose |
|------|------|---------|
| `lighthouserc.mobile.json` | config | lhci mobile preset config (per §8.1) |
| `lighthouserc.desktop.json` | config | lhci desktop preset config |
| `scripts/lighthouse-baseline.sh` | bash | Main entry — collect + normalize + summary |
| `scripts/lighthouse-normalize.ts` | TS | Raw lhci JSON → run-summary.json |
| `scripts/lighthouse-summary.ts` | TS | run-summary.json → summary.md |
| `scripts/lighthouse-compare.ts` | TS | baseline + after → diff-vs-baseline.md |
| `scripts/lighthouse-meta.ts` | TS | Write meta.json with versions/git context |
| `.claude-context/perf/methodology.md` | docs | Static doc — how we measure, version locks, throttling specifics |
| `.claude-context/perf/baseline-2026-04-07/` | directory | First baseline epoch — 9 URLs × 2 presets × 5 runs |
| `.claude-context/perf/baseline-2026-04-07/summary.md` | output | Human-readable baseline table |
| `.claude-context/perf/baseline-2026-04-07/meta.json` | output | Baseline meta (Lighthouse version, git commit, etc.) |
| `.claude-context/perf/baseline-2026-04-07/mobile/run-summary.json` | output | Normalized mobile metrics |
| `.claude-context/perf/baseline-2026-04-07/desktop/run-summary.json` | output | Normalized desktop metrics |
| `.gitignore` | edit | Append `.lighthouseci/` (raw HTML reports) |
| `package.json` | edit | Add lhci + lighthouse devDeps + 7 scripts |
| `README.md` (optional) | edit | Document `npm run lighthouse:baseline` workflow (~10 lines) |

### 10.2 Acceptance criteria pro #123 IMPL

- **AC1:** `npm run lighthouse:baseline` exit 0 + generuje complete `.claude-context/perf/baseline-2026-04-07/` directory
- **AC2:** `summary.md` obsahuje 9 řádků (URLs) × 11 sloupců (metric columns) × 2 presets (mobile + desktop)
- **AC3:** `meta.json` má všech 13 polí ze §6.2 schema
- **AC4:** Wall time ≤ 25 min (acceptable for one-shot)
- **AC5:** All 9 URLs HTTP 200 sanity check pass (žádný 404 v listu)
- **AC6:** Lighthouse versions locked v `package.json` (exact, ne `^`)
- **AC7:** `.lighthouseci/` v `.gitignore`, `run-summary.json` + `meta.json` + `summary.md` committed
- **AC8:** `npm run lighthouse:compare --baseline=... --after=...` exit 0 (i když after-dir je prázdný — graceful error)
- **AC9:** Lhci dependencies přidány do `devDependencies` (ne `dependencies`)
- **AC10:** Žádný impact na CI — `.github/workflows/ci.yml` NEMĚNÍT (Option A means manual)
- **AC11:** Baseline data shows current "broken state" — TTFB > 500 ms na všech routes (validuje #82 root-cause finding)

### 10.3 Estimate pro #123

- lhci setup + config (lighthouserc.json × 2): ~30 min
- normalize.ts script: ~60 min (JSON parsing + median compute)
- summary.ts script: ~45 min (markdown table generator)
- compare.ts script: ~60 min (diff logic + verdict + bucket validation)
- meta.ts script: ~15 min (git + version queries)
- baseline.sh wrapper: ~30 min (sanity check + wrap commands)
- methodology.md doc: ~30 min
- First baseline run: ~25 min wall time + ~15 min review + commit
- README update: ~10 min

**Total:** ~5 hodin dev work + 25 min wall time

---

## 11 — Sequencing — kdy spouštět after-snapshots

```
#107 PLAN (tento) → schválení → #123 IMPL → 1× baseline run → commit
                                                ↓
                                #82d IMPL Phase 1 (route group split)
                                                ↓
                                Manual: npm run lighthouse:after-phase-1
                                        npm run lighthouse:compare
                                                ↓
                                Validate AC1.1-AC1.7 plan-task-82.md §6.1
                                                ↓
                                #82e IMPL Phase 2 (Bucket A cleanup)
                                                ↓
                                Manual: npm run lighthouse:after-phase-2
                                                ↓
                                ... (Phases 3, 4, 5)
                                                ↓
                                Final: after-phase-5 + final diff report
```

**Timing pravidla:**
- After-snapshot spustit **min 30 minut po deploy** (Vercel cache warm-up + CDN propagace)
- Spustit ze stejného developer-machine pokud možná (eliminace machine variance) — minimálně z dev's stable Wi-Fi connection
- NESTOUSHTĚT after-snapshot pokud production měl deploy během posledních 5 min (pendint Vercel revalidation)

---

## 12 — Risks & mitigations

| Risk | Pravděpodobnost | Dopad | Mitigace |
|------|----:|----:|---------|
| `dily/vrakoviste/{slug}` slug 404 in CI | Low | High | §3.4 sanity check; fail-fast lhci spuštění |
| Lighthouse version drift mezi epochami | Low | High | Exact version lock v `package.json`; meta.json captures version |
| Variance mezi runy ±15% (mobile flaky) | Med | Med | 5-run median; pokud variance > 20% → re-run + flag epoch as "noisy" |
| Vercel cache cold-start zkresluje TTFB baseline | Med | Low | 5 runs sekvenčně → druhý run je warm; dokumentovat v meta.json `notes` |
| Prod stability — random Vercel outage during run | Low | Med | Sanity check 200 PŘED batch; retry logic v lhci default |
| Bash script Mac vs Linux | Low | Low | Použít POSIX-compatible bash; `set -euo pipefail` |
| Git history bloat z perf/ JSON | Low | Low | JSON ~50 KB per epoch × 6 epoch = 300 KB total — acceptable |
| Developer zapomene spustit after-snapshot | Med | Med | Acceptance criteria v každém #82e-#82h IMPL task: "po deploy spustit `npm run lighthouse:after-phase-N`" |
| `lhci collect` selže pokud production CSP blokuje script injection | Low | Med | Lhci defaultně injectuje pageScript pro INP measurement; ověřit že `next.config.ts` CSP umožňuje inline scripts pro `localhost` (lhci běží lokálně, ne v iframe na carmakler.cz) — actually neaplikuje, lhci spawne vlastní Chrome ne iframe |
| Cookie banner blokuje LCP measurement | Med | Med | Lhci může injectovat cookies přes `extraHeaders` setting; po prvním runu zkontrolovat raw HTML report že LCP element je hlavní content, ne cookie banner |

### 12.1 Cookie banner risk — řešení

**Risk:** Carmakler má cookie consent banner (checkneme — pravděpodobně AnalyticsConsent). Pokud banner pokrývá hero section, Lighthouse to identifikuje jako LCP element → metrika znamená "time to render banner", ne "time to render hero".

**Mitigation pro #123 IMPL:**
1. První run — checknout `lhr.audits["largest-contentful-paint"].details` v raw JSON: která element je LCP?
2. Pokud LCP element je banner → bypass via `extraHeaders` cookie injection v lighthouserc:
   ```json
   "extraHeaders": {
     "Cookie": "cookie-consent=accepted"
   }
   ```
3. Re-run + verify že LCP element se přesunul na hero
4. Document v `methodology.md` cookie bypass approach (důležité pro future epochs)

---

## 13 — Open questions pro team-leada

> **✅ VŠECHNY RESOLVED — team-lead dispatch 2026-04-07**
>
> | Q | Rozhodnutí | Poznámka |
> |---|---|---|
> | **Q1** Lhci vs Speed Insights primary | ✅ **Lhci primary** | Speed Insights P3 follow-up po Phase 5 |
> | **Q2** Mobile + desktop oba | ✅ **OBA** | Mobile primary, desktop control. +5 min runtime za úplnost |
> | **Q3** Git tracking rozsah | ✅ **Option A** (JSON + summary.md, ~50 KB/epoch) | Raw HTML jen ad-hoc |
> | **Q4** Vrakoviště slug | ✅ **Vyber reálný slug podle prioritního seedu** | First vrakoviště s nejvíc parts (max content density). Pokud waiting on #91 SEO IMPL — alphabetically first nebo `vrakoviste-praha-1` placeholder. **NEBLOKOVAT** na slug volbě |
> | **Q5** Subdomény | ✅ **NE** | Canonical paths only. Subdomain rewrite proxy overhead měříme v post-#82b verify |
> | **Q6** Lhci server | ✅ **NE** | Filesystem target only |
> | **Q7** methodology.md rozsah | ✅ **Medium ~150 řádků** | How to run + versions + throttling + top 3 troubleshooting |
> | **Q8** Sequencing s #82b | ✅ **PARALLEL** | Lhci jen měří, nevolá write paths. Save kritický čas v sequencingu |
>
> **Cookie banner regression follow-up (Q4 elaboration):** Cookie consent banner zatím není implementován (per #82 §7). Až bude v Phase X přidán, baseline LCP může regredovat o ~200-400ms. **#122a follow-up** = re-baseline po cookie banner mergi. Mitigation pro #123 IMPL je v §12.1 (cookie injection via lhci `extraHeaders`).
>
> **#123 IMPL je unblocked** — paralelní dispatch s #106 #82b TEST-CHROME schválen.

---

### Q1 — Lighthouse vs Vercel Speed Insights jako primary?
Vercel Speed Insights (`@vercel/speed-insights` package) by poskytlo **real RUM data** namísto lab data. Pros: skutečné user experience. Cons: vyžaduje deploy + cookie consent + 7 dnů collection time pro statisticky valid sample.

**Doporučení:** Lhci jako primary baseline (lab data, fast cycle), Vercel Speed Insights jako P3 enrichment po Phase 5 (real RUM 30-day rolling window).

### Q2 — Mobile-only nebo mobile + desktop?
Plán doporučuje **oba** (mobile primary, desktop kontrola). 2x runs = 17 min wall time místo 9 min. Acceptable?

**Doporučení:** Oba — desktop poskytne "headroom" insights (jak rychlé to bude v ideálních podmínkách) a usnadní troubleshooting (pokud mobile zpomalí ale desktop ne → mobile-specific issue).

### Q3 — Git tracking rozsah perf/?
**Option A:** Track strukturovaná JSON + summary.md (~50 KB per epoch) ← **doporučeno**
**Option B:** Track i raw HTML reports (~2 MB per epoch × 6 = 12 MB) — useful pro audit ale velký
**Option C:** Track jen summary.md, JSON jen ad-hoc — nelze re-compute diff retroactively

**Doporučení:** Option A.

### Q4 — `dily/vrakoviste/{slug}` real production slug
Pre-baseline #123 musí findnout real slug. Mám doporučit konkrétní slug v plánu, nebo nechat na #123?

**Doporučení:** Nechat na #123 — slug v produkci se může změnit. #123 spustí curl HEAD check + použije první returned slug z `prisma.partner.findFirst({ where: { type: "VRAKOVISTE", status: "AKTIVNI_PARTNER" } })`. Document zvolený slug v `meta.json.notes`.

### Q5 — Subdomény (inzerce/shop/marketplace) jako separate URLs?
Aktuální plán bere **canonical paths** (`/inzerce`, `/dily`, `/marketplace`) na main domain. Proti subdomains (`https://inzerce.carmakler.cz/`):
- Pre-Phase 1: subdomain bug zkresluje výsledek (rendering wrong navbar/footer)
- Post-Phase 1: subdomain mapping může být refactored (route group split)

**Doporučení:** Zůstat u canonical paths. Po #82b confirms subdomain bug + Phase 1 fix → P3 follow-up: přidat per-subdomain runs jako separate batch v `after-phase-1` epoch (extra 9 URLs × 2 presets × 5 runs).

### Q6 — Lighthouse CI server (lhci server)?
Lhci podporuje hosted lhci server (mongoDB-backed) pro centralized historical reports. Setup overhead vysoký (Docker + DB), pro one-shot per Phase je overkill.

**Doporučení:** NE — používat `target: "filesystem"` v upload config. Když potřebujeme historical view → grep na `.claude-context/perf/*/summary.md`.

### Q7 — `methodology.md` doc rozsah
Mám doporučit minimalist doc (~50 řádků: how to run, what versions, throttling) nebo full doc (~300 řádků: rationale, version history, version compatibility, troubleshooting)?

**Doporučení:** Medium (~150 řádků) — covers how to run, versions, throttling, troubleshooting top 3 issues (cookie banner, slug 404, variance noise).

### Q8 — Před nebo po #82b TEST-CHROME?
#82c (#107) a #82b (#106) jsou oba P0 BLOCKERS pro #82d. Sequencing:
- **Option A:** #82c před #82b (lhci nepotřebuje subdomain validation)
- **Option B:** #82b před #82c (lhci výsledky mohou být zkreslené pokud subdomain bug aktivní)
- **Option C:** Paralelně (oba devs/agents pracují současně)

**Doporučení:** **Option C paralelně** — #82c lze začít hned (lhci proti `https://carmakler.cz/` canonical), #82b je separate Test-Chrome workflow. Žádný blocker mezi nimi.

---

## 14 — Akční kroky pro team-leada

1. **Schválit/upravit tento plán** — zejména §2 tooling decision (lhci primary), §3.2 URL list, §9.2 manual one-shot decision, §13 Q1-Q8 open questions
2. **Vyřešit Q1-Q8** (zejména Q5 subdomény, Q8 sequencing)
3. **Dispatch #123 IMPL** podle §10 deliverables
   - Owner: Developer
   - blockedBy: schválení tohoto plánu
   - Acceptance: §10.2 AC1-AC11
4. **Po #123 dokončení** — review `summary.md` baseline, schválit jako "official baseline epoch"
5. **Unblock #82d Phase 1 IMPL** (gating po #106 + #123 done)
6. **Budoucí Phase 1-5 IMPL tasks** musí mít AC: "po deploy spustit `npm run lighthouse:after-phase-N` + commit do `.claude-context/perf/after-phase-N/`"

---

## 15 — Souhrn pro Evžen review (volitelné)

**Co plán řeší:**
- Reprodukovatelný Lighthouse baseline benchmark systém
- 9 URLs × 2 presets × 5 runs methodology
- JSON storage + markdown reporting
- Per-Phase comparison automation
- Audit trail v `.claude-context/perf/` git-tracked

**Co plán NEŘEŠÍ (out of scope):**
- Real-user RUM (Vercel Speed Insights — P3 follow-up)
- PageSpeed Insights API CrUX field data (P3 enrichment)
- CI continuous monitoring (Option C — P3 follow-up po Phase 5)
- Lhci server hosted UI (žádný setup overhead pro one-shot)
- Subdomain-specific URLs (canonical paths only — P3 po #82b verify)

**Klíčové open questions:** §13 Q1-Q8 vyžadují team-lead schválení před #123 IMPL.

**Estimate:** M (medium) — ~5 h dev work + 25 min wall time pro první baseline run.

**Návaznost:** Tento plán je **P0 BLOCKER pro #82d Phase 1 IMPL** — bez baseline nelze měřit Phase 1 benefit.

---

## Konec plánu
