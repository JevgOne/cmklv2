# QA Report: Inventory Tracking Implementation (Lead Scout)

**Datum:** 2026-05-20  
**Task:** #25 (QA review task #22)  
**Commit:** c78ba25  
**Reviewer:** kontrolor  
**Verdict: APPROVED s jedním bugs ⚠️** — Lead Scout side complete, Carmakler API side missing (plán krok 8)

---

## Zkontrolované soubory

- `lead_scout/inventory.py` — nový modul
- `lead_scout/db.py` — 4 nové sloupce
- `lead_scout/scheduler.py` — Counter integrace
- `lead_scout/client.py` — camelCase mapping
- `lead_scout/main.py` — inventory CLI
- `lib/validators/scout-lead.ts` — API schema (reference)
- `app/api/scout-leads/ingest/route.ts` — ingest endpoint (reference)

---

## Živé testy (Python)

```
inventory_tier:  13/13 PASS
calculate_trend:  9/9 PASS
inventory_score_bonus: 8/8 PASS
```

### ✅ 1. Tiery — 5+, 10+, 20+, 50+, 100+, 200+

```python
TIER_THRESHOLDS = [200, 100, 50, 20, 10, 5]  # správně sestupně

inventory_tier(0)   = ""     ✅
inventory_tier(5)   = "5+"   ✅
inventory_tier(10)  = "10+"  ✅
inventory_tier(20)  = "20+"  ✅
inventory_tier(50)  = "50+"  ✅
inventory_tier(100) = "100+" ✅
inventory_tier(200) = "200+" ✅
inventory_tier(500) = "200+" ✅
```

Loop iteruje od největšího prahu — správná logika ✅

### ✅ 2. POUZE pro AUTOBAZAR

Scheduler Counter:
```python
if source_name in ("TIPCARS", "SAUTO", "AUTOSCOUT24"):
    for lead in result.leads:
        if lead.category == Category.AUTOBAZAR and lead.name:  # ← filtr
```

DB lookup v `update_inventory()`:
```sql
WHERE category = 'AUTOBAZAR' AND LOWER(TRIM(name)) = LOWER(TRIM(?))
```

Dvojitá ochrana — SOUKROMNIK/VRAKOVISTE leady se nikdy nepočítají ✅

### ✅ 3. Trend calculation

```
trend(None, 50)  = None   ✅ (no prev)
trend(0, 50)     = None   ✅ (prev=0)
trend(50, 60)    = UP     ✅ (+20%)
trend(50, 40)    = DOWN   ✅ (-20%)
trend(50, 53)    = STABLE ✅ (+6%)
trend(100, 111)  = UP     ✅ (+11% > 10%)
trend(100, 110)  = STABLE ✅ (+10% = border, not > 10)
```

Hraniční případ `+10%` → STABLE je správný (podmínka `> 10`, ne `>= 10`) ✅

### ✅ 4. Score bonus — +5/+10/+15

```
bonus(0)   = 0   ✅
bonus(4)   = 0   ✅
bonus(5)   = 5   ✅  (5+)
bonus(19)  = 5   ✅
bonus(20)  = 10  ✅  (20+)
bonus(49)  = 10  ✅
bonus(50)  = 15  ✅  (50+)
bonus(200) = 15  ✅
```

Bonus recalculation v `update_inventory()` správně odstraní starý bonus:
```python
old_bonus = inventory_score_bonus(prev) if prev else 0
new_bonus = inventory_score_bonus(listing_count)
new_score = min(100, max(0, base_score - old_bonus + new_bonus))
```
Clamped na [0, 100] ✅ Žádné double-counting ✅

### ✅ 5. Counter pouze pro TIPCARS/SAUTO/AUTOSCOUT24

```python
if source_name in ("TIPCARS", "SAUTO", "AUTOSCOUT24"):
    # inventorování se děje pouze zde
```

Firmy.cz, Zlatéstránky, ARES, BAZOS, SBAZAR → žádné inventory tracking ✅

### ✅ 6. DB migration — 4 sloupce

```python
("estimated_inventory", "INTEGER"),
("prev_inventory", "INTEGER"),
("inventory_updated_at", "TEXT"),
("inventory_source", "TEXT"),
```

