# QA Report: Task #8 — Schema Expansion (Fáze A)
**Datum:** 2026-05-20
**Kontrolor:** kontrolor
**Commity:** Carmakler fdf6f7e, lead-scout 85a8a88

---

## VERDIKT: ✅ SCHVÁLENO — Implementace odpovídá plánu, cross-check prošel

---

## 1. Prisma Schema + Migrace

### Migrace: `20260520210000_add_extended_vehicle_fields`

Obsahuje **24 nových sloupců** + VIN index:

| Skupina | Pole | Status |
|---------|------|--------|
| Vehicle identity | vehicleVin, vehicleLicensePlate | ✅ |
| History & condition | vehicleFirstRegistration, vehicleFirstOwner (BOOL), vehicleCrashedInPast (BOOL), vehicleServiceBook (BOOL), vehicleStkDate, vehicleCountryOfOrigin, vehicleCondition | ✅ |
| Technical specs | vehicleDrive, vehicleGearboxLevels, vehicleEuroLevel, vehicleConsumption (DOUBLE PRECISION), vehicleCapacity, vehicleAirbags, vehicleAircondition | ✅ |
| Color detail | vehicleColorTone, vehicleColorType | ✅ |
| Model detail | vehicleModelDetail | ✅ |
| Pricing | vehiclePriceWithoutVat, vehicleVatDeductible (BOOL) | ✅ |
| Location extended | vehicleDistrict | ✅ |
| Media | vehicleVideos (TEXT) | ✅ |
| Completeness | completenessScore (INTEGER DEFAULT 0) | ✅ |

**VIN index:** `CREATE INDEX "ScoutLead_vehicleVin_idx" ON "ScoutLead"("vehicleVin")` ✅

Typy v migraci konzistentní se schema.prisma ✅

---

## 2. Zod Validator (lib/validators/scout-lead.ts)

Nová pole v `scoutLeadPayloadSchema`:

| Pole | Zod typ | Status |
|------|---------|--------|
| vehicleVin | z.string().optional().nullable() | ✅ |
| vehicleLicensePlate | z.string().optional().nullable() | ✅ |
| vehicleFirstRegistration | z.string().optional().nullable() | ✅ |
| vehicleFirstOwner | z.boolean().optional().nullable() | ✅ |
| vehicleCrashedInPast | z.boolean().optional().nullable() | ✅ |
| vehicleServiceBook | z.boolean().optional().nullable() | ✅ |
| vehicleStkDate | z.string().optional().nullable() | ✅ |
| vehicleCountryOfOrigin | z.string().optional().nullable() | ✅ |
| vehicleCondition | z.string().optional().nullable() | ✅ |
| vehicleDrive | z.string().optional().nullable() | ✅ |
| vehicleGearboxLevels | z.string().optional().nullable() | ✅ |
| vehicleEuroLevel | z.string().optional().nullable() | ✅ |
| vehicleConsumption | z.number().min(0).optional().nullable() | ✅ |
| vehicleCapacity | z.number().int().min(1).max(50).optional().nullable() | ✅ |
| vehicleAirbags | z.number().int().min(0).optional().nullable() | ✅ |
| vehicleAircondition | z.string().optional().nullable() | ✅ |
| vehicleColorTone | z.string().optional().nullable() | ✅ |
| vehicleColorType | z.string().optional().nullable() | ✅ |
| vehicleModelDetail | z.string().optional().nullable() | ✅ |
| vehiclePriceWithoutVat | z.number().int().min(0).optional().nullable() | ✅ |
| vehicleVatDeductible | z.boolean().optional().nullable() | ✅ |
| vehicleDistrict | z.string().optional().nullable() | ✅ |
| vehicleVideos | z.array(z.string().min(1)).optional().nullable() | ✅ |

**Equipment backward-compat:**
```ts
z.array(z.union([z.string(), z.object({ name: z.string(), category: z.string().optional() })]))
```
Akceptuje `string[]` i `{name, category}[]` ✅

**completenessScore NENÍ v Zod** — správně, je to server-side computed field ✅

---

## 3. Pydantic (lead_scout/models.py)

22 nových polí odpovídá Zod poli (bez completenessScore) ✅

```python
vehicle_equipment: Optional[list] = None  # str items or {name, category} dicts
```
Backward-compatible (bare `list` akceptuje oba formáty) ✅

Boolean pole správně `Optional[bool]` ✅

---

## 4. SQLite (lead_scout/db.py)

### _init_db() safe migrations
24 nových sloupců přidáno přes `ALTER TABLE ADD COLUMN IF NOT EXISTS` pattern ✅

Boolean pole uložena jako `INTEGER` (SQLite nemá BOOL) ✅
JSON pole (equipment, photos, videos) jako `TEXT` ✅
`completeness_score INTEGER DEFAULT 0` ✅
VIN index: `CREATE INDEX IF NOT EXISTS idx_leads_vin ON leads(vehicle_vin)` ✅

### save_lead() — 61 sloupců
INSERT odpovídá 61 hodnotám v params tuple ✅

Boolean konverze v params:
```python
int(lead.vehicle_first_owner) if lead.vehicle_first_owner is not None else None
```
Správně pro všechna 4 bool pole ✅

