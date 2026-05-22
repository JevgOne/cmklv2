# Implementace: Přímé integrace dopravců (task #16)

**Datum:** 2026-04-06
**Agent:** Implementátor
**Plán:** `.claude-context/tasks/plan-shipping-carriers.md` (793 řádků)
**Status:** ✅ Hotovo

---

## Cíl

Vytvořit abstrakci + stuby pro 5 dopravců (Zásilkovna, DPD, PPL, GLS, Česká pošta) s dry-run fallbackem, dispatcherem a README. Žádné nové npm balíčky.

---

## Vytvořené soubory (10)

| # | Soubor | Řádky | Popis |
|---|--------|-------|-------|
| 1 | `lib/shipping/base.ts` | 80 | `BaseCarrierClient` — abstract třída s dry-run helpery (`generateDryRunTrackingNumber`, `dryRunResult`, `dryRunStatus`) |
| 2 | `lib/shipping/weight.ts` | 42 | `calculateShipmentWeight()` — načte `part.weight` z Prisma, fallback 1.0 kg, minimum 0.1 kg |
| 3 | `lib/shipping/dispatcher.ts` | 118 | `createShipmentForOrder()` + `getCarrierClient()` — idempotentní entry point |
| 4 | `lib/shipping/carriers/zasilkovna.ts` | 71 | Packeta REST API stub + dry-run, `trackingUrlFor()` static helper |
| 5 | `lib/shipping/carriers/dpd.ts` | 61 | DPD Shipper API stub + dry-run |
| 6 | `lib/shipping/carriers/ppl.ts` | 62 | PPL MyAPI2 stub + dry-run |
| 7 | `lib/shipping/carriers/gls.ts` | 65 | GLS MyGLS stub + dry-run (pozor: SHA-512 heslo) |
| 8 | `lib/shipping/carriers/ceska-posta.ts` | 62 | Česká pošta Podání Online stub + dry-run |
| 9 | `lib/shipping/README.md` | 180 | Developer guide — architektura, ENV, aktivace reálného API, testování |
| 10 | `scripts/test-shipping.ts` | 63 | Manuální dry-run test přes `npx tsx scripts/test-shipping.ts` |

**Žádný existující soubor nebyl upraven.**

---

## Klíčové implementační detaily

### 1. Dry-run fallback (priorita č. 1 z plánu)
Každý carrier stub má `isConfigured()` → když vrátí `false`, `createShipment()` automaticky vrátí `this.dryRunResult(input)` bez síťového volání. Dry-run tracking číslo má prefix `DRY-` pro snadnou detekci.

### 2. Idempotence dispatcher
`createShipmentForOrder(orderId)` kontroluje `order.trackingNumber` **před** API voláním:
```typescript
if (order.trackingNumber) {
  return {
    trackingNumber: order.trackingNumber,
    // ...
    dryRun: order.trackingNumber.startsWith("DRY-"),
  };
}
```
Chrání proti Stripe webhook retry (task #17).

### 3. PICKUP = null (ne chyba)
`getCarrierClient("PICKUP")` vrátí `null`, dispatcher loguje a vrátí `null` bez chyby. Exhaustiveness check přes `_exhaustive: never`.

### 4. COD pouze když `paymentMethod === "COD"`
BANK_TRANSFER a CARD mají `codAmountCzk: undefined`.

### 5. Static `trackingUrlFor(trackingNumber)` na každém klientovi
Pro budoucí UI (email notifikace #19, tracking stránka) — může volat `ZasilkovnaClient.trackingUrlFor(tracking)` bez instancování.

### 6. Weight fallback
`Part.weight` je nullable v Prisma schematu. `calculateShipmentWeight()`:
- prázdný input → `DEFAULT_WEIGHT_KG = 1.0`
- `part.weight === null` → 1.0 kg per položka
- výsledek < 0.1 kg → 0.1 kg (minimum dopravců)

---

## Build výsledek

```bash
$ npm run build
✓ Compiled successfully in 16.5s
✓ Running TypeScript ... (žádné errors v shipping)
✓ Generating static pages
```

**TypeScript strict mode:** 0 errors v `lib/shipping/*` a `scripts/test-shipping.ts`.

**Poznámka:** Před prvním buildem bylo nutné spustit `npx prisma generate` aby Prisma Client měl čerstvé typy pro `Order.shippingLabelUrl` (task #15 přidal pole do schematu, ale client nebyl regenerován).

---

## Lint výsledek

```bash
$ npm run lint
✖ 550 problems (10 errors, 540 warnings)
```

**Errors v shipping:** 0 ✅

Všech 10 existujících errorů je v pre-existing souborech (ne moje):
- `components/ui/Tabs.tsx` — React compiler memoization warning (1×)
- `e2e/comprehensive-batch-test.spec.ts` — `require()` style imports (9×)

---

## Manuální test

```bash
$ npx tsx scripts/test-shipping.ts
# Očekávaný výstup:
[shipping:PPL] DRY-RUN createShipment
{
  orderNumber: "OBJ-260406-ABC12",
  recipient: "Jan Novák",
  city: "Praha",
  weightKg: 2.5,
  priceCzk: 1290,
  ...
}
Result: { trackingNumber: "DRY-PPL-OBJ-260406-ABC12-...", ..., dryRun: true }
🏷 Dry-run: YES (žádné reálné volání)
```

---

## Definition of Done — splněno

- [x] `lib/shipping/base.ts` existuje, exportuje `BaseCarrierClient`
- [x] `lib/shipping/weight.ts` existuje, exportuje `calculateShipmentWeight()`
- [x] `lib/shipping/dispatcher.ts` exportuje `createShipmentForOrder()` a `getCarrierClient()`
- [x] 5 carrier stubů v `lib/shipping/carriers/*.ts` — každý extends `BaseCarrierClient`
- [x] Každý carrier má `isConfigured()` → když false, `createShipment()` vrátí dry-run
- [x] Dry-run vrací `dryRun: true`, fake trackingNumber a placeholder label URL
- [x] `lib/shipping/README.md` s návodem na aktivaci reálných API
- [x] TypeScript strict mode projde bez errorů
- [x] Žádné nové npm balíčky v `package.json`
- [x] Dispatcher je idempotentní (kontrola `order.trackingNumber`)
- [x] Manuální test script `scripts/test-shipping.ts`

---

## Návazné tasky

| Task | Popis | Blokováno? |
|------|-------|------------|
| #17 | Stripe webhook → `createShipmentForOrder()` | Teď odblokováno ✅ |
| #18 | Checkout UI pro všech 5 dopravců | Teď odblokováno ✅ |
| #19 | Email notifikace (detekovat `DRY-` prefix) | Teď odblokováno ✅ |
| #20 | `.env.example` + root README (14 nových ENV) | Teď odblokováno ✅ |
| #21 | Vrakoviště PWA — tisk štítku | Teď odblokováno ✅ |
