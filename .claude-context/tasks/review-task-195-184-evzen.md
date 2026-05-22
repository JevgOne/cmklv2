# Review #195 — EVZEN shoda-check #184 implementace TASK-020 vs zadání

**Task:** #195 EVZEN shoda-check
**Reviewovaná implementace:** #184 (commits A-G: `9dfadde` → `1b539a3` na `main`, nepushnuté)
**Plán:** `.claude-context/tasks/plan-task-182-eshop-dily-gap.md` (efa03a2) — schválený mnou v #183
**Předchozí QA:** `.claude-context/tasks/qa-task-185-184.md` — kontrolor PASS, 3 OBS
**Reviewer:** evzen-the-king (READ-ONLY)
**Datum:** 2026-04-09

---

## §0 — Verdict

### ✅ SCHVÁLENO — 0 blockerů, 4 minor observations

Implementace #184 přesně odpovídá schválenému plánu #182, §7 LEAD DECISIONS i původnímu zadání uživatele (TASK-020 v TASK-QUEUE.md ř. 1672-1970). Všech 7 atomických commitů A-G doručeno v plánovaném pořadí, 0 protected files dotčeno, OBS-2 audit trail v Commit A přítomný, STOP-1 ritual správně proveden.

Lead může dispatchovat #196 test-chrome (headed E2E run).

---

## §1 — Metodologie

Read-only ověření 7 commitů `9dfadde..1b539a3` proti:

