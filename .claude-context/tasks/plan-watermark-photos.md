# Plan — Vodoznak na všech produktových fotkách

**Datum:** 2026-04-11
**Agent:** Plánovač
**Zdroj:** Task #22 (team-lead)
**Effort:** ~1.5h
**DB migrace:** ŽÁDNÁ

---

## §0 Executive summary

Každá fotka nahraná do systému (vozidla, inzeráty, díly, poškození) musí mít vodoznak "CarMakler". Řešení využívá **Cloudinary incoming transformation** — vodoznak se aplikuje server-side při uploadu, uložená fotka je permanentně označená. Kód už podporuje `transformation` parametr v `uploadToCloudinary()` (line 22-24, 52-54, 67-68).

**Co se mění:**
1. **Upload watermark PNG** na Cloudinary (one-time setup script)
2. **Nová konstanta** v `lib/cloudinary.ts` — watermark transformation string
3. **Edit** `app/api/upload/route.ts` — přidat `watermark: true` do PRESETS pro produktové fotky
4. **Edit** `app/api/listings/[id]/images/route.ts` — předat transformation

**Co se NEMĚNÍ:**
- Avatary (`/api/onboarding/profile`) — osobní fotky, žádný vodoznak
- Dokumenty (`/api/onboarding/documents`) — živnostáky, OP — soukromé
- Kontrakty PDF (`/api/contracts/[id]/pdf`) — generované PDF
- Faktury (invoices preset) — business dokumenty

---

## §1 Architektura rozhodnutí

### Proč Cloudinary incoming transformation (ne Canvas, ne URL)

| Přístup | Pro | Proti |
|---------|-----|-------|
| **A. Cloudinary incoming transformation** ✅ | 1 místo v kódu, permanentní, originál bez watermarku neexistuje | Vodoznak nelze odstranit (záměr) |
| B. Cloudinary URL transformation | Flexibilní, originál zachován | Originál bez watermarku přístupný přes URL, nutné měnit všechny `<img>` tagy |
| C. Client-side Canvas | Funguje offline | 6+ komponent k editaci, kvalita ztráta, PWA IndexedDB komplikace |

**Volba A** — kód `uploadToCloudinary()` už má `transformation` parametr (lines 22-24, 52-54, 67-68), stačí ho naplnit.

### Watermark asset

Existuje `public/brand/logo-white.png` (96 KB) — bílé logo na průhledném pozadí. Ideální pro vodoznak (bílá + snížená opacity funguje na tmavých i světlých fotkách aut).

---

## §2 Soubory k vytvoření

### 2.1 `scripts/upload-watermark.ts` (NEW, ~30 lines)

One-time script pro nahrání watermark PNG na Cloudinary. Spouští se jednou, poté se smaže nebo archivuje.

```typescript
/**
 * One-time script: Upload watermark PNG na Cloudinary.
 * Spustit: npx tsx scripts/upload-watermark.ts
 *
 * Nahraje public/brand/logo-white.png jako "carmakler/watermark"
 * s fixed public_id pro použití v overlay transformacích.
 */
import { readFileSync } from "fs";
import { createHash } from "crypto";

async function main() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Missing CLOUDINARY env vars");
    process.exit(1);
  }

  const fileBuffer = readFileSync("public/brand/logo-white.png");
  const base64 = fileBuffer.toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  const timestamp = Math.round(Date.now() / 1000).toString();
  const publicId = "carmakler/watermark";
  const paramsToSign = `overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(paramsToSign).digest("hex");

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("public_id", publicId);
  formData.append("overwrite", "true");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    console.error("Upload failed:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log("Watermark uploaded:", data.secure_url);
  console.log("Public ID:", data.public_id);
}

main();
```

**Spuštění:**
```bash
npx tsx scripts/upload-watermark.ts
```

**Výsledek:** Asset `carmakler/watermark` na Cloudinary, referencovatelný v overlay transformacích jako `carmakler:watermark`.

---

## §3 Soubory k editaci

### 3.1 `lib/cloudinary.ts` — přidat watermark konstantu (po line 10)

**Přidat za `MAX_FILE_SIZE` konstantu (line 10):**

```typescript
/**
 * Cloudinary overlay transformation pro vodoznak.
 * Používá nahraný asset "carmakler/watermark" (logo-white.png).
 * - g_south_east: pravý dolní roh
 * - w_0.15: 15% šířky obrázku (responsivní)
 * - o_40: 40% opacity
 * - x_15,y_15: padding od rohu
 * - fl_relative: w_0.15 je relativní k obrázku
 */
