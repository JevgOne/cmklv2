# Plan: Standardizované schema pro kompletní lead

**Task:** #3
**Status:** PLAN READY
**Datum:** 2026-05-20
**Typ:** Enhancement (data quality)

---

## 1. Kontext

### Požadavek uživatele (doslovně):
- "musí to bejt nastavene perfektně, ty leady musí bejt kompletní"
- "nekdy lidi píšou vybavu do textu, nekdy ji vyplnují — musíme zvládnout obojí"
- "musíme mít vlastní formulář vecí které se mají vyplnit, scrapper naskenuje data a doplní"
- "není možné dat inzerát bez protože to je zbytečné"

### Cíl:
Každý lead v systému musí mít **vše co makléř potřebuje** pro rozhodnutí: fotky, popis, výbava, technické parametry, cena, kontakt. Nekompletní lead = zbytečný lead.

---

## 2. Completeness Schema — definice polí

### Tier 1: POVINNÉ (lead je BEZCENNÝ bez těchto)

| Pole | Typ | Zdroj | Poznámka |
|------|-----|-------|----------|
| `vehicleBrand` | String | Titulek/atributy | Škoda, VW, BMW... |
| `vehicleModel` | String | Titulek/atributy | Octavia, Golf, 3er... |
| `vehicleYear` | Int | Atributy/text | Rok výroby |
| `vehiclePrice` | Int | Atributy/text | Cena v CZK |
| `phone` | String | Detail page | Kontaktní telefon |
| `city` | String | Listing/detail | Lokace prodejce |
| `vehiclePhotos` | String[] | Detail/API | MIN 1 fotka |

**Pokud chybí JAKÉKOLIV pole z Tier 1 → lead NESMÍ být zobrazen makléři.**

### Tier 2: DŮLEŽITÉ (výrazně zvyšují hodnotu leadu)

| Pole | Typ | Zdroj | Poznámka |
|------|-----|-------|----------|
| `vehicleMileage` | Int | Atributy/text | Nájezd v km |
| `vehicleFuel` | Enum | Atributy/text | PETROL/DIESEL/HYBRID/ELECTRIC/LPG/CNG |
| `vehicleTransmission` | Enum | Atributy/text | MANUAL/AUTOMATIC |
| `vehicleDescription` | String | Detail page | Popis prodejce (min 50 znaků) |
| `name` | String | Detail/listing | Jméno prodejce |
| `vehicleBodyType` | Enum | Atributy/text | SEDAN/COMBI/SUV/HATCHBACK... |

### Tier 3: BONUS (nice to have)

| Pole | Typ | Zdroj | Poznámka |
|------|-----|-------|----------|
| `vehiclePower` | Int | Atributy/text | Výkon v kW |
| `vehicleColor` | String | Atributy/text | Barva |
| `vehicleEquipment` | String[] | Detail/text mining | Seznam výbavy |
| `vehicleDoors` | Int | Atributy | Počet dveří |
| `vehicleEngineCC` | Int | Atributy | Objem motoru |
| `listingTitle` | String | Listing | Titulek inzerátu |

---

## 3. Completeness Score — výpočet

### Formule:
```python
def calculate_completeness(lead: dict) -> int:
    """Returns 0-100 completeness score."""
    score = 0
    
    # Tier 1: 10 bodů za každé pole (7 × 10 = 70)
    TIER_1 = {
        "vehicle_brand": 10,
        "vehicle_model": 10,
        "vehicle_year": 10,
        "vehicle_price": 10,
        "phone": 10,
        "city": 10,
        "vehicle_photos": 10,  # min 1 fotka
    }
    
    # Tier 2: 3 body za každé pole (6 × 3 = 18)
    TIER_2 = {
        "vehicle_mileage": 3,
        "vehicle_fuel": 3,
        "vehicle_transmission": 3,
        "vehicle_description": 3,  # min 50 znaků
        "name": 3,
        "vehicle_body_type": 3,
    }
    
    # Tier 3: 2 body za každé pole (6 × 2 = 12)
    TIER_3 = {
        "vehicle_power": 2,
        "vehicle_color": 2,
        "vehicle_equipment": 2,  # min 3 položky
        "vehicle_doors": 2,
        "vehicle_engine_cc": 2,
        "listing_title": 2,
    }
    
    for field, points in {**TIER_1, **TIER_2, **TIER_3}.items():
        val = lead.get(field)
        if val is not None and val != "" and val != [] and val != "[]":
            # Special: photos need min 1, equipment min 3, description min 50 chars
            if field == "vehicle_photos":
                photos = json.loads(val) if isinstance(val, str) else val
                if len(photos) >= 1:
                    score += points
            elif field == "vehicle_equipment":
                equip = json.loads(val) if isinstance(val, str) else val
                if len(equip) >= 3:
                    score += points
            elif field == "vehicle_description":
                if len(str(val)) >= 50:
                    score += points
            else:
                score += points
    
    return min(score, 100)
```

