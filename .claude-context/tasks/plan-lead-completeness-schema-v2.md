# Plan v2: Rozšířené schema + Completeness Gate + Clean Re-scrape

**Task:** #6
**Status:** PLAN READY
**Datum:** 2026-05-20
**Typ:** Enhancement (data quality + schema expansion)
**Nahrazuje:** plan-lead-completeness-schema.md (v1)

---

## 1. Strategie: Smazat → Vyladit → Přescrapovat

Uživatel schválil čistý přístup:
1. **Vyladit scrapery** na 3-5 testovacích inzerátech per zdroj
2. **Iterovat** dokud completeness = 100% pro Sauto, ~80% pro Bazoš/Sbazar
3. **Smazat** staré SOUKROMNIK leady z produkce
4. **Přescrapovat** znovu — čistý ingest přes existující API

**Žádný PATCH/sync endpoint není potřeba.** Existující `POST /api/scout-leads/ingest` stačí.

---

## 2. Kompletní schema — VŠECHNA pole ze Sauto API

### Benchmark: VW California (source_id: 210452900)

Sauto API vrací 40+ polí. Níže je kompletní mapování **nových polí** (pole co JIŽ máme v schema jsou vynechána).

### 2.1 Nové sloupce pro Prisma ScoutLead model

```prisma
model ScoutLead {
  // ... EXISTING fields (beze změny) ...

  // ═══ NEW: Vehicle identity ═══
  vehicleVin              String?   // VIN kód — INDEXED for cross-lead dedup & history
  vehicleLicensePlate     String?   // SPZ / registrační značka (mění se v čase, VIN je stálý)

  // ═══ NEW: Vehicle history & condition ═══
  vehicleFirstRegistration String?  // ISO date (in_operation_date) "2021-12-01"
  vehicleFirstOwner       Boolean?  // first_owner
  vehicleCrashedInPast    Boolean?  // crashed_in_past
  vehicleServiceBook      Boolean?  // service_book
  vehicleStkDate          String?   // STK platnost "2026-12-01"
  vehicleCountryOfOrigin  String?   // country_of_origin_cb.name "Česká republika"
  vehicleCondition        String?   // condition_cb.name "Ojeté"

  // ═══ NEW: Technical specs ═══
  vehicleDrive            String?   // drive_cb.name "4x4" | "Přední" | "Zadní"
  vehicleGearboxLevels    String?   // gearbox_levels_cb.name "7 stupňová"
  vehicleEuroLevel        String?   // euro_level_cb.name "EURO 6"
  vehicleConsumption      Float?    // average_gas_mileage (l/100km)
  vehicleCapacity         Int?      // počet míst (capacity)
  vehicleAirbags          Int?      // počet airbagů
  vehicleAircondition     String?   // aircondition_cb.name "Dvouzónová automatická"

  // ═══ NEW: Color detail ═══
  vehicleColorTone        String?   // color_tone_cb.name "Tmavá"
  vehicleColorType        String?   // color_type_cb.name "Metalíza"

  // ═══ NEW: Model detail ═══
  vehicleModelDetail      String?   // additional_model_name "T 6.1 Beach, 4Mot. 150kW"

  // ═══ NEW: Pricing detail ═══
  vehiclePriceWithoutVat  Int?      // price_without_vat
  vehicleVatDeductible    Boolean?  // price_is_vat_deductible

  // ═══ NEW: Location extended ═══
  vehicleDistrict         String?   // locality.district "Praha-západ"
  // (city a region already exist in ScoutLead)

  // ═══ NEW: Media ═══
  vehicleVideos           String?   // JSON array of video URLs @db.Text

  // ═══ CHANGED: Equipment format ═══
  // vehicleEquipment: String? → ZŮSTÁVÁ, ale formát JSON se mění:
  // PŘED: ["ABS", "ESP", "Klima"]
  // PO:   [{"name": "ABS", "category": "safety"}, {"name": "ESP", "category": "safety"}, ...]

  // ═══ NEW: Completeness tracking ═══
  completenessScore       Int?      @default(0)  // 0-100

  // ═══ NEW INDEX: VIN for cross-lead dedup & vehicle history ═══
  @@index([vehicleVin])
}
```

**Celkem: 22 nových sloupců + 1 format change (equipment) + 1 completeness score + 1 VIN index = 25 změn**

---

### 2.2 Nové sloupce pro SQLite (lead_scout/db.py)

```python
# V _init_db() safe migrations — přidat:
("vehicle_vin", "TEXT"),
("vehicle_license_plate", "TEXT"),            # SPZ
("vehicle_first_registration", "TEXT"),     # ISO date
("vehicle_first_owner", "INTEGER"),          # 0/1 boolean
("vehicle_crashed_in_past", "INTEGER"),      # 0/1 boolean
("vehicle_service_book", "INTEGER"),         # 0/1 boolean
("vehicle_stk_date", "TEXT"),                # ISO date
("vehicle_country_of_origin", "TEXT"),
("vehicle_condition", "TEXT"),
("vehicle_drive", "TEXT"),                   # 4x4, Přední, Zadní
("vehicle_gearbox_levels", "TEXT"),          # "7 stupňová"
("vehicle_euro_level", "TEXT"),              # "EURO 6"
("vehicle_consumption", "REAL"),             # l/100km
("vehicle_capacity", "INTEGER"),             # seats
("vehicle_airbags", "INTEGER"),
("vehicle_aircondition", "TEXT"),
("vehicle_color_tone", "TEXT"),              # Tmavá/Světlá
("vehicle_color_type", "TEXT"),              # Metalíza/Pastel
("vehicle_model_detail", "TEXT"),            # podrobný model
("vehicle_price_without_vat", "INTEGER"),
("vehicle_vat_deductible", "INTEGER"),       # 0/1
("vehicle_videos", "TEXT"),                  # JSON array
("vehicle_district", "TEXT"),                # locality.district
("completeness_score", "INTEGER DEFAULT 0"),
```

**+ SQLite index na VIN:**
```python
try:
    conn.execute("CREATE INDEX IF NOT EXISTS idx_leads_vin ON leads(vehicle_vin)")
except sqlite3.OperationalError:
    pass
```

**24 nových safe-migration sloupců + 1 VIN index**

---

### 2.3 Nové pole v Pydantic modelu (lead_scout/models.py)

