# QA Report — Task #24: Quick fix supplier dropdown v admin parts page

**Datum:** 2026-04-13
**Tester:** TEST-CHROME
**Commit:** 64209b3 (`fix: add supplier filter dropdown to admin parts page`)

---

## Shrnutí

| Oblast | Výsledek |
|--------|----------|
| TypeScript build | ✅ PASS (čisté) |
| `supplierFilter` state + `supplierId` param | ✅ PASS |
| Page reset při změně supplier filtru | ✅ PASS |
| Supplier dropdown UI (`<select>`) | ✅ PASS |
| **API endpoint pro supplier list** | ❌ BUG — špatný endpoint |

**Celkové hodnocení: NESCHVÁLENO ❌** — chybný endpoint vrací všechny uživatele místo jen dodavatelů.

---

## 1. TypeScript Build

```bash
npx tsc --noEmit 2>&1 | grep -v "e2e/"
# → žádný výstup (čisté)
```

---

## 2. Code Review

### Co funguje správně

- `supplierFilter` state inicializovaný na `""` (řádek 77) ✅
- `fetchParts` přidává `supplierId` do API params (řádek 96) ✅
- `supplierFilter` v `useCallback` dependency array (řádek 113) ✅
- `useEffect` pro reset page resetuje i při supplier filtru (řádek 129) ✅
- Dropdown UI se správným styling (konzistentní s ostatními selecty) ✅
- `if (d.suppliers) setSuppliers(d.suppliers)` — graceful fallback při chybě ✅

### ❌ Bug: Špatný API endpoint

**Implementátor použil:**
```ts
fetch("/api/admin/feeds/suppliers")
```

**Tento endpoint** (`app/api/admin/feeds/suppliers/route.ts`) vrací:
```ts
prisma.user.findMany({
  where: { status: "ACTIVE" },  // ← BEZ filtru na roli!
  ...
})
```
→ Vrátí VŠECHNY aktivní uživatele (ADMIN, BROKER, BUYER, BACKOFFICE, PARTS_SUPPLIER, ...)

**Správný endpoint:**
```
/api/admin/suppliers?status=ACTIVE&limit=100
```

Tento endpoint (`app/api/admin/suppliers/route.ts`) filtruje:
```ts
where: {
  role: { in: ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE"] }
}
```
→ Vrátí POUZE dodavatele dílů — správné pro filter na admin/parts.

**Dopad:** Dropdown "Dodavatel" zobrazuje všechny uživatele systému (makléře, kupce, adminy...) — admin vidí matoucí seznam s desítkami nerelevantních uživatelů.

---

## 3. Curl test API endpointů

```bash
# Špatný endpoint (použitý v implementaci) — auth required, vrací VŠECHNY usery
curl "http://localhost:3000/api/admin/feeds/suppliers"
→ {"error":"Nemate opravneni"}  # Auth funguje, ale scope je špatný

# Správný endpoint — filtruje na supplier role
curl "http://localhost:3000/api/admin/suppliers?status=ACTIVE&limit=100"
→ {"error":"Přístup odepřen"}  # Auth funguje, scope správný
```

Oba endpointy vrací `{ suppliers: [...] }` — UI kód je kompatibilní s oběma.

---

## Fix (1 řádek)

**`app/(admin)/admin/parts/page.tsx`, řádek 120:**

```ts
// ❌ Stávající (špatné):
fetch("/api/admin/feeds/suppliers")

// ✅ Správné:
fetch("/api/admin/suppliers?status=ACTIVE&limit=100")
```

---

## Závěr

**Task #24: NESCHVÁLENO ❌** — logika filtru je správná, ale dropdown načítá všechny uživatele místo jen dodavatelů dílů.

**Fix:** Změnit endpoint z `/api/admin/feeds/suppliers` na `/api/admin/suppliers?status=ACTIVE&limit=100` — 1 řádek, žádné jiné změny potřebné. Oba endpointy vrací kompatibilní formát `{ suppliers: [...] }`.
