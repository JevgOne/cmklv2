# Review task #27 — Marketplace VIP role gating

**Datum:** 2026-04-06
**Reviewer:** Evžen THE KING
**Task:** #27 kontrola QA reportu kontrolora

---

## TL;DR

**QA kontrolor má jen ČÁSTEČNOU pravdu.** Přehlédl existující ochranu v `middleware.ts` → 5 z 10 jeho nálezů jsou **false positive**. Zbývající 2 API leaky jsou **reálné** a musí se opravit.

---

## 1. CO KONTROLOR PŘEHLÉDL

### Middleware.ts MÁ marketplace role gate

Soubor `middleware.ts:227-261` obsahuje explicitní ochranu marketplace stránek:

```typescript
const MARKETPLACE_DEALER_ROLES = ["VERIFIED_DEALER", "ADMIN", "BACKOFFICE"];
const MARKETPLACE_INVESTOR_ROLES = ["INVESTOR", "ADMIN", "BACKOFFICE"];

// Chráněné marketplace dealer routy
if (pathname.startsWith("/marketplace/dealer")) {
  const token = await getToken({ req: request, secret: ... });
  if (!token) return redirect("/login?callbackUrl=" + pathname);
  if (!MARKETPLACE_DEALER_ROLES.includes(token.role)) {
    return redirect("/marketplace");
  }
}

// Chráněné marketplace investor routy
if (pathname.startsWith("/marketplace/investor")) {
  const token = await getToken({ req: request, secret: ... });
  if (!token) return redirect("/login?callbackUrl=" + pathname);
  if (!MARKETPLACE_INVESTOR_ROLES.includes(token.role)) {
    return redirect("/marketplace");
  }
}
```

**Důsledek:** Všechny stránky pod `/marketplace/dealer/*` a `/marketplace/investor/*` jsou **chráněny na úrovni middleware** — middleware běží v Next.js dřív než rendering stránky. Stránka se nikdy nenarenderuje pro neopávněného uživatele.

Navíc je middleware **přísnější** než kontrolor navrhoval:
- Kontrolor: "INVESTOR, VERIFIED_DEALER, ADMIN, BACKOFFICE by měli mít přístup"
- Middleware: Dealer sekce pouze pro VERIFIED_DEALER/ADMIN/BACKOFFICE (ne INVESTOR!), investor sekce pouze pro INVESTOR/ADMIN/BACKOFFICE (ne VERIFIED_DEALER!)

**Middleware je lepší** — dealer nemá co vidět investor dashboard a naopak (segregace mezi rolemi).

### Potvrzení z test-chrome reportu

Task #4 final Chrome test potvrdil (cituji z `chrome-test-complete.md:180`):
```
✅ 307 → login (auth-protected)
/marketplace/dealer, /marketplace/investor, /marketplace/dealer/nova
```

Pokud by stránky nebyly chráněny, Chrome test by dostal 200 OK, ne 307 redirect. Middleware funguje.

---

## 2. OPRAVA KONTROLOROVA VERDICTU

### Tabulka 1 (stránky) — 5 FALSE POSITIVES

| Stránka | Kontrolor | Realita | Oprava |
|---------|-----------|---------|--------|
| `/marketplace` | ✅ VEŘEJNÁ — OK | ✅ Veřejná (landing + ApplyForm) | Kontrolor OK |
| `/marketplace/dealer` | ❌ bez gate | ✅ **Chráněno middleware** | **FALSE POSITIVE** |
| `/marketplace/dealer/nova` | ❌ bez gate | ✅ **Chráněno middleware** (`startsWith("/marketplace/dealer")`) | **FALSE POSITIVE** |
| `/marketplace/dealer/[id]` | ❌ bez gate | ✅ **Chráněno middleware** | **FALSE POSITIVE** |
| `/marketplace/investor` | ❌ bez gate | ✅ **Chráněno middleware** | **FALSE POSITIVE** |
| `/marketplace/investor/[id]` | ❌ bez gate | ✅ **Chráněno middleware** | **FALSE POSITIVE** |

**5 z 5 stránkových nálezů je false positive.** Middleware je autoritativní Next.js ochranná vrstva, runnuje se před rendering — ne méně platná než `getServerSession` v Server Component.

### Tabulka 2 (API routes) — 2 REÁLNÉ LEAKY potvrzené

#### ✅ REÁLNÝ LEAK: `GET /api/marketplace/opportunities` (opportunities/route.ts:72-186)

Ověřeno čtením kódu. Role branching (řádky 82-100):
```typescript
const where: Record<string, unknown> = {};

if (session.user.role === "VERIFIED_DEALER") {
  where.dealerId = session.user.id;
} else if (session.user.role === "INVESTOR") {
  where.status = { in: [...] };
}
// ADMIN/BACKOFFICE vidí vše — komentář
```

**Problém:** BROKER, BUYER, ADVERTISER, PARTS_SUPPLIER, REGIONAL_DIRECTOR, MANAGER, PARTNER_BAZAR, PARTNER_VRAKOVISTE projdou `session.user?.id` checkem a **spadnou do default větve bez jakéhokoli `where` filtru** → získají celý seznam `flipOpportunity.findMany()`.

Leaknutá data:
- Plné detaily všech příležitostí (VIN, ceny, popis oprav)
- Jména dealerů (firstName, lastName, companyName)
- Agregované částky investic (`confirmedFunding`)

**Závažnost:** STŘEDNÍ/VYSOKÁ. Nejde o PII investorů (ty jsou strippnuté přes `investments: undefined`), ale leakuje se VIN + dealer jména + finanční údaje o neschválených/private příležitostech.

