# SSR Migrace — Faze 3: Uzivatelsky ucet (10 stranek)

**Datum:** 2026-05-05
**Rozsah:** 10 stranek + 8 novych client komponent
**Zavislost:** Faze 2 (layout SSR) musi byt hotova — jinak children sloty nebudou SSR

---

## Spolecny vzor pro vsechny stranky

Kazda stranka nasleduje stejny pattern:

```tsx
// page.tsx (Server Component — BEZ "use client")
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function XyzPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const data = await prisma.someModel.findMany({
    where: { userId: session.user.id },
    // ... select/include
  });

  return <XyzContent initialData={data} />;
}
```

**Auth pattern:** `getServerSession(authOptions)` — overeno v existujicich SSR strankach (marketplace/investor, marketplace/dealer, blog/[slug]).

**Redirect pattern:** `redirect("/login")` z `next/navigation` pro neprihlasene uzivatele.

**Data flow:** SSR page fetchne data pres Prisma → preda jako `initialData` prop do client komponenty.

---

## Stranka 1: `app/(web)/muj-ucet/page.tsx` (128 radku)

### Aktualni stav
- "use client", fetchuje `/api/buyer/stats` + `/api/profile/edit`
- Zobrazuje: StatCards (favorites/watchdogs/inquiries count) + ProfileCompletenessBar + Quick actions
- Quick actions jsou staticke Link karty — zadna interaktivita

### API endpointy → Prisma nahrada

**`/api/buyer/stats`** → 3 count queries:
```tsx
const [favoritesCount, watchdogsCount, inquiriesCount] = await Promise.all([
  prisma.favorite.count({ where: { userId: session.user.id, listingId: { not: null } } }),
  prisma.watchdog.count({ where: { userId: session.user.id } }),
  prisma.inquiry.count({ where: { senderId: session.user.id } }),
]);
```

**`/api/profile/edit`** → select profil pro ProfileCompletenessBar:
```tsx
const profile = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: {
    avatar: true, coverPhoto: true, bio: true, city: true,
    motto: true, yearsExperience: true, website: true,
    specializations: true, services: true, languageSkills: true,
    socialLinks: true,
  },
});
```

### Plan

1. **Stranka se stane z 90% SSR** — StatCards a Quick actions jsou ciste staticky JSX
2. **Client island:** `ProfileCompletenessBar` (uz je client component) — dostane data jako props
3. **NENI treba novy soubor** — stacke odebrat "use client" a pouzit existujici `ProfileCompletenessBar`

### Zmeny v `page.tsx`

**Odebrat:** `"use client"`, `useState`, `useEffect`, loading spinner, oba `fetch()` cally
**Pridat:** `getServerSession`, `authOptions`, `redirect`, `prisma`, `async` na funkci
**Beze zmeny:** JSX struktura, CSS tridy, StatCard pouziti, Quick actions karty

### Vysledna kostra

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { ProfileCompletenessBar } from "@/components/profile/ProfileCompletenessBar";
import Link from "next/link";
import type { ProfileCompletenessInput } from "@/lib/profile-completeness";

