# IMPL: SSR migrace — Partner portál

**Datum:** 2026-05-08
**Status:** HOTOVO
**Build:** PASS

---

## Souhrn

Migrováno **15 partner stránek** z `"use client"` na Server Components s SSR data fetching.

### Pattern

Pro každou stránku:
1. Odebráno `"use client"` z `page.tsx`
2. Vytvořen client component v `components/partner/` pro interaktivní části
3. SSR page fetchuje data přes Prisma, předává jako props do client component
4. Přidáno `export const metadata` (SEO) a `export const dynamic = "force-dynamic"`
5. Auth check přes `getServerSession(authOptions)` s redirect na `/login`

### Migrované stránky

| # | Stránka | Typ | Client Component |
|---|---------|-----|-----------------|
| 1 | `partner/onboarding/profile` | Form | `OnboardingProfileForm` |
| 2 | `partner/onboarding/documents` | Form | `OnboardingDocumentsForm` |
| 3 | `partner/vehicles/new` | Form | `NewVehicleForm` |
| 4 | `partner/parts/new` | Form | `NewPartForm` |
| 5 | `partner/dashboard` | SSR data + client | `PartnerDashboardContent` |
| 6 | `partner/vehicles` | SSR data + client (search/filter/pagination) | `PartnerVehiclesList` |
| 7 | `partner/vehicles/[id]` | SSR data + client (edit/archive) | `VehicleDetailContent` |
| 8 | `partner/parts` | SSR data + client (search/pagination) | `PartnerPartsList` |
| 9 | `partner/parts/[id]` | SSR data + client (edit/delete) | `PartDetailContent` |
| 10 | `partner/orders` | SSR data + client (pagination) | `PartnerOrdersList` |
| 11 | `partner/orders/[id]` | SSR data + client (status/tracking/PDF) | `OrderDetailContent` |
| 12 | `partner/leads` | SSR data + client (tabs/status) | `PartnerLeadsList` |
| 13 | `partner/stats` | SSR data + client (charts) | `PartnerStatsContent` |
| 14 | `partner/billing` | SSR data + client | `PartnerBillingContent` |
| 15 | `partner/profile` | SSR data + client (edit form) | `PartnerProfileEditor` |

### Nové soubory

```
components/partner/OnboardingProfileForm.tsx
components/partner/OnboardingDocumentsForm.tsx
components/partner/NewVehicleForm.tsx
components/partner/NewPartForm.tsx
components/partner/PartnerDashboardContent.tsx
components/partner/PartnerVehiclesList.tsx
components/partner/VehicleDetailContent.tsx
components/partner/PartnerPartsList.tsx
components/partner/PartDetailContent.tsx
components/partner/PartnerOrdersList.tsx
components/partner/OrderDetailContent.tsx
components/partner/PartnerLeadsList.tsx
components/partner/PartnerStatsContent.tsx
components/partner/PartnerBillingContent.tsx
components/partner/PartnerProfileEditor.tsx
```

### Klíčové body

- **Data fetching:** Všechny Prisma queries přesunuty na server (z API endpoint logiky)
- **Auth:** `getServerSession` na serveru místo `useSession` na klientu
- **Initial data:** Client components dostávají `initialData` jako props, skipují první fetch
- **SEO:** Každá stránka exportuje `metadata` pro title/description
- **Serialization:** Datumy převedeny na ISO string pro JSON-safe přenos do client
- **Dynamic detail pages:** `generateMetadata` pro dynamické titulky (vehicles/[id], parts/[id], orders/[id])

### Verifikace

```
✅ npm run build — PASS
✅ 0 partner page.tsx files with "use client"
✅ 15/15 stránek SSR (ƒ Dynamic nebo ○ Static v build output)
```
