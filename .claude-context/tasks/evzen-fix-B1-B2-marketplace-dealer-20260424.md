# Evzen verdikt: FIX B1+B2 — Marketplace dealer detail
**Datum:** 2026-04-24
**Verdikt: SCHVALENO**

---

## Kontrola proti DOSLOVNEMU zadani

### B1: "Označit jako dokončené" + "Aktualizovat fotky" — žádný onClick handler
**Verdikt: SPLNENO**

- `DealerFlipDetail.tsx:287-294` — "Označit jako dokončené" tlačítko:
  - `onClick={handleMarkComplete}` ✅
  - `disabled={status !== "IN_REPAIR" || updating}` — správný guard ✅
  - Loading state: `{updating ? "Ukládám..." : "Označit jako dokončené"}` ✅
  - Handler (ř. 101-125): PUT `{ status: "FOR_SALE" }` → lokální state update ✅

- `DealerFlipDetail.tsx:295-302` — "Aktualizovat fotky" tlačítko:
  - `onClick={() => fileInputRef.current?.click()}` ✅
  - `disabled={uploading}` ✅
  - Loading state: `{uploading ? "Nahrávám..." : "Aktualizovat fotky"}` ✅

### B2: Oblast "Fotky z opravy" — UI placeholder bez file inputu
**Verdikt: SPLNENO**

- `DealerFlipDetail.tsx:137-144` — Hidden file input:
  - `type="file" multiple accept="image/jpeg,image/png,image/webp"` ✅
  - `ref={fileInputRef}` ✅
  - `onChange={handleFileChange}` s reset `e.target.value = ""` ✅

- Upload handler (ř. 55-99):
  - Iteruje soubory, POST na `/api/upload` s `upload_preset: "marketplace"` ✅
  - PUT na `/api/marketplace/opportunities/${flipDetail.id}` s `{ repairPhotos: allPhotos }` ✅
  - Okamžité zobrazení: `setRepairPhotos(allPhotos)` ✅

- Upload area — prázdný stav (ř. 204-217): "Nahrát fotky" s onClick ✅
- Upload area — s fotkami (ř. 219-237): Grid 3 sloupce + "Přidat další fotky" ✅

---

## Podpůrné změny

### Upload preset "marketplace"
- `app/api/upload/route.ts:21` — `marketplace: { folder: "carmakler/marketplace", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true }` ✅

### PUT API rozšíření
- `app/api/marketplace/opportunities/[id]/route.ts`:
  - `DEALER_EDITABLE_STATUSES = ["PENDING_APPROVAL", "IN_REPAIR", "FOR_SALE"]` ✅
  - Field guard: v IN_REPAIR/FOR_SALE dealer smí jen `repairPhotos`, `repairDescription`, `status` ✅
  - Status transition: pouze IN_REPAIR → FOR_SALE pro dealera ✅

### Server/Client split
- `page.tsx` — thin Server Component wrapper s `export const metadata` ✅
- `DealerFlipDetail.tsx` — client component s veškerou interaktivitou ✅

---

## Kontrola Evzenova pravidel

| Pravidlo | Vysledek |
|---|---|
| Zadne zkratky v UI | SPLNENO — "Označit jako dokončené", "Aktualizovat fotky", "Nahrát fotky" |
| Nedokoncene funkce oznaceny | N/A — obe funkce plne funkcni |
| Nic se neschovava | SPLNENO — upload + status buttons pristupne |
| Nic se nemaze bez schvaleni | N/A |

---

**CELKOVY VERDIKT: SCHVALENO**
Oba blockery (B1 onClick handlery + B2 photo upload) plne opraveny. API spravne omezuje co dealer muze delat v kazdem stavu. Build PASS.
