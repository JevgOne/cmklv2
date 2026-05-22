# QA Report — Marketplace Implementace (Předběžný audit)

**Datum:** 2026-04-26  
**Autor:** Kontrolor  
**Status:** PŘEDBĚŽNÝ — Task #5 čeká na impl (#3) + E2E testy (#4)  
**Scope:** Statický code review + strukturální analýza

---

## SHRNUTÍ

Marketplace implementace je v **70–80% stavu**. Jádro (role-based access, lifecycle, payout logika) je solidní. Chybí audit trail, caching, a je nekonzistence v minimální investici mezi schema a UI.

**Celkové hodnocení:** ⚠️ PODMÍNĚNĚ OK — 3 blocker bugy, 5 oprav doporučeno

---

## BLOCKER BUGY

### 🔴 BUG-1: Nekonzistence minimální investice
- **Soubor:** `components/web/marketplace/InvestModal.tsx` (handleSubmit)
- **Problém:** UI vynucuje minimum 10 000 Kč, ale `validators/marketplace.ts` má `min(1000)`
- **Riziko:** Pokud uživatel obejde UI (přímý API call), může investovat 1 000 Kč
- **Fix:** Sjednotit na 10 000 Kč v Zod schema v `lib/validators/marketplace.ts`

### 🔴 BUG-2: Admin detail page — client-side data loading
- **Soubor:** `app/(admin)/admin/marketplace/[id]/page.tsx`
- **Problém:** Je `"use client"` a loaduje data v `useEffect` přes fetch místo SSR
- **Riziko:** Flash of empty content, SEO, performance, auth token expiry edge case
- **Fix:** Převést na Server Component s async data fetchingem

### 🔴 BUG-3: repairPhotos v OpportunityWizard
- **Soubor:** `components/web/marketplace/OpportunityWizard.tsx`
- **Problém:** `repairPhotos` nejsou zahrnuty v POST requestu (step 4 — Shrnutí)
- **Riziko:** Data loss — repair fotky se neukládají při vytvoření příležitosti
- **Fix:** Přidat `repairPhotos` do POST payload, nebo zdokumentovat záměrný workflow

---

## MEDIUM PRIORITY

### ⚠️ WARN-1: Photo upload endpoint bez viditelné autentizace
- **Soubor:** `components/web/marketplace/DealPhotoGallery.tsx` → volá `/api/upload`
- **Problém:** Endpoint `/api/upload` nebyl auditován — chybí info o auth check
- **Akce:** Zkontrolovat `app/api/upload/route.ts` na role check

### ⚠️ WARN-2: Silent error handling v DealDetailClient
- **Soubor:** `components/web/marketplace/DealDetailClient.tsx` (`handleStatusUpdate`)
- **Problém:** catch blok ignoruje chyby bez user feedbacku
- **Fix:** Přidat toast/error state pro failed status update

### ⚠️ WARN-3: Stats bez caching
- **Soubor:** `app/api/marketplace/stats/route.ts`
- **Problém:** Fresh DB queries na každý request marketplace landing page
- **Fix:** Next.js `revalidate` nebo `unstable_cache` pro 60s TTL

### ⚠️ WARN-4: averageRoi vždy 0 v DealerStats
- **Soubor:** `app/(web)/marketplace/dealer/page.tsx` (`getDealerData`)
- **Problém:** `averageRoi` je placeholder 0, není kalkulován z DB
- **Fix:** Implementovat správnou kalkulaci z completed flipů

### ⚠️ WARN-5: Chybí audit trail / change log
- **Problém:** Žádná tabulka/log pro historii statusů FlipOpportunity
- **Dopad:** Nelze sledovat kdo a kdy změnil status, nemožné auditovat
- **Fix:** Přidat `FlipOpportunityLog` model nebo využít existující notification systém

---

## POZITIVNÍ NÁLEZY

