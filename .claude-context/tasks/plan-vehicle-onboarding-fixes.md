# Plan: Fix vehicle onboarding flow — Draft→Pending, offline photos, duplicates

**Task:** #54
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Bug fix + feature completion
**Závažnost:** CRITICAL — #1 priorita, team bude flow reálně používat

---

## IDENTIFIKOVANÉ BUGY (5)

### BUG 1: Vehicle zůstane DRAFT po odeslání (CRITICAL)

**Symptom:** ReviewStep klikne "Odeslat ke schválení" → vehicle se vytvoří jako DRAFT → nikdy se nepřepne na PENDING → admin v BackOffice nevidí vozidlo ke schválení.

**Root cause:**
- `ReviewStep.tsx` volá `POST /api/vehicles` → vytvoří vehicle se `status: "DRAFT"` (hardcoded, route.ts:226)
- Poté uploadne fotky a přesměruje na success page
- **ALE nikdy nevolá** `PATCH /api/vehicles/[id]/status` s `{ status: "PENDING" }`
- Endpoint pro DRAFT→PENDING existuje a je funkční (`/api/vehicles/[id]/status/route.ts`:17)
- Vehicle zůstane navždy DRAFT

**Kde v kódu:**
- `components/pwa/vehicles/new/ReviewStep.tsx` — `handleSubmit()` funkce
- Po úspěšném `POST /api/vehicles` + `POST /api/vehicles/{id}/images` chybí:
  ```typescript
  await fetch(`/api/vehicles/${vehicleId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "PENDING" }),
  });
  ```

---

### BUG 2: Offline sync — partial failure ztratí fotky (CRITICAL)

**Symptom:** Broker odešle offline → vrátí se online → OnlineSync vytvoří vehicle, ale fotky se nenahrají → vehicle bez obrázků, pending action odstraněna, žádný retry.

**Root cause v `components/pwa/OnlineSync.tsx`:**
```typescript
// Problematický flow:
for (const action of vehicleActions) {
  const { _draftId, _photos, ...vehiclePayload } = action.payload;
  
  // 1. Create vehicle — OK
  const vehicleRes = await fetch("/api/vehicles", { ... });
  
  // 2. Upload photos — MŮŽE FAILNOUT
  if (_draftId && _photos.length > 0) {
    const imageUrls = await uploadDraftPhotos(_draftId, _photos);
    await fetch(`/api/vehicles/${vehicleId}/images`, { ... });
  }
  
  // 3. VŽDY odstraní pending action — i pokud 2. selhal!
  await offlineStorage.removePendingAction(action.id);
  
  // 4. NIKDY nevolá DRAFT→PENDING transition (stejný bug jako BUG 1)
}
```

**Dva problémy:**
- a) Photo upload failure → action removed → vehicle bez fotek, žádný retry
- b) DRAFT→PENDING transition chybí i v offline sync flow

**Sekundární problém:** Pokud user smaže browser data (Clear Site Data) mezi offline submit a online sync, blobs v IndexedDB zmizí → `uploadDraftPhotos` nenajde blobs → žádné fotky.

---

### BUG 3: Duplicate submission — draft lze odeslat vícekrát (HIGH)

**Symptom:** Broker klikne "Odeslat", síť je pomalá, klikne znovu → 2 requesty → 2 vehicles (pokud VIN unique constraint neprojde, dostane 409 error ale žádné jasné UI).

**Root cause v `ReviewStep.tsx`:**
- `handleSubmit()` nastaví `submitting = true` → disable button (OK pro double-click)
- **ALE:** Pokud se stránka refreshne nebo broker naviguje zpět a znovu vpřed, `submitting` se resetuje
- Draft status se změní na "submitted" **AŽ PO** úspěšném POST, ne PŘED
- Žádná kontrola `if (draft.status === "submitted") return` na začátku handleSubmit

**Offline varianta:**
- Pending action má ID `submit_${draft.id}` → pokud se přidá dvakrát se stejným ID, IndexedDB přepíše první (upsert), takže duplicita se nestane. **Offline je OK.**
- **Online je problém** — žádná guard.

---

### BUG 4: Chybí status indikace po odeslání (MEDIUM)

**Symptom:** Success page říká "Odesláno ke schválení!" ale:
- V seznamu vozidel (`/makler/vehicles`) se vehicle ukazuje jako "DRAFT" (protože BUG 1)
- I kdyby PENDING fungovalo, v seznamu chybí jasný badge "Čeká na schválení"
- Broker neví jestli admin už vozidlo viděl

**Kde v kódu:**
- `components/pwa/vehicles/VehicleList.tsx` — zobrazuje status badge
- Chybí PENDING state styling a messaging

---

### BUG 5: Inspection fotky se nenahrají na server (MEDIUM)

**Symptom:** Broker nafotí defekty a kola v inspection step → fotky jsou v IndexedDB → ReviewStep uploadne jen "listing" fotky z PhotosStep → inspection fotky (defekty, kola) zůstanou jen lokálně.

**Root cause:**
- `ReviewStep.tsx` volá `uploadDraftPhotos(draftId, draft.photos.photos)` — to jsou jen fotky z PhotosStep (ext, int, engine, evidence)
- `draft.inspection.defects[].imageId` — defekt fotky v IndexedDB, ale nejsou v `draft.photos.photos` poli
- `draft.inspection.wheelPhotos.{LP,PP,LZ,PZ}` — wheel fotky v IndexedDB, ale nejsou v photo upload flow
- `inspectionData` se uloží jako JSON string do `Vehicle.inspectionData`, ale s lokálními imageId referencemi, ne Cloudinary URL

**Dopad:** Admin vidí inspection data s odkazem na neexistující obrázky. Defekt fotky existují jen v broker's browseru.

---

## NAVRHOVANÁ ŘEŠENÍ

### FIX 1: DRAFT→PENDING transition po odeslání

**Soubory k editaci:**
- `components/pwa/vehicles/new/ReviewStep.tsx`
- `components/pwa/OnlineSync.tsx`

**Implementace (ReviewStep.tsx — online flow):**
```typescript
// Po úspěšném POST /api/vehicles + POST /api/vehicles/{id}/images:
// PŘIDAT:
const statusRes = await fetch(`/api/vehicles/${vehicleId}/status`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "PENDING" }),
});

