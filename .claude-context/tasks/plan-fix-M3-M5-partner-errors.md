# Plan: FIX M3+M4+M5 — Partner portál error states místo console.error

**Task:** #27
**Issue IDs:** M3, M4, M5 z audit-deep-stubs-broken-20260424.md
**Autor:** Plánovač
**Datum:** 2026-04-24

---

## ANALÝZA

### Stávající stav:
Všech 5 partner stránek má identický anti-pattern:
```ts
catch (err) {
  console.error("...", err);
}
```
Bez jakéhokoliv UI error state → uživatel vidí buď:
- **Infinite spinner** (dashboard, billing, stats — data zůstane `null`, loading se nastaví na `false`, ale UI zobrazí prázdno)
- **Prázdný obsah** (leads, orders — pole zůstane `[]`, zobrazí EmptyState jako by data nebyla)

### Stránky k opravě:

| # | Soubor | Řádky catch | Efekt |
|---|--------|-------------|-------|
| M3 | `app/(partner)/partner/dashboard/page.tsx` | 31-32 | data=null → nic se nezobrazí (StatCards podmíněné na `data`) |
| M4 | `app/(partner)/partner/leads/page.tsx` | 62-63 (load), 83-84 (update) | leads=[] → EmptyState "Žádní zájemci", update tiše selže |
| M5 | `app/(partner)/partner/billing/page.tsx` | 31-32 | data=null → nic pod headingem |
| M5 | `app/(partner)/partner/stats/page.tsx` | 41-42 (stats), 58 (charts) | stats=null → nic, charts tiše selžou |
| M5 | `app/(partner)/partner/orders/page.tsx` | 55-56 | orders=[] → EmptyState "Žádné objednávky" |

### Existující UI patterns:
- **error.tsx boundary** — každá partner stránka má `error.tsx` (Next.js Error Boundary) s pattern: `⚠️ icon + error.message + Button "Zkusit znovu"`. Tyto zachytí THROWN errors ale NE fetch failures (ty jsou catchnuté).
- **Žádný sdílený ErrorState component** — `components/ui/` nemá ErrorState/ErrorMessage.
- **EmptyState** — existuje `components/ui/EmptyState.tsx` (icon + title + description). Používá se v leads a orders.

### Rozhodnutí — inline error state vs shared component:
Vytvořit **sdílený `FetchError` component** v `components/ui/` — konzistentní UX, DRY, reusable i jinde v projektu. Minimální: icon + message + retry button.

---

## IMPLEMENTAČNÍ PLÁN (2 kroky)

### Krok 1: Vytvořit FetchError component

**Nový soubor:** `components/ui/FetchError.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/Button";

interface FetchErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function FetchError({
  message = "Nepodařilo se načíst data.",
  onRetry,
}: FetchErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Chyba</h3>
      <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
        {message}
      </p>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry}>
          Zkusit znovu
        </Button>
      )}
    </div>
  );
}
```

Přidat export do `components/ui/index.ts`.

---

### Krok 2: Přidat error state na všech 5 stránek

**Vzor pro každou stránku:**

1. Přidat state: `const [error, setError] = useState<string | null>(null);`
2. V catch bloku: `setError("Nepodařilo se načíst data.");` (místo jen console.error)
3. Extrahovat load funkci do `useCallback` pro retry
4. V UI: zobrazit `<FetchError message={error} onRetry={load} />` místo obsahu když `error !== null`
5. Na začátku load funkce: `setError(null);` (reset error při retry)

---

#### 2a) `dashboard/page.tsx`

**Přidat:**
```ts
const [error, setError] = useState<string | null>(null);
```

**Změnit load (ř. 26-38):**
```ts
const load = useCallback(async () => {
  setError(null);
  try {
    const res = await fetch("/api/partner/dashboard");
    if (res.ok) setData(await res.json());
    else setError("Nepodařilo se načíst dashboard.");
  } catch {
    setError("Nepodařilo se načíst dashboard.");
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => { load(); }, [load]);
```

