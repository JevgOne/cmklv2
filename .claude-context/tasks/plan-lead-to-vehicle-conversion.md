# Plan: Lead → Vehicle konverze — prefill draftu z leadu

**Task:** #82
**Status:** PLAN READY
**Datum:** 2026-05-23
**Typ:** Feature — workflow propojení
**Závažnost:** HIGH — makléři budou reálně nabírat auta z leadů

---

## PROBLÉM

Makléř zavolá na lead, dohodne se → chce vytvořit vozidlo. Dnes:
1. Klikne "Nabrat toto auto" na lead detailu
2. Přesměruje na `/makler/vehicles/new?leadId={id}&brand={brand}&model={model}`
3. **ALE:** NewVehiclePage IGNORUJE query parametry → žádné prefill
4. Makléř musí znovu vyplnit značku, model, rok, nájezd, cenu, kontakt...
5. Lead se NEOZNAČÍ jako VEHICLE_ADDED

**Uživatel říká:** "není třeba znovu vyplňovat auto, jenom fotky a doplnit nějaký informace co chybí. FOTKY MUSÍ BÝT PROSTĚ PODLE NAŠEHO PLÁNU."

---

## AKTUÁLNÍ STAV

### Co Lead model obsahuje:
| Pole | Typ | Mapuje se na Vehicle |
|------|-----|---------------------|
| `name` | String | → `sellerName` |
| `phone` | String | → `sellerPhone` |
| `email` | String? | → `sellerEmail` |
| `brand` | String? | → `brand` |
| `model` | String? | → `model` |
| `year` | Int? | → `year` |
| `mileage` | Int? | → `mileage` |
| `expectedPrice` | Int? | → `price` |
| `description` | String? | → `description` |
| `city` | String? | → `city` |

### Co Lead model NEMÁ:
- ❌ `fuelType`, `transmission`, `bodyType`, `color`, `enginePower`
- ❌ `vin` — makléř musí zadat/skenovat VIN
- ❌ `photos` — Lead nemá fotky (a i kdyby měl, používají se VLASTNÍ fotky makléře)
- ❌ `equipment`, `condition`, `serviceBook`

### Existující "Nabrat toto auto" tlačítko:
- **Kde:** `app/(pwa)/makler/leads/[id]/page.tsx` (řádek ~200) + `components/pwa/leads/LeadActions.tsx`
- **Kdy:** Status CONTACTED nebo MEETING_SCHEDULED
- **URL:** `/makler/vehicles/new?leadId={leadId}&brand={brand}&model={model}`
- **Problém:** Cílová stránka parametry NEPOUŽÍVÁ

---

## NAVRHOVANÉ ŘEŠENÍ

### Flow overview

```
Lead Detail (/makler/leads/[id])
    │
    │ Klik "Nabrat toto auto"
    ▼
NewVehiclePage (/makler/vehicles/new?leadId={id})
    │
    │ 1. Fetch lead data z API
    │ 2. Vytvořit draft s prefill daty
    │ 3. Redirect na VinStep s ?draft={draftId}
    ▼
VinStep (prefilled: brand, model z leadu)
    │ Makléř zadá/skenuje VIN → Smart Lookup doplní zbytek
    ▼
ContactStep (prefilled: sellerName, sellerPhone, sellerEmail, city)
    │ Makléř jen potvrdí
    ▼
InspectionStep (prázdný — makléř vyplní na místě)
    ▼
PhotosStep (PRÁZDNÝ — makléř MUSÍ vyfotit všech 16+ fotek podle plánu)
    │ ❌ Fotky z leadu se NEPOUŽIJÍ
    ▼
DetailsStep (prefilled: brand, model, year, mileage z leadu + VIN decode)
    │ Makléř doplní chybějící: fuel, transmission, color, equipment
    ▼
EquipmentStep (prefilled z VIN decode, doplnit ručně)
    ▼
PricingStep (prefilled: expectedPrice z leadu, city)
    ▼
ReviewStep → Submit → Lead status → VEHICLE_ADDED
```

