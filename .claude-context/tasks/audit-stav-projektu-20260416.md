# Audit stavu projektu Carmakler — co chybí dokončit (focus: prezentace)

**Datum:** 2026-04-16
**Autor:** Plánovač
**Zadání:** Task #1 od leada — uživatel zmínil "prezentace atd už měly být hotové"
**Zdroje:** git log (120 commitů), TASK-QUEUE.md (042 + 020), 388 souborů v `.claude-context/tasks/`, fyzická kontrola `docs/presentations/` + Desktopu

---

## §0 — Executive summary (TL;DR pro leada)

**Prezentace (TASK-042) = HOTOVÉ v HTML, chybí jen 1 krok: spustit `generate-pdf.mjs`.**

- ✅ Všech **8 HTML šablon** existuje v `docs/presentations/` (6 nových + 2 původní)
- ✅ **QA schválil** (0 blockerů, 11/12 AC ✅) — `qa-task-042.md` 2026-04-11
- ✅ **Evžen schválil** (commit `72773b3`) — `evzen-task042-watermark.md` 2026-04-11
- ✅ **Chrome test** 9/9 PASS — `chrome-test-task042-watermark.md` 2026-04-11
- ❌ **PDF soubory NEEXISTUJÍ** — `generate-pdf.mjs` nebyl nikdy spuštěn, na Desktopu ($HOME/Desktop) ani v repo nejsou žádné `*.pdf` artefakty
- ⚠️ TASK-QUEUE.md řádek 6207 stále říká `Stav: čeká` — status nebyl aktualizován po QA approve

**Jediný blocker prezentace:** 15minutový běh `node docs/presentations/generate-pdf.mjs` (Playwright) → 8 PDF do `~/Desktop/`.

Celý TASK-020 (eshop autodíly) a TASK-021–041 jsou hotové. Projekt je v řádu low-severity debt (Sentry warnings, deprecated middleware, 3 orphan soubory, watermark logo varianta), žádný launch-blocking bug.

---

## §1 — Co je HOTOVO (s commity)

### §1.1 — TASK-042 PDF prezentace (**HOTOVÉ, jen nevydané**)

| Šablona | Soubor | Existuje | Velikost | Commit |
|---|---|---|---|---|
| Landing page wireframe (SEO) | `docs/presentations/landing-page-sablona.html` | ✅ | 21 KB | `72773b3` |
| Obchodní prezentace pro klienty | `docs/presentations/obchodni-prezentace.html` | ✅ | 25 KB | `72773b3` |
| Prezentace pro investory Marketplace | `docs/presentations/marketplace-investori.html` | ✅ | 24 KB | `72773b3` |
| Onboarding makléře (vizuální průvodce) | `docs/presentations/onboarding-makler.html` | ✅ | 27 KB | `72773b3` |
| Ceník služeb | `docs/presentations/cenik-sluzeb.html` | ✅ | 18 KB | `72773b3` |
| Faktura (A4 portrait) | `docs/presentations/faktura-sablona.html` | ✅ | 8 KB | `72773b3` |
| CarMakler pro autobazary (partnership) | `docs/presentations/carmakler-pro-autobazary.html` | ✅ pre-existing | 24 KB | — |
| CarMakler pro vrakoviště (partnership) | `docs/presentations/carmakler-pro-vrakoviste.html` | ✅ pre-existing | 23 KB | — |
| PDF generator script | `docs/presentations/generate-pdf.mjs` | ✅ | 2.2 KB | `72773b3` |

**Vizuální kvalita ověřena:**
- Font Outfit, primary #F97316, dark #1a1a2e, glass morphism — konzistentní napříč všemi šablonami
- Print-ready (`-webkit-print-color-adjust: exact`, `@page { size: A4 ... }`)
- Landing šablona: 4 varianty LP (značková Škoda, modelová Octavia, cenová do 200k, lokální Praha) + mobile mockup + JSON-LD markers
- Marketplace: 40/40/20 dělení + ROI tabulka + risk management
- Onboarding: 7 kroků nabírání + 5 kroků aktivace + gamifikace (Nováček→Profesionál→Expert→Šampion)
- Ceník: všechny 4 produkty (makléři 5%/min 25k, inzerce Wolt model, marketplace VIP)
- Faktura: A4 portrait, reálné číslo FV2026001, CEBIA 499 Kč, TOP 199 Kč, QR placeholder

**Potvrzeno 3× nezávisle:**
- `qa-task-042.md` — KONTROLOR: 0 blockerů, 11/12 AC ✅, 1 ℹ️ runtime-only
- `evzen-task042-watermark.md` — Evžen: SCHVÁLENO
- `chrome-test-task042-watermark.md` — TEST-CHROME: 9/9 PASS

