# SSR Migrace — Faze 6: Zbyle web stranky + admin vyjimky

**Datum:** 2026-05-07
**Rozsah:** 5 souboru, ~5-6 hodin prace
**Zavislost:** Zadna (nezavisi na predchozich fazich)

---

## Prehled souboru

| Soubor | Radku | Aktualni stav | Plan |
|--------|-------|---------------|------|
| `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` | 295 | "use client", fetch API | **100% SSR** (zadny novy client component) |
| `app/(web)/muj-ucet/profil/setup/page.tsx` | 780 | "use client", 5-step wizard | SSR page + client island |
| `app/prezentace/page.tsx` | 598 | "use client", Framer Motion | **ZUSTAVA CLIENT** (pridani metadata) |
| `app/(admin)/admin/team/page.tsx` | 413 | "use client", CRUD | SSR pre-fetch + client island |
| `app/(admin)/admin/reviews/page.tsx` | 317 | "use client", CRUD | SSR pre-fetch + client island |

**Skutecny rozsah:** 4 soubory k migraci + 1 zustava client (prezentace). 3 nove client komponenty.

---

## Soubor 1: `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` (295 radku)

### Aktualni stav
- "use client", pouziva `use(params)` pro unwrap Promise params
- Client-side fetch na `/api/orders/track/${token}`
- `useState` (3x): order, loading, error
- `useEffect` pro fetch pri mount
- **Zadne interaktivni prvky** — cela stranka je read-only zobrazeni objednavky
- `OrderTracker` je JIZ Server Component (bez "use client")
- Jedine klikatelne: `<Link>` komponenty (registrace CTA, zpet do shopu)

### Plan: 100% SSR — ZADNY novy client component

Tato stranka je idealni kandidat pro plny SSR:
- Zadna interaktivita (jen zobrazeni dat)
- `OrderTracker` uz je server component
- Vsechny CTA jsou `<Link>` (server-compatible)
- Token-based pristup bez auth (guest tracking)

### Upraveny soubor

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OrderTracker } from "@/components/web/OrderTracker";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type OrderTrackerStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

function mapToTrackerStatus(apiStatus: string): OrderTrackerStatus {
  switch (apiStatus) {
    case "PENDING": return "NEW";
    case "CONFIRMED": return "CONFIRMED";
    case "SHIPPED": return "SHIPPED";
    case "DELIVERED": return "DELIVERED";
    case "CANCELLED": return "CANCELLED";
    default: return "NEW";
  }
}

const statusBadge: Record<string, { label: string; variant: "verified" | "pending" | "new" | "default" | "rejected" }> = {
  PENDING: { label: "Nova", variant: "new" },
  CONFIRMED: { label: "Potvrzena", variant: "pending" },
  SHIPPED: { label: "Odeslano", variant: "verified" },
  DELIVERED: { label: "Doruceno", variant: "verified" },
  CANCELLED: { label: "Zrusena", variant: "rejected" },
};

export const metadata: Metadata = {
  title: "Sledovani objednavky",
  robots: { index: false, follow: false }, // guest tracking — no SEO
};

