# SSR Migrace — Faze 4: Eshop formulare (11 stranek)

**Datum:** 2026-05-07
**Rozsah:** 11 stranek, z toho 5 zustava client, 1 uz je SSR, 5 se prevadi
**Zavislost:** Zadna (nezavisi na predchozich fazich)

---

## KRITICKE ZJISTENI: Kosik je v localStorage

`lib/cart.ts` je `"use client"` modul ktery pouziva `localStorage` pro persistenci kosiku:
```ts
const CART_KEY = "carmakler_cart";
function read(): CartItem[] {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}
```

**Dusledek:** Stranky kosiku a checkoutu (1-4) NEMOHOU byt SSR — server nema pristup k localStorage. Tyto stranky MUSI zustat "use client".

Stranka 9 (registrace) take nema zadny server-side data fetch — je to cisty formular.
Stranka 10 (pridat inzerat) uz JE SSR.

---

## Rozdeleni stranek dle akce

| # | Stranka | Akce | Duvod |
|---|---------|------|-------|
| 1 | shop/kosik | **ZUSTAT CLIENT** | localStorage cart |
| 2 | dily/kosik | **ZUSTAT CLIENT** | localStorage cart |
| 3 | shop/objednavka | **ZUSTAT CLIENT** | localStorage cart + multi-step form |
| 4 | dily/objednavka | **ZUSTAT CLIENT** | localStorage cart + reservace + multi-supplier |
| 5 | shop/objednavka/potvrzeni | **PREVEST NA SSR** | Staticka stranka, jen searchParams |
| 6 | dily/objednavka/potvrzeni | **PREVEST NA SSR** | Staticka stranka, jen searchParams |
| 7 | shop/moje-objednavky/[id]/reklamace | **SSR + CLIENT ISLAND** | Pre-fetch objednavky, formular zustva client |
| 8 | shop/moje-objednavky/[id]/vraceni | **SSR + CLIENT ISLAND** | Pre-fetch objednavky, formular zustva client |
| 9 | inzerce/registrace | **ZUSTAT CLIENT** | Cisty formular, zadny server data fetch |
| 10 | inzerce/pridat | **UZ JE SSR** | Zadna prace |
| 11 | muj-ucet/hlidaci-pes | **SSR + CLIENT ISLAND** | Pre-fetch watchdogs, CRUD zustva client |

**Skutecna prace: 5 stranek k prevodu (5, 6, 7, 8, 11)**

---

## Stranka 1: `app/(web)/shop/kosik/page.tsx` (194 radku)

### Verdikt: ZUSTAT CLIENT — BEZ ZMENY

### Duvod
- Cart data jsou v `localStorage` (klientsky pristup)
- `getCart()`, `removeFromCart()`, `updateQuantity()`, `clearCart()`, `onCartChange()` — vse z `lib/cart.ts` ktere je "use client"
- `useEffect` s `onCartChange` subscriber pro realtime reactivity
- Server nema pristup k localStorage — nelze SSR

### Poznamka
Jedina mozna optimalizace (mimo scope SSR migrace): pridat `export const metadata` do separatniho `layout.tsx` nebo pouzit `generateMetadata` v parent route. Ale samotna stranka MUSI zustat client.

---

## Stranka 2: `app/(web)/dily/kosik/page.tsx` (165 radku)

### Verdikt: ZUSTAT CLIENT — BEZ ZMENY

### Duvod
Identicky jako stranka 1 — klon s `/dily/` linky misto `/shop/`.

---

## Stranka 3: `app/(web)/shop/objednavka/page.tsx` (364 radku)

### Verdikt: ZUSTAT CLIENT — BEZ ZMENY

### Duvod
- Cart z localStorage (`getCart()`, `getCartTotal()`, `onCartChange()`)
- Multi-step wizard (3 kroky: doruceni → platba → potvrzeni)
- `useRouter()` pro redirect po submitu
- `OrderForm` client component pro delivery formular
- Vsechna interaktivita: form validation, step navigation, payment selection, API submit

---

## Stranka 4: `app/(web)/dily/objednavka/page.tsx` (634 radku)

### Verdikt: ZUSTAT CLIENT — BEZ ZMENY