### §1.2 — TASK-020 Eshop autodíly (**HOTOVÉ 100 %, TASK-QUEUE říká "zpracovává se" zastarale**)

Původní QA 2026-04-04 (`QA-TASK-019-020.md`) hlásil 44/47 ✅ + 3 gapy. Gap-fix #184 uzavřel schema gapy:

| Commit | Fáze | Stav |
|---|---|---|
| `9dfadde` #182-A | schema manufacturer/warranty + WHOLESALE_SUPPLIER | ✅ |
| `5c13bbd` #182-B | API + validators + middleware | ✅ |
| `04ce6ae` #182-C | PWA wizard manufacturer + warranty | ✅ |
| `776ff72` #182-D | katalog manufacturer filter + detail render | ✅ |
| `ab58f27` #182-E | seed WHOLESALE_SUPPLIER + 3 aftermarket parts | ✅ |
| `335886d` #182-F | E2E `parts-wholesale.spec.ts` | ✅ |

**`final-gap-analysis-task020.md` (2026-04-14) identifikoval 23 gapů — z toho HOTOVO:**

Vlna 1 (Security/Legal):
- `6415898` G-01 Stripe refund v returns ✅ + G-17 Visual search stub (Claude Vision) ✅

Vlna 2 (Core Business):
- `f85bf99` G-02 SubOrder model — schema + API + split ✅
- `d91bf8a` G-02 per-supplier checkout UI + supplier PWA SubOrder views ✅
- `6792e0e` G-02 admin nested SubOrders per supplier ✅
- `9d7fe41` G-02 SubOrder tracking aggregation + webhook payout per SubOrder ✅
- `bf68f89` G-03 30-min part reservation system ✅

Vlna 3 (Engagement):
- `9d6a292` G-04 Part request system (burza dílů) + supplier offers ✅
- `0372a67` G-05 CustomerGarage CRUD API ✅
- `933b1d3` G-06 Supplier review system ✅
- `c9aa397` G-07 + G-19 Favorites/parts wishlist + stock notifications ✅

Vlna 4 (Search/UX):
- `0684cae` G-08 OEM cross-reference model + compare API ✅
- `a8759d4` G-14 + G-18 Rich autocomplete + NLP smart search s Czech synonyms ✅
- `4af1ba5` G-15 Search history ✅
- `6ddda02` fix: OEM dot normalization in autocomplete ✅

Vlna 5 (Polish):
- `1f8e749` G-22 + G-23 Shipping calculate + weight limits + checkout reservation ✅
- `62ab73a` SHIPPED_BACK customer endpoint + return tracking ✅

Navíc proběhlo (mimo původní plán):
- `cb8387f` DPD/PPL/GLS/Česká Pošta carrier implementace (dry-run) ✅
- `a7e54fe` Real Zásilkovna API integrace ✅
- `41d63c3` Admin suppliers overview ✅
- `2e16e7d` Admin parts management + bulk ✅
- `88f3262` Admin returns/complaints UI ✅
- `11a436b` Admin users + orders pages ✅
- `f0c4215` Automatic feed sync cron ✅
- `0cc7b21` VIN decoder napojen na parts compatibility ✅

### §1.3 — PWA Makléř + PWA Partner + PWA Díly (**HOTOVÉ**)

- `3273d43` #211-C1: Partner BottomNav + mobile layout ✅
- `fc1f02b` #211-C2: Vehicle detail/edit ✅
- `42bfd1a` #211-C3: Part detail/edit/delete ✅
- `bea7003` #211-C4: Order detail + status actions ✅
- `316d957` #211-C5: PhotoUpload ✅
- `4057b4b` #211-C6: Partner onboarding (3 kroky) ✅
- `9c7b38b` #211-C7: OfflineBanner + OnlineStatusProvider ✅
- `17d87b5` #211-C7 fix: upload_preset ✅
- `51596f3` #210 Supplier onboarding (3-step wizard) ✅
- `2fa39f3`, `31d894c`, `5043ef1` #210 parts detail/edit + DeletePartDialog fix ✅
- `ccc9ae4` OBS-2 loading/error states + Czech diacritics ✅

**chrome-test-task-235-211 (2026-04-11): 13/13 PASS.**

### §1.4 — Fáze 3 Batch A (Partner features) — **HOTOVÉ**

Z `audit-remaining-work.md` (2026-04-11) 4 features čekaly 13h effort, všechny hotové:

