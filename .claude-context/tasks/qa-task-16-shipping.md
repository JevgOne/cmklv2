# QA Report — Task #16: Přímé integrace dopravců

**Datum:** 2026-04-06  
**Agent:** KONTROLOR  
**Zkontrolováno:** 10 souborů (`lib/shipping/` + `scripts/test-shipping.ts`)

---

## 1. SIMPLIFY KONTROLA

### Pozitiva
- `types.ts` — centralizované typy pro všechny klienty, žádné duplicity
- `base.ts` — `BaseCarrierClient` s `dryRunResult()` + `dryRunStatus()` helpery eliminuje duplicitu ve všech 5 klientech
- Všech 5 carriers mají identickou strukturu — konzistentní, snadno rozšiřitelné

### Drobnosti (neopravovat, jen zaznamenat)

| # | Místo | Poznámka |
|---|-------|----------|
| 1 | `base.ts:61` | Dry-run `trackingUrl` jde na `placehold.co` místo na lokální tracking stránku `/shop/objednavky/sledovani/{tracking}`. Funkčně OK. |
| 2 | Carriers getLabelUrl | Každý carrier konstruuje dry-run URL sám (`placehold.co/...?text=DRY-RUN+{CARRIER}+...`). Mohlo by být v `BaseCarrierClient.dryRunResult()`. Drobná duplicita, přijatelná. |
| 3 | `scripts/test-shipping.ts` | Komentář "Požadavky" nezmiňuje `DATABASE_URL`. Skript bez ní okamžitě padá. (Fix: přidat `DATABASE_URL=... npx tsx scripts/test-shipping.ts` do komentáře.) |

**Závěr Simplify: ✅ Kód je čistý, abstrakce správná, duplicity minimální.**

---

## 2. DEBUG KONTROLA

### Build
```
npm run build
✓ Compiled successfully in 19.5s
✓ Generating static pages (309/309)
```
**✅ BUILD PASSED — 0 errors**

### Lint
```
npm run lint
✖ 550 problems (10 errors, 540 warnings)
```

Porovnání s baseline (před task #16): bylo 549 problems.  
+1 nový warning — **NESOUVISÍ s shipping kódem:**
```
components/pwa/vehicles/new/ContactSearch.tsx:30
  Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')
```

**Shipping soubory: 0 nových errorů, 0 nových warningů.**

**✅ LINT PASSED — žádné nové problémy v shipping kódu**

### Dry-run test (`scripts/test-shipping.ts`)

Spuštění: `DATABASE_URL="..." npx tsx scripts/test-shipping.ts`

```
=== Shipping dry-run test ===

📦 Testing shipment for order:
   - orderNumber: OBJ-260321-P5Q6R
   - deliveryMethod: CESKA_POSTA
   - recipient: Petr Host, Brno
   - totalPrice: 477 Kč

[shipping:CESKA_POSTA] DRY-RUN createShipment {
  "orderNumber": "OBJ-260321-P5Q6R",
  "recipient": "Petr Host",
  "city": "Brno",
  "weightKg": 2,
  "priceCzk": 477,
  "codAmountCzk": null,
  "zasilkovnaPointId": null
}

✅ Result:
{
  "trackingNumber": "DRY-CESKA_POSTA-OBJ-260321-P5Q6R-MNMVN8UZ",
  "carrier": "CESKA_POSTA",
  "labelUrl": "https://placehold.co/600x800/orange/white?text=DRY-RUN+CESKA_POSTA+LABEL",
  "trackingUrl": "https://placehold.co/?tracking=...",
  "dryRun": true
}

🏷  Dry-run: YES (žádné reálné volání)
```

**✅ DRY-RUN TEST PASSED** — dispatcher funguje, DB save proběhl, dryRun: true

---

## 3. REVERZNÍ KONTROLA

Bod po bodu vs. původní zadání:

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 1 | 5 dopravců implementováno (Zásilkovna, DPD, PPL, GLS, Česká pošta) | ✅ | `lib/shipping/carriers/` — 5 souborů |
| 2 | Carmakler má smlouvy (ne vrakoviště) | ✅ | Dispatcher v `lib/shipping/` — kód patří Carmakler backendu |
| 3 | Dry-run fallback bez ENV klíče | ✅ | `BaseCarrierClient.dryRunResult()` — voláno automaticky když `isConfigured() === false` |
| 4 | Každý klient implementuje CarrierClient interface | ✅ | Všichni dědí `BaseCarrierClient implements CarrierClient` |
| 5 | Interface má: name, isConfigured, createShipment, getLabelUrl, trackShipment | ✅ | `types.ts:82-97` + každý klient má všechna 5 metod |
| 6 | `dispatcher.createShipmentForOrder(order)` existuje | ✅ | `dispatcher.ts:54` |
| 7 | Idempotentní — pokud trackingNumber existuje, nevolá znovu | ✅ | `dispatcher.ts:69-80` — early return s cached výsledkem |
| 8 | PICKUP → dispatcher vrací null | ✅ | `dispatcher.ts:63-66` + `getCarrierClient("PICKUP") → null` |
| 9 | Žádné nové npm balíčky | ✅ | `package.json` nezměněn |
| 10 | Reálná API volání throw "not implemented" | ✅ | Každý klient: `throw new Error("[...] Real API volání není implementováno")` |
| 11 | Order.trackingNumber uložen | ✅ | `dispatcher.ts:113` |
| 12 | Order.trackingCarrier uložen | ✅ | `dispatcher.ts:114` |
| 13 | Order.trackingUrl uložen | ✅ | `dispatcher.ts:115` |
| 14 | Order.shippingLabelUrl uložen | ✅ | `dispatcher.ts:116` |
| 15 | Schema má všechna 4 pole | ✅ | `schema.prisma:1000-1003` |

**Celkem: 15/15 ✅**

---

## SOUHRN

| Check | Výsledek |
|-------|---------|
| Simplify | ✅ Čisté, 3 drobnosti (neblokující) |
| Build | ✅ PASSED |
| Lint | ✅ 0 nových problems v shipping kódu |
| Dry-run test | ✅ PASSED (CESKA_POSTA dry-run OK) |
| Reverzní kontrola | ✅ 15/15 požadavků splněno |

**Celkové hodnocení: ✅ QA #16 PASS**

---

## POZNÁMKY PRO TASK #20 (.env.example)

Nové ENV proměnné ke zdokumentovat (přidá task #20):
```
ZASILKOVNA_API_PASSWORD=
ZASILKOVNA_SENDER_LABEL=
DPD_API_USERNAME=
DPD_API_PASSWORD=
DPD_CUSTOMER_NUMBER=
PPL_API_USERNAME=
PPL_API_PASSWORD=
PPL_CUSTOMER_ID=
GLS_API_USERNAME=
GLS_API_PASSWORD_SHA512=   # SHA-512 hash, ne plaintext!
GLS_CLIENT_NUMBER=
CESKA_POSTA_API_USERNAME=
CESKA_POSTA_API_PASSWORD=
CESKA_POSTA_CUSTOMER_ID=
```