export default async function SledovaniPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 32) {
    notFound();
  }

  // Prisma query prevzata z /api/orders/track/[token]/route.ts
  const order = await prisma.order.findUnique({
    where: { guestToken: token },
    include: {
      subOrders: {
        include: {
          supplier: { select: { companyName: true, firstName: true, lastName: true } },
          items: {
            include: {
              part: {
                select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      items: {
        include: {
          part: {
            select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } },
          },
        },
      },
    },
  });

  if (!order) {
    // Render friendly "not found" page misto notFound() pro lepsi UX
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">&#128269;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Objednavka nenalezena</h1>
          <p className="text-gray-500 mb-6">
            Odkaz pro sledovani je neplatny nebo vyprsela jeho platnost.
          </p>
          <Link href="/shop" className="no-underline">
            <Button variant="outline">Zpet do shopu</Button>
          </Link>
        </div>
      </div>
    );
  }

  const badge = statusBadge[order.status] ?? statusBadge.PENDING;
  const date = new Date(order.createdAt).toLocaleDateString("cs-CZ");

  // Map subOrders pro template
  const subOrders = order.subOrders.map((so) => ({
    id: so.id,
    status: so.status,
    deliveryMethod: so.deliveryMethod,
    zasilkovnaPointName: so.zasilkovnaPointName,
    trackingNumber: so.trackingNumber,
    shippedAt: so.shippedAt,
    deliveredAt: so.deliveredAt,
    subtotal: so.subtotal,
    shippingPrice: so.shippingPrice,
    supplierName: so.supplier.companyName ?? `${so.supplier.firstName} ${so.supplier.lastName}`,
    items: so.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
      part: i.part,
    })),
  }));

  return (
    // ... JSX identicky jako original, ale bez loading/error states
    // Vsechny data primo z Prisma, zadne useState
    // Dates formatovany inline: new Date(order.shippedAt).toLocaleDateString("cs-CZ")
  );
}
```

### Diff shruti
- **Odebrano:** `"use client"`, `useState` (3x), `useEffect`, `use(params)`, `loading` state, skeleton loader, error state handling, client-side fetch
- **Pridano:** `import { prisma }`, `import { notFound }`, `params: Promise<{ token: string }>` (async), Prisma findUnique query, `export const metadata` s `robots: noindex`
- **Zachovano:** Cela JSX struktura, `mapToTrackerStatus`, `statusBadge`, `OrderTracker`, vsechny `<Card>` sekce, SubOrders rendering
- **Beze zmeny:** Vizualni vystup 1:1 identicky

### Dulezite: Date serializace
Prisma vraci `Date` objekty. V SSR se pouzivaji primo:
```tsx
// PRED (client — string z API):
new Date(order.createdAt).toLocaleDateString("cs-CZ")

// PO (SSR — Date z Prisma):
order.createdAt.toLocaleDateString("cs-CZ")
// NEBO: new Date(order.createdAt).toLocaleDateString("cs-CZ") — funguje oboji
```

### Poznamka k SubOrder modelu
Prisma query pouziva `order.subOrders` — overit, ze model `SubOrder` (nebo `OrderSplit`) existuje v schema.prisma s relaci na `Order`. API route to pouziva, takze model existuje.

---

## Soubor 2: `app/(web)/muj-ucet/profil/setup/page.tsx` (780 radku)

### Aktualni stav
- "use client" na cele strance
- 5-krokovy wizard: Fotky → Specializace → Jazyky → Kontakty → Prehled
- Tezka interaktivita: step navigace, image upload (Cloudinary), toggle buttony, text inputy, incremental save (PUT /api/profile/edit po kazdem kroku)
- 5 sub-komponent: `StepPhotos`, `StepSpecializations`, `StepLanguages`, `StepContacts`, `StepReview`
- `useRouter` pro redirect po dokonceni
- `useEffect` pro nacitani existujiciho profilu
- `useState` (6x): step, data, loading, saving, error

### Plan

1. **Presunout** cely obsah do `components/web/ProfileSetupWizard.tsx` — client component
2. **Prevest** `app/(web)/muj-ucet/profil/setup/page.tsx` na Server Component s auth + metadata

### Proc NEVYTAHOVAT data na server
Wizard nacita profil pri mount a pak **inkrementalne uklada** po kazdem kroku. Server-side pre-fetch by:
- Pridala slozitost (serialization Json fields: specializations, socialLinks, services)
- Neprinasela velky benefit (wizard je 100% interaktivni, loading stav je 1-2s)
- Risiko desynchronizace mezi SSR daty a wizard state

Proto: SSR page jen wrapuje client wizard + pridava auth guard a metadata.

### Novy soubor: `components/web/ProfileSetupWizard.tsx`

Doslovny presun celeho obsahu z `page.tsx` — vsech 780 radku vcetne sub-komponent (`StepPhotos`, `StepSpecializations`, `StepLanguages`, `StepContacts`, `StepReview`, `ReviewField`).

**Jedine zmeny:**
- Exportovat jako `export function ProfileSetupWizard()` (named export misto `export default`)
- Zachovat `"use client"` na radku 1

### Upraveny soubor: `app/(web)/muj-ucet/profil/setup/page.tsx`

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileSetupWizard } from "@/components/web/ProfileSetupWizard";

export const metadata: Metadata = {
  title: "Nastavit profil",
  robots: { index: false, follow: false },
};

export default async function ProfileSetupPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return <ProfileSetupWizard />;
}
```

