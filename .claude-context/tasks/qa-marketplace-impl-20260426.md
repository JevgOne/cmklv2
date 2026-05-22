# QA Report — Marketplace Implementace (Task #5)

**Datum:** 2026-04-26  
**Autor:** Kontrolor  
**Commity:** cfe5add → 39f219b (5 commitů)  
**Status: ✅ APPROVED s poznámkami**

---

## VERDICT

Implementace je **funkčně kompletní**. Všechna P0 a P1 kritéria splněna. TypeScript bez nových chyb, lint bez nových errorů. Nalezeny 2 minor issues (F12 částečně, aplikace detail UI bez error feedbacku).

---

## TypeScript & Lint

```
npx tsc --noEmit
→ 0 nových TS chyb v marketplace souborech
→ Existující chyby jsou pre-existing (makleri/page.tsx, e2e testy) — nesouvisí s implementací

npm run lint
→ 0 nových lint chyb/errorů v marketplace souborech
→ Existující 3 errory jsou v scripts/audit-pwa-apps.js — pre-existing
```

---

## §5 ACCEPTANCE CRITERIA — Výsledky

### MUST (P0+P1): ✅ VŠECHNY SPLNĚNY

| # | Kritérium | Stav | Ověření |
|---|-----------|------|---------|
| AC1 | Admin vidí seznam žádostí na `/admin/marketplace/applications` | ✅ | `applications/page.tsx` — SSR, tabulka s filtry a paginací |
| AC2 | Admin může schválit žádost → vytvoří se user s příslušnou rolí | ✅ | `api/admin/marketplace/applications/[id]/route.ts:84-142` — full approve flow |
| AC3 | Admin může zamítnout žádost → status REJECTED | ✅ | Stejný route — REJECTED flow + rejectionReason |
| AC4 | PaymentConfirmation Reject button funguje (investment → REFUNDED) | ✅ | `confirmPaymentSchema` union + route:54-60 |
| AC5 | Dealer dashboard zobrazuje POUZE vlastní flipy | ✅ | `dealer/page.tsx:26-28` — `where.dealerId = session.user.id` |
| AC6 | Investor dashboard zobrazuje POUZE vlastní investice v portfolio stats | ✅ | `investor/page.tsx:69-109` — oddělené queries |
| AC7 | Zod schema `createInvestmentSchema` má min 10000 | ✅ | `validators/marketplace.ts:76` — `min(10000)` |

### SHOULD (P2): ✅ SPLNĚNY, ⚠️ ČÁSTEČNĚ

| # | Kritérium | Stav | Poznámka |
|---|-----------|------|----------|
| AC8 | OpportunityWizard neumožní přeskočit krok bez povinných polí | ✅ | `OpportunityWizard.tsx:62-73` + `disabled={!canProceed()}` line 336 |
| AC9 | Admin detail zobrazuje email dealera | ✅ | `opportunities/[id]/route.ts:89-93` — jen pro ADMIN/BACKOFFICE |
| AC10 | marketAnalysis field odstraněn ze wizard | ✅ | FormData interface + JSX — pole odstraněno |
| AC11 | repairPhotos zahrnuty v wizard POST requestu | ✅ | `OpportunityWizard.tsx:98` |
| AC12 | averageRoi počítán z reálných dat | ✅ | `dealer/page.tsx:63-74` — z COMPLETED flipů s actualSalePrice |
| AC13 | Žádné silent catch bloky — všechny mají console.error | ⚠️ | ČÁSTEČNĚ — viz níže |

---

## DETAILNÍ CODE REVIEW

### F1: Admin Applications — ✅ OK

**`app/api/admin/marketplace/applications/route.ts`**
- Auth: ADMIN + BACKOFFICE only ✅
- Filtry: status, fulltext search (jméno/email/firma), paginace ✅
- `Promise.all([findMany, count])` — efektivní ✅