### Prahy:
| Score | Status | Akce |
|-------|--------|------|
| **70-100** | KOMPLETNÍ | Zobrazit makléři, vhodný pro kontakt |
| **50-69** | ČÁSTEČNÝ | Zobrazit s upozorněním, kandidát pro re-enrichment |
| **0-49** | NEKOMPLETNÍ | NEZOBRAZOVAT makléři, spustit auto-enrichment |

### Tier 1 gate:
**Score MUSÍ být ≥ 70 (= všech 7 Tier 1 polí vyplněno) pro zobrazení makléři.**

Pokud lead nemá score ≥ 70 → zůstává v "staging" / skrytý → automatický re-enrichment.

---

## 4. Per-Source Capability Matrix

### Co DNES každý scraper dodá:

| Pole | Sauto | Bazoš | AS24 | Sbazar |
|------|-------|-------|------|--------|
| brand | ✓ | ✓ | ✓ | ✓ |
| model | ✓ | ✓ | ✓ | ✓ |
| year | ✓ | ✓(regex) | ✓ | ✓ |
| price | ✓ | ✓ | ✓ | ✓ |
| phone | ✓(API+DOM) | ✓(tel link) | ✗ | ✓(DOM) |
| city | ✓ | ✓ | ✓ | ✓ |
| photos | ✓(API) | ✓(DOM) | ✗ | ✓(DOM) |
| mileage | ✓ | ✓(regex) | ✓ | ✗ |
| fuel | ✓(API) | ✓(regex) | ✓(attr) | ✗ |
| transmission | ✓(API) | ✓(regex) | ✓(attr) | ✗ |
| description | ✓(API) | ✓(DOM) | ✗ | ✓(DOM) |
| equipment | ✓(API) | ✓(text mine) | ✗ | ✓(text mine) |
| body_type | ✓(API) | ✓(regex) | ✓(attr) | ✗ |
| power | ✓(API) | ✓(regex) | ✓(attr) | ✗ |
| color | ✓(API) | ✓(regex) | ✓(attr) | ✗ |
| doors | ✗ | ✗ | ✓(attr) | ✗ |
| engine_cc | ✗ | ✗ | ✓(attr) | ✗ |

### Maximální completeness score per source (dnes):

| Zdroj | Tier1 (70) | Tier2 (18) | Tier3 (12) | Max score |
|-------|-----------|-----------|-----------|-----------|
| **Sauto** | 70/70 | 18/18 | 8/12 | **96** |
| **Bazoš** | 70/70 | 18/18 | 10/12 | **98** |
| **AS24** | **40/70** ✗ | 12/18 | 12/12 | 64 (NEkompletní!) |
| **Sbazar** | 70/70 | 9/18 | 4/12 | **83** |

### PROBLÉM: AutoScout24
AS24 nemá: phone, photos, description → score max 64 → NEZOBRAZÍ SE makléři!

**Řešení pro AS24:**
1. **Přidat `_fetch_detail()` metodu** — navštívit detail stránku pro phone, photos, description
2. **Selektivně:** jen pro high-score leady (score > 40 po card parse)
3. **Rate limiting:** 1 detail fetch / 3-5s → při 50 leadech = 3-4 minuty navíc
4. **Alternativa:** Parse `__NEXT_DATA__` JSON (AS24 je Next.js) → strukturovaná data bez DOM parsování

