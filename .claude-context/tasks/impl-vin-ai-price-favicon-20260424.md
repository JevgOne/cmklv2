# Implementace: VIN kamerový sken + AI cenový odhad + Favicon

**Datum:** 2026-04-24
**Status:** HOTOVO
**Build:** OK

## 1. VIN kamerový sken (Claude Vision OCR)

### Nové soubory
- `app/api/vin/scan/route.ts` — API endpoint: přijme image via FormData, pošle do Claude Vision (Sonnet 4.6), regex extract VIN 17-char, vrátí `{ found, vin }` nebo `{ found: false, message }`
- `components/pwa/vehicles/new/VinScanModal.tsx` — Fullscreen modal: spustí kameru (useCamera hook, facingMode: environment), viewfinder overlay s corner marks, tlačítko "Vyfotit", scanning spinner, error handling, po 3 neúspěšných pokusech nabídne ruční zadání

### Editované soubory
- `components/pwa/vehicles/new/VinStep.tsx`:
  - Import VinScanModal
  - Přidán state `scanModalOpen`, `hasCamera`
  - Detekce kamery via `navigator.mediaDevices.enumerateDevices()`
  - Stub "Již brzy" nahrazen funkčním "Skenovat" tlačítkem (skryté na zařízeních bez kamery)
  - Disabled když offline (s tooltipem)
  - VinScanModal → onVinScanned prefillne VIN a nastaví vinValid

### Architektura
- Využívá existující `lib/hooks/useCamera.ts` (getUserMedia, captureFrame → Blob)
- Claude Vision OCR prompt v angličtině (lepší přesnost dle CLAUDE.md pravidel)
- ~$0.01/scan, online-only (makléř stejně potřebuje internet pro VIN decode)

## 2. AI cenový odhad (Claude API + tool_use)

### Nové soubory
- `app/api/assistant/price-estimate/route.ts`:
  - Zod validace inputu
  - Query comparable SOLD vehicles z DB (brand + model + ±2 roky, max 20)
  - Claude Sonnet 4.6 s tool_use pro strukturovaný JSON output
  - System prompt: expert na český trh, pravidla pro condition/transmission/service book
  - Confidence override: ≥10 comparables=high, 3-9=medium, <3=low
  - Response: `{ min, max, suggested, confidence, reasoning, comparablesCount }`
  - Auth: BROKER, MANAGER, ADMIN, BACKOFFICE, REGIONAL_DIRECTOR

### Editované soubory
- `components/pwa/vehicles/new/PricingStep.tsx`:
  - Přidán PriceEstimate interface
  - State `estimating`, `estimate`
  - `canEstimate` guard (vyžaduje brand, model, year, mileage, condition z draftu)
  - Tlačítko "Odhadnout cenu AI" s loading spinner
  - Výsledková karta: rozmezí (min-max), doporučená cena, ConfidenceBadge, reasoning, disclaimer
  - "Použít doporučenou cenu" → prefill cenového inputu
  - ConfidenceBadge helper component (high/medium/low)

### Náklady
- ~$0.005/odhad (Sonnet 4.6), 1000 odhadů/měsíc ≈ $5/měsíc

## 3. Admin favicon

- Nahrazen `app/favicon.ico` (26KB, starý) za `public/brand/favicon.ico` (15KB, aktuální brand)
- Root layout metadata už referuje `/brand/favicon.ico` — teď je konzistentní i fallback

## Celkový souhrn
- **Nové soubory:** 3 (VIN scan API, VinScanModal, Price estimate API)
- **Editované soubory:** 3 (VinStep, PricingStep, app/favicon.ico)
- **Build:** PASS
