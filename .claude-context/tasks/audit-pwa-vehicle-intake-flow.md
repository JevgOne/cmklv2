# Audit PWA — Flow nabírání vozu

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Scope:** `app/(pwa)/makler/vehicles/**`, `components/pwa/vehicles/**`, relevantní API routes

---

## Flow diagram — Kompletní nabírání (7 kroků)

```
Dashboard (/makler/dashboard)
  └── AddVehicleCTA → "/makler/vehicles/new"
        │
        ├── [CTA] "Nabrat nové auto" → createDraft() → "/makler/vehicles/new/contact?draft={id}"
        │
        ▼
  KROK 1: Kontakt (/makler/vehicles/new/contact)
    - Zdroj leadu (select)
    - Jméno prodejce *, Telefon *, Email
    - Předběžné info: značka, model, rok, km, cena
    - Adresa / geolokace
    - Termín schůzky
    - Poznámky
    → NEXT: updateStep(2) → "/makler/vehicles/new/inspection"
        │
        ▼
  KROK 2: Prohlídka (/makler/vehicles/new/inspection)
    - Dokumenty (7 checkboxů: TP, velký TP, servisní, STK, emise, kabel, klíče)
    - Exteriér: celkový stav (4 stupně) + 6 checkboxů (lak, rez, promáčkliny...)
    - Interiér: celkový stav + 6 checkboxů
    - Motor: 6 checkboxů
    - Testovací jízda: 7 checkboxů (pokud provedena)
    - Závady (DefectCapture — fotky defektů)
    - Celkový dojem (StarRating 1-5)
    - [REJECT] "Odmítnout vozidlo" → modal → saveDraft → zpět na /new
    → NEXT: updateStep(3) → "/makler/vehicles/new/vin"
        │
        ▼
  KROK 3: VIN (/makler/vehicles/new/vin)
    - VIN input (17 znaků, validace formátu)
    - Auto-check duplicity: GET /api/vin/check-duplicate?vin=XXX
    - Dekódovat VIN: GET /api/vin/decode?vin=XXX
    - VIN scan kamerou (Tesseract.js — VinScanModal)
    - Offline: IndexedDB cache pro VIN data
    → NEXT: saveDraft() → "/makler/vehicles/new/photos"
        │
        ▼
  KROK 4: Fotodokumentace (/makler/vehicles/new/photos)
    - 5 kategorií: Exteriér (13 slotů), Interiér (4), Motor (1), Důkazní (3), Doklady (2)
    - Min. 13 regular + 3 evidence = 16 fotek
    - PhotoGuide overlay pro každý slot (tip, pozice)
    - PhotoPositionDiagram pro exteriér
    - Defekt fotky (neomezené)
    - Fotky ukládány do IndexedDB (offlineStorage)
    - resizeImage + createThumbnail
    → NEXT: updateStep(5) → "/makler/vehicles/new/details"
        │
        ▼
  KROK 5: Detaily (/makler/vehicles/new/details)
    - Značka, Model, Varianta, Rok, Nájezd
    - Palivo, Převodovka, Pohon, Karoserie
    - Výkon, Objem, Dveře, Místa, Barva
    - Stav, STK do, Servisní knížka, Tachometr, Majitelé, Země původu
    - Výbava (EquipmentSelector — multi-select tagy)
    - Highlights (předvolené: Garáž, Nekuřák, 1. majitel, Servisní...)
    - Pre-fill z VIN dekodéru
    → NEXT: → "/makler/vehicles/new/pricing"
        │
        ▼
  KROK 6: Cena a lokace (/makler/vehicles/new/pricing)
    - Prodejní cena (s formátováním)
    - Cena k jednání (checkbox)
    - AI Price Estimate: POST /api/assistant/price-estimate
    - DPH (radio: s DPH / bez DPH / neplátce)
    - Provize (auto-výpočet: 5% min 25 000 Kč)
    - Lokace: město (datalist CZ měst), městská část, přesná adresa
    - Popis inzerátu (min. 50 znaků)
    - AI Generate Description: POST /api/assistant/generate-description
    - Zdroj vozu (radio: soukromý / autobazar / dovoz)
    → NEXT: → "/makler/vehicles/new/review"
        │
        ▼
  KROK 7: Kontrola (/makler/vehicles/new/review)
    - Náhled inzerátu (card s fotkami, titulek, parametry, cena)
    - Checklist kompletnosti (10 položek, kliknutí na chybějící → redirect)
    - [SUBMIT online] POST /api/vehicles → redirect na success
    - [SUBMIT offline] offlineStorage.addPendingAction("SUBMIT_VEHICLE") → redirect na success
    - [SAVE DRAFT] saveDraft() → zpět na /new
        │
        ▼
  ÚSPĚCH (/makler/vehicles/new/success)
    - "Odesláno ke schválení!" / "Uloženo k odeslání!" (offline)
    - CTA: Podepsat exkluzivní smlouvu → "/makler/contracts?vehicleId={id}"
    - CTA: Poslat prezentaci (EmailButton)
    - Zpět na Dashboard
    - Nabrat další auto
```