---

## 5. Implementační plán

### Krok 1: Completeness score v lead-scout (Python) [IMPL]

**Nový soubor:** `lead_scout/completeness.py`

```python
def calculate_completeness(lead: dict) -> int:
    """Calculate 0-100 completeness score for a lead."""
    # Implementace viz §3
    ...

def is_complete(lead: dict) -> bool:
    """Check if lead meets minimum quality for display."""
    return calculate_completeness(lead) >= 70
```

**Integrace:**
- `db.py:save_lead()` → automaticky spočítá completeness a uloží do nového sloupce `completeness_score`
- `re_enrich.py` → po enrichmentu přepočítá score
- Push filtr: posílat do Carmakler JEN leady se score ≥ 50 (částečné + kompletní)

**Odhad:** ~50 řádků nový soubor + 5 řádků integrace

---

### Krok 2: Completeness score v Carmakler (TypeScript) [IMPL]

**Soubor:** `lib/scout-lead-management.ts`

```typescript
/** Calculate completeness score for display/filtering. */
function calculateCompleteness(lead: ScoutLead): number {
  let score = 0;
  // Tier 1 (70 points)
  if (lead.vehicleBrand) score += 10;
  if (lead.vehicleModel) score += 10;
  if (lead.vehicleYear) score += 10;
  if (lead.vehiclePrice) score += 10;
  if (lead.phone) score += 10;
  if (lead.city) score += 10;
  if (lead.vehiclePhotos) {
    const photos = JSON.parse(lead.vehiclePhotos);
    if (photos.length >= 1) score += 10;
  }
  // ... Tier 2 + 3
  return Math.min(score, 100);
}
```

**Nový sloupec v Prisma:**
```prisma
model ScoutLead {
  // ... existing ...
  completenessScore  Int?  @default(0)  // 0-100
}
```

**Odhad:** ~30 řádků + 1 migrace

---

### Krok 3: Completeness gate v admin UI [IMPL]

**Soubor:** `components/admin/scout-leads/ScoutLeadDetail.tsx`

Zobrazit completeness badge:
```tsx
<div className="flex items-center gap-2">
  <span className={cn(
    "px-2 py-0.5 text-xs rounded-full font-medium",
    score >= 70 ? "bg-green-50 text-green-700" :
    score >= 50 ? "bg-yellow-50 text-yellow-700" :
    "bg-red-50 text-red-700"
  )}>
    {score >= 70 ? "Kompletní" : score >= 50 ? "Částečný" : "Nekompletní"} ({score}%)
  </span>
</div>
```

**V list view:** Filtr podle completeness (kompletní / částečné / vše)

**Odhad:** ~15 řádků

---

### Krok 4: AutoScout24 detail page fetch [IMPL — lead-scout]

**Soubor:** `lead_scout/scrapers/autoscout24.py`

Nová metoda `_fetch_detail(client, source_url)`:
1. GET detail stránky
2. Parse `<script id="__NEXT_DATA__">` JSON
3. Extrakce: phone, description, photos[], equipment[]
4. Return: `(phone, description, photos, equipment)`

Volat JEN pro leady kde:
- card parse vrátil score > 40 (= má brand+model+year+price)
- delay 3-5s mezi requesty

**STOP:** Pokud `__NEXT_DATA__` nemá potřebná data (AS24 může renderovat CSR) → fallback na DOM parsing, nebo přeskočit detail enrichment.

**Odhad:** ~80 řádků nový kód

---

### Krok 5: Sbazar — přidat vehicle metadata extrakci [IMPL — lead-scout]

**Soubor:** `lead_scout/scrapers/sbazar.py`

Přidat do `_fetch_detail()`:
- Regex extrakce z description: fuel, transmission, power, color, mileage, body_type
- Použít stejné regex patterns jako Bazoš (sdílet utility modul)

