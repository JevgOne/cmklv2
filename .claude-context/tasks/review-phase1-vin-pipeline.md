# Evžen THE KING — Verdikt: Task #56 (Smart VIN Data Pipeline, Fáze 1)

**Task:** #73 (kontrola)
**Datum:** 2026-05-23
**Verdikt:** ✅ SCHVÁLENO (s poznámkami — 1 blokující, 1 neblokující)

---

## Zadání uživatele (doslovně)

> "Makléř zadá VIN vozidla. Pokud už vozidlo existuje v naší databázi, použijí se naše interní data. Pokud ne, systém načte dostupné informace přes Cebia. Aplikace následně zobrazí pouze doplňující informace, které chybí nebo je potřeba potvrdit/doplnit. Důležité je, aby makléř nevyplňoval zbytečně údaje, které už systém správně načetl. Formulář musí být dynamický, chytrý a přizpůsobený konkrétnímu vozidlu."

**Scope kontroly:** Fáze 1 — Data pipeline, typy, merge, VinStep UI, check-duplicate. Dynamický formulář (DetailsStep) je Fáze 2.

---

## 1. Smart Lookup Endpoint `/api/vin/smart-lookup` ✅

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| Auth check (session) | ✅ | `route.ts:23-28` |
| Zod validace VIN (17 znaků, bez I/O/Q) | ✅ | `route.ts:12-14,39-44` |
| Pipeline DB→CEBIA→Vincario→NHTSA | ✅ | `route.ts:54-134` |
| DB: jen ARCHIVED vozidla jako zdroj | ✅ | `route.ts:81` — `if (dbVehicle.status === "ARCHIVED")` |
| CEBIA + Vincario paralelně (`Promise.allSettled`) | ✅ | `route.ts:110-117` |
| NHTSA jen jako fallback (pokud Vincario nevrátí brand) | ✅ | `route.ts:128` — `if (!vincarioData?.brand)` |
| Graceful degradation (catch→200 s `manual:true`) | ✅ | `route.ts:159-168` |
| Incomplete flag (`manual:true` pokud chybí brand/model) | ✅ | `route.ts:145-155` |
| Per-field source tracking v response | ✅ | Via `mergeVinSources()` |

**Odpovídá zadání "systém načte dostupné informace"?** ANO.

---

## 2. Typy `SmartLookupResult`, `FieldWithSource<T>` ✅

| Typ | Status | Důkaz |
|-----|--------|-------|
| `DataSource = "db" \| "cebia" \| "vincario" \| "nhtsa"` | ✅ | `types/vehicle-draft.ts:253` |
| `Confidence = "high" \| "medium" \| "low"` | ✅ | `types/vehicle-draft.ts:254` |
| `FieldWithSource<T>` (value, source, confidence, editable) | ✅ | `types/vehicle-draft.ts:256-261` |
| `SmartLookupResult` (16 polí + sources + cebiaReport + existingVehicleId) | ✅ | `types/vehicle-draft.ts:263-293` |
| 16 trackovaných polí (brand, model, variant, year, mileage, fuelType, transmission, enginePower, engineCapacity, bodyType, drivetrain, color, doorsCount, seatsCount, condition, ownerCount) | ✅ | Kompletní |

---

## 3. Merge logika `lib/vin-merge.ts` ✅

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| Priorita: DB > CEBIA > Vincario > NHTSA | ✅ | `vin-merge.ts:23` — `SOURCE_PRIORITY` |
| `makeField` s confidence mapping | ✅ | `vin-merge.ts:45-56` |
| `pickHigherPriority` — lower index wins | ✅ | `vin-merge.ts:58-70` |
| Merge bottom-up (NHTSA→Vincario→DB) | ✅ | `vin-merge.ts:161-183` |
| CEBIA → jen `sources.push`, ne field merge (CEBIA dává historii, ne specifikace) | ✅ | `vin-merge.ts:175-177` |
| CEBIA report summary (stolen, mileageOk, damageFree, financingFree) | ✅ | `vin-merge.ts:186-196` |
| `editable` flag — `false` pro high confidence (DB, CEBIA, Vincario) | ✅ | `vin-merge.ts:54` |
| `DbVehicleData` interface exportován | ✅ | `vin-merge.ts:206` |

**Odpovídá zadání "použijí se naše interní data"?** ANO — DB data mají nejvyšší prioritu.

---

## 4. Check-duplicate upgrade ✅

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| ARCHIVED → `canReuse: true` + `archiveData` s 16 poli | ✅ | `check-duplicate/route.ts:88-118` |
| ACTIVE/RESERVED/SOLD/PENDING/DRAFT → `isBlocking: true` | ✅ | `check-duplicate/route.ts:86` |
| Non-existent → `{ exists: false }` | ✅ | `check-duplicate/route.ts:75-77` |
| Auth check + Zod validace | ✅ | `check-duplicate/route.ts:14-41` |
| Broker info v response | ✅ | `check-duplicate/route.ts:79-81` |

---

## 5. VinStep.tsx — Smart Lookup UI ✅

