# Zbývající vylepšení Scout Leads

**Datum:** 2026-05-21
**Typ:** Task list + mini-plány
**Status:** READY

---

## Přehled nových polí v DB vs. co zobrazuje UI

### Prisma schema (řádky 2610-2650) — 22 nových polí, ŽÁDNÉ v UI:

| DB pole | Typ | Zobrazeno v UI? | Priorita |
|---------|-----|-----------------|----------|
| `vehicleVin` | String? | ❌ | P1 |
| `vehicleLicensePlate` | String? | ❌ | P2 |
| `vehicleFirstRegistration` | String? | ❌ | P2 |
| `vehicleFirstOwner` | Boolean? | ❌ | P1 |
| `vehicleCrashedInPast` | Boolean? | ❌ | P1 |
| `vehicleServiceBook` | Boolean? | ❌ | P1 |
| `vehicleStkDate` | String? | ❌ | P2 |
| `vehicleCountryOfOrigin` | String? | ❌ | P2 |
| `vehicleCondition` | String? | ❌ | P2 |
| `vehicleDrive` | String? | ❌ | P3 |
| `vehicleGearboxLevels` | String? | ❌ | P3 |
| `vehicleEuroLevel` | String? | ❌ | P3 |
| `vehicleConsumption` | Float? | ❌ | P2 |
| `vehicleCapacity` | Int? | ❌ | P3 |
| `vehicleAirbags` | Int? | ❌ | P3 |
| `vehicleAircondition` | String? | ❌ | P3 |
| `vehicleColorTone` | String? | ❌ | P3 |
| `vehicleColorType` | String? | ❌ | P3 |
| `vehicleModelDetail` | String? | ❌ | P2 |
| `vehiclePriceWithoutVat` | Int? | ❌ | P2 |
| `vehicleVatDeductible` | Boolean? | ❌ | P2 |
| `vehicleDistrict` | String? | ❌ | P3 |
| `vehicleVideos` | String? (JSON) | ❌ | P2 |
| `completenessScore` | Int? | ❌ (jen local calc) | P1 |

**Poznámka:** API endpoint `GET /api/scout-leads/[id]` používá `include` (ne `select`), takže VŠECHNA nová pole se už posílají v response. Stačí je zobrazit v UI.

---

## Prioritizovaný seznam tasků

### TASK A (P1): Sekce "Stav a historie vozidla" v lead detailu

**Kde:** `ScoutLeadDetail.tsx` — nová karta mezi spec chips a fotkami

**Nová pole k zobrazení:**

| Pole | UI label | Formát | Příklad |
|------|----------|--------|---------|
| `vehicleVin` | VIN | Monospace, copy button | `WVWZZZ3CZ…` |
| `vehicleFirstOwner` | První majitel | ✓/✗ badge | ✓ Ano |
| `vehicleCrashedInPast` | Havárie | ✓/✗ badge (inverted: ✓=nebouráno) | ✓ Nebouráno |
| `vehicleServiceBook` | Servisní knížka | ✓/✗ badge | ✓ Ano |
| `vehicleStkDate` | STK do | Datum text | 06/2027 |
| `vehicleCountryOfOrigin` | Země původu | Text | Česká republika |
| `vehicleCondition` | Stav | Badge (barevný) | Ojeté / Nové / Havarované |

**Vizuální layout:**
```
┌─────────────────────────────────────────────────┐
│  STAV VOZIDLA                                   │
│                                                 │
│  VIN: WVWZZZ3CZWE123456          [📋 Kopírovat] │
│                                                 │
│  ✓ První majitel   ✓ Nebouráno   ✓ Serv. knížka│
│  STK: 06/2027      Původ: ČR     Stav: Ojeté   │
└─────────────────────────────────────────────────┘
```

**Soubory:**
- `ScoutLeadDetail.tsx` — přidat do `ScoutLeadData` interface (řádek 16-81) + nová Card sekce
- Žádný nový soubor nutný

**Odhad:** ~40 řádků

---

### TASK B (P1): Completeness score/grade v lead listu

**Aktuální stav:**
- `completenessScore` existuje v DB (scraperový 0-100 score z lead-scout)
- `LeadDataCompleteness.tsx` počítá VLASTNÍ score z 8-10 polí (starý 10-bodový systém)
- `ScoutLeadsTable.tsx` NEZOBRAZUJE žádný completeness indikátor
- API list endpoint (`GET /api/scout-leads`) vrací všechna pole (používá `include`)

**Co udělat:**