```python
class ScoutLeadPayload(BaseModel):
    # ... existing fields ...

    # Vehicle identity (NEW)
    vehicle_vin: Optional[str] = None
    vehicle_license_plate: Optional[str] = None       # SPZ

    # Vehicle history & condition (NEW)
    vehicle_first_registration: Optional[str] = None  # ISO date
    vehicle_first_owner: Optional[bool] = None
    vehicle_crashed_in_past: Optional[bool] = None
    vehicle_service_book: Optional[bool] = None
    vehicle_stk_date: Optional[str] = None
    vehicle_country_of_origin: Optional[str] = None
    vehicle_condition: Optional[str] = None

    # Technical specs (NEW)
    vehicle_drive: Optional[str] = None
    vehicle_gearbox_levels: Optional[str] = None
    vehicle_euro_level: Optional[str] = None
    vehicle_consumption: Optional[float] = None
    vehicle_capacity: Optional[int] = None
    vehicle_airbags: Optional[int] = None
    vehicle_aircondition: Optional[str] = None

    # Color detail (NEW)
    vehicle_color_tone: Optional[str] = None
    vehicle_color_type: Optional[str] = None

    # Model detail (NEW)
    vehicle_model_detail: Optional[str] = None

    # Pricing (NEW)
    vehicle_price_without_vat: Optional[int] = None
    vehicle_vat_deductible: Optional[bool] = None

    # Location extended (NEW)
    vehicle_district: Optional[str] = None    # locality.district

    # Media (NEW)
    vehicle_videos: Optional[list[str]] = None
```

---

### 2.4 Nové pole v Zod validátoru (lib/validators/scout-lead.ts)

```typescript
// Vehicle identity (NEW)
vehicleVin: z.string().optional().nullable(),
vehicleLicensePlate: z.string().optional().nullable(),

// Vehicle history & condition (NEW)
vehicleFirstRegistration: z.string().optional().nullable(),
vehicleFirstOwner: z.boolean().optional().nullable(),
vehicleCrashedInPast: z.boolean().optional().nullable(),
vehicleServiceBook: z.boolean().optional().nullable(),
vehicleStkDate: z.string().optional().nullable(),
vehicleCountryOfOrigin: z.string().optional().nullable(),
vehicleCondition: z.string().optional().nullable(),

// Technical specs (NEW)
vehicleDrive: z.string().optional().nullable(),
vehicleGearboxLevels: z.string().optional().nullable(),
vehicleEuroLevel: z.string().optional().nullable(),
vehicleConsumption: z.number().min(0).optional().nullable(),
vehicleCapacity: z.number().int().min(1).max(50).optional().nullable(),
vehicleAirbags: z.number().int().min(0).optional().nullable(),
vehicleAircondition: z.string().optional().nullable(),

// Color detail (NEW)
vehicleColorTone: z.string().optional().nullable(),
vehicleColorType: z.string().optional().nullable(),

// Model detail (NEW)
vehicleModelDetail: z.string().optional().nullable(),

// Pricing (NEW)
vehiclePriceWithoutVat: z.number().int().min(0).optional().nullable(),
vehicleVatDeductible: z.boolean().optional().nullable(),

// Location extended (NEW)
vehicleDistrict: z.string().optional().nullable(),

// Media (NEW)
vehicleVideos: z.array(z.string().min(1)).optional().nullable(),
```

---

### 2.5 Snake→Camel mapování v client.py

```python
# Přidat do CarmaklerClient.SNAKE_TO_CAMEL:
"vehicle_vin": "vehicleVin",
"vehicle_license_plate": "vehicleLicensePlate",
"vehicle_first_registration": "vehicleFirstRegistration",
"vehicle_first_owner": "vehicleFirstOwner",
"vehicle_crashed_in_past": "vehicleCrashedInPast",
"vehicle_service_book": "vehicleServiceBook",
"vehicle_stk_date": "vehicleStkDate",
"vehicle_country_of_origin": "vehicleCountryOfOrigin",
"vehicle_condition": "vehicleCondition",
"vehicle_drive": "vehicleDrive",
"vehicle_gearbox_levels": "vehicleGearboxLevels",
"vehicle_euro_level": "vehicleEuroLevel",
"vehicle_consumption": "vehicleConsumption",
"vehicle_capacity": "vehicleCapacity",
"vehicle_airbags": "vehicleAirbags",
"vehicle_aircondition": "vehicleAircondition",
"vehicle_color_tone": "vehicleColorTone",
"vehicle_color_type": "vehicleColorType",
"vehicle_model_detail": "vehicleModelDetail",
"vehicle_price_without_vat": "vehiclePriceWithoutVat",
"vehicle_vat_deductible": "vehicleVatDeductible",
"vehicle_videos": "vehicleVideos",
"vehicle_district": "vehicleDistrict",
"vehicle_license_plate": "vehicleLicensePlate",

# Přidat do JSON_FIELDS:
JSON_FIELDS = {"vehicle_equipment", "vehicle_photos", "vehicle_videos"}

# Boolean fields: vehicle_first_owner, vehicle_crashed_in_past, vehicle_service_book, vehicle_vat_deductible
# SQLite ukládá jako 0/1 INTEGER → client.py musí konvertovat na Python bool pro JSON
BOOL_FIELDS = {"vehicle_first_owner", "vehicle_crashed_in_past", "vehicle_service_book", "vehicle_vat_deductible"}
```

---

### 2.6 Ingest handler update (lib/scout-lead-management.ts)

V `ingestScoutLeads()` přidat nová pole do `prisma.scoutLead.create({ data: ... })`:

```typescript
vehicleVin: payload.vehicleVin ?? null,
vehicleFirstRegistration: payload.vehicleFirstRegistration ?? null,
vehicleFirstOwner: payload.vehicleFirstOwner ?? null,
vehicleCrashedInPast: payload.vehicleCrashedInPast ?? null,
vehicleServiceBook: payload.vehicleServiceBook ?? null,
vehicleStkDate: payload.vehicleStkDate ?? null,
vehicleCountryOfOrigin: payload.vehicleCountryOfOrigin ?? null,
vehicleCondition: payload.vehicleCondition ?? null,
vehicleDrive: payload.vehicleDrive ?? null,
vehicleGearboxLevels: payload.vehicleGearboxLevels ?? null,
vehicleEuroLevel: payload.vehicleEuroLevel ?? null,
vehicleConsumption: payload.vehicleConsumption ?? null,
vehicleCapacity: payload.vehicleCapacity ?? null,
vehicleAirbags: payload.vehicleAirbags ?? null,
vehicleAircondition: payload.vehicleAircondition ?? null,
vehicleColorTone: payload.vehicleColorTone ?? null,
vehicleColorType: payload.vehicleColorType ?? null,
vehicleModelDetail: payload.vehicleModelDetail ?? null,
vehiclePriceWithoutVat: payload.vehiclePriceWithoutVat ?? null,
vehicleVatDeductible: payload.vehicleVatDeductible ?? null,
vehicleVideos: payload.vehicleVideos ? JSON.stringify(payload.vehicleVideos) : null,
```

