# QA Report — P0-3: Zásilkovna API integrace

**Datum:** 2026-04-13  
**Agent:** KONTROLOR  
**Commit:** a7e54fe (`feat: Zásilkovna real API implementation`)  
**Soubory:** `lib/shipping/carriers/zasilkovna.ts` (181 ř.), `app/api/shipping/label/[trackingNumber]/route.ts` (107 ř.)  
**Plán:** `.claude-context/tasks/deep-dive-p03-zasilkovna.md`

---

## BUILD CHECK

**Aktuální stav: ✅ BUILD PASS (1239 stránek)**

```
✓ Compiled successfully
✓ Generating static pages (1239/1239)
ƒ /api/shipping/label/[trackingNumber] → Dynamic (confirmed)
TypeScript: 0 errors
```

---

## 1. SIMPLIFY KONTROLA

### ⚠️ S1 — `escapeXml` — duplicitní funkce

Identická funkce existuje na dvou místech:

**`lib/shipping/carriers/zasilkovna.ts:34-41`** — private class metoda:
```typescript
private escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

**`app/api/shipping/label/[trackingNumber]/route.ts:100-107`** — standalone funkce:
```typescript
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

**Fix:** Extrahovat do `lib/shipping/xml-utils.ts`, importovat na obou místech.  
**Effort:** ~10 min.  
**Závažnost:** Nízká — funkčně správné, ale porušuje DRY.

---

## 2. REVERZNÍ KONTROLA — spec vs implementace

### lib/shipping/carriers/zasilkovna.ts

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | `class ZasilkovnaClient extends BaseCarrierClient` | ✅ | |
| 2 | `readonly name: DeliveryMethod = "ZASILKOVNA"` | ✅ | |
| 3 | ENV: `ZASILKOVNA_API_PASSWORD` | ✅ | |
| 4 | ENV: `ZASILKOVNA_SENDER_LABEL` | ✅ | |
| 5 | `isConfigured()` → obě ENV přítomny | ✅ | |
| 6 | dry-run mód pokud není nakonfigurováno | ✅ | `return this.dryRunResult(input)` |
| 7 | `createShipment()` — guard: `zasilkovnaPointId` required | ✅ | hází Error pokud chybí |
| 8 | Split jméno na `name` + `surname` | ✅ | `split(/\s+/)`, surname fallback na firstName |
| 9 | XML `createPacket` se všemi povinnými poli | ✅ | number, name, surname, email, phone, addressId, value, weight, eshop, cod, currency |
| 10 | API endpoint: `https://www.zasilkovna.cz/api/rest` POST | ✅ | |
| 11 | Parse `<status>ok</status>` | ✅ | |
| 12 | Parse `<faultString>` při chybě | ✅ | |
| 13 | Parse `<id>` jako trackingNumber | ✅ | |
| 14 | `getLabelUrl()` — dry-run placehold.co URL | ✅ | |
| 15 | `getLabelUrl()` — proxy přes `/api/shipping/label/{trackingNumber}?carrier=ZASILKOVNA` | ✅ | |
| 16 | `trackShipment()` — XML `packetStatus` | ✅ | |
| 17 | Status map: 1=CREATED, 2-5=IN_TRANSIT, 6=DELIVERED, 7,10=RETURNED | ✅ | |
| 18 | `static trackingUrlFor()` — `https://tracking.packeta.com/cs/{id}` | ✅ | |
| 19 | XML escaping na vstupu | ✅ | `escapeXml()` na všech string polích |

**zasilkovna.ts: 19/19 ✅**

---

### app/api/shipping/label/[trackingNumber]/route.ts

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | Auth: ADMIN, BACKOFFICE, PARTS_SUPPLIER | ✅ | |
| 2 | Guard: carrier musí být "ZASILKOVNA" → 400 jinak | ✅ | |
| 3 | Guard: `ZASILKOVNA_API_PASSWORD` missing → 503 | ✅ | |
| 4 | XML `packetLabelPdf` s apiPassword + packetId | ✅ | |
| 5 | format: "A7 on A4", offset: 0 | ✅ | |
| 6 | HTTP chyba Zásilkovna → 502 + log | ✅ | |
| 7 | Content-Type check: xml/text → error → 502 | ✅ | Zásilkovna vrací XML s chybou místo PDF |
| 8 | PDF passthrough: `arrayBuffer()` → `new NextResponse(pdfBuffer)` | ✅ | |
| 9 | `Content-Type: application/pdf` | ✅ | |
| 10 | `Content-Disposition: inline; filename="label-{trackingNumber}.pdf"` | ✅ | |
| 11 | `Cache-Control: private, max-age=3600` | ✅ | |

**label route: 11/11 ✅**

---

## 3. P0-6 SUPPLIER FILTER — Potvrzení gapu

**Stav po Task #20:** Gap přetrvává.

- `app/api/admin/parts/route.ts` → query param `supplierId` → `where.supplierId` → ✅ funguje
- `app/(admin)/admin/parts/page.tsx` → žádný select pro výběr dodavatele → ❌ chybí

**Kontext:** Admin nemůže filtrovat díly podle dodavatele/vrakoviště přes UI. API endpoint je připraven.  
**Fix:** Přidat `<select>` se suppliers načtenými z `/api/admin/suppliers?status=ACTIVE&limit=100`.  
**Effort:** ~30 min.

---

## SOUHRN NÁLEZŮ

### ⚠️ Drobné výhrady (neblokující)

| Kód | Popis | Soubor | Effort |
|-----|-------|--------|--------|
| S1 | `escapeXml` — duplicitní (třída + route) | zasilkovna.ts:34, label/route.ts:100 | 10 min |

### ❌ Open gappy z předchozích QA (stále otevřené)

| Gap | Feature | Effort |
|-----|---------|--------|
| P0-1 | dateFrom/dateTo filter v returns API + UI | ~30 min |
| P0-5 | Detail link: `/admin/users` → `/admin/partners/${supplier.id}` | 1 min |
| P0-6 | Supplier filter dropdown v admin parts UI | ~30 min |

---

## CELKOVÉ HODNOCENÍ

| Oblast | Stav |
|--------|------|
| Build | ✅ PASS (1239 stránek, 0 TS errors) |
| zasilkovna.ts spec | ✅ 19/19 |
| label route spec | ✅ 11/11 |
| Auth gates | ✅ Správné (ADMIN/BACKOFFICE/PARTS_SUPPLIER) |
| XML injection prevence | ✅ escapeXml na všech vstupech |
| DRY princip | ⚠️ escapeXml duplikace (nízká závažnost) |
| P0-6 supplier filter gap | ❌ Stále otevřený |

**P0-3 Verdict: ✅ PASS** — 0 kritických bugů, 1 low-severity duplikace.  
**P0-6 supplier filter: ❌ OPEN** — potřeba implementace.
