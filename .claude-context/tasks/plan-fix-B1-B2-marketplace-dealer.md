# Plan: FIX B1+B2 — Marketplace dealer detail onClick handlery + photo upload

**Task:** #24
**Blocker IDs:** B1, B2 z audit-deep-stubs-broken-20260424.md
**Soubor:** `app/(web)/marketplace/dealer/[id]/page.tsx`
**Autor:** Plánovač
**Datum:** 2026-04-24

---

## ANALÝZA STÁVAJÍCÍHO STAVU

### Co existuje a funguje:
1. **PUT API** (`app/api/marketplace/opportunities/[id]/route.ts`) — plně funkční:
   - Přijímá `status`, `repairPhotos` (array URL stringů), a další pole
   - Auth: VERIFIED_DEALER (owner) nebo ADMIN
   - Validace přes `updateOpportunitySchema` (Zod) — `repairPhotos: z.array(z.string().url()).optional()` ✅
   - **Bug:** Dealer může updatovat jen v `PENDING_APPROVAL` stavu (ř. 138) — ale v `IN_REPAIR` potřebuje nahrát repair photos a posunout na `FOR_SALE`

2. **Upload API** (`app/api/upload/route.ts`) — plně funkční:
   - Univerzální endpoint, FormData: `file` + `upload_preset` + `subfolder`
   - Max 10MB, JPEG/PNG/WebP
   - **Chybí preset "marketplace"** — je třeba přidat do `PRESETS` objektu (ř. 11-21)

3. **Prisma schema** (`FlipOpportunity`):
   - `repairPhotos String?` — JSON array of URLs ✅
   - `status String` — PENDING_APPROVAL → APPROVED → FUNDING → FUNDED → IN_REPAIR → FOR_SALE → SOLD → COMPLETED ✅

4. **Middleware** — `/marketplace/dealer/*` vyžaduje auth + VERIFIED_DEALER/ADMIN role ✅

5. **Page** — Server Component (async function, exportuje `metadata`) — **musí se rozdělit** na server + client část pro interaktivitu

### Co je broken:

| # | Problém | Řádek | Stav |
|---|---------|-------|------|
| B1 | Tlačítka "Označit jako dokončené" + "Aktualizovat fotky" | 181-186 | Žádný onClick |
| B2 | Upload oblast pro repair photos | 126-136 | UI-only placeholder, žádný file input |
| X1 | Upload preset "marketplace" | upload/route.ts | Chybí v PRESETS |
| X2 | Dealer nemůže updatovat v IN_REPAIR stavu | opportunities/[id]/route.ts:138 | Příliš restriktivní podmínka |

---

## IMPLEMENTAČNÍ PLÁN (5 kroků)

### Krok 1: Přidat upload preset "marketplace"

**Soubor:** `app/api/upload/route.ts`
**Řádek:** ~21 (za `cover` preset)
**Akce:** Přidat 1 řádek do `PRESETS`:

```ts
marketplace: { folder: "carmakler/marketplace", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
```

---

### Krok 2: Opravit PUT API — povolit dealer update v IN_REPAIR/FOR_SALE

**Soubor:** `app/api/marketplace/opportunities/[id]/route.ts`

**2a) Řádek 138** — Rozšířit editovatelné stavy pro dealera:

Změnit z:
```ts
if (!isAdmin && opportunity.status !== "PENDING_APPROVAL") {
```
na:
```ts
const DEALER_EDITABLE_STATUSES = ["PENDING_APPROVAL", "IN_REPAIR", "FOR_SALE"];
if (!isAdmin && !DEALER_EDITABLE_STATUSES.includes(opportunity.status)) {
```

**2b) Za řádek 168** (za `if (isAdmin && data.adminNotes...)`) — Přidat dealer status transition:

```ts
// Dealer může posunout status: IN_REPAIR → FOR_SALE (oprava dokončena)
if (!isAdmin && data.status !== undefined) {
  if (opportunity.status === "IN_REPAIR" && data.status === "FOR_SALE") {
    updateData.status = data.status;
  } else {
    return NextResponse.json(
      { error: "Nemáte oprávnění měnit stav" },
      { status: 403 }
    );
  }
}
```

**2c) Omezit co dealer smí editovat v IN_REPAIR/FOR_SALE:**

Po `PENDING_APPROVAL` by dealer neměl měnit brand/model/year/price atd. V IN_REPAIR/FOR_SALE smí jen:
- `repairPhotos`
- `repairDescription`
- `status` (jen IN_REPAIR → FOR_SALE, viz 2b)

Přidat guard po ř. 143:
```ts
// V IN_REPAIR/FOR_SALE dealer smí měnit jen repair data
if (!isAdmin && opportunity.status !== "PENDING_APPROVAL") {
  const allowedFields = ["repairPhotos", "repairDescription", "status"];
  const bodyKeys = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined);
  const forbidden = bodyKeys.filter(k => !allowedFields.includes(k));
  if (forbidden.length > 0) {
    return NextResponse.json(
      { error: `V tomto stavu nelze měnit: ${forbidden.join(", ")}` },
      { status: 400 }
    );
  }
}
```

---

### Krok 3: Vytvořit DealerFlipDetail client component

