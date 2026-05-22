# SSR Migrace — Faze 7: PWA + Partner

**Datum:** 2026-05-07
**Rozsah:** 85 stranek celkem (48 "use client", 37 uz SSR)
**Zavislost:** Zadna

---

## Inventar stranek

### Celkovy prehled

| Oblast | Celkem | Uz SSR | "use client" | K migraci | Zustava client |
|--------|--------|--------|-------------|-----------|----------------|
| PWA Makler `(pwa)/makler` | 51 | 29 | 22 | 10 | 12 |
| PWA-Parts `(pwa-parts)/parts` | 15 | 4 | 11 | 6-8 | 3-5 |
| Partner `(partner)/partner` | 19 | 4 | 15 | 5-12 | 3-10 |
| **Celkem** | **85** | **37** | **48** | **21-30** | **18-27** |

### Dulezita architekturni poznamka

**PWA stranky jsou za auth (BROKER/PARTS_SUPPLIER role) a NEMAJI SEO (`robots: noindex`).** SSR presto prinasi:
1. **Rychlejsi prvni render** — HTML ze serveru misto prazdneho shellu + JS
2. **Lepsi Service Worker caching** — SW cachuje pre-renderovany HTML, offline pristup zobrazuje plny obsah
3. **Redukce client JS bundle** — mene "use client" = mene JS poslan klientovi

**Offline-first strategie:** Stranky s browser API zavislostmi (navigator.onLine, IndexedDB primo v page) MUSI zustat client. Stranky s fetch() ke API muze SW cachovat nezavisle.

---

## TIER 1: Odebrat "use client" — pure wrapper pages (8 stranek, ~40 min)

Tyto stranky jsou **tenke wrappery** — jen importuji client component a renderuji ho. `StepPageGuard` i vsechny `*Step` komponenty JIZ MAJI "use client". Page muze byt Server Component.

| Stranka | Radku | Importuje |
|---------|-------|-----------|
| `makler/vehicles/new/vin/page.tsx` | 11 | VinStep + StepPageGuard |
| `makler/vehicles/new/contact/page.tsx` | 11 | ContactStep + StepPageGuard |
| `makler/vehicles/new/inspection/page.tsx` | 11 | InspectionStep + StepPageGuard |
| `makler/vehicles/new/photos/page.tsx` | 11 | PhotosStep + StepPageGuard |
| `makler/vehicles/new/details/page.tsx` | 11 | DetailsStep + StepPageGuard |
| `makler/vehicles/new/pricing/page.tsx` | 11 | PricingStep + StepPageGuard |
| `makler/vehicles/new/equipment/page.tsx` | 11 | EquipmentStep + StepPageGuard |
| `makler/vehicles/new/review/page.tsx` | 11 | ReviewStep + StepPageGuard |

### Implementace (identicky pro vsech 8)

```diff
- "use client";
-
  import { VinStep } from "@/components/pwa/vehicles/new/VinStep";
  import { StepPageGuard } from "@/components/pwa/vehicles/new/StepPageGuard";
  
  export default function VinPage() {
    return (
      <StepPageGuard>
        <VinStep />
      </StepPageGuard>
    );
  }
```

**Jediny diff:** Odebrat `"use client";` z radku 1-2. Zadna jina zmena.

---

## TIER 2: searchParams konverze — success pages (2 stranky, ~30 min)

Tyto stranky pouzivaji **pouze** `useSearchParams()` — lze nahradit server-side `searchParams` prop.

### 2a. `makler/vehicles/new/success/page.tsx` (12 radku)

**Aktualne:**
```tsx
"use client";
import { useSearchParams } from "next/navigation";
import { SuccessView } from "@/components/pwa/vehicles/new/SuccessView";
export default function SuccessPage() {
  const searchParams = useSearchParams();
  const offline = searchParams.get("offline") === "1";
  const vehicleId = searchParams.get("vehicleId");
  return <SuccessView offline={offline} vehicleId={vehicleId} />;
}
```

**SSR verze:**
```tsx
import { SuccessView } from "@/components/pwa/vehicles/new/SuccessView";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const offline = params.offline === "1";
  const vehicleId = params.vehicleId ?? null;
  return <SuccessView offline={offline} vehicleId={vehicleId} />;
}
```