export const WATERMARK_TRANSFORMATION =
  "l_carmakler:watermark,g_south_east,w_0.15,o_40,x_15,y_15,fl_relative/fl_layer_apply";
```

**Poznámky k transformaci:**
- `l_carmakler:watermark` — overlay z Cloudinary public_id `carmakler/watermark` (`:` nahrazuje `/`)
- `g_south_east` — gravity bottom-right (konvenční pozice pro fotky aut)
- `w_0.15,fl_relative` — 15% šířky obrázku (funguje na 800px i 4000px)
- `o_40` — 40% opacity (viditelný ale nepřekáží)
- `x_15,y_15` — 15px padding od rohu
- `fl_layer_apply` — ukončení overlay vrstvy

**FALLBACK (pokud Cloudinary asset upload selže):**

Textový overlay bez nutnosti uploadu assetu:

```typescript
export const WATERMARK_TRANSFORMATION_TEXT =
  "l_text:Arial_30_bold:CarMakler,co_rgb:FFFFFF,o_35,g_south_east,x_15,y_15";
```

Implementátor zkusí nejdřív image overlay. Pokud problém s Cloudinary asset → přepne na text overlay.

---

### 3.2 `app/api/upload/route.ts` — přidat watermark do PRESETS (lines 11-18)

**Aktuální kód (lines 11-18):**
```typescript
const PRESETS: Record<string, { folder: string; allowedTypes: string[] }> = {
  vehicles: { folder: "carmakler/vehicles", allowedTypes: ALLOWED_IMAGE_TYPES },
  listings: { folder: "carmakler/listings", allowedTypes: ALLOWED_IMAGE_TYPES },
  parts: { folder: "carmakler/parts", allowedTypes: ALLOWED_IMAGE_TYPES },
  invoices: { folder: "carmakler/invoices", allowedTypes: ALLOWED_DOC_TYPES },
  contracts: { folder: "carmakler/contracts", allowedTypes: ALLOWED_DOC_TYPES },
  damages: { folder: "carmakler/damages", allowedTypes: ALLOWED_IMAGE_TYPES },
};
```

**Změna:**

```typescript
import { WATERMARK_TRANSFORMATION } from "@/lib/cloudinary";