---

## 3. Equipment format change: flat → structured

### PŘED (aktuální):
```json
["ABS", "ESP", "Klima", "Tempomat", "Navigace"]
```

### PO (cílový):
```json
[
  {"name": "ABS", "category": "safety"},
  {"name": "ESP", "category": "safety"},
  {"name": "Dvouzónová automatická klima", "category": "interior"},
  {"name": "Adaptivní tempomat", "category": "assist"},
  {"name": "Satelitní navigace", "category": "systems"}
]
```

### Kategorie (z Sauto API `equipment_category`):
| Kategorie | CZ název | Příklady |
|-----------|----------|----------|
| `safety` | Bezpečnostní systémy | ABS, ESP, ASR, Nouzové brzdění |
| `assist` | Asistenční systémy | Tempomat, Parkovací kamera, Front Assist |
| `security` | Zabezpečení | Alarm, Centrální zamykání, Imobilizér |
| `interior` | Vnitřní výbava | El. okna, Nezávislé topení, Multifunkční volant |
| `systems` | Palubní systémy | Android Auto, Navigace, DAB, WiFi |
| `seats` | Sedadla | Isofix, Vyhřívaná sedadla, Výškově nastavitelná |
| `lights` | Světla | LED adaptivní, Auto svícení, Mlhovky |
| `exterior` | Vnější výbava | Litá kola, Tónovaná skla, Střešní okno |
| `drive` | Pohon a podvozek | Start/Stop, Uzávěrka diferenciálu |

### Zpětná kompatibilita:
- Zod: `vehicleEquipment: z.array(z.union([z.string(), z.object({name: z.string(), category: z.string().optional()})]))` — přijme oba formáty
- Frontend parsování: check `typeof item === 'string'` → flat, jinak structured
- Sauto: posílá structured (category z API)
- Bazoš/Sbazar: posílá structured s automatickým category mapping

### Category auto-mapping pro Bazoš/Sbazar (keyword → category):
```python
EQUIPMENT_CATEGORY_MAP = {
    # safety
    "abs": "safety", "esp": "safety", "asr": "safety", "airbag": "safety",
    "brzd": "safety",
    # assist
    "tempomat": "assist", "parkov": "assist", "kamera": "assist",
    "asistent": "assist", "senzor": "assist",
    # security
    "alarm": "security", "zamyk": "security", "imobiliz": "security",
    # interior
    "klima": "interior", "okna": "interior", "zrcát": "interior",
    "volant": "interior", "topení": "interior", "sedač": "interior",
    # systems
    "navigace": "systems", "bluetooth": "systems", "rádio": "systems",
    "android": "systems", "apple": "systems", "usb": "systems",
    # seats
    "isofix": "seats", "sedadl": "seats", "opěr": "seats",
    # lights
    "led": "lights", "xenon": "lights", "svět": "lights",
    # exterior
    "kola": "exterior", "střech": "exterior", "skla": "exterior",
    "tažné": "exterior", "stěrač": "exterior",
    # drive
    "start/stop": "drive", "diferenciál": "drive", "4x4": "drive",
}

def categorize_equipment(name: str) -> str:
    """Auto-assign category to equipment item based on keywords."""
    name_lower = name.lower()
    for keyword, category in EQUIPMENT_CATEGORY_MAP.items():
        if keyword in name_lower:
            return category
    return "other"
```

---

## 4. Per-Source mapování: Sauto API → schema

### Sauto `_fetch_detail()` — kompletní API mapování

Aktuální `_fetch_detail` metoda v `sauto.py` parsuje API JSON. Potřebuje rozšíření:

```python
# V _fetch_detail(), po úspěšném API GET:
data = response.json().get("result", {})

# EXISTING (already parsed):
phone = data.get("phone")
description = data.get("description", "")
photos = [f"https:{img['url']}" for img in data.get("images", [])]
equipment = [{"name": eq["name"], "category": eq.get("equipment_category", "other")}
             for eq in data.get("equipment_cb", [])]

# METADATA (already parsed partially):
metadata = {
    "year": None,  # from in_operation_date
    "mileage": data.get("tachometer"),
    "fuel": FUEL_MAP.get(data.get("fuel_cb", {}).get("seo_name", ""), None),
    "transmission": TRANSMISSION_MAP.get(data.get("gearbox_cb", {}).get("name", "").lower(), None),
    "power": data.get("engine_power"),
    "body_type": data.get("vehicle_body_cb", {}).get("name"),
    "color": data.get("color_cb", {}).get("name"),
}

# ═══ NEW fields to extract: ═══
extended = {
    "vin": data.get("vin"),
    "first_registration": data.get("in_operation_date"),        # "2021-12-01"
    "first_owner": data.get("first_owner"),                     # True/False
    "crashed_in_past": data.get("crashed_in_past"),             # True/False
    "service_book": data.get("service_book"),                   # True/False
    "stk_date": data.get("stk_date"),                           # "2026-12-01"
    "country_of_origin": data.get("country_of_origin_cb", {}).get("name"),
    "condition": data.get("condition_cb", {}).get("name"),       # "Ojeté"
    "drive": data.get("drive_cb", {}).get("name"),               # "4x4"
    "gearbox_levels": data.get("gearbox_levels_cb", {}).get("name"),  # "7 stupňová"
    "euro_level": data.get("euro_level_cb", {}).get("name"),     # "EURO 6"
    "consumption": data.get("average_gas_mileage"),              # 8.5
    "capacity": data.get("capacity"),                            # 5
    "airbags": data.get("airbags"),                              # 4
    "aircondition": data.get("aircondition_cb", {}).get("name"), # "Dvouzónová automatická"
    "color_tone": data.get("color_tone_cb", {}).get("name"),     # "Tmavá"
    "color_type": data.get("color_type_cb", {}).get("name"),     # "Metalíza"
    "model_detail": data.get("additional_model_name"),           # "T 6.1 Beach, 4Mot. 150kW"
    "price_without_vat": data.get("price_without_vat"),
    "vat_deductible": data.get("price_is_vat_deductible"),
    "doors": data.get("doors"),
    "engine_cc": data.get("engine_volume"),
    "videos": [v.get("playlist") for v in data.get("videos", []) if v.get("playlist")],
    "district": data.get("locality", {}).get("district"),  # "Praha-západ"
    "region": data.get("locality", {}).get("region"),       # "Středočeský kraj"
}

# Year z in_operation_date (přesnější než ze scrape)
iod = data.get("in_operation_date")
if iod:
    try:
        metadata["year"] = int(iod[:4])
    except (ValueError, TypeError):
        pass

# Return rozšířit o extended dict
return phone, seller_name, seller_cat, city, description, photos, equipment, metadata, extended
```