### Duvod
Nejslozitejsi stranka v celem projektu:
- Cart z localStorage
- Rezervacni system s 30min timerem (`/api/parts/reserve`)
- Multi-supplier delivery selection
- Zasilkovna widget
- Shipping availability check (`/api/shipping/calculate`)
- `sessionStorage` pro checkout session ID
- `beforeunload` event listener pro uvolneni rezervaci
- Countdown timer s `setInterval`

Toto je 100% klientska logika — NELZE SSR.

---

## Stranka 5: `app/(web)/shop/objednavka/potvrzeni/page.tsx` (92 radku)

### Aktualni stav
- "use client" POUZE kvuli `useSearchParams()`
- Cela stranka je staticke "Dekujeme" JSX
- Cte `?id=XXX&tracking=YYY` z URL

### Plan
1. **Odebrat** "use client"
2. **Pouzit** Next.js server-side `searchParams` prop
3. **Pridat** `export const metadata` pro SEO (potvrzeni objednavky)
4. **PROBLEM:** `window.location.origin` na radku 63 — pouziva se pro zobrazeni full URL trackingu. V SSR nahradit za env promennou nebo hardcoded domain.

### Vysledna kostra

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// Next.js 15: searchParams je Promise
export default async function PotvrzeniPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; tracking?: string }>;
}) {
  const { id: orderId = "---", tracking: trackingUrl } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1:1 JSX z originalu */}
      {/* Nahradit window.location.origin za process.env.NEXT_PUBLIC_BASE_URL ?? "https://carmakler.cz" */}
    </div>
  );
}
```

### Zmeny
- **Odebrat:** `"use client"`, `useSearchParams` import
- **Pridat:** `searchParams` prop s `Promise` typem (Next.js 15 pattern)
- **Nahradit:** `window.location.origin` → `process.env.NEXT_PUBLIC_BASE_URL ?? ""`
- **Beze zmeny:** Veskerý JSX, CSS, Link/Button usage

### ZADNY novy soubor

### Slozitost: Nizka (30min)

---

## Stranka 6: `app/(web)/dily/objednavka/potvrzeni/page.tsx` (78 radku)

### Verdikt: Identicky postup jako stranka 5

### Rozdily oproti strance 5
- Link: `/dily/moje-objednavky` misto `/shop/moje-objednavky`
- Link: `/dily` misto `/shop`

### ZADNY novy soubor

### Slozitost: Nizka (20min)

---

## Stranka 7: `app/(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` (310 radku)

### Aktualni stav
- "use client", `use(params)` pro [id], `useRouter()`
- Fetchuje `/api/orders/${id}` pro nacitani objednavky
- Interaktivita: checkbox polozek, textarea (duvod + popis zavady), file upload (fotky), kontakt inputs
- Po submitu: upload fotek na Cloudinary → POST `/api/orders/${id}/returns`
- Success state: redirect tlacitko

### Plan
1. **Vytvorit** `components/web/ClaimForm.tsx` — client component s celym formularem
2. **Page.tsx** = SSR wrapper: auth + prisma fetch order → props

### Prisma query

```tsx
const order = await prisma.order.findFirst({
  where: { id, buyerId: session.user.id, status: "DELIVERED" },
  select: {
    id: true,
    orderNumber: true,
    status: true,
    deliveryName: true,
    deliveryEmail: true,
    items: {
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        totalPrice: true,
        part: { select: { name: true } },
      },
    },
  },
});
```

### Novy soubor: `components/web/ClaimForm.tsx`

```tsx
"use client";
// Presunout:
// - OrderItem, Order interfaces
// - Formular state (selectedItems, reason, defectDesc, photos, previews, contactName, contactEmail, bankAccount)
// - toggleItem, handlePhotoChange, removePhoto, handleSubmit
// - Success state + JSX
// - Vsechno JSX

// Zmenit:
// - export default function ReklamacePage → export function ClaimForm({ order }: Props)
// - Odebrat useEffect fetch — order z props
// - Odebrat use(params) — id z props
// - Zachovat useRouter pro success redirect
// - Inicializovat contactName/contactEmail z order props