1. §7 LEAD DECISIONS plánu #182 (Q1-Q5 + 6 constraints)
2. §3.11 file manifest (13 modified + 1 new — bounded)
3. §5 STOP rules (protected systems, ne destructive actions)
4. Pravidla evzen defaults (žádné zkratky, žádné skryté stránky, jasné cz labely)
5. QA OBS-3 (empty-string → undefined transform — verify není „hiding data")
6. Audit trail Commit A (OBS-2 Q1 deviation note)

Žádné edity kódu — pouze čtení diffů, schema, migrace, file content.

---

## §2 — Specific check 1: Shoda s §7 LEAD DECISIONS

### §2.1 — Q1 MARKER only, sdílená PWA pro oba

| Verifikace | Místo | Důkaz | OK |
|---|---|---|---|
| User.role comment | `prisma/schema.prisma:21` | `// ... PARTS_SUPPLIER, WHOLESALE_SUPPLIER, INVESTOR, ...` (append, NE Prisma enum) | ✅ |
| Middleware PARTS_SUPPLIER_ROLES | `middleware.ts:16` | `["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"]` | ✅ |
| API parts allowedRoles | `app/api/parts/route.ts:21` | `["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"]` + comment update | ✅ |
| API parts/import allowedRoles | `app/api/parts/import/route.ts:61` | Stejný array, WHOLESALE_SUPPLIER přidán | ✅ |
| Žádný separátní `/wholesale/*` flow | git diff | `app/(pwa-parts)/parts/*` extending only, žádný novy `/wholesale/*` directory | ✅ |
| Manual wizard funguje pro WHOLESALE | `app/(pwa-parts)/parts/new/page.tsx`, DetailsStep, PricingStep | Wizard je sdílený, gated jen middlewarem (který allow WHOLESALE) | ✅ |

**Q1 ACCEPTED — implementace přesně dle §7.Q1:** „WHOLESALE_SUPPLIER je authorization marker, ne separate flow. Sdílí Part model, /parts/* API, /parts/* PWA wizard i components/admin/feeds/* admin UI s PARTS_SUPPLIER... Manual wizard zůstává dostupný pro oba." ✅

### §2.2 — Q2 warranty String permissive max 50

| Verifikace | Místo | Důkaz | OK |
|---|---|---|---|
| Schema field | `prisma/schema.prisma:907` | `warranty String? // Např. "24 měsíců", "zákonná", "doživotní"` | ✅ |
| Validator max 50 | `lib/validators/parts.ts:18` | `warranty: z.string().max(50, "Záruka: max 50 znaků").optional()` | ✅ |
| Žádný enum | git grep | 0 enum/union pro warranty | ✅ |
| Wizard input maxLength | `PricingStep.tsx:139` | `<Input ... maxLength={50}>` | ✅ |
| Placeholder permissive | `PricingStep.tsx:138` | `placeholder="např. 24 měsíců, zákonná, doživotní"` | ✅ |

**Q2 ACCEPTED — String permissive max 50, žádný enum.** ✅

### §2.3 — Q3 manufacturer String max 100 + B-tree + ILIKE (NE tsvector!)

| Verifikace | Místo | Důkaz | OK |
|---|---|---|---|
| Schema field | `prisma/schema.prisma:906` | `manufacturer String? // Např. "TRW", "Bosch", "LUK"` | ✅ |
| B-tree index | `prisma/schema.prisma:958` | `@@index([manufacturer])` (Prisma default = B-tree, NE GIN/tsvector) | ✅ |
| Validator max 100 | `lib/validators/parts.ts:17` | `manufacturer: z.string().max(100, "Výrobce: max 100 znaků").optional()` | ✅ |
| ILIKE filter | `app/api/parts/route.ts:105` | `where.manufacturer = { contains: filters.manufacturer, mode: "insensitive" as const }` | ✅ |
| ILIKE search OR | `app/api/parts/route.ts:134` | `{ manufacturer: { contains: filters.search, mode: "insensitive" as const } }` přidán do existujícího OR | ✅ |
| **ŽÁDNÉ tsvector modifikace** | `migration.sql` content | 6 řádků: jen `ALTER TABLE Part ADD COLUMN` + `CREATE INDEX Part_manufacturer_idx` — žádný `tsvector_update_trigger`, žádný `to_tsvector`, žádný `gin` index | ✅ |
| Žádné searchVector úpravy | git diff | 0 změn v searchVector trigger / GIN index sekci | ✅ |

**Q3 ACCEPTED — B-tree + ILIKE, ZÁDNÉ tsvector modifikace per memory `project_recurring_tsvector_drift.md`.** ✅

**Migration file (autoritativní důkaz):**
```sql
-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "warranty" TEXT;

-- CreateIndex
CREATE INDEX "Part_manufacturer_idx" ON "Part"("manufacturer");
```

6 řádků, čistá. Žádné DROP INDEX, žádné tsvector trigger, žádné GIN. ✅

### §2.4 — Q4 Phase B DEFERRED

| Verifikace | Důkaz | OK |
|---|---|---|
| Žádné B2B pricing tiers | 0 změn v `Order`/`OrderItem`, žádný `CustomerTier`/`PartPrice` model | ✅ |
| Žádný TecDoc | 0 nových `lib/tecdoc.ts`, žádný TecDoc API call | ✅ |
| Žádný WHOLESALE dashboard variant | 0 nových `WholesaleDashboard.tsx`, žádný role-based routing v `parts/page.tsx` | ✅ |
| Žádný drop-shipping workflow | 0 změn v order routing, 0 emailů pro velkoobchod | ✅ |
| Žádný markup logic | 0 změn v existující markup config (zůstává jak je) | ✅ |

**Q4 ACCEPTED — Phase B 0 touches.** ✅

### §2.5 — Q5 vždy viditelné, optional, bez conditional na partType

| Verifikace | Místo | Důkaz | OK |
|---|---|---|---|
| Wizard manufacturer Input vždy visible | `DetailsStep.tsx:170-176` | `<Input label="Výrobce dílu (nepovinné)" ... maxLength={100} />` — bez `{condition && ...}` wrapper | ✅ |
| Wizard warranty Input vždy visible | `PricingStep.tsx:134-140` | `<Input label="Záruka (nepovinné)" ... maxLength={50} />` — bez wrapperu | ✅ |
| Žádný conditional na partType | git diff oba steps | Žádné `{partType === "AFTERMARKET" && ...}` patterns | ✅ |
| Detail container conditional jen na obojí null | `dily/[slug]/page.tsx:235` | `{(part.manufacturer \|\| part.warranty) && ( ... )}` | ✅ |
| Manufacturer field uvnitř container | `dily/[slug]/page.tsx:237-244` | `{part.manufacturer && (<div>...Výrobce...{part.manufacturer}</div>)}` | ✅ |
| Warranty field uvnitř container | `dily/[slug]/page.tsx:245-252` | `{part.warranty && (<div>...Záruka...{part.warranty}</div>)}` | ✅ |

**Q5 ACCEPTED — wizard unconditional render obou polí, detail container conditional jen pro „obojí null", uvnitř každé pole zvlášť conditional.** ✅

### §2.6 — 6 additional constraints (§7 plan)

| # | Constraint | Verifikace | OK |
|---|---|---|---|
| 1 | Workflow pipeline IMPL → kontrolor → evzen → test-chrome → deploy → evzen → user | #184 → #185 (PASS) → #195 (toto) → #196 dispatch next | ✅ |
| 2 | STOP-1 tsvector ritual MANDATORY, Option A po lead ACK | Impl report §3 + commit A message: „STOP-1: dev DB byl reset Option A path s explicit lead ACK" | ✅ |
| 3 | Seed: 1× WHOLESALE user + 2-3 Parts, append-only, nezasahovat #88a/#161/TASK-019 | Seed diff §6 — append na ř. 1755+ (po existing blocku), 1 user + 3 parts (TRW/Bosch/Sachs), žádný edit existing seed entries | ✅ |
| 4 | E2E: 1+ test, headed, ne edge cases | `e2e/parts-wholesale.spec.ts` 4 testy (T1-T4), Playwright headed-friendly, smoke level | ✅ |
| 5 | Nedotknout se: protected systems | §3 níže — 0 modifikací | ✅ |
| 6 | Commit hygiene: 6 atomických commitů per §3.12, simplify na konci | 6 hlavních (A-F) + 1 simplify (G) = 7 commitů, atomické, descriptive messages | ✅ |

**Všech 6 constraints plně honored.** ✅

---

## §3 — Specific check 2: §3.11 file manifest — bounded

### §3.1 — Files changed (git diff --stat 1b539a3~7..1b539a3)

13 souborů celkem, +299/-7:

| # | File | Plan §3.11 | Změny | OK |
|---|---|---|---|---|
| 1 | `prisma/schema.prisma` | ✅ | +7/-1 (User.role comment + Part fields + index) | ✅ |
| 2 | `prisma/migrations/20260409062848_add_part_manufacturer_warranty/migration.sql` | ✅ (NEW auto-gen) | +6 (clean) | ✅ |
| 3 | `prisma/seed.ts` | ✅ | +92 (1 user + 3 parts + 1 console.log) | ✅ |
| 4 | `lib/validators/parts.ts` | ✅ | +3 | ✅ |
| 5 | `app/api/parts/route.ts` | ✅ | +10/-2 | ✅ |
| 6 | `app/api/parts/import/route.ts` | ✅ | +8/-2 (CsvRow + indexOf + create + allowedRoles) | ✅ |
| 7 | `middleware.ts` | ✅ | +1/-1 (jen PARTS_SUPPLIER_ROLES pole) | ✅ |
| 8 | `components/pwa-parts/parts/DetailsStep.tsx` | ✅ | +9 | ✅ |
| 9 | `components/pwa-parts/parts/PricingStep.tsx` | ✅ | +9 | ✅ |
| 10 | `app/(pwa-parts)/parts/new/page.tsx` | ✅ | +4 | ✅ |
| 11 | `app/(web)/dily/[slug]/page.tsx` | ✅ | +21 | ✅ |
| 12 | `app/(web)/dily/katalog/page.tsx` | ✅ | +12/-2 | ✅ |
| 13 | `e2e/parts-wholesale.spec.ts` | ⚠️ NEW (plan jméno: `task-182-wholesale-supplier.spec.ts`) | +123 | ✅ (viz OBS-1) |

**Plán count:** 13 modified + 1 new = 14
**Skutečnost:** 13 souborů (12 modified + 1 nový e2e + 1 nový migration dir = 14 if counted strictly, ale git stat zobrazuje 13 entries)

**Chybí oproti plánu:** `__tests__/middleware.test.ts` — plán to měl jako CONDITIONAL („pokud je tam hardcoded role list, přidat WHOLESALE_SUPPLIER"). Implementator test ověřil — ř. 259-267 testuje pouze single positive case `PARTS_SUPPLIER`, žádný hardcoded role list k aktualizaci. Nemodifikace je správná interpretace plánu. (viz OBS-2)

### §3.2 — Protected files — 0 modifikací

Spustil jsem rozšířený grep proti git diff:

```
git diff --name-only 1b539a3~7..1b539a3 --
  app/api/stripe/webhook/*           # #88a Wolt commission
  lib/stripe-connect-shared.ts        # #161 Stripe Connect helpers
  app/(pwa)/makler/**                 # makler PWA
  app/(web)/inzerce/**                # TASK-019 inzertní platforma
  app/(web)/nabidka/**                # TASK-019 ofert
  app/api/orders/**                   # checkout / orders
  app/(web)/dily/kosik/**             # cart
  app/(web)/dily/objednavka/**        # checkout flow
  components/admin/partners/**        # #161 admin StripeOnboardingCard
  components/pwa-parts/SupplierBottomNav.tsx
  components/pwa-parts/SupplierTopBar.tsx
  app/(admin)/admin/feeds/**          # admin feeds
  app/api/admin/feeds/**              # feed API
  components/pwa-parts/profile/SupplierStripeCard.tsx  # #161-c
  app/(pwa)/marketplace/**            # marketplace
  app/(web)/inzerce/**
  app/(web)/marketplace/**
  app/(web)/moje-inzeraty/**
  components/web/marketplace/**
  components/admin/feeds/**
```

**Výsledek: 0 souborů.** ✅

**Specifické checky:**

| Protected systém | git diff result | OK |
|---|---|---|
| #88a Wolt commission webhook + applyCommissionSplit | 0 změn v `app/api/stripe/webhook/route.ts` | ✅ |
| #161 Stripe Connect Express (a/b/c) — všechny 3 commit clusters | 0 změn v `lib/stripe-connect-shared.ts`, `SupplierStripeCard`, admin StripeOnboardingCard | ✅ |
| #19 Order confirmation emails | 0 změn v `lib/emails/orders*` | ✅ |
| TASK-019 inzertní platforma | 0 změn v `app/(web)/inzerce/*`, `nabidka/*`, `moje-inzeraty/*`, `api/listings/*` | ✅ |
| #156 Donor car flow | 0 změn v donor car files | ✅ |
| Admin feeds | 0 změn v `app/(admin)/admin/feeds/*` ani `app/api/admin/feeds/*` | ✅ |
| API parts/[id] (PUT dědí) | 0 změn — PUT používá `updatePartSchema = createPartSchema.partial()` + spread, dědí auto | ✅ |
| API parts/compatible, for-vehicle, supplier-stats | 0 změn | ✅ |
| Cart, objednavka, moje-objednavky | 0 změn | ✅ |
| Donor car flow & SupplierBottomNav/TopBar | 0 změn | ✅ |
| Marketplace | 0 změn | ✅ |
| Makler PWA | 0 změn | ✅ |

**File manifest 100% bounded.** ✅

---

## §4 — Specific check 3: OBS-2 audit trail v Commit A

`git log -1 --format=fuller 9dfadde`:

```
commit 9dfaddeeff1a239a39d1c2fd4db88e5916745f97
Author:     JevgOne <jevgone@github.com>
AuthorDate: Thu Apr 9 08:30:23 2026 +0200

    feat(#182-A): schema + migration manufacturer/warranty + WHOLESALE_SUPPLIER role marker
    
    - Part: add manufacturer (String?) + warranty (String?) + B-tree index on manufacturer
    - User.role comment: append WHOLESALE_SUPPLIER to allowed values list (no Prisma enum,
      marker only — middleware/API allowedRoles updated v Commit B)
    - Migration 20260409062848_add_part_manufacturer_warranty (cleaned tsvector drift per
      STOP-1 ritual + memory project_recurring_tsvector_drift.md, precedent #155/#162)
    
    OBS-2 / Q1 audit: WHOLESALE_SUPPLIER je čistý role marker, sdílí PWA wizard
    s PARTS_SUPPLIER (lead decision §6.Q1, deviation z TASK-020 spec ř. 1833 documented).
    
    STOP-1: dev DB byl reset Option A path s explicit lead ACK
    (ACK Option A, GREEN LIGHT). Production unaffected.
    
    Refs: #184 IMPL TASK-020 Eshop díly gap-fix, plan §3.2/§3.3
```

**OBS-2 audit trail PŘÍTOMEN:** „OBS-2 / Q1 audit: WHOLESALE_SUPPLIER je čistý role marker, sdílí PWA wizard s PARTS_SUPPLIER (lead decision §6.Q1, deviation z TASK-020 spec ř. 1833 documented)." ✅

**STOP-1 ritual zaznamenán** v message: „STOP-1: dev DB byl reset Option A path s explicit lead ACK (ACK Option A, GREEN LIGHT). Production unaffected." ✅

Reference na plán + memory: `plan §3.2/§3.3` + `memory project_recurring_tsvector_drift.md, precedent #155/#162`. ✅

---

## §5 — Specific check 4: UI kvalita

### §5.1 — Žádné zkratky

| Místo | Label | Plné jméno? | OK |
|---|---|---|---|
| `DetailsStep.tsx` manufacturer Input label | „Výrobce dílu (nepovinné)" | ✅ celý název | ✅ |
| `PricingStep.tsx` warranty Input label | „Záruka (nepovinné)" | ✅ celý název | ✅ |
| `dily/katalog/page.tsx` filter label | „Výrobce" | ✅ ne „Výr." | ✅ |
| `dily/katalog/page.tsx` filter placeholder | „TRW, Bosch..." | Příklady, OK | ✅ |
| `dily/[slug]/page.tsx` detail label manufacturer | „Výrobce" | ✅ | ✅ |
| `dily/[slug]/page.tsx` detail label warranty | „Záruka" | ✅ | ✅ |

**Žádné zkratky, vždy plný název.** ✅

### §5.2 — Žádné skryté stránky

| Stránka | Přístupná? | Naviguje? | OK |
|---|---|---|---|
| WHOLESALE_SUPPLIER login | Ano (`/login` standard, role v middleware) | Po loginu redirect na `/parts/profile` (per E2E T1) | ✅ |
| `/parts` (dashboard) | Ano (PARTS_SUPPLIER_ROLES + WHOLESALE) | Existuje, gated | ✅ |
| `/parts/new` (wizard) | Ano | Existuje, sdílený s PARTS_SUPPLIER | ✅ |
| `/parts/my` | Ano | Existuje (pre-existing) | ✅ |
| `/parts/profile` | Ano | Existuje (pre-existing #161-c) | ✅ |
| `/dily/katalog` (public katalog) | Public, manufacturer filter visible v filter baru | ✅ | ✅ |
| `/dily/[slug]` detail | Public | manufacturer/warranty render mezi description a dodavatel blokem | ✅ |
| Admin /admin/feeds (správa wholesale feedů) | Pre-existing, accessible pro ADMIN/BACKOFFICE | Funguje bez WHOLESALE_SUPPLIER specifické úpravy (lead Q1 ACCEPT) | ✅ |

**Žádné stránky se nehledají naslepo — vše je v navigaci nebo přístupné z URL přímo.** ✅

### §5.3 — Jasné CZ labely + accessibility

| Element | CZ label | OK |
|---|---|---|
| Wizard inputy | „Výrobce dílu (nepovinné)" + „Záruka (nepovinné)" | ✅ |
| Wizard placeholdery | „např. TRW, Bosch, LUK" + „např. 24 měsíců, zákonná, doživotní" | ✅ |
| Katalog filter | „Výrobce" + placeholder „TRW, Bosch..." | ✅ |
| Detail page bloky | UPPERCASE „Výrobce" + „Záruka" + value | ✅ |
| Validator error messages | „Výrobce: max 100 znaků" + „Záruka: max 50 znaků" | ✅ |

**Všechny CZ texty, accessibility-ready (Input má label prop).** ✅

---

## §6 — Specific check 5: STOP-1 ritual compliance

### §6.1 — Migration content audit

`prisma/migrations/20260409062848_add_part_manufacturer_warranty/migration.sql` — kompletně přečteno (6 řádků):

```sql
-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "warranty" TEXT;

-- CreateIndex
CREATE INDEX "Part_manufacturer_idx" ON "Part"("manufacturer");
```

| Check | Výsledek |
|---|---|
| Pouze ALTER TABLE Part + CreateIndex Part_manufacturer_idx | ✅ |
| Žádné tsvector modifikace | ✅ |
| Žádné DROP INDEX (drift artefakty) | ✅ |
| Žádné GIN indexy | ✅ |
| Žádné trigger funkce | ✅ |
| Žádné touches Listing/Vehicle (drift recoverable) | ✅ |

**Migration je čistá podle Q3 / STOP-1 ritual.** ✅

### §6.2 — Self-resolve check

`git diff 1b539a3~7..1b539a3` v search for self-resolve markers:

| Bypass | Hledáno | Výsledek |
|---|---|---|
| `prisma db push` | git log + commit messages | 0 mention | ✅ |
| `prisma migrate resolve` | git log + commit messages | 0 mention | ✅ |
| Ruční ALTER TABLE v JS/TS code | git diff | 0 raw SQL ALTER mimo migration.sql | ✅ |
| `--no-verify` v commit | git log | 0 bypass | ✅ |
| Force-push | git history | 0 force-push (commits jsou nepushnuté na origin) | ✅ |

**Žádný self-resolve, žádný bypass.** ✅

### §6.3 — Prisma 7.5 consent compliance

Impl report §3 + §8:

> „Prisma 7.5 nově vyžaduje `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var s textem consent zprávy → eskaloval fresh consent → lead poslal `ACK Option A ... Mas GREEN LIGHT spusti Option A sled`"

Implementator správně eskaloval na lead, čekal na explicit consent, nepouštěl `migrate reset` z hlavy. Konzistentní s memory `feedback_stop_escalate_literal` a `feedback_git_reset_approval`. ✅

---

## §7 — Specific check 6: QA OBS-3 — empty-string → undefined transform

QA OBS-3 (`qa-task-185-184.md` §13): 
> „Wizard submit: `details.manufacturer || undefined` — empty string se nepošle jako prázdný string, ale jako undefined → API null. Správné chování (neznečišťuje DB prázdnými řetězci)."

**Můj audit této transformace — není to skrývání dat?**

Flow:
1. **Wizard state init:** `manufacturer: ""` v default `PartDetails` — empty string ne null, takže Input renderuje (controlled component requirement)
2. **User leaves field blank:** state zůstává `""`
3. **Submit handler** (`app/(pwa-parts)/parts/new/page.tsx:47`):
   ```ts
   manufacturer: details.manufacturer || undefined
   warranty: pricing.warranty || undefined
   ```
   `"" || undefined` = `undefined`. Field se NEpošle do API body.
4. **API POST** (`app/api/parts/route.ts:43`):
   ```ts
   manufacturer: data.manufacturer ?? null
   warranty: data.warranty ?? null
   ```
   Když pole není v body → `data.manufacturer` je `undefined` → `?? null` → DB ukládá `null`.
5. **Detail render** (`app/(web)/dily/[slug]/page.tsx:235-252`):
   ```tsx
   {(part.manufacturer || part.warranty) && (
     <div>
       {part.manufacturer && <div>...Výrobce: {part.manufacturer}</div>}
       {part.warranty && <div>...Záruka: {part.warranty}</div>}
     </div>
   )}
   ```
   Když `null` → conditional render skryje řádek.

**Závěr:** Toto NENÍ skrývání dat. Flow je deterministický:
- Prázdný formulář → nic v DB → nic v UI
- Vyplněný formulář → hodnota v DB → hodnota v UI

**Není to skrytá funkce.** Pole jsou explicitně označená „(nepovinné)" v wizard labels. Uživatel ví, že prázdné pole = žádná data. Detail page nezobrazuje „Výrobce: N/A" ani „Výrobce: -" — prostě skryje řádek, protože tam není co zobrazit. To je standard UX pattern pro optional fields.

**Edge case:** Whitespace-only input (`" "` nebo `"   "`) by se `|| undefined` stalo truthy → uloženo do DB jako `" "`. Velmi marginální (uživatel by musel vědomě napsat space-only). Není blocker, ale stojí za zaznamenat (viz OBS-4).

**OBS-3 verdict: NENÍ hiding data, je to correct optional-field handling.** ✅

---

## §8 — Cross-check: Implementace vs uživatelské zadání TASK-020

TASK-020 v TASK-QUEUE.md (ř. 1672-1970), klíčové requirements:

| Requirement | Spec ř. | Implementace | OK |
|---|---|---|---|
| „Nová role: WHOLESALE_SUPPLIER (velkoobchodní dodavatel)" | 1831 | String marker v User.role + middleware + API allowedRoles + seed user | ✅ |
| Schvaluje BackOffice/Admin | 1832 | Existující admin /users gating funguje (status workflow PENDING/ACTIVE) | ✅ |
| „Jiný flow než vrakoviště — nepřidává díly ručně, ale importuje katalog" | 1833 | **Q1 lead deviation:** Marker only, manual wizard pro oba dostupný (audit trail v commit A). Backend feed import už existuje v `/admin/feeds` (pre-existing #131+), WHOLESALE_SUPPLIER může používat oba | ⚠️ documented |
| `Part.wholesalePrice` (Int?) | 1941 | Pre-existing (z #131+ baseline) | ✅ |
| `Part.feedConfigId` (String?) | 1942 | Pre-existing | ✅ |
| `Part.externalId` (String?) | 1943 | Pre-existing | ✅ |
| `Part.manufacturer` (String?) | 1944 | NOVÉ — schema + migration + validator + API filter + wizard + detail render | ✅ |
| `Part.warranty` (String?) — „24 měsíců" | 1945 | NOVÉ — schema + migration + validator + wizard + detail render | ✅ |
| „U aftermarket dílů: OEM číslo, výrobce dílu, záruka" | 1875 | Detail page render block — OEM už existuje (pre-existing), nový blok pro výrobce + záruka | ✅ |
| „Dodavatel: zobrazit jako 'Carmakler Shop' (ne jméno velkoobchodu)" | 1876 | Pre-existing v `app/(web)/dily/[slug]/page.tsx:117-119` (z #131+ baseline) | ✅ |
| TecDoc API integrace | 1856-1860 | **Phase 2 / OUT OF SCOPE** per Q4 lead decision — DEFERRED | ✅ defer |
| Drop-shipping workflow | 1881-1882 | **Phase B / OUT OF SCOPE** per Q4 — DEFERRED | ✅ defer |
| B2B pricing tiers | (1862-1869 markup config) | Markup pre-existing v feed config (z #131+); B2B per-customer tiers DEFERRED | ✅ defer |

**Všechny 3 QA-flagged gaps z `QA-TASK-019-020.md` (44/47 → 47/47) doručeny:**

1. ✅ WHOLESALE_SUPPLIER role (marker via String + middleware + API)
2. ✅ Part.manufacturer (schema + index + ILIKE + wizard + UI)
3. ✅ Part.warranty (schema + wizard + UI)

**Implementace přesně odpovídá schválenému plánu i uživatelskému zadání s jednou dokumentovanou Q1 deviation (manual wizard přístupný i pro WHOLESALE).** ✅

---

## §9 — Observations

### OBS-1 — Minor — E2E file naming deviation

**Severity:** Minor (non-blocker, accepted)

Plán §3.10 specifikoval `e2e/task-182-wholesale-supplier.spec.ts`. Implementator vytvořil `e2e/parts-wholesale.spec.ts`.

**Důvod proč non-blocker:**
- Lead task brief #195 sám použil název `e2e/parts-wholesale.spec.ts` (specific check 2 protected files block uvádí) — naming change je tedy lead-acknowledged
- Soubor v allowed `e2e/` directory
- 4 testy pokrývají všechny plan §3.10 acceptance scénáře (login, /parts gating, /parts/new wizard, katalog filter, detail render)
- Lepší naming: scope-based (`parts-wholesale`) > task-id-based (`task-182-...`) pro long-term maintenance

Žádná akce potřeba.

### OBS-2 — Minor — Middleware unit test bez WHOLESALE_SUPPLIER positive case

**Severity:** Minor (non-blocker, plan-conditional)

`__tests__/middleware.test.ts:259-267` má test:
```ts
it('pustí PARTS_SUPPLIER na parts stránky', async () => {
  vi.mocked(getToken).mockResolvedValue({ role: 'PARTS_SUPPLIER' } as any)
  ...
})
```

Žádný analogický test pro `role: 'WHOLESALE_SUPPLIER'`.

**Plán §3.6 byl conditional:** „Test impact: `__tests__/middleware.test.ts` — pokud je tam hardcoded role list, přidat WHOLESALE_SUPPLIER do allow-list testu." Implementator zjistil že není hardcoded list (jen positive single test), nemodifikoval.

**Důvod proč non-blocker:**
- Plán deal explicit conditional language
- Middleware change je trivial (1 řádek pole), riziko regrese minimální
- E2E T1 (`parts-wholesale.spec.ts`) pokrývá WHOLESALE_SUPPLIER → /parts gating na integration layer
- Pre-existing convention: jiné role (BUYER, ADVERTISER, INVESTOR) také nemají per-role unit testy v `middleware.test.ts`

**Doporučení (post-#196):** Volitelně přidat 5 řádkový test na WHOLESALE_SUPPLIER positive case v dalším cleanup PR (samostatný task). Není to gate.

### OBS-3 — Observation — PARTS_SUPPLIER_ROLES 3-file lockstep duplikace

**Severity:** Observation (pre-existing convention)

`PARTS_SUPPLIER_ROLES`/`allowedRoles` array je definován 3×:
1. `middleware.ts:16`
2. `app/api/parts/route.ts:21`
3. `app/api/parts/import/route.ts:61`

QA OBS-1 + impl §6 to dokumentují jako pre-existing convention (matches `INZERENT_ROLES`/`MAKLER_ROLES`/`BUYER_ROLES` pattern).

**Důvod proč non-blocker:**
- Pattern je konzistentní s existujícími rolemi v projektu
- Extrakce do shared `lib/roles.ts` je out of scope #182 (gap-fix, ne refactor)
- Riziko drift mezi 3 lockstep místy je nízké pro #182 změnu (přidání 1 role do existujícího pole)

**Doporučení:** Pre-existing tech debt, samostatný cleanup task v budoucnu.

### OBS-4 — Observation — Whitespace-only input edge case

**Severity:** Observation (marginal edge case)

`details.manufacturer || undefined` zachová `" "` (whitespace) jako truthy → uloží `" "` do DB.

**Real impact:** Minimální — uživatel by musel vědomě napsat jen mezery a kliknout Publikovat. Validator `z.string().max(100)` to akceptuje.

**Pokud chceš strictní validation:** `details.manufacturer.trim() || undefined`. Ne pro #196, marginální.

**Doporučení:** Žádná akce. Pokud bude reálný request, samostatný 2-řádkový fix.

---

## §10 — Pipeline plán po SCHVÁLENÍ

Po SCHVÁLENO verdict lead pokračuje:

```
#196 test-chrome — headed Chromium run e2e/parts-wholesale.spec.ts (4 testy)
  → expect 4/4 PASS, screenshots v test-results/

#197 (po test-chrome PASS) DEPLOY — 7-step canonical:
  1. git push origin main (commits 9dfadde..1b539a3)
  2. ssh server cd /var/www/carmakler && git pull origin main
  3. npx prisma migrate deploy (jediná migrace 20260409062848_add_part_manufacturer_warranty)
  4. npx prisma generate
  5. npm run build (expect 18-25s, exit 0)
  6. pm2 reload all
  7. pm2 status + pm2 logs --lines 30 --nostream
  POZN: prisma db seed se NEspustí na produkci (per impl report §7) — schema-only migration, žádný seed delta v produkci

#198 evzen-the-king (já) — deploy shoda-check vs schválený plán + commit pravidla

#199 user presentation — lead handoff, HOTOVO TASK-020
```

**Žádné shortcuts.** Pipeline konzistentní s #161-c uzavřeným pipeline (#175→#179).

---

## §11 — Final verdict

### ✅ SCHVÁLENO

**Implementace #184 je SOLID, plán-compliant a ready for #196 test-chrome.**

- 0 blockerů
- 4 minor observations (E2E naming, middleware test conditional skip, PARTS_SUPPLIER_ROLES duplikace, whitespace edge)
- Všech 5 Q1-Q5 lead decisions přesně implementováno
- Všech 6 §7 additional constraints honored
- File manifest 100% bounded (12 modified + 1 nový e2e + 1 nový migration), 0 protected files dotčeno
- OBS-2 audit trail v Commit A přítomný (Q1 deviation z TASK-020 spec ř. 1833 documented)
- STOP-1 tsvector ritual správně proveden (escalate → fresh ACK → cleaned migration → reset → seed)
- Migration file čistá: 6 řádků, jen ALTER TABLE + CreateIndex, ŽÁDNÉ tsvector modifikace
- QA OBS-3 (empty-string → undefined) verified jako correct optional-field pattern, NE hiding data
- UI: žádné zkratky, žádné skryté stránky, jasné cz labely, accessibility-ready

**Lead může dispatchovat #196 test-chrome (headed run e2e/parts-wholesale.spec.ts).**

Doporučení pro lead:
1. Žádná akce na 4 OBS — všechny non-blocker, 3 z nich pre-existing convention nebo marginální
2. Po #196 PASS dispatch #197 deploy — 7-step canonical
3. POZN: na produkci `prisma db seed` se NEspustí (schema-only migration, žádný seed delta v produkci) — impl report §7 a §8 to dokumentují

---

**Konec review #195.**