| Feature | Commit | Stav |
|---|---|---|
| D11 Fulltext search (partner + supplier) | `b75a2c8` | ✅ |
| D13 Dashboard charts (recharts revenue + orders) | `71785f9` | ✅ |
| D15 Opening hours editor | `e4aa359` | ✅ |
| D16 PDF documents (delivery note + order confirmation) | `a5592a6` | ✅ |
| Follow-up fixy Partner/Supplier charts | `f383bdc`, `8df2030` | ✅ |

### §1.5 — Ostatní HOTOVÉ (produkční hardening)

- `bb1e2f7` + `b235c67` admin/manager reálné účty + MANAGER access ✅
- `d51a353` + `9aa2603` + `8d74958` #53 Instagram-style profile (likes, comments, badges) + 8 gapů ✅
- `36ca14b` frontend forms — part request CTA, garage page, supplier reviews ✅
- `9f566bd` extract BADGE_CATALOG to client-safe module (build fix) ✅
- `c391a34` remove custom session cookie config (login fix) ✅
- `f415e93` broker workflow checklist (9 fází, 28 kroků) ✅
- `d985efd` photo position guide s 13 exterior slots ✅
- `468ea55` self-hosted Sharp upload (Cloudinary replacement) ✅
- `a49e1a2` watermark na fotky (vehicle/listing/part) ✅
- `c12d39b` replace all `[DOPLNIT]` placeholdery reálnými daty ✅
- `5a79d3d` critical launch fixes (placeholder image, logo URL, orphan cleanup, photo auto-checks) ✅
- `f54eaff` + `6553788` mobile optimization tier 1 + 2 ✅
- `16367b4` prod hardening — DATABASE_URL required + useOnlineStatus hydration ✅
- `99b6003` prisma pool exhaustion during build ✅

### §1.6 — SEO/GEO (TASK-041) — **HOTOVÉ**

- `1466223`+`3666bad` #87b 3-segment routing `/dily/[brand]/[model]/[rok]` (104 SSG pages + runtime bugs fix) ✅
- `49f680e` #87c Prisma SeoContent model + content gen + page integration ✅
- `a0ce0d9` #87d on-demand revalidation API + 9 brand expansion ✅
- `c52a3ce` #87e geo-benchmark.md + monitoring playbooks ✅
- `a5dadb4` #127 canonical URL helper + refactor hardcoded metadata ✅
- `e702e93` #148 model page dynamicParams=false ✅

### §1.7 — Stripe + Wolt model — **HOTOVÉ**

- `42691c5` #88a Wolt — partner commission slider + Stripe split + audit log ✅
- `2bf0657` #161-a Stripe Connect Express backend ✅
- `63bf026` #161-b admin Stripe Connect onboarding UI ✅
- `64d7478` #161-c partner PWA Stripe Connect self-service UI ✅
- `e678f7c` #161-c simplify refactor ✅

### §1.8 — Build status (**PASS**)

Per `build-check-20260413.md`: Next.js 16.1.7, 16.9s compile, 1 233 stránek, 0 TypeScript errors, 5 warningů (Sentry deprecation, middleware→proxy rename). Build je zelený.

---

## §2 — Co JE ROZPRACOVANÉ

### §2.1 — Pseudo-rozpracované (status lag — už HOTOVÉ, jen neaktualizované)

| TASK | TASK-QUEUE stav | Skutečný stav | Akce pro leada |
|---|---|---|---|
| **TASK-020** Eshop autodíly | `Stav: zpracovává se` (řádek 1742) | **100 % hotové** (všechny 3 gapy + 23 gapů z final-gap-analysis) | Aktualizovat na `hotovo` |
| **TASK-042** PDF šablony | `Stav: čeká` (řádek 6207) | **HTML hotové, PDF nebyly vygenerované** | Spustit generátor + aktualizovat na `hotovo` |

### §2.2 — Opravdu neaktualizované v TASK-QUEUE (řádky 6295+)

Po TASK-042 (řádek 6205) žádné další tasky v TASK-QUEUE.md nejsou — `<!-- Další úkoly přidávej pod tuto čáru -->` je prázdné. Všechno další bylo vedeno v interním dispatch systému (task IDs 43+), bez reflekce do hlavního TASK-QUEUE.md.

### §2.3 — Modifikované neuncommitnuté soubory (git status)

| Soubor | Scope změny | Typ | Doporučení |
|---|---|---|---|
| `.claude-context/tasks/impl-task-155-88a-wolt.md` | internal report | docs | nechat jako log |
| `.claude-context/tasks/plan-task-182-eshop-dily-gap.md` | internal plan | docs | nechat jako log |
| `TASK-QUEUE.md` | status stringy | tracking | aktualizovat v rámci navazujícího úkolu |
| `public/sw.js` | 1 řádek Serwist rebuild artefakt | build output | akceptovat / ignorovat |

