# Plán implementace — Marketplace VIP opravy

**Datum:** 2026-04-26
**Autor:** Plánovač
**Na základě:** `plan-marketplace-audit-20260426.md`
**Rozsah:** P0 + P1 bugy (5 fixů), P2 quick fixes (4 fixy), QA nálezy (3 fixy)
**QA vstup:** Kontrolor — předběžný QA audit 2026-04-26

---

## §1 PŘEHLED ZMĚN

| # | Priorita | Popis | Soubory | Odhad |
|---|----------|-------|---------|-------|
| F1 | P0 | Admin Applications UI + API | 4 nové soubory + 1 edit | velký |
| F2 | P0 | PaymentConfirmation Reject flow | 2 edity | malý |
| F3 | P1 | Dealer Dashboard — filtr na vlastní flipy | 1 edit | malý |
| F4 | P1 | Investor Dashboard — vlastní investice | 1 edit | střední |
| F5 | P1 | Min. investice sjednocení (1000→10000) | 1 edit | triviální |
| F6 | P2 | OpportunityWizard step validace | 1 edit | malý |
| F7 | P2 | Admin detail — dealerEmail v API | 1 edit | triviální |
| F8 | P2 | APPROVED status — skip rovnou na FUNDING | 0 (dokumentace) | — |
| F9 | P2 | marketAnalysis field — remove ze wizard | 1 edit | triviální |
| F10 | P2 | repairPhotos chybí v wizard POST (QA) | 1 edit | triviální |
| F11 | P2 | averageRoi placeholder 0 v dealer stats (QA) | 1 edit | malý |
| F12 | P2 | Silent catch bloky — přidat logování (QA) | ~5 editů | malý |

---

## §2 DETAILNÍ PLÁN

### F1: Admin Marketplace Applications (P0)

**Problém:** Admini nemají žádné UI ani API pro správu žádostí o přístup k marketplace. Apply API posílá notifikace s linkem na neexistující stránku.

**Nové soubory:**

#### F1.1: `app/api/admin/marketplace/applications/route.ts`
```
GET /api/admin/marketplace/applications
- Auth: ADMIN, BACKOFFICE
- Query params: status (NEW|CONTACTED|APPROVED|REJECTED|SPAM), search (email/name), page, limit
- Response: { applications, total, page, totalPages }
- Prisma: findMany + count s filtry
```

#### F1.2: `app/api/admin/marketplace/applications/[id]/route.ts`
```
GET /api/admin/marketplace/applications/[id]
- Auth: ADMIN, BACKOFFICE
- Response: { application } s plnými detaily

PUT /api/admin/marketplace/applications/[id]
- Auth: ADMIN, BACKOFFICE
- Body: { status, adminNotes, rejectionReason? }
- Když status=APPROVED:
  1. Aktualizovat application status
  2. Zkontrolovat zda existuje user se stejným emailem
  3. Pokud ne → vytvořit user s role=application.role, status="ACTIVE", vygenerovat heslo
  4. Nastavit application.convertedUserId
  5. Odeslat welcome email s přihlašovacími údaji
  6. Nastavit reviewedById + reviewedAt
- Když status=REJECTED/SPAM:
  1. Aktualizovat status + rejectionReason
  2. Nastavit reviewedById + reviewedAt
```

#### F1.3: `app/(admin)/admin/marketplace/applications/page.tsx`
- Server Component
- Tabulka žádostí s filtry (status tabs: Nové | Kontaktované | Schválené | Zamítnuté | Spam)
- Každý řádek: jméno, email, telefon, role, datum, status badge, link na detail
- Zvýrazněné "NEW" žádosti

#### F1.4: `app/(admin)/admin/marketplace/applications/[id]/page.tsx`
- Server Component pro detail žádosti
- Všechna data: contact, role-specific fields (firma/IČO nebo investment range), zpráva, metadata
- Admin actions: Schválit (→ vytvoří user), Zamítnout, Označit jako Spam, Kontaktovat
- Admin notes textarea
- Pokud convertedUserId existuje → link na uživatele

**Existující edit:**
- `app/(admin)/admin/marketplace/page.tsx` — přidat link "Žádosti o přístup" s badge počtem NEW žádostí

**Vzor:** Použít pattern z `app/api/admin/users/route.ts` pro auth + query.

