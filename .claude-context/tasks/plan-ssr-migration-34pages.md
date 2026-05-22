# PLÁN: SSR migrace 34 stránek (use client → Server Components)

**Datum:** 2026-05-08
**Základ:** audit-use-client-directives.md
**Referenční vzor:** `app/(web)/marketplace/deals/[id]/page.tsx` + `app/(admin)/admin/dashboard/page.tsx` (již migrované na SSR)

---

## Architektura migrace

### Pattern pro každou stránku:

```
PŘED:                                    PO:
page.tsx ("use client")                  page.tsx (Server Component)
  └─ useEffect → fetch('/api/...')         ├─ getServerSession(authOptions)
  └─ useState → data                      ├─ prisma.xxx.findMany(...)
  └─ JSX (mix data + interakce)           └─ <PageClient data={data} />
                                         
                                         PageClient.tsx ("use client")
                                           └─ useState (tabs, pagination, actions)
                                           └─ JSX (interaktivní prvky)
```

### Společné importy (server page.tsx):
```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
```

### Společné importy (odebrat z page.tsx):
```tsx
// ODEBRAT:
"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
```

### Auth pattern:
```tsx
const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

const session = await getServerSession(authOptions);
if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
  redirect("/login");
}
```

### Params pattern (Next.js 15):
```tsx
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { id } = await params;
  const { page = "1", status } = await searchParams;
```

---

## FÁZE 1: Partner portál (11 stránek)

### P1. `app/(partner)/partner/dashboard/page.tsx`

**API endpoint:** `GET /api/partner/dashboard`
**Soubor API:** `app/api/partner/dashboard/route.ts`

**Prisma query (zkopírovat z API route):**
```tsx
const partner = await prisma.partner.findUnique({
  where: { userId: session.user.id },
});
if (!partner) redirect("/partner/onboarding");

const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

if (session.user.role === "PARTNER_BAZAR") {
  const [totalVehicles, activeVehicles, leadsThisMonth, soldVehicles] =
    await Promise.all([
      prisma.vehicle.count({ where: { brokerId: session.user.id } }),
      prisma.vehicle.count({ where: { brokerId: session.user.id, status: "ACTIVE" } }),
      prisma.partnerLead.count({ where: { partnerId: partner.id, createdAt: { gte: monthStart } } }),
      prisma.vehicle.count({ where: { brokerId: session.user.id, status: "SOLD" } }),
    ]);
  const recentLeads = await prisma.partnerLead.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  // pass as props
} else {
  const [totalParts, activeParts, ordersThisMonth] = await Promise.all([
    prisma.part.count({ where: { supplierId: session.user.id } }),
    prisma.part.count({ where: { supplierId: session.user.id, status: "ACTIVE" } }),
    prisma.orderItem.count({ where: { supplierId: session.user.id, createdAt: { gte: monthStart } } }),
  ]);
  // pass as props
}
```

**Interaktivní části:** Žádné — stránka je read-only. Celá může být RSC.
**Client sub-component:** NEPOTŘEBA (jen `Button` jako `Link`, `StatCard` = presentační).
**Auth:** `PARTNER_BAZAR` | `PARTNER_VRAKOVISTE`
**Složitost:** NÍZKÁ

---

### P2. `app/(partner)/partner/orders/page.tsx`

**API endpoint:** `GET /api/orders?role=supplier&page={page}`
**Soubor API:** `app/api/orders/route.ts` (sdílený)

**Prisma query:**
```tsx
const { page: pageStr } = await searchParams;
const page = Math.max(1, parseInt(pageStr || "1", 10));
const limit = 20;
const skip = (page - 1) * limit;

const [orders, total] = await Promise.all([
  prisma.subOrder.findMany({
    where: { supplierId: session.user.id },
    include: {
      items: { include: { part: { select: { name: true, slug: true } } } },
      order: { select: { orderNumber: true, deliveryName: true, createdAt: true, status: true, totalPrice: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  }),
  prisma.subOrder.count({ where: { supplierId: session.user.id } }),
]);
```

