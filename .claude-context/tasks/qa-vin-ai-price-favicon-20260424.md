# QA Report: VIN sken + AI cenový odhad + Favicon
**Datum:** 2026-04-24  
**Commit:** 272da54  
**Kontrolor:** KONTROLOR agent  
**Verdikt: ⚠️ PODMÍNĚNĚ APPROVED — 1 kritický nález (unstaged deletion), 2 střední nálezy**

---

## 1. Simplify kontrola

### VinScanModal.tsx
- Lazy import Tesseract.js (`await import("tesseract.js")`) v `getWorker()` je správný vzor — nezatíží bundle při startu
- `workerRef` pattern pro reuse workeru je efektivní (worker se inicializuje jen jednou)
- `VIN_REGEX` je definovaný v VinScanModal i VinStep — mírná duplicita, ale lokálně odůvodnitelná
- Cleanup workeru v useEffect unmount je správný ✅

### PricingStep.tsx
- `ConfidenceBadge` jako local function (ne component file) je OK pro single-use helper
- Celkový rozsah změn je přiměřený

### price-estimate/route.ts
- Čistý kód, Zod validace, tool_use pattern, chybí try/catch jen kolem Prisma dotazu ale globální try/catch pokrývá
- Confidence override (přepsání Claude confidence pomocí skutečného počtu comparables) je správná logika

---

## 2. Debug kontrola (Build)

```
✓ Compiled successfully in 19.2s  
✓ Generating static pages (1265/1265)  
Build: PASS
```

Žádné TypeScript errory ani warningy. Build prochází i bez `app/api/vin/scan/route.ts` (VinScanModal ho nevolá — používá Tesseract.js client-side).

---

## 3. Reverzní kontrola (plán vs. implementace)

### Fix 1: VIN kamerový sken ⚠️

**KRITICKÝ NÁLEZ: Architekturální přechod Claude Vision → Tesseract.js (nezdokumentován)**

| Stav | Popis |
|---|---|
| **Commit 272da54** | Přidán `app/api/vin/scan/route.ts` (Claude Vision OCR, 78 řádků) |
| **Working tree** | `app/api/vin/scan/route.ts` je **SMAZÁN** (unstaged deletion) |
| **VinScanModal.tsx** | Používá **Tesseract.js** (client-side), NIKOLI Claude Vision API |
| **Impl report** | Říká "Claude Vision OCR" — **NEPŘESNÉ** |
| **Commit message** | Říká "Claude Vision OCR" — **NEPŘESNÉ** |

**Git status:**
```
Changes not staged for commit:
  deleted: app/api/vin/scan/route.ts
```

**Tesseract.js je v package.json** (`"tesseract.js": "^7.0.0"`) ✅ — kód funkčně funguje.

**Hodnocení přechodu na Tesseract.js:**
- ✅ Offline capable (klíčové pro PWA makléře v terénu)
- ✅ Nulové API náklady (vs. ~$5/měsíc u Claude Vision)
- ✅ tesseract.js v package.json — dependency existuje
- ⚠️ Nižší přesnost na lesklých/poškrábaných štítcích (vs. Claude Vision)
- ⚠️ Větší bundle size (tesseract.js + eng.traineddata ~10MB, lazy loaded)

**Acceptance Criteria:**

| AC | Výsledek |
|---|---|
| Tlačítko "Skenovat" nahrazuje "Již brzy" | ✅ |
| Kamera se spustí s back-facing kamerou | ✅ (useCamera hook, facingMode: environment) |
| Viewfinder overlay | ✅ (rám s oranžovými rohy) |
| Loading → VIN rozpoznán | ✅ (spinner + "Rozpoznávám...") |
| Rozpoznaný VIN se prefillne do inputu | ✅ (`setVin(scannedVin)`) |
| **Auto-trigger VIN decode po skenu** | ❌ **CHYBÍ** — duplicate check je auto (useEffect), ale decode musí makléř kliknout manuálně |
| Error + možnost zkusit znovu | ✅ (attempts counter) |
| Zavření modalu zastaví kameru | ✅ (stopCamera v useEffect/handleClose) |
| Po 3 pokusech nabídne ruční zadání | ✅ |
| Disabled když offline | N/A — Tesseract.js funguje offline, check odstraněn logicky |

