# QA Report — Task #56: Fáze 1 Smart VIN Data Pipeline

**Datum:** 2026-05-23  
**Implementátor:** Task #56 (Subtasky 1.1–1.5)  
**Build:** ✓ Compiled 1311/1311 static pages, exit 0  
**Poznámka:** Build vyžadoval opravu syntax chyby v `lib/listing-quality.ts` (Task #78 — viz sekce Build Issues)

---

## Přehled implementace

5 subtasků pokrývají celý VIN data pipeline pro PWA flow:

| Subtask | Soubor(y) | Status |
|---|---|---|
| 1.2 — Typy + merge logika | `types/vehicle-draft.ts`, `lib/vin-merge.ts` | PASS ✅ |
| 1.4 — Upgrade check-duplicate | `app/api/vin/check-duplicate/route.ts` | PASS ✅ |
| 1.1 — Nový endpoint smart-lookup | `app/api/vin/smart-lookup/route.ts` | PASS ✅ |
| 1.5 — CEBIA integrace | součást smart-lookup + vin-merge | PASS ✅ |
| 1.3 — Upgrade VinStep | `components/pwa/vehicles/new/VinStep.tsx` | PASS ⚠️ minor |

---

## Task 1.2 — Typy + merge logika: PASS ✅

### types/vehicle-draft.ts

```typescript
export type DataSource = "db" | "cebia" | "vincario" | "nhtsa";
export type Confidence = "high" | "medium" | "low";

export interface FieldWithSource<T> {
  value: T;
  source: DataSource;
  confidence: Confidence;
  editable: boolean;
}

export interface SmartLookupResult {
  fields: { brand?, model?, variant?, year?, fuelType?, transmission?,
            enginePower?, engineCapacity?, bodyType?, drivetrain?,
            color?, doorsCount?, seatsCount?, mileage?, condition?,
            ownerCount? };  // vše FieldWithSource<T>
  sources: DataSource[];
  cebiaReport?: { status, reportUrl, stolen?, mileageOk?, damageFree?,
                  financingFree?, registrationHistory? };
  existingVehicleId?: string | null;
}
```
✅ Všechny typy definovány správně.

### lib/vin-merge.ts

Prioritní pořadí: **DB > CEBIA > Vincario > NHTSA**
- `SOURCE_CONFIDENCE`: db/cebia/vincario = "high", nhtsa = "medium" ✅
- `editable: SOURCE_CONFIDENCE[source] !== "high"` — nhtsa pole jsou editovatelná ✅
- `pickHigherPriority()` — správná merge logika (lower index = vyšší priorita) ✅
- CEBIA netlačí technické pole do fields (jen cebiaReport summary) — logicky správné ✅
- `existingVehicleId: dbData?.id ?? null` — předává ID pro opakované použití ✅

---

## Task 1.4 — Upgrade check-duplicate endpoint: PASS ✅

`GET /api/vin/check-duplicate?vin=XXX`

| Scenario | Response | Status |
|---|---|---|
| VIN neexistuje | `{ exists: false }` | ✅ |
| VIN ARCHIVED | `{ exists: true, canReuse: true, archiveData: {...} }` | ✅ |
| VIN ACTIVE/RESERVED/SOLD/PENDING/DRAFT | `{ exists: true, canReuse: false, isBlocking: true }` | ✅ |

- Auth check (`session.user.id`) ✅
- Zod VIN regex validace ✅
- `archiveData` obsahuje všechna technická pole pro prefill ✅
- `broker` jméno v response pro informaci uživatele ✅

---

## Task 1.1 — Nový endpoint /api/vin/smart-lookup: PASS ✅

`GET /api/vin/smart-lookup?vin=XXX`

### Pipeline implementace

```
[1] DB lookup (pouze ARCHIVED vozidla → dbData)
[2] CEBIA + Vincario paralelně (Promise.allSettled)
[3] NHTSA pouze pokud Vincario nevrátil brand (fallback)
[4] mergeVinSources() → SmartLookupResult
```

- Auth check ✅
- Zod VIN regex validace ✅
- `Promise.allSettled` pro paralelní CEBIA + Vincario ✅
- NHTSA podmíněně: `if (!vincarioData?.brand)` ✅
- Graceful degradation: error vrátí `{ fields: {}, sources: [], manual: true, status: 200 }` ✅
- `manual: true` flag pro UI když chybí brand/model ✅
- Každý krok má vlastní try/catch ✅

---

## Task 1.5 — CEBIA integrace: PASS ✅

### lib/cebia.ts — orderCebiaReport()

- Když `CEBIA_API_KEY` není nastaven nebo je `"dev-mock"` → mock data ✅
- Reálné API volání přes Bearer token ✅
- API fail → fallback na mock ✅
- Mock: VIN končící `0` → WARNING (simulace pro dev) ✅

### CebiaCheckResult → SmartLookupResult.cebiaReport mapping

```typescript
// lib/vin-merge.ts
const cebiaReport = cebiaData ? {
  status: cebiaData.status,
  reportUrl: cebiaData.reportUrl,
  stolen: cebiaData.data?.stolen,
  mileageOk: cebiaData.data?.mileageOk,
  damageFree: cebiaData.data?.damageFree,
  financingFree: cebiaData.data?.financingFree,
  registrationHistory: cebiaData.data?.registrationHistory,
} : undefined;
```
✅ Správné mapování z `CebiaCheckResult.data` (nested) do flat `cebiaReport`.

---

## Task 1.3 — Upgrade VinStep: PASS ⚠️ (minor)

### Klíčové funkce

**`handleSmartLookup` (was `handleDecode`):**
- Volá `/api/vin/smart-lookup?vin=...` ✅
- Offline path: čte `offlineStorage.getCachedVin()` ✅
- Cache po úspěšném lookup: `offlineStorage.cacheVin()` ✅

**`SmartField` komponenta:**
- Per-field source dot (`FieldSourceDot`) — barevné indikátory: db=modrá, cebia=zelená, vincario=fialová, nhtsa=šedá ✅

**`SourceBadge` komponenta:**
- Header badges pro celkové zdroje: "Nase DB", "CEBIA", "VIN dekoder", "NHTSA" ✅

**CEBIA alerts:**
- WARNING: odcizení, nájezd km, škodní událost, financování ✅
- OK badge ✅

**`flattenSmartLookup()`:**
- Backward compat s `decodedData` shape pro ostatní kroky ✅

**ARCHIVED VIN info:**
- `canReuse` state → Alert "historická data budou použita" ✅

**Auto-decode po skenování kamerou:**
- `autoDecodeQueued` flag, čeká na duplikát check, pak volá `handleSmartLookup` ✅

### ⚠️ Minor — UI texty bez diakritiky

Část UI textů v VinStep.tsx je bez háčků/čárek:

| Aktuální text | Správně |
|---|---|
| "Nacitam data..." | "Načítám data..." |
| "Nacist znovu" | "Načíst znovu" |
| "Nacist data z VIN" | "Načíst data z VIN" |
| "CEBIA — upozorneni k historii vozidla" | "upozornění k historii vozidla" |
| "Vozidlo je hlaseno jako odcizene!" | "hlášeno jako odcizené" |
| "Nesrovnalost v historii najezdu kilometru" | "nájezdu kilometrů" |
| "Zaznam o skodne udalosti" | "Záznam o škodné události" |
| "Vozidlo je zatizeno financovanim" | "zatíženo financováním" |
| "CEBIA — historie vozidla v poradku" | "v pořádku" |
| "Znacka", "Rok vyroby", "Prevodovka" | "Značka", "Rok výroby", "Převodovka" |

Vše funkční, jen estetická/UX vada. Neblokující.

---

## Build Issues (mimoběžné — Task #78)

### lib/listing-quality.ts — syntax error (opraveno)

`lib/listing-quality.ts` (untracked file, z Task #78) měl 2 unterminated string literals:

```
// PŘED OPRAVOU (syntax error):
message: "...označen jako „Výborný". Zkontrolujte.",
//                                ^  ^
//                          U+201E  U+0022 — U+0022 prematurely closes JS string

// PO OPRAVĚ:
message: "...označen jako \u201eVýborný\u201c. Zkontrolujte.",
```

Opraveno na 2 místech (řádky 226 a 271). Build prošel po opravě.

**Původní build error (před opravou):** Webpack + SWC cached output reportoval duplicitní `isDescriptionValid` v PricingStep.tsx — po `rm -rf .next` a clean rebuild se ukázalo, že skutečnou příčinou byl syntax error v `listing-quality.ts`.

---

## STOP Check (Task #56 scope)

| Kritérium | Status |
|---|---|
| Nové API routes: jen `/api/vin/smart-lookup` | ✅ očekáváno |
| Prisma schema nedotčeno | ✅ |
| Nové migrace: žádné | ✅ |
| Typy v `types/vehicle-draft.ts` rozšířeny (additive) | ✅ |
| Stávající `VinData`, `VehicleDraft` interface nedotčeny | ✅ |

---

## Build

```
✓ Compiled successfully in 50s
✓ Generating static pages (1311/1311) in 25.5s
Exit: 0
```

1311 stránek (+1 oproti předchozímu buildu — nový `/api/vin/smart-lookup` route). ✅

---

## Souhrn

| Subtask | Výsledek | Poznámka |
|---|---|---|
| **1.2 — Typy + merge** | **PASS ✅** | Priority, confidence, editable správně |
| **1.4 — check-duplicate** | **PASS ✅** | ARCHIVED/ACTIVE rozlišení, canReuse flag |
| **1.1 — smart-lookup** | **PASS ✅** | Pipeline, graceful degradation, paralelní API |
| **1.5 — CEBIA** | **PASS ✅** | Mock/real switch, cebiaReport mapping |
| **1.3 — VinStep** | **PASS ⚠️** | UI texty bez diakritiky (neblokující) |
| **Build** | **PASS ✅** | Po opravě listing-quality.ts (Task #78 bug) |

**Celkový výsledek: PASS ✅** — Veškerá core implementace Task #56 je správná. Minor: UI diakritika v VinStep. Bug v listing-quality.ts (Task #78) byl opraven.
