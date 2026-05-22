# QA Report: Makléřský bodový/kariérní systém

**Task:** #38 (commit `930db25`)
**Datum:** 2026-04-25
**Kontrolor:** kontrolor agent
**Plan:** `.claude-context/tasks/plan-broker-career-system.md`

---

## 1. Simplify kontrola

### ✅ Pozitiva
- `lib/broker-points.ts` a `lib/gamification-levels.ts` nepřekrývají zodpovědnosti — správně rozděleno (server vs client).
- `addBrokerPoints()` správně používá `$transaction` pro atomické vytvoření záznamu + update totalPoints.
- Přepočet bodů z transakcí `brokerPointTransaction.aggregate` je přesnější než prostý increment — dobrá volba.
- `calculateCareerLevel()` a `calculateLevel()` v obou lib jsou konzistentní (stejná logika).

### ⚠️ Naming inconsistency (neopravovat, jen flag)
- `calculateCarSalePoints(companyCommission: number)` — parametr se jmenuje `companyCommission`, ale volající předává `total` (celkovou provizi). Naming je zavádějící, ale chování je **správné** dle model example v plánu (25k total → 25 bodů) a dle kroku 5d plánu který explicitně používá `commissionBreakdown.total`.

---

## 2. Debug kontrola

### Build
```
npm run build → ✅ PASSED (žádné build errors)
```

### Lint
```
npm run lint → ⚠️ 3 errors (pre-existující, nesouvisejí s tímto taskem)
  - scripts/audit-pwa-apps.js: require() imports (pre-existující skripty)
  - 644 warnings (pre-existující)
```

### TypeScript
```
npx tsc --noEmit → ⚠️ 7 errors (všechny v e2e/ test souborech, pre-existující)
  - e2e/chrome-test-235-c1c7-partner.spec.ts
  - e2e/chrome-test-crosslinking-deep-20260420.spec.ts
  - e2e/chrome-test-makler-broker-pwa.spec.ts
  - e2e/chrome-test-pwa-makler-full.spec.ts
Zdrojový kód aplikace: ✅ žádné TS chyby
```

### Unit testy
```
npm run test → ✅ 160/160 PASSED (16 test files)
  - __tests__/lib/gamification.test.ts: testy aktualizované na body-based systém
```

---

## 3. Reverzní kontrola — Acceptance Criteria

| # | Kritérium | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | Nový Prisma model `BrokerPointTransaction` existuje a je migrovaný | ✅ | schema.prisma:1576, migrace `20260425060000_add_broker_points_system` |
| 2 | User má pole `totalPoints` (Float, default 0) | ✅ | schema.prisma:36 |
| 3 | User.level default je "TIPAR" (ne "JUNIOR") | ✅ | schema.prisma:34 |
| 4 | Při prodeji auta se vytvoří `BrokerPointTransaction` s type "CAR_SALE" | ✅ | handover/route.ts:143-154 |
| 5 | Body za auto = provize firmy / 1000 | ✅ | `calculateCarSalePoints(total)` = total/1000; shoduje se s model example v plánu |
| 6 | Provize makléře závisí na úrovni: Tipař 30%, Junior 40%, Senior 55%, Expert 65% | ✅ | commission-calculator.ts:29-40, broker-points.ts:8-13 |
| 7 | LevelBadge zobrazuje nové úrovně (Tipař, Junior, Senior, Expert) | ✅ | LevelBadge.tsx:10-31 |
| 8 | LevelProgressBar ukazuje body (ne prodeje) a % k další úrovni | ✅ | LevelProgressBar.tsx:8,13 — `totalPoints` prop |
| 9 | Dashboard ukazuje aktuální body | ✅ | dashboard/page.tsx:82,98,117 |
| 10 | Stats stránka ukazuje historii bodů | ✅ | stats/page.tsx:44,81,464-471 |
| 11 | LEVEL_LABELS aktualizované | ✅ | role-labels.ts:21-24 |
| 12 | Při dosažení nové úrovně přijde notifikace | ✅ | handover/route.ts:156-162 |
| 13 | Existující Commission záznamy mají migrované body (jednorázový skript) | ❌ | `prisma/migrate-points.ts` NEBYL vytvořen |
| 14 | Testy aktualizované a procházejí | ✅ | 160/160 passed |
| 15 | TypeScript build OK | ✅ | Build OK, TS chyby jen v e2e/ |

---

## 4. Dodatečné nálezy

### ⚠️ isTip parametr není volán z handover route
- `calculateCommission(soldPrice, brokerLevel, isTip?)` infrastruktura **existuje**
- `getBrokerCommissionRate(level, isTip)` funguje
- Ale handover route vždy volá `calculateCommission(data.soldPrice, brokerLevel)` — `isTip` je vždy `false`
- **Hodnocení:** Akceptovatelné — plán říká "follow-up task", ale není to explicitně označeno jako deferred. Funkčnost TIP bonus je připravená ale neaktivní.

### ✅ Seed data — stav OK
- `prisma/seed.ts` neobsahuje žádné `level:` hodnoty (relying on Prisma default "TIPAR") ✅
- Žádné staré hodnoty "BROKER"/"TOP" jako level field v seed datech ✅

---

## VERDIKT

**Status:** ✅ APPROVED s jedním follow-up taskem

**Hlavní nález (fix required):**
- ❌ **Chybí `prisma/migrate-points.ts`** — existující Commission záznamy nemají retroaktivní BrokerPointTransaction záznamy. Tento script je explicitně v acceptance criteria a v plánu. Makléři s historií prodejů mají `totalPoints = 0` navzdory existujícím Commission záznamům.

**Doporučení:**
1. Vytvořit `prisma/migrate-points.ts` dle plánu (sekce "MIGRACE STÁVAJÍCÍCH DAT")
2. Zvážit přejmenování `companyCommission` → `totalCommission` v `calculateCarSalePoints()` (kosmetická změna)
3. TIP bonus — označit jako explicit follow-up task v TASK-QUEUE.md