**Interaktivní části:** `Pagination` (onPageChange).
**Client sub-component:** `PartnerOrdersClient.tsx` — přijme `orders`, `total`, `totalPages`, `currentPage`. Klient řeší jen pagination (URL-based nebo state).
**Alternativa:** Pagination přes URL `searchParams` → celé RSC (nejlepší).
**Auth:** `PARTNER_BAZAR` | `PARTNER_VRAKOVISTE`
**Složitost:** NÍZKÁ

---

### P3. `app/(partner)/partner/orders/[id]/page.tsx`

**API endpoint:** `GET /api/orders/{id}`
**Interaktivní akce:** `PUT /api/orders/{id}/status`, `POST /api/partner/orders/{id}/pdf`

**Prisma query (initial load):**
```tsx
const { id } = await params;
const order = await prisma.subOrder.findFirst({
  where: { id, supplierId: session.user.id },
  include: {
    items: { include: { part: { select: { name: true, slug: true, images: { take: 1 } } } } },
    order: {
      select: {
        orderNumber: true, totalPrice: true, shippingPrice: true,
        deliveryMethod: true, deliveryName: true, deliveryEmail: true,
        deliveryPhone: true, deliveryStreet: true, deliveryCity: true,
        deliveryZip: true, trackingNumber: true, paymentMethod: true,
        paymentStatus: true, createdAt: true, status: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    },
  },
});
if (!order) notFound();
```

**Interaktivní části:** Status change buttons, tracking input, PDF download.
**Client sub-component:** `PartnerOrderDetailClient.tsx` — přijme `order` jako prop. Řeší status actions, tracking input, PDF download.
**Auth:** `PARTNER_BAZAR` | `PARTNER_VRAKOVISTE`
**Složitost:** STŘEDNÍ (hybrid: SSR load + client actions)

---

### P4. `app/(partner)/partner/stats/page.tsx`

**API endpoints:** `GET /api/partner/stats` + `GET /api/partner/stats/charts?months=6`

**Prisma query (stats):**
```tsx
const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
if (!partner) redirect("/partner/onboarding");

if (session.user.role === "PARTNER_BAZAR") {
  const [totalVehicles, activeVehicles, soldVehicles, totalLeads, totalViews] =
    await Promise.all([
      prisma.vehicle.count({ where: { brokerId: session.user.id } }),
      prisma.vehicle.count({ where: { brokerId: session.user.id, status: "ACTIVE" } }),
      prisma.vehicle.count({ where: { brokerId: session.user.id, status: "SOLD" } }),
      prisma.partnerLead.count({ where: { partnerId: partner.id } }),
      prisma.vehicle.aggregate({ where: { brokerId: session.user.id }, _sum: { viewCount: true } }),
    ]);
  // + charts $queryRaw (zkopírovat z api/partner/stats/charts/route.ts)
}
```

**Interaktivní části:** `RevenueChart` a `OrdersChart` (client — canvas/SVG).
**Client sub-component:** `PartnerStatsClient.tsx` — přijme `stats`, `chartData`, `isBazar`. Charts zůstanou client.
**Auth:** `PARTNER_BAZAR` | `PARTNER_VRAKOVISTE`
**Složitost:** STŘEDNÍ (raw SQL pro charts)

---

### P5. `app/(partner)/partner/billing/page.tsx`

**API endpoint:** `GET /api/partner/billing`

**Prisma query:**
```tsx
const orderItems = await prisma.orderItem.findMany({
  where: { supplierId: session.user.id, order: { status: "DELIVERED" } },
  include: {
    part: { select: { name: true } },
    order: { select: { id: true, status: true, createdAt: true } },
  },
  orderBy: { createdAt: "desc" },
});
const totalRevenue = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
const carmaklerCommission = Math.round(totalRevenue * 0.15);
const partnerPayout = totalRevenue - carmaklerCommission;
```

**Interaktivní části:** Žádné — read-only tabulka.
**Client sub-component:** NEPOTŘEBA — celé RSC.
**Auth:** `PARTNER_VRAKOVISTE`
**Složitost:** NÍZKÁ

---

### P6. `app/(partner)/partner/leads/page.tsx`

**API endpoint:** `GET /api/partner/leads?status={s}&page={p}`
**Mutation:** `PATCH /api/partner/leads/{id}` (status change)