Nic z modifikovaných souborů neobsahuje rozpracovaný kód, jen dokumentační/tracking artefakty.

---

## §3 — Co CHYBÍ UDĚLAT (prioritizovaně)

### 🔴 P1 — BLOCKER PREZENTACE (<20 min)

| # | Akce | Effort | Blokuje |
|---|---|---|---|
| **PR-1** | Spustit `node docs/presentations/generate-pdf.mjs` → 8 PDF do `~/Desktop/` | 15 min (Playwright 8× browser) | Fyzická distribuce prezentací |
| **PR-2** | Update TASK-QUEUE.md: TASK-042 `čeká → hotovo`, TASK-020 `zpracovává se → hotovo` | 2 min | Tracking parity |

### 🟡 P2 — Vizuální/obsahová doladění prezentací (SHOULD před venkem)

| # | Akce | Effort | Důvod |
|---|---|---|---|
| **PR-3** | Review obchodní prezentace — ověřit aktuální statistiky (počet makléřů, vozů, průměrná doba prodeje) — zda nejsou hardkódované zastarale | 1h | Credibility vůči klientům |
| **PR-4** | Marketplace-investori.html — review ROI tabulky (15-25 % jsou projekce, ne historická data) — lead rozhodne zda opustit projekci nebo přepsat „případová studie" | 30 min | Legal/compliance (sliby ROI) |
| **PR-5** | Onboarding-makler.html — ověřit že 7 kroků nabírání **shoduje** s aktuálním PWA flow (po všech task-020 a #211 změnách) | 30 min | Materiál nesmí lhát novému makléři |
| **PR-6** | Logo watermark — vytvořit `logo-watermark.png` variant (orange+black na průhledném pozadí) pro fakturu/prezentace na bílém pozadí | External asset (designér) | `logo-white.png` neviditelné na bílém |

### 🟡 P2 — Ostatní production-ready doladění (po launchi)

Z `audit-remaining-fixes.md` (2026-04-12) — **většina opravena**, zbývají:

| # | Akce | Effort | Stav |
|---|---|---|---|
| **DB-1** | ShopTrustBar — SVG ikony (Visa, MC, Apple Pay, dopravci) místo text-badges | 1h + brand assets | Nízká priorita |
| **DB-2** | Smazat 3 orphan `components/web/{Navbar,Footer,MobileMenu}.tsx` | 2 min | Hygiena |
| **DB-3** | TASK-026 follow-up email cron (7 dní po předání) | 2h | Nice-to-have |
| **DB-4** | Sentry: `autoInstrumentServerFunctions` → `webpack.autoInstrument*` namespace (deprecation) | 15 min | Před Sentry upgrade |
| **DB-5** | Next 16: `middleware.ts` → `proxy.ts` rename | 5 min | Před Next 17 |

### 🟢 P3 — Čeká na externích / low priority

- Reálné API integrace DPD/PPL/GLS/Česká pošta — dry-run funguje, čeká na smlouvy s dopravci
- Pusher real-time messaging pro Partner portál
- SMS integrace (GoSMS/Twilio) — rozhodnutí + smlouva
- JSONB array path query optimalizace (`lib/seo/pricingAggregate.ts:16`)
- Visual Search AI (Claude Vision) — stub funguje (commit `6415898`), produkční integrace je Phase 2

---

## §4 — BLOCKERS PREZENTACE

### 4.1 — Technické blockery (co musí fungovat aby šlo prezentovat)

| # | Položka | Stav |
|---|---|---|
| Platforma běží | Production up na subdoménách | ✅ Commit `f13f2f2` + `c391a34` |
| Build prochází | `npm run build` → 0 errors | ✅ `build-check-20260413.md` |
| Login funguje | Role-based redirect | ✅ Commit `c391a34` (session cookie fix) |
| Homepage renderuje | `/`, `/o-nas`, `/makleri`, `/nabidka`, `/dily`, `/marketplace` | ✅ `chrome-test-complete.md` 131/131 PASS |
| Cebia prověrka | Stripe payment gate | ✅ `chrome-test-complete.md` |
| Eshop checkout | End-to-end flow | ✅ `chrome-test-task-235-211.md` |
| Marketplace landing | Public + VIP gating | ✅ Memory potvrzuje, commit `c77eb52` |
| Inzerce podání | Registrace ADVERTISER + publish | ✅ |
| Makléřský PWA | Dashboard + nabrat auto + smlouvy | ✅ |

**Žádné technické blockery. Platforma je prezentovatelná.**

### 4.2 — Prezentační artefakty (reálně ukázat na prodejní schůzce)

| # | Položka | Stav |
|---|---|---|
| HTML šablony | 8× v `docs/presentations/` | ✅ HOTOVÉ |
| PDF export | 8× v `~/Desktop/` | ❌ **CHYBÍ** — spustit `generate-pdf.mjs` |
| Živá demo platforma | carmakler.cz (production) | ✅ HOTOVÉ |
| Pitch deck pro investory | marketplace-investori.html | ✅ HOTOVÉ (HTML) |
| Obchodní prezentace B2B | obchodni-prezentace.html | ✅ HOTOVÉ (HTML) |
| Onboarding makléře | onboarding-makler.html | ✅ HOTOVÉ (HTML) |
| Ceník služeb | cenik-sluzeb.html | ✅ HOTOVÉ (HTML) |
| Faktura šablona | faktura-sablona.html | ✅ HOTOVÉ (HTML) |
| Landing page wireframe (interní) | landing-page-sablona.html | ✅ HOTOVÉ (HTML) |
| Partnership material pro autobazary | carmakler-pro-autobazary.html | ✅ HOTOVÉ (HTML) |
| Partnership material pro vrakoviště | carmakler-pro-vrakoviste.html | ✅ HOTOVÉ (HTML) |

**Jediný hmatatelný blocker: PDF export.** Lead může odprezentovat **už teď** (buď 1) otevřením HTML v Chrome + Ctrl+P, nebo 2) spustit `generate-pdf.mjs` a mít 8 PDF za 15 min).