export default async function MujUcetPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [favoritesCount, watchdogsCount, inquiriesCount, profile] = await Promise.all([
    prisma.favorite.count({ where: { userId: session.user.id, listingId: { not: null } } }),
    prisma.watchdog.count({ where: { userId: session.user.id } }),
    prisma.inquiry.count({ where: { senderId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        avatar: true, coverPhoto: true, bio: true, city: true,
        motto: true, yearsExperience: true, website: true,
        specializations: true, services: true, languageSkills: true,
        socialLinks: true,
      },
    }),
  ]);

  const completenessInput: ProfileCompletenessInput | null = profile
    ? {
        avatar: profile.avatar ?? null,
        coverPhoto: profile.coverPhoto ?? null,
        bio: profile.bio ?? null,
        city: profile.city ?? null,
        motto: profile.motto ?? null,
        yearsExperience: profile.yearsExperience ?? null,
        website: profile.website ?? null,
        specializations: profile.specializations as string | null,
        services: profile.services as string[] | null,
        languageSkills: profile.languageSkills as string[] | null,
        socialLinks: profile.socialLinks as Record<string, string> | null,
      }
    : null;

  return (
    <div className="space-y-6">
      {completenessInput && <ProfileCompletenessBar user={completenessInput} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<span>&#9829;</span>} iconColor="red" value={String(favoritesCount)} label="Oblíbené vozy" />
        <StatCard icon={<span>&#128276;</span>} iconColor="blue" value={String(watchdogsCount)} label="Hlídací psi" />
        <StatCard icon={<span>&#128172;</span>} iconColor="green" value={String(inquiriesCount)} label="Odeslaných dotazů" />
      </div>

      {/* Quick actions — staticke Link karty, 1:1 z originalu */}
      <Card className="p-6">
        {/* ... beze zmeny ... */}
      </Card>
    </div>
  );
}
```

### Slozitost: Nizka (1h)
- Zadny novy soubor
- Jen nahrada fetch → prisma + odebrani "use client"

---

## Stranka 2: `app/(web)/muj-ucet/profil/page.tsx` (573 radku)

### Aktualni stav
- "use client", fetchuje `/api/profile/edit` + `/api/profile/tags`
- Obrovska formularova stranka: ~20 useState hooks, form onSubmit, ImageUpload, TagInput
- 95% kodu je interaktivni formular — NELZE rozdelit na SSR casti

### Plan

1. **Vytvorit** `components/web/ProfileEditor.tsx` — presunout 100% aktualniho kodu (cely formular)
2. **Page.tsx** bude tenky SSR wrapper: auth + prisma fetch → predani dat jako props

### Novy soubor: `components/web/ProfileEditor.tsx`

- Presunout VSECHNO z aktualniho `page.tsx` (radky 1-573)
- Zmenit `export default function ProfileEditPage()` → `export function ProfileEditor({ initialData, initialTags }: Props)`
- Odebrat `useEffect` fetch — data prijdou z props
- Zachovat `useState` inicializaci z `initialData` misto z fetch response
- Zachovat `handleSave` (PUT request) — zustavaji client-side mutations

### Interface pro props

```tsx
interface ProfileEditorProps {
  initialData: ProfileEditData;
  initialTags: TagInputValue[];
}
```

### Prisma query v page.tsx

```tsx
const [user, tags] = await Promise.all([
  prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, firstName: true, lastName: true, bio: true,
      avatar: true, coverPhoto: true, city: true, slug: true,
      favoriteBrands: true, showPhone: true, showEmail: true,
      phone: true, email: true, role: true,
      yearsExperience: true, website: true, motto: true,
      socialLinks: true, services: true, languageSkills: true,
      specializations: true, warehouseAddress: true, openingHours: true,
    },
  }),
  prisma.userTag.findMany({
    where: { userId: session.user.id },
    select: { id: true, label: true, slug: true },
  }),
]);
```

**Poznamka:** Overit jestli existuje model `UserTag` — pokud ne, API `/api/profile/tags` muze pouzivat jinou tabulku. Implementator musi zkontrolovat.

### Vysledna kostra page.tsx

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileEditor } from "@/components/web/ProfileEditor";

export default async function ProfileEditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [user, tags] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { /* viz vyse */ } }),
    prisma.userTag.findMany({ where: { userId: session.user.id }, select: { id: true, label: true, slug: true } }),
  ]);

  if (!user) redirect("/login");

  return <ProfileEditor initialData={user} initialTags={tags} />;
}
```

### Zmeny v ProfileEditor.tsx oproti originalu

1. **Radek 1:** Zachovat `"use client"`
2. **Radek 55:** Zmenit `export default function ProfileEditPage()` → `export function ProfileEditor({ initialData, initialTags }: ProfileEditorProps)`
3. **Radky 56-59:** Zmenit inicializaci `useState`:
   - `const [data, setData] = useState<ProfileEditData | null>(null)` → `const [data, setData] = useState<ProfileEditData>(initialData)`
   - `const [loading, setLoading] = useState(true)` → ODEBRAT (neni treba)
   - `const [tags, setTags] = useState<TagInputValue[]>([])` → `const [tags, setTags] = useState<TagInputValue[]>(initialTags)`