**Prisma query:**
```tsx
const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
const { page: pageStr, status } = await searchParams;
const page = Math.max(1, parseInt(pageStr || "1", 10));
const where: Record<string, unknown> = { partnerId: partner!.id };
if (status) where.status = status;

const [leads, total] = await Promise.all([
  prisma.partnerLead.findMany({
    where,
    include: { vehicle: { select: { id: true, brand: true, model: true, year: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 20,
    take: 20,
  }),
  prisma.partnerLead.count({ where }),
]);
```

**Interaktivní části:** Tabs (status filter), Pagination, lead status select (PATCH).
**Client sub-component:** `PartnerLeadsClient.tsx` — přijme `initialLeads`, `total`, `totalPages`. Řeší tabs (URL-based), pagination (URL-based), status update (fetch PATCH).
**Auth:** `PARTNER_BAZAR` | `PARTNER_VRAKOVISTE`
**Složitost:** STŘEDNÍ

---

### P7. `app/(partner)/partner/vehicles/page.tsx`

**API endpoint:** `GET /api/partner/vehicles?status={s}&page={p}&q={search}`

**Prisma query:**
```tsx
const { page: pageStr, status, q } = await searchParams;
const page = Math.max(1, parseInt(pageStr || "1", 10));
const where: Record<string, unknown> = { brokerId: session.user.id };
if (status) where.status = status;
if (q && q.length >= 2) {
  where.OR = [
    { brand: { contains: q, mode: "insensitive" } },
    { model: { contains: q, mode: "insensitive" } },
    { vin: { contains: q } },
  ];
}
const [vehicles, total] = await Promise.all([
  prisma.vehicle.findMany({
    where,
    include: { images: { where: { isPrimary: true }, take: 1 }, _count: { select: { inquiries: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 20,
    take: 20,
  }),
  prisma.vehicle.count({ where }),
]);
```

**Interaktivní části:** Tabs, Pagination, Search (debounce).
**Client sub-component:** `PartnerVehiclesClient.tsx` — tabs/search/pagination. Search s debounce musí zůstat client (nebo URL-based).
**Auth:** `PARTNER_BAZAR`
**Složitost:** STŘEDNÍ

---

### P8. `app/(partner)/partner/vehicles/[id]/page.tsx`

**API endpoint:** `GET /api/partner/vehicles/{id}` (neexistuje explicitně, pravděpodobně sdílený)
**Mutations:** `PUT` (edit), `PATCH` (archive/status)

**Prisma query:**
```tsx
const { id } = await params;
const vehicle = await prisma.vehicle.findFirst({
  where: { id, brokerId: session.user.id },
  include: {
    images: { orderBy: { order: "asc" } },
    _count: { select: { inquiries: true } },
  },
});
if (!vehicle) notFound();
```

**Interaktivní části:** Edit form (price, mileage, description, city, photos), archive button, image carousel.
**Client sub-component:** `PartnerVehicleDetailClient.tsx` — přijme `vehicle`. Řeší edit mode, save, archive, photo gallery.
**Auth:** `PARTNER_BAZAR`
**Složitost:** VYSOKÁ (mnoho edit states)

---

### P9. `app/(partner)/partner/parts/page.tsx`

**API endpoint:** `GET /api/partner/parts?page={p}&q={search}`

**Prisma query:**
```tsx
const { page: pageStr, q } = await searchParams;
const page = Math.max(1, parseInt(pageStr || "1", 10));
const where: Record<string, unknown> = { supplierId: session.user.id };
if (q && q.length >= 2) {
  where.OR = [
    { name: { contains: q, mode: "insensitive" } },
    { oemNumber: { contains: q, mode: "insensitive" } },
    { category: { contains: q, mode: "insensitive" } },
  ];
}
const [parts, total] = await Promise.all([
  prisma.part.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 20,
    take: 20,
  }),
  prisma.part.count({ where }),
]);
```

**Interaktivní části:** Pagination, Search.
**Client sub-component:** `PartnerPartsClient.tsx`
**Auth:** `PARTNER_VRAKOVISTE`
**Složitost:** STŘEDNÍ

---

### P10. `app/(partner)/partner/parts/[id]/page.tsx`

**API endpoint:** Shared parts API
**Mutations:** `PUT /api/partner/parts/{id}`, `DELETE`

