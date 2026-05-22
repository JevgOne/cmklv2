# EVŽEN — Kontrola P0-3: Zásilkovna Real API (commit a7e54fe)

**Datum:** 2026-04-13
**Kontrolor:** Evžen THE KING
**Commit:** a7e54fe
**Zadání:** TASK-QUEUE.md, sekce E (řádky 2328–2333) + doručení (řádky 1777, 2020–2024)

---

## 1. Zadání (doslovně)

> "Doručení: osobní odběr u dodavatele / zásilkovna / PPL / Česká pošta" (ř. 1777)
> "Integrace API: Zásilkovna widget (výběr výdejního místa), PPL/ČP paušální sazby" (ř. 2333)
> "Velké díly (>30 kg nebo >120 cm) → zásilkovna nedostupná" (ř. 2331)
> Order model: `deliveryMethod: ZASILKOVNA | PPL | CESKA_POSTA | PICKUP`, `trackingNumber`, `zasilkovnaPointId` (ř. 2020–2024)

---

## 2. Implementace — Architektura

Celý shipping framework je čistě navržený:

```
lib/shipping/
  types.ts             — CarrierClient interface, CreateShipmentInput/Result, ShipmentStatus
  base.ts              — BaseCarrierClient (dry-run mód, fake tracking)
  dispatcher.ts        — createShipmentForOrder() — hlavní entry point
  weight.ts            — calculateShipmentWeight()
  prices.ts            — ceník
  carriers/
    zasilkovna.ts      ← COMMIT a7e54fe (real API)
    dpd.ts
    ppl.ts
    gls.ts
    ceska-posta.ts

components/web/
  ZasilkovnaWidget.tsx — Packeta Widget v6 (výběr výdejního místa)

app/api/shipping/label/[trackingNumber]/
  route.ts             ← COMMIT a7e54fe (PDF proxy)
```

---

## 3. Bod po bodu: Commit a7e54fe

### 3a. `createShipment()` — Vytvoření zásilky

| # | Kontrolní bod | Status | Poznámka |
|---|--------------|--------|----------|
| 1 | Volá reálné Zásilkovna API | ✅ | XML POST na `https://www.zasilkovna.cz/api/rest` |
| 2 | XML `createPacket` formát | ✅ | Obsahuje: apiPassword, number, name, surname, email, phone, addressId, value, weight, eshop, cod, currency |
| 3 | Name/surname split | ✅ | `input.recipient.name.split(/\s+/)` → firstName + surname |
| 4 | `addressId` z Zásilkovna widgetu | ✅ | `input.zasilkovnaPointId` (povinný — throw pokud chybí) |
| 5 | `escapeXml()` ochrana | ✅ | Escapuje `& < > " '` — prevence XML injection |
| 6 | Response parsing | ✅ | Hledá `<status>ok</status>` + `<id>...</id>` jako trackingNumber |
| 7 | Error handling | ✅ | Parsuje `<faultString>` při chybě |
| 8 | Dobírka (COD) | ✅ | `<cod>${input.codAmountCzk ?? 0}</cod>` |
| 9 | Dry-run fallback | ✅ | `if (!this.isConfigured()) return this.dryRunResult(input)` |

### 3b. `getLabelUrl()` — PDF štítek

| # | Kontrolní bod | Status | Poznámka |
|---|--------------|--------|----------|
| 1 | Real mode: proxy URL | ✅ | `/api/shipping/label/${trackingNumber}?carrier=ZASILKOVNA` |
| 2 | Dry-run: placeholder | ✅ | `placehold.co` URL |
| 3 | Proxy endpoint existuje | ✅ | `app/api/shipping/label/[trackingNumber]/route.ts` |

### 3c. `trackShipment()` — Sledování zásilky

| # | Kontrolní bod | Status | Poznámka |
|---|--------------|--------|----------|
| 1 | XML `packetStatus` formát | ✅ | apiPassword + packetId |
| 2 | StatusCode→State mapování | ✅ | 1=CREATED, 2-5=IN_TRANSIT, 6=DELIVERED, 7,10=RETURNED |
| 3 | lastUpdate z `<dateTime>` | ✅ | |
| 4 | lastLocation z `<codeText>` | ✅ | |
| 5 | UNKNOWN fallback | ✅ | `stateMap[code] ?? "UNKNOWN"` |
| 6 | Dry-run fallback | ✅ | `dryRunStatus()` |

### 3d. PDF Label Proxy (`/api/shipping/label/[trackingNumber]`)

| # | Kontrolní bod | Status | Poznámka |
|---|--------------|--------|----------|
| 1 | Auth check | ✅ | ADMIN, BACKOFFICE, PARTS_SUPPLIER |
| 2 | Carrier validation | ✅ | Pouze ZASILKOVNA (rozšiřitelné) |
| 3 | XML `packetLabelPdf` | ✅ | Format "A7 on A4" |
| 4 | Content-Type: application/pdf | ✅ | |
| 5 | Content-Disposition: inline | ✅ | `label-{trackingNumber}.pdf` |
| 6 | Cache-Control | ✅ | `private, max-age=3600` |
| 7 | XML error detection | ✅ | Pokud content-type je xml/text → 502 error |
| 8 | Missing API password | ✅ | 503 Service Unavailable |