`completenessScore` NENÍ v save_lead() — záměrně, computed v Fázi B ✅

---

## 5. client.py — SNAKE_TO_CAMEL + BOOL_FIELDS + JSON_FIELDS

**SNAKE_TO_CAMEL:** 23 nových mapování přidáno ✅

**BOOL_FIELDS:**
```python
BOOL_FIELDS = {"vehicle_first_owner", "vehicle_crashed_in_past", "vehicle_service_book", "vehicle_vat_deductible"}
```
4 pole ✅ — INTEGER 0/1 → Python bool před odesláním do API

**JSON_FIELDS:**
```python
JSON_FIELDS = {"vehicle_equipment", "vehicle_photos", "vehicle_videos"}
```
`vehicle_videos` přidáno ✅

**_row_to_payload():** BOOL konverze aplikována správně před odesláním ✅

---

## 6. scout-lead-management.ts

### buildEnrichmentUpdate()
23 nových polí v enrichFields objektu ✅
`vehicleVideos` v JSON stringify bloku ✅

### ingestScoutLeads() — create()
Všechna nová pole přítomna (vehicleVin → vehicleVideos) ✅
`vehicleVideos: payload.vehicleVideos ? JSON.stringify(...) : null` ✅

---

## 7. VIN Dedup logika (checkScoutLeadDuplicate)

```typescript
// 1.5. VIN match (cross-source dedup)
if (payload.vehicleVin && payload.vehicleVin.length === 17) {
  const byVin = await prisma.scoutLead.findFirst({
    where: {
      vehicleVin: payload.vehicleVin,
      NOT: { source: payload.source, sourceId: payload.sourceId ?? undefined },
    },
    select: { id: true },
  });
  if (byVin) return byVin.id;
}
```

- VIN length guard (=17) chrání před partial VIN false-positives ✅
- NOT clause správně implementuje cross-source dedup ✅
- Prisma NOT compound: `NOT { source: X, sourceId: Y }` = `NOT (source=X AND sourceId=Y)` = `source≠X OR sourceId≠Y` → nachází stejné VIN z jiného zdroje ✅
- Pořadí: krok 1.5 je PŘED phone/domain dedup — správně (VIN je silnější signal) ✅

---

## 8. Cross-check Prisma ↔ Zod ↔ Pydantic ↔ SQLite

| Pole | Prisma | Zod | Pydantic | SQLite | client.py |
|------|--------|-----|----------|--------|-----------|
| vehicleVin | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleLicensePlate | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleFirstRegistration | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleFirstOwner | ✅ BOOL | ✅ bool | ✅ bool | ✅ INT | ✅ BOOL_FIELDS |
| vehicleCrashedInPast | ✅ BOOL | ✅ bool | ✅ bool | ✅ INT | ✅ BOOL_FIELDS |
| vehicleServiceBook | ✅ BOOL | ✅ bool | ✅ bool | ✅ INT | ✅ BOOL_FIELDS |
| vehicleStkDate | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleCountryOfOrigin | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleCondition | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleDrive | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleGearboxLevels | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleEuroLevel | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleConsumption | ✅ Float | ✅ number | ✅ float | ✅ REAL | ✅ |
| vehicleCapacity | ✅ Int | ✅ int | ✅ int | ✅ INTEGER | ✅ |
| vehicleAirbags | ✅ Int | ✅ int | ✅ int | ✅ INTEGER | ✅ |
| vehicleAircondition | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleColorTone | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleColorType | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleModelDetail | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehiclePriceWithoutVat | ✅ Int | ✅ int | ✅ int | ✅ INTEGER | ✅ |
| vehicleVatDeductible | ✅ BOOL | ✅ bool | ✅ bool | ✅ INT | ✅ BOOL_FIELDS |
| vehicleDistrict | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicleVideos | ✅ Text | ✅ array | ✅ list[str] | ✅ TEXT | ✅ JSON_FIELDS |
| completenessScore | ✅ Int default(0) | ❌ (záměrně) | ❌ (záměrně) | ✅ INTEGER | ❌ (záměrně) |

**Výsledek cross-checku: 1:1 shoda pro všechna přenášená pole** ✅

---

## 9. Nalezené problémy

**Žádné kritické problémy.**

🟡 **Minor — completenessScore chybí v save_lead():**
Nové leady budou mít `completeness_score = NULL` (SQLite default je `INTEGER DEFAULT 0` jen pro CREATE TABLE, ne ALTER TABLE). Přijatelné, pokud Fáze B scoring provede dodatečný UPDATE. Doporučuji ověřit výchozí hodnotu po ALTER TABLE.

🟡 **Minor — task description říká "23 SQLite sloupců" ale skutečně je jich 24:**
(23 vehicle fields + completenessScore). Diskrepance v popisu tasku, ne v kódu.

---

## 10. Závěr

Schema rozšíření Fáze A je kompletně a správně implementováno. Všechny 4 vrstvy (Prisma, Zod, Pydantic, SQLite) jsou konzistentní. Boolean konverze, JSON serialization a VIN dedup logika jsou správné. **Schvaluju k deployi.**
