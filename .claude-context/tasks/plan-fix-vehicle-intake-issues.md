# Implementační plán — Oprava PWA vehicle intake (P1+P2)

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-25  
**Zdroj:** audit-pwa-vehicle-intake-flow.md  
**Status:** ČEKÁ NA SCHVÁLENÍ LEADEM

---

## Executive Summary

Z 3 reportovaných problémů je **1 skutečný kritický bug** (foto upload pipeline), **2 nejsou bugy** (StepLayout back button funguje, dashboard odkazy existují). Foto pipeline bug postihuje OBA flows (complete i quick).

---

## Analýza reportovaných problémů

### P1 — Foto upload pipeline: ✅ POTVRZENÝ BUG (KRITICKÝ)

**Stav: Fotky se NIKDY nenahrají na Cloudinary. Vozidlo se vytvoří bez obrázků.**

#### Jak to funguje teď (broken):

```
PhotosStep → ukládá fotky do IndexedDB (images store) jako blob
           → do draftu ukládá jen metadata: {slotId, imageId, thumbnailUrl, isMain}
           → thumbnailUrl = blob: URL (lokální, dočasné)

ReviewStep (complete flow):
  → POST /api/vehicles s flat payload
  → payload NEOBSAHUJE žádné images
  → API vytvoří vehicle se status DRAFT, images: []
  → fotky zůstanou navždy v IndexedDB, nikdy se neuploadují

QuickStep3 (quick flow):
  → Iteruje photos z draftu
  → Kontroluje: if (p.file || p.blob) → upload na Cloudinary
  → ALE: draft photos mají jen {slotId, imageId, thumbnailUrl, isMain}
  → p.file = undefined, p.blob = undefined
  → Upload se přeskočí → fallback na thumbnailUrl (blob: URL)
  → blob: URL se pošle do API jako imageUrl → server ji uloží
  → blob: URL je neplatná mimo browser session → obrázek se nezobrazí
```

#### Service Worker sync = NEFUNKČNÍ pro images

```javascript
// public/sw.js — sync event handler (minified, ale podstata):
"sync-vehicles" === e.tag && console.log("[SW] Background sync: vehicles")
"sync-images"   === e.tag && console.log("[SW] Background sync: images")
"sync-contracts" === e.tag && console.log("[SW] Background sync: contracts")
"sync-contacts"  === e.tag && (console.log("[SW] Background sync: contacts"), e.waitUntil(eN()))
```

- `sync-images` → **POUZE console.log, žádná akce**
- `sync-vehicles` → **POUZE console.log, žádná akce**
- Pouze `sync-contacts` má skutečný handler (`eN()`)

#### Místa kde je problém:

| Soubor | Řádek | Problém |
|--------|-------|---------|
| `components/pwa/vehicles/new/ReviewStep.tsx` | 146-187 | Online submit: POST /api/vehicles BEZ images |
| `components/pwa/vehicles/new/ReviewStep.tsx` | 208-240 | Offline submit: addPendingAction BEZ images |
| `components/pwa/vehicles/quick/QuickStep3.tsx` | 146-188 | Upload kontroluje `p.file \|\| p.blob` — nikdy true |
| `public/sw.js` | sync handler | sync-images/sync-vehicles = jen console.log |
| `lib/offline/sync.ts` | celý soubor | Jen registruje sync tagy, žádná logika |

---

### P2 — Chybějící zpět tlačítka v StepLayout: ❌ NENÍ BUG

**Soubor:** `components/pwa/vehicles/new/StepLayout.tsx`

StepLayout má VŽDY tlačítko zpět v headeru (řádky 78-97):
```typescript
const handleBack = () => {
  if (onBack) {
    onBack();
  } else {
    router.back();  // fallback — vždy funguje
  }
};
```

Tlačítko zpět je renderováno VŽDY (není podmíněné na `onBack` prop). Pokud step neposkytuje vlastní `onBack`, použije se `router.back()` — standardní browser navigace.

**Závěr: Žádná oprava potřeba.**

---

### P2 — Dashboard odkazy `/makler/leaderboard` a `/makler/materials`: ❌ NENÍ BUG

Obě stránky existují:
- `app/(pwa)/makler/leaderboard/page.tsx` ✅
- `app/(pwa)/makler/materials/page.tsx` ✅

**Závěr: Žádná oprava potřeba.**

