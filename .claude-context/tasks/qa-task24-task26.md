# QA Report — Task #24: Supplier dropdown + Task #26: CRON_SECRET fix

**Datum:** 2026-04-13  
**Agent:** KONTROLOR  
**Commity:** `64209b3` (Task #24), `b2f7264` (Task #26)

---

## TASK #26: CRON_SECRET undefined bypass fix

### Reverzní kontrola — všech 11 cron endpointů

| Endpoint | Nový pattern `!cronSecret \|\|` | Stav |
|----------|--------------------------------|------|
| stock-alerts | ✅ | |
| watchdog-match | ✅ | |
| upsell-check | ✅ | |
| stale-vehicles | ✅ | |
| sla-check | ✅ | |
| reservation-expiry | ✅ | |
| quick-draft-expiry | ✅ | |
| listing-expiry | ✅ | |
| exclusive-expiry | ✅ | |
| daily-summary | ✅ | byl správný již dříve |
| feed-import | ✅ | byl správný již dříve |

**Správný pattern na všech 11 endpointech:**
```typescript
const cronSecret = process.env.CRON_SECRET;
const authHeader = request.headers.get("authorization");
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Task #26 Verdict: ✅ PASS** — Security issue opravena na všech 11 cron endpointech.

---

## TASK #24: Supplier filter dropdown v admin parts page

### Soubor: app/(admin)/admin/parts/page.tsx

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | `supplierFilter` state | ✅ | line 77 |
| 2 | `supplierId` param do backend API | ✅ | line 96 |
| 3 | `<select>` s "Všichni dodavatelé" | ✅ | line 238 |
| 4 | Reset page + selection při změně filtru | ✅ | line 129 |
| 5 | Supplier list fetch on mount | ✅ | line 120 |
| 6 | Pouze dodavatelé v dropdown | ❌ | **BUG** — viz níže |

---

### ❌ BUG-1: Špatný API endpoint pro supplier list

**Soubor:** `app/(admin)/admin/parts/page.tsx:120`

```typescript
fetch("/api/admin/feeds/suppliers")
```

**Problém:** `/api/admin/feeds/suppliers` vrací **VŠECHNY aktivní uživatele** bez ohledu na roli:

```typescript
// app/api/admin/feeds/suppliers/route.ts:19
const suppliers = await prisma.user.findMany({
  where: { status: "ACTIVE" },  // ← žádný role filter!
  ...
```

Dropdown tedy zobrazí brokers, buyers, adminů, investorů — uživatele, kteří nemohou vlastnit díly.

**Správný endpoint existuje:** `/api/admin/suppliers?status=ACTIVE&limit=100`

```typescript
// app/api/admin/suppliers/route.ts:6
const SUPPLIER_ROLES = ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE"];
// where: { role: { in: SUPPLIER_ROLES }, status: "ACTIVE" }
```

**Fix:** Změnit fetch URL:
```typescript
// WRONG:
fetch("/api/admin/feeds/suppliers")

// CORRECT:
fetch("/api/admin/suppliers?status=ACTIVE&limit=100")
  .then((r) => r.json())
  .then((d) => { if (d.suppliers) setSuppliers(d.suppliers); })
```

**Závažnost:** Střední — dropdown funguje funkčně (filtrace probíhá), ale nabízí chybné hodnoty (non-supplier uživatele). Admin může zvolit BROKER uživatele jako filter a dostat prázdné výsledky, protože žádné díly takového uživatele nemají.

**Effort:** 1 minuta — změna jednoho URL.

---

**Task #24 Verdict: ❌ FAIL** — Supplier dropdown přítomen, ale fetch ze špatného endpointu zobrazuje všechny uživatele místo jen dodavatelů.

---

## SOUHRN

| Task | Verdikt | Kritická nalezení |
|------|---------|-------------------|
| #26 CRON_SECRET fix | ✅ PASS | 0 — vše správně |
| #24 Supplier dropdown | ❌ FAIL | BUG-1: /api/admin/feeds/suppliers místo /api/admin/suppliers |

**Doporučení:** Task #24 vrátit implementátoru — jednoduchý 1-minutový fix URL.

---

## TASK #27: OEM lookup normalizace — raw SQL (commit d3c7aaa)

### Problém (který fix řeší)

Původní Prisma `contains` dělal `ILIKE '%06B103925%'` — ale "06B 103 925" v DB obsahuje mezery, takže neprošel. Normalizace byla jen na query straně, ne na DB straně.

### Reverzní kontrola — app/api/parts/oem-lookup/route.ts

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | DB-side normalizace: strip mezery, pomlčky, tečky | ✅ | `UPPER(REPLACE(REPLACE(REPLACE(col,' ',''),'-',''),'.',''))` |
| 2 | Query normalizace: `normalizeOem()` → likePattern `%...%` | ✅ | |
| 3 | Obě pole (oemNumber i partNumber) normalizovány DB-side | ✅ | OR podmínka |
| 4 | SQL injection safety: user input vždy přes `$1` param | ✅ | `likePattern` jako $1 |
| 5 | limit/offset jako `$2`/`$3` params | ✅ | |
| 6 | Two-step: raw SQL pro IDs → Prisma findMany pro relace | ✅ | čistý pattern |
| 7 | COUNT query pro pagination | ✅ | `SELECT COUNT(*) as count` |
| 8 | Fallback: `ids.length > 0` check před findMany | ✅ | prázdný výsledek správně |
| 9 | Pořadí zachováno: obě fáze orderBy price ASC | ✅ | |

**Funkční test (mentální):**
- Query: `"06B 103 925"` → normalized: `"06B103925"` → likePattern: `"%06B103925%"`
- DB hodnota: `"06B 103 925"` → REPLACE chain: `"06B103925"` → ILIKE `"%06B103925%"` → **MATCH ✅**
- DB hodnota: `"06B.103.925"` → REPLACE chain: `"06B103925"` → ILIKE `"%06B103925%"` → **MATCH ✅**

**Task #27 Verdict: ✅ PASS** — Normalizace funguje oboustranně, SQL injection bezpečné.

---

## FINÁLNÍ SOUHRN (Task #28 batch)

| Task | Commit | Verdikt | Kritická nalezení |
|------|--------|---------|-------------------|
| #24 Supplier dropdown | 64209b3 | ❌ FAIL | BUG-1: feeds/suppliers místo admin/suppliers |
| #26 CRON_SECRET fix | b2f7264 | ✅ PASS | 0 — vše správně (11/11 endpoints) |
| #27 OEM normalizace | d3c7aaa | ✅ PASS | 0 — DB-side normalization bezpečná |