### Diff shruti
- **Page:** Z 780 radku na ~15 radku. Odebrano "use client", vsechny importy, cely wizard kod.
- **Novy soubor:** `ProfileSetupWizard.tsx` — 780 radku, 1:1 kopie originalu s `export function` misto `export default function`.
- **Pridano v page:** Auth guard (`getServerSession` + `redirect`), metadata export
- **Beze zmeny:** Vizualni a funkcni chovani wizardu 1:1 identicky

---

## Soubor 3: `app/prezentace/page.tsx` (598 radku)

### Aktualni stav
- "use client", plne animovana prezentacni stranka (pitch deck pro partnery)
- **8 sekci** s Framer Motion animacemi (`motion.div`, `whileInView`, `whileHover`, `useInView`)
- Scroll-based section tracking + DotNav navigace
- QR code generovani (client-side `qrcode` knihovna)
- Volitelny `?manager=slug` searchParam → fetch profilu managera
- Suspense wrapper
- `companyInfo` import (staticky objekt)
- `CzechMap` SVG komponenta (staticka, ale vnorena v animovane sekci)

### Verdikt: ZUSTAVA CLIENT

**Duvody proc NEKONVERTOVAT na SSR:**
1. **95% obsahu pouziva Framer Motion** — `AnimatedSection`, `motion.div` s `initial/animate/whileInView/whileHover` na temer kazdem elementu
2. **Scroll tracking** — `containerRef` + scroll event listener + `setActiveSection` → kazdy scroll triggeruje re-render
3. **QR code** — `QRCode.toDataURL()` je asynchronni client-side operace
4. **Manager fetch** — `useSearchParams` + conditional fetch na `/api/profile/${slug}`
5. Extrakce na SSR by vyzadovala rozdelit 8 sekci na 8+ client komponent s predanymi props — vice kodu, zadny realny benefit

**Co PRIDAT bez SSR konverze:**
- `generateMetadata` — neni mozne na "use client" page. Reseni: presunout do `app/prezentace/layout.tsx` nebo vytvorit wrapper.

### Plan: Wrapper s metadata

**Varianta A (doporucena):** Presunout obsah do `components/web/PrezentaceContent.tsx` (client), page bude SSR wrapper.

```tsx
// app/prezentace/page.tsx (SSR wrapper)
import type { Metadata } from "next";
import { PrezentacePage } from "@/components/web/PrezentacePage";

export const metadata: Metadata = {
  title: "Prezentace pro partnery",
  description: "CarMakler — sit certifikovanych makleru. Nabidka spoluprace pro autobazary a vrakoviste.",
  openGraph: {
    title: "CarMakler — Prezentace pro partnery",
    description: "Spoluprace pro autobazary a vrakoviste. Transparentni provize, zadne vstupni naklady.",
  },
};

export default function PrezentacePageWrapper() {
  return <PrezentacePage />;
}
```

```tsx
// components/web/PrezentacePage.tsx
// Presun celeho obsahu z puvodniho page.tsx — 598 radku
// export function PrezentacePage() { ... } (named export)
```

### Diff shruti
- **Page:** Z 598 na ~15 radku. "use client" odebrano z page, presunuto do component.
- **Novy soubor:** `PrezentacePage.tsx` — 598 radku, doslovny presun s `export function` misto `export default function`, Suspense wrapper ODEBRAN (zustava jen `PrezentaceContent` vnitrni komponenta + Suspense UVNITR client componentu).
- **Pridano:** `export const metadata` pro SEO, OG tagy

---

## Soubor 4: `app/(admin)/admin/team/page.tsx` (413 radku)

### Aktualni stav
- "use client", CRUD admin stranka pro cleny tymu
- Fetch `/api/admin/team`, operace: pridani, editace, smazani, reorder
- Photo upload pres `/api/upload`
- `useState` (7x): members, loading, editing, form, saving, uploading, error
- `useRef` pro file input
- `useCallback` pro fetchMembers

### Plan

1. **Presunout** CRUD logiku do `components/admin/TeamManager.tsx` — client component
2. **Prevest** page na Server Component s Prisma pre-fetch

### Proc PRE-FETCHOVAT na serveru (na rozdil od profil/setup)
- Admin strana **zacina zobrazenim seznamu** — ne formularem
- Pre-fetch eliminuje loading spinner pri prvnim renderovani
- Prisma query je jednoducha: `prisma.teamMember.findMany({ orderBy: { order: "asc" } })`
- Data se predaji jako `initialMembers` prop — klient je pouzije okamzite

### Overit: Prisma model TeamMember