**Prisma query:**
```tsx
const { id } = await params;
const part = await prisma.part.findFirst({
  where: { id, supplierId: session.user.id },
  include: { images: { orderBy: { order: "asc" } } },
});
if (!part) notFound();
```

**Interaktivní části:** Edit form, delete dialog, photo upload, image carousel.
**Client sub-component:** `PartnerPartDetailClient.tsx`
**Auth:** `PARTNER_VRAKOVISTE`
**Složitost:** VYSOKÁ

---

### P11. `app/(partner)/partner/profile/page.tsx`

**API endpoint:** `GET /api/partner/profile`, `PUT /api/partner/profile`

**Prisma query (load):**
```tsx
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: {
    firstName: true, lastName: true, email: true, phone: true,
    companyName: true, ico: true, dic: true, description: true,
    address: true, web: true, openingHours: true, role: true,
  },
});
```

**Interaktivní části:** Celý formulář je editovatelný (save button, inputs).
**Client sub-component:** `PartnerProfileClient.tsx` — přijme `initialProfile`, `isBazar`.
**Auth:** `PARTNER_BAZAR` | `PARTNER_VRAKOVISTE`
**Složitost:** STŘEDNÍ

---

## FÁZE 2: Admin panel (12 stránek)

### Společný auth pattern pro admin:
```tsx
const ADMIN_ROLES = ["ADMIN", "BACKOFFICE"];
const session = await getServerSession(authOptions);
if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
  redirect("/login");
}
```

### A1. `app/(admin)/admin/users/page.tsx`
**API:** `GET /api/admin/users`
**Prisma:** `prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 })`
**Interaktivní:** Role change dropdown, search, pagination.
**Client:** `AdminUsersClient.tsx`
**Složitost:** STŘEDNÍ

### A2. `app/(admin)/admin/orders/page.tsx`
**API:** `GET /api/admin/orders`
**Prisma:** `prisma.order.findMany({ include: { items: true, user: { select: { firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: "desc" } })`
**Interaktivní:** Status filter, pagination, status actions.
**Client:** `AdminOrdersClient.tsx`
**Složitost:** STŘEDNÍ

### A3. `app/(admin)/admin/parts/page.tsx`
**API:** `GET /api/admin/parts` + `GET /api/admin/suppliers?limit=100` (pro filtr)
**Prisma:**
```tsx
const [parts, total, suppliers] = await Promise.all([
  prisma.part.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
  prisma.part.count(),
  prisma.user.findMany({ where: { role: "PARTS_SUPPLIER" }, select: { id: true, firstName: true, lastName: true, companyName: true } }),
]);
```
**Interaktivní:** Supplier filter, search, pagination, status toggle.
**Client:** `AdminPartsClient.tsx`
**Složitost:** STŘEDNÍ

### A4. `app/(admin)/admin/suppliers/page.tsx`
**API:** `GET /api/admin/suppliers`
**Prisma:** `prisma.user.findMany({ where: { role: { in: ["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "WHOLESALE_SUPPLIER"] } }, orderBy: { createdAt: "desc" } })`
**Interaktivní:** Search, pagination.
**Client:** `AdminSuppliersClient.tsx`
**Složitost:** NÍZKÁ

### A5. `app/(admin)/admin/returns/page.tsx`
**API:** `GET /api/admin/returns`
**Prisma:** `prisma.return.findMany({ include: { order: true, user: true }, orderBy: { createdAt: "desc" } })`
**Interaktivní:** Type/status filter tabs, pagination.
**Client:** `AdminReturnsClient.tsx`
**Složitost:** NÍZKÁ

### A6. `app/(admin)/admin/returns/[id]/page.tsx`
**API:** `GET /api/admin/returns/{id}`, `PUT /api/admin/returns/{id}`
**Prisma:** `prisma.return.findUnique({ where: { id }, include: { order: { include: { items: true } }, user: true } })`
**Interaktivní:** Status change, resolution note, refund actions.
**Client:** `AdminReturnDetailClient.tsx`
**Složitost:** STŘEDNÍ

