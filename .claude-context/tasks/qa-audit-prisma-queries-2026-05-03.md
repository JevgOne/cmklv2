# QA Report: Audit Prisma queries — N+1, performance, pagination — 2026-05-03

**Autor:** Kontrolor  
**Datum:** 2026-05-03  
**Soubory:** `app/api/`, `app/(web)/nabidka/page.tsx`, `app/(admin)/admin/`, `components/admin/`

---

## SHRNUTÍ

| Kategorie | Výsledek |
|---|---|
| N+1 queries | ✅ Žádné — všechny relace načteny přes `include` v jednom dotazu |
| Chybějící `take` limit | 🔴 3 endpoints bez jakéhokoliv limitu |
| Chybějící `where` | 🔴 1 endpoint taží celou tabulku bez filtru |
| Stránkování | 🟠 `/nabidka` — suboptimální pattern, admin — client-side |
| `orderBy` | ✅ Přítomné ve všech hlavních listingech |
| `select` vs `include` | ✅ Dobře — admin/broker queries používají `select` |

---

## 1. KRITICKÉ PROBLÉMY — Chybějící limity

### 🔴 1.1 `/api/admin/vehicles` — findMany bez `where` a bez `take`

**Soubor:** `app/api/admin/vehicles/route.ts:19-33`

```typescript
const vehicles = await prisma.vehicle.findMany({
  include: { broker: { select: ... }, images: ... },
  orderBy: { createdAt: "desc" },
  // ⚠️ ŽÁDNÝ where, ŽÁDNÝ take → celá tabulka
});
```

**Problém:** Taží VŠECHNA vozidla z DB bez jakéhokoliv filtru nebo limitu. Vrátí 1 000 vozidel stejně jako 1. Přitom klient (`VehiclesPageContent.tsx`) pak stránkuje client-side po 10 záznamech — přenos 100× více dat než potřeba.

**Dopad:** Kritický v produkci při růstu. Každé otevření `/admin/vehicles` = full table scan.

**Fix:** Přidat `where` nebo alespoň `take: 200` (jako ochranný cap), nebo přejít na server-side pagination.

---

### 🔴 1.2 `/api/payments` — findMany bez `where` a bez `take`

**Soubor:** `app/api/payments/route.ts:21`

```typescript
const payments = await prisma.payment.findMany({
  include: { vehicle: { select: ... }, confirmedBy: { select: ... } },
  orderBy: { createdAt: "desc" },
  // ⚠️ ŽÁDNÝ where, ŽÁDNÝ take → všechny platby v historii
});
```

**Problém:** Admin endpoint, vrátí všechny platby všech makléřů bez limitu. Payments tabulka roste neomezeně.

**Dopad:** Středně kritický — admin-only, ale problematické při škálování.

**Fix:** Přidat `take: 100` nebo server-side pagination.

---

### 🔴 1.3 `/api/broker/detailed-stats` — allSoldVehicles bez `brokerId` filtru!

**Soubor:** `app/api/broker/detailed-stats/route.ts:75`

```typescript
const allSoldVehicles = await prisma.vehicle.findMany({
  where: { status: "SOLD", soldAt: { not: null } },
  select: { createdAt: true, soldAt: true },
  // ⚠️ Žádný brokerId filtr → VŠECHNA prodaná vozidla na celé platformě
});
```

**Problém:** Toto taží VŠECHNA prodaná vozidla z celé platformy jen kvůli výpočtu průměrné doby prodeje (platforma-wide benchmark pro porovnání s makléřem). To je záměrné, ale bez žádného `take` limitu nebo cacheování.

**Dopad:** S 10 000+ prodanými vozidly = každé otevření stats stránky = full scan SOLD tabulky.

**Fix:** Buď cachovat výsledek (ISR/Redis), nebo přepočítávat pravidelně (cron) a ukládat do `SystemStats` tabulky, nikoliv počítat on-demand.

---

### 🔴 1.4 `/api/broker/vehicles` — findMany bez `take`

**Soubor:** `app/api/broker/vehicles/route.ts:28`

```typescript
const vehicles = await prisma.vehicle.findMany({
  where: { brokerId: session.user.id },
  select: { ... 19 polí ... },
  orderBy: { updatedAt: "desc" },
  // ⚠️ Žádný take → vrátí VŠECHNA vozidla makléře
});
```

**Problém:** Makléř s 500 vozidly dostane všechna najednou. Používá `select` (efektivní), ale bez `take`. PWA klient pravděpodobně zobrazuje vše v listě.

**Dopad:** Nízký nyní (makléři mají desítky aut), ale roste s platformou.

**Fix:** Přidat pagination nebo alespoň `take: 500` ochranný cap.

---

## 2. STŘEDNÍ PROBLÉMY — Suboptimální paginace

### 🟠 2.1 `/nabidka` — "Cursor drift" pagination (in-memory slice místo DB skip)

**Soubor:** `app/(web)/nabidka/page.tsx:102-131`

