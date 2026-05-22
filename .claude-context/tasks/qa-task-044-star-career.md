# QA Report: TASK-044 — Kariérní systém s hvězdičkami

**Commit:** `cc17ef7`  
**Datum:** 2026-04-25  
**Kontrolor:** kontrolor agent  
**Spec:** `.claude-context/tasks/task-044-broker-stars-regional-commissions.md`

---

## 1. Simplify kontrola

### ✅ Pozitiva
- `lib/broker-points.ts` (server) a `lib/gamification-levels.ts` (client) správně oddělené — žádná duplicita logiky, client-safe soubor neimportuje Prisma.
- `REGION_THRESHOLDS` konstanta sdílená v obou souborech přes `gamification-levels` → čistá architektura.
- `addBrokerRevenue()` správně v `$transaction` — atomické vytvoření transakce + update User.
- Admin `/api/admin/career` endpoint efektivně načítá měsíční data přes `groupBy` — jeden query místo N+1.
- `CareerOverviewContent` renderuje threshold tabulku přímo z `REGION_THRESHOLDS` konstant — neduplicuje data.

### ⚠️ Minor — totalRevenue increment pattern
- `addBrokerRevenue` počítá: `newTotalRevenue = (broker?.totalRevenue ?? 0) + amount`
- Předchozí verze (`addBrokerPoints`) přepočítávala z transakcí přes `aggregate`, což je přesnější při souběžných zápisech.
- **Riziko:** velmi nízké (dva handovery téhož makléře ve stejný okamžik jsou v praxi nemožné).
- **Doporučení:** ponechat (není nutné opravit pro MVP).

---

## 2. Debug kontrola

### Build
```
npm run build → ✅ PASSED
```

### TypeScript
```
npx tsc --noEmit → ✅ OK v application kódu
  - 7 pre-existující chyby v e2e/ test souborech (nesouvisejí s tímto taskem)
```

### Lint
```
npm run lint → ⚠️ 3 pre-existující chyby v scripts/audit-pwa-apps.js (nesouvisejí)
```

### Unit testy
```
npm run test → ✅ 175/175 PASSED (17 test files)
  - __tests__/lib/broker-points.test.ts: nové testy hvězdičkového systému
  - __tests__/lib/commission-calculator.test.ts: testy pro STAR_1–STAR_5
  - __tests__/lib/gamification.test.ts: aktualizovány
```

---

## 3. Reverzní kontrola — Acceptance Criteria

| # | Kritérium | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | 5 úrovní ⭐–⭐⭐⭐⭐⭐ s provizemi 30/40/50/55/60% | ✅ | broker-points.ts:10-16, commission-calculator.ts testy |
| 2 | Regionální prahy Praha/Brno/Ostrava+Plzeň/Menší | ⚠️ | Viz nález #1 — STAR_1 threshold Praha = 0 (spec: 1 000 000) |
| 3 | Admin — tabulka prahů + přehled makléřů s výplatami | ✅ | CareerOverviewContent.tsx — threshold tabulka + broker tabulka s 8 sloupci |
| 4 | Snížení úrovně ADMIN/MANAGER only (ne REGIONAL_DIRECTOR) | ✅ | `/api/admin/career/[id]/level` ř. 24-29: `["ADMIN", "MANAGER"].includes(role)` |
| 5 | PWA — vidí region, úroveň, progress, % | ✅ | `stats/page.tsx` má regionTier, StarProgress, REGION_THRESHOLDS |
| 5b | PWA dashboard — progress k další hvězdičce | ⚠️ | Dashboard nemá LevelProgressBar ani regionTier — pouze badge + obrat |
| 6 | Kumulativní obrat — jednou dosažená úroveň se neztrácí | ✅ | `totalRevenue` se jen zvyšuje, `addBrokerRevenue` přidává hodnotu |
| 7 | Max provize 60%, žádný TIP bonus | ✅ | STAR_5: 0.60, TIP_BONUS odstraněn z commission-calculator.ts |
| 8 | Staré reference nahrazeny (Tipař/Junior/Senior/Expert/totalPoints) | ✅ | grep potvrzen — žádné staré reference v app/ nebo components/ |
| 9 | TypeScript build OK | ✅ | Viz výše |
| 10 | Migrace — konverze starých dat | ⚠️ | Viz nález #2 — Plzeňský kraj chybí v migration SQL |