### Sauto `_parse_card()` — listing karta

Po `_fetch_detail` je voláno pro doplnění. V `_parse_card` přidat mapování extended → ScoutLeadPayload:

```python
# V scrape() nebo _parse_card(), po _fetch_detail():
if extended:
    lead.vehicle_vin = extended.get("vin")
    lead.vehicle_first_registration = extended.get("first_registration")
    lead.vehicle_first_owner = extended.get("first_owner")
    lead.vehicle_crashed_in_past = extended.get("crashed_in_past")
    lead.vehicle_service_book = extended.get("service_book")
    lead.vehicle_stk_date = extended.get("stk_date")
    lead.vehicle_country_of_origin = extended.get("country_of_origin")
    lead.vehicle_condition = extended.get("condition")
    lead.vehicle_drive = extended.get("drive")
    lead.vehicle_gearbox_levels = extended.get("gearbox_levels")
    lead.vehicle_euro_level = extended.get("euro_level")
    lead.vehicle_consumption = extended.get("consumption")
    lead.vehicle_capacity = extended.get("capacity")
    lead.vehicle_airbags = extended.get("airbags")
    lead.vehicle_aircondition = extended.get("aircondition")
    lead.vehicle_color_tone = extended.get("color_tone")
    lead.vehicle_color_type = extended.get("color_type")
    lead.vehicle_model_detail = extended.get("model_detail")
    lead.vehicle_price_without_vat = extended.get("price_without_vat")
    lead.vehicle_vat_deductible = extended.get("vat_deductible")
    lead.vehicle_doors = extended.get("doors") or lead.vehicle_doors
    lead.vehicle_engine_cc = extended.get("engine_cc") or lead.vehicle_engine_cc
    lead.vehicle_videos = extended.get("videos")
    lead.vehicle_district = extended.get("district")
    lead.region = extended.get("region") or lead.region  # existing ScoutLead field
```

---

## 5. Per-Source mapování: Bazoš text mining

Bazoš nemá strukturované API — vše z unstructured textu. Nové regex patterns:

```python
# V _extract_params_from_text() ROZŠÍŘIT:

# VIN — 17-char alphanumeric pattern
vin_match = re.search(r'\b([A-HJ-NPR-Z0-9]{17})\b', text)
if vin_match:
    params["vin"] = vin_match.group(1)

# STK — "STK do 12/2026", "platná STK", "STK platí do 2027"
stk_match = re.search(r'stk\s*(?:do|platí do|platná do)\s*(\d{1,2}[/.])?(\d{4})', text_lower)
if stk_match:
    year = stk_match.group(2)
    month = stk_match.group(1).rstrip('/.') if stk_match.group(1) else "12"
    params["stk_date"] = f"{year}-{month.zfill(2)}-01"

# První majitel — "1. majitel", "první majitel"
if re.search(r'(1\.\s*majitel|první\s*majitel|one\s*owner)', text_lower):
    params["first_owner"] = True

# Nehavarovano — "nebouráno", "bez nehody", "bez havárie"
if re.search(r'(nebouráno|nehavarovan|bez\s*nehod|bez\s*havárie|bez\s*bourání)', text_lower):
    params["crashed_in_past"] = False
elif re.search(r'(bouráno|havarovan|po\s*nehod|po\s*havárii)', text_lower):
    params["crashed_in_past"] = True

# Servisní knížka — "servisní knížka", "kompletní servis"
if re.search(r'(servisní\s*kníž|service\s*book|kompletní\s*servis)', text_lower):
    params["service_book"] = True

# Spotřeba — "spotřeba 6.5l", "6,5 l/100 km"
cons_match = re.search(r'spotřeb[aě]\s*:?\s*(\d+[.,]\d+)\s*l', text_lower)
if cons_match:
    params["consumption"] = float(cons_match.group(1).replace(",", "."))

# Euro norma — "EURO 5", "EURO 6"
euro_match = re.search(r'euro\s*(\d)', text_lower)
if euro_match:
    params["euro_level"] = f"EURO {euro_match.group(1)}"

# 4x4 — "4x4", "AWD", "pohon všech kol"
if re.search(r'(4x4|4wd|awd|pohon\s*všech\s*kol)', text_lower):
    params["drive"] = "4x4"
elif re.search(r'(přední\s*pohon|front.wheel)', text_lower):
    params["drive"] = "Přední"
elif re.search(r'(zadní\s*pohon|rear.wheel)', text_lower):
    params["drive"] = "Zadní"

# Objem motoru — "2.0 TDI", "1968 ccm", "1.6l"
cc_match = re.search(r'(\d{3,4})\s*(?:ccm|cm3|cm³)', text_lower)
if cc_match:
    params["engine_cc"] = int(cc_match.group(1))
elif not cc_match:
    # "2.0 TDI" → 2000 cc estimate
    lit_match = re.search(r'(\d)[.,](\d)\s*(?:l\b|tdi|tsi|mpi|tfsi|cdti|hdi)', text_lower)
    if lit_match:
        params["engine_cc"] = int(lit_match.group(1)) * 1000 + int(lit_match.group(2)) * 100

# Počet míst — "5 místné", "7 míst"
cap_match = re.search(r'(\d)\s*míst', text_lower)
if cap_match:
    params["capacity"] = int(cap_match.group(1))
```

**Realistická hit rate pro Bazoš text mining nových polí:**
| Pole | Odhad hit rate | Důvod |
|------|---------------|-------|
| VIN | ~15% | Někteří uvádějí v popisu |
| STK | ~25% | Častý prodejní argument |
| first_owner | ~20% | "1. majitel" je běžná fráze |
| crashed | ~30% | "nebouráno" je častá fráze |
| service_book | ~25% | "servisní knížka" je běžné |
| consumption | ~10% | Občas v popisu |
| euro_level | ~5% | Málokdy uvádí |
| drive | ~15% | 4x4 se uvádí, přední/zadní ne |
| engine_cc | ~20% | "2.0 TDI" pattern je běžný |
| capacity | ~5% | Jen u VAN/MPV |

