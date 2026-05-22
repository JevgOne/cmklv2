# Plan #101 — Marketplace VIP: odebrat z public menu

**Status:** READY FOR REVIEW
**Plánovač:** planovac
**Datum:** 2026-04-07
**Priorita:** P1 (po #100)
**Estimate:** S (~30–45 min implementace)
**Návaznost:** batch implementace s #100 v jednom commitu (#104)
**Blocks:** #104 IMPL

---

## §0 — Executive summary

**Cíl:** Marketplace VIP nesmí být v žádném public menu (Navbar, MobileMenu, Footer) na main / inzerce / shop / web platformách. Anonymous a non-VIP login uživatelé ho neuvidí. VIP role (INVESTOR, VERIFIED_DEALER, ADMIN, BACKOFFICE) ho **uvidí** jako cross-platform link v PlatformSwitcheru. Direct URL `carmakler.cz/marketplace` zůstává funkční pro „ten kdo to najde nahodou" (landing page existuje, sitemap, Google index OK).

**Headline finding:** PlatformSwitcher.tsx je **JEDINÝ** zdroj cross-platform linků. Žádný z public Navbar/MobileMenu/Footer souborů (`web/`, `main/`, `inzerce/`, `shop/`) nemá hardcoded marketplace odkaz — všichni používají `<PlatformSwitcher>`. **Jediný 1-file fix** stačí pro splnění task.

**Doporučená option:** **(b') Conditional render přímo v PlatformSwitcher přes `useSession`** — žádný refactor parent komponent, žádný nový prop, single 20-line edit.

---

## §1 — Verifikovaný consumer audit

### §1.1 — Grep `marketplace` v `components/`

**12 souborů obsahuje string „marketplace":**

| Soubor | Účel | Typ | Akce |
|---|---|---|---|
| `components/ui/PlatformSwitcher.tsx` | **Single source PLATFORMS array** | source | ✅ EDITOVAT |
| `components/common/FooterBase.tsx` | `PLATFORM_BADGE_LABEL.marketplace = "Marketplace"` | type-record | ⛔ NETKNOUT (badge label, používá se když interní marketplace footer renderuje sám sebe) |
| `components/marketplace/Navbar.tsx` | Interní VIP navbar | internal | ⛔ NETKNOUT |
| `components/marketplace/Footer.tsx` | Interní VIP footer (`platformKey="marketplace"`) | internal | ⛔ NETKNOUT |
| `components/admin/AdminSidebar.tsx` | `/admin/marketplace` link v admin sidebaru | admin | ⛔ NETKNOUT |
| `components/web/marketplace/ApplyForm.tsx` | Public apply form | feature | ⛔ NETKNOUT |
| `components/web/marketplace/OpportunityCard.tsx` | VIP detail UI | feature | ⛔ NETKNOUT |
| `components/web/marketplace/OpportunityWizard.tsx` | VIP create UI | feature | ⛔ NETKNOUT |
| `components/web/marketplace/InvestModal.tsx` | VIP modal | feature | ⛔ NETKNOUT |
| `components/admin/marketplace/PaymentConfirmation.tsx` | Admin internal | admin | ⛔ NETKNOUT |
| `components/admin/marketplace/FlipManagement.tsx` | Admin internal | admin | ⛔ NETKNOUT |
| `components/pwa/vehicles/new/ContactStep.tsx` | "Facebook Marketplace" select option (false positive) | irrelevant | ⛔ NETKNOUT |

**Klíčové ověření public navbar/menu/footer souborů:**

```bash
grep -in "marketplace\|Marketplace" components/web/{Navbar,Footer,MobileMenu}.tsx
grep -in "marketplace\|Marketplace" components/main/{Navbar,Footer,MobileMenu}.tsx
grep -in "marketplace\|Marketplace" components/inzerce/{Navbar,Footer}.tsx
grep -in "marketplace\|Marketplace" components/shop/{Navbar,Footer}.tsx
```

**Výsledek:** **0 matches** ve všech 4 platforem (web, main, inzerce, shop) public Navbar/Footer/MobileMenu souborech.

**Důvod:** Všichni používají `<PlatformSwitcher>` jako single source pro cross-platform linky:

| Konzument | Soubor:Řádek | Volání |
|---|---|---|
| Main desktop nav | `components/main/Navbar.tsx:108` | `<PlatformSwitcher current="main" hideCurrent />` |
| Main mobile menu | `components/main/MobileMenu.tsx:86` | `<PlatformSwitcher current="main" variant="navbar-mobile" hideCurrent ... />` |
| Web (legacy?) Navbar | `components/web/Navbar.tsx:118` | `<PlatformSwitcher current="main" hideCurrent />` |
| Web mobile menu | `components/web/MobileMenu.tsx:92` | `<PlatformSwitcher ... />` |
| Inzerce desktop | `components/inzerce/Navbar.tsx:46` | `<PlatformSwitcher current="inzerce" hideCurrent />` |
| Inzerce mobile | `components/inzerce/Navbar.tsx:105` | `<PlatformSwitcher ... variant="navbar-mobile" />` |
| Shop desktop | `components/shop/Navbar.tsx:47` | `<PlatformSwitcher current="shop" hideCurrent />` |
| Shop mobile | `components/shop/Navbar.tsx:110` | `<PlatformSwitcher ... variant="navbar-mobile" />` |
| Marketplace internal desktop | `components/marketplace/Navbar.tsx:40` | `<PlatformSwitcher current="marketplace" hideCurrent theme="dark" />` |
| Marketplace internal mobile | `components/marketplace/Navbar.tsx:92` | `<PlatformSwitcher current="marketplace" variant="navbar-mobile" theme="dark" />` |
| FooterBase (všechny 4 platformy) | `components/common/FooterBase.tsx:238` | `<PlatformSwitcher current={platformKey} variant="footer" />` |

**Závěr:** **1 soubor = full fix** (`components/ui/PlatformSwitcher.tsx`).

### §1.2 — Aktuální PLATFORMS array (PlatformSwitcher.tsx:31–36)

```typescript
const PLATFORMS: Platform[] = [
  { key: "main", label: "CarMakléř", mobileLabel: "CarMakléř (hlavní)", href: urls.main("/") },
  { key: "inzerce", label: "Inzerce", mobileLabel: "Inzerce", href: urls.inzerce("/") },
  { key: "shop", label: "Eshop autodíly", mobileLabel: "Eshop autodíly", href: urls.shop("/") },
  { key: "marketplace", label: "Marketplace", mobileLabel: "Marketplace (VIP)", href: urls.marketplace("/") },
];
```

`marketplace` je 4. položka. Je třeba ho **podmínečně skrýt** podle role v session.

### §1.3 — VIP role (single source: middleware.ts:16-17)

```typescript
const MARKETPLACE_DEALER_ROLES = ["VERIFIED_DEALER", "ADMIN", "BACKOFFICE"];
const MARKETPLACE_INVESTOR_ROLES = ["INVESTOR", "ADMIN", "BACKOFFICE"];
```

**Sjednocení:** `["INVESTOR", "VERIFIED_DEALER", "ADMIN", "BACKOFFICE"]`

### §1.4 — SessionProvider coverage

```typescript
// app/layout.tsx:76
<AuthProvider>{children}</AuthProvider>  // SessionProvider wrapper
```

`SessionProvider` wrappuje **celou app** přes root layout. `useSession()` funguje v jakémkoli client componentu, na všech platformách (main, inzerce, shop, marketplace, pwa, admin).

---

## §2 — Root cause analýza

**Problém:** PlatformSwitcher exportuje fixní 4-prvkový array a všechny consumeři ho zobrazí celý (modulo `hideCurrent` který skryje JEN aktuální platformu).

**Důsledky:**
- Anonymous user na `/` (main) → vidí 3 odkazy v menu: Inzerce, Eshop, Marketplace ❌
- Login BUYER na `/shop` → vidí: CarMakléř, Inzerce, Marketplace ❌
- Login INVESTOR na `/inzerce` → vidí: CarMakléř, Eshop, Marketplace ✅
- Anonymous na `/marketplace` (přímý link) → vidí: CarMakléř, Inzerce, Eshop ✅ (hideCurrent)

**Cíl po fixi:**
- Anonymous user na `/` → vidí 2 odkazy: Inzerce, Eshop ✅
- Login BUYER na `/shop` → vidí: CarMakléř, Inzerce ✅
- Login INVESTOR na `/inzerce` → vidí: CarMakléř, Eshop, Marketplace ✅
- Anonymous na `/marketplace` (přímý link) → vidí: CarMakléř, Inzerce, Eshop ✅ (no change)

---

## §3 — 3 options + doporučení

### Option (a) — Hardcoded delete `marketplace` z PLATFORMS

```typescript
// PŘED
{ key: "marketplace", label: "Marketplace", ... }, ← REMOVE

// PO
const PLATFORMS: Platform[] = [main, inzerce, shop];  // 3 items
```

**Pro:**
- 1-line removal, simple
- Žádný session check, žádný client component
- PlatformSwitcher zůstává server component
- Bundle nemění

**Proti:**
- VIP role (INVESTOR, VERIFIED_DEALER) **už nikdy** neuvidí marketplace v menu — nemůžou navigovat z main/shop/inzerce zpět do marketplace bez bookmarku
- Acceptance criteria #3, #4, #5 (VIP user vidí marketplace) **fail**

**Verdict:** ❌ Nesplňuje team-lead's AC.

---

### Option (b) — Parent passes `showVip` prop, derived from session

```typescript
// PlatformSwitcher.tsx
export interface PlatformSwitcherProps {
  current: PlatformKey;
  showVip?: boolean;  // ← NEW
  // ...
}

export function PlatformSwitcher({ current, showVip = false, ... }) {
  const visiblePlatforms = PLATFORMS.filter(
    (p) => p.key !== "marketplace" || showVip || current === "marketplace"
  );
  // ...
}

// Parent navbar (server)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function MainNavbar() {
  const session = await getServerSession(authOptions);
  const isVip = ["INVESTOR", "VERIFIED_DEALER", "ADMIN", "BACKOFFICE"].includes(
    session?.user?.role ?? ""
  );
  return (
    <header>
      <PlatformSwitcher current="main" hideCurrent showVip={isVip} />
      {/* ... */}
    </header>
  );
}
```

**Pro:**
- PlatformSwitcher zůstává server component (žádný hydration cost)
- Explicit data flow (parent → child)
- Testovatelné bez SessionProvider mock

**Proti:**
- Vyžaduje **edit ve VŠECH 7 parent navbarech** (main, web, inzerce, shop, marketplace × desktop+mobile + FooterBase)
- Některé navbary jsou dnes server (Main, Inzerce, Shop) — přidání `await getServerSession()` je drobný overhead, ale **spustí dynamic rendering** → konflikt s #82 PERF audit (cílem #82 je dostat tyto layouty do ISR/SSG)
- Některé navbary jsou client (MainMobileMenu, MarketplaceNavbar) — potřebovaly by `useSession()` místo getServerSession
- **Mixed pattern** (server + client navbary) → nutno řešit dva způsoby získání session
- `MainMobileMenu` je client wrapped v `MainNavbar` (server). Předání props serveru → klient OK, ale duplikace logiky

**Verdict:** ⚠️ Funguje, ale dotýká se 7 souborů a komplikuje #82 PERF audit (nutí parent navbary dynamic).

---

### Option (b') — DOPORUČENÉ — `useSession` přímo v PlatformSwitcher

```typescript
// components/ui/PlatformSwitcher.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { urls } from "@/lib/urls";

export type PlatformKey = "main" | "inzerce" | "shop" | "marketplace";

const VIP_ROLES = new Set(["INVESTOR", "VERIFIED_DEALER", "ADMIN", "BACKOFFICE"]);

interface Platform {
  key: PlatformKey;
  label: string;
  mobileLabel: string;
  href: string;
  vipOnly?: boolean;  // ← NEW flag
}

const PLATFORMS: Platform[] = [
  { key: "main", label: "CarMakléř", mobileLabel: "CarMakléř (hlavní)", href: urls.main("/") },
  { key: "inzerce", label: "Inzerce", mobileLabel: "Inzerce", href: urls.inzerce("/") },
  { key: "shop", label: "Eshop autodíly", mobileLabel: "Eshop autodíly", href: urls.shop("/") },
  { key: "marketplace", label: "Marketplace", mobileLabel: "Marketplace (VIP)", href: urls.marketplace("/"), vipOnly: true },
];

export function PlatformSwitcher({ current, hideCurrent, variant, theme, onLinkClick }: PlatformSwitcherProps) {
  const { data: session } = useSession();
  const isVip = VIP_ROLES.has((session?.user?.role as string) ?? "");

  const visiblePlatforms = PLATFORMS.filter((p) => {
    // VIP-only platforma: skryj non-VIP uživatelům
    if (p.vipOnly && !isVip && current !== p.key) return false;
    // hideCurrent: skryj aktuální platformu
    if (hideCurrent && p.key === current) return false;
    return true;
  });

  // ... existující render logika beze změny
}
```

**Klíčové detaily:**
1. `"use client"` directive (PlatformSwitcher se stane client component)
2. `useSession()` čte session z SessionProvider context (root layout)
3. Filter logika:
   - Non-VIP user: marketplace **skrytý** (return false)
   - VIP user: marketplace **viditelný**
   - Marketplace user na marketplace: marketplace **viditelný** ale `hideCurrent` ho stejně schová (no change)
   - Edge case: anonymous user na marketplace landing → `current === "marketplace"` → marketplace zůstává v array, ale `hideCurrent` ho schová → výsledek: vidí jen main, inzerce, shop ✅

4. **Žádný refactor parent komponent** — všechna existující volání `<PlatformSwitcher current="..." />` fungují beze změny
5. **Žádný nový prop** — backward compat
6. **Žádný server impact** — parent navbary zůstávají jak jsou (server/client mix nevadí, server může renderovat client)

**Pro:**
- ✅ **Single 20-line edit** v jednom souboru
- ✅ Žádný refactor 7 parent komponent
- ✅ Backward compat (žádné breaking changes v API)
- ✅ Žádný impact na #82 PERF audit (parent navbary nemusí načítat session)
- ✅ Splňuje všechny AC (anonym/non-VIP nevidí, VIP vidí)
- ✅ Edge case marketplace landing pro anonyma OK (hideCurrent funguje)

**Proti:**
- ⚠️ PlatformSwitcher se stává client component → **+~2KB bundle** (next-auth/react useSession)
- ⚠️ První render bez session: `session === undefined` → `isVip = false` → marketplace skryt; po hydraci a session loadu se může VIP user dočkat „flash" (krátký moment kdy marketplace nesvítí, pak ho vidí). **Mitigation:** SessionProvider má `status === "loading"` který lze využít: pokud loading, nezobrazovat marketplace (stejně jako non-VIP) → žádný flash, jen krátké zpoždění. Alternativně použít `next-auth` `getServerSession` v parent + předat jako prop (= Option b).
- ⚠️ Nutí PlatformSwitcher být client → server-side fallback v RSC build neukáže marketplace (acceptable, anonymous-default je správný initial state)

**Verdict:** ✅ **DOPORUČENO**. Optimální poměr complexity:value, zero refactor cost, 1-file change.

---

### Option (c) — Split do 2 PLATFORMS arrays (PUBLIC + VIP)

```typescript
const PUBLIC_PLATFORMS: Platform[] = [main, inzerce, shop];
const VIP_PLATFORMS: Platform[] = [main, inzerce, shop, marketplace];

// V parentu
<PlatformSwitcher platformList={isVip ? VIP_PLATFORMS : PUBLIC_PLATFORMS} ... />
```

**Pro:**
- Explicit data, žádný session leak do switcher
- PlatformSwitcher zůstává server component

**Proti:**
- Stejný problém jako Option (b): parent musí zjistit session → 7 parent edits + dynamic navbar problém
- Duplikace arrays
- API leak: konzument musí znát strukturu Platform[]

**Verdict:** ❌ Nejhorší ze tří — kombinuje slabiny (a) i (b).

---

### §3.4 — Doporučená cesta: Option (b')

| Kritérium | (a) Delete | (b) Prop | (b') useSession | (c) 2 arrays |
|---|---|---|---|---|
| Soubory k editaci | 1 | 7+ | **1** | 7+ |
| AC: VIP vidí marketplace | ❌ | ✅ | ✅ | ✅ |
| AC: anonymous nevidí | ✅ | ✅ | ✅ | ✅ |
| Backward compat (props) | N/A | ⚠️ nový prop | ✅ | ❌ breaking |
| Impact #82 PERF audit | žádný | ⚠️ navbary dynamic | žádný | ⚠️ navbary dynamic |
| Bundle size cost | 0 | 0 | +~2 KB | 0 |
| First-render flash | žádný | žádný | ⚠️ krátký (mitigatable) | žádný |
| Code complexity | 1 řádek | středně | 20 řádků v 1 souboru | středně |
| **Doporučení** | | | **✅** | |

---

## §4 — Konkrétní edit `components/ui/PlatformSwitcher.tsx`

### §4.1 — Diff

```diff
+ "use client";
+
  import Link from "next/link";
+ import { useSession } from "next-auth/react";
  import { urls } from "@/lib/urls";

  export type PlatformKey = "main" | "inzerce" | "shop" | "marketplace";

+ const VIP_ROLES = new Set(["INVESTOR", "VERIFIED_DEALER", "ADMIN", "BACKOFFICE"]);
+
  interface Platform {
    key: PlatformKey;
    label: string;
    mobileLabel: string;
    href: string;
+   vipOnly?: boolean;
  }

  const PLATFORMS: Platform[] = [
    { key: "main", label: "CarMakléř", mobileLabel: "CarMakléř (hlavní)", href: urls.main("/") },
    { key: "inzerce", label: "Inzerce", mobileLabel: "Inzerce", href: urls.inzerce("/") },
    { key: "shop", label: "Eshop autodíly", mobileLabel: "Eshop autodíly", href: urls.shop("/") },
-   { key: "marketplace", label: "Marketplace", mobileLabel: "Marketplace (VIP)", href: urls.marketplace("/") },
+   { key: "marketplace", label: "Marketplace", mobileLabel: "Marketplace (VIP)", href: urls.marketplace("/"), vipOnly: true },
  ];

  export function PlatformSwitcher({
    current,
    hideCurrent = false,
    variant = "navbar",
    theme = "light",
    onLinkClick,
  }: PlatformSwitcherProps) {
+   const { data: session, status } = useSession();
+   const isVip = status === "authenticated" && VIP_ROLES.has((session?.user?.role as string) ?? "");
+
    const visiblePlatforms = PLATFORMS.filter((p) => {
+     // VIP-only platformy: skryj non-VIP uživatelům (kromě případu kdy aktuálně browsí marketplace)
+     if (p.vipOnly && !isVip && current !== p.key) return false;
+     // hideCurrent: skryj aktuální platformu
      if (hideCurrent && p.key === current) return false;
      return true;
    });

    // ... zbytek render logiky beze změny
  }
```

### §4.2 — Pozn. k existujícímu filtru

PlatformSwitcher pravděpodobně už má nějaký filter logiku pro `hideCurrent`. Implementator si ji ověří otevřením souboru — pokud je inline `.map()` bez explicit filtru, nahradí ji výše uvedeným vzorem `.filter().map()`. Pokud existuje pomocná funkce, integruje filter dovnitř.

### §4.3 — Loading state mitigation (volitelné)

`useSession()` vrací `status: "loading" | "authenticated" | "unauthenticated"`. První render po hydraci může být krátký moment v `loading`. Aktuální logika:

```typescript
const isVip = status === "authenticated" && VIP_ROLES.has(...);
```

→ Během `loading`: `isVip = false` → marketplace skryt (default safe state). Po authenticated re-render → marketplace appears pro VIP. Žádný „false flash" (uživatel nikdy nevidí marketplace pak nezmizí).

Pokud chceme **úplně zabránit** krátkému „delayed appear" pro VIP, můžeme přidat optimistic skeleton během loading. **Mimo scope tohoto plánu** — ux is acceptable as-is.

---

## §5 — Files NETKNOUT (hard rule)

| Soubor | Důvod |
|---|---|
| `app/(web)/marketplace/page.tsx` | Public landing — zůstává accessible přes přímý URL |
| `app/(web)/marketplace/apply/page.tsx` | Public apply form (#29) — zůstává accessible |
| `app/(web)/marketplace/dealer/`, `investor/` | Gating funguje přes middleware (#27, #30) |
| `components/marketplace/Navbar.tsx` | Interní VIP navbar — pro logged-in INVESTOR/VERIFIED_DEALER |
| `components/marketplace/Footer.tsx` | Interní VIP footer |
| `components/admin/AdminSidebar.tsx` | Admin internal — `/admin/marketplace` BackOffice management |
| `app/sitemap.ts` | Marketplace v sitemap (Google index OK) |
| `components/common/FooterBase.tsx` (PLATFORM_BADGE_LABEL) | Badge label record — používá se když interní marketplace footer vykresluje sebe |

---

## §6 — Acceptance criteria mapping

| AC | Test scenario | Expected | Verifikace přes |
|---|---|---|---|
| Anonymous na `/` | Open `localhost:3000/`, otevřít desktop nav + mobile menu + footer | Marketplace odkaz **NEVIDITELNÝ** ve všech 3 místech | Manual browser + Playwright |
| Anonymous na `/shop` | Open `/shop`, navbar/footer | Marketplace **NEVIDITELNÝ** | Browser |
| Anonymous na `/inzerce` | Open `/inzerce`, navbar/footer | Marketplace **NEVIDITELNÝ** | Browser |
| Anonymous na `/marketplace` (přímý URL) | Open `/marketplace` | Landing zobrazí, internal navbar (MarketplaceNavbar) ukáže CarMakléř/Inzerce/Shop (žádný marketplace bod, hideCurrent) | Browser |
| Login BUYER na `/` | Login buyer@example.cz, navbar | Marketplace **NEVIDITELNÝ** | Manual login |
| Login BROKER na `/makler/dashboard` | Login broker, PWA | PWA TopBar nemá PlatformSwitcher (out of scope) ✅ | N/A |
| Login INVESTOR na `/` | Login investor (seed), navbar | Marketplace **VIDITELNÝ** | Manual login |
| Login VERIFIED_DEALER na `/inzerce` | Login dealer, navbar | Marketplace **VIDITELNÝ** | Manual login |
| Login ADMIN na `/shop` | Login admin, navbar | Marketplace **VIDITELNÝ** | Manual login |
| Login BACKOFFICE na `/` | Login backoffice, navbar | Marketplace **VIDITELNÝ** | Manual login |
| `carmakler.cz/marketplace` direct URL | Anonymní GET | 200 OK, landing render | Playwright |
| `carmakler.cz/marketplace/dealer` gating | Anonymní GET | Redirect na login (middleware #27/#30) | Vitest middleware test |
| Sitemap `/marketplace` | GET `/sitemap.xml` | Obsahuje `https://www.carmakler.cz/marketplace` | grep |
| Žádné 404 | Click všechny PlatformSwitcher linky | 200 OK | Browser |

---

## §7 — Risk assessment

| Risk | Severity | Mitigation |
|---|---|---|
| PlatformSwitcher se stává client → SSR HTML pro VIP user neukáže marketplace okamžitě | **LOW** | Default safe state (skryté). VIP user uvidí marketplace po hydraci (~50ms). Žádný „false flash" (skryté → viditelné je acceptable). |
| `useSession` requires SessionProvider | **NONE** | SessionProvider wrappuje root layout (`AuthProvider`) — funguje globálně |
| Bundle size +~2 KB | **LOW** | next-auth/react už je v projektu (login flows). Žádný novej dep |
| Server-rendered fallback v statických ISR/SSG stránkách | **LOW** | Marketplace skrytý v cached HTML (default state) — VIP role hydratuje client-side |
| #82 PERF audit konflikt | **NONE** | Tato změna **NEZAVÁDÍ** session check do žádného layoutu — opačně pomáhá #82 (parent navbary zůstávají statické) |
| Test breakage | **LOW** | Pokud existují unit testy PlatformSwitcheru (vitest), `useSession` bude potřebovat mock. Implementator si ověří. |
| Marketplace badge label v FooterBase | **NONE** | `PLATFORM_BADGE_LABEL.marketplace` se používá jen když `platformKey="marketplace"` (interní footer) — nepostihuje public footery |
| Marketplace internal Navbar/Footer | **NONE** | `current="marketplace"` + `hideCurrent` schová marketplace ze switcheru → ukáže zbylé 3 platformy (main, inzerce, shop) — beze změny |

**Overall risk:** **VERY LOW**. Single isolated file edit, zero schema/API changes, backward compat preserved.

---

## §8 — Rollback plán

Pokud cokoli selže:

1. **Revert single file:** `git revert <commit>` nebo `git checkout HEAD -- components/ui/PlatformSwitcher.tsx`
2. Zero downstream impact (žádné DB migrace, žádné env changes)
3. **Hot rollback time:** ~30 sekund

---

## §9 — Implementation checklist (pro implementatora)

- [ ] **STEP 1** — Otevřít `components/ui/PlatformSwitcher.tsx`, ověřit aktuální strukturu (filter logika existuje? export type? props?)
- [ ] **STEP 2** — Přidat `"use client"` directive na řádek 1
- [ ] **STEP 3** — Import `import { useSession } from "next-auth/react";`
- [ ] **STEP 4** — Definovat `VIP_ROLES` constant (Set 4 stringů)
- [ ] **STEP 5** — Přidat `vipOnly?: boolean` field do `Platform` interface
- [ ] **STEP 6** — Označit marketplace položku v PLATFORMS array `vipOnly: true`
- [ ] **STEP 7** — V komponentě: `const { data: session, status } = useSession();`
- [ ] **STEP 8** — Computed `isVip` flag
- [ ] **STEP 9** — Filter `PLATFORMS` před renderem (vipOnly + hideCurrent)
- [ ] **STEP 10** — `npm run lint && npm run build` — must pass
- [ ] **STEP 11** — `npx vitest run __tests__/components/PlatformSwitcher.*` (pokud existují testy — pravděpodobně ne, je to UI komponenta)
- [ ] **STEP 12** — Manual test: `npm run dev`, otevřít:
  - `localhost:3000/` (anonymous) → marketplace **NEVIDITELNÝ**
  - Login jako admin@carmakler.cz → reload → marketplace **VIDITELNÝ**
  - Login jako buyer (seed) → marketplace **NEVIDITELNÝ**
  - `localhost:3000/marketplace` (anonymous) → landing zobrazí, switcher v header ukáže main+inzerce+shop
- [ ] **STEP 13** — Commit s message `fix(#101): hide marketplace from public menu (VIP-only via useSession)`

**Total time estimate:** 30–45 min včetně manual testů.

---

## §10 — Návaznosti

### §10.1 — Batch s #100 (#104 IMPL)

Team-lead doporučil **batch implementation** #100 + #101 v jednom commitu (#104). **Soubor #100 a #101 je různý** — #100 edituje `lib/urls.ts`, #101 edituje `components/ui/PlatformSwitcher.tsx`. **Žádný conflict.**

**Doporučený postup pro #104:**
1. Commit 1 (atomic): #100 fix `lib/urls.ts` + `.env.example`
2. Commit 2 (atomic): #101 fix `components/ui/PlatformSwitcher.tsx`
3. NEBO 1 commit s 2 logickými změnami v message body

Implementator si vybere podle preference. Doporučuju **2 atomic commits** pro snadnější revert kterékoli změny zvlášť.

### §10.2 — #102 návaznost

#102 (Marketplace landing přidat sekce Pravidla / Podmínky / Rizika) přímo navazuje na business logiku #101: marketplace landing **musí mít** content viditelný pro „ten kdo to najde nahodou", protože jediný způsob jak se tam dostat je přímý URL / Google. #102 plán je sequenced AFTER #101 implementation.

### §10.3 — Sitemap zachování

`app/sitemap.ts` zůstává beze změny — `marketplace` je v sitemap → Google indexuje landing. Direct URL access (např. ze Search Results) funguje. Implementator NESMÍ omylem odebrat marketplace ze sitemap.

### §10.4 — VIP user UX po fixi

VIP user (INVESTOR/VERIFIED_DEALER/ADMIN/BACKOFFICE) **stále musí mít** snadný způsob jak se dostat do marketplace. Po fixi:

1. **Login** → po loginu redirect (současný behavior) → pokud INVESTOR/VERIFIED_DEALER → na `/marketplace/dealer` nebo `/investor` (verify v lib/auth.ts redirect logic)
2. **Cross-platform navigace** → PlatformSwitcher v jakémkoli navbaru ukáže Marketplace pro VIP role
3. **User profile menu** → mimo scope, ale možný follow-up: přidat „Marketplace VIP" link do user dropdown menu na all platforms

**TODO follow-up (mimo scope #101):** Ověřit že login redirect pro INVESTOR/VERIFIED_DEALER vede na marketplace dashboard, ne na main `/`. Pokud ne, vytvořit follow-up task.

---

## §11 — Open questions pro team-leada

### Q1 — Loading state behavior
Během `useSession() status === "loading"` (typicky 50–200 ms po hydraci) marketplace bude **skrytý** pro VIP user. Po authenticated re-render se objeví. Akceptovatelné UX, NEBO chceš:
- (a) Optimistic skeleton během loading
- (b) Server-side session injection (Option b — vyžaduje refactor 7 parent komponent)

**Doporučení:** akceptovat default (a) → není rušivé.

### Q2 — VIP role enum source of truth
Aktuálně `VIP_ROLES` v PlatformSwitcheru bude duplikace `MARKETPLACE_*_ROLES` v middleware.ts:16-17. Chceš:
- (a) Hardcoded duplikace v PlatformSwitcheru (pragmatic, single use)
- (b) Sdílený export `lib/marketplace-roles.ts` s konstantami → import v middleware.ts + PlatformSwitcheru + případně lib/auth.ts

**Doporučení:** (b) — clean approach. Implementator vytvoří `lib/auth-roles.ts` s `VIP_MARKETPLACE_ROLES = ["INVESTOR", "VERIFIED_DEALER", "ADMIN", "BACKOFFICE"]`. Mírně zvětší scope (1 file extra) ale zlepší maintainability.

### Q3 — User profile menu cross-link
Chceš v této task vložit follow-up:
- Přidat „Marketplace VIP" link do user dropdown menu (pokud existuje) — sekundární navigace pro VIP user
- NEBO ponechat jako separate follow-up task

**Doporučení:** separate follow-up task. Mimo scope #101.

### Q4 — Sitemap.xml conditional?
Aktuálně sitemap obsahuje `/marketplace`. Chceš:
- (a) Zachovat (Google index OK, „ten kdo to najde nahodou" přes Google search)
- (b) Odebrat ze sitemap (úplně private)

**Doporučení:** (a) — zachovat. Konzistentní s user pokyn „ten kdo to najde nahodou super".

### Q5 — Marketplace internal navbar pattern
`components/marketplace/Navbar.tsx:40` má `<PlatformSwitcher current="marketplace" hideCurrent />`. Po fixi: pro non-VIP anonymního usera na `/marketplace` landing — interní navbar zobrazí switcher s 3 platformami (main, inzerce, shop), což je správně. Pro VIP user na `/marketplace/dealer` — interní navbar zobrazí stejné 3 (marketplace skryt přes hideCurrent). **Žádné anomálie.** Pouze zaznamenat.

---

## §12 — Súmr pro Evžen review

**Co se mění:** Jeden soubor (`components/ui/PlatformSwitcher.tsx`), ~20 řádků diffu, žádné DB/API/env changes.

**Co se NEMĚNÍ:** 7 parent navbarů, FooterBase, marketplace internal komponenty, admin sidebar, sitemap, marketplace landing/apply pages, all marketplace gating logic.

**Splňuje user pokyn:** ✅
- „nemělo by to bejt nikde v menu" → public users nevidí marketplace v žádném public navbaru/footeru
- „pro ty co ví" → VIP role (INVESTOR, VERIFIED_DEALER, ADMIN, BACKOFFICE) vidí marketplace v menu
- „ten kdo to najde nahodou super" → direct URL `/marketplace` funguje, sitemap zachován pro Google indexing
- „musí videt podmínky/vyhody/řád" → #102 dořeší (přidat Pravidla/Rizika sekci na landing)

**Velikost:** S (~30–45 min implementace, jednoduché manual testy)

**Risk:** Very low (single isolated file, žádné breaking changes, backward compat)

**Návaznost:** Batch s #100 v #104 IMPL (různé soubory, žádný conflict).

**Akce po schválení:** Team-lead vytvoří/aktualizuje #104 IMPL a dispatche implementatora s linkem na tento plán + plan-task-100.md.