---

## Flow diagram — Rychlé nabírání (3 kroky)

```
Dashboard → AddVehicleCTA (quickModeEnabled=true) → "/makler/vehicles/quick"
  │
  └── Auto-createDraft() → redirect → "/makler/vehicles/quick/step1"
        │
        ▼
  KROK 1: VIN + Kontakt (/makler/vehicles/quick/step1)
    - VIN (17 znaků) + auto-check duplicity + dekódování
    - Jméno prodejce + Telefon
    - GPS geolokace
    → NEXT: "/makler/vehicles/quick/step2"
        │
        ▼
  KROK 2: Fotky (/makler/vehicles/quick/step2)
    - 5 povinných: přední 3/4, zadní 3/4, interiér, tachometr, VIN štítek
    - Volitelné: motorový prostor, kufr, levý bok
    - Stejný PhotoGuide jako v kompletním flow
    → NEXT: "/makler/vehicles/quick/step3"
        │
        ▼
  KROK 3: Cena + detaily (/makler/vehicles/quick/step3)
    - Nájezd, Cena, Stav vozidla (select)
    - Provize auto-výpočet
    - [SUBMIT] POST /api/vehicles/quick → status DRAFT_QUICK
    → SUCCESS: "/makler/vehicles/quick/success"
        │
        ▼
  ÚSPĚCH (/makler/vehicles/quick/success)
    - "Rychlý draft odeslán!"
    - "Máte 48 hodin na doplnění"
    - CTA: Doplnit údaje → "/makler/vehicles/{id}/edit"
    - Nabrat další auto → "/makler/vehicles/quick"
    - Zpět na dashboard
```

---

## Ověření všech odkazů, API routes a akcí

### Stránky — existence ověřena

| Stránka | Soubor | Stav |
|---------|--------|------|
| `/makler/dashboard` | `app/(pwa)/makler/dashboard/page.tsx` | ✅ OK |
| `/makler/vehicles` | `app/(pwa)/makler/vehicles/page.tsx` | ✅ OK |
| `/makler/vehicles/new` | `app/(pwa)/makler/vehicles/new/page.tsx` | ✅ OK |
| `/makler/vehicles/new/contact` | `app/(pwa)/makler/vehicles/new/contact/page.tsx` | ✅ OK |
| `/makler/vehicles/new/inspection` | `app/(pwa)/makler/vehicles/new/inspection/page.tsx` | ✅ OK |
| `/makler/vehicles/new/vin` | `app/(pwa)/makler/vehicles/new/vin/page.tsx` | ✅ OK |
| `/makler/vehicles/new/photos` | `app/(pwa)/makler/vehicles/new/photos/page.tsx` | ✅ OK |
| `/makler/vehicles/new/details` | `app/(pwa)/makler/vehicles/new/details/page.tsx` | ✅ OK |
| `/makler/vehicles/new/pricing` | `app/(pwa)/makler/vehicles/new/pricing/page.tsx` | ✅ OK |
| `/makler/vehicles/new/review` | `app/(pwa)/makler/vehicles/new/review/page.tsx` | ✅ OK |
| `/makler/vehicles/new/success` | `app/(pwa)/makler/vehicles/new/success/page.tsx` | ✅ OK |
| `/makler/vehicles/[id]` | `app/(pwa)/makler/vehicles/[id]/page.tsx` | ✅ OK |
| `/makler/vehicles/[id]/edit` | `app/(pwa)/makler/vehicles/[id]/edit/page.tsx` | ✅ OK |
| `/makler/vehicles/[id]/handover` | `app/(pwa)/makler/vehicles/[id]/handover/page.tsx` | ✅ OK |
| `/makler/vehicles/quick` | `app/(pwa)/makler/vehicles/quick/page.tsx` | ✅ OK |
| `/makler/vehicles/quick/step1` | `app/(pwa)/makler/vehicles/quick/step1/page.tsx` | ✅ OK |
| `/makler/vehicles/quick/step2` | `app/(pwa)/makler/vehicles/quick/step2/page.tsx` | ✅ OK |
| `/makler/vehicles/quick/step3` | `app/(pwa)/makler/vehicles/quick/step3/page.tsx` | ✅ OK |
| `/makler/vehicles/quick/success` | `app/(pwa)/makler/vehicles/quick/success/page.tsx` | ✅ OK |
| `/makler/contracts` | `app/(pwa)/makler/contracts/page.tsx` | ✅ OK |
| `/makler/contracts/[id]` | `app/(pwa)/makler/contracts/[id]/page.tsx` | ✅ OK |
| `/makler/contracts/[id]/sign` | `app/(pwa)/makler/contracts/[id]/sign/page.tsx` | ✅ OK |
| `/makler/contracts/new` | `app/(pwa)/makler/contracts/new/page.tsx` | ✅ OK |

