# IMPL: SSR migrace — PWA Makléř (3 stránky)

**Status:** HOTOVO
**Datum:** 2026-05-08
**Build:** `npm run build` — 0 chyb

## Přehled

Migrace 3 PWA Makléř stránek z `"use client"` na Server Components s SSR Prisma data fetching.

**Pattern:**
1. Odebráno `"use client"` z page.tsx
2. Přidáno `export const metadata` + `export const dynamic = "force-dynamic"`
3. `getServerSession(authOptions)` + role check (BROKER/ADMIN/BACKOFFICE) → `redirect("/login")`
4. Prisma query pro initial data (kopie z příslušného API route)
5. Serializace: `JSON.parse(JSON.stringify(...))` pro nested dates
6. Render client island komponenty s `initialData` / `initialLeads` / `initialContacts` props

## Migrované stránky

| # | Stránka | SSR page.tsx | Client component | Prisma query |
|---|---------|-------------|-------------------|-------------|
| PM1 | `/makler/leads` | ✅ | `BrokerLeadsClient` | `lead.findMany` (where assignedToId+status, include assignedTo/region/vehicle) |
| PM2 | `/makler/contacts` | ✅ | `BrokerContactsClient` | `sellerContact.findMany` (where brokerId, include _count) |
| PM3 | `/makler/contacts/[id]` | ✅ | `BrokerContactDetailClient` | `sellerContact.findUnique` (include vehicles/communications/_count) |

## Auth role checks

| Stránky | Povolené role |
|---------|--------------|
| PM1 (leads), PM2 (contacts), PM3 (contact detail) | BROKER, ADMIN, BACKOFFICE |

## Vytvořené soubory (3 client components)

```
components/pwa/leads/BrokerLeadsClient.tsx
components/pwa/contacts/BrokerContactsClient.tsx
components/pwa/contacts/BrokerContactDetailClient.tsx
```

## Modifikované soubory (3 page.tsx)

```
app/(pwa)/makler/leads/page.tsx
app/(pwa)/makler/contacts/page.tsx
app/(pwa)/makler/contacts/[id]/page.tsx
```

## Poznámky

- PM1 (leads): Default tab "NEW" — SSR načte leady se statusem NEW, client component při změně tabu refetchuje přes API
- PM2 (contacts): Default tab "all" — SSR načte všechny kontakty, client component při změně tabu/search refetchuje přes API
- PM3 (contact detail): Ownership check na serveru (brokerId === session.user.id), admin/backoffice vidí vše
- PM3: `fetchContact` callback zůstává pro refresh po přidání komunikace
- PM3: Interaktivní elementy (delete, comm form, SMS templates, escalation) v client componentu
- `useRef(true)` pattern pro skip initial fetch (SSR data pro výchozí stav)