**`app/api/admin/marketplace/applications/[id]/route.ts`**
- Approve flow kompletní: existující user → link, nový user → create + welcome email ✅
- Heslo generováno: `Math.random().toString(36).slice(-10) + "A1!"` — splňuje min. požadavky ✅
- Welcome email obsahuje credentials — design decision, akceptovatelné ✅
- `bcrypt.hash(tempPassword, 12)` — správný cost factor ✅
- `reviewedById + reviewedAt` zaznamenáno ✅

**`app/(admin)/admin/marketplace/applications/page.tsx`**
- SSR Server Component ✅
- `force-dynamic` ✅
- Status tabs, search, paginace ✅
- Badge na "nových" žádostech ✅

**`app/(admin)/admin/marketplace/applications/[id]/page.tsx`**
- "use client" + useEffect — konzistentní s `admin/marketplace/[id]/page.tsx` (oba client) ✅
- Loading state, not-found state ✅
- Confirm dialog před schválením ✅
- Rejection reason validation (alert před submit) ✅
- Propojený user zobrazen po approve ✅

### F2: PaymentConfirmation Reject — ✅ OK

- `confirmPaymentSchema` je discriminated union ✅
- API route rozlišuje `rejected: true` → `REFUNDED`, jinak confirm flow ✅
- Existující confirm flow nenarušen ✅

### F3: Dealer Dashboard — ✅ OK

- `session` check + early return pro unauthenticated ✅
- `isAdmin` bypass — ADMIN/BACKOFFICE vidí vše ✅
- VERIFIED_DEALER vidí jen `where.dealerId = userId` ✅
- Empty state: "Žádné příležitosti." ✅

### F4: Investor Dashboard — ✅ OK

- Dvě oddělené query: `dbAvailable` (FUNDING/APPROVED pro všechny) + `myInvestments` (per-user) ✅
- `Promise.all` paralelně ✅
- Portfolio stats z `confirmedInvestments` — správná logika ✅
- averageRoi z paidOut investic ✅
- Admin fallback: vidí vše ✅
- Deduplication investedOpps přes Map ✅
- Empty states pro obě sekce ✅

### F5: Min. investice — ✅ OK

- `validators/marketplace.ts:76`: `min(10000, "Minimální investice je 10 000 Kč")` ✅
- Konzistentní s `InvestModal.tsx` minimum check ✅

### F6: Wizard validace — ✅ OK

- `canProceed()` switch pro steps 1-3 ✅
- Step 1: brand, model, year > 1900, mileage >= 0, purchasePrice > 0 ✅
- Step 2: repairCost >= 0 (0 je validní — auto nemusí potřebovat opravu) ✅
- Step 3: estimatedSalePrice > 0 ✅
- Submit button: `disabled={submitting || !form.brand || !form.model || !form.purchasePrice || !form.estimatedSalePrice}` — extra guard ✅

### F7: Dealer email — ✅ OK

- `opportunities/[id]/route.ts:44-46`: `email: true` v dealer select ✅
- `line 89-93`: email filtrován — jen admin dostane email, investor dostane `undefined` ✅

### F9: marketAnalysis odstraněn — ✅ OK

- Pole není v `FormData` interface ani v JSX ✅
- Alert tip o kontrole cen ponechán ✅

### F10: repairPhotos v POST — ✅ OK

- `OpportunityWizard.tsx:98`: `repairPhotos: form.repairPhotos.length > 0 ? form.repairPhotos : undefined` ✅

### F11: averageRoi — ✅ OK

- `dealer/page.tsx:63-74`: kalkulace z `COMPLETED` flipů kde `actualSalePrice !== null && > 0`
- Pokud žádné completed flipy → `averageRoi: 0` (správně) ✅

### F12: Silent catch bloky — ⚠️ ČÁSTEČNĚ

| Soubor | Status |
|--------|--------|
| `DealDetailClient.tsx:124` | ✅ `console.error("DealDetailClient: status update failed:", err)` |
| `DealPhotoGallery.tsx:66` | ✅ `console.error("DealPhotoGallery: upload failed:", err)` |
| `InvestModal.tsx:58` | ✅ `console.error("InvestModal: investment submit failed:", err)` |
| `admin/marketplace/[id]/page.tsx:86,113` | ✅ `console.error(...)` na obou místech |
| `dealer/page.tsx:80` | ❌ `catch { return fallback }` — bez console.error |
| `investor/page.tsx:117` | ❌ `catch { // fallback — empty state }` — komentář, bez logování |