### 2b. `makler/vehicles/quick/success/page.tsx` (~40 radku)

**Aktualne:** useSearchParams() pro `vehicleId`. Staticka success karta s Link.

**SSR verze:** Nahradit `useSearchParams()` za `searchParams: Promise<...>` prop. Obsah je staticke JSX s jednim dynamickym odkazem — plne kompatibilni se SSR.

**Zmena:** Odebrat "use client", pridat async page s searchParams prop, nahradit `searchParams.get("vehicleId")` za `params.vehicleId`.

---

## TIER 3: SSR s Prisma pre-fetch — partner dashboardy (3 stranky, ~2h)

Partner dashboard stranky zobrazuji statistiky. SSR pre-fetch eliminuje loading spinner.

### 3a. `partner/dashboard/page.tsx`

**Aktualne:** "use client", useSession, fetch `/api/partner/dashboard` pro stats.
**Plan:** SSR s `getServerSession` + Prisma pocty (orders, vehicles, parts, revenue). Extract dashboard widgety do `PartnerDashboard.tsx` client component pro interaktivni grafy.
**Novy soubor:** `components/partner/PartnerDashboard.tsx`

### 3b. `partner/stats/page.tsx`

**Aktualne:** "use client", useSession, fetch stats + grafy.
**Plan:** SSR pre-fetch zakladnich statistik, grafy (RevenueChart, OrdersChart) jako client island.
**Novy soubor:** `components/partner/PartnerStats.tsx`

### 3c. `partner/billing/page.tsx`

**Aktualne:** "use client", fetch billing data (invoices, payouts).
**Plan:** SSR pre-fetch billing entries via Prisma, format na serveru.
**Novy soubor:** `components/partner/BillingManager.tsx` (pro interaktivni akce — export CSV, filtrace)

---

## TIER 4: SSR s pre-fetch — list pages (9 stranek, ~7h)

Vsechny list stranky sdili pattern: fetch API → zobraz seznam s tabs/filtry/paginaci.

### Pattern pro vsechny list stranky

```
SSR Page:
  ├── getServerSession + auth check
  ├── searchParams: Promise<...> → parse filtry
  ├── Prisma findMany + count (paralelni)
  ├── Serializace Date → ISO string
  └── Render:
      ├── <ListFilters /> — CLIENT ISLAND (tabs, search, filtry)
      └── Items grid/list — SERVER rendered
      └── Link-based paginace — SERVER
```

### Seznam list stranek

| Stranka | Aktualni fetch | Prisma model | Filtry |
|---------|---------------|-------------|--------|
| `makler/contacts` | `/api/contacts?filter=&q=` | Contact | tab (all/with_vehicle/without_vehicle/follow_up), search |
| `makler/leads` | `/api/leads?status=&assignedToId=me` | Lead | tab (NEW/ASSIGNED/CONTACTED/MEETING/REJECTED) |
| `parts/orders` | `/api/supplier/orders` | Order+SubOrder | tab (status), paginace |
| `parts/my` | `/api/supplier/parts` | Part | filtry, search |
| `parts/donors` | `/api/supplier/donors` | DonorVehicle | status tab |
| `partner/orders` | `/api/partner/orders` | Order | tab (status), paginace |
| `partner/leads` | `/api/partner/leads` | Lead | tab (status) |
| `partner/vehicles` | `/api/partner/vehicles` | Vehicle | tab (status), paginace |
| `partner/parts` | `/api/partner/parts` | Part | tab, search |

### Novy client component pro kazdou stranku

Kazda list stranka potrebuje **1 client component** pro interaktivni filtry (tabs, search bar). Grid/list a paginace se renderuji na serveru.

**Alternativa:** Sdileny `ListFilters` component s konfiguraci pres props. Ale kazda stranka ma specificke tabs/filtry → lepsi mit oddelene.

### Prioritizace

**Vysoka priorita (partner — nema SW cache):**
- partner/orders, partner/vehicles, partner/parts (nejvice navstevovane)

**Nizka priorita (PWA — SW cache existuje):**
- makler/contacts, makler/leads (SW cachuje)
- parts/orders, parts/my, parts/donors (SW cachuje)