1. **ScoutLeadsTable.tsx** — přidat sloupec "Kompletnost" za Score:
   ```tsx
   // V interface ScoutLead přidat:
   completenessScore: number | null;
   
   // V tabulce — nový <th> + <td>:
   <td className="py-3 px-4 hidden md:table-cell">
     <CompletenessGradeBadge score={lead.completenessScore} />
   </td>
   ```

2. **Nová komponenta `CompletenessGradeBadge.tsx`** (~25 řádků):
   ```tsx
   function gradeFromScore(score: number | null): { grade: string; color: string } {
     if (score == null || score === 0) return { grade: "?", color: "bg-gray-100 text-gray-400" };
     if (score >= 80) return { grade: "A", color: "bg-green-100 text-green-700" };
     if (score >= 60) return { grade: "B", color: "bg-blue-100 text-blue-700" };
     if (score >= 40) return { grade: "C", color: "bg-orange-100 text-orange-700" };
     if (score >= 20) return { grade: "D", color: "bg-red-100 text-red-600" };
     return { grade: "F", color: "bg-red-200 text-red-800" };
   }
   ```

3. **ScoutLeadsTable.tsx** — přidat filter "Kompletnost" (min score slider nebo grade dropdown)

**Soubory:**
- `components/admin/scout-leads/ScoutLeadsTable.tsx` — +1 sloupec, +interface pole
- `components/admin/scout-leads/CompletenessGradeBadge.tsx` — NOVÝ (~25 řádků)

**Odhad:** ~35 řádků

---

### TASK C (P1): Structured equipment display (kategorie)

**Aktuální stav:**
- `vehicleEquipment` je `String?` s JSON — starý formát: `["ABS", "ESP", ...]`
- Nový formát (z Fáze A): `[{"name": "ABS", "category": "safety"}, ...]`
- `ScoutLeadDetail.tsx` řádky 364-368 parsuje jako `string[]` — **NEFUNGUJE** pro nový formát
- `LeadEquipmentTags.tsx` parsuje equipment z titulku, ne z `vehicleEquipment`

**Co udělat:**

1. **ScoutLeadDetail.tsx** řádky 364-368 — parsovat oba formáty:
   ```tsx
   type EquipmentItem = string | { name: string; category?: string };
   let rawEquipment: EquipmentItem[] = [];
   if (lead.vehicleEquipment) {
     try { rawEquipment = JSON.parse(lead.vehicleEquipment); } catch { /* */ }
   }
   ```

2. **Nové zobrazení po kategoriích** místo flat seznamu tagů:
   ```
   ┌───────────────────────────────────────────┐
   │  VÝBAVA                                   │
   │                                           │
   │  Bezpečnost: ABS · ESP · Airbag řidiče    │
   │  Komfort: Klima · Tempomat · Vyhř. sedadla│
   │  Exteriér: LED světla · Mlhovky           │
   │  Interiér: Kožená sedadla · Navigace      │
   │  Ostatní: Tažné zařízení · Střešní nosič  │
   └───────────────────────────────────────────┘
   ```

3. **Fallback** pro starý flat formát (plain strings bez category):
   - Zobrazit jako "Ostatní" skupinu
   - Backward compatible

**Soubory:**
- `ScoutLeadDetail.tsx` — řádky 364-368 (parse) + řádky 509-528 (render)

**Odhad:** ~50 řádků

---

### TASK D (P2): Rozšířené spec chips (nová pole v hero banneru)

**Aktuální stav:** `specChips` (řádky 371-380) obsahuje 9 polí: rok, km, palivo, převodovka, výkon, motor, karoserie, barva, dveře.

**Nová pole k přidání do spec chips:**
```tsx
// Po řádku 380:
if (lead.vehicleDrive) specChips.push({ label: "Pohon", value: driveLabels[lead.vehicleDrive] || lead.vehicleDrive });
if (lead.vehicleConsumption != null) specChips.push({ label: "Spotřeba", value: `${lead.vehicleConsumption} l/100km` });
if (lead.vehicleCapacity != null) specChips.push({ label: "Míst", value: String(lead.vehicleCapacity) });
if (lead.vehicleModelDetail) specChips.push({ label: "Verze", value: lead.vehicleModelDetail });
if (lead.vehicleAircondition) specChips.push({ label: "Klima", value: aircondLabels[lead.vehicleAircondition] || lead.vehicleAircondition });
```

**Nové label mapy:**
```tsx
const driveLabels: Record<string, string> = {
  FWD: "Přední", RWD: "Zadní", AWD: "4x4", "4x4": "4x4",
};
const aircondLabels: Record<string, string> = {
  MANUAL: "Manuální klima", AUTOMATIC: "Automatická klima", NONE: "Bez klima",
};
```