interface ClaimFormProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    deliveryName: string;
    deliveryEmail: string;
    items: {
      id: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      part: { name: string };
    }[];
  };
}
```

### Vysledna kostra page.tsx

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClaimForm } from "@/components/web/ClaimForm";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default async function ReklamacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, buyerId: session.user.id },
    select: {
      id: true, orderNumber: true, status: true,
      deliveryName: true, deliveryEmail: true,
      items: {
        select: {
          id: true, quantity: true, unitPrice: true, totalPrice: true,
          part: { select: { name: true } },
        },
      },
    },
  });

  if (!order) notFound();

  if (order.status !== "DELIVERED") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <p className="text-gray-500">Reklamaci lze podat pouze u doručené objednávky.</p>
          <Link href="/shop/moje-objednavky" className="text-orange-500 font-semibold mt-4 inline-block">Zpět</Link>
        </Card>
      </div>
    );
  }

  return <ClaimForm order={order} />;
}
```

### Poznamka
- Error/not-found state renderovany SSR (bez client JS)
- `order.status !== "DELIVERED"` check na serveru — usetri API call
- File upload + Cloudinary zustavaji 100% v client komponente

### Slozitost: Stredni (1.5h)

---

## Stranka 8: `app/(web)/shop/moje-objednavky/[id]/vraceni/page.tsx` (237 radku)

### Aktualni stav
- Velmi podobne strance 7 (reklamace), ale jednodussi (zadne fotky)
- Fetchuje `/api/orders/${id}` pro nacitani objednavky
- Interaktivita: checkbox polozek, textarea (duvod), kontakt inputs
- Pocita `daysLeft` z `order.deliveredAt` (14denni lhuta)

### Plan
1. **Vytvorit** `components/web/ReturnForm.tsx` — client component
2. **Page.tsx** = SSR wrapper: auth + prisma fetch → props

### Prisma query

```tsx
const order = await prisma.order.findFirst({
  where: { id, buyerId: session.user.id, status: "DELIVERED" },
  select: {
    id: true,
    orderNumber: true,
    status: true,
    deliveryName: true,
    deliveryEmail: true,
    deliveredAt: true, // Pro vypocet daysLeft
    items: {
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        totalPrice: true,
        part: { select: { name: true } },
      },
    },
  },
});
```

### Novy soubor: `components/web/ReturnForm.tsx`

```tsx
"use client";
// Stejny pattern jako ClaimForm ale jednodussi (bez fotek)
// Presunout: formular state, toggleItem, handleSubmit, daysLeft vypocet, JSX
// Props: order (vcetne deliveredAt jako ISO string)

interface ReturnFormProps {
  order: {
    id: string;
    orderNumber: string;
    deliveryName: string;
    deliveryEmail: string;
    deliveredAt: string | null;
    items: { id: string; quantity: number; unitPrice: number; totalPrice: number; part: { name: string } }[];
  };
}
```

### Vysledna kostra page.tsx

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReturnForm } from "@/components/web/ReturnForm";

export default async function VraceniPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, buyerId: session.user.id, status: "DELIVERED" },
    select: { /* viz vyse */ },
  });

  if (!order) notFound();

  // Serializace
  const serialized = {
    ...order,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
  };

  return <ReturnForm order={serialized} />;
}
```

### Poznamka
- `deliveredAt` overit v Prisma schema — Order model ma `deliveredAt DateTime?`?
- Implementator musi zkontrolovat — v API response je pristupne jako `order.deliveredAt`, ale v schema jsem nevidel explicitni pole. Muze byt computed z status change timestamp.

### Slozitost: Stredni (1.5h)

---

## Stranka 9: `app/(web)/inzerce/registrace/page.tsx` (363 radku)

### Verdikt: ZUSTAT CLIENT — BEZ ZMENY

### Duvod
- Cisty registracni formular — ZADNY pocatecni data fetch
- `useState` pro cely form state (accountType, jmeno, email, heslo, ICO...)
- ARES lookup (`/api/auth/register/ares`) — client-side async akce
- Form validation + submit na `/api/auth/register`
- `useRouter()` pro redirect po registraci

### Poznamka
Jedina mozna zmena: pridat `export const metadata` do separatniho souboru (napr. `layout.tsx` nebo zabalit page do SSR wrapperu ktery exportuje metadata). Ale formular sam MUSI zustat client.

**Alternativa pro metadata (volitelne):**
```tsx
// app/(web)/inzerce/registrace/layout.tsx (NOVY)
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Registrace — Inzerce",
  description: "Zaregistrujte se a začněte prodávat nebo nakupovat vozidla na CarMakléř.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```
