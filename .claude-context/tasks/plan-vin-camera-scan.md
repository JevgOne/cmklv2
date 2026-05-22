# Plán: VIN kamerový sken (OCR přes kameru telefonu)

## Stav

- **Aktuálně:** Stub tlačítko "Již brzy" (disabled) v `VinStep.tsx:310-317`
- **Existující infrastruktura:**
  - `lib/hooks/useCamera.ts` — hook pro kamerový přístup (getUserMedia, facingMode: environment, captureFrame)
  - Claude Vision API — již integrováno v `app/api/parts/visual-search/route.ts` (rozpoznání autodílů)
  - `@anthropic-ai/sdk` — v projektu

## Přístup: Claude Vision OCR

### Proč Claude Vision, ne Tesseract.js?

| Přístup | Výhoda | Nevýhoda |
|---------|--------|----------|
| **Claude Vision** | Vysoká přesnost, zvládá reflexy/úhly/povrchy, už v stacku | Online only, API cost ~$0.01/scan |
| Tesseract.js | Offline, free | Nižší přesnost na VIN (malý text, špatné osvětlení), +2MB bundle |
| Google Vision API | Profesionální OCR | Další dependency, nastavení, cena |

**Claude Vision je nejlepší volba** protože:
- VINy bývají na lesklých površích (palubní deska, štítky) — Claude Vision zvládá reflexy lépe
- Makléř potřebuje internet pro VIN decode (API call) → online requirement je OK
- Už je v stacku, stačí nový endpoint
- Náklady: ~$0.01/scan (image input ~1000 tokens)

## Architektura

```
VinStep.tsx
    │
    ├── Click "Skenovat kamerou"
    ├── useCamera().startCamera() → video preview
    ├── "Vyfotit" → captureFrame() → Blob
    │
    ▼
POST /api/vin/scan (multipart/form-data)
    │
    ├── 1. Claude Vision: "Přečti VIN z fotografie"
    ├── 2. Validace: regex /^[A-HJ-NPR-Z0-9]{17}$/
    ├── 3. Return { vin, confidence }
    │
    ▼
VinStep: setVin(result.vin) → auto-trigger decode + duplicate check
```

## Implementace

### Krok 1: API endpoint pro VIN OCR

**Nový soubor:** `app/api/vin/scan/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";

const VIN_REGEX = /[A-HJ-NPR-Z0-9]{17}/;

export async function POST(request: NextRequest) {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  // 2. Parse image from FormData
  const formData = await request.formData();
  const file = formData.get("image") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Nahrajte fotografii" }, { status: 400 });
  }

  // 3. Convert to base64
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp";

  // 4. Claude Vision OCR
  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64 },
        },
        {
          type: "text",
          text: `Přečti VIN kód z této fotografie. VIN je 17místný alfanumerický kód (bez písmen I, O, Q). 
Odpověz POUZE VIN kódem (17 znaků, velkými písmeny) bez jakéhokoliv dalšího textu.
Pokud VIN není čitelný nebo není na fotografii, odpověz slovem NENI.`,
        },
      ],
    }],
  });

  const rawText = response.content[0].type === "text" 
    ? response.content[0].text.trim().toUpperCase() 
    : "";

  // 5. Extract VIN z response
  const match = rawText.match(VIN_REGEX);
  
  if (!match) {
    return NextResponse.json({
      found: false,
      message: "VIN nebyl rozpoznán. Zkuste lépe zaostřit na VIN kód.",
    });
  }

  return NextResponse.json({
    found: true,
    vin: match[0],
  });
}
```

### Krok 2: VinScanModal komponenta

**Nový soubor:** `components/pwa/vehicles/new/VinScanModal.tsx`

```tsx
"use client";

import { useState, useCallback } from "react";
import { useCamera } from "@/lib/hooks/useCamera";
import { Button } from "@/components/ui/Button";

interface VinScanModalProps {
  open: boolean;
  onClose: () => void;
  onVinScanned: (vin: string) => void;
}

export function VinScanModal({ open, onClose, onVinScanned }: VinScanModalProps) {
  const { videoRef, isActive, error, startCamera, stopCamera, captureFrame } = useCamera();
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Start camera when modal opens
  // ...

  const handleCapture = useCallback(async () => {
    const frame = captureFrame();
    if (!frame) return;

    setScanning(true);
    setScanError(null);

    const formData = new FormData();
    formData.append("image", frame, "vin-scan.jpg");

    try {
      const res = await fetch("/api/vin/scan", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.found) {
        onVinScanned(data.vin);
        stopCamera();
        onClose();
      } else {
        setScanError(data.message || "VIN nebyl rozpoznán");
      }
    } catch {
      setScanError("Chyba při skenování");
    } finally {
      setScanning(false);
    }
  }, [captureFrame, onVinScanned, stopCamera, onClose]);

  // UI:
  // - Fullscreen modal (mobile-first)
  // - Video preview s viewfinder overlay (obdélník kde má být VIN)
  // - Tlačítko "Vyfotit" dole
  // - "Zavřít" (X) nahoře
  // - Error message pokud VIN nebyl rozpoznán
  // - Scanning spinner
}
```