---

## 6. Per-Source mapování: Sbazar

Sbazar má minimum strukturovaných dat. Rozšíření:
- Použít **sdílené regex funkce** z Bazoš text miningu (shared `text_extraction.py`)
- Aplikovat na `vehicle_description` z detail page
- Očekávaná hit rate: nižší než Bazoš (~50% Bazoše = ~5-15%)

---

## 7. Per-Source mapování: AutoScout24

AS24 parsing z `data-*` atributů na listing kartách. **Nemá detail page fetch.**

**Už extrahované:** brand, model, year, price, mileage, fuel, transmission, body_type, power, color, doors, engine_cc

**Nově možné z listing karty (ověřit!):**
- `data-vin` — možná existuje? (OVĚŘIT na live stránce)
- `data-first-registration` — existuje jako MM-YYYY
- Ostatní pole (VIN, crashed, service_book, STK) — NEDOSTUPNÉ bez detail page

**AS24 nemá:** phone, description, photos, equipment, history data

**Doporučení:** AS24 primárně slouží pro market-analysis data, ne pro makléřské leady. Completeness gate je pochopitelně nízký — leady z AS24 se nebudou zobrazovat makléřům bez detail page fetch (budoucí fáze).

---

## 8. Completeness Score v2

### Přepočítaný scoring se všemi poli:

```python
def calculate_completeness(lead: dict) -> int:
    """Calculate 0-100 completeness score. Reflects lead readiness for broker."""
    score = 0

    # ═══ TIER 1: POVINNÉ (musí mít pro zobrazení) — 60 bodů ═══
    TIER_1 = {
        "vehicle_brand": 10,
        "vehicle_model": 10,
        "vehicle_year": 8,
        "vehicle_price": 8,
        "phone": 8,
        "city": 6,
        "vehicle_photos": 10,      # min 1 fotka → 10 bodů
    }

    # ═══ TIER 2: DŮLEŽITÉ (enrichment z detail page) — 25 bodů ═══
    TIER_2 = {
        "vehicle_mileage": 4,
        "vehicle_fuel": 3,
        "vehicle_transmission": 3,
        "vehicle_description": 5,  # min 50 chars
        "vehicle_equipment": 5,    # min 3 items
        "vehicle_body_type": 2,
        "vehicle_power": 3,
    }

    # ═══ TIER 3: HISTORY & CONDITION (Sauto bonus) — 10 bodů ═══
    TIER_3 = {
        "vehicle_vin": 2,
        "vehicle_first_owner": 1,
        "vehicle_crashed_in_past": 1,
        "vehicle_service_book": 1,
        "vehicle_stk_date": 1,
        "vehicle_country_of_origin": 1,
        "vehicle_first_registration": 1,
        "vehicle_condition": 1,
        "vehicle_drive": 1,
    }

    # ═══ TIER 4: TECH SPECS (bonus) — 5 bodů ═══
    TIER_4 = {
        "vehicle_color": 1,
        "vehicle_doors": 1,
        "vehicle_engine_cc": 1,
        "vehicle_aircondition": 0.5,
        "vehicle_euro_level": 0.5,
        "vehicle_consumption": 0.5,
        "vehicle_capacity": 0.5,
    }

    for field, points in {**TIER_1, **TIER_2, **TIER_3, **TIER_4}.items():
        val = lead.get(field)
        if _field_has_value(field, val):
            score += points

    return min(round(score), 100)


def _field_has_value(field: str, val) -> bool:
    """Check if a field has a meaningful value."""
    if val is None or val == "" or val == "[]":
        return False
    if field == "vehicle_photos":
        photos = json.loads(val) if isinstance(val, str) else val
        return isinstance(photos, list) and len(photos) >= 1
    if field == "vehicle_equipment":
        equip = json.loads(val) if isinstance(val, str) else val
        return isinstance(equip, list) and len(equip) >= 3
    if field == "vehicle_description":
        return isinstance(val, str) and len(val) >= 50
    if isinstance(val, bool):
        return True  # booleans: True AND False are both "filled"
    return True
```

### Maximální completeness per source:

| Zdroj | Tier1 (60) | Tier2 (25) | Tier3 (10) | Tier4 (5) | **Max** |
|-------|-----------|-----------|-----------|----------|---------|
| **Sauto** | 60 | 25 | 10 | 5 | **100** |
| **Bazoš** | 60 | 25 | ~5 | ~3 | **~93** |
| **Sbazar** | 60 | ~15 | ~2 | ~1 | **~78** |
| **AS24** | 22 (no phone/photos) | 15 | 0 | 4 | **41** |

### Prahy:
| Score | Label | Akce |
|-------|-------|------|
| **≥ 60** | **Kompletní** | Zobrazit makléři |
| **40-59** | **Částečný** | Zobrazit s upozorněním, kandidát pro enrichment |
| **< 40** | **Nekompletní** | Nezobrazovat, auto-enrichment queue |

---

## 9. Testovací režim

### Test workflow:
```bash
# 1. Spustit scraper na 3-5 inzerátů
lead-scout scrape --source sauto --limit 3 --test
lead-scout scrape --source bazos --limit 3 --test
lead-scout scrape --source sbazar --limit 3 --test

# 2. Zkontrolovat completeness v SQLite
sqlite3 data/leads.db "SELECT source, source_id, completeness_score, vehicle_vin, vehicle_photos IS NOT NULL as has_photos FROM leads ORDER BY id DESC LIMIT 10;"

# 3. Zkontrolovat detailní výpis jednoho leadu
sqlite3 data/leads.db "SELECT * FROM leads WHERE source_id = '210452900';"
```

### Testovací inzeráty:
| Zdroj | URL | Source ID | Proč |
|-------|-----|-----------|------|
| Sauto | https://www.sauto.cz/osobni/detail/volkswagen/california/210452900 | 210452900 | Benchmark — bohatá výbava, VIN, video |
| Sauto | (najít další 2 inzeráty) | — | Různé: levnější auto, dealer vs soukromník |
| Bazoš | (najít 3 auto.bazos.cz inzeráty) | — | S popisem výbavy, fotek |
| Sbazar | (najít 3 sbazar.cz inzeráty) | — | Různé kvality popisu |

---

## 10. Implementační kroky (pořadí)

### Fáze A: Schema rozšíření (VŠECHNY projekty paralelně)