---

## TIER 5: SSR s pre-fetch — detail pages (5 stranek, ~2.5h)

### Pattern

```
SSR Page:
  ├── params: Promise<{ id: string }> → parse ID
  ├── getServerSession + auth check
  ├── Prisma findUnique({ where: { id } })
  ├── if (!item) notFound()
  └── Render:
      ├── Detail view — SERVER (read-only data)
      └── <ActionButtons /> — CLIENT ISLAND (edit, delete, status change)
```

### Seznam detail stranek

| Stranka | Prisma model | Interaktivni akce |
|---------|-------------|-------------------|
| `makler/contacts/[id]` | Contact + CommunicationLog | CommunicationForm (pridat poznamku/call) |
| `parts/[id]` | Part + images | DeletePartDialog, status change |
| `parts/orders/[id]` | SubOrder + items | OrderActions (accept, reject, ship) |
| `parts/donors/[id]` | DonorVehicle + parts | DisassemblyActions |
| `partner/orders/[id]` | Order + items | OrderActions (status update) |

Pro kazdy: SSR renderuje detail view, extrahuje interaktivni akce do client island.

---

## TIER 6: ZUSTAVA CLIENT — formularove stranky (17 stranek)

Vsechny formularove stranky **ZUSTAVAJI "use client"**. Duvod: tezka interaktivita (multi-step wizardy, image upload, inline validace, incremental save).

### PWA Makler (4 stranky)
| Stranka | Duvod |
|---------|-------|
| `makler/contacts/new` | Formular pro novy kontakt |
| `makler/vehicles/new` | Draft creation + offlineStorage import |
| `makler/vehicles/[id]/edit` | Edit formular s useDraftContext |
| `makler/onboarding/training` | Training slides + quiz form |

### PWA-Parts (5 stranek)
| Stranka | Duvod |
|---------|-------|
| `parts/profile` | Profil editace s useSession |
| `parts/onboarding/profile` | Onboarding profil formular |
| `parts/onboarding/documents` | Document upload s useRef |
| `parts/[id]/edit` | Multi-step edit wizard (AddPartWizard) |
| `parts/new` | Multi-step creation wizard + DamageZoneSelector + BulkPricingStep |

### Partner (8 stranek)  
| Stranka | Duvod |
|---------|-------|
| `partner/profile` | Profil editace s OpeningHoursEditor |
| `partner/onboarding/profile` | Onboarding profil formular |
| `partner/onboarding/documents` | Document upload |
| `partner/parts/[id]` | Part edit formular + PhotoUpload |
| `partner/parts/new` | Part creation wizard + PhotoUpload |
| `partner/vehicles/[id]` | Vehicle edit + PhotoUpload |
| `partner/vehicles/new` | Vehicle creation wizard |

**Poznamka:** Pro formularove stranky je mozne v budoucnu pridat SSR wrapper s auth check + metadata (jako v Fazi 6 ProfileSetupWizard pattern), ale samotny formular zustava client.

---

## TIER 7: ZUSTAVA CLIENT — hooks/browser API (5 stranek)

| Stranka | Duvod |
|---------|-------|
| `makler/vehicles/quick` | useDraftContext + redirect |
| `makler/vehicles/quick/step1` | useSearchParams + useDraftContext |
| `makler/vehicles/quick/step2` | useSearchParams + useDraftContext |
| `makler/vehicles/quick/step3` | useSearchParams + useDraftContext |
| `makler/offline` | navigator.onLine + browser events |

---

## Implementacni strategie

### Faze 7A: Quick wins (10 stranek, ~1h)

**Scope:** Tier 1 + Tier 2
**Effort:** Minimalni — jen odebrani "use client" a searchParams konverze
**Risk:** Nulovy — zadna zmena logiky

### Faze 7B: Partner dashboardy (3 stranky, ~2h)

**Scope:** Tier 3
**Effort:** Stredni — Prisma pre-fetch + client component extraction
**Risk:** Nizky — partner stranky nemaji offline requirements

### Faze 7C: Partner listy (4 stranky, ~3h)

