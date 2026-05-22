# Audit: "use client" direktivy v celém projektu

**Datum:** 2026-05-08
**Auditor:** Plánovač (agent team)
**Celkem souborů s "use client":** 488

---

## Souhrn

| Kategorie | Počet | Stav |
|-----------|-------|------|
| error.tsx (Next.js mandát) | 129 | ✅ Všechny oprávněné |
| page.tsx — ZBYTEČNÉ (client-side fetching) | **42** | ❌ **PŘEVÉST na RSC + Prisma SSR** |
| page.tsx — oprávněné (forms, cart, wizard, offline) | 13 | ✅ |
| layout.tsx — oprávněné (providers, context) | 7 | ⚠️ Optimalizovatelné, ale funkční |
| components — oprávněné (hooks, events, browser API) | ~262 | ✅ |
| components — zbytečné (čistě presentační) | ~10 | ⚠️ Nízká priorita |
| lib/hooks (custom hooks) | 5 | ✅ Oprávněné |

**Hlavní problém: 42 page.tsx souborů používá `useEffect` + `useState` + `fetch('/api/...')` místo SSR s Prisma.**

---

## KRITICKÉ: 42 stránek k převodu na SSR

### Pattern (opakuje se 42×):
```tsx
"use client";                          // ← ZBYTEČNÉ
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function SomePage() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/something')             // ← ZBYTEČNÉ — přímý Prisma query je rychlejší
      .then(r => r.json())
      .then(setData);
  }, []);
```

### Cílový pattern (po migraci):
```tsx
// Žádné "use client" — toto je Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SomeClientComponent } from "@/components/SomeClientComponent";

export default async function SomePage() {
  const session = await getServerSession(authOptions);
  const data = await prisma.something.findMany({ ... });
  
  return <SomeClientComponent data={data} />; // interaktivní část zůstává client
}
```

### Kompletní seznam stránek k převodu

#### Partner portál (15 stránek) — `app/(partner)/partner/`

| # | Soubor | Důvod "use client" | Akce |
|---|--------|-------------------|------|
| 1 | `partner/dashboard/page.tsx` | useEffect + fetch → dashboard stats | SSR: `prisma` query, pass to client StatCards |
| 2 | `partner/orders/page.tsx` | useEffect + fetch → orders list | SSR: `prisma.subOrder.findMany()` |
| 3 | `partner/orders/[id]/page.tsx` | useEffect + fetch → order detail | SSR: `prisma.subOrder.findUnique()` |
| 4 | `partner/stats/page.tsx` | useEffect + fetch → stats + charts | SSR: data fetch, client charts (RevenueChart, OrdersChart) |
| 5 | `partner/billing/page.tsx` | useEffect + fetch → billing data | SSR: `prisma` aggregation |
| 6 | `partner/leads/page.tsx` | useEffect + fetch → leads list | SSR: `prisma.partnerLead.findMany()` |
| 7 | `partner/vehicles/page.tsx` | useEffect + fetch → vehicles list | SSR: `prisma.vehicle.findMany()` + client Tabs/Pagination |
| 8 | `partner/vehicles/[id]/page.tsx` | useEffect + fetch → vehicle detail | SSR: `prisma.vehicle.findUnique()` |
| 9 | `partner/parts/page.tsx` | useEffect + fetch → parts list | SSR: `prisma.part.findMany()` |
| 10 | `partner/parts/[id]/page.tsx` | useEffect + fetch → part detail | SSR: `prisma.part.findUnique()` |
| 11 | `partner/profile/page.tsx` | useEffect + fetch → profile form | SSR: load data, client form for editing |
| 12 | `partner/onboarding/profile/page.tsx` | useState → form | Oprávněný — form s editací |
| 13 | `partner/onboarding/documents/page.tsx` | useState → file upload | Oprávněný — file upload |
| 14 | `partner/vehicles/new/page.tsx` | useState → form wizard | ✅ Oprávněný |
| 15 | `partner/parts/new/page.tsx` | useState → form wizard | ✅ Oprávněný |

**K převodu: 11 z 15 stránek**

#### Admin panel (13 stránek) — `app/(admin)/admin/`

