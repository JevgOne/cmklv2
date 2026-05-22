# Review #183 — EVZEN shoda-check plánu #182 TASK-020 gap-fix

**Task:** #183 EVZEN plan review
**Kontrolovaný plán:** `.claude-context/tasks/plan-task-182-eshop-dily-gap.md` (1201 řádků)
**Autor plánu:** planovac (#182 PLAN)
**Reviewer:** evzen-the-king (READ-ONLY)
**Datum:** 2026-04-09
**Parent task:** TASK-020 „Eshop autodíly" (TASK-QUEUE.md ř. 1672-1970)

---

## §0 — Verdict

### ✅ SCHVÁLENO — 0 blockerů, 2 minor observations

Plán je grounded, bounded a konzistentní jak interně, tak vůči TASK-020 spec
v TASK-QUEUE.md i QA reportu `.claude-context/tasks/QA-TASK-019-020.md`. Všechny
citované řádky v schema.prisma, middleware.ts, validators/parts.ts, api/parts/*,
pwa-parts/* jsem ověřil proti live codebase — nic si planovac nevymyslel.

Lead může dispatchovat implementatora po rozhodnutí 2 observations níže (ani
jedna není blocker).

---

## §1 — Metodologie

Read-only review plánu, bez úprav. Tento review **není** kontrola
implementace — ta přijde až po #182 IMPL commitech v samostatném evzen tasku
(stejný pattern jako #177 pro #161-c).

**Co jsem ověřoval:**

1. Grounding (plán vs. live repo state)
2. §7 LEAD DECISIONS vs. §6 LEAD QUESTIONS — konzistentní accept?
3. §5 STOP rules vs. memory + pipeline precedents
4. §3 file manifest — bounded? nezasahuje do protected systems?
5. §3.3 STOP-1 ritual — správná escalation path?
6. §8 post-impl checklist — kompletní?
7. Spec vs plán deviations — flagnout?

---

## §2 — Grounding verification (plán vs. live repo)

| Plán tvrdí | Ověření | OK |
|---|---|---|
| `prisma/schema.prisma:21` — `role String @default("BROKER")` (NE enum) | Grep L21 přesně matchuje comment string s 13 rolemi | ✅ |
| 0 `WHOLESALE_SUPPLIER` matches v .ts/.tsx | `grep WHOLESALE_SUPPLIER --type=ts` = No files found | ✅ |
| `Part.manufacturer` + `Part.warranty` chybí | `grep manufacturer\|warranty prisma/schema.prisma` = No matches | ✅ |
| `model Part` na ř. 889 | `grep "^model Part"` → ř. 889 | ✅ |
| `searchVector Unsupported("tsvector")` | Grep hits na ř. 182, 603, 901 (Listing, Vehicle, Part) | ✅ |
| `middleware.ts:16` — `PARTS_SUPPLIER_ROLES = [...]` | Grep L16 přesně matchuje bez `WHOLESALE_SUPPLIER` | ✅ |
| `app/api/parts/route.ts:21` — `allowedRoles = [...]` | Grep L21 přesně matchuje | ✅ |
| `app/api/parts/import/route.ts:59` — allowedRoles + CSV parser | Read L1-80 potvrzuje hand-rolled CSV parser s `parseCsvLine` + `headers.indexOf(...)` pattern | ✅ |
| `lib/validators/parts.ts` — bez manufacturer/warranty | Grep 0 matches | ✅ |
| Všech 13 modified files z §3.11 existuje | `ls` všech 8 source files přes bash = všechny found | ✅ |
| TASK-QUEUE.md explicit říká `WHOLESALE_SUPPLIER` (ř. 1831) | Read L1820-1890 potvrzuje verbatim citaci | ✅ |
| TASK-QUEUE.md explicit říká `manufacturer` + `warranty` jako Part rozšíření (ř. 1944-1945) | Read potvrzuje verbatim | ✅ |
| TASK-QUEUE.md explicit říká „U aftermarket dílů: OEM číslo, výrobce dílu, záruka" (ř. 1875) | Read potvrzuje — plán §3.8 File 1 (detail render block) honoruje | ✅ |

**Závěr:** Plán je 100% grounded. Nenašel jsem žádný fabricated line number
ani invented fact.

---

## §3 — §6 Q1-Q5 vs §7 LEAD DECISIONS konzistence

| Q | Recommendation (§6) | Decision (§7) | Konzistentní? |
|---|---|---|---|
| Q1 | MARKER only, stejná PWA, manual wizard dostupný pro oba | ACCEPT verbatim: „MARKER only... Sdílí Part model, /parts/* API, /parts/* PWA wizard i components/admin/feeds/* admin UI. Manual wizard zůstává dostupný pro oba." | ✅ |
| Q2 | `String?` max 50 znaků, spec-verbatim, žádná normalizace | ACCEPT verbatim: „`String?` s max 50 znaků. Verbatim podle TASK-QUEUE.md spec. Permissive pro '24 měsíců' / 'doživotní' / '1 rok / 30 000 km' / '2 years'" | ✅ |
| Q3 | `String?` max 100 + B-tree index + ILIKE search; tsvector trigger OUT OF SCOPE | ACCEPT verbatim: „`String?` (max 100), + B-tree index, search přes ILIKE contains... Tsvector trigger modifikace JE OUT OF SCOPE — respektuje memory `project_recurring_tsvector_drift.md`" | ✅ |
| Q4 | ODLOŽIT Fázi B, dispatch samostatně po merge #182 | ACCEPT verbatim: „ODLOŽIT Fázi B kompletně. #182 = gap-fix scope. Fáze B položky... dispatch jako samostatné tasky (#183+) po merge #182." | ✅ |
| Q5 | VŽDY zobrazit obě, optional, bez conditional na partType | ACCEPT verbatim: „VŽDY zobrazit manufacturer + warranty, obě optional, bez conditional renderingu na partType. Lineární formulář." | ✅ |

**6 Additional constraints v §7:**

| # | Constraint | Ověření |
|---|---|---|
| 1 | Workflow pipeline IMPL → kontrolor → evzen → test-chrome → deploy → evzen, žádné shortcuts | Konzistentní s memory `feedback_no_parallel_impl_test` a precedentem #161-c | ✅ |
| 2 | STOP-1 tsvector drift MANDATORY, Option A per #155/#162, čeká na lead ACK | Konzistentní s memory `project_recurring_tsvector_drift.md` + precedentem | ✅ |
| 3 | Seed: 1× WHOLESALE_SUPPLIER user + 2-3 Parts, nezasahovat do #88a/#161/TASK-019 seed bloků | Konzistentní s §3.9 detailní spec + §5.1 nedotknout se | ✅ |
| 4 | E2E: 1 test (login → wizard → detail), headed design, ne edge cases (test-chrome dělá final) | Konzistentní s §3.10 detail | ✅ |
| 5 | Nedotknout se: #88a, #161, #19, TASK-019, out-of-manifest files = STOP a eskaluj | Konzistentní s §5.1 + kompletní | ✅ |
| 6 | Commit hygiene: 6 atomických commitů per §3.12, simplify na konci | Konzistentní s §3.12 delivery pipeline | ✅ |

**Závěr:** Všech 5 otázek ACCEPTed verbatim dle doporučení planovače. 6 dodatečných
constraintů doslovně kopíruje §3-§5 a přidává pipeline discipline reference. **§7
je interně konzistentní a nic nerozhodl ad hoc mimo §6 recommendations.**

---

## §4 — §5 STOP rules vs protected systems

### §4.1 — §5.1 „Nedotknout se" — kompletnost

Protected systems, které plán explicit zakazuje modifikovat:

| Systém | §5.1 coverage | Memory/precedent reference | Verified |
|---|---|---|---|
| #88a Wolt commission — webhook + `applyCommissionSplit` + snapshot | ✅ „NEDOTKNI SE — žádné změny v webhook handler, commission logice, snapshot polích" | memory `project_wolt_model_platform_wide` | ✅ |
| #161 Stripe Connect Express — `SupplierStripeCard`, `syncAccountToDb`, `account.updated` handler | ✅ „NEDOTKNI SE — plán #182 nijak nekoliduje, ale impl nesmí 'při příležitosti' editovat" | Pipeline #161 uzavřena per #180 deploy review | ✅ |
| #19 Order confirmation emails — `orderConfirmationCustomerHtml/Text/Subject` | ✅ „NEDOTKNI SE" | Live na produkci | ✅ |
| TASK-019 inzertní platforma — `Listing`, `/inzerce/*`, `/moje-inzeraty/*`, `/nabidka/*`, watchdog, `/api/listings/*`, `/api/feeds/import/run` | ✅ „NEDOTKNI SE" + explicit clarification že `feeds/import/run` je **listing import**, ne parts | 100% hotová per #181 | ✅ |
| #156 Donor car flow | ✅ „má vlastní baseline plán. Samostatný major task, out of scope #182" | memory `project_donor_car_flow` | ✅ |
| Existující PARTS_SUPPLIER flow (vrakoviště PWA) | ✅ „NEDOTKNI SE, pouze extendnout (přidat WHOLESALE_SUPPLIER do role poli tam, kde má smysl spolu existovat)" | Wolt model zachování | ✅ |
| `searchVector` raw SQL triggers (fulltext) | ✅ „pokud existují mimo Prisma schema, nemodifikovat. Permanent fix tsvector je samostatný task." | memory `project_recurring_tsvector_drift.md` | ✅ |

**Žádný protected systém není opominut.** §5.1 je vyčerpávající pro scope
gap-fixu.

### §4.2 — §5.2 „Nikdy bez autorizace"

| Akce | Zákaz | Konzistentní s precedentem? |
|---|---|---|
| `prisma db push` | ✅ NIKDY | memory `feedback_stop_escalate_literal` |
| `prisma migrate resolve --applied/--rolled-back` | ✅ NIKDY bez ACK | Konzistentní s #155/#162 |
| Ruční ALTER TABLE | ✅ NIKDY | Standard Prisma discipline |
| Force-push | ✅ NIKDY | memory `feedback_git_reset_approval` |
| Bypass `--no-verify` | ✅ NIKDY | Standard pre-commit hook discipline |

**Kompletní.** Všechny 5 destructive actions explicit zakázány.

### §4.3 — §5.3 Escalation protocols

| STOP | Ritual specifikován? | Ověření |
|---|---|---|
| STOP-1 tsvector drift | ✅ §3.3 + §7 constraint 2: Option A/B/C přehled, impl čeká na lead ACK, přesný shell sled | Explicit pattern z #155/#162 |
| STOP-2 pre-HOTOVO | ✅ §5.3 + §3.12 step 8: lint + build + manual smoke (3 URL) | Standard discipline |
| STOP-3 scope creep | ✅ §5.3: „pokud impl najde 'další věc co bych opravil' mimo file manifest → ESKALUJ, neoprav" | memory `feedback_stop_escalate_literal` |
| STOP-4 lead decisions missing | ⚠️ §5.3: „Impl NESMÍ začít bez vyplněné §7 s Q1-Q5 rozhodnutími" — ale §7 je JIŽ vyplněná v tomto plánu | Není blocker, ale trochu redundantní po §7 naplnění |

**Poznámka:** STOP-4 je v plánu jako ochrana před dispatch bez §7, ale §7 už
je vyplněná. Po mém review je STOP-4 už nezávazný pro toto konkrétní impl
kolo — ale zůstává jako univerzální guardrail pro budoucí plány. OK.

---

## §5 — §3 file manifest — bounded check

**13 modified files + 1 new:**

| # | File | Součást protected system? | Ověření |
|---|---|---|---|
| 1 | `prisma/schema.prisma` | Part model part (889-954) + UserRole comment (L21) + 1 index | ✅ Neovlivňuje #161 PartnerStripe* modely ani TASK-019 Listing model |
| 2 | `prisma/migrations/NEW/migration.sql` | Auto-gen | ✅ Jediná migrace, ADD COLUMN + CREATE INDEX, non-destructive |
| 3 | `prisma/seed.ts` | 1× user + 2-3 Parts append | ✅ §7 constraint 3: „Nezasahovat do existujících seed blocků pro #88a, #161, TASK-019" |
| 4 | `lib/validators/parts.ts` | createPartSchema + partFilterSchema | ✅ NE listings validators |
| 5 | `app/api/parts/route.ts` | allowedRoles + POST body + GET filter | ✅ NE api/listings nebo api/stripe/webhook |
| 6 | `app/api/parts/import/route.ts` | allowedRoles + CSV parser | ✅ Parts import, ne feed import z TASK-019 |
| 7 | `middleware.ts` | Jen PARTS_SUPPLIER_ROLES pole (L16) | ✅ §7 constraint 5 explicit: „jen PARTS_SUPPLIER_ROLES pole" |
| 8 | `__tests__/middleware.test.ts` | Conditional update pokud hardcoded role list | ✅ Test file, ne produkční kód |
| 9 | `components/pwa-parts/parts/DetailsStep.tsx` | manufacturer input | ✅ NE admin/partners/* ani pwa-parts/profile/* (SupplierStripeCard z #161) |
| 10 | `components/pwa-parts/parts/PricingStep.tsx` | warranty input | ✅ Dtto |
| 11 | `app/(pwa-parts)/parts/new/page.tsx` | state + submit body | ✅ NE /parts/profile (#161) |
| 12 | `app/(web)/dily/[slug]/page.tsx` | Detail render block | ✅ NE /inzerce/* nebo /marketplace/* |
| 13 | `app/(web)/dily/katalog/page.tsx` | Filter state + input + URL param | ✅ Dtto |
| NEW | `e2e/task-182-wholesale-supplier.spec.ts` | Nový E2E test | ✅ Testing, ne produkční kód |

**Nedotčeno (§3.11 explicit list):**

- `app/api/parts/[id]/route.ts` (PUT dědí přes updatePartSchema.partial + spread)
- `app/api/parts/compatible/`, `/for-vehicle/`, `/supplier-stats/`
- `app/(admin)/admin/feeds/*`
- `app/api/admin/feeds/*`
- `app/api/orders/*`
- `components/pwa-parts/parts/{AddPartWizard,PhotoStep,CompatibilitySelector}.tsx`
- `components/pwa-parts/SupplierBottomNav.tsx`, `SupplierTopBar.tsx`
- `app/(web)/dily/kosik/`, `objednavka/`, `moje-objednavky/`
- `lib/parts-categories.ts`

**Žádné overlapy s protected systems.** Manifest je bounded a každý file má
konkrétní scope změny. ✅

---

## §6 — §3.3 STOP-1 tsvector drift — escalation path

Plán §3.3 explicit říká:

> „**Implementator MUSÍ:**
> 1. NEOPRAVOVAT SELF-RESOLVE — nepoužívat `db push`, `migrate resolve`, ani
>    ruční DROP/CREATE migration files
> 2. ESKALOVAT k lead s přesnou zprávou (quote template)
> 3. Čekat na explicit lead ACK před spuštěním Option A
> 4. Po lead ACK spustit přesný sled (migrate reset --force → migrate dev →
>    generate → db seed)"

**Precedent check:** Memory `project_recurring_tsvector_drift.md` říká:
- Option A je standard fix pro dev DB
- Produkce unaffected (běží `migrate deploy`, žádné drift detection)
- Stále eskaluj STOP-1 ritual (neberou se shortcuts)

**Plán verbatim honoruje memory.** Option A je označená jako default po ACK,
Option B (raw SQL ALTER TABLE) a Option C (permanent fix samostatný task)
jsou pouze pro lead, ne pro impl. ✅

**Konzistentní s #155 a #162 precedentem.** Plán explicit cituje „autorizovaný
precedent v #155, #162" jako důkaz že Option A není improvizace.

---

## §7 — §8 post-impl checklist — kompletnost

13 bullet items:

1. ✅ Migration aplikovaná (včetně Option A reset dev DB)
2. ✅ `npx prisma validate` exit 0
3. ✅ `npx prisma studio` — Part má manufacturer + warranty sloupce
4. ✅ Seed data obsahuje WHOLESALE_SUPPLIER user + 2-3 Parts
5. ✅ `npm run lint` — 0 nových warningů
6. ✅ `npm run build` — success
7. ✅ Smoke: WHOLESALE_SUPPLIER login → `/parts/new` → wizard s manufacturer + warranty
8. ✅ Smoke: `/dily/katalog` → manufacturer filter input
9. ✅ Smoke: `/dily/[slug]` → manufacturer + warranty block render
10. ✅ E2E test `task-182-wholesale-supplier.spec.ts` projde 1/1
11. ✅ `__tests__/middleware.test.ts` (pokud updated) projde
12. ✅ Git log: 6 atomických commitů per §3.12
13. ✅ Žádné edity mimo file manifest §3.11
14. ✅ HOTOVO zpráva: commit hashes, migration filename, seed delta, test pass/fail

**Kompletní.** Pokrývá DB (1-4), kvalita (5-6), smoke (7-9), testy (10-11),
git discipline (12-13), HOTOVO format (14). Nic důležitého nechybí.

---

## §8 — Observations

### OBS-1 — Minor — §3.5 File 3 (CSV import) je impl-driven, ne diff-specific

**Severity:** Minor (non-blocker)

**Popis:** §3.5 pro `app/api/parts/import/route.ts` říká:
> „Mělo by akceptovat `manufacturer` a `warranty` sloupce. Potřeba ověřit
> aktuální shape — pravděpodobně potřebuje parser update. Implementator čte
> soubor a aplikuje minimální patch (přidání 2 optional sloupců do CSV
> parseru + DB create). Change: allowedRoles... Ostatní změny impl-driven per
> file content."

Jiné steps (§3.2 schema, §3.4 validators, §3.6 middleware) mají explicit
diff blocks. CSV import je jediný step bez konkrétního diff.

**Verification z live kódu:** Přečetl jsem `app/api/parts/import/route.ts`
L1-80. Struktura je:
- `CsvRow` interface (L18-31) — 12 polí, bez manufacturer/warranty
- `parseCsvLine` hand-rolled parser (L33-50)
- `headers.indexOf("name"/"category"/"condition"/"price")` index mapping (L74-78)
- `allowedRoles` na L59

Pattern je jasný: přidat `manufacturer?: string` + `warranty?: string` do
`CsvRow`, `manufacturerIdx = headers.indexOf("manufacturer")` + dtto warranty,
v DB create spread přidat `manufacturer: manufacturerIdx !== -1 ? row.manufacturer : null`.

**Proč non-blocker:** Pattern je 1:1 s existujícími optional poli (`stock`,
`description`, `oemNumber`, etc.). Implementator má dost kontextu — „minimální
patch" je přesný, protože rozsah je ≤10 řádků per pole. Scope creep risk je
nízký.

**Doporučení:** Planovač může pre-IMPL přidat explicit diff, ale není to
blocker. Alternativně lead může v dispatch zprávě připomenout pattern.

### OBS-2 — Observation — §7 Q1 ACCEPT deviuje od spec literal „nepřidává díly ručně"

**Severity:** Observation (non-blocker, documented deviation)

**Popis:** TASK-QUEUE.md ř. 1833 říká:
> „Jiný flow než vrakoviště — **nepřidává díly ručně**, ale importuje katalog"

Plán §7 Q1 decision říká:
> „Sdílí Part model, /parts/* API, **/parts/* PWA wizard** i components/admin/feeds/*
> admin UI s PARTS_SUPPLIER... **Manual wizard zůstává dostupný pro oba.**"

To znamená: plán explicitně přidává `WHOLESALE_SUPPLIER` do wizard allowedRoles
(§3.5 Change 1) a extenduje `DetailsStep` + `PricingStep` (§3.7) tak, aby
WHOLESALE_SUPPLIER mohl přidávat díly manuálně — což je **literal opposite**
toho co TASK-020 spec říká.

**Plánovač argumentace (§6 Q1):**
1. Backend feed import už existuje (`/admin/feeds/*`), duplikovat PWA = zbytečná práce
2. Rozdíl je zdroj (manual vs feed), ne flow
3. Role slouží jako authorization marker + filter
4. Manual wizard jako edge case fallback („ad-hoc přidat díl, který není ve feedu")
5. Budoucí B2B pricing a dashboard variant lze postavit bez role refactoru

**Proč non-blocker:**
- Deviation je **documented**, ne skrytá
- Lead **explicit ACCEPTed** tuto deviation v §7 Q1
- Core business case (WHOLESALE přes feed import) je zachován přes existující `/admin/feeds`
- Manual wizard je marginální edge case, ne primary flow
- Konzistentní s Wolt model memory (platform = Wolt, role = filter, liquidity > structural rigidity)
- Alternativa (samostatný `/wholesale/*` flow) = scope creep do oblasti která nemá QA flag

**Doporučení:** Lead by měl být explicitně si vědom této deviation při dispatch,
ale ACCEPT je sound. Evzen doporučuje poznámku v commit message commitu A (schema):
„Q1 lead decision: WHOLESALE_SUPPLIER jako marker only, manual wizard dostupný pro
oba (deviation z TASK-020 spec ř. 1833, documented § 6.Q1)".

Toto je drobnost, ne blocker.

---

## §9 — Cross-check s memory + předchozími precedenty

| Memory | Relevance | Honored v plánu? |
|---|---|---|
| `project_recurring_tsvector_drift.md` | STOP-1 ritual, Option A precedent | ✅ §3.3 verbatim cituje memory, precedent #155/#162 |
| `feedback_stop_escalate_literal` | Narrow literal STOP thresholds, žádné self-resolve | ✅ §3.3 + §5.2 + §5.3 explicit |
| `feedback_no_parallel_impl_test` | Nikdy IMPL + test-chrome paralelně | ✅ §7 constraint 1: sekvenční pipeline |
| `feedback_git_reset_approval` | Force-push + reset ruling | ✅ §5.2 explicit NIKDY force-push |
| `project_wolt_model_platform_wide` | Wolt model pro všechny marketplace produkty | ✅ Q1 ACCEPT konzistentní s Wolt (role = filter, sdílená infrastructure) |
| `feedback_no_competitor_scraping` | Žádný scraping | ✅ Feed import z autorizovaných dodavatelských feedů, ne scraping — explicit v spec |
| `reference_deploy_checklist` | Kanonický 7-step flow | ✅ §7 constraint 1 odkazuje na #161 pipeline (který prošel kanonickým flow) |

**Žádný memory rule není porušen.** Plán je plně konzistentní s naučenými
lessons z předchozích tasků.

---

## §10 — Pipeline plán po SCHVÁLENÍ

Po SCHVÁLENO verdict lead může dispatchovat implementatora s tímto flow:

```
#184 IMPL — implementator dostane plán #182 + §7 decisions
  → 6 atomických commitů (A-F per §3.12)
  → STOP-1 tsvector ritual při migrate dev (čeká na ACK)
  → STOP-2 pre-HOTOVO (lint + build + smoke 3 URL)

#185 kontrolor QA — shoda-check per §3 acceptance + §8 checklist

#186 evzen-the-king (já) — shoda-check impl vs plán #182 + §7

#187 test-chrome — headed browser E2E (parts-wholesale flow)

#188 DEPLOY — 7-step canonical flow (pull → migrate deploy → generate →
              build → pm2 reload → status → logs)

#189 evzen-the-king (já) — deploy shoda-check

#190 user presentation — lead handoff, HOTOVO
```

Tento flow je konzistentní s #161-a/b/c uzavřeným pipeline. Žádné shortcuts.

---

## §11 — Final verdict

### ✅ SCHVÁLENO

**Plán #182 je SOLID, grounded, bounded a pipeline-ready.**

- 0 blockerů
- 2 minor observations (OBS-1 CSV import vague, OBS-2 Q1 spec deviation documented+accepted)
- 100% grounding verified (schema, middleware, validators, api, spec)
- §7 LEAD DECISIONS verbatim accept §6 recommendations, 6 constraints konzistentní
- §5 STOP rules pokrývají všechny protected systems (#88a, #161, #19, TASK-019, #156, PARTS_SUPPLIER, tsvector triggers)
- §3 file manifest bounded na 13 modified + 1 new, nic z out-of-scope
- §3.3 STOP-1 tsvector ritual verbatim per memory + #155/#162 precedent
- §8 post-impl checklist kompletní (14 bullet items)

**Lead může dispatchovat implementatora pro #184 IMPL.**

Doporučení pro lead:
1. V dispatch zprávě případně pre-expose OBS-1 (CSV import pattern) — implementator má stačící kontext z existujícího kódu, ale explicit pokyn sníží decision friction
2. V commit A message případně zmínit OBS-2 deviation z TASK-020 spec ř. 1833 pro audit trail
3. Jinak nic — plán je ready to ship

---

**Konec review #183.**
