# QA Report — Task #23: P1-4 OEM křížové reference lookup

**Datum:** 2026-04-13
**Tester:** TEST-CHROME
**Commit:** bc041ea (`feat: add OEM cross-reference lookup with DB indexes`)

---

## Shrnutí

| Oblast | Výsledek |
|--------|----------|
| TypeScript build | ✅ PASS (čisté) |
| Prisma indexy `@@index([oemNumber])` a `@@index([partNumber])` | ✅ PASS (řádky 960-961) |
| API endpoint — základní funkce (q<3, limit cap, pagination) | ✅ PASS |
| Hledání s PŮVODNÍM formátem (mezery/pomlčky zachovány) | ✅ PASS |
| OEM normalizace v `getSearchSuggestions` (SQL) | ✅ PASS |
| **Normalizace v `oem-lookup` route (Prisma `contains`)** | ❌ BUG — nefunguje |

**Celkové hodnocení: PODMÍNĚNÉ SCHVÁLENÍ ⚠️** — core funkce funguje, ale OEM normalizace (klíčová feature P1-4) nefunguje v route endpointu.

---

## 1. TypeScript Build

```bash
npx tsc --noEmit 2>&1 | grep -v "e2e/"
# → žádný výstup (čisté)
```

---

## 2. Prisma indexy

`prisma/schema.prisma` řádky 960-961:
```prisma
@@index([oemNumber])
@@index([partNumber])
```
✅ Přidány správně za existující indexy na Part model.

---

## 3. API endpoint — funkční testy

```bash
# Test 1: krátká query (< 3 chars) → prázdné výsledky
curl "http://localhost:3000/api/parts/oem-lookup?q=AB"
→ {"parts":[],"total":0,"page":1,"totalPages":0} ✅

# Test 2: limit cap (100 → max 50)
curl "...?q=5E4+831+051&limit=100"
→ parts count: 1, total: 1 ✅ (limit funguje)

# Test 3: veřejný endpoint (bez auth)
curl "http://localhost:3000/api/parts/oem-lookup?q=test"
→ HTTP 200 ✅ (záměrně public — zákazníci hledají bez účtu)
```

---

## 4. ❌ KRITICKÝ GAP: Normalizace nefunguje v route

### Problém

DB obsahuje OEM čísla uložená S mezerami: `"5E4 831 051"`, `"04L 253 010 T"`

Implementace normalizuje query (stripuje mezery/pomlčky/tečky), pak hledá pomocí Prisma `contains`:

```typescript
const normalized = normalizeOem(query);   // "5E4831051"
{ oemNumber: { contains: normalized } }   // LIKE '%5E4831051%'
```

Ale Prisma `contains` se překládá na SQL `LIKE '%5E4831051%'` — to NENAJDE hodnotu `"5E4 831 051"` (s mezerami).

### Reprodukce

```bash
# Databáze obsahuje: oemNumber = "5E4 831 051"

# ❌ Uživatel zadá BEZ MEZER (normalizovaný formát)
curl "http://localhost:3000/api/parts/oem-lookup?q=5E4831051"
→ {"parts":[],"total":0}   # NULOVÝ VÝSLEDEK — normalizace nefunguje!

# ❌ Uživatel zadá S POMLČKAMI
curl "http://localhost:3000/api/parts/oem-lookup?q=5E4-831-051"
→ {"parts":[],"total":0}   # NULOVÝ VÝSLEDEK

# ✅ Uživatel zadá PŘESNĚ jako v DB (mezery)
curl "http://localhost:3000/api/parts/oem-lookup?q=5E4+831+051"
→ {"parts":[{"name":"Dveře přední levé",...}],"total":1}  # NALEZENO
```

Stejné chování ověřeno pro `04L 253 010 T` (turbodmychadlo).

### Příčina

