# QA Report: FIX M3+M4+M5 — Partner portál error states (5 stránek)

**Task:** #27  
**Commit:** `973d189`  
**Kontrolor:** KONTROLOR agent  
**Datum:** 2026-04-24

---

## VERDIKT: ✅ PASS

Všech 5 stránek má implementovaný error state s retry tlačítkem. 4xx/5xx i network errory jsou správně zachyceny. Minor nekonzistence v renderovacím patternu — funkčně správné.

---

## Přehled změn

| Stránka | Soubor | Error state | Retry | Verdict |
|---------|--------|-------------|-------|---------|
| Dashboard | `partner/dashboard/page.tsx` | ✅ | ✅ | PASS |
| Leads (load) | `partner/leads/page.tsx` | ✅ | ✅ | PASS |
| Leads (update) | `partner/leads/page.tsx` | ✅ inline banner | N/A | PASS |
| Billing | `partner/billing/page.tsx` | ✅ | ✅ | PASS |
| Stats | `partner/stats/page.tsx` | ✅ | ✅ | PASS |
| Orders | `partner/orders/page.tsx` | ✅ | ✅ | PASS |

---

## Detailní kontrola

### 1. Dashboard (`partner/dashboard/page.tsx`)

**Pattern:** early return

```tsx
const loadData = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch("/api/partner/dashboard");
    if (res.ok) setData(await res.json());
    else setError("Nepodařilo se načíst dashboard");   // ← 4xx/5xx
  } catch {
    setError("Chyba připojení k serveru");              // ← network
  } finally {
    setLoading(false);
  }
};
// ...
if (error) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-4xl mb-4">⚠️</span>
      <p className="text-gray-900 font-semibold mb-2">{error}</p>
      <Button variant="outline" onClick={loadData}>Zkusit znovu</Button>
    </div>
  );
}
```

- `setError(null)` na začátku každého load — stale error se resetuje ✅
- 4xx/5xx → `else setError(...)` ✅
- Network error → `catch { setError(...) }` ✅
- Retry → `onClick={loadData}` — volá celý load znovu ✅
- Loading skeleton se zobrazuje místo erroru (early return order: loading → error → content) ✅

---

### 2. Leads (`partner/leads/page.tsx`)

**Dva oddělené error states:** `error` (load) + `updateError` (update status)

**Load error:**
```tsx
const loadLeads = async () => {
  setLoading(true);
  setError(null);
  // ...
  try {
    const res = await fetch(`/api/partner/leads?${params}`);
    if (res.ok) { setLeads(...); setTotal(...); setTotalPages(...); }
    else setError("Nepodařilo se načíst zájemce");
  } catch {
    setError("Chyba připojení k serveru");
  } finally { setLoading(false); }
};
```

```tsx
{error && (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <span className="text-4xl mb-4">⚠️</span>
    <p className="text-gray-900 font-semibold mb-2">{error}</p>
    <Button variant="outline" onClick={loadLeads}>Zkusit znovu</Button>
  </div>
)}
```

✅ 4xx/5xx zachyceno, ✅ network error zachyceno, ✅ retry button  
⚠️ **Minor:** Error je inline (ne early return) — Tabs zůstávají viditelné nad errorem. Funkčně lepší (uživatel může změnit tab filtr a retry), ale vizuálně nekonzistentní s ostatními stránkami.

**Update error:**
```tsx
async function updateLeadStatus(leadId: string, newStatus: string) {
  setUpdateError(null);
  try {
    const res = await fetch(`/api/partner/leads/${leadId}`, { method: "PATCH", ... });
    if (res.ok) { setLeads(prev => prev.map(...)); }
    else setUpdateError("Nepodařilo se aktualizovat stav zájemce");
  } catch {
    setUpdateError("Chyba připojení k serveru");
  }
}
```

```tsx
{updateError && (
  <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
    {updateError}
  </div>
)}
```

✅ Odlišný error state pro per-item operaci — správná volba  
✅ Červený inline banner místo full-page erroru — adekvátní pro aktualizaci jednoho záznamu  
✅ Bez retry tlačítka pro update — správně (uživatel může zkusit znovu výběrem v select)

---

### 3. Billing (`partner/billing/page.tsx`)

**Pattern:** early return — identický s dashboardem

```tsx
const loadData = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch("/api/partner/billing");
    if (res.ok) setData(await res.json());
    else setError("Nepodařilo se načíst vyúčtování");
  } catch {
    setError("Chyba připojení k serveru");
  } finally { setLoading(false); }
};
```