| # | Soubor | Důvod "use client" | Akce |
|---|--------|-------------------|------|
| 16 | `admin/users/page.tsx` | useEffect + fetch → users table | SSR: `prisma.user.findMany()` |
| 17 | `admin/orders/page.tsx` | useEffect + fetch → orders table | SSR: `prisma.order.findMany()` |
| 18 | `admin/parts/page.tsx` | useEffect + fetch → parts table | SSR: `prisma.part.findMany()` |
| 19 | `admin/suppliers/page.tsx` | useEffect + fetch → suppliers table | SSR: `prisma.user.findMany({role: "PARTS_SUPPLIER"})` |
| 20 | `admin/returns/page.tsx` | useEffect + fetch → returns table | SSR: `prisma.return.findMany()` |
| 21 | `admin/returns/[id]/page.tsx` | useEffect + fetch → return detail | SSR: `prisma.return.findUnique()` |
| 22 | `admin/feeds/page.tsx` | useEffect + fetch → feeds list | SSR: `prisma.partsFeed.findMany()` |
| 23 | `admin/feeds/[id]/page.tsx` | useEffect + fetch → feed detail | SSR: `prisma.partsFeed.findUnique()` |
| 24 | `admin/feeds/new/page.tsx` | useEffect + fetch → supplier list for select | SSR: load suppliers, client form |
| 25 | `admin/marketplace/[id]/page.tsx` | useEffect + fetch → deal detail | SSR: `prisma.flipOpportunity.findUnique()` |
| 26 | `admin/marketplace/applications/[id]/page.tsx` | useEffect + fetch → application detail | SSR: `prisma.marketplaceApplication.findUnique()` |
| 27 | `admin/vehicles/new/page.tsx` | useState + useMemo → form wizard | ✅ Oprávněný — komplexní form |

**K převodu: 12 z 13 stránek**

#### PWA Makléř (8 stránek) — `app/(pwa)/makler/`

| # | Soubor | Důvod "use client" | Akce |
|---|--------|-------------------|------|
| 28 | `makler/leads/page.tsx` | useEffect + fetch → leads list | SSR: `prisma.lead.findMany()` + client Tabs |
| 29 | `makler/contacts/page.tsx` | useEffect + fetch → contacts list | SSR: `prisma.contact.findMany()` + client search/tabs |
| 30 | `makler/contacts/[id]/page.tsx` | useEffect + fetch → contact detail | SSR: `prisma.contact.findUnique()` |
| 31 | `makler/contacts/new/page.tsx` | useState → form | ✅ Oprávněný — form |
| 32 | `makler/vehicles/[id]/edit/page.tsx` | useDraftContext → draft wizard | ✅ Oprávněný — DraftProvider |
| 33 | `makler/vehicles/new/page.tsx` | useDraftContext → wizard | ✅ Oprávněný — DraftProvider |
| 34 | `makler/offline/page.tsx` | useEffect → offline sync | ✅ Oprávněný — IndexedDB/offline |
| 35 | `makler/onboarding/training/page.tsx` | useState → interactive slides | ✅ Oprávněný |

**K převodu: 3 z 8 stránek**

#### PWA Makléř quick steps (4 stránky)

| # | Soubor | Akce |
|---|--------|------|
| 36 | `makler/vehicles/quick/page.tsx` | ✅ Oprávněný — wizard redirect |
| 37 | `makler/vehicles/quick/step1/page.tsx` | ✅ Oprávněný — form step |
| 38 | `makler/vehicles/quick/step2/page.tsx` | ✅ Oprávněný — form step |
| 39 | `makler/vehicles/quick/step3/page.tsx` | ✅ Oprávněný — form step |

**K převodu: 0**

#### PWA Dodavatel dílů (8 stránek) — `app/(pwa-parts)/parts/`

| # | Soubor | Důvod "use client" | Akce |
|---|--------|-------------------|------|
| 40 | `parts/my/page.tsx` | useEffect + fetch → parts list | SSR: `prisma.part.findMany()` |
| 41 | `parts/orders/page.tsx` | useEffect + fetch → orders list | SSR: `prisma.subOrder.findMany()` |
| 42 | `parts/orders/[id]/page.tsx` | useEffect + fetch → order detail | SSR: `prisma.subOrder.findUnique()` |
| 43 | `parts/donors/page.tsx` | useEffect + fetch → donors list | SSR: `prisma.donorVehicle.findMany()` |
| 44 | `parts/donors/[id]/page.tsx` | useEffect + fetch → donor detail | SSR: `prisma.donorVehicle.findUnique()` |
| 45 | `parts/[id]/page.tsx` | useEffect + fetch → part detail | SSR: `prisma.part.findUnique()` |
| 46 | `parts/[id]/edit/page.tsx` | useEffect + fetch + useState → edit form | Hybrid: SSR load, client form |
| 47 | `parts/new/page.tsx` | useState → wizard | ✅ Oprávněný |
| 48 | `parts/profile/page.tsx` | useEffect + fetch → profile | Hybrid: SSR load, client form |
| 49 | `parts/onboarding/profile/page.tsx` | useState → form | ✅ Oprávněný |
| 50 | `parts/onboarding/documents/page.tsx` | useState → file upload | ✅ Oprávněný |