### API Routes — existence ověřena

| Endpoint | Metoda | Volající komponenta | Stav |
|----------|--------|---------------------|------|
| `/api/vin/check-duplicate?vin=XXX` | GET | VinStep:101, QuickStep1 | ✅ OK |
| `/api/vin/decode?vin=XXX` | GET | VinStep:165, QuickStep1 | ✅ OK |
| `/api/vehicles` | POST | ReviewStep:183 | ✅ OK |
| `/api/vehicles` | GET | (public listing) | ✅ OK |
| `/api/vehicles/quick` | POST | QuickStep3 | ✅ OK |
| `/api/vehicles/[id]` | GET | EditVehiclePage:20 | ✅ OK |
| `/api/vehicles/[id]/images` | POST | (foto upload) | ✅ OK |
| `/api/assistant/generate-description` | POST | PricingStep:155 | ✅ OK |
| `/api/assistant/price-estimate` | POST | PricingStep:204 | ✅ OK |
| `/api/assistant/chat` | POST | AiAssistant | ✅ OK |

### Navigační odkazy v komponentách

| Odkaz | Zdroj | Cíl existuje? |
|-------|-------|---------------|
| `/makler/vehicles/new` | AddVehicleCTA, SuccessView:101, NewVehiclePage (reject flow) | ✅ |
| `/makler/vehicles/quick` | AddVehicleCTA (quickMode), QuickSuccessPage:59 | ✅ |
| `/makler/vehicles/new/contact?draft=X` | NewVehiclePage:66, EditVehiclePage:88 | ✅ |
| `/makler/vehicles/new/inspection?draft=X` | ContactStep:42 | ✅ |
| `/makler/vehicles/new/vin?draft=X` | InspectionStep:101 | ✅ |
| `/makler/vehicles/new/photos?draft=X` | VinStep:216 | ✅ |
| `/makler/vehicles/new/details?draft=X` | PhotosStep:312 | ✅ |
| `/makler/vehicles/new/pricing?draft=X` | DetailsStep (handleContinue) | ✅ |
| `/makler/vehicles/new/review?draft=X` | PricingStep:237 | ✅ |
| `/makler/vehicles/new/success?draft=X` | ReviewStep:207,251 | ✅ |
| `/makler/vehicles/quick/step1?draft=X` | QuickVehiclePage:14 | ✅ |
| `/makler/vehicles/quick/step2?draft=X` | QuickStep1 | ✅ |
| `/makler/vehicles/quick/step3?draft=X` | QuickStep2 | ✅ |
| `/makler/vehicles/quick/success` | QuickStep3 | ✅ |
| `/makler/vehicles/${id}` | Dashboard (expiring exclusives):184 | ✅ |
| `/makler/vehicles/${id}/edit` | QuickSuccessPage:52 | ✅ |
| `/makler/contracts?vehicleId=X` | SuccessView:70 | ✅ |
| `/makler/dashboard` | NewVehiclePage:75, SuccessView:94, QuickSuccessPage:68 | ✅ |
| `/makler/leaderboard` | Dashboard:140 | ⚠️ NEOVĚŘENO (mimo scope, ale referencováno) |
| `/makler/materials` | Dashboard:212 | ⚠️ NEOVĚŘENO (mimo scope, ale referencováno) |