| Požadavek | Status | Důkaz |
|-----------|--------|-------|
| `handleSmartLookup` volá `/api/vin/smart-lookup` | ✅ | `VinStep.tsx:180` |
| SmartField komponenta (per-field source dot) | ✅ | `VinStep.tsx:611-632` — `FieldSourceDot` s barevným indikátorem |
| SourceBadge komponenta (header badges) | ✅ | `VinStep.tsx:569-587` — DB/CEBIA/VIN dekoder/NHTSA |
| 14 polí zobrazeno v gridu | ✅ | `VinStep.tsx:493-508` |
| CEBIA WARNING alert (odcizení, nájezd, poškození, financování) | ✅ | `VinStep.tsx:436-464` |
| CEBIA OK badge | ✅ | `VinStep.tsx:467-478` |
| ARCHIVED VIN → info "historická data budou použita" | ✅ | `VinStep.tsx:338-349` |
| IndexedDB cache (cacheVin/getCachedVin) | ✅ | `VinStep.tsx:193-196, 157-158` |
| Offline fallback (cache → manual) | ✅ | `VinStep.tsx:154-177` |
| `flattenSmartLookup` pro backward compat s `decodedData` | ✅ | `VinStep.tsx:548-566` |
| Auto-decode po kamerovém skenu | ✅ | `VinStep.tsx:217-222` |
| Duplikát blocking (ACTIVE/PENDING/DRAFT) | ✅ | `VinStep.tsx:306-321` |
| Manual entry note (VIN nenalezen) | ✅ | `VinStep.tsx:412-424` |

---

## 6. CEBIA graceful skip ✅

| Kontrola | Status | Důkaz |
|----------|--------|-------|
| `isCebiaConfigured()` checkuje `CEBIA_API_KEY` | ✅ | `lib/cebia.ts:24-27` |
| Bez API klíče → mock report | ✅ | `lib/cebia.ts:36-38` |
| `Promise.allSettled` v pipeline → CEBIA failure neblokuje | ✅ | `smart-lookup/route.ts:110` |
| API error → fallback na mock | ✅ | `lib/cebia.ts:56-57` |

**Odpovídá poznámce "CEBIA nemáme připojenou, funguje jen mock"?** ANO — graceful degradation.

---

## POZNÁMKY

### P1 — BLOKUJÍCÍ: Chybějící diakritika v UI textech

VinStep.tsx obsahuje **25+ textů bez české diakritiky**. CLAUDE.md říká "Vše v češtině (UI texty, komentáře)". Příklady:

| Aktuální | Správně |
|----------|---------|
| `"Nacitam data..."` | `"Načítám data..."` |
| `"Nacist znovu"` | `"Načíst znovu"` |
| `"Nacist data z VIN"` | `"Načíst data z VIN"` |
| `"Znacka"` | `"Značka"` |
| `"Prevodovka"` | `"Převodovka"` |
| `"Vykon"` | `"Výkon"` |
| `"Mist"` | `"Míst"` |
| `"Rok vyroby"` | `"Rok výroby"` |
| `"Nase DB"` | `"Naše DB"` |
| `"v poradku"` | `"v pořádku"` |
| `"upozorneni k historii"` | `"upozornění k historii"` |
| `"Vozidlo je hlaseno jako odcizene!"` | `"Vozidlo je hlášeno jako odcizené!"` |
| `"najezdu kilometru"` | `"nájezdu kilometrů"` |
| `"skodne udalosti"` | `"škodné události"` |
| `"zatizeno financovanim"` | `"zatíženo financováním"` |
| `"Manualni"` / `"Automaticka"` | `"Manuální"` / `"Automatická"` |
| `"Predni"` / `"Zadni"` | `"Přední"` / `"Zadní"` |
| `"Nove"` / `"Vyborne"` / `"Dobre"` / `"Uspokojive"` / `"Poskozene"` | Všechny s háčky/čárkami |

**Toto je user-facing text v produkční PWA.** Makléři uvidí "Nacitam data" místo "Načítám data". Neakceptovatelné pro české UI.

**Fix:** Search-replace všech řetězců v `VinStep.tsx` — přidat diakritiku. ~25 řádků, čistě textový fix.

### P2 — NEBLOKUJÍCÍ: `editable` flag existuje v datech ale nepoužívá se v UI

`FieldWithSource.editable` je nastaven v merge logice (`vin-merge.ts:54`), ale žádná UI komponenta ho nevyužívá. VinStep zobrazuje data read-only (správně pro preview), ale DetailsStep (kde se formulář vyplňuje) ještě nemá smart form logiku — to je Fáze 2 (Task 2.1).

V rámci Fáze 1 je to OK — `editable` flag je připraven pro Fáze 2. Ale zadání "aby makléř nevyplňoval zbytečně údaje, které už systém správně načetl" a "formulář musí být dynamický" se plně naplní až po Fázi 2.

---

## Žádné zkratky v UI ✅ (kromě P1 diakritika)
- "Kontrola duplicity..." — plný text
- "VIN je unikátní" — plný text
- "Toto VIN jsme již zpracovali" — plný text
- "VIN se nepodařilo automaticky dekódovat" — plný text
- "Kde najdete VIN?" — plná otázka s 3 místy

---

## Závěr

Fáze 1 Smart VIN Data Pipeline odpovídá scope fáze:

- **Pipeline DB→CEBIA→Vincario→NHTSA** funguje ✅
- **Per-field source tracking** s confidence a editable ✅
- **Merge logika** s prioritou DB > CEBIA > Vincario > NHTSA ✅
- **VinStep UI** zobrazuje nalezená data se source badges ✅
- **Check-duplicate** rozlišuje ARCHIVED vs blocking ✅
- **CEBIA** graceful skip bez API klíče ✅
- **Backward compatible** přes `flattenSmartLookup` ✅
- **IndexedDB cache + offline** zachovány ✅

**BLOCKER:** Diakritika chybí v ~25 UI textech. Musí se opravit před deployem.

Zadání uživatele "formulář musí být dynamický, chytrý" se plně naplní až po Fázi 2 (Smart DetailsStep). Fáze 1 dodává datovou vrstvu a VinStep — to je správný scope.