---

## Scope oprav (pouze P1)

| Priorita | Popis | Stav |
|----------|-------|------|
| **P1-A** | Přidat foto upload do ReviewStep (complete flow, online) | TODO |
| **P1-B** | Opravit foto upload v QuickStep3 (quick flow) | TODO |
| **P1-C** | Přidat foto upload do offline submit + SW sync | TODO |

---

## Existující vzory a infrastruktura

### Upload API endpoint
**Soubor:** `app/api/upload/route.ts`  
**Method:** POST (FormData: `file` + `upload_preset`)  
**Returns:** `{ url: string, publicId: string }`  
**Funkce:** Proxy na Cloudinary

### Jak QuickStep3 uploaduje (vzorový kód, řádky 146-188):
```typescript
for (let i = 0; i < photos.length; i++) {
  const p = photos[i];
  if (p.file || p.blob) {
    const uploadFormData = new FormData();
    const fileToUpload = p.file || new File([p.blob!], `photo-${i}.jpg`, { type: "image/jpeg" });
    uploadFormData.append("file", fileToUpload);
    uploadFormData.append("upload_preset", "vehicles");
    const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadFormData });
    // ... zpracuje URL
  }
}
```
Tento kód je **správný vzor**, jen se nikdy nespustí protože photos z draftu nemají `file`/`blob`.

### IndexedDB images store
**Soubor:** `lib/offline/storage.ts`  
**API:**
- `saveImage(draftId, imageId, blob)` — uloží blob do `images` store
- `getImages(draftId)` — vrátí `{imageId, blob}[]` pro daný draft

### VehicleImage Prisma model
Vehicle má relaci `images: VehicleImage[]`:
```
model VehicleImage {
  id         String   @id @default(cuid())
  vehicleId  String
  url        String
  isPrimary  Boolean  @default(false)
  order      Int      @default(0)
  vehicle    Vehicle  @relation(...)
}
```

### API pro přidání obrázků k vozidlu
Potřeba ověřit zda existuje endpoint pro POST images k existujícímu vehicle. Pokud ne, vytvoříme v rámci opravy.

---

## Implementační kroky

### KROK 1: Helper funkce — upload photos z IndexedDB

**Vytvořit:** `lib/offline/upload-photos.ts`

**Logika:**
```typescript
export async function uploadDraftPhotos(
  draftId: string, 
  draftPhotos: DraftPhoto[]
): Promise<Array<{ url: string; isPrimary: boolean; order: number }>> {
  // 1. Načti blobs z IndexedDB
  const storedImages = await offlineStorage.getImages(draftId);
  
  // 2. Pro každou photo v draft najdi odpovídající blob
  const imageUrls = [];
  for (let i = 0; i < draftPhotos.length; i++) {
    const photo = draftPhotos[i];
    const stored = storedImages.find(img => img.imageId === photo.imageId);
    
    if (stored?.blob) {
      // Upload blob na Cloudinary přes /api/upload
      const formData = new FormData();
      formData.append("file", new File([stored.blob], `photo-${i}.jpg`, { type: "image/jpeg" }));
      formData.append("upload_preset", "vehicles");
      
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        imageUrls.push({
          url: data.url,
          isPrimary: photo.isMain || i === 0,
          order: i,
        });
      }
    }
  }
  
  return imageUrls;
}
```

**Proč helper:** Stejná logika je potřeba ve 3 místech (ReviewStep, QuickStep3, SW sync). Shared helper zabrání duplikaci.

**Cílový počet řádků:** ~40-50

### KROK 2: API endpoint — přidat obrázky k vozidlu

**Ověřit zda existuje:** `app/api/vehicles/[id]/images/route.ts`  
**Pokud ne, vytvořit:** POST endpoint pro přidání obrázků

```typescript
// POST /api/vehicles/[id]/images
// Body: { images: Array<{ url: string, isPrimary: boolean, order: number }> }
// Auth: BROKER (vlastní vozidlo) nebo ADMIN/BACKOFFICE

// Prisma:
await prisma.vehicleImage.createMany({
  data: images.map(img => ({
    vehicleId: id,
    url: img.url,
    isPrimary: img.isPrimary,
    order: img.order,
  })),
});
```

**Cílový počet řádků:** ~50-60

### KROK 3: Opravit ReviewStep (complete flow, online)

