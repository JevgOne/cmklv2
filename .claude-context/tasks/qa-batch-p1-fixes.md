# QA Report — Batch P1 fixy (Task #28)

**Datum:** 2026-04-13  
**Agent:** KONTROLOR  
**Commity:** `64209b3` (supplier dropdown), `b2f7264` (CRON_SECRET), `d3c7aaa` (OEM normalizace)

---

## BUILD CHECK

**TypeScript:** ✅ 0 errors v `app/` a `lib/` (3 pre-existing errors v `e2e/` — ignorovány buildem)  
**Build:** ✅ Stránky generovány úspěšně (page tree verifikován, lock-conflict bránil čistému zachycení page count)

---

## 1. SUPPLIER DROPDOWN (commit 64209b3)

### app/(admin)/admin/parts/page.tsx

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | `supplierFilter` state | ✅ | line 77 |
| 2 | `supplierId` param do backend API | ✅ | line 96 |
| 3 | `<select>` s "Všichni dodavatelé" | ✅ | line 238 |
| 4 | Reset page + selection při změně filtru | ✅ | line 129 |
| 5 | Fetch supplier listu on mount | ✅ | useEffect bez deps |
| 6 | **Správný endpoint** `/api/admin/suppliers` | ❌ | **BUG** |

### ❌ BUG-1: Špatný API endpoint — `/api/admin/feeds/suppliers`

**Soubor:** `app/(admin)/admin/parts/page.tsx:120`

```typescript
// WRONG — vrací VŠECHNY aktivní uživatele bez role filtru:
fetch("/api/admin/feeds/suppliers")

// CORRECT — filtruje jen PARTS_SUPPLIER/WHOLESALE_SUPPLIER/PARTNER_VRAKOVISTE:
fetch("/api/admin/suppliers?status=ACTIVE&limit=100")
```

**Dopad:** Dropdown nabízí brokers, buyers, admins, investory — uživatele kteří nemohou vlastnit díly. Filter funguje (supplierId param prochází), ale výběr je chybný.  
**Fix:** 1 řádek, `app/(admin)/admin/parts/page.tsx:120`.  
**Závažnost:** Střední.

**Supplier dropdown: ❌ FAIL**

---

## 2. CRON_SECRET FIX (commit b2f7264)

### Všech 11 cron endpointů

| Endpoint | Pattern `!cronSecret \|\|` | Stav |
|----------|---------------------------|------|
| stock-alerts | ✅ | |
| watchdog-match | ✅ | |
| upsell-check | ✅ | |
| stale-vehicles | ✅ | |
| sla-check | ✅ | |
| reservation-expiry | ✅ | |
| quick-draft-expiry | ✅ | |
| listing-expiry | ✅ | |
| exclusive-expiry | ✅ | |
| daily-summary | ✅ | byl správný dříve |
| feed-import | ✅ | byl správný dříve |

**Správný pattern všude:**
```typescript
const cronSecret = process.env.CRON_SECRET;
const authHeader = request.headers.get("authorization");
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) { ... }
```

**CRON_SECRET fix: ✅ PASS** — Security issue odstraněna na všech 11 endpointech.

---

## 3. OEM NORMALIZACE (commit d3c7aaa)

### app/api/parts/oem-lookup/route.ts

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | DB-side normalizace: strip mezery + pomlčky + tečky | ✅ | `REPLACE(REPLACE(REPLACE(col,' ',''),'-',''),'.',''))` |
| 2 | Query normalizace přes `normalizeOem()` → `likePattern` | ✅ | |
| 3 | Obě pole normalizovány (oemNumber i partNumber) | ✅ | OR podmínka |
| 4 | SQL injection: user input přes `$1` param | ✅ | |
| 5 | limit/offset jako `$2`/`$3` params | ✅ | |
| 6 | Two-step: raw SQL IDs → Prisma findMany pro relace | ✅ | |
| 7 | COUNT query pro pagination | ✅ | |
| 8 | Guard: `ids.length > 0` před findMany | ✅ | |

**Mentální test:** `"5E4831051"` → normalized `"5E4831051"` → likePattern `"%5E4831051%"`. DB hodnota `"5E4 831 051"` → REPLACE strip → `"5E4831051"` → **MATCH ✅**

**OEM normalizace: ✅ PASS** — Oboustranná normalizace, SQL-safe.

---

## SOUHRN

| Task | Commit | Verdikt |
|------|--------|---------|
| Supplier dropdown | 64209b3 | ❌ FAIL — feeds/suppliers místo admin/suppliers (1-min fix) |
| CRON_SECRET fix | b2f7264 | ✅ PASS — 11/11 endpointů opraveno |
| OEM normalizace | d3c7aaa | ✅ PASS — DB-side normalizace bezpečná |
| Build / TypeScript | — | ✅ PASS — 0 errors v app/lib |

**Požadavek na implementátora:** Opravit `app/(admin)/admin/parts/page.tsx:120` — URL z `/api/admin/feeds/suppliers` na `/api/admin/suppliers?status=ACTIVE&limit=100`.
