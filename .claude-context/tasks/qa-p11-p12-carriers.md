# QA Report — Task #30: P1-1 + P1-2 Carrier API (DPD, PPL, GLS, ČP)

**Datum:** 2026-04-14
**Tester:** TEST-CHROME
**Commit:** cb8387f (`feat: add DPD, PPL, GLS, Česká Pošta carrier implementations (dry-run)`)

---

## Shrnutí

| Oblast | Výsledek |
|--------|----------|
| TypeScript build | ✅ PASS |
| CarrierClient interface — všechny 4 carriers | ✅ PASS |
| Dry-run fallback (bez API klíčů) | ✅ PASS |
| isConfigured() — 3 ENV vars každý | ✅ PASS |
| GLS SHA-512 hex→bytes konverze | ✅ PASS |
| Label proxy — nové carriers | ⚠️ KNOWN GAP (proxy jen ZASILKOVNA) |
| DPD weight unit | ⚠️ SUSPEKTNÍ (`*100` místo `*1000`) |

**Celkové hodnocení: SCHVÁLENO ✅** (dry-run implementace, 2 poznámky pro real-API fázi)

---

## 1. TypeScript Build

```bash
npx tsc --noEmit 2>&1 | grep -v "e2e/"
→ (čisté) ✅
```

---

## 2. CarrierClient interface — shoda se spec

Všechny 4 carriers implementují `BaseCarrierClient` se správnými metodami:

| Metoda | DPD | PPL | GLS | ČP |
|--------|-----|-----|-----|----|
| `readonly name: DeliveryMethod` | ✅ | ✅ | ✅ | ✅ |
| `isConfigured()` — 3 ENV vars | ✅ | ✅ | ✅ | ✅ |
| `createShipment()` — dry-run check první | ✅ | ✅ | ✅ | ✅ |
| `getLabelUrl()` — dry-run placehold.co | ✅ | ✅ | ✅ | ✅ |
| `trackShipment()` — dry-run status | ✅ | ✅ | ✅ | ✅ |
| `static trackingUrlFor()` | ✅ | ✅ | ✅ | ✅ |

---

## 3. Dry-run mód — ověřen

Žádné API klíče v env (výchozí dev stav):

```bash
DPD configured: false  ✅ → dryRunResult()
PPL configured: false  ✅ → dryRunResult()
GLS configured: false  ✅ → dryRunResult()
ČP  configured: false  ✅ → dryRunResult()
```

Dispatcher v `lib/shipping/dispatcher.ts` routuje správně — žádné změny nebyly potřeba.

---

## 4. API implementace — code review

### DPD (`api.dpd.cz/shipmentservice/rest/v1/`)
- Auth: `Basic base64(username:password)` ✅
- Response: `shipmentResponses[0].parcelInformation.parcelLabelNumber` ✅
- Tracking: GET `/v1/tracking/{parcelNumber}` ✅
- Status map: SHIPMENT_CREATED→CREATED, PICKUP→PICKED_UP, IN_TRANSIT/OUT_FOR_DELIVERY→IN_TRANSIT, DELIVERED, RETURNED ✅

### PPL (`myapi.ppl.cz/v2/`)
- Auth: `Basic base64(username:password)` ✅
- Response: `shipments[0].shipmentNumber` ✅
- Tracking: GET `/v2/shipments/{id}/tracking` ✅
- Status map: "1"→CREATED, "5"→PICKED_UP, "3"/"6"→IN_TRANSIT, "7"→DELIVERED, "8"→RETURNED ✅

### GLS (`api.mygls.cz/ParcelService.svc/json/`)
- Auth: Username + Password jako SHA-512 byte[] (GLS spec) ✅
- `passwordBytes()`: hex string → `parseInt(hex.substring(i, i+2), 16)` → number[] ✅
- Response: `PrintLabelsInfoList[0].ParcelNumber` ✅
- Tracking: POST `GetParcelStatuses` ✅

### Česká Pošta (`b2b.postaonline.cz/restservices/ZSKService/v1/`)
- Auth: `Basic base64(username:password)` ✅
- Weight: `Math.round(weightKg * 1000)` — gramy ✅
- Response: `parcels[0].parcelCode` ✅
- Status map: `posted`, `in-transport`, `at-post-office`, `out-for-delivery`, `delivered`, `returned` ✅

---

## 5. ⚠️ DPD weight unit — suspektní

DPD: `Math.round(input.weightKg * 100)` — výsledek pro 1.5 kg = **150**

ČP používá `* 1000` → gramy (1.5 kg = 1500 g)

DPD CZ API standardně přijímá gramy → správně by mělo být `* 1000`.
Hodnota `* 100` by znamenala decagramy — nestandardní.

**Dopad:** Nulový v dry-run (žádné API volání). Potenciální bug při aktivaci DPD produkčních klíčů.

**Doporučení:** Před aktivací DPD zkontrolovat API docs nebo testovat s testovacím prostředím.

---

## 6. ⚠️ Label proxy — nepodporuje nové carriers

`app/api/shipping/label/[trackingNumber]/route.ts`:
```ts
if (carrier !== "ZASILKOVNA") {
  return NextResponse.json({ error: "Nepodporovaný dopravce" }, { status: 400 });
}
```

DPD/PPL/GLS/ČP `getLabelUrl()` vrací `/api/shipping/label/{tracking}?carrier=DPD` atd.
V dry-run tyto URL nikdy nejsou generovány (placehold.co místo toho).
V produkci by label download selhal s HTTP 400.

**Dopad:** Nulový v dry-run. Blocker při aktivaci real API klíčů pro tyto carriers.

**Potřeba:** Rozšíření label proxy route o DPD/PPL/GLS/ČP (každý má jiné API pro PDF štítky).

---

## 7. Tracking URLs — správné

| Carrier | Tracking URL |
|---------|-------------|
| DPD | `tracking.dpd.de/status/cs_CZ/parcel/{id}` ✅ |
| PPL | `ppl.cz/vyhledat-zasilku?shipmentId={id}` ✅ |
| GLS | `gls-group.eu/CZ/cs/sledovani-zasilek?match={id}` ✅ |
| ČP | `postaonline.cz/trackandtrace/-/zasilka/cislo?parcelNumbers={id}` ✅ |

---

## Závěr

**Task #30: SCHVÁLENO ✅**

Dry-run scaffolding je kompletní a TypeScript čistý. Všechny 4 carriers správně implementují BaseCarrierClient interface s dry-run fallbackem.

**Pro produkční aktivaci (budoucí task) bude potřeba:**
1. Label proxy route rozšířit o DPD/PPL/GLS/ČP
2. DPD weight unit ověřit a opravit (`*100` → pravděpodobně `*1000`)
3. Otestovat s reálnými testovacími credentials každého carrieru
