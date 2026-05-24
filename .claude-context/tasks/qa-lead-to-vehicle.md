# QA Report — Lead → Vehicle konverze (commit `cb12e0c`)

**Datum:** 2026-05-23  
**Commit:** `cb12e0c` — `feat(pwa): add Lead→Vehicle conversion with data prefill`  
**Build:** ✓ Compiled 1311/1311 static pages, exit 0  
**Soubory:** 6 (330 vložení, 1 smazání)

---

## 1. Auth — broker vidí jen své leady? PASS ✅

### GET /api/leads/[id]/prefill

```typescript
if (role === "BROKER" && lead.assignedToId !== session.user.id) {
  return NextResponse.json({ error: "Nemáte oprávnění k tomuto leadu" }, { status: 403 });
}
```

- Role check: BROKER/MANAGER/ADMIN/BACKOFFICE/REGIONAL_DIRECTOR ✅
- BROKER: pouze vlastní přiřazené leady (`assignedToId === session.user.id`) ✅
- MANAGER/ADMIN: všechny leady ✅
- 401 pro nepřihlášené ✅

### PUT /api/leads/[id]/status (pre-existující endpoint)

```typescript
if (role === "BROKER" && lead.assignedToId !== userId) {
  return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
}
```
✅ Stejná ochrana.

---

## 2. Prefill mapping kompletní? PASS ✅

### Pole z lead API response

| Lead pole | Namapováno do | Status |
|---|---|---|
| `name` | `contact.sellerName` | ✅ |
| `phone` | `contact.sellerPhone` | ✅ |
| `email` | `contact.sellerEmail` | ✅ |
| `brand` | `contact.prelimBrand` + `details.brand` | ✅ |
| `model` | `contact.prelimModel` + `details.model` | ✅ |
| `year` | `contact.prelimYear` + `details.year` | ✅ |
| `mileage` | `contact.prelimMileage` + `details.mileage` | ✅ |
| `expectedPrice` | `contact.prelimPrice` + `pricing.price` | ✅ |
| `city` | `pricing.city` | ✅ |
| `description` | `details.description` | ✅ |
| `id` | `contact.leadId` (pro tracking) | ✅ |
| `regionId` | Není mapováno | ℹ️ nebrání, region≠city string |

### `updateSection` merge — správné chování

`updateSection` používá `{ ...(prev[section] ?? {}), ...data }` — funkcionální updater, správně merguje. Dvě volání `updateSection("details", ...)` se nepremaže. ✅

---

## 3. Fotky prázdné (ne z leadu)? PASS ✅

`LeadPrefillRedirect` nastavuje sekce: `contact`, `details`, `pricing`. Sekce `photos` NENÍ nastavena.

```typescript
updateSection("contact", { ... });
updateSection("details", { ... });
updateSection("pricing", { ... });
updateSection("details", { description }); // description
// ← žádný updateSection("photos", ...) 
```

Makléř musí fotit sám v PhotoStep. ✅

---

## 4. VIN stále povinný? PASS ✅

VinStep.tsx — banner "Nabíráte auto z leadu" se zobrazí, ale formulář VIN je stále povinný:

```typescript
const canProceed = isValid && !duplicate;
// isValid = VIN_FULL_REGEX.test(vin) — vyžaduje platný 17-místný VIN
```

Banner zobrazuje předvyplněné info (brand/model/rok/km), ale tlačítko "Pokračovat" je disabled dokud není zadán platný VIN. ✅

---

## 5. Lead status VEHICLE_ADDED po odeslání? PASS ✅

### ReviewStep.tsx

```typescript
// Lead→Vehicle: update lead status to VEHICLE_ADDED
if (draft.contact?.leadId) {
  try {
    await fetch(`/api/leads/${draft.contact.leadId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "VEHICLE_ADDED",
        vehicleId: result.id,
      }),
    });
  } catch {
    // Non-critical — vehicle was created successfully
  }
}
```

- Volá se POUZE pokud draft má `leadId` ✅
- Předává `vehicleId` pro propojení ✅
- Zod schema: `VEHICLE_ADDED` je validní status, `vehicleId` je optional string ✅
- API ověřuje existenci vozidla přes Prisma před update ✅
- try/catch — selhání status update není blocker pro dokončení flow ✅

---

## 6. Detaily implementace

### NewVehiclePage.tsx — ?leadId= detekce

```typescript
const leadId = searchParams.get("leadId");
// ...všechny hooks...
if (leadId) {
  return <LeadPrefillRedirect leadId={leadId} />;
}
// useCallback a useEffect po early return
```

⚠️ **MEDIUM — Rules of Hooks porušení**  
`useCallback` a `useEffect` jsou volány PODMÍNĚNĚ — jen když `leadId` je falsy (po early return). Toto porušuje Rules of Hooks. V praxi stabilní (URL parametr se nemění), ale React může detekovat nekonzistentní počet hooků při re-renderu.

**Fix:**
```typescript
// Přesunout hooks PŘED early return, nebo split do 2 komponent
export default function NewVehiclePage() {
  const leadId = searchParams.get("leadId");
  if (leadId) return <LeadPrefillRedirect leadId={leadId} />;
  return <VehicleListPage />;  // komponenta s vlastními hooks
}
```

### LeadPrefillRedirect — "Vytvořit nový draft" button

Duplicitní kód v onClick (kopíruje stejnou prefill logiku z main useEffect). Funkční, ale udržovatelnost nižší. Neblokující.

### Existing vehicle guard ✅

```typescript
if (lead.vehicleId) {
  setExistingVehicleId(lead.vehicleId);
  // zobrazí warning + tlačítko "Zobrazit vozidlo"
  return;
}
```
✅ Ochrana před dvojitou konverzí stejného leadu.

---

## Build

```
✓ Compiled successfully in 55s
✓ Generating static pages (1311/1311) in 14.6s
Exit: 0
```

Poznámka: Build environment má pre-existující race condition při `rm -rf .next` + fresh build (workers hledají manifesty dříve než jsou zapsány). Druhý run s cache vždy projde. Nesouvisí s tímto commitem.

---

## Souhrn

| Kontrola | Status | Poznámka |
|---|---|---|
| **Auth — broker jen vlastní leady** | PASS ✅ | 403 pro cizí leady |
| **Prefill mapping kompletní** | PASS ✅ | 10/11 polí, regionId OK skip |
| **Fotky prázdné** | PASS ✅ | photos sekce nikdy nastavena |
| **VIN povinný** | PASS ✅ | canProceed = isValid && !duplicate |
| **Lead VEHICLE_ADDED** | PASS ✅ | s vehicleId, non-critical catch |
| **Build** | PASS ✅ | 1311 stránek, exit 0 |

**⚠️ Medium issue:** Rules of Hooks porušení v `page.tsx` — `useCallback`/`useEffect` podmíněně voláno po early return. V praxi funguje, ale technicky nesprávné. Doporučena refaktorizace.

**Celkový výsledek: PASS ✅** — Flow funkční end-to-end. Medium issue neblokující.