```typescript
// ⚠️ SUBOPTIMÁLNÍ PATTERN:
const fetchLimit = (page * limit) + limit;  // page 5 → 108 záznamů fetched!

const [dbVehicles, vehicleTotal, dbListings, listingTotal] = await Promise.all([
  prisma.vehicle.findMany({ ..., take: fetchLimit }),   // ← Roste s každou stránkou
  prisma.vehicle.count({ where: vehicleWhere }),
  prisma.listing.findMany({ ..., take: fetchLimit }),   // ← Totéž
  prisma.listing.count({ where: listingWhere }),
]);

// In-memory slice po mergi:
const skip = (page - 1) * limit;
const vehicles = allCards.slice(skip, skip + limit);
```

**Problém:** Cross-table merge (Vehicle + Listing) vyžaduje in-memory sort. Pro stránku 5 se fetchne 108 záznamů z každé tabulky (celkem 216) jen kvůli zobrazení 18 výsledků. Stránka 10 = 198 + 198 = 396 záznamů pro 18 zobrazených.

**Kontext:** Tento pattern je vědomý kompromis pro cross-table merge s price sort. Správné řešení by byl `UNION ALL` na DB úrovni nebo denormalizace do jedné `CatalogEntry` tabulky.

**Dopad:** Postupně narůstající. Stránky 1-3 jsou OK, stránky 10+ začínají být problém.

**Fix (pragmatický):** Přidat hard cap `fetchLimit = Math.min(fetchLimit, 200)` jako dočasná ochrana.

---

### 🟠 2.2 Admin tables — Client-side pagination (fetch all, slice in JS)

**Soubory:** `components/admin/VehiclesPageContent.tsx`, `components/admin/BrokersPageContent.tsx`

**Pattern:**
```typescript
useEffect(() => {
  fetch("/api/admin/vehicles")  // ← všechna vozidla najednou
    .then(r => r.json())
    .then(data => setVehicles(data.vehicles));
}, []);

// Client-side pagination:
const paginatedVehicles = filteredVehicles.slice((page-1)*10, page*10);
```

**Problém:** Celá tabulka vozidel/makléřů je fetchnuta při každém načtení stránky. Admin může mít tisíce vozidel.

**Dopad:** Kvadratický s počtem záznamů — přenos dat, parsing v JS, memory.

**Fix:** Server-side pagination — přidat `?page=1&limit=20` do API volání, nebo přepsat na Server Component.

---

## 3. CO FUNGUJE SPRÁVNĚ ✅

### ✅ Správně implementované endpoints

| Endpoint | Pattern | Poznámka |
|----------|---------|---------|
| `GET /api/vehicles` | `skip/take`, `where`, `orderBy`, `count` | Vzorová implementace |
| `GET /api/parts` | `skip/take`, `where`, `orderBy`, `count` | Vzorová implementace |
| `GET /api/listings` | `skip/take`, `where`, `orderBy`, `count` | Vzorová implementace |
| `GET /api/admin/orders` | `take: 100` + `where` (search/status) | Ochranný cap ✅ |
| `GET /api/admin/brokers` | `select` (ne include), `where: { role: "BROKER" }` | Efektivní |
| `GET /api/contacts` | `skip/take`, `where`, `count` | Plná paginace ✅ |
| `shop/page.tsx` | `take: 6` + `groupBy` | Správně omezeno |

### ✅ Žádné N+1 queries nalezeny

Všechny relace jsou načítány v jednom dotazu přes `include` nebo `select`. Například:
- `/nabidka`: Vehicle + images + broker v jednom `findMany` ✅
- `/api/admin/orders`: Order + items + buyer + subOrders + supplier v jednom `findMany` ✅
- `/api/broker/vehicles`: vehicles s 19 `select` poli, bez N+1 ✅

### ✅ `orderBy` přítomné ve všech listingech

Všechny `findMany` pro seznam dat mají `orderBy` — žádné výsledky bez definovaného řazení.

### ✅ `select` místo `include` kde možné

`/api/admin/brokers`, `/api/broker/vehicles`, `/api/broker/detailed-stats` — všechny používají `select` pro relace, nikoliv `include` (vrátí celý model).

---

## 4. PRIORITIZACE OPRAV

### 🔴 Vysoká priorita (opravit před produkčním škálováním)

| Číslo | Soubor | Oprava |
|-------|--------|--------|
| 1 | `app/api/admin/vehicles/route.ts:19` | Přidat `take: 200` + server-side pagination |
| 2 | `app/api/payments/route.ts:21` | Přidat `take: 100` nebo pagination |
| 3 | `app/api/broker/detailed-stats/route.ts:75` | Cachovat platform-wide stats (cron job nebo ISR) |
| 4 | `app/api/broker/vehicles/route.ts:28` | Přidat `take: 500` jako cap |

### 🟠 Střední priorita

| Číslo | Soubor | Oprava |
|-------|--------|--------|
| 5 | `app/(web)/nabidka/page.tsx:103` | Hard cap `fetchLimit = Math.min(..., 200)` |
| 6 | `components/admin/VehiclesPageContent.tsx` | Server-side pagination v API |

### ✅ Nepotřebuje opravu

- Žádné N+1 queries
- Hlavní public API (vehicles, parts, listings) — správná paginace
- Admin orders — `take: 100` cap
