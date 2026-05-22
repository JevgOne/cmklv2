# AUDIT: "use client" stranky + Plan migrace na SSR

**Datum:** 2026-05-07
**Zadani:** Kazda stranka MUSI renderovat kompletni HTML+CSS na serveru. "use client" pouze na nejmensi mozne komponenty.

---

## Souhrn auditu

| Typ souboru | Celkem | "use client" | SSR | % client |
|---|---|---|---|---|
| **page.tsx** (celkove) | ~190 | **96** | ~94 | 50% |
| *— (web) pages* | ~120 | **42** | ~78 | 35% |
| *— (admin) pages* | ~49 | **2** | 47 | 4% |
| *— (pwa) pages* | ~51 | **32** | 19 | 63% |
| *— (pwa-parts) pages* | ~15 | **11** | 4 | 73% |
| *— (partner) pages* | ~19 | **9** | 10 | 47% |
| **layout.tsx** | ~35 | **9** | 26 | 26% |

**Poznamka:** Admin pages jsou paradoxne nejlepsi — vetsina pouziva thin page wrapper (import + render), interaktivita je v Client Components. To je spravny vzor.

---

## Kategorizace "use client" stranek

### A) ZBYTECNY "use client" — lze prevest primo na Server Component

Stranky kde `use client` existuje kvuli:
- `useSearchParams()` — presunout do Suspense-wrapped client child
- Staticky obsah s minimalni interaktivitou
- Pouziti jen `Link`, `useState` pro jednoduchy toggle

| # | Soubor | Duvod "use client" | Navrh |
|---|--------|-------------------|-------|
| 1 | `(web)/overeni-emailu/chyba/page.tsx` | `useSearchParams()` | SSR page + client `<ErrorContent>` child (uz ma Suspense!) — staci odebrat "use client" z page, nechat ErrorContent jako client |
| 2 | `(web)/kariera/page.tsx` | Import `CareerForm` (client) | Page je staticky obsah + 1 form. Odebrat "use client" z page, `CareerForm` uz je client component |
| 3 | `app/prezentace/page.tsx` | Neznamy — overit | Pravdepodobne staticky obsah |
| 4 | `(admin)/admin/team/page.tsx` | Overit — admin pages typicky thin wrapper | Pravdepodobne staci odebrat |
| 5 | `(admin)/admin/reviews/page.tsx` | Overit — admin pages typicky thin wrapper | Pravdepodobne staci odebrat |

**Odhad prace:** 1-2 hodiny, 5 stranek

---

### B) FORMULARE — prevest na SSR page + Server Actions

Tyto stranky maji formular jako jediny obsah. Vzor: page.tsx renderuje SSR shell (layout, nadpisy, staticke texty) a obsahuje `<ClientFormComponent />` jako "client island".

**Optimalni pristup:** NE server actions (zatim). Server Actions by vyzadovaly rewrite celeho form flow. Misto toho: **extrakce formulare do client component, page.tsx bude Server Component.**

#### B1) Auth formulare (PRIORITA 1 — login stranka je rozbitá bez JS)

| # | Soubor | Akce |
|---|--------|------|
| 6 | `(web)/login/page.tsx` | **KRITICKE.** Extrahovat `<LoginForm>` do `components/web/LoginForm.tsx` (uz existuje jako funkce uvnitr). Page: SSR shell + `<Suspense><LoginForm/></Suspense>` |
| 7 | `(web)/prihlaseni/page.tsx` | Pravdepodobne redirect na /login — overit |
| 8 | `(web)/registrace/page.tsx` | Extrahovat `<RegistrationForm>` do client component. SSR page renderuje layout shell. |
| 9 | `(web)/registrace/makler/page.tsx` | Extrahovat `<BrokerRegistrationForm>`. SSR page renderuje shell. |
| 10 | `(web)/registrace/partner/page.tsx` | Extrahovat `<PartnerRegistrationForm>`. SSR page renderuje shell. |
| 11 | `(web)/registrace/dodavatel/page.tsx` | Extrahovat `<SupplierRegistrationForm>`. SSR page renderuje shell. |
| 12 | `(web)/zapomenute-heslo/page.tsx` | Extrahovat `<ForgotPasswordForm>`. SSR page renderuje shell. |
| 13 | `(web)/reset-hesla/[token]/page.tsx` | Extrahovat `<ResetPasswordForm>`. SSR page renderuje shell. |

