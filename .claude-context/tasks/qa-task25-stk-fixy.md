# QA Report — Task #25: STK fixy

**Datum:** 2026-05-22  
**Commit:** e6d841f  
**Výsledek: FAIL ❌ — StkReviewExtras vytvořena ale NEintegrována**

---

## 1. KRITICKÝ PROBLÉM — Komponenta nepoužita

`StkReviewExtras.tsx` existuje ale **není importována nikde** v codebase:

```bash
grep -r "StkReviewExtras" --include="*.tsx"
# Výsledek: jen definice v StkReviewExtras.tsx, žádný import
```

Chybí integrace na 2 místech:

### a) `ServisReviewSection` nepřijímá STK pole

`app/(web)/stk/[slug]/page.tsx:176` předává do `ServisReviewSection` pouze `servisId`, `servisName`, `initialReviews`, `totalReviews` — žádná informace o STK kategorii, žádné STK extra pole.

```tsx
<ServisReviewSection
  servisId={servis.id}
  servisName={servis.name}
  initialReviews={reviews}
  totalReviews={servis.reviewCount}
  // CHYBÍ: isStk={true} nebo categories={servis.categories}
/>
```

`ServisReviewSection` sama neobsahuje žádnou zmínku o `StkReviewExtras`, `ratingWaitTime`, ani `ratingFairness`.

### b) POST API nepřijímá STK pole

`app/api/autoservisy/[id]/reviews/route.ts` — grep na `ratingWaitTime`, `ratingFairness`, `passedInspection` vrací **0 výsledků**. Zod schema v API endpoint tato pole neobsahuje → při odeslání by byla ignorována.

**Důsledek:** DB sloupce existují (migrace #24), UI komponenta existuje, ale uživatel nemůže STK hodnocení podat — formulář pole nezobrazuje a API je neukládá.

---

## 2. Simplify kontrola

### Dead code removal ✅

`isStk` variable odstraněna ✅

```tsx
// PŘED:
const isStk = servis.categories.includes("stk-emise"); // vždy true
// ...
{isStk && (<StkInfoCard ...

// PO:
{(<StkInfoCard ...  // StkInfoCard vždy rendered — korektní
```

Poznámka: `{( <StkInfoCard ... /> )}` jsou redundantní závorky v JSX výrazu — funguje správně, jen kosmeticky zbytečné. Není bug.

### StkReviewExtras.tsx — kvalita kódu

Komponenta samotná je dobře napsána:
- `ratingWaitTime` a `ratingFairness`: select 5→1 s českými popisky ✅
- `passedInspection`: 3 radio options (true/false/null) ✅  
- `onChange(field, value)` callback API — čisté rozhraní ✅
- `"use client"` — nutné pro event handlers ✅

---

## 3. Debug kontrola

**Lint:** 0 errors, 0 warnings ✅

---

## 4. Reverzní kontrola vs. plán #21

| Požadavek | Status | Poznámka |
|---|---|---|
| `StkReviewExtras.tsx` vytvořen | ✅ | 74 řádků, správná UI |
| `StkReviewExtras` integrován do review formu | ❌ | Nepoužito |
| POST API ukládá ratingWaitTime/ratingFairness/passedInspection | ❌ | API Zod bez STK polí |
| `isStk` dead variable odstraněna | ✅ | |

---

## Fix

1. **`ServisReviewSection`** — přidat prop `isStk?: boolean`, podmíněně renderovat `<StkReviewExtras>`, zahrnout hodnoty do submit payload.
2. **`POST /api/autoservisy/[id]/reviews`** — přidat do Zod schema:
   ```ts
   ratingWaitTime: z.number().int().min(1).max(5).optional().nullable(),
   ratingFairness: z.number().int().min(1).max(5).optional().nullable(),
   passedInspection: z.boolean().optional().nullable(),
   ```
3. **`stk/[slug]/page.tsx`** — předat `isStk={true}` do `ServisReviewSection` (nebo `categories={servis.categories}`).

---

## Závěr

Dead code cleanup správný. `StkReviewExtras` komponenta dobře implementována, ale neintegrována — feature je stále nefunkční. Acceptance criterion "Recenze STK mají extra pole" není splněno.