### A7. `app/(admin)/admin/feeds/page.tsx`
**API:** `GET /api/admin/feeds`
**Prisma:** `prisma.partsFeed.findMany({ include: { supplier: { select: { firstName: true, lastName: true, companyName: true } } }, orderBy: { createdAt: "desc" } })`
**Interaktivní:** Status toggle, delete.
**Client:** `AdminFeedsClient.tsx`
**Složitost:** NÍZKÁ

### A8. `app/(admin)/admin/feeds/[id]/page.tsx`
**API:** `GET /api/admin/feeds/{id}`
**Prisma:** `prisma.partsFeed.findUnique({ where: { id }, include: { supplier: true, runs: { orderBy: { startedAt: "desc" }, take: 20 } } })`
**Interaktivní:** Edit form, run trigger, delete.
**Client:** `AdminFeedDetailClient.tsx`
**Složitost:** STŘEDNÍ

### A9. `app/(admin)/admin/feeds/new/page.tsx`
**API:** `GET /api/admin/feeds/suppliers`, `POST /api/admin/feeds`
**Prisma (suppliers load):** `prisma.user.findMany({ where: { role: { in: ["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE"] } }, select: { id: true, firstName: true, lastName: true, companyName: true } })`
**Interaktivní:** Formulář s validací, supplier select.
**Client:** `AdminFeedNewClient.tsx` — přijme `suppliers` list.
**Složitost:** STŘEDNÍ

### A10. `app/(admin)/admin/marketplace/[id]/page.tsx`
**API:** `GET /api/marketplace/opportunities/{id}`, `GET /api/marketplace/investments`
**Prisma:**
```tsx
const opp = await prisma.flipOpportunity.findUnique({
  where: { id },
  include: {
    dealer: { select: { id: true, firstName: true, lastName: true, companyName: true } },
    investments: { include: { investor: { select: { firstName: true, lastName: true } } } },
  },
});
```
**Interaktivní:** Approve, payout actions, FlipTimeline, ProfitCalculator.
**Client:** `AdminMarketplaceDetailClient.tsx`
**Složitost:** VYSOKÁ

### A11. `app/(admin)/admin/marketplace/applications/[id]/page.tsx`
**API:** `GET /api/admin/marketplace/applications/{id}`, `PUT /api/admin/marketplace/applications/{id}`
**Prisma:** `prisma.marketplaceApplication.findUnique({ where: { id } })`
**Interaktivní:** Approve/reject buttons, notes.
**Client:** `AdminApplicationDetailClient.tsx`
**Složitost:** STŘEDNÍ

### A12. `app/(admin)/admin/vehicles/new/page.tsx`
**Pozn.:** Tato stránka je formulář s komplexním state (brand/model/year selectors, statický CAR_BRANDS objekt). **NE** fetchuje data z API.
**Akce:** ✅ PŘESKOČIT — oprávněné "use client" (form wizard). Uvedeno v auditu jako oprávněné, ale bylo v seznamu 13 admin stránek. **Skutečný počet k migraci: 11.**

---

## FÁZE 3: PWA Díly (8 stránek)

### Společný auth:
```tsx
const session = await getServerSession(authOptions);
if (!session?.user || session.user.role !== "PARTS_SUPPLIER") {
  redirect("/login");
}
```

### PD1. `app/(pwa-parts)/parts/my/page.tsx`
**API:** `GET /api/parts/my?status={s}`
**Prisma:** `prisma.part.findMany({ where: { supplierId: session.user.id, ...(status ? { status } : {}) }, orderBy: { createdAt: "desc" } })`
**Interaktivní:** Status filter, search.
**Client:** `MyPartsClient.tsx`
**Složitost:** NÍZKÁ

### PD2. `app/(pwa-parts)/parts/orders/page.tsx`
**API:** `GET /api/orders?role=supplier`
**Prisma:** `prisma.subOrder.findMany({ where: { supplierId: session.user.id }, include: { items: { include: { part: true } }, order: true }, orderBy: { createdAt: "desc" } })`
**Interaktivní:** Tabs (status filter).
**Client:** `SupplierOrdersClient.tsx`
**Složitost:** NÍZKÁ