if (!statusRes.ok) {
  // Vehicle vytvořen ale nepřepnut — logovat ale nepřerušovat
  console.error("Failed to transition to PENDING:", await statusRes.text());
  // Neblokovat success — vehicle je vytvořen, admin může přepnout ručně
}
```

**Implementace (OnlineSync.tsx — offline sync flow):**
```typescript
// Po úspěšném POST /api/vehicles + photo upload:
// PŘIDAT stejný PATCH call
await fetch(`/api/vehicles/${vehicleId}/status`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "PENDING" }),
});
```

**Fallback:** Pokud PENDING transition selže, vehicle zůstane DRAFT. To je OK — admin může v BackOffice ručně přepnout. Lepší než blokovat celé odeslání.

---

### FIX 2: Offline sync — atomic operation + retry

**Soubory k editaci:**
- `components/pwa/OnlineSync.tsx`

**Implementace — rozdělit sync na kroky s retry:**

```typescript
for (const action of vehicleActions) {
  const { _draftId, _photos, ...vehiclePayload } = action.payload;
  
  try {
    // KROK 1: Vytvoř vehicle
    const vehicleRes = await fetch("/api/vehicles", {
      method: "POST",
      body: JSON.stringify(vehiclePayload),
    });
    
    if (!vehicleRes.ok) {
      if (vehicleRes.status === 409) {
        // VIN duplicita — odstraň pending action, vehicle už existuje
        await offlineStorage.removePendingAction(action.id);
        continue;
      }
      // Jiná chyba — NEODSTRAŇUJ pending action, zkusí se znovu
      action.retries = (action.retries || 0) + 1;
      if (action.retries > 3) {
        // Max retry — notify user
        await createNotification("Nepodařilo se odeslat vozidlo. Zkuste to ručně.");
        await offlineStorage.removePendingAction(action.id);
      }
      continue; // Přeskoč, zkusí se příště
    }
    
    const { vehicle } = await vehicleRes.json();
    const vehicleId = vehicle.id;
    
    // KROK 2: Upload fotky
    let photosOk = true;
    if (_draftId && _photos?.length > 0) {
      try {
        const imageUrls = await uploadDraftPhotos(_draftId, _photos);
        if (imageUrls.length > 0) {
          await fetch(`/api/vehicles/${vehicleId}/images`, {
            method: "POST",
            body: JSON.stringify({ images: imageUrls }),
          });
        }
      } catch (photoErr) {
        console.error("Photo upload failed:", photoErr);
        photosOk = false;
        // NEODSTRAŇUJ pending action — ale ulož vehicleId pro retry
        // Updatuj payload s vehicleId pro příští pokus
      }
    }
    
    // KROK 3: DRAFT→PENDING
    await fetch(`/api/vehicles/${vehicleId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING" }),
    });
    
    // KROK 4: Cleanup — jen pokud VŠE prošlo
    if (photosOk) {
      await offlineStorage.removePendingAction(action.id);
      // Update draft
      const draft = await offlineStorage.getDraft(_draftId);
      if (draft) {
        await offlineStorage.saveDraft(_draftId, {
          ...draft.data,
          serverId: vehicleId,
          status: "submitted",
        });
      }
    }
  } catch (err) {
    console.error("Vehicle sync error:", err);
    // Pending action zůstane — retry při dalším online event
  }
}
```

**Klíčové změny:**
- Pending action se odstraní POUZE pokud VŠECHNY kroky prošly
- 409 (VIN duplicita) → action cleanup (vehicle existuje)
- Max 3 retry pokusy, pak notifikace uživateli
- Photo failure nezabrání vehicle creation, ale action zůstane pro retry

---

### FIX 3: Duplicate submission prevention

**Soubory k editaci:**
- `components/pwa/vehicles/new/ReviewStep.tsx`
- `lib/hooks/useDraft.ts` (optional — draft guard)

**Implementace:**

```typescript
// Na začátku handleSubmit():
const handleSubmit = async () => {
  // GUARD 1: Draft already submitted
  if (draft.status === "submitted" || draft.status === "pending_sync") {
    setError("Toto vozidlo již bylo odesláno.");
    return;
  }
  
  // GUARD 2: Prevent double-click (existing)
  if (submitting) return;
  setSubmitting(true);
  
  // GUARD 3: Mark draft IMMEDIATELY before POST
  updateStatus("pending_sync"); // Prevent resubmit on page refresh
  await saveDraft(); // Persist to IndexedDB
  
  try {
    // ... existing POST logic ...
    
    // Po úspěšném POST:
    updateStatus("submitted");
    await saveDraft();
  } catch (err) {
    // Rollback draft status on failure
    updateStatus("draft");
    await saveDraft();
    setSubmitting(false);
    throw err;
  }
};
```

**Klíčové změny:**
- Check `draft.status` na začátku — reject pokud "submitted" nebo "pending_sync"
- Set "pending_sync" PŘED POST requestem — persistent guard přes page refresh
- Rollback na "draft" pokud POST selže — allow retry

**UI guard:**
```typescript
// V ReviewStep renderingu:
{draft.status === "submitted" && (
  <Alert variant="info">
    Toto vozidlo bylo úspěšně odesláno ke schválení.
    <Link href={`/makler/vehicles/${draft.serverId}`}>Zobrazit detail</Link>
  </Alert>
)}

{draft.status === "pending_sync" && (
  <Alert variant="warning">
    Vozidlo čeká na odeslání (offline). Bude odesláno automaticky.
  </Alert>
)}
```

---

### FIX 4: Status indikace v UI

**Soubory k editaci:**
- `components/pwa/vehicles/VehicleList.tsx` (nebo ekvivalent)
- `components/pwa/vehicles/VehicleStatusBadge.tsx` (nový nebo edit)

**Implementace:**

```typescript
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  DRAFT: { label: "Rozpracováno", color: "bg-gray-100 text-gray-700", icon: "📝" },
  DRAFT_QUICK: { label: "Quick draft", color: "bg-gray-100 text-gray-700", icon: "⚡" },
  PENDING: { label: "Čeká na schválení", color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
  REJECTED: { label: "Vráceno", color: "bg-red-100 text-red-700", icon: "↩️" },
  ACTIVE: { label: "Aktivní", color: "bg-green-100 text-green-700", icon: "✅" },
  RESERVED: { label: "Rezervováno", color: "bg-blue-100 text-blue-700", icon: "🔒" },
  SOLD: { label: "Prodáno", color: "bg-purple-100 text-purple-700", icon: "🤝" },
  ARCHIVED: { label: "Archiv", color: "bg-gray-200 text-gray-500", icon: "📦" },
};
```

**Po úspěšném odeslání (success page messaging):**
- Online: "Odesláno ke schválení! BackOffice zkontroluje a schválí." ✅ (existuje)
- Offline: "Uloženo. Bude odesláno automaticky, až budete online." ✅ (existuje)
- **PŘIDAT:** "Stav můžete sledovat v seznamu vozidel." + link

**V seznamu vozidel:**
- PENDING badge: žlutý s textem "Čeká na schválení"
- REJECTED badge: červený s textem "Vráceno" + důvod rejection (tooltip)

---

### FIX 5: Inspection fotky — nahrát na server

**Soubory k editaci:**
- `components/pwa/vehicles/new/ReviewStep.tsx`
- `lib/offline/upload-photos.ts` (rozšířit)
- `components/pwa/OnlineSync.tsx`

**Implementace:**

ReviewStep.tsx — po vehicle creation, uploadnout i inspection fotky:

```typescript
// KROK A: Upload listing photos (existující flow)
const listingImageUrls = await uploadDraftPhotos(draftId, draft.photos.photos);
await fetch(`/api/vehicles/${vehicleId}/images`, {
  method: "POST",
  body: JSON.stringify({ images: listingImageUrls }),
});

// KROK B: Upload inspection photos (NOVÉ)
const inspectionImageIds: string[] = [];

// B1: Defect photos
if (draft.inspection?.defects?.length) {
  for (const defect of draft.inspection.defects) {
    if (defect.imageId) inspectionImageIds.push(defect.imageId);
  }
}

// B2: Wheel photos
if (draft.inspection?.wheelPhotos) {
  const wp = draft.inspection.wheelPhotos;
  for (const key of ["LP", "PP", "LZ", "PZ"] as const) {
    if (wp[key]) inspectionImageIds.push(wp[key]);
  }
}

// B3: Upload all inspection images
if (inspectionImageIds.length > 0) {
  const inspectionUploaded = await uploadImagesByIds(draftId, inspectionImageIds);
  // inspectionUploaded = Map<localId, cloudinaryUrl>
  
  // B4: Replace local IDs with Cloudinary URLs in inspectionData
  const updatedInspection = replaceLocalIdsWithUrls(
    draft.inspection,
    inspectionUploaded
  );
  
  // B5: Save updated inspectionData to vehicle
  await fetch(`/api/vehicles/${vehicleId}`, {
    method: "PATCH",
    body: JSON.stringify({ inspectionData: JSON.stringify(updatedInspection) }),
  });
}
```

**Nová helper funkce v `lib/offline/upload-photos.ts`:**

```typescript
export async function uploadImagesByIds(
  draftId: string,
  imageIds: string[],
  onProgress?: (uploaded: number, total: number) => void,
): Promise<Map<string, string>> {
  const allImages = await offlineStorage.getImages(draftId);
  const imageMap = new Map(allImages.map(img => [img.id, img.blob]));
  const result = new Map<string, string>(); // localId → cloudinaryUrl
  
  let uploaded = 0;
  for (const id of imageIds) {
    const blob = imageMap.get(id);
    if (!blob) continue;
    
    const formData = new FormData();
    formData.append("file", blob, `${id}.jpg`);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const { url } = await res.json();
    result.set(id, url);
    
    uploaded++;
    onProgress?.(uploaded, imageIds.length);
  }
  
  return result;
}

function replaceLocalIdsWithUrls(
  inspection: InspectionData,
  urlMap: Map<string, string>,
): InspectionData {
  const updated = { ...inspection };
  
  // Replace defect imageIds
  if (updated.defects) {
    updated.defects = updated.defects.map(d => ({
      ...d,
      imageId: d.imageId ? (urlMap.get(d.imageId) || d.imageId) : undefined,
      imageUrl: d.imageId ? urlMap.get(d.imageId) : undefined, // Add explicit URL field
    }));
  }
  
  // Replace wheel photo IDs
  if (updated.wheelPhotos) {
    for (const key of ["LP", "PP", "LZ", "PZ"] as const) {
      const localId = updated.wheelPhotos[key];
      if (localId && urlMap.has(localId)) {
        updated.wheelPhotos[key] = urlMap.get(localId)!;
      }
    }
  }
  
  return updated;
}
```

**Offline sync:** Stejný pattern — `_inspectionImageIds` přidat do pending action payload, uploadnout během sync.

---

## IMPLEMENTACE — FÁZE A POŘADÍ

### Fáze 1: DRAFT→PENDING + duplicate guard (CRITICAL)

| # | Co | Soubor | Akce |
|---|---|--------|------|
| 1.1 | Přidat PENDING transition po POST | `components/pwa/vehicles/new/ReviewStep.tsx` | +PATCH call po úspěšném vehicle creation |
| 1.2 | Přidat PENDING transition do sync | `components/pwa/OnlineSync.tsx` | +PATCH call po offline sync |
| 1.3 | Duplicate guard — check draft status | `components/pwa/vehicles/new/ReviewStep.tsx` | Guard na "submitted"/"pending_sync" |
| 1.4 | Duplicate guard — early status set | `components/pwa/vehicles/new/ReviewStep.tsx` | Set "pending_sync" PŘED POST |

### Fáze 2: Offline sync robustnost (CRITICAL)

| # | Co | Soubor | Akce |
|---|---|--------|------|
| 2.1 | Atomic sync — don't remove on partial failure | `components/pwa/OnlineSync.tsx` | Refaktor sync loop s error handling |
| 2.2 | Retry s max attempts | `components/pwa/OnlineSync.tsx` | Counter + notification při max retry |
| 2.3 | 409 VIN handling | `components/pwa/OnlineSync.tsx` | Graceful handling duplicitních VIN |

### Fáze 3: Status indikace (HIGH)

| # | Co | Soubor | Akce |
|---|---|--------|------|
| 3.1 | Vehicle status badge update | `components/pwa/vehicles/VehicleStatusBadge.tsx` nebo inline | PENDING/REJECTED styling |
| 3.2 | Submitted draft UI | `components/pwa/vehicles/new/ReviewStep.tsx` | Alert pro already-submitted drafts |
| 3.3 | Success page link | `app/(pwa)/makler/vehicles/new/success/page.tsx` | Link na seznam vozidel |

### Fáze 4: Inspection photos upload (MEDIUM)

| # | Co | Soubor | Akce |
|---|---|--------|------|
| 4.1 | Upload helper pro image IDs | `lib/offline/upload-photos.ts` | +`uploadImagesByIds()` funkce |
| 4.2 | Replace local IDs helper | `lib/offline/upload-photos.ts` | +`replaceLocalIdsWithUrls()` funkce |
| 4.3 | Inspection photo upload v ReviewStep | `components/pwa/vehicles/new/ReviewStep.tsx` | Upload defect + wheel photos |
| 4.4 | Inspection photo upload v OnlineSync | `components/pwa/OnlineSync.tsx` | Same flow pro offline sync |
| 4.5 | Inspection image IDs v pending payload | `components/pwa/vehicles/new/ReviewStep.tsx` | `_inspectionImageIds` pole v offline payload |

---

## SOUBORY — KOMPLETNÍ SEZNAM

### Editované soubory (5)

| # | Soubor | Bug(y) | Popis změn |
|---|--------|--------|------------|
| 1 | `components/pwa/vehicles/new/ReviewStep.tsx` | 1,3,4,5 | PENDING transition, duplicate guard, inspection photos upload |
| 2 | `components/pwa/OnlineSync.tsx` | 1,2,5 | PENDING transition, atomic sync, retry, inspection photos |
| 3 | `lib/offline/upload-photos.ts` | 5 | +uploadImagesByIds(), +replaceLocalIdsWithUrls() |
| 4 | `app/(pwa)/makler/vehicles/new/success/page.tsx` | 4 | Link na seznam vozidel |
| 5 | Vehicle status badge component | 4 | PENDING/REJECTED badge styling |

### Nové soubory (0)

Žádné nové soubory — vše jsou úpravy existujících.

---

## STOP PRAVIDLA

- **STOP-1:** NEMĚNIT `POST /api/vehicles` — vehicle se MUSÍ vytvářet jako DRAFT. Transition na PENDING je separátní krok (defense in depth — admin vždy vidí že vehicle prošlo review flow).
- **STOP-2:** NEMĚNIT `PATCH /api/vehicles/[id]/status` — status transition endpoint je správně. Problém je v klientovi, ne API.
- **STOP-3:** NEMĚNIT Prisma schema — žádné nové fieldy nepotřebujeme. `inspectionData` JSON field už existuje.
- **STOP-4:** NEMĚNIT PhotosStep ani InspectionStep — capture flow funguje správně. Problém je v upload flow při submission.
- **STOP-5:** NEODSTRAŇOVAT pending action z IndexedDB pokud photo upload selže. Vehicle bez fotek je HORŠÍ než retry.
- **STOP-6:** NEMĚNIT VIN uniqueness constraint — je to správný safety net.
- **STOP-7:** NEMĚNIT service worker sync handlers — client-side OnlineSync je jednodušší a dostatečný pro vehicle sync. SW sync zůstane jen pro contacts.
- **STOP-8:** NEMĚNIT admin approval flow (`/api/admin/vehicles/[id]/approve`) — funguje správně.

---

## EDGE CASES A POZNÁMKY PRO IMPLEMENTÁTORA

### 1. Race condition: PATCH PENDING po PATCH status jinde
Vehicle by mohl být mezitím přepnut jinam (např. admin ho vidí v BackOffice a přepne). Proto:
```typescript
const statusRes = await fetch(`/api/vehicles/${vehicleId}/status`, { ... });
if (!statusRes.ok) {
  // Logovat ale NEBLOKOVAT success flow
  // Vehicle existuje, admin to vyřeší
}
```

### 2. Offline sync — vehicleId persistence
Pokud vehicle creation projde ale photo upload selže:
- Pending action MUSÍ být updatována s `vehicleId` (aby retry nepokusil vytvořit nové vehicle)
- Přidat do pending action payload: `_vehicleId?: string`
- Při retry: pokud `_vehicleId` existuje, přeskočit POST a pokračovat od photo upload

### 3. Progress indikace při sync
Aktuálně `OnlineSync` tichý. Přidat:
- Toast notification: "Synchronizuji vozidlo..." → "Nahrávám fotky (5/13)..." → "Odesláno ke schválení!"
- Nebo: notifikace do Notification modelu

### 4. Draft cleanup timing
Po úspěšném submit + PENDING transition:
- Draft status → "submitted" (existující)
- Draft NEMAZAT hned — broker může chtít vidět co odeslal
- Auto-cleanup: po 7 dnech smazat submitted drafts z IndexedDB (future improvement)

### 5. Inspection photo velikost
Defect + wheel photos mohou být velké (JPEG z kamery). Ověřit že `resizeImage()` se aplikuje i na inspection fotky, nejen listing fotky.

### 6. Backward compatibility
Existující vehicles v DRAFT stavu (vytvořené před fixem) nemají PENDING transition. Admin je uvidí v DRAFT stavu. To je OK — mohou ručně přepnout.

### 7. Checklist validace
ReviewStep má 10-položkový checklist. Ověřit že VŠECHNY items musí projít před submit buttonem. Aktuální items:
1. VIN zadán
2. Značka a model
3. Rok a nájezd
4. Palivo a převodovka
5. Stav vozidla
6. Cena
7. Minimálně 13 fotek
8. Evidence fotky (tachometr, VIN, klíče)
9. Kontakt na prodejce
10. Popis nebo výbava

---

## ACCEPTANCE CRITERIA

- [ ] Po kliknutí "Odeslat ke schválení" (online) se vehicle přepne na PENDING
- [ ] Admin vidí vehicle v BackOffice jako PENDING ke schválení
- [ ] Offline submit → online sync → vehicle je PENDING (ne DRAFT)
- [ ] Pokud photo upload selže během sync, pending action ZŮSTANE pro retry
- [ ] Pokud photo upload selže 3x, broker dostane notifikaci
- [ ] Draft se nelze odeslat dvakrát (guard na "submitted"/"pending_sync")
- [ ] Po page refresh se submit guard drží (persisted v IndexedDB)
- [ ] V seznamu vozidel: PENDING má žlutý badge "Čeká na schválení"
- [ ] V seznamu vozidel: REJECTED má červený badge "Vráceno"
- [ ] Defect fotky z inspection step se nahrají na Cloudinary
- [ ] Wheel fotky z inspection step se nahrají na Cloudinary
- [ ] inspectionData JSON obsahuje Cloudinary URLs místo lokálních imageId
- [ ] Success page obsahuje link na seznam vozidel
- [ ] `npm run build` projde
- [ ] Existující vehicles v DRAFT stavu nejsou ovlivněny (backward compatible)
