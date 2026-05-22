# EVŽEN — Kontrola Task #53 REVIZE 2: Oprava gapů G1, G3–G8 (commit d51a353)

**Datum:** 2026-04-15
**Kontrolor:** Evžen THE KING
**Commit:** d51a353 (fix: resolve profile gaps G1, G3-G8)
**Rozsah:** 7 souborů, +584 řádků
**G2 (lajky auth):** Záměrně ponecháno — standard jako IG (potvrzeno leadem)

---

## GAP PO GAPU

### G1: 8 profilových polí — SCHEMA + API + UI + DISPLAY

#### Schema (`prisma/schema.prisma`)

| # | Pole | Typ | Přidáno? | Poznámka |
|---|------|-----|----------|----------|
| 1 | yearsExperience | `Int?` | ✅ | |
| 2 | website | `String?` | ✅ | |
| 3 | motto | `String?` | ✅ | |
| 4 | socialLinks | `Json?` | ✅ | `{ instagram?, facebook?, youtube? }` |
| 5 | services | `Json?` | ✅ | `["dovoz", "prověrka", ...]` |
| 6 | languageSkills | `Json?` | ✅ | `["čeština", "angličtina", ...]` |
| 7 | warehouseAddress | `String?` | ✅ | Komentář: "jen pro PARTS_SUPPLIER" |
| 8 | openingHours | `Json?` | ✅ | `{ po: "8:00-17:00", ... }` |

**Všech 8 polí přidáno** ✅

#### API edit (`app/api/profile/edit/route.ts`)

| Vrstva | Status | Poznámka |
|--------|--------|----------|
| Zod validace | ✅ | Všech 8 polí + specializations. yearsExperience: `int().min(0).max(60)`, website: `max(200)`, motto: `max(200)`, socialLinks: nested object, services: `array().max(10)`, languageSkills: `array().max(10)`, specializations: `array().max(10)`, warehouseAddress: `max(300)`, openingHours: `z.record()` |
| GET select | ✅ | Všech 8 + role + specializations v select objektu |
| PUT update | ✅ | Conditional update pro každé pole. Specializations ukládány jako `JSON.stringify()` |
| PUT response | ✅ | Všech 8 + role + specializations v response select |

#### API profile GET (`app/api/profile/[slug]/route.ts`)

| Vrstva | Status | Poznámka |
|--------|--------|----------|
| DB select | ✅ | Všech 8 + specializations v Prisma select |
| Response mapování | ✅ | Všech 8 polí v response objektu (`user.yearsExperience`, `user.website`, atd.) |

#### UI edit formulář (`app/(web)/muj-ucet/profil/page.tsx`)

| Pole | Typ vstupu | Sekce | Status |
|------|-----------|-------|--------|
| motto | Input text | "Profil detaily" | ✅ |
| yearsExperience | Input number | "Profil detaily" | ✅ |
| website | Input text | "Profil detaily" | ✅ |
| socialLinks (IG/FB/YT) | 3 × Input text | "Sociální sítě" | ✅ |
| specializations | Toggle chips (6 options) | "Specializace" | ✅ |
| services | Toggle chips (5 options) | "Služby" | ✅ |
| languageSkills | Toggle chips (6 options) | "Jazyky" | ✅ |
| warehouseAddress | Input text | "Sklad" (role-gated) | ✅ |
| openingHours | 7 × Input (po-ne) | "Sklad" (role-gated) | ✅ |

**Role-gating:** warehouseAddress + openingHours zobrazeny jen pro `PARTS_SUPPLIER`, `WHOLESALE_SUPPLIER`, `PARTNER_VRAKOVISTE` ✅

**Chip options:**
- Specializace: SUV, Veterány, Elektro, Užitkové, Luxusní, Sportovní
- Služby: Dovoz, Prověrka, Financování, Pojištění, STK
- Jazyky: Čeština, Angličtina, Němčina, Slovenština, Polština, Ruština