**Nové Zod schemas (do `lib/validators/marketplace.ts`):**
```ts
export const updateApplicationSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "APPROVED", "REJECTED", "SPAM"]),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const applicationFilterSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

---

### F2: PaymentConfirmation Reject flow (P0)

**Problém:** `PaymentConfirmation.tsx:44` posílá `{ rejected: true }` ale API (`confirmPaymentSchema`) expects `{ paymentReference: string }`.

**Fix — 2 soubory:**

#### F2.1: `lib/validators/marketplace.ts` — rozšířit confirmPaymentSchema
```ts
// Stávající:
export const confirmPaymentSchema = z.object({
  paymentReference: z.string().min(1, "Číslo platby je povinné"),
});

// Nové — discriminated union:
export const confirmPaymentSchema = z.union([
  z.object({
    paymentReference: z.string().min(1, "��íslo platby je povinné"),
    rejected: z.literal(false).optional(),
  }),
  z.object({
    rejected: z.literal(true),
    paymentReference: z.string().optional(),
  }),
]);
```

#### F2.2: `app/api/marketplace/investments/[id]/confirm-payment/route.ts`
Rozšířit PUT handler:
```
Pokud data.rejected === true:
  - Update investment: paymentStatus = "REFUNDED"
  - Nepřepočítávat fundedAmount (PENDING investment nemá vliv)
Jinak (stávající flow):
  - Update investment: paymentStatus = "CONFIRMED", paymentReference
  - Přepočítat fundedAmount, auto-transition FUNDING → FUNDED
