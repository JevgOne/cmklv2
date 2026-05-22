# Audit rozpracovaných věcí — co zbývá dodělat

**Datum:** 2026-04-11
**Agent:** Plánovač
**Zdroje:** TASK-QUEUE.md, QA-TASK-019-020.md, plan-task-182-eshop-dily-gap.md, plan-faze3-batch-a.md, plan-task-211-pwa-partner-100.md, impl-task-231-211-c5c7.md, codebase grep/glob

---

## §1 Celkový přehled

| Oblast | Status | Detail |
|--------|--------|--------|
| TASK-001–019 | **hotovo** | 19 tasků kompletních |
| TASK-020 (Eshop autodíly) | **95 % → ~98 %** | gap-fix #184 přidal manufacturer+warranty+WHOLESALE_SUPPLIER; zbývá UI/UX doladění |
| TASK-021–041 | **hotovo** | 21 tasků kompletních |
| TASK-042 (PDF šablony) | **čeká** | Nebyl zahájen, 6 HTML šablon k vytvoření |
| PWA Partner #211 | **~95 % kompletní** | C1-C7 commitnuty, zbývá Fáze 3 features |
| Plan fáze 3 batch A | **čeká** | 4 features (Search, Grafy, Otevírací doba, PDF partner) |

---

## §2 TASK-020 — Eshop autodíly (stav „zpracovává se")

### Co je hotové (z QA-TASK-019-020.md + aktuální code scan):

- **44/47 requirements ✅** z původního QA reportu (2026-04-04)
- **Gap-fix #184 implementoval:**
  - ✅ `Part.manufacturer String?` — přidáno do schema (line 906)
  - ✅ `Part.warranty String?` — přidáno do schema (line 907)
  - ✅ `WHOLESALE_SUPPLIER` role — funguje v middleware, login, seed, API routes, E2E test

### Co zbývá (přijatelná tech debt, ne blokéry):

