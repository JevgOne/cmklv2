# Plán #197 — Fix test-chrome RED #196 (3 defekty TASK-020 #184)

**Autor:** planovac
**Datum:** 2026-04-09
**Task ID:** 197
**Parent:** #184 (IMPL TASK-020 gap-fix, commits `9dfadde`→`1b539a3`)
**Trigger:** test-chrome #196 RED report `.claude-context/tasks/chrome-test-task-196-184.md` (0/4 pass)
**References:** plan-task-182 §7 LEAD DECISIONS Q1-Q5 (verbatim ACCEPT)

---

## §0 — Executive summary

Test-chrome v #196 hlásil RED 0/4 se 3 funkčními defekty. **Live DB + source code verification** během research ukázala, že ze 3 defektů:

- **Defekt A (login redirect) = skutečný IMPL BUG** — plán #182 explicitně nezahrnul `app/(web)/login/page.tsx` do file manifestu, switch pro WHOLESALE_SUPPLIER chybí, fallthrough → `/` → test fail. Per §7 Q1 ACCEPT „MARKER only, stejná PWA jako PARTS_SUPPLIER" musí WHOLESALE_SUPPLIER jít na `/parts/my` (totéž jako PARTS_SUPPLIER).

- **Defekt B (manufacturer filter 0 results) = DEV SERVER / RUNTIME CACHE, NE code bug** — source code je 100 % v pořádku (`partFilterSchema` má `manufacturer` ✅, API GET where clause má `contains` + `insensitive` ✅, schema má sloupce + index ✅, migrace proběhla ✅, seed má populated rows ✅). Confirmed přes `psql`: DB obsahuje 3 wholesale rows s manufacturer+warranty populated. Confirmed přes `curl /api/parts`: response **nevrací** `manufacturer`/`warranty` fields a `curl /api/parts?manufacturer=TRW` vrací `"Interní chyba serveru"` → dev server má **starý Prisma Client v runtime paměti** (proces byl spuštěn před `prisma generate`, HMR soubory .prisma/client nesleduje).

- **Defekt C (detail page manufacturer + warranty missing) = SAME root cause jako B** — Server Component `app/(web)/dily/[slug]/page.tsx` používá stejný Prisma Client, runtime `part.manufacturer` = undefined → conditional render block neaktivní. Kód je správný (řádky 235-254), jen Prisma runtime typy jsou stale.

**Test-chrome spec je sám OK** — nenavrhuje `/parts/wholesale` jako target (wide regex `/\/(admin|dashboard|parts|makler|marketplace)/` by pustil i `/parts/my`), a `warrantyMonths` v error reportu byl interpretační artefakt od test-chrome agenta, NE očekávání v specu (spec hledá substring `"24 měsíců"` per §7 Q2 ACCEPT `String?`).

**Fix scope:** 1 code change (login page switch) + 1 env reset (restart Next.js dev + ensure `prisma generate` aktuální) + re-run test-chrome. **Bez DB migrace, bez seed změn, bez api/validator/schema edit.**

---

## §1 — Test-chrome evidence rekapitulace

Full report: `.claude-context/tasks/chrome-test-task-196-184.md` (2026-04-08, runner TEST-CHROME sonnet-4-6, verdict RED 0/4).

| Test | Spec line | Error | Observed |
|------|-----------|-------|----------|
| T1 | `e2e/parts-wholesale.spec.ts:43` | `page.waitForURL` timeout 12000ms | `navigated to "http://localhost:3000/"` (login fallthrough) |
| T2 | `e2e/parts-wholesale.spec.ts:60-67` | Nedostane se k wizard asserci, T1 `loginAs()` helper timeout | Blokováno T1 |
| T3 | `e2e/parts-wholesale.spec.ts:94` | `expect(hasTrwResult).toBeTruthy()` → false | `/dily/katalog` s fill("TRW") → „0 produktů v nabídce" |
| T4 | `e2e/parts-wholesale.spec.ts:120` | `expect(hasWarranty).toBeTruthy()` → false | Title „Brzdové destičky přední TRW" ✅ present, ale body neobsahuje „24 měsíců" ani „Výrobce" |

Screenshoty v `test-results/parts-wholesale-*` (dostupné pro debugging).

---

## §2 — Root cause analysis per defekt