**Nový soubor:** `components/web/marketplace/DealerFlipDetail.tsx`

Tento component přebírá veškerý UI z page.tsx a přidává interaktivitu.

**Props interface:**
```ts
interface DealerFlipDetailProps {
  flipDetail: {
    id: string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    vin: string | null;
    status: FlipStep;
    purchasePrice: number;
    repairCost: number;
    estimatedSalePrice: number;
    fundedAmount: number;
    neededAmount: number;
    repairDescription: string | null;
    investors: Array<{ name: string; amount: number }>;
    photos: string[];
    repairPhotos: string[];
    createdAt: string;
  };
}
```

**State:**
```ts
const [repairPhotos, setRepairPhotos] = useState<string[]>(flipDetail.repairPhotos);
const [status, setStatus] = useState<FlipStep>(flipDetail.status);
const [uploading, setUploading] = useState(false);
const [updating, setUpdating] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
```

**Handlery:**

1. **handlePhotoUpload(files: FileList)** — upload soubory → `/api/upload` preset "marketplace" → uložit URLs přes PUT API → aktualizovat local state
2. **handleMarkComplete()** — PUT status: "FOR_SALE" → refresh
3. **handleUpdatePhotosClick()** — `fileInputRef.current?.click()`

**UI úpravy oproti stávajícímu kódu:**
- Přidat hidden `<input type="file" ref={fileInputRef} multiple accept="image/*" />`
- Upload area Button: přidat `onClick={() => fileInputRef.current?.click()}`
- Pokud repairPhotos existují, přidat "Přidat další" tlačítko pod foto grid
- Status buttons: přidat onClick, disabled states, loading indicators
- Error/success inline messages nad tlačítky
- "Označit jako dokončené" disabled pokud `status !== "IN_REPAIR"`

---

### Krok 4: Zúžit page.tsx na server wrapper

**Soubor:** `app/(web)/marketplace/dealer/[id]/page.tsx`

Ponechat:
- `export const metadata` — funguje jen v Server Components
- Prisma query pro data
- `notFound()` fallback

Nahradit inline JSX za:
```tsx
import { DealerFlipDetail } from "@/components/web/marketplace/DealerFlipDetail";

// ... (stávající data fetching) ...

return <DealerFlipDetail flipDetail={flipDetail} />;
```

---

### Krok 5: Přidat "Přidat další fotky" tlačítko ke grid fotkám

Když `repairPhotos.length > 0`, zobrazit grid + pod ním malé "Přidat další" tlačítko:

```tsx
{repairPhotos.length > 0 && (
  <>
    <div className="grid grid-cols-3 gap-3">
      {repairPhotos.map((url, i) => (
        <div key={i} className="relative aspect-square">
          <Image src={url} alt={`Oprava ${i + 1}`} fill className="rounded-lg object-cover" sizes="33vw" />
        </div>
      ))}
    </div>
    <Button variant="outline" size="sm" className="mt-3" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
      {uploading ? "Nahrávám..." : "Přidat další fotky"}
    </Button>
  </>
)}
```

---

## SOUBORY K EDITACI

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `app/api/upload/route.ts` | EDIT ř.21 | +1 řádek: preset "marketplace" |
| 2 | `app/api/marketplace/opportunities/[id]/route.ts` | EDIT ř.138, 143, 168 | Rozšířit dealer permissions + status transition |
| 3 | `components/web/marketplace/DealerFlipDetail.tsx` | **CREATE** | Nový client component (~150 řádků) |
| 4 | `app/(web)/marketplace/dealer/[id]/page.tsx` | EDIT | Zúžit na thin server wrapper (~40 řádků) |

---

## ACCEPTANCE CRITERIA

- [ ] Tlačítko "Nahrát fotky" v upload area otevře file picker (native `<input type="file">`)
- [ ] Po výběru fotek se nahrají přes `/api/upload` s preset "marketplace"
- [ ] URLs se uloží do `repairPhotos` pole v DB přes PUT API
- [ ] Nahrané fotky se okamžitě zobrazí v gridu
- [ ] Tlačítko "Označit jako dokončené" posune status IN_REPAIR → FOR_SALE
- [ ] Tlačítko je disabled pokud status !== IN_REPAIR
- [ ] Tlačítko "Aktualizovat fotky" otevře file picker pro přidání dalších
- [ ] Loading states na všech tlačítkách během operací
- [ ] Error message se zobrazí inline při selhání
- [ ] Success message se zobrazí po úspěchu
- [ ] Auth: jen owner dealer + admin mohou provádět akce (zajištěno middleware + API)
- [ ] Metadata export zůstává funkční (Server Component wrapper)

## STOP PRAVIDLA

- **STOP-1:** Pokud se zjistí, že upload API nefunguje s novým presetem → debug upload, neshippovat
- **STOP-2:** Pokud page.tsx breakdown (server/client split) rozbije metadata export nebo SSR → eskalovat na plánovače
- **STOP-3:** Pokud status transition (IN_REPAIR → FOR_SALE) způsobí nekonzistenci (např. fundedAmount check) → eskalovat

## ODHAD

- **Složitost:** Střední
- **Soubory:** 4 (1 nový, 3 editované)
- **Risk:** Nízký — existující API + upload infra, jen wiring + client component extraction
