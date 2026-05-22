# Evžen Review — Fáze 3 Batch A (D15, D16, D11, D13)

**Datum:** 2026-04-11
**Reviewer:** Evžen THE KING
**Scope:** 4 features + 3 bug fixy (7 commitů)

---

## VERDIKT: ✅ SCHVÁLENO — Všechny 4 features odpovídají plánům, 3 fixy jsou korektní

---

## D15 — Otevírací doba editor (commit e4aa359)

**Plán:** `plan-D15-opening-hours-editor.md` | **Soubory:** 3/3 ✅

| # | AC | Verdikt | Kde |
|---|---|---|---|
| 1 | 7 řádků (Po-Ne), checkbox + time inputy | ✅ | `OpeningHoursEditor.tsx:43-72` — DAYS array, checkbox, input type="time" |
| 2 | Default Po-Pá 08:00-17:00, So-Ne Zavřeno | ✅ | `OpeningHoursEditor.tsx:88-89` — parseHours defaults |
| 3 | "Kopírovat pondělí na Út-Pá" | ✅ | `OpeningHoursEditor.tsx:29-38` — copyToWeekdays |
| 4 | Uložit profil → DB | ✅ | `api/partner/profile/route.ts:66` — `openingHours: body.openingHours !== undefined ? ...` |
| 5 | Public profil rendering | ✅ | Existující `/bazar/[slug]` (nedotčeno, kompatibilní JSON formát) |
| 6 | Edit → save roundtrip | ✅ | parseHours + serializeHours + form state loading |
| 7 | Robust parsing (try/catch) | ✅ | `OpeningHoursEditor.tsx:94-111` |

**Poznámka:** Plán specifikoval `!== undefined` check (ne `??`) pro openingHours — implementováno přesně dle plánu.

---

## D16 — PDF dokumenty (commit a5592a6 + fix e1fa2ad)

**Plán:** `plan-D16-pdf-partner-orders.md` | **Soubory:** 3/3 + 1 fix ✅

| # | AC | Verdikt | Kde |
|---|---|---|---|
| 1 | 2 tlačítka: Dodaci list + Potvrzeni objednavky | ✅ | `partner/orders/[id]/page.tsx:233-246` |
| 2 | Kliknutí stáhne PDF (attachment) | ✅ | downloadPdf → blob → URL.createObjectURL → click |
| 3 | Dodací list: číslo, datum, dodavatel, odběratel, tabulka, cena | ✅ | `lib/pdf/partner-documents.ts` — generateDeliveryNote |
| 4 | Potvrzení: + platba + tracking | ✅ | generateOrderConfirmation extends s paymentMethod + trackingNumber |
| 5 | A4 layout + CarMakler branding | ✅ | jsPDF format: "a4" + addHeader "CARMAKLER" |
| 6 | Ownership check (supplier → své items, admin → vše) | ✅ | `pdf/route.ts:39-43` — supplierItems filter + isAdmin |
| 7 | Non-supplier → 403 | ✅ | `pdf/route.ts:41-43` |

**Fix e1fa2ad:** Opravil shipping v total cena pro non-admin. Původní kód měl redundantní `isAdmin` ternary uvnitř non-admin větve (`isAdmin ? order.shippingPrice : 0` — vždy 0). Fix: `itemsTotal + order.shippingPrice`. Korektní.

---

## D11 — Fulltext Search (commit b75a2c8 + fix f383bdc)

**Plán:** `plan-D11-fulltext-search.md` | **Soubory:** 8/8 + 1 fix ✅

| # | AC | Verdikt | Kde |
|---|---|---|---|
| 1 | BAZAR overlay: vehicles (brand, model, VIN) + leads (name, phone) | ✅ | `api/partner/search/route.ts:24-52` |
| 2 | VRAKOVISTE overlay: parts (name, OEM, category) + orders (orderNumber) | ✅ | `api/partner/search/route.ts:53-78` |
| 3 | PWA-Parts search button v SupplierTopBar | ✅ | `SupplierTopBar.tsx` — SearchOverlay + button |
| 4 | Klik naviguje na detail | ✅ | SearchOverlay `router.push(path)` |
| 5 | Lokální search /partner/parts | ✅ | `partner/parts/page.tsx:39-81` — search state + debounce + `?q=` |
| 6 | Lokální search /partner/vehicles | ✅ | `partner/vehicles/page.tsx:49-94` — same pattern |
| 7 | Debounce 300ms, min 2 znaky | ✅ | `SearchOverlay.tsx:78,90` |
| 8 | Loading spinner | ✅ | `SearchOverlay.tsx:118` — border-orange-500 animate-spin |
| 9 | "Žádné výsledky" empty state | ✅ | `SearchOverlay.tsx:126-128` |
| 10 | Backdrop click zavře | ✅ | `SearchOverlay.tsx:100` — onClick={onClose} |