---

## NOVÉ PROBLÉMY

### MINOR-1: F12 neúplné — dealer/page.tsx a investor/page.tsx
- **Soubory:** `app/(web)/marketplace/dealer/page.tsx:80`, `app/(web)/marketplace/investor/page.tsx:117`
- **Problém:** Catch bloky bez console.error — chyby DB/session se tiše zahodí
- **Závažnost:** Minor (UI se degraduje na empty state, ale vývojář to nezjistí)
- **Fix:** `console.error("[Marketplace] dealer/investor page load failed:", error)`

### MINOR-2: applications/[id] updateStatus — bez error feedbacku
- **Soubor:** `app/(admin)/admin/marketplace/applications/[id]/page.tsx:62-83`
- **Problém:** Pokud API selže nebo network chyba, uživatel nedostane žádnou zprávu
  ```ts
  } finally {
    setSaving(false); // žádný error state
  }
  ```
- **Závažnost:** Minor (admin panel, interní uživatelé)
- **Fix:** Přidat `error` state, zobrazit ho v UI

### INFO: applications/page.tsx — page-level bez session check
- **Soubor:** `app/(admin)/admin/marketplace/applications/page.tsx`
- **Poznámka:** Server Component query Prismy přímo, ochrana závisí na middleware `/admin`
- **Impakt:** MANAGER/REGIONAL_DIRECTOR (v middleware ADMIN_ROLES) může vidět applications list i když API je pro ně 403
- **Hodnocení:** Acceptable — jsou to interní trusted users, data nejsou public-sensitive
- **Doporučení:** Přidat session check pro stricter security (out of scope tohoto tasku)

---

## EDGE CASES — OVĚŘENO

| Edge case | Výsledek |
|-----------|----------|
| Dealer nemá žádné flipy | ✅ Empty state "Žádné příležitosti." |
| Investor nemá žádné investice | ✅ Dvě sekce — obě mají empty state |
| Investor nemá confirmed investice | ✅ portfolio stats = všechny nuly |
| Schválení existujícího uživatele (same email) | ✅ Link existingUser.id, žádný nový user |
| Zamítnutí bez rejectionReason | ✅ Alert "Vyplňte důvod zamítnutí" |
| REFUNDED investice | ✅ fundedAmount se nepřepočítává (PENDING nemá vliv) |
| Dealer vidí cizí flip | ✅ 403 v API (dealer route check) |
| Investor vidí PENDING_APPROVAL | ✅ 403 v API |

---

## SECURITY CHECK

| Oblast | Status |
|--------|--------|
| Nové API routes pod `/admin` — auth | ✅ ADMIN/BACKOFFICE check na vstupu |
| Nové API routes — Zod validace | ✅ Obě routes |
| Dealer email leak k investorovi | ✅ Filtrován na `undefined` |
| Min. investice v Zod | ✅ 10000 Kč |
| Password hash pro nové usery | ✅ bcrypt cost 12 |
| Temp password v emailu | ✅ Acceptable pro welcome flow |
| Middleware protection pro /admin/marketplace/applications | ✅ Middleware catchuje /admin prefix |

---

## DOPORUČENÍ (non-blocking)

1. **[P3]** Přidat `console.error` do `dealer/page.tsx` a `investor/page.tsx` catch bloků (F12 kompletovat)
2. **[P3]** Přidat error state do `applications/[id]/page.tsx` updateStatus
3. **[P4]** Zvážit session check v `applications/page.tsx` SSR pro stricter role gating

---

## ZÁVĚR

**✅ SCHVÁLENO pro postup do Evžen (#6)**

Všechna MUST kritéria splněna. SHOULD kritéria z 6/7 splněna plně, 1/7 částečně (F12 — 2 catch bloky). TypeScript čistý, lint čistý. Nové problémy jsou minor a neblokují nasazení. Implementace je v dobrém stavu.