| Oblast | Stav | Poznámka |
|--------|------|----------|
| Middleware protection | ✅ | dealer/investor/deals/admin vše chráněno |
| Role-based API access | ✅ | 3 role (investor/dealer/admin) konzistentně |
| Payout logic (40/40/20) | ✅ | $transaction, správné rozdělení, ztráty handled |
| Apply form anti-spam | ✅ | Rate limit + honeypot + 24h dedup |
| Zod validace | ✅ | Všechny API routes validovány |
| TypeScript strict | ✅ | Žádné `any` typy v marketplace kódu |
| Email notifikace | ✅ | Admin alert + potvrzení žadateli |
| FUNDING→FUNDED auto-transition | ✅ | confirm-payment route |
| Sjednocený deal detail | ✅ | /marketplace/deals/[id] pro oba role |
| FlipTimeline vizualizace | ✅ | 7-krokový lifecycle |
| ProfitCalculator | ✅ | Live 40/40/20 kalkulace |
| OpportunityWizard | ✅ | 4-step wizard s validací |

---

## API ROUTES — PŘEHLED

| Endpoint | Role | Status |
|----------|------|--------|
| POST /api/marketplace/apply | Public | ✅ OK |
| GET/POST /api/marketplace/opportunities | Role-based | ✅ OK |
| GET/PUT /api/marketplace/opportunities/[id] | Role-based | ✅ OK |
| POST /api/marketplace/opportunities/[id]/approve | Admin | ✅ OK |
| POST /api/marketplace/opportunities/[id]/payout | Admin | ✅ OK |
| GET/POST /api/marketplace/investments | Investor/Admin | ✅ OK |
| PUT /api/marketplace/investments/[id]/confirm-payment | Admin | ✅ OK |
| GET /api/marketplace/stats | Role-based | ✅ OK |

---

## PAGES — PŘEHLED

| Stránka | Auth | SSR | Status |
|---------|------|-----|--------|
| /marketplace | Public | ✅ | ✅ OK |
| /marketplace/apply | Public | ✅ | ✅ OK |
| /marketplace/dealer | VERIFIED_DEALER | ✅ | ✅ OK |
| /marketplace/dealer/nova | VERIFIED_DEALER | ✅ | ✅ OK |
| /marketplace/dealer/[id] | redirect | - | ✅ OK |
| /marketplace/investor | INVESTOR | ✅ | ✅ OK |
| /marketplace/investor/[id] | redirect | - | ✅ OK |
| /marketplace/deals/[id] | VD/INV/ADMIN | ✅ | ✅ OK |
| /admin/marketplace | ADMIN/BO | ✅ | ✅ OK |
| /admin/marketplace/[id] | ADMIN/BO | ❌ client | 🔴 BUG-2 |

---

## SECURITY ASSESSMENT

| Hrozba | Status |
|--------|--------|
| Neautentizovaný přístup | ✅ SAFE (middleware) |
| Role escalation | ✅ SAFE |
| SQL injection | ✅ SAFE (Prisma) |
| XSS | ✅ SAFE (React) |
| CSRF | ✅ SAFE (NextAuth) |
| Rate limiting (apply) | ⚠️ WEAK (IP-based, proxy bypass) |
| Honeypot | ✅ GOOD |
| Payment tampering | ✅ SAFE (transactions) |
| Photo upload auth | ⚠️ NEOVĚŘENO |

---

## DOPORUČENÉ OPRAVY — PRIORITA

1. **[P1]** BUG-1: Sjednotit min. investici na 10k v Zod schema
2. **[P1]** BUG-2: Převést `/admin/marketplace/[id]` na SSR
3. **[P1]** BUG-3: Vyjasnit repairPhotos workflow v OpportunityWizard
4. **[P2]** WARN-1: Auditovat `/api/upload` endpoint
5. **[P2]** WARN-2: Error handling v DealDetailClient
6. **[P3]** WARN-3: Caching pro marketplace stats
7. **[P3]** WARN-4: Implementovat averageRoi kalkulaci
8. **[P3]** WARN-5: Zvážit audit trail pro FlipOpportunity status changes

---

## POZNÁMKA PRO IMPLEMENTÁTORA

Task #5 (formální QA) čeká na dokončení Tasks #3 (implementace oprav) a #4 (E2E testy).  
Tento předběžný audit slouží jako vstup pro plánovačův plán (#2) a implementátora (#3).  
Po dokončení implementace provedu full QA včetně spuštění Playwright testů.
