# Plan: Fix Enrichment Data Sync (SQLite → PostgreSQL)

**Task:** #1
**Status:** PLAN READY
**Datum:** 2026-05-20
**Typ:** Bugfix (data pipeline)

---

## 1. Root Cause Analysis

### Data flow (current):
```
1. Scraper runs           → saves lead to SQLite (push_status=PENDING)
2. push_leads() runs      → queries WHERE push_status='PENDING'
3. POST /ingest           → checkScoutLeadDuplicate() → not found → prisma.create()
4. Response "created"     → mark_pushed(PUSHED)
5. [LATER] re_enrich.py   → updates SQLite (description, photos, equipment, fuel...)
6. push_leads() runs      → queries WHERE push_status='PENDING' → NENAJDE enriched leady!
```

### Dva problémy:

**P1: `re_enrich.py` NEMĚNÍ `push_status` po updatu**
- `update_lead()` na řádku 49-90 aktualizuje vehicle_description, photos atd.
- ALE nikdy neresetuje push_status zpět na PENDING
- Takže `get_unpushed()` (db.py:260) nikdy nenajde tyto enriched záznamy

**P2: I kdyby se push_status resetoval, `ingestScoutLeads()` SKIPNE duplikát**
- `checkScoutLeadDuplicate()` (scout-lead-management.ts:40-50) najde existující lead přes source+sourceId
- Vrátí `existingId` → ingest vrátí status="duplicate" a **NEPROVEDE žádný update**
- client.py:102-104 → `mark_pushed(lid, PushStatus.DUPLICATE)` → lead se nikdy neaktualizuje

### Důkaz:
- 42 Sauto leadů: push_status=PUSHED, enrichment data jen v SQLite
- 43 Bazoš leadů: push_status=PUSHED, 3/43 mají enrichment (ty měly data už při prvním push)

---

## 2. Navrhované řešení: UPSERT v ingest endpointu

### Princip:
Když ingest detekuje duplikát (source+sourceId match), místo pouhého "duplicate" **AKTUALIZUJE enrichment pole** na existujícím záznamu.

### Proč UPSERT a ne nový endpoint:
- Žádný nový endpoint = méně kódu, méně údržby
- Lead-scout strana: jen reset push_status → znovupoužije existující push_leads()
- Idempotentní — opakovaný push je bezpečný
- Response už vrací existingId → stačí přidat update logiku

---

## 3. Implementační plán

### Krok 1: Carmakler — upsert v `ingestScoutLeads()` [IMPL]

**Soubor:** `lib/scout-lead-management.ts` řádky 141-152

**PŘED:**
```typescript
const existingId = await checkScoutLeadDuplicate(payload);
if (existingId) {
  duplicates++;
  results.push({
    sourceId: payload.sourceId ?? null,
    status: "duplicate",
    existingId,
  });
  continue;
}
```

**PO:**
```typescript
const existingId = await checkScoutLeadDuplicate(payload);
if (existingId) {
  // Upsert: update enrichment fields on existing lead
  const enrichUpdate = buildEnrichmentUpdate(payload);
  if (Object.keys(enrichUpdate).length > 0) {
    await prisma.scoutLead.update({
      where: { id: existingId },
      data: enrichUpdate,
    });
    accepted++;
    results.push({
      sourceId: payload.sourceId ?? null,
      status: "updated",
      existingId,
    });
  } else {
    duplicates++;
    results.push({
      sourceId: payload.sourceId ?? null,
      status: "duplicate",
      existingId,
    });
  }
  continue;
}
```

**Nová helper funkce `buildEnrichmentUpdate()`:**
```typescript
/** Extract enrichment-only fields that should be upserted on duplicate. */
function buildEnrichmentUpdate(payload: ScoutLeadPayload) {
  const update: Record<string, unknown> = {};

  // Vehicle enrichment fields — update only non-null incoming values
  const enrichFields = {
    vehicleFuel: payload.vehicleFuel,
    vehicleTransmission: payload.vehicleTransmission,
    vehiclePower: payload.vehiclePower,
    vehicleEngineCC: payload.vehicleEngineCC,
    vehicleBodyType: payload.vehicleBodyType,
    vehicleColor: payload.vehicleColor,
    vehicleDoors: payload.vehicleDoors,
    vehicleDescription: payload.vehicleDescription,
  };

  for (const [key, val] of Object.entries(enrichFields)) {
    if (val != null) update[key] = val;
  }

  // JSON array fields need stringify
  if (payload.vehicleEquipment && payload.vehicleEquipment.length > 0) {
    update.vehicleEquipment = JSON.stringify(payload.vehicleEquipment);
  }
  if (payload.vehiclePhotos && payload.vehiclePhotos.length > 0) {
    update.vehiclePhotos = JSON.stringify(payload.vehiclePhotos);
  }

  // Also update basic vehicle fields if previously null
  // (some scrapers find brand/model/year on re-enrich)
  const basicFields = {
    vehicleBrand: payload.vehicleBrand,
    vehicleModel: payload.vehicleModel,
    vehicleYear: payload.vehicleYear,
    vehiclePrice: payload.vehiclePrice,
    vehicleMileage: payload.vehicleMileage,
    listingTitle: payload.listingTitle,
  };
  for (const [key, val] of Object.entries(basicFields)) {
    if (val != null) update[key] = val;
  }

  return update;
}
```

**Odhad:** ~40 řádků změn v `lib/scout-lead-management.ts`

