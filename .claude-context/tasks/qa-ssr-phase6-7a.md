# QA Report: SSR migrace Fáze 6 + 7A

**Datum:** 2026-05-07  
**Reviewer:** kontrolor  
**Commity:** `0d14f0e` (Phase 6) + `3d72f7c` (Phase 7A)  
**Rozsah:** 15 souborů — 5 Phase 6 stránek + 10 Phase 7A stránek + 4 nové client islands

---

## A) Simplify kontrola

✅ **ČISTÝ REFACTOR — obě fáze**

**Phase 6:**
- Každá SSR page je tenký wrapper (6-24 řádků) — logika v client islands
- `sledovani/[token]` — 100% SSR bez client component (správně — pure read-only)
- `prezentace` — minimální wrapper (15 řádků) s metadata + OG tags
- Admin pages (`team`, `reviews`) mají `export const dynamic = "force-dynamic"` — správné pro admin CRUD
- Žádné duplicity, přímočará architektura

**Phase 7A:**
- 8 PWA step wrapper pages — jednoduché odebrání `"use client"` (2 řádky změna každá)
- 2 success pages — přechod z `useSearchParams` na `async searchParams` prop (Next.js 15)
- `quick/success` — plný SSR bez klientské komponenty (read-only obsah s vehicleId)

---

## B) Debug kontrola

**npm run build:** ✅ exit 0, 0 errors  
**npm run lint:** ✅ 0 errors, 691 warnings (ext. deps, žádné v nových souborech)

---

## C) Reverzní kontrola

### Phase 6 — žádný "use client" na page.tsx (5/5)

| Stránka | "use client"? | Prisma? | Auth? | Metadata? |
|---------|--------------|---------|-------|-----------|
| `sledovani/[token]/page.tsx` | ✅ NE | ✅ | — (guest) | ✅ |
| `profil/setup/page.tsx` | ✅ NE | — | ✅ redirect | ✅ + robots noindex |
| `prezentace/page.tsx` | ✅ NE | — | — | ✅ + OG |
| `admin/team/page.tsx` | ✅ NE | ✅ force-dynamic | — (middleware) | — |
| `admin/reviews/page.tsx` | ✅ NE | ✅ force-dynamic | — (middleware) | — |

### Phase 6 — nové client islands mají "use client" (4/4)

| Komponenta | "use client"? |
|-----------|--------------|
| `ProfileSetupWizard.tsx` | ✅ |
| `PrezentacePage.tsx` | ✅ |
| `TeamManager.tsx` | ✅ |
| `ReviewsManager.tsx` | ✅ |

### Phase 6 — Date serializace

| Stránka | Date handling |
|---------|--------------|
| `sledovani/[token]` | Server-side formátování v JSX, není předáno do client | ✅ |
| `admin/team` | Žádné Date pole v serialized (createdAt vynecháno) | ✅ |
| `admin/reviews` | `r.createdAt.toISOString()` → ReviewsManager | ✅ |

### Phase 7A — žádný "use client" na page.tsx (10/10)

| Skupina | Soubory | Status |
|---------|---------|--------|
| Step wrappers (vin, contact, inspection, photos, details, pricing, equipment, review) | 8x | ✅ 0/8 má "use client" |
| Success pages (new/success, quick/success) | 2x | ✅ 0/2 má "use client" |

### Phase 7A — Next.js 15 searchParams pattern

Obě success pages správně používají `async` + `await searchParams`:
```tsx
searchParams: Promise<Record<string, string>>
const params = await searchParams;
```
✅ Správný pattern (stejný jako Phase 4).

### Phase 7A — Step wrappers

Všech 8 step wrapper stránek je tenkých wrapperů bez dat — jen obalují client step komponenty (`VinStep`, `ContactStep` atd.) v `StepPageGuard`. Správný pattern — guard a step jsou client, wrapper je server.

---

## Výsledek

✅ **SCHVÁLENO — všechna kritéria splněna.**

- Phase 6: 5/5 stránek bez "use client", 4/4 client islands správně označeny, Date serializace správná
- Phase 7A: 10/10 stránek bez "use client", Next.js 15 pattern dodržen
- Build + lint: 0 errors