**Nový soubor:** `lead_scout/scrapers/text_extraction.py`
- Sdílené regex funkce pro extrakci parametrů z textu
- Použito Bazošem i Sbazarem

**Odhad:** ~40 řádků (shared) + ~15 řádků (Sbazar integrace)

---

### Krok 6: Completeness-based push filtr [IMPL — lead-scout]

**Soubor:** `lead_scout/db.py` → `get_unpushed()`

```python
# PŘED:
WHERE push_status = 'PENDING' AND (is_active = 1 OR is_active IS NULL)

# PO:
WHERE push_status = 'PENDING' AND (is_active = 1 OR is_active IS NULL)
  AND completeness_score >= 50
ORDER BY completeness_score DESC, score DESC
```

Leady se score < 50 zůstávají v SQLite, kandidáti pro auto-re-enrichment.

**Odhad:** 2 řádky změna

---

## 6. Soubory k úpravě

### Lead Scout (Python)
| Soubor | Typ | Řádky |
|--------|-----|-------|
| `lead_scout/completeness.py` | NEW | ~50 |
| `lead_scout/scrapers/text_extraction.py` | NEW (shared regex) | ~40 |
| `lead_scout/scrapers/autoscout24.py` | UPDATE (detail fetch) | ~80 |
| `lead_scout/scrapers/sbazar.py` | UPDATE (metadata) | ~15 |
| `lead_scout/db.py` | UPDATE (completeness col + push filtr) | ~10 |
| `scripts/re_enrich.py` | UPDATE (recalc score) | ~5 |

### Carmakler (Next.js)
| Soubor | Typ | Řádky |
|--------|-----|-------|
| `prisma/schema.prisma` | UPDATE (+1 field) | ~1 |
| `lib/scout-lead-management.ts` | UPDATE (completeness calc) | ~30 |
| `components/admin/scout-leads/ScoutLeadDetail.tsx` | UPDATE (badge) | ~15 |

**Celkem:** ~250 řádků

---

## 7. STOP pravidla

- **STOP-1:** AS24 `__NEXT_DATA__` parsing nefunguje (CSR rendering) → přeskočit detail fetch, AS24 leady budou mít nižší completeness a nebudou se zobrazovat makléřům → to je OK, AS24 slouží primárně pro market-analysis data, ne pro makléřské leady
- **STOP-2:** Completeness gate score 70 → skryje příliš mnoho leadů (> 50%) → snížit na 50 nebo přidat "in review" stav
- **STOP-3:** Shared text_extraction.py regex patterns mají < 30% hit rate na novém zdroji → pro ten zdroj neaplikovat, nechat popis jako raw text
- **STOP-4:** Prisma migration `completeness_score` → pro existující leady bude NULL → naplnit migration scriptem (backfill), ne runtime kalkulací

---

## 8. Závislosti

- Task #1 (enrichment sync fix) MUSÍ být hotový PŘED tímto — jinak completeness score nebude mít aktuální data
- Krok 4 (AS24 detail) a Krok 5 (Sbazar metadata) jsou NEZÁVISLÉ — paralelizovatelné
- Krok 1 (Python completeness) a Krok 2 (TS completeness) jsou NEZÁVISLÉ
- Krok 6 (push filtr) vyžaduje Krok 1

---

## 9. Acceptance Criteria

- [ ] `completeness.py` počítá score 0-100 podle Tier 1/2/3 polí
- [ ] SQLite + Prisma mají `completeness_score` sloupec
- [ ] Score se automaticky počítá při save_lead() a update_lead()
- [ ] Leady se score < 50 se NEposílají do Carmakler
- [ ] Admin UI zobrazuje completeness badge (Kompletní/Částečný/Nekompletní)
- [ ] AS24 scraper má `_fetch_detail()` pro phone+photos+description+equipment
- [ ] Sbazar extrahuje vehicle metadata z description textu
- [ ] Shared text extraction regex utility funguje pro Bazoš i Sbazar
- [ ] Po deploy: > 80% SOUKROMNIK leadů má completeness ≥ 70