4. **Radky 62-84:** Inicializace vsech form states z `initialData` rovnou v useState (misto v useEffect)
5. **Radky 86-133:** ODEBRAT cely `useEffect` s fetch
6. **Radky 210-216:** ODEBRAT loading spinner (data jsou SSR-prefetched)
7. **Vse ostatni** (form JSX, handleSave, addBrand, removeBrand): Beze zmeny

### Slozitost: Stredni (2h)
- Novy soubor `ProfileEditor.tsx` (copy-paste + refactor)
- Pozor na spravnou inicializaci vsech 20+ useState z props

---

## Stranka 3: `app/(web)/muj-ucet/oblibene/page.tsx` (159 radku)

### Aktualni stav
- "use client", fetchuje `/api/favorites`
- Zobrazuje grid oblibenych vozidel s obrazky
- Interaktivita: `removeFavorite()` (POST /api/favorites toggle)
- `EmptyState` s `onAction={() => window.location.href = "/nabidka"}`

### Plan

1. **Vytvorit** `components/web/FavoritesList.tsx` — client component s remove akci
2. **Page.tsx** = SSR wrapper: auth + prisma fetch → props

### Prisma query

```tsx
const favorites = await prisma.favorite.findMany({
  where: { userId: session.user.id, listingId: { not: null } },
  include: {
    listing: {
      select: {
        id: true, slug: true, brand: true, model: true,
        variant: true, year: true, mileage: true, price: true,
        fuelType: true, city: true, status: true,
        images: { select: { url: true, isPrimary: true } },
      },
    },
  },
  orderBy: { createdAt: "desc" },
});
```

### Novy soubor: `components/web/FavoritesList.tsx`

```tsx
"use client";
// Presunout:
// - FavoriteListing interface
// - formatPrice helper
// - favorites state (inicializace z props)
// - removeFavorite funkce
// - JSX (grid + empty state)
// Z page.tsx odebrat: useEffect, fetch, loading state

interface FavoritesListProps {
  initialFavorites: FavoriteListing[];
}

export function FavoritesList({ initialFavorites }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<FavoriteListing[]>(initialFavorites);
  // ... removeFavorite, JSX beze zmeny
}
```

### Vysledna kostra page.tsx

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FavoritesList } from "@/components/web/FavoritesList";

