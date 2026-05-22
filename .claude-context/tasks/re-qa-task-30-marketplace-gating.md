# Re-QA Report — Task #30: Marketplace gating fix

**Datum:** 2026-04-06  
**Agent:** KONTROLOR  
**Commit:** `0e9fb4f`  
**Scope:** Fix B (GET opportunities list) + Fix C (GET opportunities detail)

---

## 1. FIX B — `GET /api/marketplace/opportunities`

### Guard přítomnost a pozice

```typescript
// route.ts:74-86
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
}

// Marketplace role allow-list — BROKER/BUYER/ADVERTISER/PARTS_SUPPLIER atd. nemají přístup
const MARKETPLACE_ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"] as const;
if (!MARKETPLACE_ALLOWED_ROLES.includes(session.user.role as typeof MARKETPLACE_ALLOWED_ROLES[number])) {
  return NextResponse.json(
    { error: "Nemáte oprávnění k zobrazení marketplace příležitostí" },
    { status: 403 }
  );
}
```

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 1 | `MARKETPLACE_ALLOWED_ROLES` const přítomen | ✅ | route.ts:80 |
| 2 | Guard PO session check, PŘED prisma query | ✅ | route.ts:79-86, prisma query na řádku 133+ |
| 3 | Allow-list: VERIFIED_DEALER, INVESTOR, ADMIN, BACKOFFICE | ✅ | route.ts:80 |
| 4 | Vrací 403 pro ostatní role | ✅ | route.ts:82-85 |
| 5 | `as const` + `typeof MARKETPLACE_ALLOWED_ROLES[number]` cast | ✅ | route.ts:80-81 |

**Fix B: ✅ PASS**

---

## 2. FIX C — `GET /api/marketplace/opportunities/[id]`

```typescript
// [id]/route.ts:24-31
// Marketplace role allow-list — BROKER/BUYER/ADVERTISER/PARTS_SUPPLIER atd. nemají přístup
const MARKETPLACE_ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"] as const;
if (!MARKETPLACE_ALLOWED_ROLES.includes(session.user.role as typeof MARKETPLACE_ALLOWED_ROLES[number])) {
  return NextResponse.json(
    { error: "Nemáte oprávnění k zobrazení marketplace příležitostí" },
    { status: 403 }
  );
}
```

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 6 | `MARKETPLACE_ALLOWED_ROLES` const přítomen | ✅ | [id]/route.ts:25 |
| 7 | Guard PO session check, PŘED prisma query | ✅ | [id]/route.ts:24-31, prisma query na řádku 35+ |
| 8 | Identický allow-list jako Fix B | ✅ | VERIFIED_DEALER, INVESTOR, ADMIN, BACKOFFICE |
| 9 | Vrací 403 pro ostatní role | ✅ | [id]/route.ts:27-30 |
| 10 | `as const` + TypeScript cast | ✅ | [id]/route.ts:25-26 |

**Fix C: ✅ PASS**

---

## 3. GREP VALIDACE

```
grep MARKETPLACE_ALLOWED_ROLES app/api/marketplace/opportunities/route.ts
→ 1 match (route.ts:80, route.ts:81)

grep MARKETPLACE_ALLOWED_ROLES "app/api/marketplace/opportunities/[id]/route.ts"
→ 1 match ([id]/route.ts:25, [id]/route.ts:26)
```

**✅ Oba soubory obsahují přesně 1× definici + 1× použití**

---

## 4. REGRESNÍ KONTROLA (NEZMĚNY)

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 11 | `middleware.ts` — řádky 227-261 aktivní | ✅ | middleware.ts:227-261, MARKETPLACE_DEALER_ROLES + MARKETPLACE_INVESTOR_ROLES definovány na řádcích 16-17 |
| 12 | `/marketplace/dealer/*` — middleware redirect pro unauth/wrong-role | ✅ | middleware.ts:228-243 |
| 13 | `/marketplace/investor/*` — middleware redirect pro unauth/wrong-role | ✅ | middleware.ts:245-261 |
| 14 | Žádné nové ENV vars | ✅ | 0 nových `process.env.*` v dotčených souborech |
| 15 | Žádná DB migrace | ✅ | Beze změny schema |
| 16 | `/marketplace` landing stále veřejná | ✅ | middleware.ts neobsahuje guard pro `/marketplace` (jen `/marketplace/dealer` a `/marketplace/investor`) |
| 17 | Stránky dealer/investor — beze změny | ✅ | Commit obsahuje pouze 2 soubory: oba route.ts |
| 18 | POST/mutační endpointy — beze změny | ✅ | opportunities POST, investments POST, approve, payout — neobsahují MARKETPLACE_ALLOWED_ROLES guard (stávající DEALER_ROLES/INVESTOR_ROLES guard) |
| 19 | stats endpoint — beze změn | ✅ | marketplace/stats/route.ts nedotčen |

**Regresní kontrola: ✅ 9/9 PASS**

---

## 5. BUILD + LINT

```
npm run build
✓ Compiled successfully in 23.1s
✓ Generating static pages (309/309)
```
**✅ BUILD PASSED**

```
npm run lint
✖ 550 problems (10 errors, 540 warnings)
```
Baseline: 550 (nezměněno od task #18). **0 nových problems.**

**✅ LINT PASSED**

---

## SOUHRN

| Check | Výsledek |
|-------|---------|
| Fix B (GET list) | ✅ Správný guard, správná pozice, správné role |
| Fix C (GET detail) | ✅ Identický pattern, správný guard |
| Grep validace | ✅ 1 match v každém souboru |
| Regresní kontrola | ✅ 9/9 — middleware, landing, ostatní routes beze změn |
| Build | ✅ PASSED (309/309) |
| Lint | ✅ 0 nových problémů |

**Celkové hodnocení: ✅ Re-QA #30 PASS**

### Security status po opravě

Původní security audit (task #27) identifikoval 2 API díry:
- `GET /api/marketplace/opportunities` — ❌ → **✅ OPRAVENO**
- `GET /api/marketplace/opportunities/[id]` — ❌ → **✅ OPRAVENO**

BROKER/BUYER/ADVERTISER/PARTS_SUPPLIER nyní dostávají 403 na obou endpointech. PII leak investorů uzavřen.