#### ✅ REÁLNÝ LEAK: `GET /api/marketplace/opportunities/[id]` (opportunities/[id]/route.ts:14-92)

Ověřeno čtením kódu. Pouze:
- Session check (řádek 20)
- `VERIFIED_DEALER owner` check (řádek 56-61)
- `INVESTOR` nesmí vidět PENDING_APPROVAL (řádek 63-68)
- Na konci `investor` filter investments pouze pro INVESTOR roli (řádek 71-76)

**Problém:** BROKER, BUYER, ADVERTISER, PARTS_SUPPLIER projdou všemi těmito kontrolami (nejsou v žádné z nich zmíněni) a dostanou **plný detail** včetně:
```typescript
investments: {
  include: {
    investor: { select: { id, firstName, lastName } }  // ← PII LEAK
  }
}
```

Leaknutá data:
- **PII investorů:** jméno + příjmení + id
- Částky všech investic
- VIN vozidla
- Kompletní finance (nákup, oprava, odhad prodeje)
- `repairDescription`, `adminNotes` (pokud existují)

**Závažnost:** VYSOKÁ. Toto je skutečný PII leak investorů a confidential business data.

#### ℹ️ Ostatní API routes hodnocené kontrolorem správně

Kontrolor správně označil jako ✅ OK:
- `POST /api/marketplace/opportunities` — DEALER_ROLES gate explicit ✅
- `PUT /api/marketplace/opportunities/[id]` — owner/admin check ✅
- `/approve`, `/payout`, `/confirm-payment` — ADMIN_ROLES only ✅
- `POST /api/marketplace/investments` — INVESTOR gate ✅
- `/apply` — blokuje existující VIP role ✅
- `GET /api/marketplace/stats` — explicit 403 fallback ✅

---

## 3. MAPOVÁNÍ NA DOPORUČENÉ FIXY

### Fix A (stránkové gate) — **NE NUTNÝ, REDUNDANTNÍ**

Kontrolor navrhoval přidat `getServerSession` do každé stránky. **Není to potřeba** — middleware už to řeší. Přidání by vedlo k duplicitnímu check code (middleware + page).

**Defense-in-depth argument:** Můžeme to přidat jako sekundární vrstvu (bezpečnost v hloubce), ale není to **blokující**. Middleware sám je dostatečný Next.js pattern pro route protection.

**Doporučení Evžena:** Pokud chcete defense-in-depth, přidejte server-side gate do Server Components. Pokud chcete minimum změn pro fix, ponechte jen middleware.

### Fix B (API GET opportunities) — **POVINNÝ**

Přidat za session check v `opportunities/route.ts:77`:

```typescript
const ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"];
if (!ALLOWED_ROLES.includes(session.user.role)) {
  return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
}
```

Lze taky striktnější: rozdělit na dealer-view a investor-view endpointy. Ale pro MVP stačí global allow-list.

### Fix C (API GET opportunities/[id]) — **POVINNÝ**

Stejný pattern na `opportunities/[id]/route.ts:22`:

```typescript
const ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"];
if (!ALLOWED_ROLES.includes(session.user.role)) {
  return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
}
```

---

## 4. FINÁLNÍ VERDIKT

| Oblast | Kontrolor verdict | Evžen verdict | Důvod |
|--------|-------------------|---------------|-------|
| Stránky | ❌ KRITICKÁ DÍRA | ✅ **OK** | Middleware chrání (kontrolor přehlédl) |
| API POST/PUT routes | ✅ OK | ✅ OK | Správně |
| API GET opportunities | ⚠️ mezera | ❌ **REJECT** | Reálný leak (VIN, dealer PII, finance) |
| API GET opportunities/[id] | ⚠️ mezera | ❌ **REJECT** | Reálný **investor PII leak** |

## ❌ TASK #27 REJECTED — pouze kvůli 2 API leakům

Musí se opravit **Fix B + Fix C** (2 API routes, ~6 řádků kódu každá). Fix A není nutný (middleware už stránky chrání), ale je volitelně přidatelný jako defense-in-depth.

### Akce pro team-leada

1. **Vytvořit fix task** pro implementátora s těmito konkrétními změnami:
   - `app/api/marketplace/opportunities/route.ts:77` — přidat role guard po session check
   - `app/api/marketplace/opportunities/[id]/route.ts:22` — přidat role guard po session check
2. **Povolené role dle literal zadání:** INVESTOR, VERIFIED_DEALER, ADMIN, BACKOFFICE
3. **NE přidávat** stránkové `getServerSession` (middleware.ts už to řeší) — ušetříte implementátorovi práci
4. **Re-kontrola:** po fixu stačí re-grep `ALLOWED_ROLES` v těch 2 souborech a curl test s BROKER session

### Závažnost pro deploy

- **Stránky:** ✅ bezpečné, middleware funguje
- **API leaky:** 🟡 STŘEDNÍ — vyžaduje přihlášeného uživatele (ne open leak) a nefunkční role který teoreticky nemá přístup (BROKER, BUYER, ADVERTISER, PARTS_SUPPLIER). Exploitable přes curl s jakýmkoli loginem.

**Doporučení:** Tento fix je rychlý (2 routes × ~6 řádků). **Zablokuje deploy?** Ano pro produkci — i když je závažnost střední, je to explicitní PII leak investorů přes authentikované API. Oprava je triviální a musí proběhnout před produkcí.

---

**Evžen THE KING — review task #27 hotov.**