### Klíčový princip: FOTKY NOVÉ, DATA PREFILL

- **Data z leadu:** prefill co máme (brand, model, year, mileage, price, contact)
- **Data z VIN decode:** doplní technické detaily (fuel, transmission, power, equipment)
- **Fotky:** VŽDY nové, podle guided photo plánu (16+ slotů)
- **Inspection:** VŽDY nový — makléř hodnotí auto na místě

---

## IMPLEMENTACE

### 1. API endpoint — fetch lead data pro prefill

**Nový endpoint:** `GET /api/leads/[id]/prefill`

```typescript
// Response:
{
  lead: {
    id: string,
    name: string,        // → sellerName
    phone: string,       // → sellerPhone
    email: string | null,// → sellerEmail
    brand: string | null,
    model: string | null,
    year: number | null,
    mileage: number | null,
    expectedPrice: number | null,
    description: string | null,
    city: string | null,
    regionId: string | null,
  }
}
```

**Auth:** Session required. Lead musí být `assignedToId === session.user.id`.
**Soubor:** `app/api/leads/[id]/prefill/route.ts`

### 2. NewVehiclePage — handle `?leadId=` parameter

**Soubor:** `app/(pwa)/makler/vehicles/new/page.tsx`

**Aktuální chování:** Zobrazí seznam draftů, tlačítko "Nabrat nové auto" pro nový draft.

**Nové chování s `?leadId=`:**

```typescript
export default function NewVehiclePage({ searchParams }) {
  const { leadId } = await searchParams;
  
  if (leadId) {
    // Auto-create draft s prefill daty z leadu
    return <LeadPrefillRedirect leadId={leadId} />;
  }
  
  // Existující flow — draft list
  return <DraftListPage />;
}
```

**Nová komponenta `LeadPrefillRedirect`** (client component):

```typescript
"use client";

export function LeadPrefillRedirect({ leadId }: { leadId: string }) {
  const { createDraft, updateSection, saveDraft } = useDraftContext();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function prefillFromLead() {
      // 1. Fetch lead data
      const res = await fetch(`/api/leads/${leadId}/prefill`);
      if (!res.ok) {
        setError("Lead nenalezen nebo nemáte oprávnění.");
        return;
      }
      const { lead } = await res.json();
      
      // 2. Create draft
      const draftId = await createDraft();
      
      // 3. Prefill sections
      updateSection("contact", {
        sellerName: lead.name,
        sellerPhone: lead.phone,
        sellerEmail: lead.email,
        prelimBrand: lead.brand,
        prelimModel: lead.model,
        leadId: lead.id,        // NOVÉ pole — reference na lead
        leadSource: "LEAD",
      });
      
      if (lead.brand || lead.model || lead.year || lead.mileage) {
        updateSection("details", {
          brand: lead.brand || "",
          model: lead.model || "",
          year: lead.year || undefined,
          mileage: lead.mileage || undefined,
        });
      }
      
      if (lead.expectedPrice || lead.city) {
        updateSection("pricing", {
          price: lead.expectedPrice || undefined,
          city: lead.city || "",
        });
      }
      
      if (lead.description) {
        updateSection("details", {
          description: lead.description,
        });
      }
      
      // 4. Force save
      await saveDraft();
      
      // 5. Redirect to VinStep
      router.replace(`/makler/vehicles/new/vin?draft=${draftId}`);
    }
    
    prefillFromLead();
  }, [leadId]);
  
  if (error) return <ErrorUI message={error} />;
  return <LoadingSpinner message="Připravuji draft z leadu..." />;
}
```

### 3. VehicleDraft type — přidat leadId

**Soubor:** `types/vehicle-draft.ts`

```typescript
// V ContactData přidat:
interface ContactData {
  // ... existující pole ...
  leadId?: string;       // NOVÉ — reference na zdrojový lead
  leadSource?: string;   // NOVÉ — "LEAD" | "SCOUT_LEAD" | "MANUAL"
}
```