**Soubor:** `components/pwa/vehicles/new/ReviewStep.tsx`  
**Řádky:** 146-207 (`handleSubmit`, online branch)

**Změny:**
1. Po úspěšném `POST /api/vehicles` (řádek 196: `const result = ...`)
2. **Před** redirectem na success:
   - Volat `uploadDraftPhotos(draftId, allPhotosFromDraft)`
   - Pokud máme obrázky: `POST /api/vehicles/${result.id}/images` s uploadnutými URL
3. Progress indikátor: "Nahrávám fotky... (3/15)"

```typescript
// Po POST /api/vehicles:
const result = await response.json();

// Upload photos
const allPhotos = [
  ...(draft.photos?.exterior || []),
  ...(draft.photos?.interior || []),
  ...(draft.photos?.engine || []),
  ...(draft.photos?.evidence || []),
  ...(draft.photos?.documents || []),
];
if (allPhotos.length > 0) {
  setSubmitStatus("Nahrávám fotky...");
  const imageUrls = await uploadDraftPhotos(draft.id, allPhotos);
  if (imageUrls.length > 0) {
    await fetch(`/api/vehicles/${result.id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: imageUrls }),
    });
  }
}

// Redirect to success
router.push(`/makler/vehicles/new/success?draft=${draftId}&vehicleId=${result.id}`);
```

**Cílový počet změněných řádků:** ~25-30

### KROK 4: Opravit QuickStep3 (quick flow)

**Soubor:** `components/pwa/vehicles/quick/QuickStep3.tsx`  
**Řádky:** 146-188 (foto upload sekce)

**Změna:**
Nahradit stávající logiku (`if p.file || p.blob`) voláním `uploadDraftPhotos()`:

```typescript
// PŘED (broken):
if (p.file || p.blob) { ... }