### PD3. `app/(pwa-parts)/parts/orders/[id]/page.tsx`
**API:** `GET /api/suborders/{id}`, `PUT /api/suborders/{id}/status`
**Prisma:** `prisma.subOrder.findFirst({ where: { id, supplierId: session.user.id }, include: { items: { include: { part: true } }, order: { include: { user: true } } } })`
**Interaktivní:** Status change buttons (confirm, ship, deliver).
**Client:** `SupplierOrderDetailClient.tsx`
**Složitost:** STŘEDNÍ

### PD4. `app/(pwa-parts)/parts/donors/page.tsx`
**API:** `GET /api/donor-vehicles`
**Prisma:** `prisma.donorVehicle.findMany({ where: { supplierId: session.user.id }, include: { _count: { select: { parts: true } } }, orderBy: { createdAt: "desc" } })`
**Interaktivní:** Žádné (jen list + links).
**Client:** NEPOTŘEBA — celé RSC.
**Složitost:** NÍZKÁ

### PD5. `app/(pwa-parts)/parts/donors/[id]/page.tsx`
**API:** `GET /api/donor-vehicles/{id}`
**Prisma:** `prisma.donorVehicle.findFirst({ where: { id, supplierId: session.user.id }, include: { parts: { include: { images: { take: 1 } } } } })`
**Interaktivní:** Možné akce (delete, edit).
**Client:** Ověřit obsah — pokud jen read-only, celé RSC.
**Složitost:** NÍZKÁ

### PD6. `app/(pwa-parts)/parts/[id]/page.tsx`
**API:** `GET /api/parts/{id}`
**Prisma:** `prisma.part.findFirst({ where: { id, supplierId: session.user.id }, include: { images: true, supplier: { select: { firstName: true, lastName: true } } } })`
**Interaktivní:** Delete, status toggle.
**Client:** `PartDetailClient.tsx`
**Složitost:** NÍZKÁ

### PD7. `app/(pwa-parts)/parts/[id]/edit/page.tsx`
**API:** `GET /api/parts/{id}` (load), `PUT /api/parts/{id}` (save)
**Prisma (load):** `prisma.part.findFirst({ where: { id, supplierId: session.user.id }, include: { images: true } })`
**Interaktivní:** Celý edit formulář.
**Client:** `PartEditClient.tsx` — přijme `initialPart`.
**Složitost:** STŘEDNÍ

### PD8. `app/(pwa-parts)/parts/profile/page.tsx`
**API:** `GET /api/partner/profile`, `PUT /api/partner/profile`
**Prisma:** `prisma.user.findUnique({ where: { id: session.user.id }, select: { ... } })`
**Interaktivní:** Profile edit form.
**Client:** `SupplierProfileClient.tsx` — přijme `initialProfile`.
**Složitost:** STŘEDNÍ

---

## FÁZE 4: PWA Makléř (3 stránky)

### Společný auth:
```tsx
const session = await getServerSession(authOptions);
if (!session?.user || session.user.role !== "BROKER") {
  redirect("/login");
}
```

### PM1. `app/(pwa)/makler/leads/page.tsx`
**API:** `GET /api/leads?status={s}&assignedToId=me`
**Prisma:** `prisma.lead.findMany({ where: { assignedToId: session.user.id, ...(status ? { status } : {}) }, orderBy: { createdAt: "desc" } })`
**Interaktivní:** Tabs (status filter), lead cards.
**Client:** `BrokerLeadsClient.tsx`
**Složitost:** NÍZKÁ

### PM2. `app/(pwa)/makler/contacts/page.tsx`
**API:** `GET /api/contacts?brokerId=me&tab={tab}&q={search}`
**Prisma:** `prisma.contact.findMany({ where: { brokerId: session.user.id }, include: { vehicle: true }, orderBy: { updatedAt: "desc" } })`
**Interaktivní:** Tabs, search, add button.
**Client:** `BrokerContactsClient.tsx`
**Složitost:** NÍZKÁ

### PM3. `app/(pwa)/makler/contacts/[id]/page.tsx`
**API:** `GET /api/contacts/{id}`, `PUT /api/contacts/{id}`
**Prisma:** `prisma.contact.findFirst({ where: { id, brokerId: session.user.id }, include: { vehicle: true, communications: { orderBy: { createdAt: "desc" } } } })`
**Interaktivní:** Edit form, communication timeline, add note.
**Client:** `BrokerContactDetailClient.tsx`
**Složitost:** STŘEDNÍ