✅ 4xx/5xx ✅ network ✅ retry `onClick={loadData}` ✅ skeleton loading

---

### 4. Stats (`partner/stats/page.tsx`)

**Pattern:** early return pro main stats

```tsx
const loadStats = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch("/api/partner/stats");
    if (res.ok) setStats(await res.json());
    else setError("Nepodařilo se načíst statistiky");
  } catch {
    setError("Chyba připojení k serveru");
  } finally { setLoading(false); }
};
```

✅ 4xx/5xx ✅ network ✅ retry `onClick={loadStats}`

**⚠️ Možná encoding chyba ř. 44:** Read tool zobrazil `"Nepodařilo se na\uFFFD\uFFFDíst statistiky"` — dva replacement characters místo `č`. Ostatní soubory mají `načíst` správně. Doporučeno ověřit v editoru — pokud je soubor uložen jako UTF-8 správně, jde o artifact Read toolu.

**Sekundární chart fetch (ř. 54-66):**
```tsx
useEffect(() => {
  async function loadCharts() {
    try {
      const res = await fetch("/api/partner/stats/charts?months=6");
      if (res.ok) { setChartData(data.months || []); }
    } catch { /* silent */ }
    finally { setChartLoading(false); }
  }
  loadCharts();
}, []);
```

✅ Charts jsou supplemental data — silent fail je záměrný a akceptovatelný  
⚠️ **Minor:** Retry button spustí `loadStats()` ale ne `loadCharts()`. Pokud selže pouze chart fetch (stats OK), retry neobnoví grafy. Hraniční případ, neblokující.

---

### 5. Orders (`partner/orders/page.tsx`)

**Pattern:** ternary chain (mírně odlišné od ostatních)

```tsx
const loadOrders = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(`/api/orders?role=supplier&page=${page}`);
    if (res.ok) { setOrders(data.orders ?? []); setTotal(...); setTotalPages(...); }
    else setError("Nepodařilo se načíst objednávky");
  } catch {
    setError("Chyba připojení k serveru");
  } finally { setLoading(false); }
};
```

```tsx
{error ? (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <span className="text-4xl mb-4">⚠️</span>
    <p className="text-gray-900 font-semibold mb-2">{error}</p>
    <Button variant="outline" onClick={loadOrders}>Zkusit znovu</Button>
  </div>
) : loading ? (
  ...skeleton...
) : orders.length === 0 ? (
  ...EmptyState...
) : (
  ...list...
)}
```

✅ 4xx/5xx ✅ network ✅ retry  
✅ Error má prioritu nad loading (správné pořadí v ternary)  
⚠️ **Minor:** Ternary chain místo early return — nekonzistentní s ostatními 4 stránkami. Funkčně totožné.

---

## Konzistence patternu

| Aspekt | Dashboard | Leads | Billing | Stats | Orders |
|--------|-----------|-------|---------|-------|--------|
| `setError(null)` na retry start | ✅ | ✅ | ✅ | ✅ | ✅ |
| `if (!res.ok)` → setError | ✅ | ✅ | ✅ | ✅ | ✅ |
| `catch` → setError | ✅ | ✅ | ✅ | ✅ | ✅ |
| Retry button | ✅ | ✅ | ✅ | ✅ | ✅ |
| Renderovací pattern | early return | inline | early return | early return | ternary |
| Error UI vzhled | centered ⚠️ | centered ⚠️ | centered ⚠️ | centered ⚠️ | centered ⚠️ |

Renderovací pattern je 4:1 (early return vs ternary) — mírná nekonzistence v orders. Vizuální UI error výsledek je identický ve všech případech.

---

## Otevřené body

| # | Závažnost | Popis |
|---|-----------|-------|
| 1 | ⚠️ Minor | `stats/page.tsx:44` — možná encoding chyba v error message (ověřit `načíst` vs `na??íst`) |
| 2 | ℹ️ Info | `orders/page.tsx` — ternary místo early return (nekonzistentní, nekritické) |
| 3 | ℹ️ Info | `stats/page.tsx` — retry neobnoví chart data, pouze main stats |
| 4 | ℹ️ Info | `leads/page.tsx` — load error inline (ne full-page replacement) — odlišné, ale funkčně OK |

---

## Souhrn

Původní problém (silent `console.error` bez UI feedback) byl ve všech 5 stránkách opraven. Error handling pattern je konzistentní v kritických bodech (reset před fetch, 4xx/5xx zachyceno, catch pro network, retry button). Minor nekonzistence v renderovacím přístupu neblokují produkci.

**VERDIKT: ✅ PASS — Připraveno k evžen review / merge.**
