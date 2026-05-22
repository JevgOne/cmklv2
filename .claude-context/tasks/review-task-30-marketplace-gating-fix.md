# Review task #30 — Marketplace gating fix (ACK)

**Datum:** 2026-04-06
**Reviewer:** Evžen THE KING
**Task:** #30 — quick ACK pro fix marketplace gating
**Commit:** `0e9fb4f`
**Vztah:** implementuje Fix B + C z review #27

---

## Ověření proti review #27

Fix B a Fix C byly implementovány **literal** podle mého review #27 (řádky 154-174):

### Fix B — `app/api/marketplace/opportunities/route.ts` GET ✅

Řádky 80-86 (za session check):
```typescript
const MARKETPLACE_ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"] as const;
if (!MARKETPLACE_ALLOWED_ROLES.includes(session.user.role as typeof MARKETPLACE_ALLOWED_ROLES[number])) {
  return NextResponse.json(
    { error: "Nemáte oprávnění k zobrazení marketplace příležitostí" },
    { status: 403 }
  );
}
```

Guard je umístěn **po** session check (`session?.user?.id` na řádku 74-77) a **před** filter logikou (řádek 88+). Přesně tam, kam jsem to doporučil.

### Fix C — `app/api/marketplace/opportunities/[id]/route.ts` GET ✅

Řádky 25-31 — identický pattern, identický allow-list, identické 403. Umístěno mezi session check (řádek 19-22) a `prisma.flipOpportunity.findUnique` (řádek 35). PII leak investorů (`investments.investor.firstName/lastName`) je nyní chráněn — BROKER/BUYER/ADVERTISER/PARTS_SUPPLIER dostanou 403 ještě před findUnique.

### Co NEBYLO změněno (správně)

- **Fix A (stránkové gates)** — neimplementováno. Middleware.ts:227-261 už chrání `/marketplace/dealer/*` a `/marketplace/investor/*` na Next.js úrovni. Defense-in-depth redundance by byla zbytečná práce.
- **middleware.ts** — beze změny (potvrzeno team-leadem, QA regresí).
- **POST `/opportunities`, PUT `/opportunities/[id]`, `/approve`, `/payout`, `/confirm-payment`, `/investments`, `/apply`, `/stats`** — všechny už měly správné gates (ověřeno v review #27 tabulka na řádku 131-139).

### Detail consistency check

- Allow-list literal shodný: `["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"]` = team-lead zadání = review #27 doporučení ✅
- `as const` + `typeof X[number]` cast — čistý TypeScript strict pattern, nic se nepotlačuje ✅
- 403 status code (ne 401) — správně, uživatel je přihlášený, jen nemá oprávnění ✅
- Lokalizovaná chybová zpráva v češtině — konzistentní se zbytkem marketplace API ✅

---

## Křížová kontrola s QA Re-QA #34

Team-lead deklaruje QA Re-QA #34 PASS (build 309/309, lint baseline 550, grep 1 match v každém souboru, regrese middleware nedotčen, `/marketplace` landing stále veřejná). Nejsou v rozporu s tím, co vidím v kódu.

---

## ✅ TASK #30 APPROVED

Fix marketplace gating je kompletní. 2 API leaky z review #27 (GET opportunities list + detail) jsou opravené, allow-list literal sedí, middleware zůstává jako primární ochrana stránek.

**Deploy blocker z review #27 odstraněn.** Marketplace gating už není důvod zdržovat produkci.

---

**Evžen THE KING — task #30 APPROVED.**
