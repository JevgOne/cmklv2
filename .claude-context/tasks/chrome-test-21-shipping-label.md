# Chrome Browser Test — Task #21 ShippingLabelCard + Mark Shipped
**Datum:** 2026-04-06  
**Tester:** TEST-CHROME agent  
**Commit:** db0d127  
**Playwright:** headed Chromium 1280×900  
**Supplier login:** dodavatel@vrakoviste.cz / heslo123

---

## Výsledek: ✅ PASS — ShippingLabelCard funguje správně

---

## Test data setup

Seed data neměl objednávky s `shippingLabelUrl` (Stripe webhook v dev modu nefunguje).  
Ručně nastaveno přes Prisma:

| Objednávka | Typ | Účel |
|-----------|-----|------|
| OBJ-260320-X9Y8Z | PPL, CONFIRMED, `shippingLabelUrl` + `trackingNumber: DRY-PPL-TEST-9876` | Testy variant 4+5 (DRY-RUN) + mark shipped |
| TEST-PICKUP-001 | PICKUP, CONFIRMED, bez label | Test variant 1 (PICKUP) |

---

## Scenario 1 — /parts/orders tabs + K odeslání filter

| Test | Status | Detail |
|------|--------|--------|
| H1 "Objednávky" viditelný | ✅ | OK |
| Tab "Vše" viditelný | ✅ | OK |
| Tab "K odeslání" viditelný | ✅ | OK |
| Tab "Aktivní" viditelný | ✅ | OK |
| Tab "Dokončené" viditelný | ✅ | OK |
| Klik na "K odeslání" → filtruje | ✅ | 1 objednávka (OBJ-260320-X9Y8Z) |
| OrderCard badge **"Štítek připraven"** | ✅ | Oranžový badge na kartě |
| OrderCard badge pro PICKUP | ✅ | Bez badge (správně — PICKUP nemá label) |

**Screenshot K odeslání tab:**
- Petr Kupující, #CMNLS9ES, Turbodmychadlo, PPL, 16 668 Kč, badge "Štítek připraven" ✅

---

## Scenario 2a — ShippingLabelCard variant 4+5 (DRY-RUN happy path)

Objednávka: OBJ-260320-X9Y8Z (PPL, `shippingLabelUrl` nastavena, tracking `DRY-PPL-TEST-9876`)

| Test | Status | Detail |
|------|--------|--------|
| Order detail se načte | ✅ | H1 "Objednávka", badge "Potvrzena" |
| Order number #OBJ-260320-X9Y8Z | ✅ | Viditelný |
| ShippingLabelCard heading **"K odeslání"** | ✅ | Variant 4 aktivní |
| **DRY-RUN overlay banner** | ✅ | "⚠️ DRY-RUN režim — Štítek je placeholder..." |
| DRY-RUN vysvětlení API klíče | ✅ | Text o .env klíčích viditelný |
| **"🖨️ Stáhnout PDF štítek"** button | ✅ | Plný text, ne zkratka |
| **"✅ Označit jako odesláno"** button | ✅ | Plný text, ne zkratka |
| Carrier badge **PPL** | ✅ | Viditelný v kartě |
| Tracking number **DRY-PPL-TEST-9876** | ✅ | Viditelný v kartě |
| Adresa doručení | ✅ | Petr Kupující, Vinohradská 42, 12000 Praha 2 |

---

## Scenario 2b — ShippingLabelCard variant 1 (PICKUP)

Objednávka: TEST-PICKUP-001 (PICKUP, CONFIRMED)

| Test | Status | Detail |
|------|--------|--------|
| Order detail se načte | ✅ | H1 "Objednávka", badge "Potvrzena" |
| ShippingLabelCard heading **"Osobní odběr"** | ✅ | Variant 1 PICKUP aktivní |
| Info text o vyzvednutí | ✅ | "Zákazník si díly vyzvedne osobně..." |
| **"✅ Označit jako vyzvednuto"** button | ✅ | Plný text, ne zkratka, → DELIVERED |
| ❌ "Stáhnout PDF štítek" CHYBÍ | ✅ | Správně — PICKUP nemá PDF label |

---

## Scenario 3 — Mark shipped flow