**Vzor pro login (referecni implementace):**
```tsx
// app/(web)/login/page.tsx — SERVER COMPONENT
import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/web/LoginForm";

export const metadata: Metadata = {
  title: "Prihlaseni",
  description: "Prihlaste se do sveho uctu CarMakler",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* SSR shell - toto se renderuje na serveru vzdy */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Prihlaseni</h1>
            <p className="mt-2 text-sm text-gray-500">
              Prihlaste se do sveho uctu CarMakler
            </p>
          </div>
          {/* Client island — formular */}
          <Suspense fallback={
            <div className="space-y-5">
              <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[44px] bg-orange-200 rounded-lg animate-pulse" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// components/web/LoginForm.tsx — CLIENT COMPONENT
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
// ... zbytek existujiciho kodu LoginForm
```

**Odhad prace:** 4-6 hodin, 8 stranek

#### B2) Web formulare (shop, inzerce, ucet)

| # | Soubor | Akce |
|---|--------|------|
| 14 | `(web)/inzerce/registrace/page.tsx` | Extrahovat form do client component |
| 15 | `(web)/inzerce/pridat/page.tsx` | Multi-step form → client component |
| 16 | `(web)/shop/kosik/page.tsx` | Cart view → client component |
| 17 | `(web)/dily/kosik/page.tsx` | Cart view → client component |
| 18 | `(web)/shop/objednavka/page.tsx` | Checkout → client component (resp. uz existujici?) |
| 19 | `(web)/dily/objednavka/page.tsx` | Checkout → client component |
| 20 | `(web)/shop/objednavka/potvrzeni/page.tsx` | Confirmation → overit, mozna staci SSR |
| 21 | `(web)/dily/objednavka/potvrzeni/page.tsx` | Confirmation → overit, mozna staci SSR |
| 22 | `(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` | Form → client component |
| 23 | `(web)/shop/moje-objednavky/[id]/vraceni/page.tsx` | Form → client component |
| 24 | `(web)/muj-ucet/hlidaci-pes/page.tsx` | Watchdog settings → client component |

**Odhad prace:** 8-10 hodin, 11 stranek

---

### C) DATA-FETCHING STRANKY — prevest na SSR s Prisma + client islands

Stranky ktere fetchuji data pres `useEffect` + `fetch()`. Meli by pouzivat `prisma` na serveru a predavat data jako props do client komponent.

#### C1) Uzivatelsky ucet (web)

| # | Soubor | Co fetchuje | Navrh |
|---|--------|------------|-------|
| 25 | `(web)/muj-ucet/page.tsx` | `/api/buyer/stats` | SSR: fetch stats na serveru (session+prisma), predat do `<BuyerDashboard stats={...} />` client component |
| 26 | `(web)/muj-ucet/profil/page.tsx` | User profile data | SSR: Prisma query pro profil, predat do `<ProfileEditor>` |
| 27 | `(web)/muj-ucet/profil/setup/page.tsx` | Profile setup | Podobne |
| 28 | `(web)/muj-ucet/oblibene/page.tsx` | Favorites list | SSR: Prisma query, predat do `<FavoritesList>` |
| 29 | `(web)/muj-ucet/dotazy/page.tsx` | Inquiries | SSR + client island |
| 30 | `(web)/muj-ucet/garaz/page.tsx` | Garage vehicles | SSR + client island |
| 31 | `(web)/muj-ucet/poptavky/page.tsx` | Requests | SSR + client island |
| 32 | `(web)/moje-inzeraty/page.tsx` | User listings | SSR + client island |
| 33 | `(web)/moje-inzeraty/[id]/page.tsx` | Listing detail | SSR + client island |
| 34 | `(web)/shop/moje-objednavky/page.tsx` | Orders | SSR + client island |
| 35 | `(web)/dily/moje-objednavky/page.tsx` | Parts orders | SSR + client island |

**Odhad prace:** 12-16 hodin, 11 stranek

#### C2) Katalogy s filtry