**Response type update:**
Přidat `"updated"` do status union typu:
```typescript
const results: Array<{
  sourceId: string | null;
  status: "created" | "duplicate" | "updated" | "error";  // ← přidán "updated"
  id?: string;
  existingId?: string;
  message?: string;
}> = [];
```

A aktualizovat return counts:
```typescript
return { accepted, duplicates, errors, updated, details: results };
```

---

### Krok 2: Lead-scout — reset push_status po enrichmentu [IMPL]

**Soubor:** `scripts/re_enrich.py` → funkce `update_lead()` řádek 49-90

**Přidat na konec funkce:**
```python
if updates:
    # Reset push_status so enriched data gets pushed to Carmakler
    updates.append("push_status = 'PENDING'")
    params.append(lead_id)
    conn.execute(f"UPDATE leads SET {', '.join(updates)} WHERE id = ?", params)
    conn.commit()
```

**Odhad:** 1 řádek přidán (push_status reset)

---

### Krok 3: Lead-scout — handle "updated" status v client.py [IMPL]

**Soubor:** `lead_scout/client.py` řádky 95-107

**PŘED:**
```python
if detail["status"] == "created":
    self.db.mark_pushed(lid, PushStatus.PUSHED)
    pushed += 1
elif detail["status"] == "duplicate":
    self.db.mark_pushed(lid, PushStatus.DUPLICATE)
    duplicates += 1
```

**PO:**
```python
if detail["status"] == "created":
    self.db.mark_pushed(lid, PushStatus.PUSHED)
    pushed += 1
elif detail["status"] == "updated":
    self.db.mark_pushed(lid, PushStatus.PUSHED)  # Enrichment was applied
    pushed += 1
elif detail["status"] == "duplicate":
    self.db.mark_pushed(lid, PushStatus.DUPLICATE)
    duplicates += 1
```

**Odhad:** 3 řádky přidány

---

### Krok 4: Deploy + re-enrichment [OPS]

Pořadí:
1. Deploy Carmakler (upsert v ingest) → `git push && ssh server "cd /var/www/carmakler && git pull && npx prisma generate && npm run build && pm2 reload carmakler"`
2. Deploy lead-scout (push_status reset) → SCP re_enrich.py + client.py na server
3. Spustit re_enrich.py na produkci → obnoví enrichment data v SQLite
4. Spustit `lead-scout push` → push enriched leady do Carmakler (upsert je zapnutý)
5. Ověřit v DB: `SELECT id, "vehicleDescription" IS NOT NULL as has_desc, "vehiclePhotos" IS NOT NULL as has_photos FROM "ScoutLead" WHERE source = 'SAUTO' LIMIT 10;`

---

## 4. Soubory k úpravě

| Soubor | Projekt | Typ změny | Řádky |
|--------|---------|-----------|-------|
| `lib/scout-lead-management.ts` | Carmakler | UPDATE (upsert logika) | ~40 |
| `scripts/re_enrich.py` | lead-scout | UPDATE (push_status reset) | ~1 |
| `lead_scout/client.py` | lead-scout | UPDATE (handle "updated") | ~3 |

**Celkem:** ~44 řádků změn

---

## 5. STOP pravidla

- **STOP-1:** `buildEnrichmentUpdate()` přepisuje existující NON-NULL data novými → přidat podmínku `COALESCE` nebo "update only if current is null"? **Rozhodnutí:** NE — re-enrich přináší LEPŠÍ data (z detail pages), chceme přepsat. Ale basic fields (brand, model, year, price) aktualizovat JEN pokud v payload je ne-null.
- **STOP-2:** Response type change ("updated") rozbije stávající client.py → proto Krok 3 (handle "updated") MUSÍ být deploynut ZÁROVEŇ s Krok 1. Pokud ne: client.py nerozpozná "updated" → spadne do else → ERROR.
- **STOP-3:** Velký batch re-enriched leadů (50+) → rate limit 500/hod by neměl být problém (1 request = 50 leadů).
- **STOP-4:** Pokud existující lead má status REJECTED/WON/LOST → enrichment update by ho NEMĚL měnit status zpět. Naše `buildEnrichmentUpdate()` to neovlivní (nemění status field).

---

## 6. Závislosti

- Krok 1 (Carmakler upsert) a Krok 2+3 (lead-scout) jsou NEZÁVISLÉ — mohou se implementovat paralelně
- Deploy MUSÍ být v pořadí: Carmakler PRVNÍ, lead-scout DRUHÉ (protože lead-scout "updated" status vyžaduje nový Carmakler kód)
- Krok 4 (re-enrichment) vyžaduje dokončení Kroků 1-3 + deploy

---

## 7. Acceptance Criteria

- [ ] `ingestScoutLeads()` provede `prisma.update()` na enrichment pole při detekci duplikátu s novými daty
- [ ] Response obsahuje `status: "updated"` pro enriched duplikáty
- [ ] `re_enrich.py` resetuje `push_status` na PENDING po úspěšném enrichmentu
- [ ] `client.py` rozpozná "updated" status a markne jako PUSHED
- [ ] Po deploy + re-enrichment: Sauto leady v produkční DB mají vehicleDescription, vehiclePhotos, vehicleEquipment
- [ ] Enrichment NEOVLIVNÍ status/assignment/notes na existujících leadech
- [ ] Žádné Prisma schema změny (pole už existují)