| Krok | Status | Detail |
|------|--------|--------|
| Klik "Označit jako odesláno" | ✅ | Click funguje |
| **window.confirm dialog** se objeví | ✅ | Browser native confirm dialog |
| Dialog type = "confirm" | ✅ | `dialog.type() === "confirm"` |
| Dialog zpráva | ✅ | "Opravdu označit jako odesláno?" |
| Dialog potvrzen → API call | ✅ | `PUT /api/orders/[id]/status { status: "SHIPPED" }` |
| Button zmizí po potvrzení | ✅ | "Označit jako odesláno" button gone |
| **Varianta 2 "Odesláno"** se zobrazí | ✅ | ShippingLabelCard přepne na variant 2 |
| Žádná emailová notifikace | ✅ | API code verifikován — žádné `sendEmail()` volání |

**Verifikace API (kód):** `/api/orders/[id]/status/route.ts` — při `status = "SHIPPED"`:
```
updateData.shippedAt = new Date();
// NO sendEmail() call ✅
```

---

## Scenario 4 — No regression

| Stránka | Status | Detail |
|---------|--------|--------|
| `/parts/my` — Moje díly | ✅ | H1 "Moje díly" viditelný |
| `/parts/new` — 3-krokový wizard | ✅ | Step 1 "Fotky dílu" viditelný, 3 kroky v progress baru |
| `/parts/orders` — seznam | ✅ | H1 "Objednávky" viditelný, 2 karty |

---

## Console errors

| Error | Původ | Dopad |
|-------|-------|-------|
| `[next-auth][CLIENT_FETCH_ERROR]` | Pre-existing dev-mode issue | Žádný — session se načte |
| `404 (Not Found)` | Pre-existing (resource z jiného testu) | Žádný |

**Tyto chyby jsou pre-existing, nesouvisejí s task #21.**

---

## Vizuální přehled (ze screenshots)

### /parts/orders — K odeslání tab
```
┌──────────────────────────────────────────────────────┐
│ Petr Kupující  [Potvrzena] [🏷️ Štítek připraven]  5.4│
│ #CMNLS9ES                                             │
│ Turbodmychadlo                                        │
│ PPL                                          16 668 Kč│
└──────────────────────────────────────────────────────┘
```

### ShippingLabelCard — DRY-RUN (variant 4+5)
```
┌──────────────────────────────────────────────────────┐
│ 🏷️ K odeslání                                        │
│    Stáhni PDF štítek, přilepit na krabici...         │
│ ┌─ ⚠️ DRY-RUN režim ────────────────────────────────┐│
│ │ Štítek je placeholder (není skutečná zásilka).     ││
│ │ Pro produkční provoz nastav API klíče v .env.      ││
│ └────────────────────────────────────────────────────┘│
│ Dopravce          [PPL]                              │
│ Tracking          DRY-PPL-TEST-9876                  │
│ 📍 ADRESA DORUČENÍ                                   │
│    Petr Kupující                                     │
│    Vinohradská 42, 12000 Praha 2                     │
│ ┌──────────────────────────────────────────────────┐ │
│ │         🖨️ Stáhnout PDF štítek                   │ │
│ └──────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────┐ │
│ │         ✅ Označit jako odesláno                 │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### ShippingLabelCard — PICKUP (variant 1)
```
┌──────────────────────────────────────────────────────┐
│ 📦 Osobní odběr                                      │
│    Zákazník si díly vyzvedne osobně. Žádný štítek.  │
│ ┌──────────────────────────────────────────────────┐ │
│ │         ✅ Označit jako vyzvednuto               │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## Celkové skóre

| Scenario | Pass | Fail |
|----------|------|------|
| S1 — Orders list + K odeslání tab | 8 | 0 |
| S2a — DRY-RUN variant (4+5) | 10 | 0 |
| S2b — PICKUP variant (1) | 5 | 0 |
| S3 — Mark shipped flow | 7 | 0 |
| S4 — No regression | 3 | 0 |
| **CELKEM** | **33** | **0** |

---

## Závěr

**Task #21 ShippingLabelCard — ✅ PASS**

Všechny 3 testované varianty ShippingLabelCard fungují správně:
- **Variant 1 (PICKUP)**: "Označit jako vyzvednuto" button, žádný PDF label
- **Variant 4+5 (DRY-RUN)**: DRY-RUN overlay, "Stáhnout PDF štítek" + "Označit jako odesláno" (plné texty, bez zkratek)
- **Mark shipped flow**: `window.confirm` dialog s správnou zprávou, button zmizí, stav "Odesláno" se zobrazí
- **No email**: API verifikován — žádné `sendEmail()` volání při mark shipped (správně — email jde jen ze Stripe webhooku)
- **K odeslání tab**: filtruje správně, badge "Štítek připraven" viditelný

**Task #21 je READY TO SHIP.**
