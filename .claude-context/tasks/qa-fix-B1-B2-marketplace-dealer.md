# QA Report: FIX B1+B2 — Marketplace Dealer Detail (onClick + Photo Upload)

**Task:** #24  
**Commit:** 7b1c149  
**Kontrolor:** KONTROLOR agent  
**Datum:** 2026-04-24  
**Plán:** `.claude-context/tasks/plan-fix-B1-B2-marketplace-dealer.md`

---

## VERDIKT: ✅ PASS — Všechna AC splněna

---

## 1. Přehled změn (4 soubory)

| # | Soubor | Akce | Stav |
|---|--------|------|------|
| 1 | `app/api/upload/route.ts` | +1 řádek: preset "marketplace" | ✅ |
| 2 | `app/api/marketplace/opportunities/[id]/route.ts` | Rozšíření dealer permissions + field guard + status transition | ✅ |
| 3 | `components/web/marketplace/DealerFlipDetail.tsx` | Nový client component (309 řádků) | ✅ |
| 4 | `app/(web)/marketplace/dealer/[id]/page.tsx` | Thin server wrapper (~60 řádků) | ✅ |

---

## 2. Build

```
npm run build → ✅ PASS
TypeScript: OK, žádné errory
```

---

## 3. Kontrola jednotlivých souborů

### 3a. `app/api/upload/route.ts` — preset "marketplace"

```ts
marketplace: { folder: "carmakler/marketplace", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
```

✅ Přidán na správném místě v `PRESETS` objektu.  
✅ `allowedTypes: ALLOWED_IMAGE_TYPES` odpovídá JPEG/PNG/WebP — konzistentní s accept atributem na file inputu.  
✅ `watermark: true` — Cloudinary watermark aktivní pro marketplace fotky.

---

### 3b. `app/api/marketplace/opportunities/[id]/route.ts` — PUT handler

**Dealer editable statuses (ř. 138):**
```ts
const DEALER_EDITABLE_STATUSES = ["PENDING_APPROVAL", "IN_REPAIR", "FOR_SALE"];
if (!isAdmin && !DEALER_EDITABLE_STATUSES.includes(opportunity.status)) {
```
✅ Rozšíření z původního `!== "PENDING_APPROVAL"` na array — dealer nyní může editovat v IN_REPAIR/FOR_SALE.

**Field restriction guard (ř. 150-159):**
```ts
if (!isAdmin && opportunity.status !== "PENDING_APPROVAL") {
  const allowedFields = ["repairPhotos", "repairDescription", "status"];
  const bodyKeys = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined);
  const forbidden = bodyKeys.filter(k => !allowedFields.includes(k));
  if (forbidden.length > 0) {
    return NextResponse.json({ error: `V tomto stavu nelze měnit: ${forbidden.join(", ")}` }, { status: 400 });
  }
}
```
✅ Dealer nemůže měnit brand/model/price apod. v IN_REPAIR/FOR_SALE — ochrana integrity dat.

**Status transition (ř. 187-196):**
```ts
if (!isAdmin && data.status !== undefined) {
  if (opportunity.status === "IN_REPAIR" && data.status === "FOR_SALE") {
    updateData.status = data.status;
  } else {
    return NextResponse.json({ error: "Nemáte oprávnění měnit stav" }, { status: 403 });
  }
}
```
✅ Povoluje pouze IN_REPAIR → FOR_SALE pro dealera. Vše ostatní → 403.

---

### 3c. `components/web/marketplace/DealerFlipDetail.tsx` — Client Component

**Direktiva a imports:**
```tsx
"use client";
```
✅ Správně označen jako client component.

**State:**
```tsx
const [repairPhotos, setRepairPhotos] = useState<string[]>(flipDetail.repairPhotos);
const [status, setStatus] = useState<FlipStep>(flipDetail.status);
const [uploading, setUploading] = useState(false);
const [updating, setUpdating] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
```
✅ Kompletní state management — všechny potřebné proměnné.

**handlePhotoUpload (ř. 55-99):**
- Iteruje soubory, POST na `/api/upload` s `upload_preset: "marketplace"` a `subfolder: flipDetail.id` ✅
- PUT na `/api/marketplace/opportunities/${flipDetail.id}` s `{ repairPhotos: allPhotos }` ✅
- `setRepairPhotos(allPhotos)` — okamžité zobrazení bez page refresh ✅
- `setUploading(true/false)` — loading state ✅
- try/catch s `setError` ✅

**handleMarkComplete (ř. 101-125):**
- PUT `{ status: "FOR_SALE" }` ✅
- `setStatus("FOR_SALE")` — lokální update ✅
- `setUpdating(true/false)` — loading state ✅
- try/catch s `setError` ✅

**Hidden file input (ř. 137-144):**
```tsx
<input
  ref={fileInputRef}
  type="file"
  multiple
  accept="image/jpeg,image/png,image/webp"
  className="hidden"
  onChange={handleFileChange}
/>
```
✅ Multiple, správné MIME types, hidden, ref propojený.