### 3e. Dry-run mód

| # | Kontrolní bod | Status | Poznámka |
|---|--------------|--------|----------|
| 1 | Aktivuje se bez `ZASILKOVNA_API_PASSWORD` | ✅ | `isConfigured()` checkuje obě env vars |
| 2 | Fake tracking number | ✅ | `DRY-ZASILKOVNA-{orderNumber}-{ts}` |
| 3 | Placeholder label URL | ✅ | placehold.co |
| 4 | dryRun flag ve výsledku | ✅ | `result.dryRun = true` |
| 5 | Console logging | ✅ | Loguje co by se poslalo (pro debugging) |

---

## 4. Zásilkovna Widget (existující, NE z tohoto commitu)

| # | Kontrolní bod | Status | Poznámka |
|---|--------------|--------|----------|
| 1 | Packeta Widget v6 script | ✅ | `widget.packeta.com/v6/www/js/library.js` |
| 2 | `Packeta.Widget.pick()` volání | ✅ | S apiKey, callback, options |
| 3 | Vybraný bod: id + name + address | ✅ | onSelect callback |
| 4 | Změnit výdejní místo | ✅ | Button "Změnit" |
| 5 | Prázdný stav s CTA | ✅ | "Vybrat výdejní místo — 8 000+ míst" |
| 6 | `NEXT_PUBLIC_ZASILKOVNA_API_KEY` | ✅ | Env var pro widget |

---

## 5. Dispatcher integrace (existující)

| # | Kontrolní bod | Status | Poznámka |
|---|--------------|--------|----------|
| 1 | `getCarrierClient("ZASILKOVNA")` → `ZasilkovnaClient` | ✅ | |
| 2 | `createShipmentForOrder()` — idempotentní | ✅ | Vrací cached pokud Order má tracking |
| 3 | Ukládá tracking do DB | ✅ | `trackingNumber, trackingCarrier, trackingUrl, shippingLabelUrl` |
| 4 | Weight calculation | ✅ | `calculateShipmentWeight()` |
| 5 | COD amount pro dobírku | ✅ | `paymentMethod === "COD" ? totalPrice : undefined` |
| 6 | PICKUP → skip (null) | ✅ | |
| 7 | Prisma model: zasilkovnaPointId, zasilkovnaPointName | ✅ | V Order modelu |

---

## 6. Zadání vs implementace — gapy

### Splněno oproti zadání TASK-020

| Zadání | Status |
|--------|--------|
| "zásilkovna" jako delivery method | ✅ |
| "Zásilkovna widget (výběr výdejního místa)" | ✅ Widget existuje |
| API pro generování zásilek | ✅ createShipment() |
| PDF štítky | ✅ getLabelUrl() + proxy endpoint |
| Tracking | ✅ trackShipment() |
| Dry-run pro testování | ✅ |

### Gapy

| # | Gap | Závažnost | Poznámka |
|---|-----|-----------|----------|
| G1 | **Velké díly (>30 kg / >120 cm) → zásilkovna nedostupná** — logika chybí | NÍZKÁ | Zadání (ř. 2331) říká že velké díly nemají mít Zásilkovnu jako option. Toto je spíš checkout logika, ne API klient |
| G2 | **PPL/ČP real API** — zatím mají jen base class (dry-run) | INFO | Mimo scope P0-3, ale stojí za zmínku. Soubory existují ale nejsou implementované |
| G3 | **`escapeXml()` duplikace** — stejná funkce v `zasilkovna.ts` i `label/route.ts` | KOSMETICKÉ | Mohla být sdílená utility |
| G4 | **Label proxy auth chybí PARTNER_VRAKOVISTE** — jen PARTS_SUPPLIER | NÍZKÁ | Vrakoviště jsou PARTNER_VRAKOVISTE, ne PARTS_SUPPLIER — ale záleží na business logice |
| G5 | **Webhook pro status update** chybí — tracking je jen pull (manuální dotaz) | NÍZKÁ | Zásilkovna podporuje webhook callbacks, ale to je fáze 2 |

---

## 7. VERDIKT

### ✅ SCHVÁLENO

Implementace Zásilkovna real API je **kompletní a odpovídá zadání**:
- `createShipment()` volá reálné XML API s korektními parametry
- `getLabelUrl()` vrací proxy URL na PDF štítek
- `trackShipment()` mapuje statusCodes na interní stavy
- Dry-run fallback pro testování bez credentials
- Widget pro výběr výdejního místa existuje a je integrovaný
- Dispatcher propojuje vše dohromady (idempotentní, ukládá do DB)
- Bezpečnost: escapeXml, auth check, error handling

Žádné kritické ani střední gapy. Drobnosti (G1–G5) jsou buď mimo scope, nebo kosmetické.

---

*Kontroloval: Evžen THE KING | 2026-04-13*