### 4. VinStep — handle lead prefill

**Soubor:** `components/pwa/vehicles/new/VinStep.tsx`

**Změny:**
- Pokud `draft.contact?.leadId` existuje, zobrazit banner: "Nabíráte auto z leadu: {brand} {model}"
- Pokud `draft.details?.brand` a `draft.details?.model` prefilled, zobrazit je nad VIN inputem
- VIN stále POVINNÝ — makléř musí zadat/skenovat
- Po VIN decode → merge s lead daty (VIN decode má prioritu nad lead daty)

```typescript
// Banner v renderingu:
{draft?.contact?.leadId && (
  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-4">
    <p className="text-sm text-blue-800 font-medium">
      Nabíráte auto z leadu
    </p>
    <p className="text-sm text-blue-600">
      {draft.details?.brand} {draft.details?.model}
      {draft.details?.year ? ` (${draft.details.year})` : ""}
    </p>
  </div>
)}
```

### 5. DetailsStep — merge lead + VIN data

**Soubor:** `components/pwa/vehicles/new/DetailsStep.tsx`

**Aktuální chování:** Reads from `draft?.details` + `smartLookupResult`. Priority: draft > smart lookup > empty.

**S lead prefill:** Stejná priorita funguje automaticky:
1. VIN decode data (smart lookup) — highest confidence
2. Draft data (prefilled z leadu) — medium
3. Empty — user must fill

**Žádné změny v DetailsStep** — prefill přes draft funguje nativně díky stávající merge logice.

### 6. ContactStep — skip nebo pre-validate

**Soubor:** `components/pwa/vehicles/new/ContactStep.tsx`

**Změny:**
- Pokud `draft.contact?.leadId` → fields prefilled (sellerName, sellerPhone, sellerEmail)
- Zobrazit: "Kontakt převzat z leadu. Ověřte a upravte podle potřeby."
- Makléř může editovat ale nemusí vyplňovat od nuly

### 7. ReviewStep — link lead po úspěšném odeslání

**Soubor:** `components/pwa/vehicles/new/ReviewStep.tsx`

**Přidat po úspěšném POST /api/vehicles + PENDING transition:**