| # | Soubor | Aktualni stav | Navrh |
|---|--------|--------------|-------|
| 36 | `(web)/shop/katalog/page.tsx` | Client-side fetch + filtry | **SLOZITE.** Filtry+search params+pagination = hodne client state. Doporuceny pristup: SSR initial load (Prisma query ze searchParams), client component pro interaktivni filtry. Vyuzit `searchParams` z Next.js page props. |
| 37 | `(web)/dily/katalog/page.tsx` | Stejny pattern | Stejny pristup |
| 38 | `(web)/inzerce/katalog/page.tsx` | Overit | Stejny pristup |

**Poznamka:** `(web)/nabidka/page.tsx` je jiz SSR s Prisma — to je vzorova implementace!

**Odhad prace:** 12-16 hodin, 3 stranky (komplexni)

#### C3) Tracking/status stranky

| # | Soubor | Navrh |
|---|--------|-------|
| 39 | `(web)/shop/objednavky/sledovani/[token]/page.tsx` | SSR: fetch order by token na serveru |

---

### D) LAYOUTS — prevest na SSR kde mozne

| # | Soubor | Duvod "use client" | Navrh |
|---|--------|-------------------|-------|
| 40 | `(web)/muj-ucet/layout.tsx` | `usePathname()` pro active nav | Extrahovat `<AccountNav>` client component. Layout SSR. |
| 41 | `(web)/moje-inzeraty/layout.tsx` | `usePathname()` pro active nav | Extrahovat `<InzeratyNav>` client component. Layout SSR. |
| 42 | `(pwa)/layout.tsx` | `OnlineStatusProvider` a dalsi providery | **NECHAT** — PWA layout musi byt client kvuli providerům a offline-first designu |
| 43 | `(pwa-parts)/layout.tsx` | Stejne | **NECHAT** |
| 44 | `(partner)/layout.tsx` | `AuthProvider`, sidebar state | **NECHAT** — hybridni layout s client sidebar |
| 45 | `(pwa)/makler/onboarding/layout.tsx` | `usePathname()` + Framer Motion | **NECHAT** — animace vyzaduji client |
| 46 | `(pwa)/makler/vehicles/new/layout.tsx` | `DraftProvider` | **NECHAT** — provider pro multi-step form |
| 47 | `(pwa)/makler/vehicles/quick/layout.tsx` | Overit | Pravdepodobne **NECHAT** |
| 48 | `(pwa)/makler/contracts/new/layout.tsx` | Overit | Pravdepodobne **NECHAT** |