// PO (fixed):
const imageUrls = await uploadDraftPhotos(draftId, photos);
```

Zbytek kódu (POST /api/vehicles s imageUrls) zůstává stejný.

**Cílový počet změněných řádků:** ~15-20

### KROK 5: Offline submit + Service Worker sync (P1-C)

**Toto je nejsložitější krok.** Dvě možnosti:

#### Možnost A: Upload při reconnect (jednodušší, doporučeno pro MVP)

**Princip:** Když se makléř vrátí online, při otevření dashboardu se spustí sync:
1. Dashboard detekuje online stav
2. Načte pending actions z IndexedDB
3. Pro SUBMIT_VEHICLE: upload photos → POST /api/vehicles → POST images

**Soubory k úpravě:**
- `app/(pwa)/makler/dashboard/page.tsx` nebo nová komponenta `components/pwa/OnlineSync.tsx`
- Přidat `useEffect` s `navigator.onLine` + `window.addEventListener("online", sync)`

**Logika:**
```typescript
async function syncPendingVehicles() {
  const pending = await offlineStorage.getPendingActions();
  for (const action of pending) {
    if (action.type === "SUBMIT_VEHICLE") {
      // 1. Upload photos z IndexedDB
      const imageUrls = await uploadDraftPhotos(action.draftId, action.data.photos);
      // 2. POST /api/vehicles
      const res = await fetch("/api/vehicles", { method: "POST", ... });
      const vehicle = await res.json();
      // 3. POST images
      if (imageUrls.length > 0) {
        await fetch(`/api/vehicles/${vehicle.id}/images`, { ... });
      }
      // 4. Odstranit pending action
      await offlineStorage.removePendingAction(action.id);
    }
  }
}
```

**Cílový počet řádků:** ~80-100 (nová komponenta)

#### Možnost B: Service Worker background sync (správné, ale složitější)

**Problém:** SW nemá přímý přístup k IndexedDB `images` store přes `offlineStorage` wrapper.

**Potřeba:**
1. V `public/sw.js` implementovat handler pro `sync-vehicles` a `sync-images`
2. SW musí přímo otevřít IndexedDB a načíst blobs
3. SW musí uploadovat přes fetch na `/api/upload` a `/api/vehicles`

**Doporučení:** Možnost A pro MVP, Možnost B jako budoucí vylepšení.

### KROK 6: ReviewStep — přidat photos do offline pending action

**Soubor:** `components/pwa/vehicles/new/ReviewStep.tsx`  
**Řádky:** 208-240 (offline branch)

Aktuální offline submit neukládá reference na fotky do pending action:
```typescript
await offlineStorage.addPendingAction(
  `submit_${draft.id}`,
  "SUBMIT_VEHICLE",
  {
    vin: ov.vin ?? "",
    brand: od.brand ?? "",
    // ... flat payload BEZ photos
  }
);
```

**Oprava:** Přidat `draftId` a `photos` metadata do pending action dat:
```typescript
{
  ...flatPayload,
  _draftId: draft.id,  // pro nalezení blobs v IndexedDB
  _photos: allPhotos,  // metadata pro upload (slotId, imageId, isMain)
}
```

**Cílový počet změněných řádků:** ~5

---

## Pořadí implementace

```
1. KROK 1 — Helper uploadDraftPhotos()         (~45 řádků, nový soubor)
2. KROK 2 — API POST /api/vehicles/[id]/images (~55 řádků, nový soubor)
3. KROK 3 — ReviewStep online foto upload       (~30 řádků změn)
4. KROK 4 — QuickStep3 fix foto upload          (~20 řádků změn)
5. KROK 6 — ReviewStep offline metadata         (~5 řádků změn)
6. KROK 5 — Online sync komponenta (MVP)        (~90 řádků, nový soubor)
```

---

## Soubory k vytvoření

| # | Soubor | Typ | Popis |
|---|--------|-----|-------|
| 1 | `lib/offline/upload-photos.ts` | Helper | Shared funkce: IndexedDB blobs → Cloudinary URLs |
| 2 | `app/api/vehicles/[id]/images/route.ts` | API | POST endpoint pro přidání obrázků k vozidlu |
| 3 | `components/pwa/OnlineSync.tsx` | Component | Sync pending actions při reconnect |

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 4 | `components/pwa/vehicles/new/ReviewStep.tsx` | Přidat foto upload po POST vehicles (online) + přidat photo metadata do offline action |
| 5 | `components/pwa/vehicles/quick/QuickStep3.tsx` | Nahradit broken upload logiku voláním uploadDraftPhotos() |
| 6 | `app/(pwa)/makler/dashboard/page.tsx` | Přidat `<OnlineSync />` komponentu |

---

## STOP kritéria (pro kontrolora)

1. **Complete flow online:** Po odeslání vozidla přes ReviewStep se fotky nahrají na Cloudinary a vehicle má images v DB
2. **Quick flow online:** Po odeslání přes QuickStep3 se fotky nahrají na Cloudinary
3. **Ověřit v Prisma Studio:** Po submit má vehicle záznamy ve VehicleImage tabulce s platnými Cloudinary URL
4. **Offline → online sync:** Po návratu online se pending vehicle odešle i s fotkami
5. **`npm run build` projde bez chyb**
6. **Žádné TypeScript errory**
7. **Žádné blob: URL v databázi** — všechny imageUrl musí být Cloudinary URL

---

## Rizika

| Riziko | Pravděpodobnost | Mitigace |
|--------|----------------|----------|
| Upload 20+ fotek = pomalé (30s+) | Vysoká | Progress indikátor + paralelní upload (Promise.allSettled) |
| IndexedDB blobs velké (5-10MB/foto) | Střední | Compress před uložením (PhotosStep už to dělá?) — ověřit |
| API /api/vehicles/[id]/images neexistuje | Jistá | Vytvořit v KROK 2 |
| SW sync přístup k IndexedDB | Střední | MVP = client-side sync (Možnost A), SW sync = fáze 2 |
| Race condition: vehicle vytvořen ale upload failne | Střední | Vehicle je DRAFT, backoffice ho neuvidí dokud broker nepodá ke schválení |
| Draft photos reference neexistující imageId | Nízká | Graceful skip + log, nepřerušit celý upload |

---

## Alternativní přístup (zvážit)

Místo 2-krokového flow (POST vehicle → POST images) by šlo:
- Upravit `POST /api/vehicles` aby přijímal `images` array s URL
- Upload by proběhl PŘED vytvořením vehicle

**Výhoda:** Atomická operace (vehicle + images).  
**Nevýhoda:** Větší změna v API, upload před confirm = zbytečné uploady pokud user stornuje.

**Doporučení:** Ponechat 2-krokový flow (jako nyní). Vehicle je DRAFT, images se přidají hned po.

---

*Plán připraven: 2026-04-25*  
*Čeká na schválení team leadem*
