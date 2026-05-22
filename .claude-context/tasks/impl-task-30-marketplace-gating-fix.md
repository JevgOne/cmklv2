# Impl report — Task #30: Marketplace API role gating fix (URGENT security)

**Commit:** `0e9fb4f` — fix(marketplace): add role guard to GET opportunities endpoints (GDPR/PII)
**Plán:** `.claude-context/tasks/plan-task-30-marketplace-gating-fix.md`
**Priorita:** 🚨 P0 — deploy blocker (GDPR PII leak)
**Build:** ✅ prošel (`npm run build`)
**Lint:** ✅ 0 errors na dotčených souborech

---

## Co bylo uděláno

### 1. `app/api/marketplace/opportunities/route.ts` — GET handler

Přidán allow-list role guard za session check (cca řádek 78), před parsováním filtrů:

```typescript
// Marketplace role allow-list — BROKER/BUYER/ADVERTISER/PARTS_SUPPLIER atd. nemají přístup
const MARKETPLACE_ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"] as const;
if (!MARKETPLACE_ALLOWED_ROLES.includes(session.user.role as typeof MARKETPLACE_ALLOWED_ROLES[number])) {
  return NextResponse.json(
    { error: "Nemáte oprávnění k zobrazení marketplace příležitostí" },
    { status: 403 }
  );
}
```

### 2. `app/api/marketplace/opportunities/[id]/route.ts` — GET handler

Identický guard přidán za session check (cca řádek 22), před `await params`. Chrání detail endpoint, který leakoval **PII investorů** (id, firstName, lastName) + business pipeline data.

---

## Scope compliance

✅ Jen 2 API endpointy (list + detail)
✅ ~18 řádků kódu (vejde se do plánovaných ~12 s mírným overhead na TypeScript strict cast)
✅ Žádné změny v `middleware.ts` (stránky už chráněny řádky 227-261)
✅ Žádné změny ve stránkách `/marketplace/dealer/*` ani `/marketplace/investor/*`
✅ Žádné nové ENV, žádná migrace, žádný nový helper soubor (nekrátit do util podle plánu bodu 3)

---

## Proč allow-list a ne deny-list (per plán)

- **Default deny**: nové role přidané do schématu v budoucnu automaticky spadnou do 403
- **Explicit opt-in**: jednoduchý audit přes `grep MARKETPLACE_ALLOWED_ROLES`
- **TypeScript bezpečnost**: `as const` + `typeof` cast zachovávají typing v strict mode

---

## Acceptance criteria — checklist

- [x] `grep MARKETPLACE_ALLOWED_ROLES app/api/marketplace/opportunities/route.ts` → 1 match
- [x] `grep MARKETPLACE_ALLOWED_ROLES 'app/api/marketplace/opportunities/[id]/route.ts'` → 1 match
- [x] `npm run build` prošel bez TypeScript chyb
- [x] `npm run lint` na dotčených souborech — 0 errors
- [x] Commit: `fix(marketplace): add role guard to GET opportunities endpoints (GDPR/PII)`
- [ ] Curl test s různými session tokeny (ponecháno pro QA — nemám přístup k test session tokenům)

---

## Seznam souborů v commitu

```
M  app/api/marketplace/opportunities/route.ts
M  app/api/marketplace/opportunities/[id]/route.ts
```

2 files changed, 18 insertions(+)

---

## Bezpečnostní dopad

**Před fixem:**
- `GET /api/marketplace/opportunities` — projde všichni přihlášení (BROKER, BUYER, ADVERTISER, PARTS_SUPPLIER, REGIONAL_DIRECTOR, MANAGER, PARTNER_BAZAR, PARTNER_VRAKOVISTE) → vidí VIN, dealery, confirmed funding
- `GET /api/marketplace/opportunities/[id]` — navíc vidí **jména investorů + jejich částky** (GDPR článek 6 violation)

**Po fixu:**
- Pouze `VERIFIED_DEALER`, `INVESTOR`, `ADMIN`, `BACKOFFICE` projdou
- Ostatní role dostanou **403 Forbidden** + lokalizovaná chybová zpráva