`normalizeOem(query)` normalizuje QUERY, ale ne DB hodnoty. Prisma `contains` dělá substring match v originální (neskormalizované) DB hodnotě. Pro cross-reference normalizaci musí dojít k normalizaci i na straně DB — nutné raw SQL.

### Origen gapu

Spec v deep-dive (`deep-dive-p13-p14-stock-oem.md`, Krok 2, řádky 309-315) má **identický kód** — bug je zděděný ze spec, ne chyba implementátora.

### Fix (raw SQL varianta)

```typescript
// Místo Prisma contains, použít $queryRaw s normalizací i DB strany:
const parts = await prisma.$queryRaw<Part[]>`
  SELECT ... FROM "Part"
  WHERE status = 'ACTIVE'
    AND (
      UPPER(REPLACE(REPLACE(REPLACE("oemNumber", ' ', ''), '-', ''), '.', ''))
        LIKE ${`%${normalized}%`}
      OR UPPER(REPLACE(REPLACE(REPLACE("partNumber", ' ', ''), '-', ''), '.', ''))
        LIKE ${`%${normalized}%`}
      OR "oemNumber" ILIKE ${`%${query}%`}
      OR "partNumber" ILIKE ${`%${query}%`}
    )
  ORDER BY price ASC
  LIMIT ${limit} OFFSET ${(page-1)*limit}
`;
```

---

## 5. ✅ `getSearchSuggestions` OEM detekce — funguje správně

Na rozdíl od route, suggestions v `lib/search.ts` používají raw SQL s normalizací OBÉ strany:

```sql
AND UPPER(REPLACE(REPLACE("oemNumber", ' ', ''), '-', ''))
    LIKE '%' || UPPER(REPLACE(REPLACE($1, ' ', ''), '-', '')) || '%'
```

Tento přístup normalizuje jak DB hodnotu tak query → správné.

---

## 6. Code Review — `app/api/parts/oem-lookup/route.ts`

| Bod | Spec | Implementace | Status |
|-----|------|--------------|--------|
| Min délka query: 3 | `q.length < 3` | identické | ✅ |
| Limit max 50 | `Math.min(50, ...)` | identické | ✅ |
| Pagination | skip/take | identické | ✅ |
| Normalizace query | strip `[\s\-.]`, uppercase | `normalizeOem()` — správně | ✅ |
| Status filter | `status: "ACTIVE"` | identické | ✅ |
| Select pole | id, name, slug, oemNumber, partNumber, manufacturer, price, stock... | identické | ✅ |
| Obrazky | `images: { take: 1, orderBy: order: "asc" }` | identické | ✅ |
| Error handling | try/catch + 500 | implementováno | ✅ |
| Normalizace DB strany | CHYBÍ v spec i implementaci | ❌ | Bug v spec |

---

## 7. Chybějící: OEM UI komponenta (Krok 4 deep-dive — volitelné)

`components/web/OemLookup.tsx` — implementátor nevytvořil, je označeno jako "volitelné rozšíření" v deep-dive.
Funkce dostupná přes API, UI pro budoucí task.

---

## Doporučení

### Option A: Fix now
Implementátor opraví `oem-lookup/route.ts` — nahradit Prisma `contains` raw SQL s normalizací DB strany (~30 min).

### Option B: Accept for MVP
Endpoint funguje pro uživatele kteří zadají OEM ve stejném formátu jako je v DB. Normalizace pracuje v suggestions (`getSearchSuggestions`). Pro MVP akceptovatelné, tagged jako tech-debt.

---

## Závěr

**Task #23: PODMÍNĚNÉ SCHVÁLENÍ ⚠️**

- Indexy, TypeScript, pagination, auth — vše OK
- Normalizace v suggestions (SQL) — funguje
- Normalizace v oem-lookup route (Prisma contains) — nefunguje pro klíčový use case (hledání bez mezer/s pomlčkami)
- Bug zděděn ze spec, ne chyba implementátora

**Doporučeno rozhodnutí leada:** Accept for MVP nebo immediate fix.