### Fix 2: AI cenový odhad ✅

| Acceptance Criteria | Výsledek |
|---|---|
| Tlačítko "Odhadnout cenu AI" viditelné | ✅ |
| Aktivní jen s brand, model, year, mileage, condition | ✅ (`canEstimate` guard) |
| Loading spinner → cenový odhad card | ✅ |
| Card: rozmezí, doporučená cena, confidence, reasoning | ✅ |
| "Použít doporučenou cenu" prefillne input | ✅ |
| Confidence odpovídá počtu comparable sales | ✅ (≥10: high, 3-9: medium, <3: low — override) |
| API endpoint používá tool_use | ✅ (strukturovaný JSON output) |
| API auth-protected (BROKER, MANAGER, ADMIN…) | ✅ (5 rolí) |
| Disclaimer "Orientační odhad" | ✅ |

### Fix 3: Favicon ✅

| Kontrola | Výsledek |
|---|---|
| `app/favicon.ico` nahrazen aktuálním brand favicon | ✅ (25931 → 15086 bytes) |
| Shoduje se s `public/brand/favicon.ico` | ✅ (obě 15086 bytes, stejný obsah) |
| Root layout metadata (`/brand/favicon.ico`) konzistentní | ✅ |

---

## Nálezy

### 🔴 Kritický: Unstaged deletion `app/api/vin/scan/route.ts`

**Soubor:** `app/api/vin/scan/route.ts`  
**Problém:** Soubor byl přidán v commitu 272da54 ale je smazán z working tree bez commitu. Repozitář je v nekonzistentním stavu.

**Nutná akce** (implementátor musí zvolit jednu možnost):
- **A) Pokud Tesseract.js je záměrný:** Zacommitovat smazání (`git rm app/api/vin/scan/route.ts`) + opravit impl report + commit message
- **B) Pokud se má používat Claude Vision:** Obnovit soubor (`git checkout app/api/vin/scan/route.ts`) a upravit VinScanModal aby volal API

### ⚠️ Střední: Auto-trigger VIN decode po skenu chybí

**Soubor:** `components/pwa/vehicles/new/VinStep.tsx:340–348`  
**Problém:** Acceptance criteria říká "Auto-trigger VIN decode + duplicate check po úspěšném skenu". Duplicate check je auto (useEffect při vin.length === 17), ale decode vyžaduje manuální kliknutí na "Dekódovat VIN".

**Fix:** Přidat `handleDecode()` call do `onVinScanned` callbacku:
```tsx
onVinScanned={(scannedVin) => {
  setVin(scannedVin);
  setVinValid(true);
  setScanModalOpen(false);
  // Přidat:
  // handleDecode() — ale potřeba upravit aby přijal vin jako param
}}
```
Nebo použít `useEffect` trigger na `vinValid === true && scanModalOpen === false`.

### ℹ️ Nízká: Impl report a commit message jsou nepřesné

**Soubor:** `.claude-context/tasks/impl-vin-ai-price-favicon-20260424.md`  
**Problém:** Report říká "Claude Vision OCR" — faktická implementace je Tesseract.js. Commit message totéž.  
**Fix:** Aktualizovat impl report. (Commit message nejde změnit bez force-push — dokumentovat v follow-up commitu.)

---

## Souhrn

| Oblast | Status |
|---|---|
| VIN sken (funkčnost) | ✅ Funguje (Tesseract.js) |
| VIN sken (git stav) | 🔴 Unstaged deletion — nutno zacommitovat |
| VIN auto-trigger decode | ❌ Chybí |
| AI cenový odhad | ✅ Plně implementováno |
| Favicon | ✅ OK |
| Build | ✅ PASS |

**Verdikt: ⚠️ PODMÍNĚNĚ APPROVED**  
Funkčnost je zachována (build OK, Tesseract.js funguje), ale git stav je nekonzistentní a musí být vyřešen. Auto-trigger decode je střední priorita.
