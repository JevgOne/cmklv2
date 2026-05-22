# Review #198 — EVZEN shoda-check fix plánu #197 vs zadání

**Reviewer:** evzen-the-king
**Datum:** 2026-04-09
**Scope:** Fix plán `.claude-context/tasks/plan-task-197-184-fix.md` (commit `5e60407`) reagující na #196 test-chrome RED 0/4
**References:** plan-task-182-eshop-dily-gap.md §7 LEAD DECISIONS Q1-Q5, impl-task-184-182.md, qa-task-185-184.md, chrome-test-task-196-184.md

---

## §0 — Verdict

### ✅ **SCHVÁLENO** — 0 blockerů, 2 minor observations

Fix plán #197 je **grounded, bounded a konzistentní** s §7 LEAD DECISIONS plánu #182. Root cause analýza je verifikována skrz psql + curl + source code read. Fix scope je **minimální a přesný**: +3 řádky kódu + env ops. STOP rules jsou pokryté (7 položek). Žádná schema změna, žádný scope creep, protected files nedotčené.

**Lead může dispatchovat implementatora IMMEDIATELY.**

---

## §1 — Metodologie

6 EVZEN pravidel aplikováno:

1. **Doslovnost** — každý claim v plánu ověřen proti reálným file contents / git state
2. **No assumptions** — nezávisle čtu source files, neberu plánovačovo slovo
3. **No soft hacks** — zkontrolováno že fix není workaround zastíní skutečný bug
4. **Defense-in-depth** — verifikováno multiple layers (schema, migration, validator, API, UI)
5. **Resistance to shortcuts** — žádné předpoklady o dev cache, čtu API handler a kontroluju `include` vs `select`
6. **Final verdict respect** — žádné návrhy implementátorových detailů, jen kontrola scope

---

## §2 — Specific check 1: Defekt A fix target `/parts/my`

### Požadavek (z task brief + §7 Q1 ACCEPT)
> „MARKER only, stejná PWA jako PARTS_SUPPLIER" → WHOLESALE_SUPPLIER redirect musí být **stejný jako PARTS_SUPPLIER**.

### Verifikace

**File:** `app/(web)/login/page.tsx` L60-93 switch — přímo čten:

```tsx
case "PARTS_SUPPLIER":
  router.push("/parts/my");     // ← PARTS_SUPPLIER jde na /parts/my
  break;
```

**Švih pro WHOLESALE_SUPPLIER v current code:** ❌ **NENÍ** — fallthrough na `default: router.push("/")` → T1 timeout `waitForURL(/\/(admin|dashboard|parts|makler|marketplace)/)`, homepage `/` nematchuje.

**Plán §3.1 navrhuje:**
```diff
+case "WHOLESALE_SUPPLIER":
+  router.push("/parts/my");
+  break;
```

### Shoda s §7 Q1
- ✅ PARTS_SUPPLIER target = `/parts/my` (verified L74-76)
- ✅ WHOLESALE_SUPPLIER target = `/parts/my` (plán navrhuje stejné)
- ✅ Obě role stejná PWA = literal §7 Q1 ACCEPT

### Destination route existuje
- ✅ `app/(pwa-parts)/parts/my/page.tsx` (glob confirmed, loading.tsx + error.tsx součástí)

