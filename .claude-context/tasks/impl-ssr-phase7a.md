# IMPL: SSR migrace Fáze 7A — Quick wins (10 stránek)

**Datum:** 2026-05-07
**Commit:** `3d72f7c`
**Status:** HOTOVO

## Změny

### Tier 1: Odebrání "use client" z wrapper pages (8 stránek)

Všech 8 stránek jsou tenké wrappery — importují client component (VinStep, ContactStep, ...) + StepPageGuard a renderují je. `"use client"` bylo zbytečné, protože importované komponenty JIŽ MAJÍ vlastní `"use client"` direktivu.

| Soubor | Změna |
|--------|-------|
| `(pwa)/makler/vehicles/new/vin/page.tsx` | Odebrán `"use client"` |
| `(pwa)/makler/vehicles/new/contact/page.tsx` | Odebrán `"use client"` |
| `(pwa)/makler/vehicles/new/inspection/page.tsx` | Odebrán `"use client"` |
| `(pwa)/makler/vehicles/new/photos/page.tsx` | Odebrán `"use client"` |
| `(pwa)/makler/vehicles/new/details/page.tsx` | Odebrán `"use client"` |
| `(pwa)/makler/vehicles/new/pricing/page.tsx` | Odebrán `"use client"` |
| `(pwa)/makler/vehicles/new/equipment/page.tsx` | Odebrán `"use client"` |
| `(pwa)/makler/vehicles/new/review/page.tsx` | Odebrán `"use client"` |

### Tier 2: searchParams konverze — success pages (2 stránky)

| Soubor | Změna |
|--------|-------|
| `(pwa)/makler/vehicles/new/success/page.tsx` | `useSearchParams()` → `searchParams: Promise<Record<string, string>>` prop, async page |
| `(pwa)/makler/vehicles/quick/success/page.tsx` | `useSearchParams()` → `searchParams: Promise<Record<string, string>>` prop, async page |

### Klíčové technické detaily
- **Tier 1:** Pouze odebrání `"use client"` — žádná změna logiky, importů ani JSX
- **Tier 2:** Next.js 15 `searchParams` je `Promise` — musí se `await`
- **SuccessView:** Client component zachován beze změny (`offline`, `vehicleId` props)
- **Quick success:** Celé JSX inline v page (Card, Button, Link) — vše kompatibilní se SSR

### Poznámka k Fázi 6
Všech 5 stránek z plánu Fáze 6 již bylo dříve migrováno na SSR:
- `shop/objednavky/sledovani/[token]` — již SSR s Prisma query
- `muj-ucet/profil/setup` — již SSR wrapper s ProfileSetupWizard
- `prezentace` — již SSR wrapper s PrezentacePage
- `admin/team` — již SSR s Prisma pre-fetch + TeamManager
- `admin/reviews` — již SSR s Prisma pre-fetch + ReviewsManager

## Statistiky
- **10 souborů změněno**
- **15 insertions, 29 deletions**
- **0 nových souborů**

## Ověření
- **Build:** OK (0 errors)
- **Lint:** OK (0 errors, 691 warnings)