**Odhad prace:** 2-3 hodiny (jen #40 a #41)

---

### E) PWA + PARTNER stranky — nizsi priorita

PWA stranky jsou primare mobile-only, casto offline-first. Migrace na SSR ma mensi dopad nez u verejneho webu, protoze:
- Jsou za autentizaci (ne SEO kriticke)
- Offline-first design vyzaduje client-side state
- Uzivatele pristupuji pres PWA, ne primo URL

**Doporuceni:** Migrovat postupne po dokonceni (web) stranek. Pattern je stejny — SSR page + client island.

Pocet stranek: **32 PWA + 11 PWA-parts + 9 partner = 52 stranek**

**Odhad prace:** 30-40 hodin

---

### F) Admin stranky — JIZ SPRAVNE

Admin stranky (az na 2 vyjimky) uz pouzivaji spravny vzor:
```tsx
// page.tsx — Server Component (NO "use client")
import { SomePageContent } from "@/components/admin/SomePageContent";
export default function SomePage() { return <SomePageContent />; }
```

Interaktivita je v `components/admin/*Content.tsx` (client components). Admin dashboard dokonce pouziva `prisma` primo v page.tsx — idealem.

**Vyjimky k overeni:** `admin/team/page.tsx`, `admin/reviews/page.tsx` — pravdepodobne staci odebrat "use client".

---

## Migracni plan — faze a poradi

### FAZE 1: Login + Auth stranky (KRITICKA — 1 den)
**Priorita:** P0 — login stranka je rozbita bez JS

| Krok | Soubor | Akce |
|------|--------|------|
| 1.1 | `(web)/login/page.tsx` | Extrahovat `LoginForm` do `components/web/LoginForm.tsx`. Page → SSR shell + Suspense. |
| 1.2 | `(web)/registrace/page.tsx` | Extrahovat `RegistrationForm` do client component. Page → SSR. |
| 1.3 | `(web)/registrace/makler/page.tsx` | Extrahovat `BrokerRegistrationForm`. Page → SSR. |
| 1.4 | `(web)/registrace/partner/page.tsx` | Extrahovat `PartnerRegistrationForm`. Page → SSR. |
| 1.5 | `(web)/registrace/dodavatel/page.tsx` | Extrahovat `SupplierRegistrationForm`. Page → SSR. |
| 1.6 | `(web)/zapomenute-heslo/page.tsx` | Extrahovat `ForgotPasswordForm`. Page → SSR. |
| 1.7 | `(web)/reset-hesla/[token]/page.tsx` | Extrahovat `ResetPasswordForm`. Page → SSR. |
| 1.8 | `(web)/overeni-emailu/chyba/page.tsx` | Uz ma Suspense — staci odebrat "use client" z page wrapper. |

**Vzor (opakovat pro kazdy soubor):**
1. Vytvorit novy soubor `components/web/{FormName}.tsx`
2. Presunout "use client" + vsechen form kod
3. V `page.tsx` odebrat "use client", pridat `export const metadata`, importovat form component, obalit Suspense
4. Otestovat: stranka musi renderovat kompletni HTML shell bez JS

**Odhad:** 4-6 hodin

### FAZE 2: Web layouts (0.5 dne)

| Krok | Soubor | Akce |
|------|--------|------|
| 2.1 | `(web)/muj-ucet/layout.tsx` | Extrahovat `<AccountSidebarNav>` client component. Layout → SSR s h1 + shell. |
| 2.2 | `(web)/moje-inzeraty/layout.tsx` | Extrahovat `<InzeratyNav>` client component. Layout → SSR. |
| 2.3 | `(web)/kariera/page.tsx` | Odebrat "use client" — `CareerForm` je uz client component. |

**Odhad:** 2-3 hodiny

### FAZE 3: Uzivatelsky ucet — SSR data fetch (2 dny)

| Krok | Soubor | Akce |
|------|--------|------|
| 3.1 | `(web)/muj-ucet/page.tsx` | SSR Prisma query pro stats. Predat do `<BuyerDashboard>` client component. |
| 3.2 | `(web)/muj-ucet/profil/page.tsx` | SSR Prisma query pro profil. Predat do `<ProfileEditor>` client component. |
| 3.3 | `(web)/muj-ucet/oblibene/page.tsx` | SSR query + client list s remove button |
| 3.4 | `(web)/muj-ucet/dotazy/page.tsx` | SSR query + client list |
| 3.5 | `(web)/muj-ucet/garaz/page.tsx` | SSR query + client grid |
| 3.6 | `(web)/muj-ucet/poptavky/page.tsx` | SSR query + client list |
| 3.7 | `(web)/moje-inzeraty/page.tsx` | SSR query + client list |
| 3.8 | `(web)/moje-inzeraty/[id]/page.tsx` | SSR query + client detail |
| 3.9 | `(web)/shop/moje-objednavky/page.tsx` | SSR query + client list |
| 3.10 | `(web)/dily/moje-objednavky/page.tsx` | SSR query + client list |

**Vzor:**
```tsx
// page.tsx — Server Component
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FavoritesList } from "@/components/web/FavoritesList";

export default async function OblibenePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { listing: { include: { images: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Oblibene</h2>
      <FavoritesList initialData={favorites} />
    </div>
  );
}
```

**Odhad:** 12-16 hodin

### FAZE 4: Eshop formulare + checkout (1-2 dny)

| Krok | Soubor | Akce |
|------|--------|------|
| 4.1 | `(web)/shop/kosik/page.tsx` | Cart → SSR shell + `<CartContent>` client island |
| 4.2 | `(web)/dily/kosik/page.tsx` | Stejne |
| 4.3 | `(web)/shop/objednavka/page.tsx` | Checkout → SSR shell + `<CheckoutForm>` client |
| 4.4 | `(web)/dily/objednavka/page.tsx` | Stejne |
| 4.5 | `(web)/shop/objednavka/potvrzeni/page.tsx` | Overit — mozna uz staci SSR |
| 4.6 | `(web)/dily/objednavka/potvrzeni/page.tsx` | Overit |
| 4.7 | `(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` | Form → client component |
| 4.8 | `(web)/shop/moje-objednavky/[id]/vraceni/page.tsx` | Form → client component |
| 4.9 | `(web)/inzerce/registrace/page.tsx` | Form → client component |
| 4.10 | `(web)/inzerce/pridat/page.tsx` | Multi-step form → client component |
| 4.11 | `(web)/muj-ucet/hlidaci-pes/page.tsx` | Settings form → client component |

**Odhad:** 8-12 hodin

### FAZE 5: Katalogy s filtry (2 dny)

| Krok | Soubor | Akce |
|------|--------|------|
| 5.1 | `(web)/shop/katalog/page.tsx` | SSR initial load z searchParams + Prisma. Client `<CatalogFilters>` + `<ProductGrid>`. Vzor: `/nabidka/page.tsx` |
| 5.2 | `(web)/dily/katalog/page.tsx` | Stejny pristup |
| 5.3 | `(web)/inzerce/katalog/page.tsx` | Overit a migrat |

**Reference:** `(web)/nabidka/page.tsx` uz pouziva tento vzor (SSR + Prisma + ISR). Pouzit jako template.

**Odhad:** 12-16 hodin

### FAZE 6: Zbyle web stranky (0.5 dne)

| Krok | Soubor | Akce |
|------|--------|------|
| 6.1 | `(web)/shop/objednavky/sledovani/[token]/page.tsx` | SSR query by token |
| 6.2 | `(web)/muj-ucet/profil/setup/page.tsx` | Form → client component |
| 6.3 | `app/prezentace/page.tsx` | Overit a opravit |
| 6.4 | Admin vyjimky (`team`, `reviews`) | Overit a odebrat "use client" |

**Odhad:** 3-4 hodiny

### FAZE 7: PWA + Partner stranky (5-7 dni — paralelne s testovanim)

Postupna migrace 52 stranek. Kazda stranka: SSR page + client island.
Prioritizace:
1. Dashboard pages (viditelne, data-heavy)
2. List pages (vehicles, parts, orders)
3. Detail pages
4. Form pages (lowest priority — casto uz maji spravny pattern)

**Odhad:** 30-40 hodin

---

## Casovy souhrn

| Faze | Stranky | Odhad | Priorita |
|------|---------|-------|----------|
| 1. Login + Auth | 8 | 4-6h | **P0** |
| 2. Web layouts | 3 | 2-3h | P1 |
| 3. Uzivatelsky ucet | 10 | 12-16h | P1 |
| 4. Eshop formulare | 11 | 8-12h | P2 |
| 5. Katalogy | 3 | 12-16h | P2 |
| 6. Zbyle web | 4 | 3-4h | P2 |
| 7. PWA + Partner | 52 | 30-40h | P3 |
| **CELKEM** | **91** | **~70-100h** | |

---

## Klicova pravidla pro implementaci

1. **NIKDY** "use client" na page.tsx — page.tsx je VZDY Server Component
2. **Metadata** — kazda SSR page musi exportovat `metadata` (SEO)
3. **Suspense** — kazdy client island obalit `<Suspense fallback={skeleton}>` pro streaming
4. **Auth check** — `const session = await auth()` v SSR page, redirect pokud neautorizovany
5. **Prisma** — data fetching VZDY na serveru (prisma), ne client-side `fetch()`
6. **searchParams** — vyuzit Next.js page props `{ searchParams }` misto `useSearchParams()`
7. **pathname** — v layouts pouzit `<ActiveNavLink>` client component, ne cely layout jako client
8. **Fallback** — skeleton/placeholder v Suspense MUSI mit stejnou strukturu jako finalni obsah (zabrani layout shift)

## Rizika

1. **NextAuth `signIn()`** — vyzaduje client-side volani. Login form MUSI zustat client component, ale page shell muze byt SSR.
2. **useSearchParams v katalozich** — Next.js page props `searchParams` jsou async v App Router. Filtry ktere meni URL zustanou client.
3. **Cart state** — kosik je typicky v localStorage/context. Cart page bude SSR shell + client `<CartContent>` ktery cte z contextu.
4. **PWA offline** — nektere PWA stranky MUSI fungovat offline. Ty zustanou client kvuli service worker integraci.
5. **Framer Motion** — animace vyzaduji client. Layouts s AnimatePresence zustanou client.
