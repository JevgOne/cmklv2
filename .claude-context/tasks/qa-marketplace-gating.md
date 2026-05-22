# QA Report — Task #27: Marketplace VIP role gating

**Datum:** 2026-04-06  
**Agent:** KONTROLOR  
**Zkontrolováno:** 6 stránek + 8 API routes

---

## POVOLENÉ ROLE (z zadání)
- INVESTOR — investor dashboard
- VERIFIED_DEALER — realizátor dashboard  
- ADMIN / BACKOFFICE — vše
- Veřejná landing `/marketplace` — OK (ApplyForm pro nové žadatele)

---

## 1. STRÁNKY — VÝSLEDEK: ❌ KRITICKÁ DÍRA

Žádná z chráněných stránek NEMÁ `getServerSession` check. Jsou přístupné bez přihlášení.

| Stránka | Auth gate | Přímý DB přístup | Závažnost | Verdikt |
|---------|-----------|-----------------|-----------|---------|
| `/marketplace` | ❌ žádná | NE (jen stats z lib/stats) | ✅ VEŘEJNÁ — OK | ✅ |
| `/marketplace/dealer` | ❌ žádná | ANO — `prisma.flipOpportunity.findMany` (vše) | VYSOKÁ | ❌ |
| `/marketplace/dealer/nova` | ❌ žádná | NE (client component OpportunityWizard) | STŘEDNÍ | ❌ |
| `/marketplace/dealer/[id]` | ❌ žádná | ANO — investoři + jejich částky | KRITICKÁ | ❌ |
| `/marketplace/investor` | ❌ žádná | ANO — `prisma.flipOpportunity.findMany` (vše) | VYSOKÁ | ❌ |
| `/marketplace/investor/[id]` | ❌ žádná | NE (fetches přes API, ale render shell bez gate) | STŘEDNÍ | ❌ |

**Nejzávažnější:** `dealer/[id]` — bez přihlášení renderuje plný detail flipu včetně:
- `opp.investments[]` s `investor.firstName`, `investor.lastName`
- VIN vozidla
- Všechny finanční údaje (nákupní cena, oprava, odhad prodeje)

---

## 2. API ROUTES — VÝSLEDEK: ⚠️ ČÁSTEČNÉ MEZERY

### Přehled všech API routes:

| Route | Metoda | Session check | Role gate | Verdikt |
|-------|--------|--------------|-----------|---------|
| `/api/marketplace/apply` | POST | ✅ 401 | ✅ blokuje existující VIP role | ✅ |
| `/api/marketplace/opportunities` | POST | ✅ 401 | ✅ VERIFIED_DEALER/ADMIN/BACKOFFICE | ✅ |
| `/api/marketplace/opportunities` | GET | ✅ 401 | ❌ chybí explicitní gate | ⚠️ |
| `/api/marketplace/opportunities/[id]` | GET | ✅ 401 | ❌ chybí explicitní gate | ⚠️ |
| `/api/marketplace/opportunities/[id]` | PUT | ✅ 401 | ✅ owner/admin check | ✅ |
| `/api/marketplace/opportunities/[id]/approve` | POST | ✅ 401 | ✅ ADMIN/BACKOFFICE only | ✅ |
| `/api/marketplace/opportunities/[id]/payout` | POST | ✅ 401 | ✅ ADMIN/BACKOFFICE only | ✅ |
| `/api/marketplace/investments` | POST | ✅ 401 | ✅ INVESTOR/ADMIN/BACKOFFICE | ✅ |
| `/api/marketplace/investments` | GET | ✅ 401 | ⚠️ žádný role check, ale výsledky prázdné pro non-investors | ✅ de-facto |
| `/api/marketplace/investments/[id]/confirm-payment` | PUT | ✅ 401 | ✅ ADMIN/BACKOFFICE only | ✅ |
| `/api/marketplace/stats` | GET | ✅ 401 | ✅ explicit 403 fallback pro neznámé role | ✅ |

### Detail mezer v API:

**`GET /api/marketplace/opportunities` (opportunities/route.ts:72-186)**  
Role-based logic:
```typescript
if (session.user.role === "VERIFIED_DEALER") { where.dealerId = session.user.id }
else if (session.user.role === "INVESTOR") { where.status = { in: [...] } }
// ADMIN/BACKOFFICE vidí vše — ale žádný check pro jiné role
```
Problém: BROKER/ADVERTISER/BUYER/PARTS_SUPPLIER projde session checkem a dostane se do else větve — žádná where podmínka → vidí VŠECHNY flipOpportunity. Chybí explicitní `["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"].includes(role)` guard.