```typescript
// Po vehicle creation, update lead status
if (draft?.contact?.leadId) {
  await fetch(`/api/leads/${draft.contact.leadId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "VEHICLE_ADDED",
      vehicleId: vehicleId,
    }),
  });
}
```

Tím se lead automaticky přepne na VEHICLE_ADDED a propojí s vytvořeným vozidlem.

---

## SOUBORY — KOMPLETNÍ SEZNAM

### Nové soubory (2)

| # | Soubor | Typ |
|---|--------|-----|
| 1 | `app/api/leads/[id]/prefill/route.ts` | API endpoint |
| 2 | `components/pwa/vehicles/new/LeadPrefillRedirect.tsx` | Client component |

### Editované soubory (5)

| # | Soubor | Akce |
|---|--------|------|
| 1 | `app/(pwa)/makler/vehicles/new/page.tsx` | Handle `?leadId=` param, render LeadPrefillRedirect |
| 2 | `types/vehicle-draft.ts` | +`leadId`, `leadSource` v ContactData |
| 3 | `components/pwa/vehicles/new/VinStep.tsx` | Lead banner, prefill indication |
| 4 | `components/pwa/vehicles/new/ContactStep.tsx` | Prefill notice |
| 5 | `components/pwa/vehicles/new/ReviewStep.tsx` | Lead status update po submission |

---

## DATA MAPPING — Lead → VehicleDraft

| Lead pole | Draft section | Draft pole | Priorita |
|-----------|---------------|------------|----------|
| `name` | contact | `sellerName` | Lead (broker ověří) |
| `phone` | contact | `sellerPhone` | Lead |
| `email` | contact | `sellerEmail` | Lead |
| `brand` | details | `brand` | VIN decode > Lead |
| `model` | details | `model` | VIN decode > Lead |
| `year` | details | `year` | VIN decode > Lead |
| `mileage` | details | `mileage` | Lead (broker ověří na tachometru) |
| `expectedPrice` | pricing | `price` | Lead (broker může změnit) |
| `description` | details | `description` | Lead (broker může přepsat) |
| `city` | pricing | `city` | Lead |
| `id` | contact | `leadId` | Reference |

---

## FOTKY — PRAVIDLA

1. **Fotky z leadu se NEPOUŽIJÍ** — jsou cizí, nízká kvalita, nemají naše sloty
2. **PhotosStep je PRÁZDNÝ** — makléř musí vyfotit všech 16+ fotek
3. **Guided mode** — stejný flow jako bez leadu: 13 ext + 4 int + 1 engine + 3 evidence = 21 povinných slotů (16 minimum)
4. **Evidence fotky POVINNÉ** — tachometr, VIN štítek, klíče — bez výjimky

---

## EDGE CASES

### 1. Lead bez VIN
- Většina leadů nemá VIN (scrapované inzeráty neobsahují)
- VinStep je stále povinný — makléř musí VIN zadat/skenovat na místě
- Brand+model z leadu se zobrazí jako kontext, ale VIN decode má prioritu

### 2. Lead s neaktuálními daty
- Nájezd se mohl změnit od doby inzerátu
- Cena se mohla změnit po dohodě
- Proto: všechny lead data jsou EDITOVATELNÉ, ne locked

### 3. Duplicate draft z jednoho leadu
- Guard: Při fetch `/api/leads/[id]/prefill` zkontrolovat `lead.vehicleId`
- Pokud `vehicleId !== null` → lead už má vozidlo → zobrazt warning s linkem na existující vehicle
- Makléř může vytvořit nový draft i tak (forced mode) — pro případ opakovaného náboru

### 4. Offline prefill
- `?leadId=` fetch vyžaduje online (API call)
- Pokud offline → zobrazit: "Pro nábor z leadu musíte být online"
- Alternativně: cache lead data v IndexedDB při zobrazení lead detailu (future improvement)

---

## STOP PRAVIDLA

- **STOP-1:** NEPOUŽÍVAT fotky z leadu — makléř MUSÍ vyfotit vlastní podle guided plánu.
- **STOP-2:** NEMĚNIT Lead model v Prisma — žádná nová pole. Lead data se čtou, ne mění.
- **STOP-3:** NEMĚNIT stávající onboarding wizard flow — jen přidat prefill hook na vstupu.
- **STOP-4:** VIN je VŽDY povinný — i když lead nemá VIN, makléř ho musí zadat.
- **STOP-5:** NEMĚNIT LeadActions.tsx URL — stávající `?leadId=&brand=&model=` formát je OK, jen cílová stránka ho musí zpracovat.
- **STOP-6:** Lead data NESMÍ být locked — makléř musí mít možnost vše editovat.

---

## ACCEPTANCE CRITERIA

- [ ] Klik "Nabrat toto auto" na lead detailu → automaticky vytvoří draft s prefill daty
- [ ] VinStep zobrazuje banner "Nabíráte auto z leadu: {brand} {model}"
- [ ] ContactStep je předvyplněný (jméno, telefon, email prodejce)
- [ ] DetailsStep má prefilled brand, model, year, mileage z leadu
- [ ] PricingStep má prefilled expectedPrice a city z leadu
- [ ] PhotosStep je PRÁZDNÝ — makléř musí vyfotit všech 16+ fotek
- [ ] Po úspěšném odeslání se lead přepne na VEHICLE_ADDED s vehicleId
- [ ] Všechna prefilled data jsou EDITOVATELNÁ (ne locked)
- [ ] Pokud lead už má vehicleId, zobrazit warning
- [ ] `npm run build` projde