```

---

### F3: Dealer Dashboard — filtr na vlastní flipy (P1)

**Problém:** `app/(web)/marketplace/dealer/page.tsx:16` — `prisma.flipOpportunity.findMany()` bez filtru na dealerId.

**Fix — 1 soubor:**

`app/(web)/marketplace/dealer/page.tsx`:
1. Přidat `import { getServerSession } from "next-auth"` a `import { authOptions } from "@/lib/auth"`
2. V `getDealerData()` přidat session:
   ```ts
   const session = await getServerSession(authOptions);
   if (!session?.user?.id) return { stats: {...}, opportunities: [] };
   
   // Pro ADMIN/BACKOFFICE zobrazit vše, pro VERIFIED_DEALER jen svoje
   const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);
   const where: Record<string, unknown> = { status: { not: "CANCELLED" } };
   if (!isAdmin) where.dealerId = session.user.id;
   ```
3. Předat `where` do `findMany`

---

### F4: Investor Dashboard — vlastní investice (P1)

**Problém:** `app/(web)/marketplace/investor/page.tsx` — portfolio stats = globální data, ne investice aktuálního investora.

**Fix — 1 soubor:**

`app/(web)/marketplace/investor/page.tsx`:
1. Přidat session check
2. Nahradit `getOpportunities()` dvěma queries:
   - **Dostupné příležitosti** (FUNDING/APPROVED status) — tyto vidí všichni investoři
   - **Moje investice** — `prisma.investment.findMany({ where: { investorId: session.user.id } })` s include opportunity
3. Portfolio stats počítat z `myInvestments`:
   ```ts
   totalInvested = myInvestments.filter(i => i.paymentStatus === "CONFIRMED").reduce(sum + amount)
   activeInvestments = myInvestments.filter(i => active opportunity status).length
   totalReturns = myInvestments.filter(i => i.paidOutAt).reduce(sum + returnAmount)
   averageRoi = (totalReturns - totalOriginal) / totalOriginal * 100
   ```
4. Pro ADMIN/BACKOFFICE zobrazit globální data (stávající chování)

---

### F5: Min. investice sjednocení (P1)

**Problém:** `createInvestmentSchema.amount.min(1000)` vs `InvestModal` hardcoded 10000.

**Fix — 1 soubor:**

`lib/validators/marketplace.ts`:
```ts
// Změnit:
amount: z.number().int().min(1000, "Minimální investice je 1 000 Kč"),
// Na:
amount: z.number().int().min(10000, "Minimální investice je 10 000 Kč"),
```

---

### F6: OpportunityWizard step validace (P2)

**Problém:** Wizard umožňuje přeskočit kroky bez validace.

**Fix — 1 soubor:**

`components/web/marketplace/OpportunityWizard.tsx`:
Přidat `canProceed` computed pro každý krok:
```ts
const canProceed = () => {
  switch (step) {
    case 1: return form.brand.length > 0 && form.model.length > 0 && form.year > 1900 && form.mileage >= 0 && form.purchasePrice > 0;
    case 2: return form.repairCost >= 0; // repair description optional
    case 3: return form.estimatedSalePrice > 0;
    default: return true;
  }
};
```
Disable "Pokračovat" button: `disabled={!canProceed()}`

---

### F7: Admin detail — dealerEmail v API (P2)

**Problém:** Admin detail page čte `opp.dealer?.email` ale API nevrací email.

**Fix — 1 soubor:**

`app/api/marketplace/opportunities/[id]/route.ts` — přidat `email: true` do dealer select (line 44):
```ts
dealer: {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    companyName: true,
    avatar: true,
    email: true, // ← přidat
  },
},
```

**Poznámka:** Email dealera by měl být viditelný pouze pro ADMIN/BACKOFFICE, ne pro investory. Přidat podmíněné filtrování:
```ts
// V response mappingu:
const dealerData = {
  ...opportunity.dealer,
  email: isAdmin ? opportunity.dealer.email : undefined,
};
```

---

### F8: APPROVED status (P2 — dokumentace)

**Stav:** Approve akce přesouvá přímo do FUNDING (přeskakuje APPROVED). APPROVED status se efektivně nepoužívá. Toto je designové rozhodnutí, ne bug.

**Akce:** Žádná změna kódu. Pouze dokumentace: po approve → FUNDING (investoři hned vidí).

---

### F9: marketAnalysis field — remove ze wizard (P2)

**Problém:** Step 3 sbírá `marketAnalysis` ale nikam se neposílá.

**Fix — 1 soubor:**

`components/web/marketplace/OpportunityWizard.tsx`:
- Odstranit `marketAnalysis` z `FormData` interface a `initialFormData`
- Odstranit Textarea "Analýza trhu" ze Step 3
- Ponechat Alert tip o kontrole cen na Sauto/Bazoš

---

### F10: repairPhotos chybí v wizard POST (P2 — QA nález)

**Problém:** `OpportunityWizard.tsx` sbírá `repairPhotos` v `FormData` ale `handleSubmit` je neposílá v POST body. Wizard nemá funkční foto upload, takže pole je vždy `[]`, ale až se upload implementuje, data by se zahodila.

**Fix — 1 soubor:**

`components/web/marketplace/OpportunityWizard.tsx` — v `handleSubmit` přidat do body:
```ts
repairPhotos: form.repairPhotos.length > 0 ? form.repairPhotos : undefined,
photos: form.photos.length > 0 ? form.photos : undefined,
```

**Poznámka:** Efektivně noop dokud se neimplementuje foto upload, ale opravuje data flow pro budoucnost.

---

### F11: averageRoi placeholder 0 v dealer stats (P2 — QA nález)

**Problém:** `getDealerData()` v `app/(web)/marketplace/dealer/page.tsx:49` vrací `averageRoi: 0` jako hardcoded placeholder. Nepočítá se z dat.

**Fix — 1 soubor:**

`app/(web)/marketplace/dealer/page.tsx` — v `getDealerData()` počítat averageRoi z COMPLETED flipů:
```ts
const completedOpps = opportunities.filter(o => o.status === "COMPLETED" || o.status === "SOLD");
// Výpočet ROI z completed opps kde actualSalePrice existuje (potřeba fetchnout z DB)
// Pro teď: ponechat 0, protože dealer page nemá přístup k actualSalePrice
```

**Poznámka:** Toto vyžaduje rozšíření DB query o `actualSalePrice` field. Nebo alternativně: přesunout stats na API `/api/marketplace/stats` které to už počítá správně pro VERIFIED_DEALER roli. Doporučuji druhý přístup — zavolat `/api/marketplace/stats` místo vlastní kalkulace.

---

### F12: Silent catch bloky — přidat logování (P2 — QA nález)

**Problém:** Několik client komponent má prázdné `catch` bloky bez logování:
- `DealDetailClient.tsx:125` — `handleStatusUpdate` catch empty
- `DealPhotoGallery.tsx:67` — upload catch empty
- `OpportunityWizard.tsx` — implicit (err se zachytí ale ne-log)
- `app/(admin)/admin/marketplace/[id]/page.tsx:86,113` — investments fetch + page load

**Fix — ~5 souborů:**

V každém catch bloku přidat minimálně `console.error`:
```ts
catch (err) {
  console.error("[Marketplace] operace failed:", err);
}
```

Pro client-facing errors: zobrazit toast/alert uživateli (stávající error state pattern kde existuje).

---

## §3 POŘADÍ IMPLEMENTACE

```
Krok 1 (quick fixes — nezávislé):
  F5: Min. investice sjednocení
  F7: dealerEmail v API
  F9: marketAnalysis remove
  F10: repairPhotos do POST body
  F12: Silent catch bloky logování