**Za loading skeleton (ř. 51) přidat:**
```tsx
if (error) return <FetchError message={error} onRetry={load} />;
```

---

#### 2b) `leads/page.tsx`

**Přidat:**
```ts
const [error, setError] = useState<string | null>(null);
const [updateError, setUpdateError] = useState<string | null>(null);
```

**Změnit load (ř. 48-67):** Přidat `setError(null)` na začátek, `setError("Nepodařilo se načíst zájemce.")` do catch.

**Změnit updateLeadStatus (ř. 71-86):** Přidat `setUpdateError("Nepodařilo se aktualizovat stav.")` do catch + `setUpdateError(null)` na začátek. Přidat inline error toast nad tabulku.

**Za loading skeleton přidat:**
```tsx
if (error) return <FetchError message={error} onRetry={load} />;
```

**Pro updateError — inline alert nad lead kartami:**
```tsx
{updateError && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
    {updateError}
  </div>
)}
```

---

#### 2c) `billing/page.tsx`

**Stejný vzor jako dashboard:**
- `const [error, setError] = useState<string | null>(null);`
- Error handling v catch
- `if (error) return <FetchError message={error} onRetry={load} />;`

---

#### 2d) `stats/page.tsx`

**2 fetch calles:**
1. Stats load (ř. 36-48) — přidat error state + handling
2. Charts load (ř. 50-62) — charts jsou sekundární, nechat `catch { /* silent */ }` ale přidat inline info "Grafy se nepodařilo načíst"

**Hlavní error pro stats:**
```tsx
if (error) return <FetchError message={error} onRetry={load} />;
```

**Pro charts — soft fallback:**
```tsx
const [chartError, setChartError] = useState(false);
// V catch: setChartError(true);
// V UI místo chart loading skeleton:
{chartError && (
  <p className="text-sm text-gray-400 text-center py-8">Grafy se nepodařilo načíst.</p>
)}
```

---

#### 2e) `orders/page.tsx`

**Stejný vzor jako dashboard/billing:**
- `const [error, setError] = useState<string | null>(null);`
- Error handling v catch
- `if (error) return <FetchError message={error} onRetry={load} />;`

---

## SOUBORY K EDITACI

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `components/ui/FetchError.tsx` | **CREATE** | Nový shared error component (~25 řádků) |
| 2 | `components/ui/index.ts` | EDIT | Přidat FetchError export |
| 3 | `app/(partner)/partner/dashboard/page.tsx` | EDIT | +error state, +FetchError UI, +retry |
| 4 | `app/(partner)/partner/leads/page.tsx` | EDIT | +error state (load + update), +FetchError, +inline alert |
| 5 | `app/(partner)/partner/billing/page.tsx` | EDIT | +error state, +FetchError UI, +retry |
| 6 | `app/(partner)/partner/stats/page.tsx` | EDIT | +error state (stats + charts), +FetchError, +chart fallback |
| 7 | `app/(partner)/partner/orders/page.tsx` | EDIT | +error state, +FetchError UI, +retry |

---

## ACCEPTANCE CRITERIA

- [ ] Nový `FetchError` component existuje a je exportovaný z `components/ui/`
- [ ] Dashboard: selhání API → zobrazí error message + "Zkusit znovu" button
- [ ] Leads: selhání load → error message; selhání update → inline alert nad seznamem
- [ ] Billing: selhání API → error message + retry
- [ ] Stats: selhání stats → error message + retry; selhání charts → soft info text
- [ ] Orders: selhání API → error message + retry
- [ ] Retry button znovu volá fetch a při úspěchu zobrazí data
- [ ] Při retry se error message skryje
- [ ] Žádný console.error nezůstane jako JEDINÝ error handling (může zůstat vedle UI)
- [ ] Loading skeleton stále funguje během prvního načítání
- [ ] EmptyState se zobrazí jen pokud fetch uspěl ale vrátil prázdná data
- [ ] TypeScript build OK

## ODHAD

- **Složitost:** Nízká (1 nový component, 5 stránek s konzistentním patternem)
- **Risk:** Minimální — žádné API změny, čistě UI