const PRESETS: Record<string, { folder: string; allowedTypes: string[]; watermark?: boolean }> = {
  vehicles: { folder: "carmakler/vehicles", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  listings: { folder: "carmakler/listings", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  parts: { folder: "carmakler/parts", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  invoices: { folder: "carmakler/invoices", allowedTypes: ALLOWED_DOC_TYPES },
  contracts: { folder: "carmakler/contracts", allowedTypes: ALLOWED_DOC_TYPES },
  damages: { folder: "carmakler/damages", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
};
```

**Změna line 68 (upload call):**

Aktuální:
```typescript
const url = await uploadToCloudinary(file, targetFolder);
```

Nový:
```typescript
const { watermark } = PRESETS[preset];
const url = await uploadToCloudinary(file, targetFolder, 
  watermark ? { transformation: WATERMARK_TRANSFORMATION } : undefined
);
```

**Vodoznak dostávají:**
- ✅ `vehicles` — fotky vozidel (partner, makléř)
- ✅ `listings` — fotky inzerátů (soukromý prodejce)
- ✅ `parts` — fotky autodílů (eshop)
- ✅ `damages` — fotky poškození (reklamace, damage report)
- ❌ `invoices` — faktury (business dokument, ne produkt)
- ❌ `contracts` — smlouvy (generované PDF)

---

### 3.3 `app/api/listings/[id]/images/route.ts` — přidat watermark (line 76)

Tato route volá `uploadToCloudinary` PŘÍMO (ne přes `/api/upload`), takže potřebuje vlastní úpravu.

**Aktuální kód (line 76):**
```typescript
url = await uploadToCloudinary(photos[i], `carmakler/listings/${id}`);
```

**Změna:**
```typescript
import { WATERMARK_TRANSFORMATION } from "@/lib/cloudinary";
// ... (v import sekci)

url = await uploadToCloudinary(photos[i], `carmakler/listings/${id}`, {
  transformation: WATERMARK_TRANSFORMATION,
});
```

---

## §4 Soubory BEZ změny (vysvětlení)

| Soubor | Důvod bez změny |
|--------|-----------------|
| `app/api/onboarding/profile/route.ts` | Avatar — osobní fotka, ne produkt |
| `app/api/onboarding/documents/route.ts` | Živnostenský list, OP — soukromé dokumenty |
| `app/api/contracts/[id]/pdf/route.ts` | Generovaný PDF, ne fotka produktu |
| `components/partner/PhotoUpload.tsx` | Client-side component — žádná změna, volá `/api/upload` |
| `components/pwa-parts/parts/PhotoStep.tsx` | Client-side — volá `/api/upload` |
| `components/pwa/vehicles/new/PhotosStep.tsx` | Ukládá do IndexedDB, upload přes QuickStep3 → `/api/upload` |
| `components/pwa/vehicles/quick/QuickStep3.tsx` | Volá `/api/upload` preset `"vehicles"` — watermark se aplikuje automaticky |
| `components/web/listing-form/Step4Photos.tsx` | Posílá fotky přes `/api/listings/[id]/images` — řeší §3.3 |
| `components/pwa/vehicles/DamageReportForm.tsx` | Volá `/api/upload` preset `"damages"` — automaticky |
| `lib/image-utils.ts` | Client-side resize/thumbnail — žádný vodoznak na clientu |

---

## §5 Implementační pořadí

1. **Setup** — spustit `scripts/upload-watermark.ts` pro nahrání watermark assetu na Cloudinary
2. **Edit** `lib/cloudinary.ts` — přidat `WATERMARK_TRANSFORMATION` konstantu
3. **Edit** `app/api/upload/route.ts` — přidat `watermark` flag do PRESETS + předat transformation
4. **Edit** `app/api/listings/[id]/images/route.ts` — přidat transformation k upload callu
5. **Test** — nahrát testovací fotku přes partner dashboard, ověřit vodoznak na Cloudinary URL

---

## §6 Acceptance criteria

- [ ] Watermark asset `carmakler/watermark` existuje na Cloudinary
- [ ] Fotky nahrané přes preset `vehicles` mají vodoznak v pravém dolním rohu
- [ ] Fotky nahrané přes preset `listings` mají vodoznak
- [ ] Fotky nahrané přes preset `parts` mají vodoznak
- [ ] Fotky nahrané přes preset `damages` mají vodoznak
- [ ] Fotky inzerátů (přes `/api/listings/[id]/images`) mají vodoznak
- [ ] Vodoznak je ~15% šířky obrázku, 40% opacity, pravý dolní roh
- [ ] Dokumenty (invoices, contracts) NEMAJÍ vodoznak
- [ ] Avatary (onboarding profile) NEMAJÍ vodoznak
- [ ] Dev mode (bez Cloudinary env) stále funguje (placeholder URL)
- [ ] TypeScript: 0 errors
- [ ] Build: passes

---

## §7 STOP kritéria

- **STOP-1:** Cloudinary `transformation` parametr nefunguje s overlay syntaxí → přepni na text overlay fallback (`l_text:Arial_30_bold:CarMakler,...`) — nevyžaduje asset upload
- **STOP-2:** Cloudinary signing selže s transformation parametrem → zkontroluj alphabetical order v `paramsToSign` (aktuální kód na line 51-54 řadí folder < timestamp < transformation — ✅ správně)
- **STOP-3:** `fl_relative` nefunguje v incoming transformation → nahradit `w_0.15,fl_relative` za fixní `w_150` (150px šířka, funguje na většině fotek)
- **STOP-4:** Existující fotky v DB nemají vodoznak → **OUT OF SCOPE**. Řeší se separátním migration skriptem (batch re-upload přes Cloudinary Admin API). Neblokuje tuto feature.
- **STOP-5:** Text overlay fallback nefunguje → eskaluj na team-lead, může vyžadovat Cloudinary plan upgrade (text overlay dostupný od Plus plánu)

---

## §8 Poznámky

### Existující fotky
Všechny fotky nahrané PŘED implementací vodoznaku zůstanou bez vodoznaku. Migrace existujících fotek je separátní task (batch script přes Cloudinary Admin API + eager transformation). Není součástí tohoto plánu.

### Offline PWA workflow
Fotky pořízené offline se ukládají do IndexedDB jako blob. Vodoznak se neaplikuje na clientu. Vodoznak se aplikuje až při uploadu na Cloudinary (po reconnectu). To je správné chování — offline preview je bez vodoznaku, finální fotka na serveru s vodoznákem.

### Watermark design
- Bílé logo (logo-white.png) — dobře viditelné na tmavých fotkách aut
- 40% opacity — dostatečně viditelný, ale neruší obsah
- 15% šířky — proporcionální k fotce (nezmizí na velkých fotkách, nepřekryje malé)
- Pravý dolní roh — konvenční pozice, nepřekáží hlavnímu obsahu