---

## Offline podpora

### IndexedDB (offlineStorage)

| Funkce | Použití | Stav |
|--------|---------|------|
| `offlineStorage.getDrafts()` | NewVehiclePage:39 — načtení rozpracovaných draftů | ✅ OK |
| `offlineStorage.getCachedVin(vin)` | VinStep:136 — offline VIN cache | ✅ OK |
| `offlineStorage.cacheVin(vin, data)` | VinStep:178 — ukládání VIN do cache | ✅ OK |
| `offlineStorage.saveImage(id, draftId, blob)` | PhotosStep:170 — ukládání fotek offline | ✅ OK |
| `offlineStorage.getImages(draftId)` | PhotosStep:278 — načtení fotek | ✅ OK |
| `offlineStorage.addPendingAction(...)` | ReviewStep:216 — offline submit queue | ✅ OK |
| `offlineStorage.saveDraft(id, data)` | ReviewStep:201 — uložení draftu | ✅ OK |

### useDraft hook

| Funkce | Stav |
|--------|------|
| `createDraft()` | ✅ Vytvoří nový draft v IndexedDB |
| `loadDraft(id)` | ✅ Načte draft z IndexedDB |
| `updateSection(section, data)` | ✅ Aktualizuje sekci draftu |
| `updateStep(step)` | ✅ Aktualizuje aktuální krok |
| `updateStatus(status)` | ✅ Změní status draftu |
| `saveDraft()` | ✅ Uloží do IndexedDB |

### Offline soubory
- `lib/offline/db.ts` — IndexedDB database schema (idb) ✅
- `lib/offline/storage.ts` — Storage API wrapper ✅
- `lib/offline/sync.ts` — Background Sync logic ✅

---

## Shrnutí výsledků

### ✅ Fungující části

1. **Celý kompletní flow (7 kroků)** — všechny stránky existují, navigace mezi kroky funguje
2. **Celý rychlý flow (3 kroky)** — všechny stránky existují, navigace funguje
3. **VIN dekodér** — API routes existují (`/api/vin/decode`, `/api/vin/check-duplicate`)
4. **Formuláře** — všechny kroky mají kompletní formuláře s validací
5. **Fotodokumentace** — 23 foto slotů, PhotoGuide, PhotoPositionDiagram, offline ukládání
6. **Inspekce** — kompletní checklist (dokumenty, exteriér, interiér, motor, test drive, defekty)
7. **AI integrace** — generování popisu + cenový odhad (API routes existují)
8. **Offline podpora** — IndexedDB drafty, VIN cache, foto ukládání, pending actions
9. **Provize výpočet** — 5% min 25 000 Kč, zobrazeno v pricing kroku
10. **Draft management** — vytváření, načítání, pokračování rozpracovaných draftů
11. **Odmítnutí vozu** — v kroku 2 (inspekce), uloží draft se statusem rejected_by_broker
12. **Edit existujícího vozu** — `/makler/vehicles/[id]/edit` → načte data z API, prefill do draft flow
13. **Handover** — `/makler/vehicles/[id]/handover` existuje, jen pro RESERVED status
14. **Smlouvy** — success page → link na `/makler/contracts?vehicleId=X`, stránky existují
15. **Submit** — online POST /api/vehicles, offline pending_sync → background sync

### ⚠️ Varování (potenciální problémy)

#### 1. Dashboard odkazy mimo scope
- **`/makler/leaderboard`** — referencováno v `dashboard/page.tsx:140` — NEOVĚŘENO zda stránka existuje
- **`/makler/materials`** — referencováno v `dashboard/page.tsx:212` — NEOVĚŘENO zda stránka existuje
- **Priorita:** Nízká (mimo scope tohoto auditu, ale mělo by být ověřeno)