**K převodu: 8 z 11 stránek (2 hybrid)**

#### Veřejný web (4 stránky) — `app/(web)/`

| # | Soubor | Důvod "use client" | Akce |
|---|--------|-------------------|------|
| 51 | `shop/kosik/page.tsx` | localStorage cart (getCart, onCartChange) | ✅ Oprávněný — browser API |
| 52 | `shop/objednavka/page.tsx` | localStorage cart + multi-step form | ✅ Oprávněný — browser API |
| 53 | `dily/kosik/page.tsx` | localStorage cart | ✅ Oprávněný — browser API |
| 54 | `dily/objednavka/page.tsx` | localStorage cart + form + Zásilkovna widget | ✅ Oprávněný — browser API |
| 55 | `inzerce/registrace/page.tsx` | useState → multi-step form | ✅ Oprávněný |

**K převodu: 0 (všechny oprávněné — cart/forms)**

---

## CELKEM PAGE.TSX K PŘEVODU: 34 stránek

| Sekce | K převodu | Oprávněné | Celkem |
|-------|-----------|-----------|--------|
| Partner | 11 | 4 | 15 |
| Admin | 12 | 1 | 13 |
| PWA Makléř | 3 | 9 | 12 |
| PWA Díly | 8 | 3 | 11 |
| Web | 0 | 5 | 5 |
| **CELKEM** | **34** | **21** | **55** |

---

## Layout.tsx analýza (7 souborů)

| Soubor | "use client" oprávněný? | Důvod |
|--------|------------------------|-------|
| `app/(pwa)/layout.tsx` | ⚠️ OPTIMALIZOVATELNÝ | Wrappuje `OnlineStatusProvider`, `BottomNav`, `AiAssistant` — všechno client. Ale layout samotný by mohl být RSC s client wrapper kolem. |
| `app/(partner)/layout.tsx` | ⚠️ OPTIMALIZOVATELNÝ | `AuthProvider` + `OnlineStatusProvider` + `PartnerLayout`. Stejný pattern. |
| `app/(pwa-parts)/layout.tsx` | ⚠️ OPTIMALIZOVATELNÝ | `OnlineStatusProvider` + `SupplierTopBar` + `SupplierBottomNav`. |
| `app/(pwa)/makler/onboarding/layout.tsx` | ✅ | Wrappuje DraftProvider nebo onboarding context. |
| `app/(pwa)/makler/vehicles/quick/layout.tsx` | ✅ | Quick wizard layout with DraftProvider. |
| `app/(pwa)/makler/vehicles/new/layout.tsx` | ✅ | DraftProvider context wrapper. |
| `app/(pwa)/makler/contracts/new/layout.tsx` | ✅ | Contract wizard context. |

**Doporučení:** 3 root layouts (`(pwa)`, `(partner)`, `(pwa-parts)`) by mohly být refaktorovány na pattern:
```tsx
// layout.tsx (Server Component)
export default function Layout({ children }) {
  return <ClientProviders>{children}</ClientProviders>;
}

// ClientProviders.tsx ("use client")
export function ClientProviders({ children }) {
  return (
    <OnlineStatusProvider>
      <TopBar />
      <main>{children}</main>
      <BottomNav />
    </OnlineStatusProvider>
  );
}
```
**Priorita: NÍZKÁ** — funkční dopad minimální, protože children se renderují jako RSC i tak.

---

## Komponenty — zbytečné "use client" (nízká priorita)

Tyto komponenty nemají hooks ani event handlers, ale mají "use client":

| Soubor | Proč zbytečné | Poznámka |
|--------|---------------|----------|
| `components/pwa/vehicles/new/StepProgressBar.tsx` | Jen renderuje props + ProgressBar. Žádné hooks, žádné events. | Importován z client komponent → dopad nulový |
| `components/web/BrokerBox.tsx` | Jen renderuje props. Žádné hooks. | Importován z BrokerGrid (client) → dopad nulový |
| `components/pwa/FeatureGate.tsx` | Jen conditional render na props. Žádné hooks. | Importován z client parents → dopad nulový |
| `components/ui/TrustScoreBadge.tsx` | Jen renderuje props s CSS. | Importován z client contexts |
| `components/ui/AutoBadges.tsx` | Presentační, bez hooks. | Ověřit — může mít skrytý event handler |
| `components/ui/ActivitySignal.tsx` | Presentační, bez hooks. | Ověřit — může mít animaci |

**Priorita: VELMI NÍZKÁ** — Tyto komponenty jsou importovány výhradně z client komponent, takže odebrání "use client" nezmenší client bundle (dědí "use client" od parent importu).

---

## Oprávněné "use client" — hlavní kategorie (262 komponent)