**Nutné také přidat do `ScoutLeadData` interface** (řádky 16-81):
```typescript
vehicleDrive: string | null;
vehicleConsumption: number | null;
vehicleCapacity: number | null;
vehicleModelDetail: string | null;
vehicleAircondition: string | null;
vehicleVin: string | null;
vehicleLicensePlate: string | null;
vehicleFirstRegistration: string | null;
vehicleFirstOwner: boolean | null;
vehicleCrashedInPast: boolean | null;
vehicleServiceBook: boolean | null;
vehicleStkDate: string | null;
vehicleCountryOfOrigin: string | null;
vehicleCondition: string | null;
vehicleEuroLevel: string | null;
vehicleAirbags: number | null;
vehicleColorTone: string | null;
vehicleColorType: string | null;
vehiclePriceWithoutVat: number | null;
vehicleVatDeductible: boolean | null;
vehicleDistrict: string | null;
vehicleVideos: string | null;
vehicleGearboxLevels: string | null;
completenessScore: number | null;
```

**Soubory:**
- `ScoutLeadDetail.tsx` — interface (řádky 16-81) + specChips (řádky 371-380) + label mapy

**Odhad:** ~40 řádků

---

### TASK E (P2): Videos card

**Aktuální stav:** `vehicleVideos` je `String?` s JSON array video URLs. Žádné zobrazení v UI.

**Co udělat:**
```tsx
// Nová komponenta VehicleVideosCard — pod VehiclePhotosCard
function VehicleVideosCard({ videosJson }: { videosJson: string }) {
  let videos: string[] = [];
  try { videos = JSON.parse(videosJson); } catch { return null; }
  if (videos.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
        Videa ({videos.length})
      </h3>
      <div className="space-y-2">
        {videos.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 text-sm text-orange-600 hover:underline">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Video {i + 1}
          </a>
        ))}
      </div>
    </Card>
  );
}
```

**Umístění:** Za `VehiclePhotosCard` v renderu (řádek 501-502)

**Odhad:** ~25 řádků

---

### TASK F (P2): Cena bez DPH + odpočet DPH

**Aktuální stav:** Hero banner zobrazuje jen `vehiclePrice`. Chybí:
- `vehiclePriceWithoutVat` — cena bez DPH
- `vehicleVatDeductible` — možnost odpočtu DPH

**Co udělat — v hero banneru (řádky 452-456):**
```tsx
{isSoukromnik && lead.vehiclePrice != null && lead.vehiclePrice > 0 && (
  <div className="text-right">
    <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
      {lead.vehiclePrice.toLocaleString("cs-CZ")} Kč
    </div>
    {lead.vehiclePriceWithoutVat && (
      <div className="text-sm text-white/60 tabular-nums">
        {lead.vehiclePriceWithoutVat.toLocaleString("cs-CZ")} Kč bez DPH
      </div>
    )}
    {lead.vehicleVatDeductible && (
      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded bg-green-500/20 text-green-300 font-medium">
        Odpočet DPH
      </span>
    )}
  </div>
)}
```

**Odhad:** ~15 řádků

---

### TASK G (P2): Aktualizovat LeadDataCompleteness

**Aktuální stav:**
- `lib/lead-completeness.ts` má jen 8 polí pro SOUKROMNIK (10 bodů)
- DB má `completenessScore` (0-100, scraperový Tier 1-4 systém)
- Dvě konkurující completeness: local 10-bodový vs. scraperový 100-bodový

**Co udělat:**

1. **Preferovat DB `completenessScore`** pokud existuje (scraperový je přesnější)
2. **Rozšířit lokální kalkulaci** o nová pole:
   ```typescript
   const SOUKROMNIK_FIELDS = [
     // Tier 1 — kritická (60 bodů)
     { key: "vehicleBrand", label: "Značka", points: 8 },
     { key: "vehicleModel", label: "Model", points: 8 },
     { key: "vehicleYear", label: "Rok", points: 8 },
     { key: "vehiclePrice", label: "Cena", points: 10 },
     { key: "phone", label: "Telefon", points: 10 },
     { key: "city", label: "Město", points: 6 },
     { key: "vehiclePhotos", label: "Fotky", points: 10 },
     // Tier 2 — důležitá (25 bodů)
     { key: "vehicleMileage", label: "Nájezd", points: 5 },
     { key: "vehicleFuel", label: "Palivo", points: 4 },
     { key: "vehicleTransmission", label: "Převodovka", points: 4 },
     { key: "vehicleDescription", label: "Popis", points: 4 },
     { key: "vehicleEquipment", label: "Výbava", points: 4 },
     { key: "vehicleBodyType", label: "Karoserie", points: 2 },
     { key: "vehiclePower", label: "Výkon", points: 2 },
     // Tier 3 — historie (10 bodů)
     { key: "vehicleVin", label: "VIN", points: 5 },
     { key: "vehicleServiceBook", label: "Serv. knížka", points: 2 },
     { key: "vehicleFirstOwner", label: "1. majitel", points: 2 },
     { key: "vehicleStkDate", label: "STK", points: 1 },
     // Tier 4 — bonus (5 bodů)
     { key: "vehicleConsumption", label: "Spotřeba", points: 2 },
     { key: "vehicleDrive", label: "Pohon", points: 1 },
     { key: "vehicleCountryOfOrigin", label: "Původ", points: 1 },
     { key: "vehicleCondition", label: "Stav", points: 1 },
   ];
   // Max = 100
   ```

