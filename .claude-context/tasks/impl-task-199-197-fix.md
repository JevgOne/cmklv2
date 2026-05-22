# IMPL #199 — Fix #184 login redirect + dev server reset (#197)

**Task:** #199 IMPL — fix #184 login redirect + dev server reset
**Plan:** `.claude-context/tasks/plan-task-197-184-fix.md` (`5e60407`)
**Datum:** 2026-04-09
**Branch:** main
**Commit delivered (1, atomic):**

| # | Hash | Subject |
|---|---|---|
| 1 | `059f6a2` | fix(auth): add WHOLESALE_SUPPLIER login redirect to /parts/my (#197) |

---

## §1 — Scope delivered

| Defekt | Položka | Fix typ | Status |
|---|---|---|---|
| A | Login redirect WHOLESALE_SUPPLIER → `/parts/my` | Code (3-line diff) | ✅ Commit `059f6a2` |
| B | `/api/parts?manufacturer=TRW` 500 / 0 results | Env ops (Prisma generate + dev server restart) | ✅ Curl smoke GREEN |
| C | `/dily/[slug]` detail manufacturer + warranty missing | Same root cause as B (dev cache) | ✅ Curl smoke GREEN |

**Out of scope (per plan §4 + STOP rules):**
- Žádné edity mimo `app/(web)/login/page.tsx`
- Žádná migrace, žádný seed change, žádný validator/API touch
- Žádná modifikace `e2e/parts-wholesale.spec.ts`
- Žádný `warrantyMonths Int?` field (Q2 violation)

---

## §2 — Fix A: Login redirect (code change)

**File:** `app/(web)/login/page.tsx`
**Variant:** separate `case` (Var 1, grep-friendly per §3.1 plan rationale)

**Diff:**
```diff
       case "PARTS_SUPPLIER":
         router.push("/parts/my");
         break;
+      case "WHOLESALE_SUPPLIER":
+        router.push("/parts/my");
+        break;
       case "INVESTOR":
```

**Rationale:** Per plan-task-182 §7 Q1 ACCEPT, WHOLESALE_SUPPLIER je MARKER role sdílící `/parts/*` PWA s PARTS_SUPPLIER → stejný redirect target `/parts/my`.

---

## §3 — Fix B+C: Dev server runtime cache reset (env ops)

### Step 1 — Regenerate Prisma Client
```bash
$ DATABASE_URL=postgresql://zen@localhost:5432/carmakler npx prisma generate
✔ Generated Prisma Client (v7.5.0) to ./node_modules/@prisma/client in 307ms
```

**Note:** `.env` na disku není (jen `.env.local`), Prisma CLI nezachytí Next.js auto-load → musel jsem `DATABASE_URL` exportovat inline.

### Step 2 — Stop stale dev server
PID před: `10696` (npm) → `10711` (next dev) → `10712` (next-server v16.1.7), elapsed **21h 19m** (předcházel `prisma generate` z #184 session).

```bash
$ kill 10696 10711 10712  # SIGTERM, žádný -9
$ ps aux | grep "next dev|next-server" → no next processes
```

### Step 3 — Restart dev server
```bash
$ npm run dev  # background
```

PID po: `68256` (next-server v16.1.7), elapsed `00:14`.
HTTP probe: `curl -o /dev/null -w "%{http_code}" /api/parts` → `200`.

**Step 3 fallback (`rm -rf .next/cache`)** — NEPOUŽITO, restart sám stačil.

---

## §4 — Smoke verification (curl outputs)

### Smoke #1: API parts response obsahuje manufacturer + warranty keys
```bash
$ curl -s http://localhost:3000/api/parts | python3 -c "..."
FIRST PART KEYS: ['category', 'compatibleBrands', ..., 'manufacturer', ..., 'warranty', 'weight', 'wholesalePrice']
Has manufacturer: True
Has warranty: True
```
**✅ PASS** — `manufacturer` + `warranty` jsou v response.

### Smoke #2: Manufacturer filter `?manufacturer=TRW`
```bash
$ curl -s "http://localhost:3000/api/parts?manufacturer=TRW" | python3 -c "..."
total: 1
parts.length: 1
 - trw-brzdove-desticky-octavia-iii | TRW | 24 měsíců
```
**✅ PASS** — 1 row, slug + manufacturer + warranty correct.

### Smoke #3: Detail page render `Výrobce` + `24 měsíců`
```bash
$ curl -s http://localhost:3000/dily/trw-brzdove-desticky-octavia-iii > /tmp/detail-trw.html
$ grep -c "24 měsíců" /tmp/detail-trw.html → 1
$ grep -c "Výrobce"   /tmp/detail-trw.html → 1
$ grep -c ">TRW<"     /tmp/detail-trw.html → 1
```
**✅ PASS** — `(part.manufacturer || part.warranty)` conditional aktivní, oba sub-blocky renderují.

---

## §5 — Acceptance checks

| Check | Výsledek |
|---|---|
| `app/(web)/login/page.tsx` má `case "WHOLESALE_SUPPLIER"` | ✅ |
| `npx prisma generate` exit 0 | ✅ |
| Dev server restart (nový PID `68256`, předtím `10712`) | ✅ |
| Curl smoke #1 — manufacturer + warranty keys | ✅ |
| Curl smoke #2 — `?manufacturer=TRW` returns 1 row | ✅ |
| Curl smoke #3 — detail page má `Výrobce` + `24 měsíců` | ✅ |
| `npx tsc --noEmit` | ✅ EXIT=0 |
| `npm run lint` | ✅ 0 errors (555 warnings pre-existing `.next` bundle, žádné nové) |
| `npm run build` | ✅ EXIT=0, `Compiled successfully in 18.4s` |
| 1 atomic commit | ✅ `059f6a2` |
| Žádné soubory mimo `app/(web)/login/page.tsx` | ✅ |
| STOP rules (1-7) | ✅ Žádný porušen |

---

## §6 — STOP rules check

| # | Rule | Status |
|---|---|---|
| 1 | Edit mimo `app/(web)/login/page.tsx` → STOP | ✅ Jen 1 file edited |
| 2 | NIKDY měnit `e2e/parts-wholesale.spec.ts` | ✅ Untouched |
| 3 | NIKDY přidávat `warrantyMonths Int?` | ✅ Žádný schema change |
| 4 | Nedotýkat se #88a, #161, TASK-019, #156 | ✅ Untouched |
| 5 | Restart NEVYŘEŠÍ B+C → STOP | ✅ Restart vyřešil, žádná eskalace nutná |
| 6 | `kill -9` NIKDY | ✅ Default SIGTERM použit |
| 7 | Žádné `--no-verify`, `--no-gpg-sign`, force-push | ✅ Žádný použit |

---

## §7 — Pipeline next

- **#200 kontrolor** — verify proti plan §3.1 + §3.2 + STOP rules
- **#201 evžen** — smart code review
- **#202 test-chrome** — re-run `e2e/parts-wholesale.spec.ts` (očekávání 4/4 GREEN)
- **#203 deploy** — production rollout (pokud test-chrome GREEN)

**Do NOT push** — pipeline čeká, lokální commit `059f6a2` na `main`.

---

## §8 — Known notes

- **`.env` missing on disk:** Prisma 7.5 CLI vyžaduje `DATABASE_URL` v `process.env`, ale projekt používá `.env.local` (Next.js auto-loaded). Inline `DATABASE_URL=...` export funguje. Nicméně to znamená, že `prisma generate`/`migrate` z CLI vždy potřebují manuální env injection, dokud nebude vytvořeno `.env` symlink/copy. Pre-existing env hygiene issue, NE blocker pro tento task.

- **Dev server staleness root cause confirmed:** PID `10712` měl `etime 21:19:40` — předcházel `npx prisma generate` z #184 session o cca 21 hodin. Plně vysvětluje §2.2 + §2.3 root cause v plánu.

- **Build prerender Prisma errors:** Stejně jako v #184 baseline, build log obsahuje `prisma:error` lines z prerender phase (DB queries během SSG). EXIT=0, `Compiled successfully in 18.4s`. Pre-existing baseline noise, NE regression.

---

**HOTOVO** — Task #199 ready for #200 kontrolor.
Commit `059f6a2` na `main`.