**Button "Označit jako dokončené" (ř. 287-294):**
```tsx
<Button
  variant="primary"
  className="w-full"
  onClick={handleMarkComplete}
  disabled={status !== "IN_REPAIR" || updating}
>
  {updating ? "Ukládám..." : "Označit jako dokončené"}
</Button>
```
✅ onClick napojený, disabled podmínka správná, loading text.

**Upload area — prázdný stav (ř. 204-217):**
```tsx
<Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
  {uploading ? "Nahrávám..." : "Nahrát fotky"}
</Button>
```
✅ onClick otevře file picker.

**Upload area — s fotkami (ř. 219-237):**
```tsx
<div className="grid grid-cols-3 gap-3">
  {repairPhotos.map((url, i) => (
    <div key={i} className="relative aspect-square">
      <Image src={url} alt={`Oprava ${i + 1}`} fill className="rounded-lg object-cover" sizes="33vw" />
    </div>
  ))}
</div>
<Button variant="outline" size="sm" className="mt-3"
  onClick={() => fileInputRef.current?.click()} disabled={uploading}>
  {uploading ? "Nahrávám..." : "Přidat další fotky"}
</Button>
```
✅ Grid 3 sloupce, Image component, "Přidat další" tlačítko pod gridem.

**Error/Success messages (ř. 275-283):**
```tsx
{error && <div className="bg-red-50 text-red-700 ...">{error}</div>}
{success && <div className="bg-green-50 text-green-700 ...">{success}</div>}
```
✅ Inline nad tlačítky.

---

### 3d. `app/(web)/marketplace/dealer/[id]/page.tsx` — Server Wrapper

```tsx
export const metadata: Metadata = {
  title: "Detail flipu | Realizátor | Marketplace",
  robots: { index: false, follow: false },
};

export default async function DealerFlipDetailPage({ params }) {
  const { id } = await params;
  // Prisma query s include investments.investor
  // JSON.parse photos + repairPhotos
  // Construct flipDetail object
  return <DealerFlipDetail flipDetail={flipDetail} />;
}
```
✅ `export const metadata` zachováno — funguje jako Server Component.  
✅ Prisma query s potřebnými include.  
✅ JSON.parse pro photos/repairPhotos.  
✅ `notFound()` fallback.  
✅ Předává typovaný `flipDetail` object do DealerFlipDetail.

---

## 4. Acceptance Criteria — Výsledek

| AC | Popis | Výsledek |
|----|-------|---------|
| AC-1 | "Nahrát fotky" otevře file picker | ✅ `fileInputRef.current?.click()` |
| AC-2 | Fotky nahrány přes `/api/upload` preset "marketplace" | ✅ |
| AC-3 | URLs uloženy do DB přes PUT API | ✅ `{ repairPhotos: allPhotos }` |
| AC-4 | Nahrané fotky okamžitě v gridu | ✅ `setRepairPhotos(allPhotos)` |
| AC-5 | "Označit jako dokončené" → IN_REPAIR → FOR_SALE | ✅ PUT `{ status: "FOR_SALE" }` |
| AC-6 | Tlačítko disabled pokud status !== IN_REPAIR | ✅ `disabled={status !== "IN_REPAIR" || updating}` |
| AC-7 | "Aktualizovat fotky" otevře file picker | ✅ sidebar button + upload area button |
| AC-8 | Loading states na tlačítkách | ✅ uploading/updating states |
| AC-9 | Error message inline při selhání | ✅ `setError(...)` + červený div |
| AC-10 | Success message po úspěchu | ✅ `setSuccess(...)` + zelený div |
| AC-11 | Auth: owner dealer + admin (middleware + API) | ✅ middleware + PUT route |
| AC-12 | Metadata export funguje (Server Component wrapper) | ✅ |

---

## 5. Drobné poznámky (nekritické)

1. **handleFileChange reset:** `e.target.value = ""` po uploadu — správně, umožňuje re-upload stejného souboru.
2. **useCallback deps:** `handlePhotoUpload` má `[flipDetail.id, repairPhotos]` v deps — repairPhotos closure je nutná pro `[...repairPhotos, ...uploadedUrls]`. Správně.
3. **Success message wording:** `uploadedUrls.length === 1 ? "fotka" : "fotek"` — správná čeština (1 fotka, 2 fotek).
4. **Image sizes:** `sizes="33vw"` pro grid (3 sloupce) — přijatelné, mohlo by být `(max-width: 768px) 33vw, 22vw` pro desktop přesnost, ale není blocker.

---

## 6. Souhrn

Implementace plně odpovídá plánu. Všechny 4 soubory jsou správně upraveny. Build projde. Všechna acceptance criteria splněna. Žádné bezpečnostní ani funkční problémy.

**VERDIKT: ✅ PASS — Připraveno k evžen review**