| Kategorie | Příklady | Důvod |
|-----------|----------|-------|
| **Formuláře** (~60) | LoginForm, RegistrationForm, OrderForm, ProfileForm, CareerForm, ContactForm | useState, onChange, onSubmit |
| **Wizardy/Steps** (~30) | EquipmentStep, VinStep, PhotosStep, ContractWizard, ListingFormWizard | useState, multi-step navigation |
| **Interaktivní UI** (~40) | Tabs, Modal, Dropdown, Toggle, Pagination, SearchOverlay, CompareBar | useState, onClick, event handlers |
| **Navigace** (~15) | BottomNav, TopBar, MobileMenu, AdminSidebar, Navbars | useState (menu state), onClick |
| **Data management** (~30) | VehiclesList, ContractsList, LeadsTable, DataTables | useEffect + fetch, filtering, sorting |
| **Charts** (~5) | RevenueChart, OrdersChart | Canvas/SVG browser API |
| **Auth/Offline** (~15) | AuthProvider, OnlineStatusProvider, OfflineBanner, SyncButton | useSession, useEffect, IndexedDB |
| **Maps/External** (~5) | ZasilkovnaWidget, SignatureCanvas | External JS, canvas API |
| **Real-time** (~10) | NotificationBell, OnlineSync, InstallPrompt | WebSocket, service worker |
| **Animations** (~10) | LockedFeatureCard (framer-motion), Confetti, TourSpotlight | framer-motion, CSS animations |
| **Rich editors** (~5) | RichTextEditor, ArticleEditor, BrokerArticleEditor | TipTap (requires DOM) |
| **Ostatní** (~37) | Various interactive components | Hooks, browser APIs |

---

## Prioritizace implementace

### Fáze 1 — Partner portál (11 stránek) ⭐ NEJVYŠŠÍ PRIORITA
Všechny partner stránky používají identický anti-pattern. Jednoduchý, opakující se refaktor.
**Effort:** ~2-3 hodiny
**Impact:** 11 stránek SSR, rychlejší initial load, lepší SEO (partner profily)

### Fáze 2 — Admin panel (12 stránek)
Stejný pattern jako partner. Většina jsou tabulkové views.
**Effort:** ~3-4 hodiny
**Impact:** 12 stránek SSR, admin nepotřebuje SEO, ale výkon se zlepší

### Fáze 3 — PWA Díly (8 stránek)
**Effort:** ~2 hodiny
**Impact:** 8 stránek SSR

### Fáze 4 — PWA Makléř (3 stránky)
Jen leads, contacts, contacts/[id].
**Effort:** ~1 hodina
**Impact:** 3 stránky SSR

### Fáze 5 — Layout optimalizace (3 layouty)
Nízká priorita, minimální funkční dopad.
**Effort:** ~30 min
**Impact:** Marginální

---

## Vzor migrace (template pro implementátora)

### Před (client-side fetching):
```tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function PartsPage() {
  const { data: session } = useSession();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    fetch('/api/partner/parts').then(r => r.json()).then(setParts);
  }, []);

  return (
    <div>
      <Tabs value={tab} onChange={setTab} tabs={...} />
      {loading ? <Skeleton /> : parts.map(p => <PartCard {...p} />)}
    </div>
  );
}
```

### Po (SSR + client interakce):
```tsx
// page.tsx (Server Component — NO "use client")
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PartsPageClient } from "./PartsPageClient";

export default async function PartsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const parts = await prisma.part.findMany({
    where: { supplierId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return <PartsPageClient parts={parts} />;
}

// PartsPageClient.tsx ("use client" — JEN interaktivní část)
"use client";
import { useState } from "react";

export function PartsPageClient({ parts }: { parts: Part[] }) {
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? parts : parts.filter(p => p.status === tab);
  return (
    <div>
      <Tabs value={tab} onChange={setTab} tabs={...} />
      {filtered.map(p => <PartCard {...p} />)}
    </div>
  );
}
```

### Klíčové principy migrace:
1. **page.tsx** → Server Component (žádné "use client")
2. **Data fetching** → `prisma` query přímo v page, ne `useEffect + fetch`
3. **Auth** → `getServerSession(authOptions)` místo `useSession()`
4. **Interaktivní část** → Extract do `*Client.tsx` s "use client"
5. **Props** → Server → Client předá data jako props (musí být serializable)

---

## Statistiky

| Metrika | Hodnota |
|---------|---------|
| Celkem "use client" souborů | 488 |
| error.tsx (mandát) | 129 (26%) |
| Oprávněné | 315 (65%) |
| **K převodu na RSC** | **34 (7%)** |
| Nízká priorita / kosmetické | 10 (2%) |
| Odhadovaný effort celé migrace | ~8-10 hodin |