Ale to NENI v scope SSR migrace — jen poznamka pro budoucnost.

---

## Stranka 10: `app/(web)/inzerce/pridat/page.tsx` (37 radku)

### Verdikt: UZ JE SSR — ZADNA PRACE

### Aktualni stav
- BEZ "use client" — uz je Server Component
- Importuje `ListingFormWizard` (client component) — spravny pattern
- Staticke JSX: breadcrumb, h1, p — vse SSR
- `ListingFormWizard` = client island

**Tato stranka je vzorovy priklad spravneho SSR + client island patternu.**

---

## Stranka 11: `app/(web)/muj-ucet/hlidaci-pes/page.tsx` (358 radku)

### Aktualni stav
- "use client", fetchuje `/api/watchdog`
- CRUD: list, create (v Modal), toggle active (PATCH), delete (DELETE)
- Prisma model: `Watchdog` (schema radek 813)
- Vsechna interaktivita: Modal s formularem, Toggle, delete button

### Plan
1. **Vytvorit** `components/web/WatchdogManager.tsx` — client component s celym CRUD
2. **Page.tsx** = SSR wrapper: auth + prisma fetch → props

### Prisma query

```tsx
const watchdogs = await prisma.watchdog.findMany({
  where: { userId: session.user.id },
  orderBy: { createdAt: "desc" },
});
```

### Novy soubor: `components/web/WatchdogManager.tsx`

```tsx
"use client";
// Presunout VSE z page.tsx:
// - Watchdog, WatchdogForm interfaces
// - initialForm, brands, fuelTypes, bodyTypes, cities, years konstanty
// - formatCriteria helper
// - Vsechny useState hooks
// - fetchWatchdogs, handleCreate, toggleActive, deleteWatchdog
// - Kompletni JSX vcetne Modal

// Zmenit:
// - export default function HlidaciPesPage() → export function WatchdogManager({ initialWatchdogs }: Props)
// - Inicializovat useState z props: useState<Watchdog[]>(initialWatchdogs)
// - Odebrat useEffect pro pocatecni fetch (ale ZACHOVAT fetchWatchdogs pro re-fetch po CRUD)
// - Odebrat loading state pro initial load

interface WatchdogManagerProps {
  initialWatchdogs: Watchdog[];
}

export function WatchdogManager({ initialWatchdogs }: WatchdogManagerProps) {
  const [watchdogs, setWatchdogs] = useState<Watchdog[]>(initialWatchdogs);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<WatchdogForm>(initialForm);
  const [formLoading, setFormLoading] = useState(false);

  // fetchWatchdogs ZACHOVAT — pro refresh po create/delete
  const fetchWatchdogs = async () => { /* ... */ };

  // Zbytek beze zmeny
}
```

### Vysledna kostra page.tsx

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WatchdogManager } from "@/components/web/WatchdogManager";