**Scope:** partner/orders, partner/vehicles, partner/parts, partner/leads
**Effort:** Stredni — Prisma query + client filter component
**Risk:** Nizky

### Faze 7D: PWA listy + detaily (10 stranek, ~6.5h)

**Scope:** Tier 4 (PWA cast) + Tier 5
**Effort:** Vyssi — vice stranek, overeni kompatibility se SW cache
**Risk:** Stredni — potreba overit ze SW spravne cachuje SSR odpovedi

### Celkovy casovy odhad

| Faze | Stranky | Cas | Priorita |
|------|---------|-----|----------|
| 7A: Quick wins | 10 | 1h | **P0 — udelat hned** |
| 7B: Partner dashboardy | 3 | 2h | **P1 — vysoka** |
| 7C: Partner listy | 4 | 3h | **P1 — vysoka** |
| 7D: PWA listy + detaily | 10 | 6.5h | **P2 — po overeni SW** |
| STAY CLIENT | 22 | 0h | N/A |
| **Celkem k migraci** | **27** | **~12.5h** | |

---

## Poznamky pro implementatora

### 1. Auth pattern pro PWA/Partner SSR stranky

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SomePWAPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  // Role check — viz middleware.ts pro PWA prefix
  // ...
}
```

**DULEZITE:** Middleware.ts JIZ chrani celou `(pwa)` a `(partner)` prefix — per-page auth check je redundantni ale doporuceny jako defense-in-depth.

### 2. Service Worker kompatibilita

PWA pages se cachuji pres Service Worker (Serwist). SSR stranky produkuji **plny HTML** ktery SW muze cachovat — to je LEPSI nez client-only (kde SW cachuje prazdny shell).

**Test:** Po migraci overit ze SW spravne cachuje SSR response:
1. Navstivit stranku online
2. Prepnout do offline mode
3. Refreshnout — stranka by mela zobrazit posledni cachovany obsah

### 3. Date serializace (opakujici se vzor)

Prisma Date → client component: `.toISOString()`
Prisma Date → server-only render: `.toLocaleDateString("cs-CZ")`

### 4. Sdilene Prisma queries

Nektera Prisma queries se opakovaly v API routes a nyni v SSR strankach. **NEMAZAT API routes** — pouzivaji se pro:
- Client-side refetch po CRUD operacich
- PWA offline sync (Background Sync volá API)
- Externi integrace

### 5. Uz existujici SSR stranky (37)

29 PWA-makler + 4 PWA-parts + 4 partner stranek JIZ NEMAJI "use client". Tyto stranky **NEKONTROLOVAT** v ramci teto faze — uz prosly SSR migraci.

### 6. Metadata pro PWA/Partner

PWA/Partner stranky nemaji SEO benefit z metadata (robots: noindex). Ale `<title>` zlepsi UX v prohlizeci (tab nazev). Volitelne pridat:
```tsx
export const metadata = { title: "Moje kontakty" };
```

---

## Kontrolni checklist po implementaci

### Per-tier checklist

**Tier 1 (8 wrapper pages):**
- [ ] Zadna page NEMA "use client"
- [ ] Vsechny step pages funguji (vin→contact→...→review)
- [ ] StepPageGuard spravne redirect pokud chybi draft

**Tier 2 (2 success pages):**
- [ ] Zadna page NEMA "use client"
- [ ] searchParams spravne predany (vehicleId, offline)
- [ ] Success view zobrazuje spravne hodnoty

**Tier 3 (3 partner dashboardy):**
- [ ] Pre-fetchovane statistiky zobrazeny BEZ loading spinneru
- [ ] Grafy/charty funguji (client hydration)
- [ ] Auth check (partner musi byt prihlasen)

**Tier 4+5 (list + detail pages):**
- [ ] Seznamy zobrazeny BEZ loading spinneru
- [ ] Filtry/tabs funguji (meni URL, novy SSR render)
- [ ] Paginace funguje (Link-based)
- [ ] Detail pages zobrazuji spravna data
- [ ] CRUD akce (v client islands) funguji a refreshuji data

### Globalni
- [ ] `npm run build` projde bez chyb
- [ ] SW cache funguje (offline test)
- [ ] Zadny vizualni regression