Krok 2 (dashboard fixes):
  F3: Dealer Dashboard filtr na dealerId
  F4: Investor Dashboard vlastní investice
  F11: averageRoi — použít /api/marketplace/stats místo hardcoded 0

Krok 3 (payment reject):
  F2: PaymentConfirmation Reject flow (schema + API)

Krok 4 (wizard validace):
  F6: OpportunityWizard step validace

Krok 5 (admin applications — největší):
  F1: Admin Applications API + UI (2 API routes + 2 stránky + link z marketplace admin)
```

---

## §4 SOUBORY K EDITACI (celkem)

### Nové soubory (4):
1. `app/api/admin/marketplace/applications/route.ts`
2. `app/api/admin/marketplace/applications/[id]/route.ts`
3. `app/(admin)/admin/marketplace/applications/page.tsx`
4. `app/(admin)/admin/marketplace/applications/[id]/page.tsx`

### Existující edity (12):
1. `lib/validators/marketplace.ts` — confirmPaymentSchema union, applicationSchemas, min investice
2. `app/api/marketplace/investments/[id]/confirm-payment/route.ts` — reject flow
3. `app/api/marketplace/opportunities/[id]/route.ts` — dealer email v select
4. `app/(web)/marketplace/dealer/page.tsx` — session filtr + averageRoi z API
5. `app/(web)/marketplace/investor/page.tsx` — vlastní investice
6. `app/(admin)/admin/marketplace/page.tsx` — link na applications + badge
7. `components/web/marketplace/OpportunityWizard.tsx` — step validace + remove marketAnalysis + repairPhotos v POST
8. `components/web/marketplace/DealDetailClient.tsx` — console.error v catch (F12)
9. `components/web/marketplace/DealPhotoGallery.tsx` — console.error v catch (F12)
10. `app/(admin)/admin/marketplace/[id]/page.tsx` — console.error v catch (F12)
11. `components/web/marketplace/InvestModal.tsx` — console.error v catch (F12)
12. `components/admin/marketplace/PaymentConfirmation.tsx` — (beze změny, API fix stačí)

---

## §5 ACCEPTANCE CRITERIA

### MUST (P0+P1):
- [ ] Admin vidí seznam žádostí na `/admin/marketplace/applications`
- [ ] Admin může schválit žádost → vytvoří se user s příslušnou rolí
- [ ] Admin může zamítnout žádost → status REJECTED
- [ ] PaymentConfirmation Reject button funguje (investment → REFUNDED)
- [ ] Dealer dashboard zobrazuje POUZE vlastní flipy
- [ ] Investor dashboard zobrazuje POUZE vlastní investice v portfolio stats
- [ ] Zod schema `createInvestmentSchema` má min 10000

### SHOULD (P2):
- [ ] OpportunityWizard neumožní přeskočit krok s prázdnými povinnými poli
- [ ] Admin detail zobrazuje email dealera
- [ ] marketAnalysis field odstraněn ze wizard
- [ ] repairPhotos zahrnuty v wizard POST requestu (F10)
- [ ] averageRoi se počítá z reálných dat, ne placeholder 0 (F11)
- [ ] Žádné silent catch bloky — všechny mají console.error (F12)

### STOP THRESHOLDS:
- **STOP-1:** Pokud `prisma migrate dev` failne na tsvector drift → `migrate reset --force` (viz memory)
- **STOP-2:** Pokud admin applications page vyžaduje nový DB model nebo migraci → ESKALUJ (model MarketplaceApplication existuje, žádná migrace by neměla být potřeba)
- **STOP-3:** Pokud edit confirm-payment API rozbije existující confirm flow → ESKALUJ
- **STOP-4:** Max 12 editovaných souborů + 4 nové = 16 souborů celkem. Pokud se blíží 20+ → ESKALUJ

---

## §6 OUT OF SCOPE

Tyto věci se v tomto tasku NEŘEŠÍ:
- OpportunityWizard foto upload (potřebuje Cloudinary setup — separátní task)
- Admin detail přepsání na Server Component (kosmetické, nerozbité)
- Real-time Pusher notifikace
- Stripe integrace
- Email notifikace pro investory/dealery (kromě welcome emailu při approve)
- Testy (separátní task #4)