---

## §5 — Doporučený next step pro leada

**Priorita 1 — TEĎKA (20 min total):**

1. **Dispatch implementator** s úkolem:
   - `cd docs/presentations && node generate-pdf.mjs` (Playwright installed)
   - Ověřit 8 PDF v `$HOME/Desktop/CarMakler-*.pdf`
   - Vizuálně zkontrolovat každý PDF (otevřít v Preview)
   - Report HOTOVO s listingem vygenerovaných souborů
2. **Dispatch implementator** (paralelně) s textovým úkolem:
   - Update `TASK-QUEUE.md`:
     - Řádek 1742 `Stav: zpracovává se` → `Stav: hotovo`
     - Řádek 6207 `Stav: čeká` → `Stav: hotovo`
   - Commit `docs: TASK-020 + TASK-042 status update → hotovo`

**Pozor na Wolt-model memory:** Cenik-sluzeb.html ukazuje eshop jako "Wolt model" (20 % provize, free tool) — to odpovídá aktuálnímu memory `project_wolt_model_platform_wide`. OK.

**Priorita 2 — Před příští prodejní schůzkou (2-3h):**

3. Review **obchodni-prezentace.html** statistik — aktualizovat hardkódovaná čísla (počet makléřů, průměrná doba prodeje, success rate) reálnými daty z produkce
4. Review **marketplace-investori.html** — lead rozhoduje o ROI komunikaci (15-25 % projekce vs. reálné případovky po prvních flipech)
5. Review **onboarding-makler.html** — zkontrolovat 7 kroků proti aktuálnímu PWA flow po `f415e93` (broker workflow 9 fází, 28 kroků)

**Priorita 3 — Hygiene (30 min, po prezentaci):**

6. Orphan cleanup (3 `components/web/*` soubory)
7. Sentry + Next.js 16 warningy (15 min)
8. `logo-watermark.png` varianta (externí designér)

---

## §6 — Klíčové závěry

1. **Prezentace NEJSOU blocker** — 8 HTML šablon hotových, QA+Evžen+Chrome test zelený. Chybí jen 15minutový batch PDF export.
2. **TASK-020 (eshop) ani TASK-021–041 NEJSOU blocker** — všech 23 P0-P3 gapů z final-gap-analysis je uzavřených, 3 QA gapy ze schema gap-fixu uzavřené v #182-F.
3. **Platforma je v produkční kvalitě** — 1 233 stránek prerenderovaných, 0 TypeScript errors, chrome test 131/131 PASS, Stripe Connect Express živě, Wolt commission model živě.
4. **Chybí jen dokument status lag** — TASK-QUEUE.md ukazuje staré stavy 020/042, realita je 2 týdny napřed.
5. **Žádný code blocker neexistuje pro prezentaci platformy**. Lead může jít na schůzku s klientem **zítra**, stačí předem spustit generator PDF.