### §2.1 — Defekt A: Login redirect missing WHOLESALE_SUPPLIER

**Classification: IMPL BUG (sekundárně PLAN GAP #182)**

**Source:** `app/(web)/login/page.tsx:60-93`

```tsx
const role = session?.user?.role;
switch (role) {
  case "ADMIN":
  case "BACKOFFICE":
  case "REGIONAL_DIRECTOR":
  case "MANAGER":
    router.push("/admin/dashboard");
    break;
  case "BROKER":
    router.push("/makler/dashboard");
    break;
  case "ADVERTISER":
    router.push("/moje-inzeraty");
    break;
  case "PARTS_SUPPLIER":
    router.push("/parts/my");
    break;
  case "INVESTOR":
    router.push("/marketplace/investor");
    break;
  case "VERIFIED_DEALER":
    router.push("/marketplace/dealer");
    break;
  case "PARTNER_BAZAR":
  case "PARTNER_VRAKOVISTE":
    router.push("/partner/dashboard");
    break;
  case "BUYER":
    router.push("/shop/moje-objednavky");
    break;
  default:
    router.push("/");
    break;
}
```

**Co chybí:** `case "WHOLESALE_SUPPLIER"` → ale protože role **není v switch**, padá na `default: router.push("/")` → `loginAs()` helper v specu čeká `waitForURL(/\/(admin|dashboard|parts|makler|marketplace)/)` → homepage `/` nematchuje → timeout.

**Proč to impl #184 neudělal:** plán #182 §3 Phase A scope soubory (§3.5 API route, §3.6 middleware, §3.7 wizard, §3.8 web UI, §3.9 validators, §3.10 seed) — **`app/(web)/login/page.tsx` tam není**. Plán zmiňuje `middleware.ts` allowedRoles update a `api/parts/route.ts` allowedRoles update, ale přehlédl login page redirect switch. Impl #184 přesně dodržel file manifest a respektoval STOP rule „žádné edity mimo file manifest §3.11" → nemohl login page diff provést.

**Per §7 Q1 ACCEPT („MARKER only, stejná PWA jako PARTS_SUPPLIER"):** redirect target musí být **stejný jako PARTS_SUPPLIER**, tj. **`/parts/my`**.

**Fix:** 3-řádkový diff v login page switch (§3.1).

---

### §2.2 — Defekt B: Manufacturer filter vrací 0 výsledků / 500 error

**Classification: DEV SERVER RUNTIME CACHE (NE code bug, NE test bug, NE seed bug)**

**Evidence:**

1. **Schema OK** — `prisma/schema.prisma:906-907`:
   ```prisma
   manufacturer String? // Např. "TRW", "Bosch", "LUK"
   warranty     String? // Např. "24 měsíců", "zákonná", "doživotní"
   ```
   `@@index([manufacturer])` na řádce 958.

2. **Migrace OK** — `prisma/migrations/20260409062848_add_part_manufacturer_warranty/migration.sql`:
   ```sql
   ALTER TABLE "Part" ADD COLUMN "manufacturer" TEXT, ADD COLUMN "warranty" TEXT;
   CREATE INDEX "Part_manufacturer_idx" ON "Part"("manufacturer");
   ```

3. **Validator OK** — `lib/validators/parts.ts:51`: `partFilterSchema` má `manufacturer: z.string().optional()`.

4. **API route OK** — `app/api/parts/route.ts:105-107`:
   ```ts
   if (filters.manufacturer) {
     where.manufacturer = { contains: filters.manufacturer, mode: "insensitive" as const };
   }
   ```

5. **Seed OK (verified via psql)** — query:
   ```sql
   SELECT slug, manufacturer, warranty FROM "Part" WHERE slug IN
     ('trw-brzdove-desticky-octavia-iii', 'bosch-alternator-passat-b8', 'sachs-tlumic-zadni-octavia');
   ```
   Výstup:
   ```
                  slug               | manufacturer | warranty
   ----------------------------------+--------------+-----------
    bosch-alternator-passat-b8       | Bosch        | zákonná
    sachs-tlumic-zadni-octavia       | Sachs        | 24 měsíců
    trw-brzdove-desticky-octavia-iii | TRW          | 24 měsíců
   ```
   **DB má correct data ✅.**

6. **Prisma Client generated code OK** — `grep manufacturer|warranty node_modules/.prisma/client/index.d.ts` → 101 hits, confirmed:
   ```ts
   manufacturer: string | null
   warranty: string | null
   ```
   Type definitions zahrnují sloupce ✅.

**Co nefunguje:**

Live `curl` na dev server (PID `10712`, uptime ~3.7h, start time 12:30):
```bash
curl -s "http://localhost:3000/api/parts?manufacturer=TRW"
# {"error":"Interní chyba serveru"}

curl -s "http://localhost:3000/api/parts"
# {"parts":[{"id":"...","slug":"sachs-tlumic-zadni-octavia", ...
#  NO "manufacturer" field in response
#  NO "warranty" field in response
```

**Root cause:** Next.js dev server proces byl spuštěn **před** `prisma generate` (nebo před tím regeneraterem). V runtime paměti má **starý `@prisma/client`** bez `manufacturer`/`warranty` fields. Server Component Prisma query vrací rows bez těchto sloupců (generated SELECT je postaven nad starými typy). Pokud `where.manufacturer` je nastaveno, Prisma binding selže → catch block → 500.

Toto je **KLASICKÝ Next.js dev server cache pitfall**: `node_modules/.prisma/client/*` není watched fs; HMR pro něj nic neudělá. Po `prisma generate` je MUSÍŠ restartovat dev server manuálně.

**Fix:** Restart Next.js dev serveru + pro jistotu `npx prisma generate` znovu. Žádná code změna. (Detail §3.2.)

---

### §2.3 — Defekt C: Detail page manufacturer + warranty missing

**Classification: SAME root cause jako §2.2 — DEV SERVER RUNTIME CACHE**

**Evidence:**

1. **Source code OK** — `app/(web)/dily/[slug]/page.tsx:235-254`:
   ```tsx
   {(part.manufacturer || part.warranty) && (
     <div className="mb-6 p-4 bg-gray-100 rounded-xl space-y-2">
       {part.manufacturer && (
         <div className="flex justify-between text-sm">
           <span className="font-bold text-gray-700 uppercase tracking-wide">
             Výrobce
           </span>
           <span className="text-gray-900">{part.manufacturer}</span>
         </div>
       )}
       {part.warranty && (
         <div className="flex justify-between text-sm">
           <span className="font-bold text-gray-700 uppercase tracking-wide">
             Záruka
           </span>
           <span className="text-gray-900">{part.warranty}</span>
         </div>
       )}
     </div>
   )}
   ```
   Conditional wrapper + per-field conditional ✅.

2. **DB data OK** (viz §2.2 psql output) — `trw-brzdove-desticky-octavia-iii` má `manufacturer="TRW"`, `warranty="24 měsíců"`.

3. **Live curl evidence:**
   ```bash
   curl -s http://localhost:3000/dily/trw-brzdove-desticky-octavia-iii \
     | grep -oE "(Výrobce|24 měsíců|Záruka|TRW|Brzdové destičky přední)" | sort -u
   # Brzdové destičky přední   ← ✅ title
   # TRW                        ← ✅ z title
   # Záruka                     ← ✅ jen z ProductDetailTabs tab label (line 28)
   ```
   **Nezobrazuje „Výrobce" ani „24 měsíců"** — nový conditional block nerenderuje.

**Root cause:** Server Component `DilyDetailPage` používá stejný Prisma Client jako API routes. Runtime `prisma.part.findFirst(...)` vrací Part row, ale Prisma Client v dev serveru paměti neví o sloupcích `manufacturer`/`warranty` → nejsou ve vráceném object → `part.manufacturer` je `undefined` → vnější conditional `(part.manufacturer || part.warranty) && (...)` je falsy → celý block přeskočí. ProductDetailTabs ale MÁ vlastní tab „Záruka" (line 28 v `ProductDetailTabs.tsx`) → proto test T4 vidí slovo „Záruka" v body text, ale ne hodnotu „24 měsíců".

**Poznámka o „warrantyMonths":** test-chrome report v §3 Issues zmínil „`Render warrantyMonths value`" — to je interpretační free-text od test-chrome agenta, **ne skutečné očekávání specu**. Spec `e2e/parts-wholesale.spec.ts:110` hledá substring `"24 měsíců"`, což odpovídá §7 Q2 ACCEPT (`warranty String?`). Žádná modifikace fieldu na `warrantyMonths Int?` **NE**ní potřeba a byla by regression vs §7 Q2.

**Fix:** Stejný restart dev serveru jako §2.2, žádná code změna.

---

## §3 — Fix plan per defekt

### §3.1 — Fix A: Login page WHOLESALE_SUPPLIER redirect

**File:** `app/(web)/login/page.tsx`

**Change — přidat case mezi `PARTS_SUPPLIER` a `INVESTOR` (řádek ~74-76):**

```diff
       case "PARTS_SUPPLIER":
         router.push("/parts/my");
         break;
+      case "WHOLESALE_SUPPLIER":
+        router.push("/parts/my");
+        break;
       case "INVESTOR":
         router.push("/marketplace/investor");
         break;
```

**Rationale:** Per plan-task-182 §7 Q1 ACCEPT („MARKER only, stejná PWA jako PARTS_SUPPLIER"), WHOLESALE_SUPPLIER sdílí `/parts/*` PWA s PARTS_SUPPLIER. Stejný redirect target = `/parts/my`. Žádná separate landing, žádná nová route, žádná duplicitní PWA.

**Alternativa zvážena a zamítnuta:** Sloučit jako fallthrough `case "PARTS_SUPPLIER":\ncase "WHOLESALE_SUPPLIER":` (ES switch fallthrough) — stejný behavior, méně řádků, ale **grep-friendly separate case je preferovaný** pro budoucí maintainability (kdyby někdo chtěl oddělit targets, nemusí hunt fallthrough pattern). Impl může volitelně použít fallthrough — není blokující.

**Acceptance:**
- `npm run build` success
- Smoke: login email=`velkoobchod@carmakler.cz` password=`heslo123` → URL obsahuje `/parts/my` (ne `/`)
- Test T1 `e2e/parts-wholesale.spec.ts` → `waitForURL(/\/(admin|dashboard|parts|makler|marketplace)/)` match na `/parts/my`

---

### §3.2 — Fix B + C: Dev server runtime cache reset

**Toto není code fix, je to env/ops operation.**

**Steps (sequential, impl provede ručně před re-testem):**

1. **Regenerate Prisma Client (idempotent, safe):**
   ```bash
   npx prisma generate
   ```
   Verify output: „✔ Generated Prisma Client".

2. **Stop Next.js dev server:**
   - Najít PID: `ps aux | grep "next dev" | grep -v grep`
   - Current PID: `10712` (parent) + `10712` next-server (child)
   - `kill <PID>` (NE `-9`, standard SIGTERM stačí)
   - Ověřit: `ps aux | grep next | grep -v grep` → prázdné

3. **Optional — clear Next.js build cache** (jen pokud krok 1+2 nestačí, což je unlikely):
   ```bash
   rm -rf .next/cache
   ```
   **POZOR:** NENÍ standardní step, používat jen pokud po restartu se chyba opakuje.

4. **Restart dev server v background:**
   ```bash
   npm run dev
   ```
   Počkej na „Ready in Xs" log (~5-10s). Ověř: `curl -s http://localhost:3000/api/parts | head -c 200` → response obsahuje `"manufacturer"` field.

5. **Verify fix via curl:**
   ```bash
   curl -s "http://localhost:3000/api/parts?manufacturer=TRW" | head -c 500
   # očekávání: {"parts":[{"slug":"trw-brzdove-desticky-octavia-iii", ... "manufacturer":"TRW", "warranty":"24 měsíců", ...}], "total":1, ...}
   ```
   ```bash
   curl -s http://localhost:3000/dily/trw-brzdove-desticky-octavia-iii \
     | grep -oE "(Výrobce|24 měsíců)" | sort -u
   # očekávání:
   # 24 měsíců
   # Výrobce
   ```

**Rationale:** Next.js dev server proces cachuje Node.js moduly, včetně `@prisma/client`. Files v `node_modules/.prisma/client/*` nejsou watched HMR — po `prisma generate` musí být dev server restartnut aby nový client byl loaded. Toto je **known Next.js + Prisma dev workflow pattern** a nemá vztah k impl #184 — je to environment hygiene issue (dev server běžel cca 3.7 hodiny a za tu dobu se přidaly nové sloupce).

**Acceptance:**
- API `GET /api/parts?manufacturer=TRW` vrací `parts.length >= 1` s TRW part
- Detail page `/dily/trw-brzdove-desticky-octavia-iii` renderuje „Výrobce TRW" + „Záruka 24 měsíců"

**Fallback (pokud Fix B+C nevyřeší po restart):**
Pokud restart NEVYŘEŠÍ Defekt B+C (unlikely given evidence), eskaluj leadovi s diagnostikou:
- `npx prisma validate` exit code
- `ls -la node_modules/.prisma/client/index.d.ts` mtime
- `curl -v /api/parts?manufacturer=TRW` full HTTP trace
- Console logs z `npm run dev` terminálu

**NE SELF-DEBUG** — per memory `feedback_stop_escalate_literal`, při unexpected state eskaluj.

---

### §3.3 — Commit hygiene

**1 commit, atomický:**

```
fix(auth): add WHOLESALE_SUPPLIER login redirect to /parts/my (#197)

Per plan-task-182 §7 Q1 ACCEPT (MARKER only, same PWA as PARTS_SUPPLIER),
WHOLESALE_SUPPLIER must redirect to /parts/my after login. Plan-task-182
file manifest missed login page — #197 test-chrome RED confirmed fallthrough
to "/" causing T1 waitForURL timeout.

Fix: add explicit case in app/(web)/login/page.tsx switch.

Defekt B (manufacturer filter 500) + C (detail page missing render)
verified as dev server runtime cache (stale Prisma Client in memory,
dev server predates prisma generate). Resolved via dev server restart,
no code change.

Closes #197.
```

**Soubory:**
- `app/(web)/login/page.tsx` (+3 lines, case WHOLESALE_SUPPLIER)

**POZOR:** Plán na disku NEMĚNÍ `app/(web)/dily/[slug]/page.tsx`, `app/api/parts/route.ts`, `lib/validators/parts.ts`, `prisma/schema.prisma`, ani `prisma/seed.ts` — toto vše je už v pořádku v commitech `9dfadde`→`1b539a3`. Jakýkoliv další edit = STOP a eskaluj.

---

### §3.4 — Re-test pipeline

**Po fixu §3.1 + ops §3.2:**

1. **Build check:**
   ```bash
   npm run build
   ```
   Exit 0 required.

2. **Lint check:**
   ```bash
   npm run lint
   ```
   0 nových warningů.

3. **Manual smoke (před dispatch test-chrome):**
   - `curl /api/parts?manufacturer=TRW` → vrátí TRW row
   - `curl /dily/trw-brzdove-desticky-octavia-iii` → obsahuje „24 měsíců" a „Výrobce"
   - Browser login `velkoobchod@carmakler.cz` / `heslo123` → redirect `/parts/my`

4. **Dispatch test-chrome re-run** (lead action):
   Re-run `e2e/parts-wholesale.spec.ts` všechny 4 testy. Očekávání: **4/4 PASS** (GREEN).

5. **Pokud ne 4/4 → STOP a eskaluj** s exact error per test.

---

## §4 — File manifest

**Modified:**
| Soubor | Změna | Lines diff |
|--------|-------|------------|
| `app/(web)/login/page.tsx` | Přidat `case "WHOLESALE_SUPPLIER": router.push("/parts/my"); break;` mezi `PARTS_SUPPLIER` a `INVESTOR` | +3 |

**NOT modified (explicit, reinforced):**
- ✋ `prisma/schema.prisma` — Part manufacturer/warranty sloupce již OK (commit `9dfadde`)
- ✋ `prisma/seed.ts` — wholesale seed rows již OK (verified via psql)
- ✋ `prisma/migrations/*` — 20260409062848 migrace již aplikovaná
- ✋ `lib/validators/parts.ts` — createPartSchema + partFilterSchema už mají manufacturer/warranty
- ✋ `app/api/parts/route.ts` — POST + GET už handle manufacturer/warranty + WHOLESALE_SUPPLIER v allowedRoles
- ✋ `app/(web)/dily/[slug]/page.tsx` — conditional render block už v pořádku
- ✋ `app/(web)/dily/katalog/page.tsx` — manufacturer Input + fetchParts už v pořádku
- ✋ `components/pwa-parts/parts/DetailsStep.tsx` — manufacturer field už přidán
- ✋ `components/pwa-parts/parts/PricingStep.tsx` — warranty field už přidán
- ✋ `middleware.ts` — PARTS_SUPPLIER_ROLES už obsahuje WHOLESALE_SUPPLIER
- ✋ `e2e/parts-wholesale.spec.ts` — spec je OK, NE modifikuj
- ✋ `__tests__/middleware.test.ts`
- ✋ Jakékoli soubory mimo `app/(web)/login/page.tsx`

**New:** None.

---

## §5 — STOP rules

1. **STOP-1 — Defekt B+C po restartu stále fail** → eskaluj leadovi s diagnostikou (viz §3.2 Fallback). **NESELF-DEBUG** — per `feedback_stop_escalate_literal`.

2. **STOP-2 — Plan proměnné změny nad rámec §4** → jakýkoli edit jiného souboru než `app/(web)/login/page.tsx` = **STOP a eskaluj** s odůvodněním. Plan-task-182 commit set je reviewed a schválen #195, nesahat.

3. **STOP-3 — Plán doporučuje změnu `e2e/parts-wholesale.spec.ts`** → **NEMĚNIT**. Spec je autoritativní reprodukce §7 Q1-Q5 rozhodnutí. Pokud impl uvažuje o test úpravě = STOP, plán je špatně napsán.

4. **STOP-4 — Test-chrome zmiňoval `warrantyMonths`** → to je interpretační artefakt, NE spec field name. **Nedělej žádnou migraci na `warrantyMonths Int?`** — byla by v rozporu s §7 Q2 ACCEPT (`warranty String?`).

5. **STOP-5 — Dev server restart failuje nebo zasahuje do cizího procesu** → eskaluj leadovi (možná user si lokálně něco dělá). `kill <PID>` ne `-9`, počkej 2s, retry max 1x, pak STOP.

6. **STOP-6 — `npx prisma generate` failuje** → eskaluj (může indikovat bug v schema). **Nemodifikuj schema.prisma aby šel generate** — schema je load-bearing.

7. **Nedotýkat se (reinforced):** #88a commission (`/api/stripe/webhook`), #161 Stripe Connect (`/api/stripe/connect/*`, `components/pwa-parts/profile/SupplierStripeCard.tsx`), #19 order emails (`/lib/email-templates/order-*.ts`), TASK-019 inzertní platforma (`app/(web)/inzerat/*`, `app/api/listings/*`), tsvector/trgm indexy + triggers.

---

## §6 — Open questions

**Plán odpovídá na vše bez lead input** — root cause je verified (psql + curl + source read), fix je 3-line diff + env ops, scope je minimální. **Lead může dispatchovat implementatora přímo** bez §7 LEAD DECISIONS.

Pokud lead má odlišný názor na:
- Target URL pro WHOLESALE_SUPPLIER (ne `/parts/my`)
- Zda fix B+C má obsahovat i code change (ne jen env reset)
- Scope expansion (např. přidat monitoring na Prisma Client staleness)

→ lead může **AMEND** plán a re-dispatch.

---

## §7 — Post-fix validation checklist (pre-HOTOVO)

Implementator před hlášením HOTOVO k lead:

- [ ] `app/(web)/login/page.tsx` obsahuje `case "WHOLESALE_SUPPLIER": router.push("/parts/my"); break;`
- [ ] `npx prisma generate` success
- [ ] Dev server restartován (nový PID, logs „Ready in...")
- [ ] `curl /api/parts` response contains `"manufacturer"` + `"warranty"` keys
- [ ] `curl "/api/parts?manufacturer=TRW"` vrací 1+ rows (TRW part)
- [ ] `curl /dily/trw-brzdove-desticky-octavia-iii | grep -E "(Výrobce|24 měsíců)"` má 2 matches
- [ ] `npm run lint` — 0 new warnings
- [ ] `npm run build` — success
- [ ] 1 atomický commit per §3.3
- [ ] Žádné soubory editnuté mimo `app/(web)/login/page.tsx`
- [ ] HOTOVO zpráva obsahuje: commit hash, confirmation že dev server restartován, 3× curl output snippet jako proof

---

**Konec plánu #197.**