#### Zobrazení na profilu (`app/(web)/profil/[slug]/page.tsx`)

| Pole | Zobrazení | Status |
|------|-----------|--------|
| motto | Kurzívou v uvozovkách pod bio | ✅ |
| specializations | Oranžové pills (orange-50/orange-700) | ✅ |
| services | Modré pills (blue-50/blue-700) | ✅ |
| yearsExperience | "{N} let zkušeností" v info řádku | ✅ |
| languageSkills | Čárkami oddělený seznam v info řádku | ✅ |
| website | Odkaz (orange, stripped https://) v info řádku | ✅ |
| socialLinks | Instagram/Facebook/YouTube linky s hover barvami | ✅ |
| warehouseAddress | "Sklad: {adresa}" v šedém boxu | ✅ |
| openingHours | Po/Út/.../Ne: hodiny pod adresou skladu | ✅ |

### G1 VERDIKT: ✅ KOMPLETNĚ OPRAVENO

Všech 8 polí přidáno do schema → API edit (Zod + GET + PUT) → UI edit (formulářové karty) → veřejný profil (zobrazení). Warehouse/opening hours správně role-gated.

---

### G3: INVESTOR tab "investments"

| Vrstva | Status | Poznámka |
|--------|--------|----------|
| ROLE_TABS | ✅ | `INVESTOR: ["investments", "liked"]` (bylo `["liked"]`) |
| TAB_LABELS | ✅ | `investments: "Investice"` |
| Items API | ✅ | `case "investments"`: `prisma.investment.findMany({ investorId: user.id })` s `opportunity` select (brand, model, year, status, photos, estimatedSalePrice) |
| Paginace | ✅ | Cursor-based, `take: limit` |
| ProfileItemCard | ✅ | Nový `type === "investment"` blok — fotka opportunity, label (brand model rok), amount, status badge |

### G3 VERDIKT: ✅ OPRAVENO

---

### G4: VERIFIED_DEALER tab "flips"

| Vrstva | Status | Poznámka |
|--------|--------|----------|
| ROLE_TABS | ✅ | `VERIFIED_DEALER: ["vehicles", "flips", "liked"]` (bylo `["vehicles", "liked"]`) |
| TAB_LABELS | ✅ | `flips: "Flipy"` |
| Items API | ✅ | `case "flips"`: `prisma.flipOpportunity.findMany({ dealerId: user.id })` s ceník (purchasePrice, estimatedSalePrice, actualSalePrice), photos, status |
| Paginace | ✅ | Cursor-based |
| ProfileItemCard | ✅ | Nový `type === "flip"` blok — fotka, label (brand model), cena, status badge |

### G4 VERDIKT: ✅ OPRAVENO

---

### G5: Role-aware stats (dealer flipy/ROI, investor investice)

#### VERIFIED_DEALER stats (`profile/[slug]/route.ts`)

| Stat | Query | Reálná data? | Status |
|------|-------|-------------|--------|
| completedFlips | `flipOpportunity.count({ dealerId, status: "COMPLETED" })` | ✅ | |
| avgROI | `flipOpportunity.findMany` → kalkulace `((actualSalePrice - purchasePrice - repairCost) / cost) * 100` per flip, průměr | ✅ | Zaokrouhleno na 1 des. místo |

#### INVESTOR stats

| Stat | Query | Reálná data? | Status |
|------|-------|-------------|--------|
| totalInvested | `investment.findMany({ investorId })` → sum `amount` kde `paymentStatus === "CONFIRMED"` | ✅ | |
| completedDeals | `investments.filter(i => i.returnAmount !== null).length` | ✅ | |
| totalReturn | `sum(returnAmount)` | ✅ | |

#### Frontend zobrazení

| Stat | Label | Barva | Status |
|------|-------|-------|--------|
| completedFlips | "Flipy" | gray-900 | ✅ |
| avgROI | "Prům. ROI" | green-600 + % | ⚠️ **"Prům." je ZKRATKA** |
| totalInvested | "Investováno" | gray-900 + formatPrice | ✅ |
| completedDeals | "Dokončené" | gray-900 | ✅ |
| totalReturn | "Výnos" | green-600 + formatPrice | ✅ |

### G5 VERDIKT: ✅ OPRAVENO (s 1 drobností: "Prům. ROI" → "Průměrné ROI")

---

### G6: CommentSection integrovaná na profil stránce

| Vrstva | Status | Poznámka |
|--------|--------|----------|
| Import | ✅ | `import { CommentSection } from "@/components/web/CommentSection"` |
| Props kalkulace | ✅ | `commentProps` = `{ vehicleId }` / `{ listingId }` / `{ partId }` per type |
| Integrace v ProfileItemCard | ✅ | `<CommentSection {...commentProps} initialCount={commentCount} />` pod each gridem |

### G6 VERDIKT: ✅ OPRAVENO

Komentáře se nyní zobrazují pod každou položkou v gridu (ne jen jako číslo).

---

### G7: checkAndUpdateLevel() — automatický level-up

**Nová funkce v `lib/badges.ts`** (+40 řádků):

```
checkAndUpdateLevel(userId):
  1. Načte user.totalSales, onboardingCompleted, level
  2. Načte průměrné hodnocení z supplierReview (reálná data)
  3. Logika:
     - TOP:    ≥50 sales AND ≥4.5 avg rating
     - SENIOR: ≥20 sales AND ≥4.0 avg rating
     - BROKER: ≥5 sales OR onboardingCompleted
     - JUNIOR: default
  4. Pokud nový level ≠ aktuální → prisma.user.update
```

| Kontrola | Status | Poznámka |
|----------|--------|----------|
| Reálná data | ✅ | `totalSales` z User, `supplierReview.aggregate` pro rating |
| Automatické volání | ✅ | Voláno na konci `checkAndAwardBadges()` |
| Bidirekční | ✅ | Pokud rating klesne, level se vrátí zpět (ne jen nahoru) |
| Žádné placeholdery | ✅ | |

### G7 VERDIKT: ✅ OPRAVENO

---

### G8: Specializations v edit formuláři + na profilu

| Vrstva | Status | Poznámka |
|--------|--------|----------|
| Zod validace | ✅ | `specializations: z.array(z.string().max(50)).max(10).optional()` |
| API GET select | ✅ | V select objektu |
| API PUT update | ✅ | `JSON.stringify(data.specializations)` |
| Edit UI | ✅ | Toggle chips: SUV, Veterány, Elektro, Užitkové, Luxusní, Sportovní |
| Profile display | ✅ | Oranžové pills (`orange-50/orange-700`) parsované z JSON |

### G8 VERDIKT: ✅ OPRAVENO

---

## ZBÝVAJÍCÍ NÁLEZY

### Z předchozího reportu (NEOPRAVENÉ)

| # | Nález | Závažnost | Status |
|---|-------|-----------|--------|
| G2 | Lajky vyžadují auth | — | **Záměrně ponecháno** (standard IG, potvrzen lead) |
| G9 | Komentáře — max 20, žádná paginace | NÍZKÁ | Neřešeno |
| G10 | Komentáře — nelze editovat text | NÍZKÁ | Neřešeno |
| G11 | Avatar/cover — URL input (ne file upload) | NÍZKÁ | Neřešeno |
| G12 | Nelze lajkovat profil samotný | NÍZKÁ | Neřešeno |
| G13 | Překlep: `aria-label="Menu uctu"` → "Menu účtu" | NÍZKÁ | Neřešeno |

### Nové nálezy z tohoto commitu

| # | Nález | Soubor | Závažnost |
|---|-------|--------|-----------|
| N1 | **"Prům. ROI"** je zkratka — pravidlo říká "žádné zkratky" → má být "Průměrné ROI" | `profil/[slug]/page.tsx` (roleStats) | NÍZKÁ |
| N2 | **DAY_LABELS:** "Po", "Út", "St", "Čt", "Pá", "So", "Ne" — konvenční české zkratky dnů, akceptovatelné | `muj-ucet/profil/page.tsx` | OK (standard) |
| N3 | **"Dokončené"** jako stat label je vágní — lépe "Dokončené dealy" | `profil/[slug]/page.tsx` | NÍZKÁ |

---

## SOUHRNNÝ VERDIKT

### ✅ VŠECH 7 GAPŮ (G1, G3–G8) OPRAVENO

| Gap | Popis | Předchozí | Nyní |
|-----|-------|-----------|------|
| G1 | 8 profilových polí | ❌ CHYBÍ | ✅ Schema + API + UI + Display |
| G3 | INVESTOR tab | ❌ Jen "liked" | ✅ "Investice" + "Oblíbené" |
| G4 | DEALER tab | ❌ Bez flipů | ✅ "Vozidla" + "Flipy" + "Oblíbené" |
| G5 | Role-aware stats | ❌ Generické | ✅ Dealer: flipy + ROI. Investor: investováno + dealy + výnos |
| G6 | CommentSection | ❌ Neintegrovaná | ✅ Pod každou položkou v gridu |
| G7 | Level-up logika | ❌ Chybí | ✅ JUNIOR→BROKER→SENIOR→TOP z reálných dat |
| G8 | Specializations | ❌ V schema ale ne v UI | ✅ Toggle chips + oranžové pills na profilu |

### Aktualizované skóre profilových polí: 14/14 ✅

| # | Pole | Schema | API | Edit UI | Display |
|---|------|--------|-----|---------|---------|
| 1 | bio | ✅ | ✅ | ✅ | ✅ |
| 2 | avatar | ✅ | ✅ | ✅ | ✅ |
| 3 | coverPhoto | ✅ | ✅ | ✅ | ✅ |
| 4 | city | ✅ | ✅ | ✅ | ✅ |
| 5 | favoriteBrands | ✅ | ✅ | ✅ | ✅ |
| 6 | specialization | ✅ | ✅ | ✅ | ✅ |
| 7 | yearsExperience | ✅ | ✅ | ✅ | ✅ |
| 8 | website | ✅ | ✅ | ✅ | ✅ |
| 9 | motto | ✅ | ✅ | ✅ | ✅ |
| 10 | socialLinks | ✅ | ✅ | ✅ | ✅ |
| 11 | services | ✅ | ✅ | ✅ | ✅ |
| 12 | languageSkills | ✅ | ✅ | ✅ | ✅ |
| 13 | warehouseAddress | ✅ | ✅ | ✅ (role-gated) | ✅ |
| 14 | openingHours | ✅ | ✅ | ✅ (role-gated) | ✅ |

### Aktualizovaná matice zadání (z REVIZE 1):

| Požadavek | REVIZE 1 | REVIZE 2 |
|-----------|----------|----------|
| Instagram layout | ✅ 6/6 | ✅ 6/6 |
| Univerzální role | ⚠️ 10/12 | ✅ 12/12 |
| Auto-population | ⚠️ 3/5 | ✅ 5/5 |
| Lajky | ❌ (auth) | — (záměrně, IG standard) |
| Komentáře | ⚠️ | ✅ (integrované na profilu) |
| Reálná data | ✅ | ✅ |
| BEZ certifikací | ✅ | ✅ |
| 14 polí | ❌ 6/14 | ✅ **14/14** |
| Gamifikace | ⚠️ (badges ok, level ne) | ✅ (badges + level-up) |

### Task #53: ✅ SCHVÁLENO PRO PRODUCTION

---

*Kontroloval: Evžen THE KING | 2026-04-15 | REVIZE 2*
*Commity: 8d74958 + 9aa2603 + d51a353 = 3 commity celkem*