---

## Souhrnná tabulka — 34 stránek

| # | Soubor | API | Client sub-component | Složitost |
|---|--------|-----|---------------------|-----------|
| **Partner portál** |
| P1 | `(partner)/partner/dashboard/page.tsx` | `/api/partner/dashboard` | Nepotřeba (celé RSC) | NÍZKÁ |
| P2 | `(partner)/partner/orders/page.tsx` | `/api/orders?role=supplier` | `PartnerOrdersClient.tsx` | NÍZKÁ |
| P3 | `(partner)/partner/orders/[id]/page.tsx` | `/api/orders/{id}` | `PartnerOrderDetailClient.tsx` | STŘEDNÍ |
| P4 | `(partner)/partner/stats/page.tsx` | `/api/partner/stats` + `charts` | `PartnerStatsClient.tsx` | STŘEDNÍ |
| P5 | `(partner)/partner/billing/page.tsx` | `/api/partner/billing` | Nepotřeba (celé RSC) | NÍZKÁ |
| P6 | `(partner)/partner/leads/page.tsx` | `/api/partner/leads` | `PartnerLeadsClient.tsx` | STŘEDNÍ |
| P7 | `(partner)/partner/vehicles/page.tsx` | `/api/partner/vehicles` | `PartnerVehiclesClient.tsx` | STŘEDNÍ |
| P8 | `(partner)/partner/vehicles/[id]/page.tsx` | `/api/partner/vehicles/{id}` | `PartnerVehicleDetailClient.tsx` | VYSOKÁ |
| P9 | `(partner)/partner/parts/page.tsx` | `/api/partner/parts` | `PartnerPartsClient.tsx` | STŘEDNÍ |
| P10 | `(partner)/partner/parts/[id]/page.tsx` | `/api/partner/parts/{id}` | `PartnerPartDetailClient.tsx` | VYSOKÁ |
| P11 | `(partner)/partner/profile/page.tsx` | `/api/partner/profile` | `PartnerProfileClient.tsx` | STŘEDNÍ |
| **Admin panel** |
| A1 | `(admin)/admin/users/page.tsx` | `/api/admin/users` | `AdminUsersClient.tsx` | STŘEDNÍ |
| A2 | `(admin)/admin/orders/page.tsx` | `/api/admin/orders` | `AdminOrdersClient.tsx` | STŘEDNÍ |
| A3 | `(admin)/admin/parts/page.tsx` | `/api/admin/parts` | `AdminPartsClient.tsx` | STŘEDNÍ |
| A4 | `(admin)/admin/suppliers/page.tsx` | `/api/admin/suppliers` | `AdminSuppliersClient.tsx` | NÍZKÁ |
| A5 | `(admin)/admin/returns/page.tsx` | `/api/admin/returns` | `AdminReturnsClient.tsx` | NÍZKÁ |
| A6 | `(admin)/admin/returns/[id]/page.tsx` | `/api/admin/returns/{id}` | `AdminReturnDetailClient.tsx` | STŘEDNÍ |
| A7 | `(admin)/admin/feeds/page.tsx` | `/api/admin/feeds` | `AdminFeedsClient.tsx` | NÍZKÁ |
| A8 | `(admin)/admin/feeds/[id]/page.tsx` | `/api/admin/feeds/{id}` | `AdminFeedDetailClient.tsx` | STŘEDNÍ |
| A9 | `(admin)/admin/feeds/new/page.tsx` | `/api/admin/feeds/suppliers` | `AdminFeedNewClient.tsx` | STŘEDNÍ |
| A10 | `(admin)/admin/marketplace/[id]/page.tsx` | `/api/marketplace/opportunities/{id}` | `AdminMarketplaceDetailClient.tsx` | VYSOKÁ |
| A11 | `(admin)/admin/marketplace/applications/[id]/page.tsx` | `/api/admin/marketplace/applications/{id}` | `AdminApplicationDetailClient.tsx` | STŘEDNÍ |
| **PWA Díly** |
| PD1 | `(pwa-parts)/parts/my/page.tsx` | `/api/parts/my` | `MyPartsClient.tsx` | NÍZKÁ |
| PD2 | `(pwa-parts)/parts/orders/page.tsx` | `/api/orders?role=supplier` | `SupplierOrdersClient.tsx` | NÍZKÁ |
| PD3 | `(pwa-parts)/parts/orders/[id]/page.tsx` | `/api/suborders/{id}` | `SupplierOrderDetailClient.tsx` | STŘEDNÍ |
| PD4 | `(pwa-parts)/parts/donors/page.tsx` | `/api/donor-vehicles` | Nepotřeba (celé RSC) | NÍZKÁ |
| PD5 | `(pwa-parts)/parts/donors/[id]/page.tsx` | `/api/donor-vehicles/{id}` | Ověřit | NÍZKÁ |
| PD6 | `(pwa-parts)/parts/[id]/page.tsx` | `/api/parts/{id}` | `PartDetailClient.tsx` | NÍZKÁ |
| PD7 | `(pwa-parts)/parts/[id]/edit/page.tsx` | `/api/parts/{id}` | `PartEditClient.tsx` | STŘEDNÍ |
| PD8 | `(pwa-parts)/parts/profile/page.tsx` | `/api/partner/profile` | `SupplierProfileClient.tsx` | STŘEDNÍ |
| **PWA Makléř** |
| PM1 | `(pwa)/makler/leads/page.tsx` | `/api/leads` | `BrokerLeadsClient.tsx` | NÍZKÁ |
| PM2 | `(pwa)/makler/contacts/page.tsx` | `/api/contacts` | `BrokerContactsClient.tsx` | NÍZKÁ |
| PM3 | `(pwa)/makler/contacts/[id]/page.tsx` | `/api/contacts/{id}` | `BrokerContactDetailClient.tsx` | STŘEDNÍ |