**UI design:**
```
┌──────────────────────────┐
│  ✕                       │  ← Zavřít
│                          │
│    ┌──────────────────┐  │
│    │  [camera view]   │  │
│    │                  │  │
│    │  ┌────────────┐  │  │  ← Viewfinder overlay
│    │  │  VIN kód   │  │  │     (zaměřovací rámeček)
│    │  └────────────┘  │  │
│    │                  │  │
│    └──────────────────┘  │
│                          │
│  Zamiřte na VIN kód     │
│                          │
│    [ 📸 Vyfotit ]        │  ← Capture button
│                          │
└──────────────────────────┘
```

### Krok 3: Integrace do VinStep

**Soubor:** `components/pwa/vehicles/new/VinStep.tsx`

Nahradit disabled stub tlačítko za funkční:

```tsx
// BEFORE (řádky 310-317):
<Button variant="outline" disabled className="shrink-0">
  <svg>...</svg>
  <span className="text-xs">Již brzy</span>
</Button>

// AFTER:
<Button
  variant="outline"
  onClick={() => setScanModalOpen(true)}
  className="shrink-0"
>
  <svg>...camera icon...</svg>
  <span className="text-xs">Skenovat</span>
</Button>

{/* VIN Scan Modal */}
<VinScanModal
  open={scanModalOpen}
  onClose={() => setScanModalOpen(false)}
  onVinScanned={(scannedVin) => {
    setVin(scannedVin);
    setVinValid(true);
    setScanModalOpen(false);
    // Auto-trigger decode
  }}
/>
```

### Krok 4: Retry logika

Pokud OCR selže (VIN nečitelný):
1. Zobrazit error "VIN nebyl rozpoznán — zkuste lépe zaostřit"
2. Nechat kameru běžet pro další pokus
3. Po 3 neúspěšných pokusech nabídnout ruční zadání
4. Tip: "Zamiřte na VIN štítek na dveřním sloupku nebo palubní desce"

## Dotčené soubory

| Soubor | Akce |
|--------|------|
| `app/api/vin/scan/route.ts` | **NOVÝ** — Claude Vision OCR endpoint |
| `components/pwa/vehicles/new/VinScanModal.tsx` | **NOVÝ** — kamerový modal |
| `components/pwa/vehicles/new/VinStep.tsx` | **EDIT** — nahradit stub za funkční tlačítko + modal |

## Acceptance Criteria

- [ ] Tlačítko "Skenovat" (místo "Již brzy") otevře kamerový modal
- [ ] Kamera se spustí s back-facing kamerou (facingMode: environment)
- [ ] Viewfinder overlay naznačuje kde zaměřit VIN
- [ ] Po vyfocení se zobrazí loading → VIN se rozpozná
- [ ] Rozpoznaný VIN se prefillne do inputu
- [ ] Auto-trigger VIN decode + duplicate check po úspěšném skenu
- [ ] Pokud VIN nerozpoznán → error message + možnost zkusit znovu
- [ ] Zavření modalu zastaví kameru (cleanup tracks)
- [ ] Funguje na iOS Safari + Android Chrome (PWA context)

## Složitost

**Střední** — 2 nové soubory, 1 edit. Využívá existující `useCamera` hook + Claude Vision API.

## Náklady

- Claude Vision: ~$0.01/scan (image ~1000 tokens input)
- 500 skenů/měsíc ≈ **$5/měsíc**

## Edge cases

| Case | Řešení |
|------|--------|
| Kamera permission denied | Error message + fallback na ruční zadání |
| iOS Safari camera quirks | useCamera hook už řeší getUserMedia |
| Špatné osvětlení | Claude Vision je robustní, ale přidat tip "Zajistěte dobré osvětlení" |
| VIN na poškrábaném/zakrytém štítku | Po 3 pokusech nabídnout ruční zadání |
| Uživatel na desktopu | Detekce: navigator.mediaDevices → pokud chybí, skrýt tlačítko |