export default async function HlidaciPesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const watchdogs = await prisma.watchdog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const serialized = watchdogs.map((wd) => ({
    id: wd.id,
    brand: wd.brand,
    model: wd.model,
    minPrice: wd.minPrice,
    maxPrice: wd.maxPrice,
    minYear: wd.minYear,
    maxYear: wd.maxYear,
    fuelType: wd.fuelType,
    bodyType: wd.bodyType,
    city: wd.city,
    email: wd.email,
    active: wd.active,
    createdAt: wd.createdAt.toISOString(),
  }));

  return <WatchdogManager initialWatchdogs={serialized} />;
}
```

### Slozitost: Stredni (1.5h)

---

## Souhrn novych souboru

| # | Novy soubor | Typ | Pro stranku |
|---|-------------|-----|-------------|
| 1-4 | — | — | kosiky + checkouty (zustavaji client) |
| 5-6 | — | — | potvrzeni (SSR, zadny novy soubor) |
| 7 | `components/web/ClaimForm.tsx` | client | reklamace |
| 8 | `components/web/ReturnForm.tsx` | client | vraceni |
| 9 | — | — | registrace (zustava client) |
| 10 | — | — | pridat inzerat (uz je SSR) |
| 11 | `components/web/WatchdogManager.tsx` | client | hlidaci-pes |

**Celkem: 3 nove client komponenty, 2 stranky prevod na SSR bez noveho souboru**

---

## Poradi implementace

1. `shop/objednavka/potvrzeni/page.tsx` — nejjednodussi, jen searchParams (30min)
2. `dily/objednavka/potvrzeni/page.tsx` — klon #1 (20min)
3. `muj-ucet/hlidaci-pes/page.tsx` — SSR + WatchdogManager (1.5h)
4. `shop/moje-objednavky/[id]/vraceni/page.tsx` — SSR + ReturnForm (1.5h)
5. `shop/moje-objednavky/[id]/reklamace/page.tsx` — SSR + ClaimForm (1.5h)

**Stranky 1-4, 9: BEZ ZMENY**
**Stranka 10: UZ HOTOVA**

**Celkovy odhad skutecne prace: ~5 hodin (misto 11 stranek, jen 5 se meni)**

---

## Stranky ktere ZUSTAVAJI "use client" — zduvodneni

### Kosik (stranky 1-2)
Cart data pochazi z `localStorage`. Server nema pristup k localStorage.
`onCartChange()` subscriber reaguje na zmeny v realnem case (jiny tab, add-to-cart).
**Jedine reseni pro SSR kosiku:** Migrace kosiku z localStorage na server-side (database/session) — to je VELKA zmena mimo scope SSR migrace.

### Checkout (stranky 3-4)
Navic k localStorage zavislosti:
- Multi-step wizard se stavem v useState
- Dily checkout (stranka 4): rezervacni system s 30min timerem, `beforeunload` listener, `sessionStorage`, shipping availability API call
- Form validace, payment selection, submit

### Registrace (stranka 9)
Zadna server data — cisty formular. "use client" je nutne pro:
- Form state (useState)
- ARES API lookup (async user-triggered)
- Form validation
- `useRouter()` pro redirect

---

## Spolecna rizika a upozorneni

### 1. searchParams v Next.js 15
V Next.js 15 jsou `searchParams` v page props `Promise`:
```tsx
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
```
To je zmena oproti Next.js 14 kde searchParams nebyly Promise.

### 2. window.location.origin v SSR
Potvrzeni stranky (5, 6) pouzivaji `window.location.origin` pro zobrazeni tracking URL. V SSR `window` neexistuje. Nahradit za:
```tsx
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://carmakler.cz";
```

### 3. deliveredAt v Order modelu
`ReturnForm` pocita `daysLeft` z `order.deliveredAt`. Overit ze `Order` model ma toto pole v Prisma schema. Pokud ne, muze byt computed z jine tabulky (napr. status change log).

### 4. Date serializace (jako ve Fazi 3)
Prisma vraci `Date` → client ocekava `string`. Vzdy serializovat:
```tsx
createdAt: item.createdAt.toISOString()
```

---

## Kontrolni checklist po implementaci

Pro KAZDOU prevodenout stranku:

- [ ] `page.tsx` NEMA "use client" na radku 1
- [ ] Potvrzeni stranky: `searchParams` jako `Promise` (Next.js 15)
- [ ] Potvrzeni stranky: zadne `window` reference
- [ ] Reklamace/vraceni: auth check + prisma fetch na serveru
- [ ] Reklamace/vraceni: `status !== "DELIVERED"` check na serveru
- [ ] Hlidaci-pes: watchdog list pre-fetched, CRUD zustavaji client
- [ ] Client komponenty inicializuji state z props (ne z useEffect)
- [ ] Client komponenty zachovavaji re-fetch po mutacich
- [ ] `npm run build` projde bez chyb
- [ ] Vizualne identicky vysledek jako pred zmenou

## Stranky BEZ ZMENY — potvrzeni

- [ ] shop/kosik — `"use client"` zustava, zadna zmena
- [ ] dily/kosik — `"use client"` zustava, zadna zmena
- [ ] shop/objednavka — `"use client"` zustava, zadna zmena
- [ ] dily/objednavka — `"use client"` zustava, zadna zmena
- [ ] inzerce/registrace — `"use client"` zustava, zadna zmena
- [ ] inzerce/pridat — uz je SSR, zadna zmena