**ESC key:** Plán zmiňuje "ESC / backdrop click". Implementace má jen backdrop. Existující `GlobalSearch.tsx` (reference) také nemá ESC handler — konzistentní pattern. Non-blocker.

**Fix f383bdc:** Rozšířil `PARTNER_ROLES` v search route o `PARTS_SUPPLIER` + `WHOLESALE_SUPPLIER`. Bez fixu by supplier role nedostaly 403, ale ani výsledky (search API by je odmítnul). Korektní.

---

## D13 — Dashboard Charts (commit 71785f9 + fix 8df2030)

**Plán:** `plan-D13-dashboard-charts.md` | **Soubory:** 5/5 + 1 fix ✅

| # | AC | Verdikt | Kde |
|---|---|---|---|
| 1 | RevenueChart (tržby po měsících) | ✅ | `stats/page.tsx:165` + `RevenueChart.tsx` — AreaChart, orange #F97316 |
| 2 | OrdersChart (prodeje/objednávky) | ✅ | `stats/page.tsx:171-172` + `OrdersChart.tsx` — BarChart, dynamic label |
| 3 | BAZAR + VRAKOVISTE branching | ✅ | `charts/route.ts:20-82` — raw SQL s date_trunc per role |
| 4 | Loading skeleton | ✅ | `stats/page.tsx:180` — animate-pulse divs |
| 5 | Tooltip CZK formát | ✅ | `RevenueChart.tsx:22` — cs-CZ locale |
| 6 | Responsive 1/2 col | ✅ | `stats/page.tsx:160` — grid-cols-1 lg:grid-cols-2 |
| 7 | PWA-Parts mini graf | ✅ | `SupplierStats.tsx:86-89` — RevenueChart height=120 |
| 8 | Prázdná data → nuly | ✅ | `charts/route.ts:120-127` — buildMonthlyData fills missing months |

**Fix 8df2030:** Stejný pattern jako D11 fix — rozšířil `PARTNER_ROLES` o `PARTS_SUPPLIER` + `WHOLESALE_SUPPLIER`. Korektní.

---

## Souhrn fixů (pattern)

Všechny 3 fixy (f383bdc, 8df2030, e1fa2ad) řeší validní bugy:
- **f383bdc + 8df2030:** Nové partner API routes měly příliš restriktivní PARTNER_ROLES (jen BAZAR + VRAKOVISTE), nezahrnovaly supplier roles. Supplier by dostal 403 na search a charts.
- **e1fa2ad:** Logická chyba v PDF total price — shipping nebyl započítán pro non-admin suppliery.

---

## Celkový souhrn

| Feature | AC splnění | Soubory | Fixů | Verdikt |
|---|---|---|---|---|
| D15 Opening Hours | 7/7 ✅ | 3/3 | 0 | ✅ |
| D16 PDF Documents | 7/7 ✅ | 3/3 | 1 | ✅ |
| D11 Fulltext Search | 10/10 ✅ | 8/8 | 1 | ✅ |
| D13 Dashboard Charts | 8/8 ✅ | 5/5 | 1 | ✅ |
| **CELKEM** | **32/32 ✅** | **19/19** | **3** | **✅ SCHVÁLENO** |

### Minor observations (non-blockers)
1. ESC key handler chybí v SearchOverlay — konzistentní s existujícím GlobalSearch pattern
2. PDF texty bez diakritiky (jsPDF limitation) — vědomé rozhodnutí dle plánu §5 STOP-1

### ✅ SCHVÁLENO — Fáze 3 Batch A kompletní, pipeline pokračuje
