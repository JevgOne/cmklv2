# IMPL Report: Fix `/profil/[slug]` — Instagram-style header + owner edit + polish (task #53)

**Datum:** 2026-04-16
**Implementátor:** agent team
**Task ID:** #13
**Plán:** `.claude-context/tasks/plan-fix-profile-alignment-20260416.md` (R2)

---

## §1 — STOP-1 checklist

| Podmínka | Stav | Evidence |
|---|---|---|
| SessionProvider dostupný v `(web)` segmentu | ✅ PASS | `app/layout.tsx:86` — `<AuthProvider>{children}</AuthProvider>` (AuthProvider = wrapper kolem `SessionProvider`, `components/providers/AuthProvider.tsx`). Root layout → pokrývá všechny segmenty včetně `(web)` |
| `npm run build` | ✅ PASS | `✓ Compiled successfully in 20.7s`, 1259 statických stránek vygenerováno, 0 errorů |
| TS errors | ✅ PASS | Build projel, žádné TS chyby |
| Jakákoli změna mimo §3–§5 | ✅ N/A | Implementoval jsem POUZE §3 (header), §4 (useSession/isOwner), §5 (labels + a11y). Žádné mimo-scope změny |

---

## §2 — Změněné soubory

| Soubor | Změny | Rozsah |
|---|---|---|
| `app/(web)/profil/[slug]/page.tsx` | useSession import + isOwner + header restructure (Instagram-style flex-col center) + Stat helper + stats grid→flex + tabs justify-center + badges section text-center + labely | +108 / -139 (net -31) |
| `app/(web)/muj-ucet/layout.tsx` | aria-label "Menu uctu" → "Menu účtu" | 1 char |

**Celkem:** 2 soubory, 1 commit.

---

## §3 — Commit

`4663973` — fix: profile header restructure + owner edit + polish (task #53)

```
- Restructure profile header to Instagram-style full-center layout
- Add useSession + isOwner for owner edit button
- Replace stats grid with flex justify-center
- Label polish: "Prům. ROI" -> "Průměrné ROI" (N1)
- Label polish: "Dokončené" -> "Dokončené dealy" (N3)
- a11y: fix aria-label diacritics "Menu uctu" -> "Menu účtu" (G13)
```

**Nepushnuto** (dle zadání).

---

## §4 — Odchylky od plánu

Žádné. Implementace přesně dle §3.2, §4, §5 plánu R2.

**Detaily implementace:**
- Wrapper headeru: `relative -mt-16 sm:-mt-20 mb-6 flex flex-col items-center text-center`
- Avatar stand-alone (ne v flex-row), `mb-4`
- Všechny sekce (name, badges, bio, favBrands, motto, specs, services, meta, social, warehouse, member since, actions) jako siblings v flex-col items-center → jednotné centrování
- Warehouse omezen na `max-w-md` aby nevyrostl přes celou šířku
- Opening hours flex-wrap má `justify-center` (důsledek centered layoutu)
- Actions přesunuty DOVNITŘ header wrapperu (v plánu jako center-aligned row)
- isOwner: ternární na actions — `isOwner ? <Link href="/muj-ucet/profil">Upravit profil</Link> : (phone && <a tel>)`
- Stats Stat helper přidán za `formatPrice` v shared function block
- Stats: `flex flex-wrap justify-center gap-8 sm:gap-12 mb-6 py-4 border-y border-gray-200` + 10 `<Stat>` volání
- Labely: "Průměrné ROI", "Dokončené dealy"
- Tabs: `flex justify-center gap-0`
- Badges section: `mb-10 text-center` + `flex flex-wrap justify-center gap-3`

---

## §5 — Co jsem testoval locally

| Test | Výsledek |
|---|---|
| `npm run build` | ✅ 0 errorů, 0 TS failures, 1259 stránek prerendered |
| Grep `SessionProvider` | ✅ AuthProvider v `app/layout.tsx:86` (STOP-1 PASS) |
| Diff review | ✅ +108/-139, 2 soubory, 1 commit |
| Lint check | — Nezkoušel jsem manuálně; build validační pipeline prochází |

**Chrome E2E:** Podle plánu §11 a task assignment si test-chrome vezme (už je dispatched mimo tento task).

---

## §6 — Simplify review

Spustil jsem 3 review agenty (reuse + quality + efficiency) paralelně na diff. Všechny findings jsou:

1. **Pills duplikát** (3 spans: bg-gray / bg-orange / bg-blue) — Refactor na `<Pill variant>` helper bych vítal, ale **PRE-EXISTING** pattern v kódu. Plán §3.2 ponechává stávající pill spans (jen přidává `justify-center`). STOP-1 feedback_stop_escalate_literal: neprovádět žádné mimo-scope změny. **Skip.**
2. **formatPrice duplikát** (`@/lib/utils.ts` by měl sdílet) — **PRE-EXISTING**, mimo scope. **Skip.**
3. **JSON parse with try/catch pattern** (6+ souborů) — **PRE-EXISTING** tech debt. **Skip.**
4. **useMemo pro favBrands/specs** — **PRE-EXISTING**, mimo scope. **Skip.**
5. **Comment "flex justify-center s border-y divider"** — v češtině správné ("s" = "with"). **Skip.**
6. **Stat helper `valueClass` prop** — justified (2 usages: zelené pro ROI + Výnos). **OK.**

**Žádný cleanup commit nepotřeba** — diff je clean v rámci scope.

---

## §7 — Co zbývá / co testovat externally

- **Test-chrome** (task #10 již dokončen 14/15 — očekávaný výsledek po tomto fixu: 15/15 PASS owner edit flow)
- Verifikace UX (desktop + mobile) podle §9 plánu — centered header bez schodinky
- Optional future refactors (mimo tento task):
  - Extract `Pill` helper pro tag/brand/service spans → consolidation s StatusPill
  - Consolidate `formatPrice` z 15+ souborů do `lib/format.ts`
  - Extract `safeJsonParse<T>` utility pro deduplication try/catch parse patternu
  - Memoize favBrands/specs parse via `useMemo`
  - GAP-3: MANAGER/RD tabs (odloženo v plánu §6, potřebuje API change)

---

## §8 — Git stav

```
On branch main
Modified (not staged):
 M .claude-context/tasks/impl-task-155-88a-wolt.md        (pre-existing)
 M .claude-context/tasks/plan-task-182-eshop-dily-gap.md (pre-existing)
 M TASK-QUEUE.md                                          (pre-existing TASK-019 change, not mine)
 M public/sw.js                                           (pre-existing build artefakt)
Untracked:
 ?? .claude-context/tasks/ ... many               (pre-existing logs)
```

Moje 2 commity na této session:
- `0d27c7b` — chore: generate presentation PDFs (task #2)
- `4663973` — fix: profile header restructure + owner edit + polish (task #53)
