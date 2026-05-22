# Plan task #30 — Marketplace API role gating fix (URGENT security)

**Datum:** 2026-04-06
**Planner:** planovac
**Priorita:** 🚨 P0 — blokuje produkční deploy
**Scope:** úzký — 2 API endpointy, ~12 řádků celkem
**Odhad:** 5–10 minut práce pro developera

---

## 1. Kontext a motivace

### Zjištění QA kontrolora (task #27)
QA kontrolor hlásil 5 stránek + 2 API routy bez marketplace role gate. Evženův review (`.claude-context/tasks/review-task-27-marketplace-gating.md`) potvrdil, že:

- **5 stránek je FALSE POSITIVE** — `middleware.ts:227-261` už obsahuje explicitní marketplace role gate (`MARKETPLACE_DEALER_ROLES`, `MARKETPLACE_INVESTOR_ROLES`). Middleware běží před rendering stránky, takže neoprávněný uživatel dostane 307 redirect na `/marketplace`. Potvrzeno Chrome testem (task #4): `/marketplace/dealer`, `/marketplace/investor`, `/marketplace/dealer/nova` → 307 → login.
- **2 API routy jsou REÁLNÝ LEAK** — tyto endpointy session-check projdou všichni přihlášení uživatelé bez ohledu na roli, což způsobuje únik PII a obchodních dat.

### Závažnost úniku

#### Endpoint 1: `GET /api/marketplace/opportunities`
Role branching (řádky 82-100 v `app/api/marketplace/opportunities/route.ts`) filtruje where-clause pouze pro VERIFIED_DEALER a INVESTOR; default větev vrací **celý seznam příležitostí**. Role které nemají být v marketplace (BROKER, BUYER, ADVERTISER, PARTS_SUPPLIER, REGIONAL_DIRECTOR, MANAGER, PARTNER_BAZAR, PARTNER_VRAKOVISTE) získají:
- VIN všech vozidel
- Jména dealerů (firstName, lastName, companyName)
- Agregované `confirmedFunding` (kolik už je nainvestováno)
- Popis oprav, ceny, celé business pipeline

**Severita:** STŘEDNÍ — obchodní data, ne pure PII.

#### Endpoint 2: `GET /api/marketplace/opportunities/[id]` 🚨
Tento endpoint je **horší** — `include: { investments: { include: { investor: { select: { id, firstName, lastName } } } } }`. Neoprávněné role dostanou:
- **Plné PII investorů** (id + jméno + příjmení) — GDPR článek 6 violation
- Částky všech investic
- VIN vozidla, kompletní finance (nákup, oprava, prodej)
- `repairDescription`, `adminNotes`

**Severita:** VYSOKÁ — GDPR PII leak. Blokuje produkční deploy.

### Proč ne stránkové fixy
Middleware už stránky chrání. Přidání `getServerSession` do Server Components by bylo duplicitní a zbytečně by zvýšilo údržbu. Defense-in-depth je volitelně možný, ale **není součástí tohoto tasku** — pokud bude potřeba, založte separátní low-prio task.

---

## 2. Scope

### V SCOPE
1. Přidat allow-list role check do `app/api/marketplace/opportunities/route.ts` (GET handler, po session check)
2. Přidat identický allow-list role check do `app/api/marketplace/opportunities/[id]/route.ts` (GET handler, po session check)

### MIMO SCOPE
- Stránkové `getServerSession` guards (middleware už řeší)
- Audit ostatních marketplace API endpointů (kontrolor už potvrdil, že ostatní jsou OK — POST/PUT opportunities, approve, payout, investments, stats)
- Strukturální refactor (rozdělení dealer-view / investor-view endpointů)
- Rozšíření middleware na API layer (mimo Next.js best practice, API běží v edge bez session)
- Úprava middleware.ts (už funguje správně)

---

## 3. Detailní návrh implementace

### Fix B — `app/api/marketplace/opportunities/route.ts`

**Lokace:** za session check (cca řádek 77, před `const where: Record<string, unknown> = {}`).

**Kód k přidání:**
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

**Pozn.:** Použij `as const` + `typeof` cast, aby TypeScript strict mode neblokoval build (session.user.role je string, allow-list je tuple literálů).

### Fix C — `app/api/marketplace/opportunities/[id]/route.ts`

**Lokace:** za session check (cca řádek 22, před `const opportunity = await prisma.flipOpportunity.findUnique(...)`).

**Kód k přidání:** IDENTICKÝ jako Fix B — stejná konstanta, stejná chybová zpráva, stejný status code.

**Pozn.:** Neextrahuj do sdíleného helperu — task je jednorázový fix a 6 řádků na 2 místech je čitelnější než nový util file. Pokud v budoucnu přibudou další endpointy (např. dealer stats), lze refactorovat do `lib/marketplace-auth.ts`.

### Proč allow-list a ne deny-list
- **Default deny** je bezpečnější — nové role přidané do schématu v budoucnu (např. CONTENT_MANAGER) automaticky spadnou do 403 dokud někdo nerozhodne, že mají mít přístup.
- **Explicit opt-in** usnadňuje audit — stačí grep `MARKETPLACE_ALLOWED_ROLES` pro celou mapu.

---

## 4. Pořadí implementace

1. **Fix B** — `app/api/marketplace/opportunities/route.ts` (přidat guard)
2. **Fix C** — `app/api/marketplace/opportunities/[id]/route.ts` (přidat guard)
3. **Build check** — `npm run build` (TypeScript strict mode prošel)
4. **Manual curl test** (viz Acceptance criteria)
5. **Commit** — conventional commit `fix(marketplace): add role guard to opportunities API endpoints`

Není potřeba migrace, nejsou změny v Prisma schema, není dotčen frontend.

---

## 5. Acceptance criteria

### Must-have
- [ ] `grep MARKETPLACE_ALLOWED_ROLES app/api/marketplace/opportunities/route.ts` → 1 match
- [ ] `grep MARKETPLACE_ALLOWED_ROLES 'app/api/marketplace/opportunities/[id]/route.ts'` → 1 match
- [ ] `npm run build` prošel bez TypeScript chyb
- [ ] `npm run lint` prošel
- [ ] Curl s BROKER session na `/api/marketplace/opportunities` → `403 Forbidden`
- [ ] Curl s BROKER session na `/api/marketplace/opportunities/<id>` → `403 Forbidden`
- [ ] Curl s INVESTOR session na `/api/marketplace/opportunities` → `200 OK` + filtrovaný seznam
- [ ] Curl s VERIFIED_DEALER session na `/api/marketplace/opportunities` → `200 OK` + vlastní příležitosti
- [ ] Curl s ADMIN session na `/api/marketplace/opportunities/<id>` → `200 OK` + plné detaily

### Nice-to-have (v tomto tasku ne nutné)
- [ ] E2E test v `e2e/marketplace-flows.spec.ts` pro 403 case

---

## 6. Test plan

### Manual curl test
```bash
# 1. Získej session tokeny pro různé role z dev seedu
# (přihlášení přes UI nebo seed skript — viz prisma/seed.ts)

# 2. Test 1 — BROKER by měl dostat 403
curl -i http://localhost:3000/api/marketplace/opportunities \
  -H "Cookie: next-auth.session-token=<BROKER_TOKEN>"
# Očekávaný výstup: HTTP/1.1 403 Forbidden
# Body: {"error":"Nemáte oprávnění k zobrazení marketplace příležitostí"}

# 3. Test 2 — INVESTOR by měl dostat 200 + filtrovaný seznam
curl -i http://localhost:3000/api/marketplace/opportunities \
  -H "Cookie: next-auth.session-token=<INVESTOR_TOKEN>"
# Očekávaný výstup: HTTP/1.1 200 OK + JSON s opportunities

# 4. Test 3 — BROKER na detail endpoint
curl -i http://localhost:3000/api/marketplace/opportunities/<any-id> \
  -H "Cookie: next-auth.session-token=<BROKER_TOKEN>"
# Očekávaný výstup: HTTP/1.1 403 Forbidden

# 5. Test 4 — ADMIN na detail (sanity check, nemá se rozbít)
curl -i http://localhost:3000/api/marketplace/opportunities/<any-id> \
  -H "Cookie: next-auth.session-token=<ADMIN_TOKEN>"
# Očekávaný výstup: HTTP/1.1 200 OK + plný detail včetně investments
```

### Regression check
- [ ] `npm run test` — existing unit tests prošly
- [ ] E2E `e2e/marketplace-flows.spec.ts` prošel (pokud existuje)

---

## 7. Rizika a jejich mitigace

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Session.user.role má unexpected hodnotu (null, undefined) | Nízké | Medium | `.includes()` vrátí `false` pro `undefined` → 403. Safe by default. |
| Některý existující test počítá s tím, že BROKER dostane data | Nízké | Low | Spusť `npm run test` + E2E. Pokud padne, test byl špatně (testoval leaked data). |
| Middleware change v budoucnu změní authoring | Nízké | Low | Allow-list je lokální v každém endpointu, nezávisí na middleware. |
| Admin UI používá tyto endpointy pod ADMIN session | Střední | Low | ADMIN je v allow-listu — projde OK. |

---

## 8. Kritické soubory

```
app/api/marketplace/opportunities/route.ts              ← Fix B (GET handler, cca ř. 77)
app/api/marketplace/opportunities/[id]/route.ts         ← Fix C (GET handler, cca ř. 22)
```

Pro kontrolu (nepotřebují změnu):
```
middleware.ts:227-261                                   ← už chrání stránky
app/api/marketplace/opportunities/route.ts (POST)       ← už má DEALER_ROLES gate
app/api/marketplace/opportunities/[id]/route.ts (PUT)   ← už má owner/admin check
app/api/marketplace/opportunities/[id]/approve/route.ts ← už má ADMIN_ROLES gate
app/api/marketplace/stats/route.ts                      ← už má explicit 403 fallback
```

---

## 9. Commit message

```
fix(marketplace): add role guard to opportunities API endpoints

GET /api/marketplace/opportunities a GET /api/marketplace/opportunities/[id]
leaky PII investorů (firstName, lastName, id), VIN a obchodní data všem
přihlášeným uživatelům bez ohledu na roli.

Přidán allow-list guard: pouze VERIFIED_DEALER, INVESTOR, ADMIN, BACKOFFICE.
Ostatní role (BROKER, BUYER, ADVERTISER, PARTS_SUPPLIER atd.) dostanou 403.

Stránky jsou chráněny middleware.ts:227-261 — ne nutné duplicitní gates.

Ref: task #30, review #27
```

---

## 10. Follow-up tasky (pro team-lead k zvážení)

- **#30a (nice-to-have):** Defense-in-depth stránkové `getServerSession` v `app/(web)/marketplace/dealer/*` a `/investor/*` jako druhá vrstva ochrany. **Priorita: LOW.** Middleware je dostatečný Next.js pattern.
- **#30b (nice-to-have):** E2E test `e2e/marketplace-flows.spec.ts` s BROKER loginem pro 403 case. **Priorita: MEDIUM.** Prevence regrese.
- **#30c (future):** Sdílený helper `lib/marketplace-auth.ts` s `assertMarketplaceAccess(session)` — až bude více endpointů. Ted ne, je to premature abstraction.

---

**Plán hotov. Scope: 2 endpointy, ~12 řádků kódu, 0 migrací, 0 UI změn. Developer může implementovat během 5-10 minut.**
