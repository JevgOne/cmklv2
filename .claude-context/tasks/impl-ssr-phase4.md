# IMPL: SSR migrace Fáze 4 — Eshop formuláře (5 stránek)

**Datum:** 2026-05-07
**Commit:** `11abcb3`
**Status:** HOTOVO

## Změny

### Nové client components (components/web/)
| Soubor | Export | Důvod client |
|--------|--------|-------------|
| `WatchdogManager.tsx` | `WatchdogManager` | CRUD (create/toggle/delete) + Modal + form state |
| `ClaimForm.tsx` | `ClaimForm` | File upload (Cloudinary) + checkbox selection + form state + useRouter |
| `ReturnForm.tsx` | `ReturnForm` | Checkbox selection + form state + daysLeft countdown + useRouter |

### Migrované stránky
| Soubor | Typ | Změny |
|--------|-----|-------|
| `(web)/shop/objednavka/potvrzeni/page.tsx` | Page → SSR (100%) | Odebráno "use client", useSearchParams. Přidán `searchParams: Promise<{}>` (Next.js 15). `window.location.origin` → `process.env.NEXT_PUBLIC_BASE_URL`. Žádný nový soubor. |
| `(web)/dily/objednavka/potvrzeni/page.tsx` | Page → SSR (100%) | Identický pattern jako shop verze. Linky na `/dily/moje-objednavky` a `/dily`. Žádný nový soubor. |
| `(web)/muj-ucet/hlidaci-pes/page.tsx` | Page → SSR | Odebráno "use client", useState, useEffect, fetch. Prisma `watchdog.findMany` s date serializací. Data předány do WatchdogManager. |
| `(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` | Page → SSR | Odebráno "use client", use(params), useEffect fetch. Auth + Prisma `order.findFirst` s items+part. Status check `!== "DELIVERED"` na serveru (SSR rendered error). Data předány do ClaimForm. |
| `(web)/shop/moje-objednavky/[id]/vraceni/page.tsx` | Page → SSR | Odebráno "use client", use(params), useEffect fetch. Auth + Prisma `order.findFirst` s `status: "DELIVERED"` filter. `deliveredAt` serializace `.toISOString()`. Data předány do ReturnForm. |

### Klíčové technické detaily
- **Auth pattern:** `getServerSession(authOptions)` + `redirect("/login")` na 3 chráněných stránkách
- **searchParams (Next.js 15):** `searchParams: Promise<{}>` + `await searchParams` na 2 potvrzovacích stránkách
- **await params:** `params: Promise<{ id: string }>` + `await params` na reklamace + vrácení
- **Date serializace:** `createdAt.toISOString()` (watchdogs), `deliveredAt?.toISOString() ?? null` (orders)
- **window.location.origin → env:** `process.env.NEXT_PUBLIC_BASE_URL ?? ""` na obou potvrzovacích stránkách
- **Server-side status check:** Reklamace: `notFound()` + inline SSR error pro non-DELIVERED. Vrácení: query filtruje `status: "DELIVERED"` přímo v Prisma where clause.
- **Re-fetch po mutacích:** WatchdogManager zachovává `fetchWatchdogs()` pro refresh po create/delete
- **File upload:** ClaimForm zachovává Cloudinary upload flow (100% client-side)
- **daysLeft výpočet:** ReturnForm počítá z `order.deliveredAt` (ISO string from server)

## Stránky BEZ ZMĚNY (dle plánu)
- `shop/kosik` — localStorage cart, zůstává client
- `dily/kosik` — localStorage cart, zůstává client
- `shop/objednavka` — localStorage cart + multi-step wizard, zůstává client
- `dily/objednavka` — localStorage cart + rezervační systém + timer, zůstává client
- `inzerce/registrace` — čistý formulář, žádný server data fetch, zůstává client
- `inzerce/pridat` — už je SSR, žádná práce

## Statistiky
- **8 souborů změněno** (5 page.tsx + 3 nových client components)
- **942 insertions, 892 deletions**
- **3 nové client island soubory**
- **2 stránky 100% SSR** (potvrzení — žádný client component)

## Ověření
- **Build:** OK (0 errors, compiled in 23.7s)
- **Lint:** OK (0 errors, 685 pre-existing warnings)