3. **`LeadDataCompleteness.tsx`** — zobrazit i grade (A-F) vedle procent

**Soubory:**
- `lib/lead-completeness.ts` — rozšířit SOUKROMNIK_FIELDS
- `components/admin/scout-leads/LeadDataCompleteness.tsx` — přidat grade badge

**Odhad:** ~40 řádků

---

### TASK H (P2): Similar offers — chybějící rok/km (ZÁVISLÝ na market analysis fix)

**Aktuální stav:** Similar offers zobrazují "—" pro rok a km.

**Root cause:** `fetchSauto()` čte neexistující `item.year` a `item.mileage` (viz `plan-market-analysis-fix.md`).

**Fix je součástí `plan-market-analysis-fix.md` Krok 4** (fetchSauto rewrite). Tento task je jen UI ověření po deployi market analysis fixu — žádné UI změny potřeba, data se automaticky zobrazí správně.

**Soubory:** Žádné UI změny — jen verifikace po market fix deployi.

---

### TASK I (P3): District v lokaci

**Aktuální stav:** `vehicleDistrict` existuje v DB, ale v "Kontakt a lokace" sekci se nezobrazuje.

**Fix (řádky 607-611):**
```tsx
{(lead.city || lead.vehicleDistrict) && (
  <div>
    <dt className="text-gray-500">Město</dt>
    <dd>
      {lead.city}
      {lead.vehicleDistrict && lead.vehicleDistrict !== lead.city ? `, ${lead.vehicleDistrict}` : ""}
      {lead.region ? `, ${lead.region}` : ""}
      {lead.zip ? ` ${lead.zip}` : ""}
    </dd>
  </div>
)}
```

**Odhad:** ~5 řádků

---

### TASK J (P3): Technické detaily karta

**Pole:** `vehicleDrive`, `vehicleGearboxLevels`, `vehicleEuroLevel`, `vehicleConsumption`, `vehicleCapacity`, `vehicleAirbags`, `vehicleAircondition`

**Zobrazit jako:** Samostatná Card "Technické detaily" s dl/dt/dd grid (jako Kontakt a lokace)

**Podmínka:** Zobrazit jen pokud alespoň 1 z polí není null.

**Odhad:** ~35 řádků

---

## Souhrn priorit

| Task | Priorita | Popis | Řádky | Závislosti |
|------|----------|-------|-------|------------|
| A | P1 | Stav a historie vozidla (VIN, havárie, 1. majitel, STK) | ~40 | Žádné |
| B | P1 | Completeness grade v lead listu | ~35 | Žádné |
| C | P1 | Structured equipment po kategoriích | ~50 | Žádné |
| D | P2 | Rozšířené spec chips + ScoutLeadData interface | ~40 | Žádné (ale MUSÍ být první — interface nutný pro A,E,F) |
| E | P2 | Videos card | ~25 | D (interface) |
| F | P2 | Cena bez DPH + odpočet DPH badge | ~15 | D (interface) |
| G | P2 | Aktualizovat LeadDataCompleteness (Tier 1-4, 100 bodů) | ~40 | Žádné |
| H | P2 | Similar offers rok/km fix | 0 (UI ověření) | Market analysis fix (#17) |
| I | P3 | District v lokaci | ~5 | D (interface) |
| J | P3 | Technické detaily karta | ~35 | D (interface) |

**Doporučené pořadí implementace:**
1. **D** (interface rozšíření — prerequisite pro většinu ostatních)
2. **A** (nejviditelnější pro uživatele — VIN, havárie, servisní knížka)
3. **C** (výbava po kategoriích — velký vizuální upgrade)
4. **B** (completeness v listu — rychlé orientování)
5. **G** (aktualizace completeness kalkulace)
6. **E + F** (videa + DPH — menší features)
7. **I + J** (P3 — nice-to-have)
8. **H** (závisí na market analysis fix deployi)

**Celkem:** ~285 řádků, 4 soubory (3 upravené + 1 nový).