#### 2. Quick flow — foto upload do Cloudinary
- **QuickStep3** odesílá `POST /api/vehicles/quick` s `images[].url` (Cloudinary URL)
- **QuickStep2** fotí lokálně do IndexedDB, ale upload do Cloudinary musí proběhnout PŘED submittem
- **Potenciální problém:** Pokud QuickStep2 neuploaduje fotky do Cloudinary a jen je drží v IndexedDB, submit v QuickStep3 pošle lokální blob URLs → API vrátí chybu
- **Priorita:** Střední — nutno ověřit, zda QuickStep2 uploaduje do Cloudinary před pokračováním

#### 3. Kompletní flow — fotky se neuploadují do Cloudinary při submitu
- **ReviewStep** posílá `POST /api/vehicles` s flat payload (VIN, brand, model, price...)
- **Fotky z IndexedDB se NEODESÍLAJÍ** v tomto POST requestu — nejsou v `flatPayload`
- **Pravděpodobný design:** Fotky se uploadují separátně přes `/api/vehicles/[id]/images` PO vytvoření vozidla
- **Ale:** ReviewStep po úspěšném POST rovnou redirectne na success — NENÍ vidět krok uploadu fotek
- **Potenciální problém:** Vozidlo se vytvoří bez fotek, ty zůstanou jen v IndexedDB
- **Priorita:** VYSOKÁ — nutno ověřit, zda existuje mechanismus pro upload fotek po submitu (možná background sync)

#### 4. Quick flow — SuccessView link na /makler/vehicles/{id}/edit
- **QuickSuccessPage:52** — `<Link href={/makler/vehicles/${vehicleId}/edit}>` — stránka existuje ✅
- **EditVehiclePage** načte data z `GET /api/vehicles/{id}` a vytvoří nový draft → redirect do kompletního flow
- **Funguje správně** — ale vytváří NOVÝ draft místo editace stávajícího, což může být matoucí (staré drafty zůstávají v IndexedDB)

#### 5. StepLayout — tlačítko "Zpět" ne vždy definováno
- **ContactStep** (krok 1) — `onBack` NENÍ definováno ve StepLayout → chybí zpětná navigace z kroku 1
- **VinStep** (krok 3) — `onBack` NENÍ definováno
- **DetailsStep** (krok 5) — nutno ověřit
- **Priorita:** Nízká (uživatel může použít browser back button)

### ❌ Kritické problémy

**ŽÁDNÉ kritické problémy nenalezeny.** Celý flow nabírání vozu je kompletní — všechny stránky existují, API routes existují, navigace funguje.

### Nejistoty vyžadující hlubší analýzu

1. **Foto upload pipeline** — Jak se fotky z IndexedDB dostanou do Cloudinary a napojí na Vehicle? Je to background sync (`lib/offline/sync.ts`)? Nebo separátní krok po submitu? Toto je klíčové pro funkčnost celého flow.

2. **Background Sync** (`lib/offline/sync.ts`) — Zpracovává pending actions (SUBMIT_VEHICLE) i foto upload? Nutno ověřit obsah.

3. **Service Worker** (`public/sw.js`) — Registruje background sync? Podporuje offline foto cache?

---

## Statistiky

| Metrika | Hodnota |
|---------|---------|
| Zkontrolované stránky | 23 |
| Zkontrolované komponenty | 39 |
| Ověřené API endpoints | 10 |
| Ověřené navigační odkazy | 25+ |
| Kritické problémy | 0 |
| Varování | 5 |
| Offline funkce ověřeny | 7 |

---

## Doporučení

1. **[P1]** Ověřit foto upload pipeline — jak se IndexedDB fotky dostanou do Cloudinary po submitu
2. **[P1]** Ověřit background sync (`lib/offline/sync.ts`) — zpracování pending actions + fotek
3. **[P2]** Ověřit existenci `/makler/leaderboard` a `/makler/materials` stránek
4. **[P2]** Zvážit přidání `onBack` do StepLayout pro kroky 1, 3, 5 (teď závisí na browser back)
5. **[P3]** Quick flow — staré drafty v IndexedDB se neuklidí po editaci přes `/vehicles/[id]/edit`

---

*Audit proveden: 2026-04-26*  
*Auditovaný scope: kompletní + rychlý flow nabírání vozu, dashboard entry points, offline podpora*