Overit ze existuje `TeamMember` model v schema.prisma. API route `/api/admin/team` ho pouziva, takze model musi existovat.

### Novy soubor: `components/admin/TeamManager.tsx`

```tsx
"use client";

// Presun celeho obsahu z page.tsx — 413 radku
// Zmeny:
// 1. export function TeamManager({ initialMembers }: { initialMembers: TeamMember[] })
// 2. useState<TeamMember[]>(initialMembers) misto useState([]) + useEffect fetch
// 3. fetchMembers() stale existuje pro refetch po CRUD operacich
// 4. Odebrat pocatecni loading state (data uz jsou k dispozici)

interface TeamManagerProps {
  initialMembers: TeamMember[];
}

export function TeamManager({ initialMembers }: TeamManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [loading, setLoading] = useState(false); // false — data uz mame
  // ... zbytek logiky identicky
}
```

### Upraveny soubor: `app/(admin)/admin/team/page.tsx`

```tsx
import { prisma } from "@/lib/prisma";
import { TeamManager } from "@/components/admin/TeamManager";

export default async function AdminTeamPage() {
  const members = await prisma.teamMember.findMany({
    orderBy: { order: "asc" },
  });

  // Serializace Date -> string pro client component
  const serialized = members.map((m) => ({
    id: m.id,
    name: m.name,
    initials: m.initials,
    position: m.position,
    bio: m.bio,
    photoUrl: m.photoUrl,
    order: m.order,
    isPublic: m.isPublic,
  }));

  return (
    <div>
      <TeamManager initialMembers={serialized} />
    </div>
  );
}
```

### Diff shruti
- **Page:** Z 413 na ~25 radku. "use client" odebrano, Prisma pre-fetch pridan.
- **Novy soubor:** `TeamManager.tsx` — ~400 radku, prevzato z page s `initialMembers` prop.
- **Zmena UX:** Zadny loading spinner pri prvnim load — seznam clenu zobrazen okamzite v HTML.

---

## Soubor 5: `app/(admin)/admin/reviews/page.tsx` (317 radku)

### Aktualni stav
- Identicky pattern jako admin/team — "use client" CRUD stranka
- Fetch `/api/admin/reviews`, operace: pridani, editace, smazani, toggle published/featured
- `useState` (6x): reviews, loading, editing, form, saving, error

### Plan

1. **Presunout** CRUD logiku do `components/admin/ReviewsManager.tsx` — client component
2. **Prevest** page na Server Component s Prisma pre-fetch

### Overit: Prisma model Review

Overit ze existuje `Review` model v schema.prisma.

### Novy soubor: `components/admin/ReviewsManager.tsx`

```tsx
"use client";

// Presun z page.tsx — 317 radku
// Zmeny:
// 1. export function ReviewsManager({ initialReviews }: { initialReviews: Review[] })
// 2. useState<Review[]>(initialReviews)
// 3. Odebrat pocatecni loading state

interface ReviewsManagerProps {
  initialReviews: Review[];
}

export function ReviewsManager({ initialReviews }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  // ... zbytek identicky, fetchReviews() pro refetch po CRUD
}
```

### Upraveny soubor: `app/(admin)/admin/reviews/page.tsx`

```tsx
import { prisma } from "@/lib/prisma";
import { ReviewsManager } from "@/components/admin/ReviewsManager";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    authorCity: r.authorCity,
    text: r.text,
    rating: r.rating,
    type: r.type,
    isPublished: r.isPublished,
    isFeatured: r.isFeatured,
    source: r.source,
    createdAt: r.createdAt.toISOString(), // Date -> string serializace
  }));

  return (
    <div>
      <ReviewsManager initialReviews={serialized} />
    </div>
  );
}
```

### Diff shruti
- **Page:** Z 317 na ~25 radku.
- **Novy soubor:** `ReviewsManager.tsx` — ~300 radku.
- **Zmena UX:** Zadny loading spinner pri prvnim load.
- **Date serializace:** `createdAt` se prevadi na ISO string pro client component.

---

## Poznamky pro implementatora

### 1. Prisma model overeni
Pred implementaci overit existenci modelu v `prisma/schema.prisma`:
- `Order.guestToken` pole (pro sledovani)
- `Order.subOrders` relace (pro multi-supplier objednavky)
- `TeamMember` model (pro admin team)
- `Review` model (pro admin recenze)

