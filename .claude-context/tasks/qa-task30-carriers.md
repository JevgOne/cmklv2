# QA Report — Task #30: Carrier API (DPD, PPL, GLS, ČP)

**Datum:** 2026-04-14  
**Agent:** KONTROLOR  
**Commit:** `cb8387f` — `feat: add DPD, PPL, GLS, Česká Pošta carrier implementations (dry-run)`  
**Soubory:** `lib/shipping/carriers/{dpd,ppl,gls,ceska-posta}.ts` (444 řádků celkem)

---

## BUILD CHECK

**TypeScript:** ✅ 0 errors v app/lib (ověřeno `tsc --noEmit` z předchozí relace — build 1241 stránek)

---

## 1. SIMPLIFY KONTROLA

Pattern konzistentní napříč 4 carriery. Žádná zbytečná duplikace — každý carrier má:
- `isConfigured()` → 3 ENV vars (username + password + customer ID)
- `createShipment()` → dry-run || real API fetch || throw on error
- `getLabelUrl()` → dry-run placehold.co || proxy URL
- `trackShipment()` → dry-run || real API fetch || UNKNOWN fallback
- `static trackingUrlFor()` → carrier-specific tracking URL

**GLS bonus:** `passwordBytes()` — SHA-512 hex→byte[] konverze, izolovaná čistá funkce ✅

---

## 2. REVERZNÍ KONTROLA — spec vs implementace

### Struktura (všechny 4 carriery)

| # | Požadavek | DPD | PPL | GLS | ČP |
|---|-----------|-----|-----|-----|----|
| 1 | `extends BaseCarrierClient` | ✅ | ✅ | ✅ | ✅ |
| 2 | `readonly name: DeliveryMethod` | ✅ | ✅ | ✅ | ✅ |
| 3 | 3 ENV vars, `isConfigured()` | ✅ | ✅ | ✅ | ✅ |
| 4 | dry-run fallback `dryRunResult()` | ✅ | ✅ | ✅ | ✅ |
| 5 | Real API POST/GET s auth | ✅ | ✅ | ✅ | ✅ |
| 6 | COD podmíněně | ✅ | ✅ | ✅ | ✅ |
| 7 | `trackingNumber` missing → throw | ✅ | ✅ | ✅ | ✅ |
| 8 | HTTP error → throw | ✅ | ✅ | ✅ | ✅ |
| 9 | `getLabelUrl()` → proxy URL | ✅ | ✅ | ✅ | ✅ |
| 10 | `trackShipment()` → stateMap | ✅ | ✅ | ✅ | ✅ |
| 11 | `static trackingUrlFor()` | ✅ | ✅ | ✅ | ✅ |

**Struktura: 44/44 ✅**

### Auth method

| Carrier | Spec | Implementace | Stav |
|---------|------|-------------|------|
| DPD | Basic (username:password) | `Buffer.from(...).toString("base64")` | ✅ |
| PPL | Basic (username:password) | `Buffer.from(...).toString("base64")` | ✅ |
| GLS | SHA-512 byte[] | `passwordBytes()` hex→int[] | ✅ |
| ČP | Basic (username:password) | `Buffer.from(...).toString("base64")` | ✅ |

### API endpointy

| Carrier | Endpoint | Stav |
|---------|---------|------|
| DPD | `api.dpd.cz/shipmentservice/rest/v1/shipment` | ✅ |
| PPL | `myapi.ppl.cz/v2/shipments` | ✅ |
| GLS | `api.mygls.cz/ParcelService.svc/json/PrintLabels` | ✅ |
| ČP | `b2b.postaonline.cz/restservices/ZSKService/v1/sendParcels` | ✅ |

### Tracking parsování

| Carrier | Response field | Stav |
|---------|---------------|------|
| DPD | `shipmentResponses[0].parcelInformation.parcelLabelNumber` | ✅ |
| PPL | `shipments[0].shipmentNumber` | ✅ |
| GLS | `PrintLabelsInfoList[0].ParcelNumber.toString()` | ✅ |
| ČP | `parcels[0].parcelCode` | ✅ |

---

## 3. NALEZENÉ PROBLÉMY

### ❌ GAP-1: Label proxy nepodporuje DPD/PPL/GLS/ČP

**Soubory:** `lib/shipping/carriers/{dpd,ppl,gls,ceska-posta}.ts` + `app/api/shipping/label/[trackingNumber]/route.ts`

`getLabelUrl()` pro všechny 4 carriery vrací:
```typescript
return `${baseUrl}/api/shipping/label/${trackingNumber}?carrier=DPD`;
// resp. PPL, GLS, CESKA_POSTA
```

Ale label proxy explicitně odmítá non-ZASILKOVNA requestů:
```typescript
// app/api/shipping/label/[trackingNumber]/route.ts:30
if (carrier !== "ZASILKOVNA") {
  return NextResponse.json({ error: "Nepodporovaný dopravce" }, { status: 400 });
}
```

**Dopad:** V dry-run módu (aktuální stav — bez API klíčů) se používá placehold.co URL → bez problémů. Ale jakmile bude nakonfigurovaný libovolný real API klíč, label download selže s 400.

**Fix:** Rozšířit `label/[trackingNumber]/route.ts` o fetch labelů pro DPD, PPL, GLS, ČP (každý má jiný endpoint a formát odpovědi).

**Závažnost:** Střední — latentní bug, v dry-run neprojeví. Musí být fixováno před aktivací real API klíčů.

---

### ⚠️ S1 — DPD weight jednotka (potenciální bug)

**Soubor:** `lib/shipping/carriers/dpd.ts:67`

```typescript
weight: Math.round(input.weightKg * 100),
```

DPD Shipper API typicky očekává hmotnost v **gramech** (1 kg = 1000). Implementace posílá `weightKg * 100` (2 kg → 200 = 0.2 kg z pohledu DPD).

**Porovnání:**
- ČP: `Math.round(input.weightKg * 1000)` → gramy ✅
- GLS: `input.weightKg` → kg jako float ✅  
- PPL: `input.weightKg` → kg jako float ✅
- DPD: `Math.round(input.weightKg * 100)` → 100g jednotky ⚠️

**Závažnost:** Nízká (nemůže ověřit bez DPD API přístupu). Pokud DPD API skutečně vyžaduje gramy, mělo by být `* 1000`. Doporučuji přepsat na `* 1000` jako obezřetný fix (nebo ověřit v DPD docs při aktivaci).

---

## CELKOVÉ HODNOCENÍ

| Oblast | Stav |
|--------|------|
| TypeScript / Build | ✅ PASS |
| Struktura (44 checks) | ✅ 44/44 |
| Auth implementace | ✅ Správná (Basic / SHA-512 byte[]) |
| API endpointy | ✅ Správné |
| Dry-run fallback | ✅ Všechny 4 carriery |
| Label proxy gap | ❌ Nepodporuje DPD/PPL/GLS/ČP |
| DPD weight jednotka | ⚠️ Potenciálně * 100 místo * 1000 |

**Task #30 Verdict: ⚠️ PASS WITH CAVEAT**  
Implementace je správná pro dry-run fázi. Label proxy (GAP-1) musí být rozšířen před aktivací real API klíčů. DPD weight (S1) je doporučeno ověřit nebo opravit na `* 1000`.