Safe ALTER TABLE s try/except, idempotentní ✅

### ✅ 7. client.py — exclude_keys a mapping

`estimated_inventory` → `estimatedInventory` přidán do SNAKE_TO_CAMEL ✅

Nové vnitřní sloupce správně v exclude_keys:
```python
"last_verified_at", "is_active", "verification_count",
"prev_inventory", "inventory_updated_at", "inventory_source",
```
`estimated_inventory` v exclude_keys NENÍ → posílá se do API jako `estimatedInventory` ✅ (viz BUG níže)

### ✅ 8. db.close() pořadí

`db.close()` voláno AFTER inventory tracking (správné — tracker sdílí `db` instanci):
```python
tracker = InventoryTracker(db)
tracker.bulk_update(...)
db.close()  # ← po trackerovi ✅
if saved > 0:
    _push_leads()  # vlastní DB instance
```

### ✅ 9. CLI inventory command

Zobrazuje top 20 autobazarů, tier badge, trend, source ✅  
`db.close()` voláno ✅

---

## Bug a poznámky

### 🐛 BUG: Carmakler API neakceptuje `estimatedInventory` — data se ztratí

**Potvrzeno:** `estimatedInventory` a `inventoryTrend` **neexistují** v:
- `lib/validators/scout-lead.ts` (Zod schema)
- `prisma/schema.prisma` (ScoutLead model)
- `lib/scout-lead-management.ts` (ingest logic)

API ingest route používá `scoutLeadIngestSchema.parse(body)`. Zod's výchozí chování pro `z.object()` je **stripping neznámých polí** — `estimatedInventory` se tiše odstraní. Data nedosáhnou DB.

**Plán Step 8** (Prisma + Zod + ingest) nebyl implementován v tomto commitu.

**Závažnost:** Střední — Lead Scout lokálně inventory sleduje korektně, ale data neteče do Carmakler DB. Dealers' inventory není viditelný v admin UI.

**Náprava:** Implementovat plán krok 8:
1. `prisma/schema.prisma` — přidat `estimatedInventory Int?` na ScoutLead
2. `lib/validators/scout-lead.ts` — přidat `estimatedInventory`
3. `lib/scout-lead-management.ts` — přidat do `prisma.scoutLead.create()`
4. Prisma migrace + deploy

Doporučuji vytvořit nový task pro tento follow-up.

### ⚠️ N1: `inventoryTrend` se do API neposílá

V DB není sloupec `inventory_trend` — trend se počítá on-demand z `prev_inventory`. Pro odeslání do API by bylo třeba buď: (a) přidat `inventory_trend` sloupec + uložit při update_inventory, nebo (b) kalkulovat v `_row_to_payload()`. Ani jedno není hotovo.

### ⚠️ N2: `bulk_update` počítá pokusy, ne skutečné aktualizace

```python
updated += 1  # ← increment pro každého dealera, i když DB match nenašel
```

Loguje "X dealers updated" ale reálně může být méně (dealeři z scraperů nemusí mít záznam v DB). Nízká závažnost.

---

## Souhrn

| Bod | Status |
|---|---|
| Tier thresholds 5+,10+,20+,50+,100+,200+ | ✅ 13/13 live tests |
| AUTOBAZAR-only counter + DB lookup | ✅ |
| calculate_trend (>10% UP, <-10% DOWN) | ✅ 9/9 tests |
| Score bonus +5/+10/+15 | ✅ 8/8 tests |
| Score recalc bez double-counting | ✅ |
| Counter pouze TIPCARS/SAUTO/AUTOSCOUT24 | ✅ |
| DB migration (4 sloupce, safe) | ✅ |
| client.py exclude_keys + camelCase | ✅ |
| db.close() pořadí | ✅ |
| CLI inventory command | ✅ |
| **Carmakler API: estimatedInventory chybí** | 🐛 Plán krok 8 nesplněn |
| inventoryTrend se neposílá | ⚠️ |

**Verdict: APPROVED s follow-up taskem.** Lead Scout implementace je kompletní a korektní. Je potřeba dokončit Carmakler API stranu (Prisma + Zod + ingest) jako samostatný task, jinak data nedosáhnou Carmakler DB.
