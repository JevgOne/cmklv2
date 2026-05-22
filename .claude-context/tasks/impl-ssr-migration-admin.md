# IMPL: SSR migrace — Admin panel (12 stránek)

**Status:** HOTOVO
**Datum:** 2026-05-08
**Build:** `npm run build` — 0 chyb

## Přehled

Migrace 12 admin stránek z `"use client"` na Server Components s SSR Prisma data fetching.

**Pattern:**
1. Odebráno `"use client"` z page.tsx
2. Přidáno `export const metadata` + `export const dynamic = "force-dynamic"`
3. `getServerSession(authOptions)` + role check → `redirect("/login")`
4. Prisma query pro initial data (kopie z příslušného API route)
5. Serializace Date objektů (`.toISOString()` nebo `JSON.parse(JSON.stringify(...))`)
6. Render client island komponenty s `initialData` props

## Migrované stránky

| # | Stránka | SSR page.tsx | Client component | Prisma query |
|---|---------|-------------|-------------------|-------------|
| 1 | `/admin/users` | ✅ | `AdminUsersContent` | `user.findMany` (select, take:100) |
| 2 | `/admin/orders` | ✅ | `AdminOrdersContent` | `order.findMany` (include items/buyer/subOrders) |
| 3 | `/admin/parts` | ✅ | `AdminPartsContent` | `part.findMany` + `count` (paginated, limit:20) |
| 4 | `/admin/suppliers` | ✅ | `AdminSuppliersContent` | `user.findMany` + payoutAggregation + stats |
| 5 | `/admin/returns` | ✅ | `AdminReturnsContent` | `returnRequest.findMany` + `count` (paginated) |
| 6 | `/admin/returns/[id]` | ✅ | `AdminReturnDetailContent` | `returnRequest.findUnique` (include order+items) |
| 7 | `/admin/feeds` | ✅ | `AdminFeedsContent` | `partsFeedConfig.findMany` (include supplier/_count) |
| 8 | `/admin/feeds/[id]` | ✅ | `AdminFeedDetailContent` | `partsFeedConfig.findUnique` (include logs) |
| 9 | `/admin/feeds/new` | ✅ | `AdminNewFeedForm` | `user.findMany` (active suppliers) |
| 10 | `/admin/vehicles/new` | ✅ | `AdminNewVehicleForm` | žádný (pure form) |
| 11 | `/admin/marketplace/[id]` | ✅ | `AdminFlipDetailContent` | `flipOpportunity.findUnique` + investments |
| 12 | `/admin/marketplace/applications/[id]` | ✅ | `AdminApplicationDetailContent` | `marketplaceApplication.findUnique` |

## Auth role checks

| Stránky | Povolené role |
|---------|--------------|
| users, orders, parts, suppliers, returns, returns/[id], feeds, feeds/[id], feeds/new, vehicles/new | ADMIN, BACKOFFICE, MANAGER |
| marketplace/[id], applications/[id] | ADMIN, BACKOFFICE |

## Vytvořené soubory (12 client components)

```
components/admin/AdminUsersContent.tsx
components/admin/AdminOrdersContent.tsx
components/admin/AdminPartsContent.tsx
components/admin/AdminSuppliersContent.tsx
components/admin/AdminReturnsContent.tsx
components/admin/AdminReturnDetailContent.tsx
components/admin/AdminFeedsContent.tsx
components/admin/AdminFeedDetailContent.tsx
components/admin/AdminNewFeedForm.tsx
components/admin/AdminNewVehicleForm.tsx
components/admin/AdminFlipDetailContent.tsx
components/admin/AdminApplicationDetailContent.tsx
```

## Modifikované soubory (12 page.tsx)

```
app/(admin)/admin/users/page.tsx
app/(admin)/admin/orders/page.tsx
app/(admin)/admin/parts/page.tsx
app/(admin)/admin/suppliers/page.tsx
app/(admin)/admin/returns/page.tsx
app/(admin)/admin/returns/[id]/page.tsx
app/(admin)/admin/feeds/page.tsx
app/(admin)/admin/feeds/[id]/page.tsx
app/(admin)/admin/feeds/new/page.tsx
app/(admin)/admin/vehicles/new/page.tsx
app/(admin)/admin/marketplace/[id]/page.tsx
app/(admin)/admin/marketplace/applications/[id]/page.tsx
```

## Poznámky

- Detail pages (`[id]`) používají `notFound()` místo client-side 404 stavu
- Paginated pages (parts, suppliers, returns) načítají první stránku na serveru, client component dále paginuje přes API
- `AdminNewVehicleForm` nepotřebuje SSR data — je to pure form s VIN decode
- Date serializace: jednoduché stránky používají `.toISOString()`, komplexní (s nested dates) používají `JSON.parse(JSON.stringify(...))`
- Marketplace flip detail agreguje investory a platby přímo v SSR (místo 2 API callů na klientu)
