# Implementace P1-08: Dynamicke statistiky na homepage

**Status:** HOTOVO
**Datum:** 2026-04-04
**Implementator:** Claude Agent

---

## Co bylo udelano

Nahrazeny hardcoded statistiky na /chci-prodat a /marketplace dynamickymi DB queries s graceful fallback. Vytvorena centralni knihovna `lib/stats.ts`.

### Vytvorene soubory

| Soubor | Popis |
|--------|-------|
| `lib/stats.ts` | `getBrokerStats()` a `getMarketplaceStats()` -- Prisma queries s try/catch fallback |

### Upravene soubory

| Soubor | Zmena |
|--------|-------|
| `app/(web)/chci-prodat/page.tsx` | Import stats, async funkce, revalidate=3600, nahrazeno 3 hardcoded cisla (20 dni, 247, 4.8) + metadata description |
| `app/(web)/marketplace/page.tsx` | Import stats, async funkce, revalidate=3600, nahrazeno 3 hardcoded cisla (127, 21%, 48 dni) |

### Detaily lib/stats.ts

**getBrokerStats():**
- `soldVehicles` -- `prisma.vehicle.count({ where: { status: "SOLD" } })`
- `avgSaleDays` -- prumer z posledních 100 SOLD vozidel (updatedAt - createdAt)
- `avgRating` -- `prisma.vehicle.aggregate({ _avg: { overallRating } })` zaokrouhleno na 1 des. misto

**getMarketplaceStats():**
- `completedFlips` -- `prisma.flipOpportunity.count({ where: { status: "COMPLETED" } })`
- `avgROI` -- (actualSalePrice - purchasePrice - repairCost) / investment * 100
- `avgFlipDays` -- prumer z poslednich 50 COMPLETED flipu (soldAt - createdAt)

**Error handling:**
- Vsechny queries v try/catch
- Fallback na 0 (zobrazuje se jako "–" v UI)
- `console.error` pri selhani

**ISR:**
- `revalidate = 3600` (1 hodina) na obou strankach

### Prisma modely (overeno)
- `Vehicle` (ne BrokerReview) -- status SOLD, pole overallRating
- `FlipOpportunity` (ne MarketplaceDeal) -- status COMPLETED, pole actualSalePrice, soldAt

## Overeni

- [x] lib/stats.ts vytvoren s obema funkcemi
- [x] /chci-prodat: async, revalidate, 3 dynamicke statistiky
- [x] /marketplace: async, revalidate, 3 dynamicke statistiky
- [x] Hardcoded "247" odstranen z chci-prodat
- [x] Hardcoded "127" odstranen z marketplace
- [x] Graceful fallback -- prazdna DB zobrazi "–"
- [x] Metadata description aktualizovany (bez hardcoded cisel)
