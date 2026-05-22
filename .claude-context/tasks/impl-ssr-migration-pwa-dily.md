# IMPL: SSR migrace — PWA Díly (8 stránek)

**Status:** HOTOVO
**Datum:** 2026-05-08
**Build:** `npm run build` — 0 chyb

## Přehled

Migrace 8 PWA Díly stránek z `"use client"` na Server Components s SSR Prisma data fetching.

**Pattern:**
1. Odebráno `"use client"` z page.tsx
2. Přidáno `export const metadata` + `export const dynamic = "force-dynamic"`
3. `getServerSession(authOptions)` + role check → `redirect("/login")`
4. Prisma query pro initial data (kopie z příslušného API route)
5. Serializace Date objektů (`JSON.parse(JSON.stringify(...))` pro nested dates)
6. Render client island komponenty s `initialData` props
7. PD4 a PD5 (donors list/detail) migrovány jako **full RSC** — žádný client component

## Migrované stránky

| # | Stránka | SSR page.tsx | Client component | Prisma query |
|---|---------|-------------|-------------------|-------------|
| PD1 | `/parts/my` | ✅ | `MyPartsClient` | `part.findMany` + 4× `count` (status tabs) |
| PD2 | `/parts/orders` | ✅ | `SupplierOrdersClient` | `subOrder.findMany` (include order/items/part) |
| PD3 | `/parts/orders/[id]` | ✅ | `SupplierOrderDetailClient` | `subOrder.findUnique` (include order+buyer+items) |
| PD4 | `/parts/donors` | ✅ Full RSC | — | `donorVehicle.findMany` (take:12) |
| PD5 | `/parts/donors/[id]` | ✅ Full RSC | — | `donorVehicle.findUnique` (include parts+images) |
| PD6 | `/parts/[id]` | ✅ | `PartDetailClient` | `part.findFirst` (OR id/slug, include images+supplier) |
| PD7 | `/parts/[id]/edit` | ✅ | `PartEditClient` | `part.findUnique` (select form fields + images) |
| PD8 | `/parts/profile` | ✅ | `SupplierProfileClient` | `partner.findUnique` (where userId) |

## Auth role checks

| Stránky | Povolené role |
|---------|--------------|
| PD1 (my), PD6 (detail), PD7 (edit) | PARTS_SUPPLIER, WHOLESALE_SUPPLIER, PARTNER_VRAKOVISTE, ADMIN, BACKOFFICE |
| PD2 (orders), PD3 (order detail), PD8 (profile) | Any logged-in user (session.user.id) |
| PD4 (donors), PD5 (donor detail) | PARTS_SUPPLIER, ADMIN, BACKOFFICE |

## Vytvořené soubory (6 client components)

```
components/pwa-parts/parts/MyPartsClient.tsx
components/pwa-parts/orders/SupplierOrdersClient.tsx
components/pwa-parts/orders/SupplierOrderDetailClient.tsx
components/pwa-parts/parts/PartDetailClient.tsx
components/pwa-parts/parts/PartEditClient.tsx
components/pwa-parts/profile/SupplierProfileClient.tsx
```

## Modifikované soubory (8 page.tsx)

```
app/(pwa-parts)/parts/my/page.tsx
app/(pwa-parts)/parts/orders/page.tsx
app/(pwa-parts)/parts/orders/[id]/page.tsx
app/(pwa-parts)/parts/donors/page.tsx
app/(pwa-parts)/parts/donors/[id]/page.tsx
app/(pwa-parts)/parts/[id]/page.tsx
app/(pwa-parts)/parts/[id]/edit/page.tsx
app/(pwa-parts)/parts/profile/page.tsx
```

## Poznámky

- **PD4 + PD5 jsou full RSC** — read-only stránky bez interaktivity, nepotřebují client component
- Detail pages (`[id]`) používají `notFound()` místo client-side 404 stavu
- PD1 (my parts) — client component používá `useRef` pro skip initial fetch (SSR data pro "all" tab)
- PD2 (orders) — client-side tab filtering (všechna data načtena na serveru, filtrováno na klientu)
- PD3 (order detail) — `fetchOrder` callback zůstává pro refresh po status change / shipped
- PD5 (donor detail) — ownership check: PARTS_SUPPLIER vidí jen svá auta, ADMIN/BACKOFFICE vše
- PD6 (part detail) — SSR NEinkrementuje viewCount (to dělá jen public shop API)
- PD7 (edit) — ownership check na serveru, raw part data předána client componentu pro wizard form
- PD8 (profile) — `useSession` nahrazen SSR session.user, `userName` předán jako prop
- Date serializace: pages s nested dates (orders) používají `JSON.parse(JSON.stringify(...))`