| Krok | Soubor | Projekt | Popis | Řádky |
|------|--------|---------|-------|-------|
| A1 | `prisma/schema.prisma` | Carmakler | +22 sloupců + completenessScore + VIN index | +30 |
| A2 | `prisma migrate` | Carmakler | `npx prisma migrate dev --name add-extended-vehicle-fields` | — |
| A3 | `lib/validators/scout-lead.ts` | Carmakler | +24 Zod polí | +30 |
| A4 | `lib/scout-lead-management.ts` | Carmakler | +24 polí v prisma.create() + upsert + VIN dedup | +45 |
| A5 | `lead_scout/models.py` | lead-scout | +24 Pydantic polí | +30 |
| A6 | `lead_scout/db.py` | lead-scout | +24 SQLite safe-migration sloupců + VIN index | +30 |
| A7 | `lead_scout/client.py` | lead-scout | +24 snake_to_camel + BOOL_FIELDS | +35 |

### Fáze B: Scraper rozšíření

| Krok | Soubor | Popis | Řádky |
|------|--------|-------|-------|
| B1 | `lead_scout/scrapers/sauto.py` | Rozšířit `_fetch_detail()` o 19 nových API polí + structured equipment | +60 |
| B2 | `lead_scout/scrapers/bazos.py` | Rozšířit `_extract_params_from_text()` + structured equipment | +80 |
| B3 | `lead_scout/scrapers/sbazar.py` | Přidat text mining pro vehicle metadata (shared s B2) | +20 |
| B4 | `lead_scout/scrapers/text_extraction.py` | NEW: sdílené regex funkce (VIN, STK, owner, fuel, atd.) | +100 |
| B5 | `lead_scout/completeness.py` | NEW: completeness score kalkulátor | +60 |

### Fáze C: Testování (3-5 per zdroj)

| Krok | Popis |
|------|-------|
| C1 | Spustit Sauto scraper na 3 inzeráty (incl. 210452900) |
| C2 | Ověřit completeness = 100 pro Sauto |
| C3 | Spustit Bazoš scraper na 3 inzeráty |
| C4 | Ověřit completeness ≥ 70 pro Bazoš |
| C5 | Spustit Sbazar scraper na 3 inzeráty |
| C6 | Ověřit completeness ≥ 60 pro Sbazar |
| C7 | Push testovacích leadů do dev Carmakler API, ověřit v DB |

### Fáze D: Produkce

| Krok | Popis |
|------|-------|
| D1 | Deploy Carmakler (schema migrace + Zod + ingest) |
| D2 | Deploy lead-scout (schema + scrapery + completeness) |
| D3 | Smazat staré SOUKROMNIK leady z produkce (`DELETE FROM "ScoutLead" WHERE category = 'SOUKROMNIK';`) |
| D4 | Spustit plný scrape Sauto + Bazoš + Sbazar |
| D5 | Ověřit completeness ve výstupech |
| D6 | Push do Carmakler |
| D7 | Ověřit v admin UI — lead detail zobrazuje VŠECHNA data |

---

## 11. Soubory k úpravě — kompletní seznam

### Carmakler (Next.js)
| Soubor | Typ | Řádky |
|--------|-----|-------|
| `prisma/schema.prisma` | UPDATE | +25 |
| `lib/validators/scout-lead.ts` | UPDATE | +25 |
| `lib/scout-lead-management.ts` | UPDATE | +30 |
| `components/admin/scout-leads/ScoutLeadDetail.tsx` | UPDATE (zobrazení nových polí) | +80 |

### Lead Scout (Python)
| Soubor | Typ | Řádky |
|--------|-----|-------|
| `lead_scout/models.py` | UPDATE | +25 |
| `lead_scout/db.py` | UPDATE | +25 |
| `lead_scout/client.py` | UPDATE | +30 |
| `lead_scout/scrapers/sauto.py` | UPDATE | +60 |
| `lead_scout/scrapers/bazos.py` | UPDATE | +80 |
| `lead_scout/scrapers/sbazar.py` | UPDATE | +20 |
| `lead_scout/scrapers/text_extraction.py` | **NEW** | +100 |
| `lead_scout/completeness.py` | **NEW** | +60 |

**Celkem: ~640 řádků** (12 souborů, 2 nové)

---

## 12. VIN-based dedup + Vehicle History

### 12.1 VIN jako cross-source identifikátor

VIN je UNIKÁTNÍ pro každé vozidlo. Stejné auto se může objevit na Sauto, Bazoš i Sbazar současně — různé source+sourceId, ale STEJNÝ VIN. Propojení přes VIN umožňuje:

1. **Dedup v ingestu** — detekce duplicitního VOZU (ne jen duplicitního leadu)
2. **Cenová historie** — cena stejného auta v čase (pokles = prodejce netrpělivý)
3. **Cross-source enrichment** — Sauto má VIN+výbavu, Bazoš má jiné fotky → merge
4. **SPZ historie** — jedno VIN může mít různé SPZ v čase

### 12.2 VIN dedup v `ingestScoutLeads()`

Přidat nový dedup krok do `checkScoutLeadDuplicate()`:

```typescript
// NOVÝ krok 1.5: VIN match (po source+sourceId, před phone match)
if (payload.vehicleVin && payload.vehicleVin.length === 17) {
  const byVin = await prisma.scoutLead.findFirst({
    where: {
      vehicleVin: payload.vehicleVin,
      // NE same source+sourceId (to by chytil krok 1)
      NOT: {
        source: payload.source,
        sourceId: payload.sourceId,
      },
    },
    select: { id: true },
  });
  if (byVin) {
    // VIN match z jiného zdroje — UPSERT enrichment (ne skip)
    return byVin.id;
  }
}
```

**DŮLEŽITÉ:** VIN match NESMÍ vrátit "duplicate" a skipnout — musí triggerovat UPSERT (aktualizovat enrichment data z nového zdroje). Mechanismus z plánu #1 (`buildEnrichmentUpdate()`) to už řeší.

### 12.3 SPZ jako mutable identifikátor

SPZ se mění v čase (přepis vlastnictví, nové značky). Proto:
- `vehicleLicensePlate` je aktuální SPZ z inzerátu
- Historie SPZ se ukládá v `rawPayload` nebo budoucí `VehicleHistory` tabulce
- Při VIN match: pokud nový lead má jinou SPZ než existující → uložit obě (log)
- Sauto API SPZ nevrací (v inzerátech se maskuje), ale makléř ji doplní při nabírání

### 12.4 Budoucí: Vehicle History View