---

## Implementační checklist (pro implementátora)

### Pro každou stránku:

- [ ] 1. Odebrat `"use client"` z `page.tsx`
- [ ] 2. Odebrat importy: `useState`, `useEffect`, `useCallback`, `useSession`, `useParams`, `useRouter` (z next/navigation — `useRouter` smí být v client sub-component)
- [ ] 3. Přidat importy: `getServerSession`, `authOptions`, `prisma`, `redirect`, `notFound`
- [ ] 4. Změnit `export default function` → `export default async function`
- [ ] 5. Přidat `params`/`searchParams` jako async props (Next.js 15 pattern)
- [ ] 6. Auth check → `redirect("/login")` pokud neoprávněný
- [ ] 7. Prisma query (zkopírovat logiku z API route)
- [ ] 8. Vytvořit `*Client.tsx` sub-component pro interaktivní části
- [ ] 9. Předat data jako props z RSC → Client
- [ ] 10. Ověřit build: `npm run build` (žádné chyby)
- [ ] 11. Ověřit runtime: stránka se načítá, data zobrazena správně

### Pořadí implementace v rámci každé fáze:
1. Nejdříve stránky s NÍZKOU složitostí (celé RSC, bez client sub-component)
2. Pak STŘEDNÍ (SSR + client sub-component)
3. Nakonec VYSOKÁ (detail pages s edit/actions)

### STOP pravidla:
- **STOP-1:** Pokud `prisma` query selže (model neexistuje, relace neexistuje) → zkontrolovat schema.prisma, spustit `npx prisma generate`
- **STOP-2:** Pokud build selže s "You're importing a component that needs X" → interaktivní kód zůstal v RSC, vyextrahovat do Client
- **STOP-3:** Pokud stránka vrací 500 → zkontrolovat auth session, prisma connection

---

## Odhad effort

| Fáze | Stránek | Client sub-components | Effort |
|------|---------|----------------------|--------|
| Partner | 11 | 8 (P1,P5 celé RSC + PD4) | 3-4 hod |
| Admin | 11 | 11 | 3-4 hod |
| PWA Díly | 8 | 5 (PD4 celé RSC) | 2-3 hod |
| PWA Makléř | 3 | 3 | 1 hod |
| **CELKEM** | **33** | **27 nových client files** | **~10-12 hod** |

**Poznámka:** admin/vehicles/new přeskočen (oprávněný "use client"), celkem 33 stránek k migraci.