| # | Gap | Priorita | Popis |
|---|-----|----------|-------|
| 1 | UI pro manufacturer/warranty v DetailsStep wizardu | Střední | Pole existují v schema ale wizard je možná ještě nezobrazuje (potřeba ověřit QA #185) |
| 2 | Katalog filtr pro manufacturer | Nízká | Schema indexed (`@@index([manufacturer])`), ale UI filtr v `/dily/katalog` možná chybí |
| 3 | Detail page rendering manufacturer/warranty | Nízká | `/dily/[slug]` by měl zobrazovat nová pole |
| 4 | Shipping carriers — reálné API integrace | **Odloženo** | Zásilkovna, PPL, DPD, GLS, Česká pošta — všechny mají TODO stub implementace. Dry-run mód funguje. |
| 5 | `pricingAggregate.ts:16` — TODO #87d JSONB query | Nízká | Plánovaná migrace na PostgreSQL JSONB path query |

**Doporučení:** Počkat na výsledek QA #185 (task #1 v TaskList), který ověří stav gap-fixu. Pak aktualizovat stav na **hotovo**.

---

## §3 Plan fáze 3 batch A (plan-faze3-batch-a.md)

Plán vytvořen 2026-04-11, **žádná z features nebyla implementována**.

| Feature | Scope | Stav | Závislosti |
|---------|-------|------|-----------|
| **D15** — Otevírací doba editor | S (~2h) | ❌ Neimplementováno | Schema pole `Partner.openingHours` existuje, public rendering existuje, chybí editor + API PUT update |
| **D16** — PDF dokumenty (partner) | S (~2h) | ❌ Neimplementováno | jsPDF installed, contract PDF proven pattern, chybí partner order PDF endpoint + helper |
| **D11** — Fulltext Search (obě PWA) | M (~4h) | ❌ Neimplementováno | SearchOverlay component + partner/search API + lokální search na list pages |
| **D13** — Dashboard Grafy | M (~5h) | ❌ Neimplementováno | recharts installed, chybí time-series API + chart components + stats page update |

**Celkem: ~13h estimated effort, 0% implementováno.**

---

## §4 PWA Partner #211 — stav po commitech

### Implementované commity (z impl-task-231-211-c5c7.md):

| Commit | Feature | Stav |
|--------|---------|------|
| `bea7003` | C4: Order detail + status actions | ✅ Kompletní |
| `316d957` | C5: PhotoUpload + integrace | ✅ Kompletní |
| `4057b4b` | C6: Partner onboarding (3 kroky) | ✅ Kompletní |
| `9c7b38b` | C7: OfflineBanner + OnlineStatusProvider | ✅ Kompletní |
| `17d87b5` | Fix: upload_preset do PhotoUpload + onboarding | ✅ Kompletní |

### Aktuální stav pages (19 stránek):

| Route | Existuje | Functional |
|-------|----------|-----------|
| `/partner/dashboard` | ✅ | ✅ |
| `/partner/vehicles` (list) | ✅ | ✅ |
| `/partner/vehicles/new` | ✅ | ✅ + PhotoUpload |
| `/partner/vehicles/[id]` (detail/edit) | ✅ | ✅ + PhotoUpload |
| `/partner/parts` (list) | ✅ | ✅ |
| `/partner/parts/new` | ✅ | ✅ + PhotoUpload |
| `/partner/parts/[id]` (detail/edit) | ✅ | ✅ + PhotoUpload |
| `/partner/orders` (list) | ✅ | ✅ |
| `/partner/orders/[id]` (detail) | ✅ | ✅ + status actions |
| `/partner/leads` | ✅ | ✅ |
| `/partner/billing` | ✅ | ✅ |
| `/partner/stats` | ✅ | ✅ (bez grafů) |
| `/partner/messages` | ✅ | ⚠️ Placeholder |
| `/partner/documents` | ✅ | ✅ (static) |
| `/partner/profile` | ✅ | ✅ (bez opening hours editoru) |
| `/partner/onboarding` | ✅ | ✅ |
| `/partner/onboarding/profile` | ✅ | ✅ |
| `/partner/onboarding/documents` | ✅ | ✅ |
| `/partner/onboarding/approval` | ✅ | ✅ |

### Co CHYBÍ z plánu #211 (deferred to Fáze 3):

- ❌ Opening hours editor (→ D15 fáze 3)
- ❌ Dashboard grafy s recharts (→ D13 fáze 3)
- ❌ Fulltext search overlay (→ D11 fáze 3)
- ❌ PDF dokumenty pro objednávky (→ D16 fáze 3)
- ⚠️ Messages page je placeholder (not real-time)
- ⚠️ Chybí Partner-specifický API endpoint pro orders (stránka používá shared `/api/orders/[id]`)

**Partner PWA core CRUD flow je kompletní.** Zbývající features jsou v plánu fáze 3.

---

## §5 TASK-042 — PDF šablony (stav „čeká")

6 nových HTML šablon k vytvoření v `docs/presentations/`:

1. Landing page šablona (wireframe)
2. Obchodní prezentace pro klienty
3. Prezentace pro investory (Marketplace)
4. Onboarding makléře — vizuální průvodce
5. Ceník služeb
6. Šablona faktury

**Závislosti:** Žádné technické. Existující šablony a `generate-pdf.mjs` jako vzor.
**Effort:** Střední-velký (~8-12h) — čistý design/copywriting work.

---

## §6 TODO/FIXME v kódu

| Soubor | TODO | Priorita | Komentář |
|--------|------|----------|----------|
| `lib/company-info.ts` | `[DOPLNIT]` placeholdery (IČO, DIČ, adresa, telefon) | **Blocker před launchem** | `isPlaceholder()` guard skrývá v UI, ale právní stránky ukazují raw `[DOPLNIT]` |
| `lib/shipping/carriers/*.ts` | Reálné API integrace (5 dopravců) | Odloženo | Dry-run mód funguje, integrace až po kontraktaci dopravců |
| `lib/seo/pricingAggregate.ts:16` | TODO #87d JSONB query migrace | Nízká | Optimalizace, ne bug |
| `app/api/vehicles/[id]/handover/route.ts:185` | TASK-026 follow-up email po 7 dnech | Nízká | Email systém existuje, cron chybí |
| `components/web/Navbar.tsx` | Orphan — neimportován | Cleanup | Nahrazeno subdomain-specific `components/main/Navbar.tsx` |
| `components/web/Footer.tsx` | Orphan — neimportován | Cleanup | Nahrazeno `components/main/Footer.tsx` |
| `components/web/MobileMenu.tsx` | Orphan — neimportován | Cleanup | Smazat |
| `components/shop/ShopTrustBar.tsx` | TODO(designer): text-badge placeholder | Nízká | Designová práce |
| `lib/listing-sla.ts:213-214` (QA report) | ~~Chybí watchdog email~~ | ✅ OPRAVENO | Email je implementován (řádek 275-283) |

---

## §7 Prioritizovaný seznam — CO DODĚLAT

### 🔴 Před launchem (MUST)

| # | Položka | Effort | Blokuje |
|---|---------|--------|---------|
| 1 | **`lib/company-info.ts` + právní stránky** — doplnit reálné firemní údaje (IČO, DIČ, adresa, telefon) | 15 min | Launch — právní compliance |
| 2 | **TASK-020 finalizace** — počkat na QA #185, pak označit jako hotovo | 0h (čeká QA) | Status tracking |

### 🟡 Po launchi / Fáze 3 (SHOULD)

| # | Položka | Effort | Impact |
|---|---------|--------|--------|
| 3 | **D15 — Otevírací doba editor** | ~2h | Partner UX |
| 4 | **D16 — PDF dokumenty (partner orders)** | ~2h | Partner business docs |
| 5 | **D11 — Fulltext Search (obě PWA)** | ~4h | Partner/Supplier UX |
| 6 | **D13 — Dashboard Grafy** | ~5h | Partner analytics |
| 7 | **TASK-042 — PDF šablony** (6 HTML prezentací) | ~10h | Marketing/sales |

### 🟢 Nice-to-have (COULD)

| # | Položka | Effort | Impact |
|---|---------|--------|--------|
| 8 | Orphan cleanup (3 soubory web/Navbar, Footer, MobileMenu) | 10 min | Code hygiene |
| 9 | ShopTrustBar design upgrade | 1h | Visual polish |
| 10 | Partner Messages — real-time (Pusher) | 8h+ | UX enhancement |
| 11 | Shipping carrier API integrace (5 dopravců) | 20h+ | Logistika automatizace |
| 12 | TASK-026 follow-up email cron (7 dní po handoveru) | 2h | Buyer experience |
| 13 | pricingAggregate JSONB query optimalizace (#87d) | 2h | Performance |

---

## §8 Doporučení pro leada

1. **Okamžitě:** Počkat na QA #185 a uzavřít TASK-020
2. **Příští sprint:** Implementovat Fázi 3 Batch A (D15→D16→D11→D13) — 13h celkem
3. **Před launchem:** Doplnit `companyInfo` reálné údaje (IČO, adresa atd.)
4. **Marketing sprint:** TASK-042 (PDF šablony)
5. **Post-launch:** Shipping carriers integrace, real-time messaging, follow-up email cron