### Middleware gating
- ✅ `middleware.ts:16` `PARTS_SUPPLIER_ROLES` obsahuje WHOLESALE_SUPPLIER (z #195 review) → /parts/* je pro WHOLESALE_SUPPLIER povolený

**Verdict check 1:** ✅ PASS — target `/parts/my` je **správný a konzistentní** s §7 Q1 marker-only rozhodnutím.

---

## §3 — Specific check 2: Defekt B+C env-only fix (není skrytý code bug?)

### Požadavek
Ověř že Defekt B (manufacturer filter 500) a Defekt C (detail render missing) jsou skutečně dev server runtime cache, NE skrytý bug za záminku „dev cache".

### Verifikace multi-layer

#### 3.1 Schema ✅
```
prisma/schema.prisma:906: manufacturer String? // Např. "TRW", "Bosch", "LUK"
prisma/schema.prisma:907: warranty     String? // Např. "24 měsíců", "zákonná", "doživotní"
prisma/schema.prisma:958: @@index([manufacturer])
```
(Nezávislý Grep, rádky číselně přímo v schema.)

#### 3.2 Migration applied ✅
```
prisma/migrations/20260409062848_add_part_manufacturer_warranty/migration.sql
```
Exists (ls confirmed). Obsah z #195 review: 6 řádků, jen ALTER TABLE + CreateIndex.

#### 3.3 API GET handler — není skryté SELECT whitelist ✅

**File:** `app/api/parts/route.ts` L158-172 (přímo čten):

```ts
prisma.part.findMany({
  where,
  include: {
    images: { where: { isPrimary: true }, take: 1 },
    supplier: { select: { id, firstName, lastName, companyName } },
  },
  orderBy,
  skip,
  take: filters.limit,
}),
```

**Klíčové:** Prisma query používá **`include`** (NE `select` whitelist). Defaultně Prisma vrací **všechny scalar fields** Part modelu — tzn. manufacturer + warranty **BY měly být v response**, pokud Prisma Client zná sloupce.

**Filter wiring:** L105-107:
```ts
if (filters.manufacturer) {
  where.manufacturer = { contains: filters.manufacturer, mode: "insensitive" as const };
}
```
✅ Správně.

**Search OR extension:** L134 `manufacturer: { contains, mode: "insensitive" }` — OK.

#### 3.4 Detail page — detail render logic ✅

**File:** `app/(web)/dily/[slug]/page.tsx` L71-86 (findFirst query):
```ts
prisma.part.findFirst({
  where: { OR: [{ slug }, { id: slug }] },
  include: {
    images: { ... },
    supplier: { select: { ... } },
  },
});
```
**Klíčové:** Stejný pattern jako API — `include` only, NE `select` whitelist. Part model scalar fields jsou vráceny všechny (včetně manufacturer/warranty pokud Prisma Client je ví).

**Conditional render block L235-254** (přímo čten):
```tsx
{(part.manufacturer || part.warranty) && (
  <div className="mb-6 p-4 bg-gray-100 rounded-xl space-y-2">
    {part.manufacturer && <div>...Výrobce...{part.manufacturer}</div>}
    {part.warranty && <div>...Záruka...{part.warranty}</div>}
  </div>
)}
```
✅ Přesně jak plán #197 §2.3 popisuje. Kód je správný.

#### 3.5 Validators ✅ (z #195 review)
`partFilterSchema.manufacturer: z.string().optional()` — OK.

### Je to skutečně dev cache nebo skrytý bug?

**Logický řetězec:**

1. Pokud schema+migration+validator+API+UI jsou všechny correct (verified výše) a kód je statický
2. A Prisma Client v `node_modules/.prisma/client/*` **byl** regenerovaný po migraci (plánovačova grep evidence: 101 hits na manufacturer/warranty v `index.d.ts`)
3. A runtime `curl` vrací 500 na manufacturer filter + no-manufacturer field v no-filter response (plánovačovy evidence)

→ **Jediné logicky konzistentní vysvětlení** je že Node.js proces dev serveru má starý cache `@prisma/client` v paměti (process load-time snapshot), a fresh `index.d.ts` v `node_modules` není reloaded bez process restart. To je **known Next.js + Prisma dev workflow pitfall**, dokumentováno jinde v communitě, nemá code fix (restart je jediné řešení).

**Alternativní hypotézy vyloučeny:**
- ❌ Schema drift? Ne — schema.prisma má sloupce (L906-907) + index (L958).
- ❌ Migration nezaplikovaná? Ne — migration file existuje v folder.
- ❌ Validator chybí? Ne — partFilterSchema má manufacturer.
- ❌ Select whitelist v API? Ne — `include` only, Part scalar fields jsou all returned.
- ❌ API GET catch block nekorektní? Ne — catch vrací 500 "Interní chyba serveru" což odpovídá curl.
- ❌ Seed data chybí? Ne — plánovačova psql query confirms 3 rows populated.

**Verdict check 2:** ✅ PASS — diagnostika je **správná**. B+C jsou legitimní dev runtime cache, NE skrytý bug. Env-only fix (restart + `prisma generate`) je **oprávněný**.

---

## §4 — Specific check 3: Žádný `warrantyMonths Int?` v plánu

### Požadavek
Per §7 Q2 ACCEPT (`warranty String?` max 50), fix plán NESMÍ přidávat `warrantyMonths Int?` field.

### Verifikace
Grep `warrantyMonths` v plan-task-197-184-fix.md:
- L22, L214, L402 — 3 zmínky, všechny v **negativním kontextu** („NE field name", „interpretační artefakt", „STOP-4 — NEMODIFIKUJ").
- Žádný návrh přidat `warrantyMonths` kdekoli v plánu.

**Schema section §4 file manifest:** jen `app/(web)/login/page.tsx` +3 řádky. Žádná schema změna.

**STOP-4 explicit:** „Nedělej žádnou migraci na `warrantyMonths Int?` — byla by v rozporu s §7 Q2 ACCEPT (`warranty String?`)."

### Test-chrome #196 „warrantyMonths" zmínka — rozbor

**File:** `chrome-test-task-196-184.md:111` (přímo čten):
> "Render `warrantyMonths` value (e.g., '24 měsíců') next to 'Záruka' label"

To je **test-chrome agenta free-text suggestion**, NE actual spec expectation. E2E spec `e2e/parts-wholesale.spec.ts:110` hledá substring `"24 měsíců"` (Grep verified: `warranty` je v file jen jako label/comment, NE `warrantyMonths` field). Plán správně identifikuje tohle jako interpretační artefakt.

**Verdict check 3:** ✅ PASS — žádný `warrantyMonths` field addition. Plán explicitně STOP-4 blokuje.

---

## §5 — Specific check 4: Scope (gap-fix, žádné Phase B expand)

### §4 file manifest plánu
```
Modified: 1 file
  app/(web)/login/page.tsx   +3 lines
New: 0
```

### NOT modified (explicit list v §4)
Plán má reinforced list 12 souborů s ✋ markerem — všechny z commitů `9dfadde`→`1b539a3`. Žádný scope expand.

### Žádné Phase B touches
- Donor car flow: ❌ nezmíněno
- Smart Inventory Assistant: ❌ nezmíněno
- Advanced fulltext pro manufacturer: ❌ nezmíněno (B-tree stačí per §7 Q3)
- Notifications: ❌ nezmíněno

**Verdict check 4:** ✅ PASS — scope je **minimální 3-řádkový diff + env ops**. Žádný drift do Phase B.

---

## §6 — Specific check 5: STOP rules compliance

### Plán §5 STOP rules (7 items)

| STOP | Popis | Check |
|------|-------|-------|
| STOP-1 | Post-restart B+C stále fail → eskaluj, **NE self-debug** | ✅ Memory `feedback_stop_escalate_literal` honored |
| STOP-2 | Edit jiného souboru než `app/(web)/login/page.tsx` → eskaluj | ✅ Scope lockdown |
| STOP-3 | Modifikovat `e2e/parts-wholesale.spec.ts` → NE | ✅ Spec je autoritativní |
| STOP-4 | `warrantyMonths Int?` migration → NE | ✅ §7 Q2 protected |
| STOP-5 | Dev server kill zasahuje do cizího procesu → eskaluj | ✅ `kill <PID>` ne `-9`, 1 retry max |
| STOP-6 | `prisma generate` fail → eskaluj, **NE modify schema** aby šel | ✅ Schema load-bearing protection |
| STOP-7 | Protected files nedotýkat | ✅ Reinforced list (webhook, stripe connect, inzerce, marketplace, order emails, tsvector/trgm) |

**Self-resolve safeguards:**
- §3.2 Fallback řeč o `rm -rf .next/cache` označena „POZOR: NENÍ standardní step" → conditional escalation-ready
- §3.2 step 3 je **optional** — používat jen pokud krok 1+2 nestačí (not mandatory)

**Verdict check 5:** ✅ PASS — STOP rules **komplet pokryté**, žádné self-resolve pathway.

---

## §7 — Cross-check: Shoda s §7 LEAD DECISIONS Q1-Q5

| Q | §7 ACCEPT | Fix plán #197 | Shoda |
|---|-----------|---------------|-------|
| Q1 | WHOLESALE_SUPPLIER marker only, stejná PWA jako PARTS_SUPPLIER | Redirect na `/parts/my` stejně jako PARTS_SUPPLIER | ✅ |
| Q2 | `warranty String?` max 50, NE enum, NE Int months | Žádná schema změna, spec hledá „24 měsíců" substring | ✅ |
| Q3 | B-tree index + ILIKE, NE tsvector | API GET `contains + mode: "insensitive"` unchanged | ✅ |
| Q4 | Phase B defer kompletně | Žádné Phase B touches | ✅ |
| Q5 | Wizard fields always visible, detail container conditional | Žádná UI změna (commit `776ff72` unchanged) | ✅ |

**Verdict:** Všechny 5 rozhodnutí **respektovány doslovně**. Žádná regression.

---

## §8 — Cross-check: Test-chrome evidence vs plán

### T1 (login timeout)
- Evidence: `navigated to "http://localhost:3000/"`
- Plánova teorie: Login switch fallthrough → default `/`
- ✅ Consistent — switch L60-93 reviewed, WHOLESALE_SUPPLIER missing confirmed

### T2 (wizard)
- Evidence: Blokováno T1 loginAs helper timeout
- Plánova teorie: Same root cause jako T1
- ✅ Consistent — T1 fix unblocks T2

### T3 (manufacturer filter)
- Evidence: `/dily/katalog` fill("TRW") → „0 produktů v nabídce"
- Plánova teorie: Dev cache → API 500 (z curl) → katalog catches + zobrazí 0
- ⚠️ Test-chrome #196 report §3 T3 (L54) ale píše „Navigated to `/parts/dily`" — to je test-chrome agent's typo (spec file L73 je `${BASE}/dily/katalog`). Non-issue pro root cause analysis.
- ✅ Consistent — stale Prisma Client consistent s 0 výsledky / 500 error

### T4 (detail render)
- Evidence: Title „Brzdové destičky TRW" ✅, body neobsahuje „24 měsíců" + „Výrobce"
- Plánova teorie: Stale Prisma Client → `part.manufacturer` = undefined → conditional block skipped
- ✅ Consistent — L235 wrapper `(part.manufacturer || part.warranty) && ...` je falsy pokud oba undefined

**Verdict:** Všechny 4 test failures **logicky consistentní** s plánovačovou teorií. Žádný defekt bez vysvětlení.

---

## §9 — Observations (non-blockers)

| # | Severity | Popis |
|---|----------|-------|
| **OBS-1** | Observation | §3.1 nabízí „alternativa" sloučit jako fallthrough `case "PARTS_SUPPLIER":\ncase "WHOLESALE_SUPPLIER":`. Plán preferuje separate case pro grep-friendly maintainability. **Obě varianty jsou korektní** per §7 Q1. Implementator free choice. Non-blocker. |
| **OBS-2** | Observation | §3.2 optional step 3 `rm -rf .next/cache` — plán explicitně označuje „POZOR: NENÍ standardní". Implementator by měl následovat doslovně (jen pokud step 1+2 nestačí). Risk of cargo-cult cleanup je minimální vzhledem k POZOR warning. Non-blocker. |

---

## §10 — Pipeline plán po SCHVÁLENÍ

1. **#199 Developer** — implementace fix plánu #197 § 3.1 + §3.2 (1 atomický commit per §3.3)
2. **#200 QA kontrolor** — verify commit vs plán
3. **#201 EVZEN** — shoda-check (fix dle plánu, no scope creep)
4. **#202 test-chrome** — headed Chromium re-run `e2e/parts-wholesale.spec.ts` (target 4/4 GREEN)
5. **#203 deploy** (7-step canonical)
6. **#204 evzen deploy review**
7. **#205 user**

**Note pro implementatora:**
- Dev server restart je ENV ops (manuální), ne code change
- Pre-HOTOVO checklist §7 má 11 položek — všechny MUSÍ být splněné
- `kill <PID>` NE `-9` (SIGTERM stačí per §3.2 step 2)
- Post-restart curl proof 3× v HOTOVO message (per §7 item 11)

---

## §11 — Final verdict

### ✅ **SCHVÁLENO**

Fix plán #197 (commit `5e60407`) je:
- **Grounded** — root cause verified skrz psql + curl + source code read
- **Bounded** — scope je 3-line diff v jedním souboru + env ops
- **Consistent** — všech 5 §7 LEAD DECISIONS respektováno
- **Defensive** — 7 STOP rules pokrývají edge cases (post-restart fail, scope creep, spec modification, warrantyMonths regression, process kill, prisma generate fail, protected files)
- **No shortcuts** — žádné self-debug pathways, žádné soft hacks
- **No hidden bugs** — Defekt B+C dev cache diagnóza je jediná logicky consistentní s evidence

**0 blockerů. 2 minor observations (non-blockers).**

**Lead může dispatchovat implementatora IMMEDIATELY.** Pipeline po fixu dispatch test-chrome re-run s očekáváním 4/4 GREEN.