Zatím jen ukládat VIN+SPZ. Zobrazení historie (timeline cen, SPZ, zdrojů) = budoucí feature:
```
VIN: WV2ZZZ7ZZNH037747
├─ 2026-05-20 Sauto: 1 450 000 Kč, SPZ: —, Červený Újezd
├─ 2026-05-15 Bazoš: 1 490 000 Kč, SPZ: —, Praha
└─ 2026-03-01 Sauto: 1 550 000 Kč (cena klesla o 100k za 2.5 měsíce!)
```

---

## 13. ScoutLead ↔ Vehicle schema kompatibilita

### Proč je důležité:
Když makléř konvertuje ScoutLead → Vehicle (nabere auto), VŠECHNA data se předvyplní do formuláře. Schema musí být kompatibilní.

### Kompletní field mapping:

| ScoutLead | Vehicle | Typ konverze | Poznámka |
|-----------|---------|-------------|----------|
| `vehicleVin` | `vin` | 1:1 String | Vehicle.vin je REQUIRED + UNIQUE |
| `vehicleBrand` | `brand` | 1:1 String | Required v obou |
| `vehicleModel` | `model` | 1:1 String | Required v obou |
| `vehicleModelDetail` | `variant` | 1:1 String? | "T 6.1 Beach, 4Mot. 150kW" |
| `vehicleYear` | `year` | 1:1 Int | Required v obou |
| `vehicleMileage` | `mileage` | 1:1 Int | Required v obou |
| `vehicleFuel` | `fuelType` | 1:1 String | Same enum: PETROL, DIESEL... |
| `vehicleTransmission` | `transmission` | 1:1 String | Same enum: MANUAL, AUTOMATIC |
| `vehiclePower` | `enginePower` | 1:1 Int? | kW |
| `vehicleEngineCC` | `engineCapacity` | 1:1 Int? | cc |
| `vehicleBodyType` | `bodyType` | 1:1 String? | Same enum values |
| `vehicleColor` | `color` | 1:1 String? | |
| `vehicleDoors` | `doorsCount` | 1:1 Int? | |
| `vehicleCapacity` | `seatsCount` | 1:1 Int? | |
| `vehicleDrive` | `drivetrain` | **MAPPING** | "4x4"→"AWD", "Přední"→"FWD", "Zadní"→"RWD" |
| `vehicleFirstOwner` | `ownerCount` | **MAPPING** | true→1, false→null (neznámo kolik) |
| `vehicleServiceBook` | `serviceBook` | 1:1 Boolean | |
| — | `serviceBookStatus` | **DERIVE** | serviceBook=true→"COMPLETE", false→"NONE" |
| `vehicleCountryOfOrigin` | `originCountry` | 1:1 String? | |
| `vehicleCondition` | `condition` | **MAPPING** | "Ojeté"→"GOOD", "Nové"→"NEW" |
| `vehicleStkDate` | `stkValidUntil` | **PARSE** | String "2026-12-01" → DateTime |
| `vehiclePrice` | `price` | 1:1 Int | |
| `vehicleVatDeductible` | `vatStatus` | **MAPPING** | true→"DEDUCTIBLE", false→"NON_DEDUCTIBLE" |
| `vehicleEquipment` | `equipment` | JSON format | [{name,category}] → [{name,category}] |
| `vehicleDescription` | `description` | 1:1 String? | |
| `vehiclePhotos` | → `VehicleImage[]` | **TRANSFORM** | JSON array → separate table rows + Cloudinary upload |
| `vehicleLicensePlate` | — | Manual | Makléř vidí v leadu, ručně zapíše |
| `phone` | `sellerPhone` | 1:1 | Lead contact → Vehicle lead info |
| `name` | `sellerName` | 1:1 | |
| `sourceUrl` | `leadUrl` | 1:1 | |
| `source` | `leadSource` | 1:1 | SAUTO, BAZOS, SBAZAR |

### Konverzní funkce (budoucí implementace):

```typescript
function scoutLeadToVehiclePrefill(lead: ScoutLead): Partial<Vehicle> {
  const DRIVE_MAP: Record<string, string> = { "4x4": "AWD", "Přední": "FWD", "Zadní": "RWD" };
  const CONDITION_MAP: Record<string, string> = { "Ojeté": "GOOD", "Nové": "NEW", "Předváděcí": "LIKE_NEW" };
  const VAT_MAP: Record<string, string> = { "true": "DEDUCTIBLE", "false": "NON_DEDUCTIBLE" };

  return {
    vin: lead.vehicleVin || "",
    brand: lead.vehicleBrand || "",
    model: lead.vehicleModel || "",
    variant: lead.vehicleModelDetail,
    year: lead.vehicleYear || new Date().getFullYear(),
    mileage: lead.vehicleMileage || 0,
    fuelType: lead.vehicleFuel || "PETROL",
    transmission: lead.vehicleTransmission || "MANUAL",
    enginePower: lead.vehiclePower,
    engineCapacity: lead.vehicleEngineCC,
    bodyType: lead.vehicleBodyType,
    color: lead.vehicleColor,
    doorsCount: lead.vehicleDoors,
    seatsCount: lead.vehicleCapacity,
    drivetrain: lead.vehicleDrive ? DRIVE_MAP[lead.vehicleDrive] || lead.vehicleDrive : null,
    ownerCount: lead.vehicleFirstOwner === true ? 1 : null,
    serviceBook: lead.vehicleServiceBook ?? false,
    serviceBookStatus: lead.vehicleServiceBook ? "COMPLETE" : "NONE",
    originCountry: lead.vehicleCountryOfOrigin,
    condition: lead.vehicleCondition ? CONDITION_MAP[lead.vehicleCondition] || "GOOD" : "GOOD",
    stkValidUntil: lead.vehicleStkDate ? new Date(lead.vehicleStkDate) : null,
    price: lead.vehiclePrice || 0,
    vatStatus: lead.vehicleVatDeductible != null ? (lead.vehicleVatDeductible ? "DEDUCTIBLE" : "NON_DEDUCTIBLE") : null,
    equipment: lead.vehicleEquipment,  // JSON format already compatible
    description: lead.vehicleDescription,
    // Photos need async Cloudinary upload — handled separately
    sellerPhone: lead.phone,
    sellerName: lead.name,
    leadUrl: lead.sourceUrl,
    leadSource: lead.source,
  };
}
```

### Pole kde mapování NENÍ triviální (STOP body):