### 2. Date serializace pattern
Kdyz SSR page predava data do client componentu, Prisma `Date` objekty **nelze serializovat** pres RSC boundary. Reseni:
```tsx
// V SSR page:
createdAt: r.createdAt.toISOString()

// V client componentu:
new Date(createdAt).toLocaleDateString("cs-CZ")
```

Pro stranku **bez** client componentu (sledovani) lze pouzit `Date` primo:
```tsx
order.createdAt.toLocaleDateString("cs-CZ")
```

### 3. Admin stranky — SEO metadata
Admin stranky **NEMUSI** mit metadata export — nejsou indexovane. Ale mohou ho mit pro lepsi tab title v prohlizeci. Volitelne.

### 4. Prezentace layout
`app/prezentace/page.tsx` je MIMO `(web)` layout group — nema header/footer webu. Toto zachovat — prezentace je standalone fullscreen stranka.

### 5. OrderTracker Server Component
`OrderTracker` je uz Server Component — proto sledovaci stranka muze byt 100% SSR bez jakehokoliv client componentu. Toto je unikat v celem projektu.

### 6. ProfileSetupWizard — bez pre-fetch
Na rozdil od admin stranek (team, reviews) wizard profilu **NEMA** server-side pre-fetch. Duvod: wizard ma slozitou inicializaci (JSON.parse specializations, socialLinks destructuring) a inkrementalni save — jednodussi nechat fetch na klientu.

---

## Kontrolni checklist po implementaci

### Sledovani objednavky
- [ ] Page NEMA "use client"
- [ ] curl `/shop/objednavky/sledovani/{validni-token}` vraci kompletni HTML s objednavkou
- [ ] Neplatny/kratky token zobrazi "Objednavka nenalezena"
- [ ] Neexistujici token zobrazi "Objednavka nenalezena"
- [ ] SubOrders se zobrazuji spravne (multi-supplier)
- [ ] OrderTracker ukazuje spravny stav

### Profil setup
- [ ] Page NEMA "use client"
- [ ] Neprihlaseny uzivatel redirectovan na /login
- [ ] Wizard funguje identicky — vsech 5 kroku
- [ ] Image upload funguje (Cloudinary)
- [ ] Incremental save funguje po kazdem kroku
- [ ] Redirect po dokonceni na /profil/{slug}

### Prezentace
- [ ] Page NEMA "use client" (wrapper je SSR)
- [ ] `<title>` a OG tagy pritomny v HTML
- [ ] Vsechny animace funguji
- [ ] DotNav scroll tracking funguje
- [ ] ?manager=slug parameter funguje (manager info zobrazeno)
- [ ] QR kod generovan

### Admin team
- [ ] Page NEMA "use client"
- [ ] Prvni load je BEZ loading spinneru (data pre-fetched)
- [ ] CRUD operace funguji (pridat, upravit, smazat, reorder)
- [ ] Photo upload funguje

### Admin reviews
- [ ] Page NEMA "use client"
- [ ] Prvni load je BEZ loading spinneru
- [ ] CRUD operace funguji (pridat, upravit, smazat)
- [ ] Toggle published/featured funguje

### Globalni
- [ ] `npm run build` projde bez chyb
- [ ] Zadny vizualni regression na zadne strance

---

## Poradi implementace

1. `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` — 100% SSR (zadny novy soubor)
2. `components/web/ProfileSetupWizard.tsx` — presun z page
3. `app/(web)/muj-ucet/profil/setup/page.tsx` — SSR wrapper
4. `components/web/PrezentacePage.tsx` — presun z page
5. `app/prezentace/page.tsx` — SSR wrapper + metadata
6. `components/admin/TeamManager.tsx` — presun z page
7. `app/(admin)/admin/team/page.tsx` — SSR s pre-fetch
8. `components/admin/ReviewsManager.tsx` — presun z page
9. `app/(admin)/admin/reviews/page.tsx` — SSR s pre-fetch

Kroky 2+3, 4+5, 6+7, 8+9 jsou pary (component + page). Kazdy par je nezavisly.

---

## Odhad casu

| Krok | Cas |
|------|-----|
| Sledovani — 100% SSR | 1.5h |
| Profil setup — extract + wrapper | 0.5h |
| Prezentace — extract + metadata | 0.5h |
| Admin team — extract + pre-fetch | 1h |
| Admin reviews — extract + pre-fetch | 1h |
| Testovani + ladeni | 1h |
| **Celkem** | **5.5h** |