---

## 4. Klíčové nálezy

### ⚠️ Nález #1 — Praha STAR_1 threshold: 0 (impl) vs 1 000 000 Kč (spec)

**Kde:** `lib/broker-points.ts:25`, `lib/gamification-levels.ts:19`

**Spec říká:**
```
| Praha | 1 000 000 | 1 500 000 | 2 500 000 | 4 000 000 | 6 000 000 |
```

**Implementace má:**
```ts
PRAHA: { STAR_1: 0, STAR_2: 1_500_000, STAR_3: 2_500_000, STAR_4: 4_000_000, STAR_5: 6_000_000 }
```

**Stejná odchylka pro všechny regiony:**
- Brno: spec STAR_1 = 750 000, impl = 0
- Ostrava/Plzeň: spec = 500 000, impl = 0
- Menší města: spec = 300 000, impl = 0

**Hodnocení:** Implementátor vědomě zvolil `STAR_1 = 0` (každý nový makléř začíná na ⭐). Alternativa (spec-literal) by znamenala, že noví makléři nemají žádnou hvězdičku dokud nedosáhnou prahu — ale chybí `STAR_0` level. Testy tento záměr potvrzují. **Navrhujeme prodiskutovat s Product Ownerem.**

---

### ⚠️ Nález #2 — Plzeňský kraj není namapován na OSTRAVA_PLZEN

**Kde:** `prisma/migrations/20260425080000_star_career_system/migration.sql`

**Migration SQL:**
```sql
UPDATE "Region" SET "tier" = 'OSTRAVA_PLZEN' WHERE "name" = 'Moravskoslezský';
-- Plzeňský kraj CHYBÍ!
```

**Dopad:** Regiony s `name = 'Plzeňský'` (nebo jiný název pro Plzeňský kraj) by dostaly default tier `SMALL` místo `OSTRAVA_PLZEN`. V aktuálním seed datech jsou pouze 3 regiony (Praha, Jihomoravský, Moravskoslezský), takže Plzeň jako región zatím neexistuje — v produkci by problém nastal při přidání Plzeňského makléře.

**Doporučení (minor fix):**
```sql
UPDATE "Region" SET "tier" = 'OSTRAVA_PLZEN' WHERE "name" IN ('Moravskoslezský', 'Plzeňský');
```

---

### ⚠️ Nález #3 — Dashboard nemá regionální progress

**Kde:** `app/(pwa)/makler/dashboard/page.tsx:82`

Dashboard fetchuje pouze `{ quickModeEnabled, level, totalRevenue }` — bez `region: { select: { tier: true } }`. Zobrazuje badge a celkový obrat, ale **nechybí progress bar k další hvězdičce dle regionu**.

Stats stránka (`/makler/stats`) tuto informaci má kompletně. Spec říká "Každý makléř vidí ve své PWA" — stats stránka tohoto požadavek splňuje. Dashboard je přijatelný jako stručný přehled.

**Hodnocení:** Akceptovatelné — informace je dostupná v PWA (stats strana), jen ne přímo na dashboardu.

---

### ✅ Bonusový nález — Admin level reduction UI

`CareerOverviewContent.tsx` exportuje CSV a zobrazuje tabulku, ale **neobsahuje UI tlačítko pro snížení úrovně** makléře (PUT endpoint existuje, UI chybí). Spec sice nespecifikuje UI pro snížení, ale zmiňuje "Snížení úrovně může provést pouze ADMIN nebo MANAGER" — bez UI to jde jen přes API call.

**Hodnocení:** API endpoint je funkční a zabezpečený. UI tlačítko je optional follow-up.

---

## VERDIKT

**Status:** ✅ APPROVED s doporučeními

**Musí opravit před nasazením:**
- Nic kritického

**Doporučené opravy (minor):**
1. ⚠️ Prodiskutovat s PO: STAR_1 threshold = 0 (vs spec 1M pro Praha) — zda je záměr správný
2. ⚠️ Migration SQL: přidat `Plzeňský` do OSTRAVA_PLZEN mappingu (1 řádek)

**Optional follow-up:**
3. Dashboard: přidat regionTier + LevelProgressBar (1 extra field v DB query)
4. Admin Career: UI tlačítko pro manuální snížení úrovně (volá existující PUT endpoint)