1. **vehicleDrive → drivetrain**: Sauto vrací CZ ("4x4", "Přední"), Vehicle enum je EN ("AWD", "FWD") → lookup map
2. **vehicleCondition → condition**: Sauto vrací CZ ("Ojeté"), Vehicle enum je EN ("GOOD") → lookup map
3. **vehiclePhotos → VehicleImage[]**: JSON pole URL → Cloudinary upload + VehicleImage rows. Async job, NE v request handleru.
4. **vehicleFirstOwner (boolean) → ownerCount (int)**: true=1 majitel, false=neznámo (ne 2+)
5. **vehicleVin**: V ScoutLead optional, ve Vehicle REQUIRED + UNIQUE. Pokud lead nemá VIN → makléř musí doplnit ručně.

---

## 14. STOP pravidla

- **STOP-1:** Sauto API endpoint `GET /api/v1/items/{id}` vrací 403/429 → API má rate limit, snížit frekvenci, přidat delay
- **STOP-2:** Sauto API změnila strukturu (chybí `equipment_cb`, `vin`, atd.) → ověřit na jiném inzerátu, adaptovat parsování
- **STOP-3:** Prisma migrate selhává kvůli tsvector drift → standardní fix `migrate reset --force` (dev only; produkce: `migrate deploy`)
- **STOP-4:** Bazoš text mining VIN regex matchuje false positives (17-char string co není VIN) → přidat Luhn check nebo ověřit přes NHTSA API
- **STOP-5:** Equipment structured format rozbije existující frontend zobrazení → přidat backwards-compatible parsing v komponentě
- **STOP-6:** Boolean fields (first_owner, crashed, service_book) — SQLite ukládá jako 0/1, Pydantic jako bool, Prisma jako Boolean? → client.py MUSÍ konvertovat `int → bool` před odesláním do API
- **STOP-7:** `vehicleFirstRegistration` jako ISO date string vs `vehicleYear` jako int — year se DERIVE z first_registration, nikdy nenastavovat oba nezávisle. Pokud API dá `in_operation_date`, year = `int(in_operation_date[:4])`.
- **STOP-8:** AS24 leady mají completeness < 40 → NE zobrazovat makléřům. AS24 slouží primárně pro market-analysis. Pokud uživatel chce i AS24 leady → budoucí fáze: přidat `_fetch_detail()` s `__NEXT_DATA__` parsing.
- **STOP-9:** VIN dedup najde existující lead z jiného zdroje → NESMÍ vrátit "duplicate" a skipnout. Musí UPSERT enrichment data (obohacení z nového zdroje). Jinak bychom přišli o data.
- **STOP-10:** Vehicle.vin je REQUIRED + UNIQUE, ale ScoutLead.vehicleVin je optional. Pokud lead nemá VIN → konverze Lead→Vehicle vyžaduje ruční doplnění VIN makléřem. Formulář MUSÍ toto vynutit.
- **STOP-11:** SPZ v inzerátech je typicky maskovaná (Sauto ji nevrací, Bazoš jen někdy). Pole vehicleLicensePlate bude většinou NULL z scraperů — to je OK, makléř doplní.
- **STOP-12:** ScoutLead → Vehicle mapování: drive "4x4"→"AWD" + condition "Ojeté"→"GOOD" vyžaduje lookup mapy. Pokud nový term z API nematchne → fallback na raw string, logovat warning.

---

## 15. Acceptance Criteria

### Schema (musí projít VŠECHNY):
- [ ] Prisma ScoutLead má 22 nových sloupců + completenessScore + @@index([vehicleVin])
- [ ] Prisma migrace proběhne bez chyb
- [ ] SQLite má 24 nových safe-migration sloupců + VIN index
- [ ] Pydantic ScoutLeadPayload má 24 nových polí (vč. license_plate, district)
- [ ] Zod schema přijímá všechna nová pole
- [ ] client.py SNAKE_TO_CAMEL má 24 nových mapování + BOOL_FIELDS konverzi
- [ ] ingestScoutLeads() ukládá VŠECH 24 nových polí do Prisma
- [ ] VIN dedup: `checkScoutLeadDuplicate()` matchuje přes vehicleVin

### Sauto:
- [ ] VIN extrahován z API: `data.vin` → `vehicle_vin`
- [ ] 33 fotek extrahováno (VW California benchmark)
- [ ] 72 equipment items SE KATEGORIEMI
- [ ] first_owner, crashed_in_past, service_book jako boolean
- [ ] stk_date, first_registration jako ISO date string
- [ ] Completeness score = 100 pro VW California benchmark

### Bazoš:
- [ ] VIN regex matchuje 17-char pattern z popisu (kde uvedeno)
- [ ] STK regex matchuje "STK do MM/YYYY"
- [ ] "1. majitel", "nebouráno", "servisní knížka" regex patterns fungují
- [ ] Equipment se structured kategoriemi (auto-mapping z keywords)
- [ ] Completeness score ≥ 70 pro testovací leady s detailním popisem

### Sbazar:
- [ ] Sdílené text mining funkce z text_extraction.py
- [ ] Completeness score ≥ 60 pro testovací leady

### Completeness gate:
- [ ] Score kalkulátor vrací 0-100
- [ ] Tier 1 (60 bodů) = povinná pole (brand, model, year, price, phone, city, photos)
- [ ] Score ≥ 60 → "Kompletní"
- [ ] Score 40-59 → "Částečný"
- [ ] Score < 40 → "Nekompletní"
- [ ] Admin UI zobrazuje completeness badge

### VIN dedup & history:
- [ ] `vehicleVin` má @@index v Prisma + INDEX v SQLite
- [ ] `checkScoutLeadDuplicate()` obsahuje VIN match krok (po source+sourceId, před phone)
- [ ] VIN match triggeruje upsert (ne skip) — enrichment data z nového zdroje se přidají
- [ ] `vehicleLicensePlate` pole existuje v Prisma + SQLite + Pydantic + Zod
- [ ] Lokace: `vehicleDistrict` pole plněno z `locality.district` (Sauto)

### ScoutLead → Vehicle kompatibilita:
- [ ] Konverzní mapping table je dokumentovaný (§13)
- [ ] `scoutLeadToVehiclePrefill()` funkce navržena (implementace = budoucí task)
- [ ] Drive mapping: "4x4"→"AWD", "Přední"→"FWD", "Zadní"→"RWD"
- [ ] Condition mapping: "Ojeté"→"GOOD", "Nové"→"NEW"
- [ ] Photos → VehicleImage transformace poznámka (async Cloudinary job)

### Test mode:
- [ ] `--limit 3` funguje na všech scraperech
- [ ] Výstup loguje completeness score per lead
- [ ] SQLite záznam má VŠECHNA pole vyplněná (Sauto: 100%, Bazoš: ~70-90%)