**`GET /api/marketplace/opportunities/[id]` (opportunities/[id]/route.ts:14-92)**  
Problém identický — session check OK, ale ne-marketplace role projdou a vidí full detail včetně investments od všech investorů.

---

## 3. REVERZNÍ KONTROLA

| # | Požadavek | Stav |
|---|-----------|------|
| 1 | Dealer dashboard (`/marketplace/dealer`) chráněn rolí | ❌ |
| 2 | Investor dashboard (`/marketplace/investor`) chráněn rolí | ❌ |
| 3 | Nova příležitost (`/marketplace/dealer/nova`) chráněna | ❌ |
| 4 | Detail flipu dealer (`/marketplace/dealer/[id]`) chráněn | ❌ |
| 5 | Detail flipu investor (`/marketplace/investor/[id]`) shell chráněn | ❌ |
| 6 | API POST opportunities — role gate | ✅ |
| 7 | API GET opportunities — role gate | ❌ (session pouze) |
| 8 | API GET opportunities/[id] — role gate | ❌ (session pouze) |
| 9 | API POST investments — role gate | ✅ |
| 10 | API apply — přístupná pro ne-VIP přihlášené | ✅ |

**Celkem: 5/10 ✅ (5 selhání)**

---

## 4. DOPORUČENÍ FIXŮ

### Fix A: Stránky — přidat session gate (Server Component pattern)

Přidat na začátek každé chráněné stránky (`dealer/page.tsx`, `dealer/nova/page.tsx`, `dealer/[id]/page.tsx`, `investor/page.tsx`, `investor/[id]/page.tsx`):

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

// V page component (async function):
const session = await getServerSession(authOptions);
if (!session?.user) {
  redirect("/prihlaseni?callbackUrl=/marketplace/dealer");
}

const MARKETPLACE_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"];
if (!MARKETPLACE_ROLES.includes(session.user.role)) {
  redirect("/marketplace?gate=restricted"); // → landing s ApplyForm
}

// Pro dealer-only stránky:
const DEALER_ROLES = ["VERIFIED_DEALER", "ADMIN", "BACKOFFICE"];
if (!DEALER_ROLES.includes(session.user.role)) {
  redirect("/marketplace/investor"); // přesměruj investora na jeho dashboard
}
```

**Investor/[id]** je Client Component → gate musí být v samostatném Server Component wrapperu nebo middleware.

### Fix B: API GET opportunities — přidat explicitní role gate

V `opportunities/route.ts:72` (GET handler), za session check přidat:

```typescript
const ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"];
if (!ALLOWED_ROLES.includes(session.user.role)) {
  return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
}
```

### Fix C: API GET opportunities/[id] — stejný pattern

V `opportunities/[id]/route.ts:14` (GET handler), za session check:

```typescript
const ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"];
if (!ALLOWED_ROLES.includes(session.user.role)) {
  return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
}
```

### Alternativa: Next.js Middleware

Přidat do `middleware.ts` pattern matching:

```typescript
// Chráněné marketplace routes
if (pathname.startsWith("/marketplace/dealer") || pathname.startsWith("/marketplace/investor")) {
  const session = await getToken({ req });
  if (!session) return NextResponse.redirect(new URL("/prihlaseni", req.url));
  const MARKETPLACE_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"];
  if (!MARKETPLACE_ROLES.includes(session.role as string)) {
    return NextResponse.redirect(new URL("/marketplace", req.url));
  }
}
```

---

## SOUHRN

| Oblast | Verdikt | Závažnost |
|--------|---------|-----------|
| Veřejná landing `/marketplace` | ✅ OK | — |
| Dealer/Investor dashboardy (stránky) | ❌ CHYBÍ GATE | KRITICKÁ |
| API POST routes (create, invest, approve, payout) | ✅ OK | — |
| API GET opportunities (list + detail) | ⚠️ CHYBÍ ROLE GATE | STŘEDNÍ |

**Celkové hodnocení: ❌ QA #27 FAIL — vyžaduje implementaci**

Doporučuji vytvořit fix task pro implementátora s diff snippety z Fix A + Fix B + Fix C výše.