export default async function OblibenePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id, listingId: { not: null } },
    include: {
      listing: {
        select: {
          id: true, slug: true, brand: true, model: true,
          variant: true, year: true, mileage: true, price: true,
          fuelType: true, city: true, status: true,
          images: { select: { url: true, isPrimary: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serializace pro client (Prisma vraci Date objekty)
  const serialized = favorites.map((f) => ({
    id: f.id,
    listingId: f.listingId!,
    listing: f.listing!,
  }));

  return <FavoritesList initialFavorites={serialized} />;
}
```

### Slozitost: Nizka (1h)

---

## Stranka 4: `app/(web)/muj-ucet/dotazy/page.tsx` (163 radku)

### Aktualni stav
- "use client", fetchuje `/api/buyer/inquiries`
- Read-only zobrazeni dotazu s odpovedi
- Jedina interaktivita: `EmptyState onAction` (redirect)

### Plan

Tato stranka je z 95% read-only — **skoro cela muze byt SSR**.

1. **Page.tsx** = SSR, renderuje cely seznam
2. **Maly client island:** Jen `EmptyState` s `onAction` (ktery pouziva `window.location.href`)
3. **Alternativa:** Nahradit `EmptyState onAction` za `<Link>` a nebude treba ZADNY client component

### Prisma query

```tsx
const inquiries = await prisma.inquiry.findMany({
  where: { senderId: session.user.id },
  include: {
    listing: {
      select: {
        id: true, slug: true, brand: true, model: true,
        variant: true, year: true, price: true,
        images: { select: { url: true, isPrimary: true } },
      },
    },
  },
  orderBy: { createdAt: "desc" },
});
```

### Vysledna kostra page.tsx (cista SSR verze)

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function formatDate(date: Date): string {
  return date.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(price);
}

export default async function DotazyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const inquiries = await prisma.inquiry.findMany({
    where: { senderId: session.user.id },
    include: { listing: { select: { /* viz vyse */ } } },
    orderBy: { createdAt: "desc" },
  });

  if (inquiries.length === 0) {
    return (
      // SSR EmptyState BEZ onAction — pouzit Link misto window.location
      <div className="text-center py-20">
        <div className="text-4xl mb-3">&#128172;</div>
        <h3 className="text-xl font-bold text-gray-900">Zatím jste neodeslali žádné dotazy</h3>
        <p className="text-gray-500 mt-2">Při procházení nabídky můžete poslat dotaz prodejci.</p>
        <Link href="/nabidka" className="inline-block mt-4 text-orange-500 font-semibold no-underline">
          Prohlédnout nabídku &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Moje dotazy ({inquiries.length})</h2>
      <div className="space-y-4">
        {/* 1:1 JSX z originalu, jen formatDate(inquiry.createdAt) misto formatDate(string) */}
      </div>
    </div>
  );
}
```

### Poznamka
- `EmptyState onAction` pouziva `window.location.href` — v SSR variante nahradit za `<Link>`
- `formatDate` musi akceptovat `Date` objekt (Prisma) misto `string` (API response)
- **ZADNY novy client component soubor!**

### Slozitost: Nizka (45min)

---

## Stranka 5: `app/(web)/muj-ucet/garaz/page.tsx` (258 radku)

### Aktualni stav
- "use client", fetchuje `/api/garage`
- Interaktivita: add form (POST), delete (DELETE), set default (PUT), toggle form visibility
- Prisma model: `CustomerGarage` (potvrzeno v schema.prisma radek 2059)

### Plan

1. **Vytvorit** `components/web/GarageManager.tsx` — client component s celym CRUD
2. **Page.tsx** = SSR wrapper: auth + prisma fetch → props

### Prisma query

```tsx
const cars = await prisma.customerGarage.findMany({
  where: { userId: session.user.id },
  orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
});
```

### Novy soubor: `components/web/GarageManager.tsx`

```tsx
"use client";
// Presunout vse z page.tsx krome:
// - "use client" directive (zachovat)
// - useEffect + fetch (nahradit props inicializaci)
// Zmenit: export default function GaragePage() → export function GarageManager({ initialCars }: Props)
// Zmenit: useState<GarageCar[]>([]) → useState<GarageCar[]>(initialCars)
// Odebrat: fetchCars() volani v useEffect (ale ZACHOVAT funkci fetchCars pro re-fetch po CRUD!)

interface GarageManagerProps {
  initialCars: GarageCar[];
}
```

**DULEZITE:** `fetchCars()` funkce musi zustat v client komponente, protoze se vola po POST/DELETE/PUT akcich pro refresh dat. Jen pocatecni load je SSR.

### Vysledna kostra page.tsx

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GarageManager } from "@/components/web/GarageManager";

export default async function GaragePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const cars = await prisma.customerGarage.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  const serialized = cars.map((c) => ({
    id: c.id,
    brand: c.brand,
    model: c.model,
    year: c.year,
    vin: c.vin,
    nickname: c.nickname,
    isDefault: c.isDefault,
    createdAt: c.createdAt.toISOString(),
  }));

  return <GarageManager initialCars={serialized} />;
}
```

### Slozitost: Nizka (1h)

---

## Stranka 6: `app/(web)/muj-ucet/poptavky/page.tsx` (176 radku)

### Aktualni stav
- "use client", fetchuje `/api/part-requests`
- Read-only zobrazeni poptavek s nabidkami od vrakovist
- Jedina "interaktivita": empty state — ale bez onAction (jen staticke info)

### Plan

**100% SSR stranka** — zadna interaktivita, zadny novy client component!

### Prisma query

```tsx
const requests = await prisma.partRequest.findMany({
  where: { buyerId: session.user.id },
  include: {
    offers: {
      include: {
        supplier: {
          select: { companyName: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    },
    _count: { select: { offers: true } },
  },
  orderBy: { createdAt: "desc" },
});
```

### Vysledna kostra page.tsx

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// STATUS_MAP, formatDate, formatPrice — presunout sem jako server-side helpery

export default async function PoptavkyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const requests = await prisma.partRequest.findMany({ /* viz vyse */ });

  // 1:1 JSX z originalu, jen Date objekty misto stringy
  return (
    <div className="space-y-6">
      {/* ... identicky JSX ... */}
    </div>
  );
}
```

### Poznamka
- `formatDate` musi akceptovat `Date` (Prisma) misto `string` (API)
- `formatPrice` — PartRequestOffer.price je `Int` v Prisma (centy?) — overit

### Slozitost: Nizka (45min)

---

## Stranka 7: `app/(web)/moje-inzeraty/page.tsx` (303 radku)

### Aktualni stav
- "use client", fetchuje `/api/listings/my`
- Interaktivita: Tabs filter, Dropdown akce (activate/deactivate/delete/premium), Modal, EmptyState onAction
- Pouziva: `Tabs`, `Dropdown`, `Modal`, `StatusPill`, `EmptyState`, `Button`

### Plan

1. **Vytvorit** `components/web/MyListingsManager.tsx` — client component s tabs + akce
2. **Page.tsx** = SSR wrapper: auth + prisma fetch → props

### Prisma query

```tsx
const listings = await prisma.listing.findMany({
  where: { userId: session.user.id },
  select: {
    id: true, slug: true, brand: true, model: true,
    variant: true, year: true, price: true, status: true,
    viewCount: true, inquiryCount: true, isPremium: true,
    createdAt: true,
    images: { select: { url: true, isPrimary: true } },
  },
  orderBy: { createdAt: "desc" },
});

// maxListings — z user settings nebo pevna hodnota
// Aktualni API /api/listings/my pravdepodobne vraci i maxListings
// Implementator musi zkontrolovat API route a replikovat logiku
```

### Novy soubor: `components/web/MyListingsManager.tsx`

```tsx
"use client";
// Presunout:
// - Vsechny interfaces, statusTabs, helper funkce
// - Veskerou interaktivitu (Tabs state, handleAction, deleteModal)
// - Kompletni JSX
// Zmenit: props inicializace misto useEffect fetch
// Zachovat: fetchListings() pro re-fetch po akcich

interface MyListingsManagerProps {
  initialListings: Listing[];
  maxListings: number | null;
}

export function MyListingsManager({ initialListings, maxListings: initialMax }: MyListingsManagerProps) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [maxListings, setMaxListings] = useState<number | null>(initialMax);
  // ... zbytek beze zmeny
}
```

### Vysledna kostra page.tsx

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MyListingsManager } from "@/components/web/MyListingsManager";

export default async function MojeInzeratyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const listings = await prisma.listing.findMany({
    where: { userId: session.user.id },
    select: { /* viz vyse */ },
    orderBy: { createdAt: "desc" },
  });

  // maxListings logiku prekopirovat z API route
  const maxListings = 10; // TODO: implementator zjisti z API route

  const serialized = listings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  return <MyListingsManager initialListings={serialized} maxListings={maxListings} />;
}
```

### Slozitost: Stredni (1.5h)

---

## Stranka 8: `app/(web)/moje-inzeraty/[id]/page.tsx` (417 radku)

### Aktualni stav
- "use client", `useParams()` + `useRouter()`, fetchuje `/api/listings/${id}` + `/api/listings/${id}/inquiry`
- Interaktivita: reply form (Textarea + submit), promote/extend akce (fetch + redirect), router.back()
- Zobrazuje: StatCards, fotogalerie, detail info, inquiry list s reply formularem

### Plan

1. **Vytvorit** `components/web/ListingDetailManager.tsx` — client component
2. **Page.tsx** = SSR wrapper: auth + prisma fetch + params → props

### DULEZITE: Dynamic route params

`[id]` param prichazi z Next.js jako server-side prop:
```tsx
export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
```

### Prisma queries

```tsx
const listing = await prisma.listing.findFirst({
  where: { id, userId: session.user.id },
  include: {
    images: { orderBy: { order: "asc" } },
    inquiries: {
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true,
        message: true, reply: true, repliedAt: true,
        status: true, read: true, createdAt: true,
      },
    },
  },
});

if (!listing) {
  // 404 nebo redirect
  return notFound();
}
```

### Novy soubor: `components/web/ListingDetailManager.tsx`

```tsx
"use client";
// Presunout:
// - Interfaces (ListingDetail, InquiryItem)
// - Helper funkce (formatPrice, formatDate, getStatusVariant)
// - InfoRow component
// - Vsechnu interaktivitu (replyText state, handleReply, promote onClick)
// - Kompletni JSX

// Zmenit:
// - Odebrat useParams (id preda page.tsx)
// - Odebrat useEffect fetch (data z props)
// - Zachovat useRouter pro router.back()
// - Zachovat fetchListing() pro refresh po reply/promote

interface ListingDetailManagerProps {
  initialListing: ListingDetail;
  listingId: string;
}

export function ListingDetailManager({ initialListing, listingId }: ListingDetailManagerProps) {
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail>(initialListing);
  // ... replyText, replyLoading, handleReply, JSX beze zmeny
}
```

### Vysledna kostra page.tsx

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ListingDetailManager } from "@/components/web/ListingDetailManager";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const listing = await prisma.listing.findFirst({
    where: { id, userId: session.user.id },
    include: {
      images: { orderBy: { order: "asc" } },
      inquiries: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!listing) notFound();

  // Serializace Date objektu pro client component
  const serialized = {
    ...listing,
    createdAt: listing.createdAt.toISOString(),
    publishedAt: listing.publishedAt?.toISOString() ?? null,
    images: listing.images.map((img) => ({ ...img, createdAt: img.createdAt.toISOString() })),
    inquiries: listing.inquiries.map((inq) => ({
      ...inq,
      createdAt: inq.createdAt.toISOString(),
      repliedAt: inq.repliedAt?.toISOString() ?? null,
    })),
  };

  return <ListingDetailManager initialListing={serialized} listingId={id} />;
}
```

### Poznamka
- `useParams()` se odebere — `id` preda SSR page z route params
- `useRouter()` zustane v client komponente pro `router.back()`
- Date serializace je kriticka — Prisma vraci Date, client ocekava string

### Slozitost: Stredni-vysoka (2h)

---

## Stranka 9: `app/(web)/shop/moje-objednavky/page.tsx` (185 radku)

### Aktualni stav
- "use client", fetchuje `/api/orders?role=buyer`
- Zobrazuje objednavky s OrderTracker komponentou
- Interaktivita: `OrderTracker` (client component), Link buttony pro vraceni/reklamaci

### Plan

Page je z 80% read-only. `OrderTracker` je uz client component.

1. **Page.tsx** = SSR — renderuje vsechny objednavky
2. **OrderTracker** zustva client island (uz existuje jako separatni component)
3. **Link buttony** pro vraceni/reklamaci jsou SSR-safe (jen `<Link>`)

### Prisma query

```tsx
const orders = await prisma.order.findMany({
  where: { buyerId: session.user.id },
  include: {
    items: {
      include: {
        part: {
          select: { name: true, slug: true, images: { select: { url: true }, take: 1 } },
        },
      },
    },
  },
  orderBy: { createdAt: "desc" },
});
```

### Vysledna kostra page.tsx

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OrderTracker } from "@/components/web/OrderTracker";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

// mapToTrackerStatus, statusBadge — presunout sem

export default async function MojeObjednavkyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const orders = await prisma.order.findMany({ /* viz vyse */ });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1:1 JSX z originalu */}
      {/* OrderTracker je client component — pouzit primo v SSR strance, Next.js to handluje */}
    </div>
  );
}
```

### Poznamka
- `OrderTracker` je client component importovany v Server Component — to je OK v Next.js
- Zadny novy soubor
- Loading skeleton nahradit za `loading.tsx` (Next.js streaming)

### Slozitost: Nizka (1h)

---

## Stranka 10: `app/(web)/dily/moje-objednavky/page.tsx` (155 radku)

### Aktualni stav
- Skoro identicky klon stranky 9 (`shop/moje-objednavky`)
- Rozdily: jiný back-link (`/dily` vs `/shop`), mírně jiný header text

### Plan

**Identicky postup jako stranka 9.** Stejne Prisma query, stejny pattern.

### Vysledna kostra

```tsx
// Stejna struktura jako shop/moje-objednavky/page.tsx
// Rozdily:
// - Zpet link: href="/dily" misto href="/shop"
// - Katalog link: href="/dily/katalog" misto href="/shop/katalog"
// - Header text: "Přehled vašich objednávek" misto "...z e-shopu"
```

### Poznamka
- **BUG v originalu:** `dily/moje-objednavky` ma return/reklamace linky smerujici na `/shop/moje-objednavky/${order.id}/vraceni` — melo by byt `/dily/moje-objednavky/...`? Implementator musi overit.

### Slozitost: Nizka (45min)

---

## Souhrn novych souboru

| # | Novy soubor | Typ | Pro stranku |
|---|-------------|-----|-------------|
| 1 | — | — | muj-ucet (zadny novy) |
| 2 | `components/web/ProfileEditor.tsx` | client | muj-ucet/profil |
| 3 | `components/web/FavoritesList.tsx` | client | muj-ucet/oblibene |
| 4 | — | — | muj-ucet/dotazy (100% SSR) |
| 5 | `components/web/GarageManager.tsx` | client | muj-ucet/garaz |
| 6 | — | — | muj-ucet/poptavky (100% SSR) |
| 7 | `components/web/MyListingsManager.tsx` | client | moje-inzeraty |
| 8 | `components/web/ListingDetailManager.tsx` | client | moje-inzeraty/[id] |
| 9 | — | — | shop/moje-objednavky (zadny novy) |
| 10 | — | — | dily/moje-objednavky (zadny novy) |

**Celkem: 5 novych client komponent, 5 stranek bez noveho souboru**

---

## Poradi implementace

1. `muj-ucet/page.tsx` — nejjednodussi, zadny novy soubor (45min)
2. `muj-ucet/dotazy/page.tsx` — 100% SSR, zadny novy soubor (45min)
3. `muj-ucet/poptavky/page.tsx` — 100% SSR, zadny novy soubor (45min)
4. `shop/moje-objednavky/page.tsx` — SSR + existujici OrderTracker (1h)
5. `dily/moje-objednavky/page.tsx` — klon stranky 4 (45min)
6. `muj-ucet/oblibene/page.tsx` — novy FavoritesList component (1h)
7. `muj-ucet/garaz/page.tsx` — novy GarageManager component (1h)
8. `moje-inzeraty/page.tsx` — novy MyListingsManager component (1.5h)
9. `moje-inzeraty/[id]/page.tsx` — novy ListingDetailManager + params (2h)
10. `muj-ucet/profil/page.tsx` — nejslozitejsi, 573 radku refaktor (2h)

**Celkovy odhad: ~11.5 hodiny**

---

## Spolecna rizika a upozorneni

### 1. Date serializace
Prisma vraci `Date` objekty. Client components ocekavaji `string` (ISO format). Kazda SSR page MUSI serializovat datumy pred predanim do client component:
```tsx
createdAt: item.createdAt.toISOString()
```

### 2. Json pole v Prisma
`services`, `languageSkills`, `socialLinks`, `openingHours`, `favoriteBrands` jsou `Json?` v Prisma. Typ v TypeScript je `Prisma.JsonValue` — implementator musi castovat:
```tsx
services: user.services as string[] | null
```

### 3. Re-fetch po mutacich
Client components MUSI zachovat `fetchXyz()` funkci pro re-fetch po CRUD operacich (POST/PUT/DELETE). SSR data jsou jen pocatecni load.

### 4. EmptyState onAction → Link
Vsude kde `EmptyState` pouziva `onAction={() => window.location.href = "..."}`, nahradit za `<Link>` pro SSR kompatibilitu. Pokud EmptyState zustava v client component, muze zustat beze zmeny.

### 5. `notFound()` vs redirect
Pro stranky kde data neexistuji (napr. listing detail), pouzit `notFound()` z `next/navigation` — vrati 404.

### 6. Overit UserTag model
Stranka 2 (profil) pouziva `/api/profile/tags` — implementator musi zjistit jaky Prisma model se pouziva (nemusi byt `UserTag` — muze byt custom tabulka).

---

## Kontrolni checklist po implementaci

Pro KAZDOU stranku:

- [ ] `page.tsx` NEMA "use client" na radku 1
- [ ] `getServerSession(authOptions)` + redirect pro neprihlasene
- [ ] Prisma query vraci spravna data (overit v Prisma Studio)
- [ ] Date objekty serializovany pred predanim do client component
- [ ] Client component inicializuje state z props (ne z useEffect)
- [ ] Client component zachovava re-fetch po mutacich
- [ ] `npm run build` projde bez chyb
- [ ] Vizualne identicky vysledek jako pred zmenou
- [ ] Loading states: pouzit `loading.tsx` misto inline spinner
