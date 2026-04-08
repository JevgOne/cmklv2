# Plan — Task #161: Stripe Connect Express onboarding UI pro partnery

**Autor:** planovac
**Datum:** 2026-04-08
**Parent:** #88a-stripe-onboarding (logické pokračování #88a Wolt model)
**Precedent (formátování):** `plan-task-154-88a-wolt-dispatch.md`
**Dispatcher (lead):** čeká na schválení tohoto plánu → dispatch implementator

---

## §1 — Executive summary

#88a Wolt model (commission-split pipeline, PartnerDetail UI, graceful fallback) je HOTOVO a deploy v progress (#160). Q1 v `plan-task-154-88a-wolt-dispatch.md` §16 LEAD DECISIONS rozhodl: `Partner.stripeAccountId` je nullable a `applyCommissionSplit()` v `app/api/stripe/webhook/route.ts:243-249` dělá graceful fallback (pokud chybí Stripe účet → `console.warn` + pokračuje; snapshot do `OrderItem.commissionRateApplied/carmaklerFee/supplierPayout` je zdroj pravdy pro manuální vyplacení).

**Důsledek:** v DB máme 0 partnerů s napojeným Stripe účtem, takže 100 % commission splitů dnes jede přes manuální payout. Tohle je dlouhodobě neudržitelné — jakmile porosteme na 50+ vrakovišť, manuální bankovní převody podle snapshotu zadusí finance team.

**Scope #161:** Přidat chybějící UI a backend pro self-service Stripe Connect Express onboarding. Partner klikne "Napoj Stripe účet" → Stripe hosted onboarding → vrátí se → status se propíše do DB → příští commission transfer už projde automaticky.

**Klíčové prvky:**
1. **Stripe Connect Express** (ne Standard, ne Custom) — Stripe hostuje celý flow, Express dashboard pro re-edit, minimální compliance overhead pro Carmakler.
2. **Schema extension:** `stripeOnboardingStartedAt`, `stripeDetailsSubmitted`, `stripePayoutsEnabled`, `stripeChargesEnabled`, `stripeRequirementsCurrentlyDue`, `stripeDisabledReason`, `stripeOnboardingCompletedAt` — mirror Stripe account status.
3. **3 nové API endpointy:** `POST /api/stripe/connect/onboard-link`, `GET /api/stripe/connect/status`, `POST /api/stripe/connect/dashboard-link`.
4. **Webhook extension:** `account.updated` handler synchronizuje DB flags.
5. **2 UI entry pointy:** 
   - Partner self-service v `/parts/profile` (primary — PWA dodavatele dílů)
   - Admin override v `/admin/partners/[id]` PartnerDetail (diagnostika + refresh)
6. **Graceful fallback zůstává beze změn** — Express onboarding je opt-in upgrade, ne povinný blocker transakcí.

**Co tenhle task NENÍ:**
- NENÍ refactor commission splitu (ten zůstává v `webhook/route.ts:191-274` beze změn).
- NENÍ Stripe Standard/Custom (jen Express — rozhodnutí v §3).
- NENÍ tax compliance (Stripe Express to řeší sám pro EU trh).
- NENÍ UI pro marketplace dealery (ti mají vlastní Partner záznamy, ale marketplace je samostatný produkt — viz §15 OUT OF SCOPE).

---

## §2 — Codebase research

### §2.1 — Existující Stripe infrastruktura

**`lib/stripe.ts` (147 řádků):**
- `getStripe()` — lazy singleton, throws if `STRIPE_SECRET_KEY` chybí. API version `2026-02-25.clover`.
- `STRIPE_WEBHOOK_SECRET` — exported z env.
- `CARMAKLER_BANK` — legacy bankovní údaje.
- `COMMISSION_CONFIG` + `calculateCommission()` — **legacy broker commission** (5 % z prodejní ceny aut, min. 25 000 Kč). **NESOUVISÍ** s Partner.commissionRate (ten je pro parts marketplace).
- `generateVariableSymbol(vehicleId)` — legacy.
- `createPayoutRecords()` — legacy, pro makléře.

**Důsledek pro #161:** `lib/stripe.ts` zůstává jako tenký wrapper. Stripe Connect helpers přidáme do samostatného `lib/stripe-connect.ts` — jasná separace: "stripe.ts = config + legacy broker", "stripe-connect.ts = marketplace seller onboarding".

**`app/api/stripe/webhook/route.ts` (422 řádků):**
- POST handler (řádky 24-96) validuje podpis přes `stripe.webhooks.constructEvent()`.
- Switch na `event.type` (řádky 47-86): `checkout.session.completed`, `charge.refunded`.
- `handleOrderPayment(orderId)` (řádky 152-184) volá `applyCommissionSplit()` v try-catch.
- `applyCommissionSplit()` (řádky 191-274):
  - Načte `OrderItem` s `supplier.partnerAccount.{id,name,commissionRate,stripeAccountId}`.
  - Replay guard: skip pokud `commissionRateApplied !== null`.
  - Paralelní snapshot updates přes `Promise.all`.
  - Serial `stripe.transfers.create({ destination: partner.stripeAccountId, transfer_group: 'order_${orderId}', ... }, { idempotencyKey: 'commission_${orderId}_${item.id}' })`.
  - **Graceful fallback (řádky 243-249):** `if (!partner?.stripeAccountId) { console.warn(...); continue; }` — transfer je skipnut, ale snapshot v DB zůstává autoritativní.

**Důsledek pro #161:** Do switche v řádcích 47-86 přidáme nový case `"account.updated"`. Volá `handleStripeAccountUpdate(event.data.object)`. Tenhle handler NEZASAHUJE do commission logiky — jen updatuje `Partner.stripe*` flags.

**`app/api/stripe/` adresář:**
```
stripe/
  webhook/
    route.ts    ← existující webhook
```
Žádný `onboard-link`, `status`, `dashboard-link`. Čistá tabule.

**Důsledek pro #161:** Nová podsložka `app/api/stripe/connect/` s `onboard-link/route.ts`, `status/route.ts`, `dashboard-link/route.ts`.

**`.env.example` stripe entries (ověřeno v §5 research):**
```
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```
Žádné `STRIPE_CONNECT_*` entries. Connect účty používají jeden globální platform account (stejný `STRIPE_SECRET_KEY`), takže nové env proměnné NEJSOU potřeba.

### §2.2 — Schema (Prisma)

**`prisma/schema.prisma` model Partner (řádky 1651-1704):**
```prisma
model Partner {
  id              String   @id @default(cuid())
  name            String
  type            String                           // AUTOBAZAR | VRAKOVISTE
  // ...
  email           String?                          // ← použijeme pro Stripe account
  // ...
  userId          String? @unique
  user            User? @relation("PartnerUser", fields: [userId], references: [id])

  commissionRate    Decimal  @default(15.00) @db.Decimal(4, 2)
  commissionRateAt  DateTime @default(now())
  stripeAccountId   String?                        // ← už existuje (přidáno #88a)

  // ... (žádné jiné stripe* sloupce)
}
```

**Důsledek pro #161:** `stripeAccountId` zůstává jak je. Přidáme 7 nových sloupců (viz §4).

**`OrderItem.commissionRateApplied/carmaklerFee/supplierPayout` (schema.prisma:1074-1076):**
- Snapshot pattern z #88a. NEDOTÝKÁME se, jen fact o tom že commission split funguje i bez Stripe Connect.

### §2.3 — UI integration points

**`components/admin/partners/PartnerDetail.tsx` (767 řádků):**
- Card "Provize" (řádky 438-476):
  - Zobrazí `commissionRate` + `commissionRateAt`.
  - **Řádky 454-460 už ukazují amber warning** když `!partner.stripeAccountId`:
    > "Stripe Connect účet zatím nepřipojen — výplaty proběhnou manuálně bankovním převodem (snapshot v `OrderItem` je autoritativní)."
  - Button "Upravit sazbu" (řádky 461-471) → `CommissionEditDialog`.
- Card "Stav a přiřazení" (řádky 499-540) — status, score, manager, user account badge.

**Důsledek pro #161:** Přidáme novou Card **"Stripe Connect"** mezi Provize a Stav a přiřazení (řádek ~497). Existující amber warning v Provize kartě odstraníme (bude nahrazen dedikovanou kartou). Interface `Partner` rozšíříme o nové stripe* fieldy.

**`app/(pwa-parts)/parts/profile/page.tsx` (147 řádků):**
- Client page "use client".
- Fetchuje `/api/partner/profile` (GET) a updatuje přes (PUT).
- Cards: User info (řádky 79-91), Edit form "Verejny profil" (řádky 94-134), Logout (řádky 137-144).

**Důsledek pro #161:** Přidáme novou Card **"Stripe Connect"** mezi "Verejny profil" a "Odhlasit se" (řádek ~135). Card bude obsahovat:
- Status display (5 stavů — viz §8.2).
- CTA button "Napoj Stripe účet" / "Dokončit onboarding" / "Upravit v Stripe dashboardu".
- Informativní text proč je to důležité ("Bez napojení výplaty jdou manuálně — může to zpozdit platbu o 5-10 dní").

### §2.4 — Partner PWA API surface

**`app/api/partner/profile/route.ts`** (existuje, ověřeno přes `ls app/api/partner/`):
- Obsluhuje partner self-service GET/PUT profil.
- #161 **NEZASAHUJE** do tohoto souboru — nové stripe endpointy jdou do `app/api/stripe/connect/`.

### §2.5 — Související plány a rozhodnutí

**`plan-task-154-88a-wolt-dispatch.md` §16 LEAD DECISIONS (verbatim citace):**

> **Q1:** Stripe Connect onboarding status — Decision: ACCEPT planovac recommendation (a) — sloupec přidat, onboarding UI = separate task.
>
> **Rationale (lead):** Onboarding UI je samostatný task #88a-stripe-onboarding (Stripe Connect Express flow pro vrakoviště) — POZDĚJI, NE blocker pro #88a. V tomto tasku stačí mít column ready + graceful fallback pokud chybí. Commission split se aplikuje až po onboarding, do té doby je `null` a webhook to musí tolerovat.

**Důsledek pro #161:** Tenhle task je přímý potomek Q1. Graceful fallback pattern z #88a JE dlouhodobě validní — Express onboarding je UPGRADE, ne migrace. Partneři bez Stripe účtu dál fungují, jen s manuálním payoutem.

**`memory/project_vrakoviste_business_model.md`:**
> Vrakoviště používá PWA ZDARMA, Carmakler si bere provizi z prodaných dílů (jako Wolt/Glovo). NE subscription.

**Důsledek pro #161:** Onboarding UX musí být **friction-free** — žádné trial zdrženky, žádné "dokončíte později". Partner klikne jednou, Stripe sbírá dokumenty, vrátí se. Pokud se partner lekne KYC → nesmí ho to vyhodit z ekosystému (graceful fallback = manuální payout zůstává fungovat).

**`memory/project_wolt_model_platform_wide.md`:**
> Wolt model (free tool, commission, marketplace liquidity) platí pro VŠECHNY marketplace produkty. KPI #1 = liquidity.

**Důsledek pro #161:** Express onboarding nesmí bránit liquidity. Pokud partner nechce Stripe, dál může prodávat díly — jen mu Carmakler posílá peníze bankou. Tohle je strategické rozhodnutí (ne technické).

### §2.6 — Rozsah partnerů (kdo může dělat onboarding?)

**Model `Partner.type`** má 2 hodnoty: `AUTOBAZAR`, `VRAKOVISTE`. Oba typy mají `PartnerAccount` přes `User.partnerAccount` a dodávají `OrderItem`y přes parts marketplace.

**Rozsah #161:**
- ✅ **VRAKOVISTE (primary)** — dodavatelé dílů, primární cílová skupina #88a.
- ✅ **AUTOBAZAR (secondary)** — mohou také dodávat díly z rozebraných aut (stejný commission flow).
- ❌ **Makléři (BROKER role)** — legacy broker commission flow (`calculateCommission` v `lib/stripe.ts`) — NEJE v scope, má vlastní payout přes `createPayoutRecords()`.
- ❌ **Marketplace VIP dealeři (VERIFIED_DEALER)** — OUT OF SCOPE (viz §15). Marketplace má vlastní 40/40/20 split mechaniku, která zatím nejede přes Stripe Connect.

**Důsledek pro #161:** Partner PWA UI (`/parts/profile`) je sdílený pro VRAKOVISTE + AUTOBAZAR (oba typy se dostanou do PWA jen pokud mají aktivovaný `PARTS_SUPPLIER` user). Admin UI (`PartnerDetail.tsx`) funguje pro oba typy automaticky.

---

## §3 — Proč Stripe Connect **Express** (ne Standard, ne Custom)

Stripe Connect nabízí 3 typy connected accounts. Výběr je strategická volba na dlouho.

### §3.1 — Srovnání typů

| Aspekt | Standard | **Express** ✅ | Custom |
|---|---|---|---|
| Kdo vlastní vztah s klientem | Partner (Stripe account) | Platform (Carmakler) + Stripe | Platform plně |
| Onboarding UI | Stripe hostuje, partner vidí Stripe branding | **Stripe hostuje, minimal branding** | Carmakler musí postavit vše sám |
| Compliance odpovědnost | Stripe | **Stripe (většina)** | Carmakler (plná) |
| KYC sběr | Stripe vlastními cestami | **Stripe přes Express onboarding** | Carmakler přes API |
| Dashboard pro partnera | Plný Stripe dashboard | **Express dashboard (minimal)** | Žádný, Carmakler musí postavit |
| Dev effort | Nízký | **Nízký-střední** | Vysoký (>10× víc) |
| CZ trh support | Ano | **Ano** | Ano (ale KYC je na Carmakler) |
| Payout schedule | Stripe default (denní) | **Konfigurovatelný (weekly default)** | Carmakler řídí |
| Vhodné pro | B2B SaaS s plnou kontrolou partnera | **Marketplace (Wolt, Shopify, Substack)** | White-label SaaS |

### §3.2 — Proč Express

1. **Wolt model matching:** Wolt, Uber Eats, DoorDash, Shopify, Substack — všichni používají Express. Je to stálý marketplace pattern.
2. **Compliance offload:** Stripe řeší KYC, AML, tax forms (do výše rev share v EU). Carmakler se tomuto VYHÝBÁ pro vrakoviště která mají často chaos v účetnictví.
3. **Dev effort:** Hosted onboarding (~2-3 dny impl) vs. Custom API (~2-3 týdny impl). Pro #161 chceme MVP, ne plné white-label.
4. **Partner má Express dashboard:** Samostatně si mohou změnit bank account, stáhnout výplaty, vidět reporty. Žádná zakázka na Carmakler CS.
5. **Graceful degradation zůstává:** Express onboarding není atomicita — lze ho rozdělit na fáze (`details_submitted` → `payouts_enabled` → `charges_enabled`) a každá fáze je self-contained.

### §3.3 — Co Express **neposkytuje** (a proč je to OK)

- ❌ Plný Stripe dashboard pro partnera (chart UI, advanced reporting) → **OK**, partneři tohle nepotřebují.
- ❌ Direct charges (charge partner's account directly) → **OK**, my fungujeme přes `destination_charges` na platform account + `transfers.create()`, to v Express funguje.
- ❌ Custom onboarding UI → **OK**, redirect na Stripe hosted je UX standard který vrakoviště znají z jiných EU platforem.

**Rozhodnutí:** **Stripe Connect Express** (stejná volba jako Wolt/Shopify model).

**Alternativa pro escalation:** Pokud lead chce Custom pro "full brand control", planovač eskaluje (Custom je 5-10× víc práce a zvýší Carmakler compliance risk).

---

## §4 — Prisma schema extension

### §4.1 — Nové sloupce na `Partner`

Rozšíření modelu `Partner` o 7 sloupců (mirror Stripe account status + metadata):

```prisma
model Partner {
  // ... existující pole ...

  commissionRate                Decimal  @default(15.00) @db.Decimal(4, 2)
  commissionRateAt              DateTime @default(now())
  stripeAccountId               String?                               // existuje z #88a

  // --- NOVÉ (task #161) ------------------------------------------
  stripeOnboardingStartedAt     DateTime?                             // kdy poprvé generován onboarding link (tracking)
  stripeOnboardingCompletedAt   DateTime?                             // kdy poprvé hit `payouts_enabled = true`
  stripeDetailsSubmitted        Boolean  @default(false)              // Stripe account.details_submitted
  stripePayoutsEnabled          Boolean  @default(false)              // Stripe account.payouts_enabled (primární gate pro transfers)
  stripeChargesEnabled          Boolean  @default(false)              // Stripe account.charges_enabled (pro budoucí direct charges)
  stripeRequirementsCurrentlyDue String[]                             // Postgres text[] — seznam `requirements.currently_due`
  stripeDisabledReason          String?                               // Stripe account.requirements.disabled_reason
  stripeAccountUpdatedAt        DateTime?                             // timestamp poslední webhook sync (pro UI "Naposledy ověřeno")
  // ---------------------------------------------------------------

  activities      PartnerActivity[]
  leads           PartnerLead[]
  commissionLog   PartnerCommissionLog[]

  // ...
}
```

**Design rationale:**

- **`stripeOnboardingStartedAt`** — UX: chceme vědět kolik partnerů začalo ale nedokončilo (drop-off metric). Neexportujeme to ve webhooku, natvrdo set při prvním `POST /onboard-link`.

- **`stripeOnboardingCompletedAt`** — pro "onboarded since X days" reporting a pro prioritizaci commission transferů (freshly onboarded = validní).

- **`stripeDetailsSubmitted`** — mirror `account.details_submitted`. Je to "partner vyplnil formulář", NEJE to to samé jako "lze posílat peníze". Zobrazíme jako "Stripe zpracovává" v UI.

- **`stripePayoutsEnabled`** — **primární gate**. Commission split pipeline (`applyCommissionSplit()` v `webhook/route.ts:243`) dnes checkuje jen `!partner.stripeAccountId`. V #161 to NEMĚNÍME (graceful fallback stay). Ale v UI jasně ukazujeme tento flag jako "Výplaty aktivní".

- **`stripeChargesEnabled`** — pro budoucnost (kdybychom přešli z destination charges na direct charges). Dnes ignored, ale sbíráme data.

- **`stripeRequirementsCurrentlyDue`** — `String[]` (Postgres array). Stripe vrací třeba `["individual.verification.document", "business_profile.url"]`. Ukazujeme partnerovi konkrétní chybějící pole (přes i18n mapping → §8.3).

- **`stripeDisabledReason`** — pokud Stripe account je disabled (požadavky dlouhodobě nevyřízené), vrací string jako `"requirements.past_due"`, `"rejected.fraud"`. Admin to potřebuje vidět pro troubleshooting.

- **`stripeAccountUpdatedAt`** — UX "naposledy ověřeno před X minutami". Webhook sync set → tady.

**Design non-goal — NE přidáváme:**
- ❌ `stripeOnboardingEmailSent` — notifikace jsou out of scope #161, Q7.
- ❌ `stripePayoutSchedule` (daily/weekly) — necháváme default (weekly na pátek), lze změnit v Express dashboardu.
- ❌ `stripeBankLast4` — Stripe to drží, my ne (PCI scope minimization).

### §4.2 — Migrační strategie

```bash
npx prisma migrate dev --name add_partner_stripe_onboarding_state
```

**Rollout:**
1. Migrace přidá 8 nových sloupců s defaulty (všechny nullable nebo `false`/`[]`).
2. Existující Partner záznamy (včetně #155 pilotních) dostanou `stripeDetailsSubmitted=false`, `stripePayoutsEnabled=false`, `stripeRequirementsCurrentlyDue=[]`.
3. **Žádný backfill z Stripe API** — existující `stripeAccountId` (pokud nějaké jsou) mohou mít account ve Stripe, ale flags v DB budou stale. První pass webhooku `account.updated` po deploy je sync.
4. **Fallback pattern:** první příchozí webhook `account.updated` pro existující accountId → dohnaní flagů. Alternativně admin může kliknout "Sync ze Stripe" v PartnerDetail (§7.3 — admin button).

**Důsledek:** Migrace je bezpečná, zero-downtime, idempotentní. Žádná data loss.

### §4.3 — Indexy

```prisma
model Partner {
  // ...

  @@index([stripeAccountId])          // pro rychlý lookup z webhooku `account.updated`
  @@index([stripePayoutsEnabled])     // pro admin filtr "kteří partneři čekají na onboarding"
}
```

**Rationale:**
- `@@index([stripeAccountId])` — webhook handler dělá `prisma.partner.findFirst({ where: { stripeAccountId: account.id } })` na každém `account.updated` eventu. Musí být indexovaný (jinak sequential scan).
- `@@index([stripePayoutsEnabled])` — admin dashboard bude mít filtr "bez onboardingu", což je `where: { stripePayoutsEnabled: false }`.

---

## §5 — Backend API endpointy

### §5.1 — POST `/api/stripe/connect/onboard-link`

**Účel:** Generuje Stripe hosted onboarding URL. Pokud partner ještě nemá `stripeAccountId`, vytvoří Express account. Pokud má, jen generuje nový account link (refresh).

**Auth:** session-based, role `PARTS_SUPPLIER` (ze session) → lookup `partner.userId === session.user.id` → získá `partnerId`. Admin role `ADMIN` nebo `BACKOFFICE` může poslat `?partnerId=xxx` pro admin-initiated onboarding.

**Route file:** `app/api/stripe/connect/onboard-link/route.ts`

**Request body:**
```ts
// Partner self-service: žádný body (partner se odvodí ze session)
// Admin: ?partnerId=xxx v query (volitelné)
```

**Response:**
```ts
// 200 OK
{ url: string, expiresAt: number }  // Stripe account link expires po ~5 min

// 400 Bad Request
{ error: "partner_not_found" | "partner_missing_email" | "already_complete" }

// 500 Internal Server Error
{ error: "stripe_error", message: string }
```

**Pseudo-kód:**
```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrGetConnectAccount, createOnboardingLink } from "@/lib/stripe-connect";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Resolve partner (self-service nebo admin)
  const url = new URL(req.url);
  const adminPartnerId = url.searchParams.get("partnerId");
  const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);

  let partner;
  if (adminPartnerId) {
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    partner = await prisma.partner.findUnique({ where: { id: adminPartnerId } });
  } else {
    partner = await prisma.partner.findFirst({ where: { userId: session.user.id } });
  }

  if (!partner) return NextResponse.json({ error: "partner_not_found" }, { status: 404 });
  if (!partner.email) return NextResponse.json({ error: "partner_missing_email" }, { status: 400 });

  // 1. Create or get Stripe account
  const accountId = await createOrGetConnectAccount(partner);

  // 2. Mark onboarding started (if first time)
  if (!partner.stripeOnboardingStartedAt) {
    await prisma.partner.update({
      where: { id: partner.id },
      data: { stripeOnboardingStartedAt: new Date() },
    });
  }

  // 3. Generate onboarding link (valid ~5 min)
  const returnPath = isAdmin
    ? `/admin/partners/${partner.id}?stripe=return`
    : `/parts/profile?stripe=return`;
  const refreshPath = isAdmin
    ? `/admin/partners/${partner.id}?stripe=refresh`
    : `/parts/profile?stripe=refresh`;

  const link = await createOnboardingLink({
    accountId,
    returnPath,
    refreshPath,
  });

  return NextResponse.json({ url: link.url, expiresAt: link.expires_at });
}
```

**Idempotence:** Stripe account creation není idempotent z API (každý `accounts.create` vytvoří nový account). Proto ukládáme `stripeAccountId` hned po create a na reentry použijeme existing. **Replay guard** je v `createOrGetConnectAccount()`:

```ts
// lib/stripe-connect.ts
export async function createOrGetConnectAccount(partner: Partner): Promise<string> {
  if (partner.stripeAccountId) return partner.stripeAccountId;

  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country: "CZ",
    email: partner.email!,
    business_type: "company",  // §18 Q3 — konzultace
    capabilities: {
      transfers: { requested: true },
      // card_payments NOT requested — §18 Q1 — konzultace
    },
    business_profile: {
      name: partner.name,
      url: partner.web ?? undefined,
      mcc: "5533",  // Automotive Parts and Accessories Stores
      product_description: "Použité a nové automobilové díly z vrakoviště / autobazaru",
    },
    metadata: {
      partnerId: partner.id,
      partnerType: partner.type,
    },
  });

  // Persist hned aby další volání neudělalo duplicitu
  await prisma.partner.update({
    where: { id: partner.id },
    data: { stripeAccountId: account.id },
  });

  return account.id;
}
```

**Edge case — race condition:** dva paralelní `POST /onboard-link` od stejného partnera. Druhé volání vidí již persistovaný `stripeAccountId` a jen generuje link. Safe.

### §5.2 — GET `/api/stripe/connect/status`

**Účel:** Vrátí aktuální onboarding status partnera z DB (rychlé). Volitelně s `?refresh=1` refreshne ze Stripe API.

**Auth:** stejné jako §5.1.

**Route file:** `app/api/stripe/connect/status/route.ts`

**Response:**
```ts
{
  hasAccount: boolean;           // partner.stripeAccountId !== null
  state: "not_started" | "in_progress" | "complete" | "action_required" | "disabled";
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  requirementsCurrentlyDue: string[];
  disabledReason: string | null;
  startedAt: string | null;      // ISO
  completedAt: string | null;    // ISO
  updatedAt: string | null;      // ISO, naposledy synced z webhooku/refresh
}
```

**State derivation:**
```ts
function deriveState(p: Partner): State {
  if (!p.stripeAccountId) return "not_started";
  if (p.stripeDisabledReason) return "disabled";
  if (p.stripePayoutsEnabled) return "complete";
  if (p.stripeRequirementsCurrentlyDue.length > 0) return "action_required";
  return "in_progress";
}
```

**Refresh logika (volitelná):**
```ts
if (url.searchParams.get("refresh") === "1" && partner.stripeAccountId) {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(partner.stripeAccountId);
  await syncAccountToDb(partner.id, account);  // shared helper s webhookem
  partner = await prisma.partner.findUnique({ where: { id: partner.id } });
}
```

**Rate limit:** Manual refresh se dá zneužít → omezíme na 1× za 60 s per partner (simple in-memory counter v `lib/stripe-connect.ts` nebo jednoduchý `partner.stripeAccountUpdatedAt` check: pokud <60 s → vrátit cached).

### §5.3 — POST `/api/stripe/connect/dashboard-link`

**Účel:** Generuje Express dashboard login link (pro partnera který už dokončil onboarding a chce změnit bankovní účet / stáhnout výplaty / upravit údaje).

**Auth:** stejné jako §5.1.

**Route file:** `app/api/stripe/connect/dashboard-link/route.ts`

**Response:**
```ts
// 200 OK
{ url: string }  // Express dashboard magic link, expires ~1 min

// 400
{ error: "not_onboarded" }
```

**Pseudo-kód:**
```ts
export async function POST(req: NextRequest) {
  // ... auth + partner resolve jako v §5.1 ...

  if (!partner.stripeAccountId || !partner.stripePayoutsEnabled) {
    return NextResponse.json({ error: "not_onboarded" }, { status: 400 });
  }

  const stripe = getStripe();
  const link = await stripe.accounts.createLoginLink(partner.stripeAccountId);

  return NextResponse.json({ url: link.url });
}
```

### §5.4 — Shared library `lib/stripe-connect.ts`

**Účel:** Tenká vrstva nad `stripe.accounts.*` a `stripe.accountLinks.*` — sdílená mezi API endpointy a webhook handlerem.

**File:** `lib/stripe-connect.ts` (nový)

**Export surface:**
```ts
import type { Partner } from "@prisma/client";
import type Stripe from "stripe";

/** Vytvoří Express account pokud chybí, vrátí účetId. Atomický. */
export async function createOrGetConnectAccount(partner: Partner): Promise<string>;

/** Generuje account link pro onboarding (hosted by Stripe). */
export async function createOnboardingLink(params: {
  accountId: string;
  returnPath: string;
  refreshPath: string;
}): Promise<Stripe.AccountLink>;

/** Synchronizuje Stripe account state do DB. Použito webhookem + manual refresh. */
export async function syncAccountToDb(
  partnerId: string,
  account: Stripe.Account,
): Promise<void>;

/** Derivuje UI state z DB Partner record. */
export function deriveOnboardingState(
  partner: Pick<Partner,
    | "stripeAccountId"
    | "stripeDetailsSubmitted"
    | "stripePayoutsEnabled"
    | "stripeRequirementsCurrentlyDue"
    | "stripeDisabledReason"
  >,
): "not_started" | "in_progress" | "complete" | "action_required" | "disabled";
```

**`syncAccountToDb` — klíčový helper:**
```ts
export async function syncAccountToDb(partnerId: string, account: Stripe.Account) {
  const requirements = account.requirements?.currently_due ?? [];
  const disabledReason = account.requirements?.disabled_reason ?? null;
  const wasComplete = await prisma.partner
    .findUnique({ where: { id: partnerId }, select: { stripePayoutsEnabled: true } })
    .then((p) => p?.stripePayoutsEnabled ?? false);

  const nowComplete = !!account.payouts_enabled;

  await prisma.partner.update({
    where: { id: partnerId },
    data: {
      stripeDetailsSubmitted: !!account.details_submitted,
      stripePayoutsEnabled: nowComplete,
      stripeChargesEnabled: !!account.charges_enabled,
      stripeRequirementsCurrentlyDue: requirements,
      stripeDisabledReason: disabledReason,
      stripeAccountUpdatedAt: new Date(),
      // Set completion timestamp first time we transition to complete
      ...(nowComplete && !wasComplete
        ? { stripeOnboardingCompletedAt: new Date() }
        : {}),
    },
  });
}
```

**Idempotence:** Tohle je safe na opakované volání — webhook může přijít vícekrát (Stripe retries) a sync je čistý UPDATE s aktuálními hodnotami. Jediná non-trivial část je `stripeOnboardingCompletedAt` (set jen jednou, first transition to `payouts_enabled=true`).

---

## §6 — Webhook extension

### §6.1 — Nový case ve switchi

**File:** `app/api/stripe/webhook/route.ts` — dodám nový case do switche (řádky 47-86):

```ts
switch (event.type) {
  case "checkout.session.completed": { /* existující */ break; }
  case "charge.refunded": { /* existující */ break; }

  // --- NOVÉ (#161) ---
  case "account.updated": {
    const account = event.data.object as Stripe.Account;
    await handleStripeAccountUpdate(account);
    break;
  }
}
```

### §6.2 — Handler `handleStripeAccountUpdate`

**Umístění:** stejný soubor `webhook/route.ts` (řádky ~290), vedle `handleReservationPayment`, `handleCebiaPayment`.

```ts
async function handleStripeAccountUpdate(account: Stripe.Account) {
  // Lookup partner by accountId. Může vrátit null pokud account není "naše" (např.
  // test account, nebo Stripe poslal event pro smazaný Partner záznam).
  const partner = await prisma.partner.findFirst({
    where: { stripeAccountId: account.id },
    select: { id: true },
  });

  if (!partner) {
    console.warn(
      `[webhook] account.updated for unknown Stripe account ${account.id} — ignoring`,
    );
    return;
  }

  await syncAccountToDb(partner.id, account);
  console.log(
    `[webhook] Synced Stripe account ${account.id} → partner ${partner.id}: ` +
      `detailsSubmitted=${account.details_submitted}, payoutsEnabled=${account.payouts_enabled}`,
  );
}
```

### §6.3 — Error handling a webhook idempotency

- `handleStripeAccountUpdate` musí **nikdy** throw (stejně jako `applyCommissionSplit` — webhook musí vrátit 200, jinak Stripe retryuje). Obalení try-catch na úrovni switche.
- Idempotence je zajištěna v `syncAccountToDb` (čistý UPDATE, safe na replay).
- `partner` lookup po `stripeAccountId` vyžaduje index z §4.3.

### §6.4 — Webhook konfigurace ve Stripe Dashboardu

**Manuální step (deploy):** V Stripe Dashboard → Developers → Webhooks → upravit existující webhook endpoint → přidat event `account.updated` do listening events.

Tohle je provozní krok, ne code change. V plán-impl záznamu musí být v **dispatch checklistu** (§17). Implementator po deploy pinguje leada → lead konfiguruje webhook.

**Alternative (programmatic):** `stripe.webhookEndpoints.update()` v migration skriptu. Ale to je křehké (vyžaduje `STRIPE_WEBHOOK_ENDPOINT_ID` v env) → ponecháme manuálně.

### §6.5 — Webhook testing

**Local dev:** `stripe listen --forward-to localhost:3000/api/stripe/webhook --events account.updated`

**Trigger synthetic event:** `stripe trigger account.updated` (Stripe CLI).

**E2E validace:** viz §10 AC8.

---

## §7 — Admin UI — PartnerDetail Stripe card

### §7.1 — Umístění a layout

**File:** `components/admin/partners/PartnerDetail.tsx`

**Insertion point:** mezi existující Card "Provize" (řádky 438-476) a Card "Stav a přiřazení" (řádky 499-540). Nová Card "Stripe Connect" jde na řádek **~497** (po `CommissionEditDialog`).

**Existující amber warning** v kartě Provize (řádky 454-460) **REMOVUJEME** — jeho obsah přejde do nové dedikované karty (bohatší UI).

### §7.2 — Struktura karty

```
┌─────────────────────────────────────────────────┐
│ Stripe Connect (výplaty)                         │
│                                                   │
│ [STATUS BADGE]  Nepřipojeno                       │
│                                                   │
│ Výplaty provizních splitů jdou zatím manuálně    │
│ bankovním převodem. Snapshot v OrderItem je      │
│ zdrojem pravdy pro finance team.                  │
│                                                   │
│ [Button: Zkopírovat onboarding link]              │
│   (pošlete partnerovi)                           │
└─────────────────────────────────────────────────┘
```

**Po připojení:**

```
┌─────────────────────────────────────────────────┐
│ Stripe Connect (výplaty)                         │
│                                                   │
│ [STATUS BADGE]  Výplaty aktivní                   │
│                                                   │
│ Stripe Account: acct_1ABCxyz                      │
│ Naposledy ověřeno: před 3 minutami                │
│                                                   │
│ ✓ Údaje odeslány                                  │
│ ✓ Výplaty povoleny                                │
│ ✓ Platby povoleny                                 │
│                                                   │
│ [Button: Sync ze Stripe]  (refresh)              │
└─────────────────────────────────────────────────┘
```

**Při action required:**

```
┌─────────────────────────────────────────────────┐
│ Stripe Connect (výplaty)                         │
│                                                   │
│ [STATUS BADGE]  Vyžaduje akci                     │
│                                                   │
│ Partner začal onboarding před 2 dny, ale Stripe  │
│ potřebuje dodatečné informace:                    │
│                                                   │
│  • individual.verification.document               │
│  • business_profile.url                           │
│                                                   │
│ [Button: Zkopírovat refresh link]                 │
│ [Button: Sync ze Stripe]                          │
└─────────────────────────────────────────────────┘
```

**Při `disabled`:**

```
┌─────────────────────────────────────────────────┐
│ Stripe Connect (výplaty)                         │
│                                                   │
│ [STATUS BADGE — red]  Zakázáno                    │
│                                                   │
│ Stripe account je deaktivovaný.                   │
│ Důvod: rejected.fraud                             │
│                                                   │
│ Eskaluj finance týmu před dalšími transakcemi.   │
└─────────────────────────────────────────────────┘
```

### §7.3 — Admin akce

1. **"Zkopírovat onboarding link"** (jen když `state === "not_started"` nebo `"in_progress"` nebo `"action_required"`):
   - Volá `POST /api/stripe/connect/onboard-link?partnerId=${partner.id}`.
   - Výsledek (URL) → `navigator.clipboard.writeText()` + toast "Zkopírováno".
   - Admin pak pošle partnerovi přes Slack/email/telefon.
   - **UX rationale:** admin-initiated onboarding pro proaktivní oslovení vrakovišť.

2. **"Sync ze Stripe"** (jen když `state !== "not_started"`):
   - Volá `GET /api/stripe/connect/status?refresh=1`.
   - Updatuje local state.
   - Rate-limit 60 s (§5.2).

3. **Žádný "Disable"/"Revoke"** — Stripe Express accounts se deaktivují jen přes Stripe Dashboard. Admin UI tohle zachycovat nemusí.

### §7.4 — TypeScript interface extension

Rozšířit `interface Partner` v PartnerDetail.tsx (řádky 17-45) o 8 nových polí z §4.1.

### §7.5 — Nová komponenta `StripeOnboardingCard`

**File:** `components/admin/partners/StripeOnboardingCard.tsx` (nová)

**Props:**
```ts
interface StripeOnboardingCardProps {
  partner: Partner;  // z PartnerDetail
  canEdit: boolean;  // ADMIN || BACKOFFICE
  onRefresh: (updated: Partial<Partner>) => void;  // callback do parentu
}
```

**Lokální state:** `loading` (sync/copy in-flight), `toast` (copy success).

**Logika:** jednoduchá; state derivation přes helper sdílený s partner PWA UI → viz §8.4.

### §7.6 — `StripeStatusBadge` komponenta

Sdílená malá komponenta pro vizualizaci stavu. Použita v Admin UI i PWA UI.

**File:** `components/admin/partners/StripeStatusBadge.tsx` (nová, reusable mezi `(admin)` a `(pwa-parts)`)

**Alternativní umístění:** `components/ui/StripeStatusBadge.tsx` pokud se ji používá křížově. Plán preferuje sdílené UI komponenty v `components/ui/`.

**Props:**
```ts
interface StripeStatusBadgeProps {
  state: "not_started" | "in_progress" | "complete" | "action_required" | "disabled";
}
```

**Mapping:**
| State | Barva | Ikona | Text |
|---|---|---|---|
| `not_started` | gray | — | Nepřipojeno |
| `in_progress` | blue | ⏳ | Stripe zpracovává |
| `complete` | green | ✓ | Výplaty aktivní |
| `action_required` | amber | ⚠ | Vyžaduje akci |
| `disabled` | red | ✕ | Zakázáno |

---

## §8 — Partner self-service UI — `/parts/profile`

### §8.1 — Umístění

**File:** `app/(pwa-parts)/parts/profile/page.tsx`

**Insertion point:** mezi existující Card "Verejny profil" (řádky 94-134) a Card "Logout" (řádky 137-144). Nová Card "Stripe Connect" jde na řádek **~135**.

### §8.2 — Layout 5 stavů

**State `not_started`:**
```
┌─────────────────────────────────────────────────┐
│ Stripe Connect — výplaty                          │
│                                                   │
│ [GRAY badge]  Nepřipojeno                         │
│                                                   │
│ Napojením Stripe účtu začneš dostávat výplaty    │
│ automaticky. Dokud ne, Carmakler ti posílá       │
│ peníze manuálně převodem (může to trvat 5-10 dnů)│
│                                                   │
│ [ORANGE BUTTON: Napoj Stripe účet]                │
└─────────────────────────────────────────────────┘
```

**State `in_progress` (partner se vrátil, ale Stripe čeká):**
```
┌─────────────────────────────────────────────────┐
│ Stripe Connect — výplaty                          │
│                                                   │
│ [BLUE badge]  Stripe zpracovává                   │
│                                                   │
│ Stripe ověřuje tvoje údaje. Obvykle to trvá     │
│ 1-2 dny. Dáme ti vědět emailem.                   │
└─────────────────────────────────────────────────┘
```

**State `action_required`:**
```
┌─────────────────────────────────────────────────┐
│ Stripe Connect — výplaty                          │
│                                                   │
│ [AMBER badge]  Vyžaduje akci                      │
│                                                   │
│ Stripe potřebuje doplnit:                         │
│  • Doklad totožnosti                              │
│  • Webová stránka                                 │
│                                                   │
│ [ORANGE BUTTON: Dokončit onboarding]              │
└─────────────────────────────────────────────────┘
```

**State `complete`:**
```
┌─────────────────────────────────────────────────┐
│ Stripe Connect — výplaty                          │
│                                                   │
│ [GREEN badge]  ✓ Výplaty aktivní                 │
│                                                   │
│ Stripe účet připojen. Výplaty chodí automaticky  │
│ každý pátek na tvůj bankovní účet.                │
│                                                   │
│ [LINK: Upravit údaje ve Stripe ↗]                 │
└─────────────────────────────────────────────────┘
```

**State `disabled`:**
```
┌─────────────────────────────────────────────────┐
│ Stripe Connect — výplaty                          │
│                                                   │
│ [RED badge]  Účet zakázán                         │
│                                                   │
│ Tvůj Stripe účet byl deaktivován. Kontaktuj      │
│ Carmakler support: podpora@carmakler.cz           │
└─────────────────────────────────────────────────┘
```

### §8.3 — `requirements.currently_due` i18n mapping

Stripe vrací `currently_due` jako array technických stringů, které partner nepochopí. Potřebujeme mapování → uživatelský text:

```ts
// lib/stripe-connect.ts nebo components/.../requirements-i18n.ts
export const STRIPE_REQUIREMENTS_CZ: Record<string, string> = {
  "individual.verification.document": "Doklad totožnosti",
  "individual.verification.additional_document": "Další doklad totožnosti",
  "business_profile.url": "Webová stránka firmy",
  "business_profile.mcc": "Kategorie podnikání",
  "business_profile.product_description": "Popis produktů",
  "company.verification.document": "Dokumenty firmy",
  "company.directors_provided": "Informace o vedení",
  "company.owners_provided": "Informace o vlastnících",
  "company.tax_id": "DIČ",
  "external_account": "Bankovní účet",
  "tos_acceptance.date": "Souhlas s podmínkami Stripe",
  "tos_acceptance.ip": "Souhlas s podmínkami Stripe",
  // ... v #18 Q5 rozhodneme kompletní list
};

export function translateRequirement(key: string): string {
  return STRIPE_REQUIREMENTS_CZ[key] ?? key;  // fallback: raw key
}
```

**Neúplný mapping je OK** — Stripe občas vrací obskurní edge cases. Fallback na raw key nezastaví UI, jen je user-unfriendly. Pokud dostaneme uživatelské stížnosti, mapping doplníme.

### §8.4 — Nová komponenta `SupplierStripeCard`

**File:** `components/pwa-parts/profile/SupplierStripeCard.tsx` (nová)

**Props:**
```ts
interface SupplierStripeCardProps {}  // používá vlastní fetch /status
```

**Logika:**
1. Mount → `fetch("/api/stripe/connect/status")` → load state.
2. Button "Napoj Stripe účet" / "Dokončit onboarding":
   - `fetch("/api/stripe/connect/onboard-link", { method: "POST" })`.
   - `window.location.href = json.url` (redirect na Stripe).
3. Po návratu (URL query `?stripe=return`):
   - `useEffect` detekuje query param → `fetch("/api/stripe/connect/status?refresh=1")`.
   - Toast "Onboarding dokončen" (pokud success).
   - Wipe query param přes `router.replace`.
4. Link "Upravit údaje ve Stripe":
   - `fetch("/api/stripe/connect/dashboard-link", { method: "POST" })`.
   - `window.open(json.url, "_blank")`.

### §8.5 — Query param handling

Route lifecycle:
1. Partner klikne "Napoj Stripe účet" na `/parts/profile`.
2. POST `/onboard-link` → returns Stripe URL.
3. `window.location.href = stripeUrl`.
4. Partner prochází onboarding ve Stripe hosted UI.
5. Stripe redirectuje na `${NEXT_PUBLIC_APP_URL}/parts/profile?stripe=return` (success) nebo `?stripe=refresh` (partner clicked "back").
6. Page mount → useEffect detekuje query → refresh status → toast → clear query.

**Důsledek:** Žádná nová route pro `return`/`refresh`, všechno jede přes existující `/parts/profile`. Čisté.

**`refresh` handling:** Stripe používá refresh_url když link expiroval (po ~5 min) nebo partner clicked Back button. V tomto případě partner skončí zpátky na `/parts/profile?stripe=refresh` → page refreshne status → pokud stále neonboarded, button bude pořád dostupný → partner klikne znovu → nový link.

### §8.6 — Mobile-first considerations

PWA je primárně mobile. Stripe hosted onboarding je responsive, ale:
- **Redirect flow** — `window.location.href` funguje v mobile prohlížeči i v standalone PWA (Serwist).
- **Return flow** — Stripe redirect vrací na stejný origin → service worker zachytí routu → PWA pokračuje.
- **Deep link** — nic nepotřebujeme pro return_url; stačí absolutní URL `${NEXT_PUBLIC_APP_URL}/parts/profile?stripe=return`.

**Riziko:** pokud partner opustí PWA kontextu (např. v iOS Safari), po return se dostane do browseru, ne do installed PWA. Toto je limitace Stripe flow — nelze vyřešit čistě. Mitigace: v PWA UI zmínit "Onboarding otevře prohlížeč, po dokončení se vrátíš sem sám."

---

## §9 — Kompliance a compliance check (research)

### §9.1 — Stripe Connect v CZ — legální požadavky

**Research (WebSearch — zdroje z dokumentace Stripe a české AML legislativy):**

1. **Stripe Connect Express v ČR je dostupný** — Stripe Connect podporuje CZ od 2021, včetně CZK payouts. ([stripe.com/global](https://stripe.com/global))

2. **AML / KYC:** Stripe Express pro EU partnery sbírá:
   - Právnické osoby: IČO, DIČ (pokud plátce), sídlo, jméno jednatele/vlastníka, BankAccount, občanský průkaz jednatele.
   - OSVČ: ičo/datum narození, adresa, BankAccount, občanský průkaz.
   - Všechno přes hosted flow — Carmakler nedostává PII, jen flag "verified".

3. **Tax forms:** V EU Stripe NEGENERUJE 1099 (to je US-specific). Ale generuje roční summary pro partnera (downloadable z Express dashboardu). Daňová povinnost je na partnera, Carmakler není "platební institut", jen marketplace.

4. **Platform liability:** Carmakler jako platforma **není** regulated payment institution, protože používá Stripe jako licensed payment service provider. Tohle je klíčové — pokud bychom vyplácelí sami (bez Stripe), potřebujeme ČNB licenci. Používáním Stripe Connect se tomu vyhýbáme (pravidlo "payment facilitation through licensed provider").

5. **GDPR:** Metadata která posíláme do Stripe accounts (`partnerId`, `partnerType`) je OK — neobsahují PII. Email posíláme jen jako contact. Stripe je DPA certifikovaný.

6. **Kurzové riziko:** Carmakler platform account je v CZK. Partneři jsou taky v CZK. Transfers (`stripe.transfers.create({ currency: "czk", ... })`) jsou kurzové-neutral. Žádný FX markup.

### §9.2 — Riziko pro Carmakler

- **Chargeback flow:** pokud kupující podá dispute, Stripe stáhne peníze z platform account. Pokud v ten moment už Stripe poslal peníze do Express account partnera (`transfers.create()` proběhl), Carmakler má negativní balanci. → Mitigace: payout schedule je default weekly (ne daily), takže dispute window ~30 dní > payout window ~7 dní → většina disputes se chytí před payoutem. Pro #161 to řešit nepotřebujeme (Stripe default je OK).

- **Fraud u partnera (falešná IČO):** Stripe to chytá během KYC. Pokud projde, Stripe přebírá fraud liability u legitimate kupujících. Carmakler ne.

### §9.3 — Závěr

Stripe Connect Express je v ČR legálně čisté, compliance tight, low-risk pro Carmakler. Žádné regulatorní blockery.

---

## §10 — Acceptance criteria

**AC1 — Schema migrace:**
- [ ] `npx prisma migrate dev --name add_partner_stripe_onboarding_state` projde bez erroru.
- [ ] `prisma.partner.findFirst()` vrací nové fieldy.
- [ ] Existující partneři mají defaulty (`stripeDetailsSubmitted=false`, atd.).
- [ ] Index `stripeAccountId` existuje (`\d "Partner"` v psql).

**AC2 — POST `/api/stripe/connect/onboard-link` vytvoří Stripe account:**
- [ ] Partner bez `stripeAccountId` → account.id persisted v DB.
- [ ] Response obsahuje `url` (Stripe URL) a `expiresAt`.
- [ ] Druhé volání stejného partnera → NESMÍ vytvořit duplicate account (vrátí existující).
- [ ] Partner bez emailu → 400 error `partner_missing_email`.
- [ ] Admin s `?partnerId=xxx` funguje; non-admin s `?partnerId=xxx` → 403.

**AC3 — GET `/api/stripe/connect/status` vrací derived state:**
- [ ] Partner bez `stripeAccountId` → `state: "not_started"`.
- [ ] Partner s `stripePayoutsEnabled: true` → `state: "complete"`.
- [ ] Partner s `stripeRequirementsCurrentlyDue: ["xxx"]` → `state: "action_required"`.
- [ ] Partner s `stripeDisabledReason: "xxx"` → `state: "disabled"`.
- [ ] `?refresh=1` refreshne z Stripe API a update DB.
- [ ] Rate limit: druhý refresh do 60 s vrátí cached.

**AC4 — Webhook `account.updated` sync:**
- [ ] Stripe CLI trigger: `stripe trigger account.updated --override account:payouts_enabled=true` → flagy v DB updatnuté.
- [ ] Nový event pro neznámé `accountId` → `console.warn` + 200 OK.
- [ ] `stripeOnboardingCompletedAt` set jen jednou (při prvním přechodu na `payouts_enabled=true`).

**AC5 — Admin UI (PartnerDetail):**
- [ ] Nová Card "Stripe Connect" mezi "Provize" a "Stav a přiřazení".
- [ ] Existující amber warning v kartě Provize (řádky 454-460) odstraněn.
- [ ] StatusBadge zobrazuje 5 stavů.
- [ ] Button "Zkopírovat onboarding link" funguje (clipboard + toast).
- [ ] Button "Sync ze Stripe" funguje (rate limit 60 s).
- [ ] Admin-initiated onboarding pro partnera bez emailu zobrazí disabled button s tooltipem.

**AC6 — Partner PWA UI (`/parts/profile`):**
- [ ] Nová Card "Stripe Connect" mezi "Verejny profil" a "Logout".
- [ ] Button "Napoj Stripe účet" → redirect na Stripe hosted onboarding.
- [ ] Po návratu (`?stripe=return`) → refresh status → toast → clear query param.
- [ ] State `complete` → link "Upravit údaje ve Stripe" otevře Express dashboard v novém tabu.
- [ ] State `action_required` → zobrazí `requirements.currently_due` přes CZ překlad (§8.3).

**AC7 — E2E test scénář (Playwright):**
- [ ] Signup jako vrakoviště → PWA `/parts/profile` → card "Stripe Connect" stav "Nepřipojeno".
- [ ] Klik "Napoj Stripe účet" → redirect na `connect.stripe.com` (verify URL).
- [ ] Manual step (test mode): dokončit Stripe onboarding form.
- [ ] Return → card stav "Výplaty aktivní" (po webhook sync).

**AC8 — Graceful fallback zachován:**
- [ ] Existující vrakoviště bez Stripe účtu → `/api/orders/checkout` → `checkout.session.completed` webhook → `applyCommissionSplit` volá `continue` (console.warn) → order dokončen normálně.
- [ ] Žádný change v `webhook/route.ts:191-274` commission split logice.

**AC9 — Build & lint:**
- [ ] `npm run build` zelený.
- [ ] `npm run lint` zelený.
- [ ] TypeScript strict — žádné `any` v nových souborech.

**AC10 — Dokumentace:**
- [ ] `.env.example` NEMĚNÍME (Stripe Connect Express používá existující `STRIPE_SECRET_KEY`).
- [ ] Komentář v `lib/stripe-connect.ts` header vysvětlující Express flavor a graceful fallback vztah.

---

## §11 — Edge cases

### §11.1 — Partner bez emailu

**Scénář:** Admin v backoffice edituje vrakoviště ale ještě nemá email.

**Řešení:**
- `POST /onboard-link` vrátí 400 `partner_missing_email`.
- Admin UI button "Zkopírovat onboarding link" je `disabled` s tooltipem "Nejdřív doplň email partnera".
- Partner PWA UI nevideo kdy nemá email (musí projít přes `/registrace/dodavatel` a tam email je required).

### §11.2 — Link expiration

**Scénář:** Admin zkopíruje onboarding link, pošle partnerovi, partner klikne za 10 minut (link expired po ~5 min).

**Řešení:** Stripe automaticky redirectuje na `refresh_url` → `/parts/profile?stripe=refresh` → page mount → status check → button "Napoj Stripe účet" stále k dispozici → klik → nový link.

**UX:** Bez nutnosti explicit error messaging, refresh se zpracuje transparent.

### §11.3 — Partner začal onboarding, pak zavřel tab

**Scénář:** Partner klikl "Napoj Stripe účet", zadal část údajů, zavřel Stripe. Žádný webhook fire-ed (onboarding není `details_submitted`).

**Řešení:** Partner znovu přijde na `/parts/profile`:
- `stripeAccountId` existuje (byl vytvořen v prvním POST).
- `stripeDetailsSubmitted: false`.
- State: `in_progress`.
- Button "Dokončit onboarding" → nový account link → Stripe **resume** (Express flow pamatuje si partial state).

**Ověření:** Stripe Express UI po `accountLinks.create` pokračuje tam kde partner skončil. Toto je standard chování.

### §11.4 — Race condition: paralelní onboard-link calls

**Scénář:** Partner double-klikne button.

**Řešení:** 
- První call → `createOrGetConnectAccount` vrátí nový accountId, persist v DB.
- Druhý call (o 200 ms později) → `createOrGetConnectAccount` vrátí existing accountId (z již persistovaného stavu).

**Safety:** Obě volání vrátí valid link. User otevře jeden z nich, druhý je jen orphaned token.

**Poznámka:** Pokud by se oba volání dostaly do `stripe.accounts.create` současně (race → 2 accounts), druhý persist overwrite první. Worst case: partner má orphaned Stripe account v our Stripe dashboardu, ale DB je konzistentní. Acceptable — cleanup možný manuálně ve Stripe dashboardu.

**Mitigace navíc:** frontend button disables po kliknutí (loading state).

### §11.5 — Webhook replay / late delivery

**Scénář:** Stripe replayuje webhook `account.updated` po 2 hodinách. V tom čase admin už manuálně sync-oval status.

**Řešení:** `syncAccountToDb` je idempotent. Replay → stejné UPDATE → no-op (prakticky). `stripeAccountUpdatedAt` se updatuje, ale to je OK.

### §11.6 — Stripe account manually disabled

**Scénář:** Admin v Stripe dashboardu deaktivuje account (fraud, nonpayment).

**Řešení:**
- Stripe fires `account.updated` s `requirements.disabled_reason: "rejected.fraud"`.
- `syncAccountToDb` → `stripePayoutsEnabled: false`, `stripeDisabledReason: "rejected.fraud"`.
- PartnerDetail UI → red badge "Zakázáno" + důvod.
- Commission split pipeline → partner má `stripeAccountId` ale `stripePayoutsEnabled: false` → v `applyCommissionSplit:242-249` stále použije `stripeAccountId` → Stripe vrátí error 400 → try-catch zachytí → `console.error` → snapshot v DB je stále autoritativní → finance team řeší manuálně.

**Dlouhodobé řešení:** refinement v budoucím tasku — `applyCommissionSplit` by měl checkout `stripePayoutsEnabled` před `stripe.transfers.create` a skipnout s jasnou zprávou. **NENÍ scope #161** (viz §15 OUT OF SCOPE) — ale zdokumentujeme jako follow-up ticket.

### §11.7 — Partner změní email v profilu

**Scénář:** Partner updatuje email v `/parts/profile` (Edit form), ale email už je v Stripe account.

**Řešení:**
- `PUT /api/partner/profile` updatuje `Partner.email` v DB.
- **NESYNCUJEME** do Stripe account. Stripe email je pro Stripe notifikace (payout emaily), DB email je pro Carmakler komunikaci.
- Pokud partner chce změnit Stripe email → přes Express dashboard (link v §5.3).

**Důsledek:** Dva různé emaily jsou tolerované (u vrakovišť je to běžné: "finance@" pro Stripe, "prodej@" pro zákazníky).

### §11.8 — Two partneri deli jeden Stripe account (nelze)

**Scénář:** Majitel vrakoviště má 2 pobočky jako 2 Partner záznamy a chce je spojit do 1 Stripe account.

**Řešení:** NELZE. Stripe Connect vyžaduje 1:1 vztah (1 account = 1 legal entity). Pokud mají stejné IČO → musí být 1 Partner v DB.

**Poznámka:** Tohle je edge case, není #161 scope. Pokud se objeví, řešení je merge Partner records (nebo parent-child Partner hierarchie — budoucí refactor).

---

## §12 — Phases

Implementaci rozdělíme na 3 fáze. Každá fáze je deploy-able samostatně (feature-flag friendly, žádná hard dependency mezi UI a backendem).

### §12.1 — Fáze #161-a — Schema + backend + webhook

**Scope:**
1. Prisma migrace (§4).
2. `lib/stripe-connect.ts` (§5.4).
3. `app/api/stripe/connect/onboard-link/route.ts` (§5.1).
4. `app/api/stripe/connect/status/route.ts` (§5.2).
5. `app/api/stripe/connect/dashboard-link/route.ts` (§5.3).
6. Webhook extension v `app/api/stripe/webhook/route.ts` (§6).

**Testing:**
- Curl POST `/onboard-link` (s mock partner) → returns Stripe URL.
- Curl GET `/status` → returns state.
- Stripe CLI trigger `account.updated` → DB flags update.

**Deploy:** backend deploy, žádná uživatelská změna (UI zatím neexistuje). Safe pro fázový rollout.

### §12.2 — Fáze #161-b — Admin UI

**Scope:**
1. `components/admin/partners/StripeOnboardingCard.tsx` (§7.5).
2. `components/admin/partners/StripeStatusBadge.tsx` (§7.6, nebo `components/ui/`).
3. Integrace v `PartnerDetail.tsx` (insert Card, remove amber warning z Provize karty, extend interface).
4. CZ translation helper `STRIPE_REQUIREMENTS_CZ` (§8.3).

**Testing:**
- Admin se loguje do `/admin/partners/[id]` → card viditelná.
- Test všech 5 stavů (mock data v DB).
- Copy-to-clipboard funguje.

**Deploy:** admin-only UI change, žádný PWA impact.

### §12.3 — Fáze #161-c — Partner PWA UI

**Scope:**
1. `components/pwa-parts/profile/SupplierStripeCard.tsx` (§8.4).
2. Integrace v `app/(pwa-parts)/parts/profile/page.tsx` (insert Card).
3. Query param handling (`?stripe=return`, `?stripe=refresh`).
4. Mobile responsive sanity check.

**Testing:**
- Playwright E2E: signup vrakoviště → profile → card viditelná.
- Stripe Test mode onboarding flow.
- Return handling.

**Deploy:** partner-facing, rozhodnutí o communication.

**Komunikační dopad:** Při deploy #161-c partneři poprvé uvidí novou kartu. Navrhuji vypustit email notifikaci "Nová funkce: napojení Stripe" — ale **jen po schválení leadem** (§18 Q7).

---

## §13 — Files touched

### §13.1 — Nové soubory (9)

```
lib/stripe-connect.ts                                                     (nový)
app/api/stripe/connect/onboard-link/route.ts                              (nový)
app/api/stripe/connect/status/route.ts                                    (nový)
app/api/stripe/connect/dashboard-link/route.ts                            (nový)
components/admin/partners/StripeOnboardingCard.tsx                        (nový)
components/admin/partners/StripeStatusBadge.tsx                           (nový, může být v components/ui/)
components/pwa-parts/profile/SupplierStripeCard.tsx                       (nový)
prisma/migrations/YYYYMMDDHHMMSS_add_partner_stripe_onboarding_state/     (nový)
e2e/stripe-onboarding.spec.ts                                             (nový, Playwright)
```

### §13.2 — Modifikované soubory (4)

```
prisma/schema.prisma                            (+ 8 fieldů, + 2 indexy na Partner)
app/api/stripe/webhook/route.ts                 (+ case "account.updated" + handler)
components/admin/partners/PartnerDetail.tsx     (insert <StripeOnboardingCard>, remove amber warning, extend interface Partner)
app/(pwa-parts)/parts/profile/page.tsx          (insert <SupplierStripeCard>)
```

**Celkem: 13 souborů (9 new, 4 modified).**

### §13.3 — Soubory které se NEMĚNÍ (kontrola regrese)

- `lib/stripe.ts` — **žádná změna**. Connect helpers jsou v samostatném `lib/stripe-connect.ts`.
- `lib/prisma.ts` — žádná změna.
- `app/api/stripe/webhook/route.ts` `applyCommissionSplit()` (řádky 191-274) — **žádná změna**. Graceful fallback pattern zůstává beze změn.
- `components/admin/partners/CommissionEditDialog.tsx` — žádná změna.
- `components/admin/partners/CommissionHistoryList.tsx` — žádná změna.
- `components/admin/partners/CommissionRateSlider.tsx` — žádná změna.

---

## §14 — Risks & mitigations

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | Stripe API změna mezi plan a impl (Connect Express API verze) | Low | Používáme API version `2026-02-25.clover` zafixovanou v `lib/stripe.ts:8`. Implementator neupgraduje. |
| R2 | Partneři se leknou KYC flow a přestanou používat PWA | Medium | Graceful fallback zachován — partneři bez Stripe dál prodávají, jen s manuálním payoutem. Copy v UI je motivující, ne nátlakové ("Chceš výplaty rychleji?"). |
| R3 | Race condition: duplicitní Stripe accounts pro jednoho partnera | Low | Hned po `accounts.create` persistujeme `stripeAccountId` v DB. Frontend button disables při loading. Worst case: orphaned account, cleanup manual. |
| R4 | Webhook `account.updated` nedoručen (Stripe outage) | Low | Admin UI má "Sync ze Stripe" button pro manual refresh (§7.3). Status může být stale ale opravitelné. |
| R5 | Migrace přidá sloupce s velkými defaulty → lock na production Partner table | Low | 8 sloupců s defaulty (`false`, `[]`, `null`) — Postgres ALTER TABLE ADD COLUMN s defaulty od PG 11+ je instant (no rewrite). Pokud by bylo víc než pár 1000 řádků, ověřit s `EXPLAIN`. Pilot má ~50 partnerů. |
| R6 | Test mode Stripe accounts nemají `payouts_enabled` → E2E test nemůže validovat happy path | Medium | Stripe test mode má `capabilities: { transfers: "pending" } → "active"` flow. Playwright test použije Stripe test tokens (hardcoded test bank account). Detail v impl fázi. |
| R7 | MCC kód 5533 (Automotive Parts) není vhodný pro autobazary (prodávající auta) | Low | AUTOBAZAR partner taky prodává díly v parts marketplace, takže 5533 sedí. Pokud by autobazar začal prodávat celá auta přes Stripe (marketplace VIP), to je OUT OF SCOPE #161 — jiný flow. |
| R8 | Partner změní legal entity (prodá firmu) → existing Stripe account je pro starou entity | Medium | Stripe Express neumí transfer mezi accounts. Řešení: admin označí partner jako "re-onboarding needed" → zruší `stripeAccountId` → partner projde nový onboarding. **Není #161 scope**, follow-up. |
| R9 | Frontend redirects z PWA standalone mode mimo app context | Medium | Stripe redirect returny na `${NEXT_PUBLIC_APP_URL}/parts/profile?stripe=return` → service worker (Serwist) zachytí → PWA shell. V iOS Safari PWA je limitace (opens v browseru). Communication v UI "Otevře prohlížeč". |
| R10 | Rate limit na `accountLinks.create` při hojné re-refresh | Low | Stripe rate limit je 100 req/s na platform account. Prakticky nedostižitelné. |

---

## §15 — Out of scope (explicitní exkluze)

Následující věci NESPADAJÍ do #161. Jsou zmíněny pro transparency, ale nejsou součástí impl:

1. **Stripe Standard / Custom connected accounts.** Jen Express. Rozhodnutí v §3.
2. **Marketplace VIP dealeři (VERIFIED_DEALER role).** Marketplace má vlastní 40/40/20 split, jiný flow. Může být future task.
3. **Legacy broker commission flow** (`calculateCommission` v `lib/stripe.ts`). Makléři mají vlastní payout (`createPayoutRecords`), NEPŘECHÁZÍ na Stripe Connect v #161.
4. **Tax forms / 1099.** Stripe Express to řeší pro EU trh. Carmakler neexportuje nic.
5. **Custom onboarding UI.** Jen redirect na Stripe hosted. Žádné vlastní formuláře.
6. **Auto-retry disabled transfers.** Pokud commission transfer selže (partner disabled), je to v logu; finance team řeší ručně. Retry mechanika je follow-up.
7. **Upgrade `applyCommissionSplit` na check `stripePayoutsEnabled`.** Dnes checkuje jen `stripeAccountId !== null`. Refactor na `stripePayoutsEnabled === true` je logický follow-up ale není #161 scope (nechceme měnit webhook commission pipeline v tomto tasku).
8. **Email notifikace partnerovi** "Dokončen onboarding" nebo adminovi "Nový partner onboarded". Follow-up ticket, §18 Q7.
9. **Partner re-onboarding flow** (např. pokud prodá firmu). §14 R8.
10. **PWA pro marketplace VIP dealery** s vlastním onboarding. Marketplace VIP je samostatný produkt.
11. **Zasilkovna payout integration.** Carmakler používá jen Stripe pro payouts (Zasilkovna je shipping, ne payment).
12. **Multi-currency.** Jen CZK. EUR / USD je out of scope.
13. **Stripe Identity** (dodatečná verifikace). Express sbírá KYC sám.
14. **Stripe Radar** (fraud detection). Default settings Stripe jsou OK.
15. **Custom payout schedule** (daily/weekly přepínač). Default Stripe weekly (pátek). Partneři mohou změnit v Express dashboardu.

---

## §16 — STOP & ESCALATE rules

**Implementator MUSÍ zastavit a eskalovat leadovi pokud:**

**STOP-1:** Prisma migrace na `add_partner_stripe_onboarding_state` selže nebo vyžaduje `--force`/`--accept-data-loss`. Pak NESMÍ pokračovat — eskaluj.

**STOP-2:** Při creating first test Stripe account `stripe.accounts.create({ type: "express" })` vrátí error `country: CZ not supported` nebo capability error. Pak NESMÍ pokračovat — implementator verify API verze + capabilities syntax, případně eskaluj (možná je potřeba jiné `business_type`).

**STOP-3:** Webhook `account.updated` signature verification selže v production test mode. Pak implementator verify `STRIPE_WEBHOOK_SECRET` je správně nakonfigurován pro test mode účet; pokud stále fail, eskaluj.

**STOP-4:** Count změněných souborů překročí **16** (limit = 13 plánovaných + 3 tolerance pro helpers/tests). Pokud impl diff je větší, eskaluj s justifikací.

**STOP-5:** Jakákoliv změna v `applyCommissionSplit()` (`webhook/route.ts:191-274`) musí být eskalována. #161 explicitně ZACHOVÁVÁ tento blok beze změn (§15 bod 7).

**STOP-6:** Jakákoliv úprava `lib/stripe.ts` (mimo přidání importů pokud nutné). Nové Connect helpers jdou do `lib/stripe-connect.ts`.

**STOP-7:** Partner PWA queries používají nové pole `stripe*` v existujícím `/api/partner/profile` endpointu → **NEDĚLEJ**. Profile endpoint nemá nic společného se Stripe, používej dedikované `/api/stripe/connect/*` endpointy.

**STOP-8:** Pokud nastane potřeba použít `stripe.oauth.*` metody → **NEDĚLEJ** (to je Standard, ne Express). Express používá `accountLinks`.

**STOP-9:** Pokud E2E test v Playwright vyžaduje test mode Stripe account s manuálním KYC procházení → eskaluj. Test se má spolehnout na `stripe trigger account.updated` mock, ne na skutečné procházení Stripe UI.

**STOP-10:** Pokud build selže kvůli TypeScript conflict mezi Stripe SDK verzemi → eskaluj. Nešahej na `@stripe/stripe-node` upgrade (není scope).

---

## §17 — Dispatch checklist

**Před dispatchem implementatorovi MUSÍ lead ověřit:**

- [ ] Plán #161 je v `.claude-context/tasks/plan-task-161-stripe-onboarding.md`.
- [ ] Plán obsahuje všechny sekce §1-§18.
- [ ] §18 OPEN QUESTIONS jsou rozhodnuty leadem a sepsány v §18 jako "LEAD DECISIONS" (verbatim).
- [ ] §18 rozhodnutí jsou konzistentní s §4, §5, §7, §8 (pokud lead změní scope, planovač revisit).
- [ ] Task #161 je `in_progress`, owner `planovac` (→ po dispatchi change na `implementator`).
- [ ] Feature-flag není potřeba (fázový rollout přes deploy staging před produkcí).
- [ ] Branch: `feature/161-stripe-onboarding` (convention).

**Běžné ověření implementatorem:**

- [ ] `git status` clean před startem (žádné neuložené změny).
- [ ] Read plan `.claude-context/tasks/plan-task-161-stripe-onboarding.md` kompletně.
- [ ] Respect STOP rules §16.
- [ ] Respect file scope §13.1+§13.2 (9 new + 4 modified; max 16 total s tolerancí).
- [ ] Respect OUT OF SCOPE §15.
- [ ] Commit message convention: `feat(stripe): #161 Connect Express onboarding — <fáze>` (3 commity za 3 fáze).
- [ ] Po completion: TaskUpdate #161 → completed, SendMessage HOTOVO leadovi.

**Post-impl manuální steps (provozní — ne code):**

- [ ] Lead konfiguruje Stripe webhook endpoint v production Stripe Dashboard → přidat event `account.updated`.
- [ ] Lead ověří `.env.production` obsahuje správné `STRIPE_SECRET_KEY` pro production account (ne test).
- [ ] Lead rozhodne komunikační strategii pro launch (§18 Q7).

---

## §18 — Open questions for lead

Tyto otázky vyžadují rozhodnutí leadem PŘED dispatchem. Jakmile lead rozhodne, planovač updatuje plán verbatim jako "§18 LEAD DECISIONS".

### Q1 — Capabilities scope: jen `transfers` nebo i `card_payments`?

**Kontext:** V `stripe.accounts.create({ capabilities: {...} })` říkáme Stripe jaké permissions má connected account mít.
- `transfers: { requested: true }` — partner může přijímat transfery z platform (**potřebné pro #88a flow**).
- `card_payments: { requested: true }` — partner může sám přijímat direct charges (**ne potřebné, protože Carmakler zpracovává checkout na platform account**).

**Doporučení planovače:** **jen `transfers`**. Žádné `card_payments`. Důvody:
1. Karty zpracovává platform account (Carmakler Stripe). Partner nikdy nepotřebuje direct charge capability.
2. Méně KYC požadavků pro partnera (`card_payments` vyžaduje více dat).
3. Security: menší attack surface na connected account.

**Alternativa (pro budoucnost):** Pokud Carmakler přejde na direct charges model (vzácné), capability lze dodatečně requested přes UPDATE call.

**Lead rozhoduje:** [ ] Accept (a) jen transfers  [ ] Override (b) transfers + card_payments  [ ] Diskuse

---

### Q2 — Entry point: jen PWA self-service, jen admin-initiated, nebo oba?

**Kontext:** §7 popisuje admin UI (PartnerDetail), §8 popisuje partner PWA UI. Otázka: je potřeba obojí?

**Doporučení planovače:** **Oba**. Důvody:
1. **Partner PWA (primary):** samoobsluha, scale. Partner nepotřebuje čekat na admin.
2. **Admin (secondary):** proaktivní oslovení. Admin může poslat onboarding link partnerovi který se zalekl, nebo pre-generovat link při manuální registraci.

**Alternativa (MVP lean):** jen partner PWA. Admin UI pak jako follow-up.

**Lead rozhoduje:** [ ] Oba (a) — planovač recommendation  [ ] Jen partner PWA (b)  [ ] Jen admin (c)

---

### Q3 — `business_type`: `company` nebo `individual`?

**Kontext:** Vrakoviště může být:
- **Právnická osoba** (s.r.o., a.s.) → `business_type: "company"` → KYC pro IČO, jednatele, vlastníky.
- **OSVČ** (fyzická osoba podnikatel) → `business_type: "individual"` → KYC pro jednotlivce (datum narození, občanka).

**Doporučení planovače:** **Dynamicky odvodit z DB.** Partner model má `ico: String?` — pokud `ico.length === 8` a začíná číslicí → `company`. Pokud IČO chybí / má jiný formát → `individual`.

**Problém:** Tohle vyžaduje dodatečnou logiku při `accounts.create`. Zjednodušená varianta: **vždy `company`** (většina vrakovišť je s.r.o.) a OSVČ buď zadají IČO stejně, nebo Stripe během onboardingu řekne "zadej IČO nebo přejdi na individual".

**Alternativa:** Necháme Stripe vybrat: neposíláme `business_type` do `accounts.create` → Stripe během onboardingu zeptá se partnera. **Toto je Express default.**

**Lead rozhoduje:** [ ] Explicit `company` (a)  [ ] Dynamicky z IČO (b)  [ ] Necháme Stripe vybrat (c) — **planovač recommendation**

---

### Q4 — Timing `accounts.create`: na klik nebo lazy?

**Kontext:** Můžeme vytvořit Stripe account:
- **Na klik "Napoj Stripe účet"** → `POST /onboard-link` → `accounts.create` → `accountLinks.create` → redirect.
- **Lazy při aktivaci partner účtu** → `activatePartnership` v `/api/partners/[id]/activate` už při vytváření vytvoří empty Stripe account.

**Doporučení planovače:** **Na klik** (varianta a). Důvody:
1. Méně orphaned Stripe accounts (partneři kteří nedokončí onboarding).
2. Přesnější tracking drop-off metric.
3. Méně code v activation flow (menší blast radius).

**Lead rozhoduje:** [ ] Na klik (a) — planovač recommendation  [ ] Lazy při aktivaci (b)

---

### Q5 — `STRIPE_REQUIREMENTS_CZ` mapping: jak komplexní?

**Kontext:** §8.3 — Stripe vrací `requirements.currently_due` jako array technických klíčů. Potřebujeme překlad na česká uživatelská jména.

**Varianty:**
- **(a) Minimum:** 10-15 nejčastějších klíčů (předpokládaný 90 % coverage).
- **(b) Comprehensive:** všechny dokumentované klíče ze Stripe docs (cca 60 klíčů).
- **(c) Raw fallback:** neukazujeme seznam vůbec, jen "Dokončit ve Stripe" button.

**Doporučení planovače:** **(a) Minimum**. 10-15 klíčů pokrývá většinu. Fallback na raw key je OK pro edge cases. Comprehensive mapping je over-engineering na MVP.

**Lead rozhoduje:** [ ] Minimum (a) — planovač recommendation  [ ] Comprehensive (b)  [ ] Jen button bez seznamu (c)

---

### Q6 — Webhook secret: reuse stejný nebo separate pro account events?

**Kontext:** Stripe webhook endpoint může být:
- **Jeden endpoint pro všechny eventy** (`/api/stripe/webhook`) — dnes používaný.
- **Dedicated endpoint pro account events** (`/api/stripe/connect/webhook`).

**Doporučení planovače:** **Jeden endpoint** (varianta a). Důvody:
1. Jednodušší konfigurace (1 webhook secret, 1 endpoint v Stripe dashboard).
2. Existující route má centralizované error handling, logging.
3. Stripe sends/webhook limity neomezují počet event types na endpoint.

**Alternativa:** Separate endpoint pro pečlivější izolaci (kdyby account events zatížily main webhook). Není potřeba při MVP velikosti.

**Lead rozhoduje:** [ ] Jeden endpoint (a) — planovač recommendation  [ ] Dedicated endpoint (b)

---

### Q7 — Launch communication: notifikovat partnery?

**Kontext:** Po deploy #161-c partneři poprvé uvidí novou kartu v PWA. Máme jim říct?

**Varianty:**
- **(a) Žádná notifikace** — partneři to objeví sami.
- **(b) Email notifikace** "Nová funkce: automatické výplaty přes Stripe".
- **(c) In-app banner** v PWA na `/parts/profile` dokud nedokončí nebo dismissnou.
- **(d) Push notification** (Serwist PWA push).

**Doporučení planovače:** **(a) Žádná notifikace** na MVP, follow-up ticket pro email. Důvody:
1. #161 deliveruje funkcionalitu; komunikace je separate marketing work.
2. Push infrastructure nemusí být připravená pro marketing use case.
3. Rychlý deploy cycle dnes, feedback loop s pilotními vrakovišti manuálně.

**Lead rozhoduje:** [ ] (a) žádná — planovač recommendation  [ ] (b) email  [ ] (c) banner  [ ] (d) push

---

### Q8 — Success definition: kolik partnerů musí dokončit onboarding aby byl #161 considered successful?

**Kontext:** Metric pro post-deploy success.

**Varianty:**
- **(a) Hard:** 80 % aktivních partnerů dokončí onboarding do 30 dnů.
- **(b) Soft:** ≥ 1 partner dokončí onboarding a reálně přijme commission transfer.
- **(c) Žádný hard target** — success = technická funkcionalita funguje, adoption metric sledujeme ale nehodnotíme.

**Doporučení planovače:** **(b) Soft**. Důvod: pilotní fáze, 50 partnerů, reálné validity check je "1 end-to-end flow funguje v production". Hard target předčasný.

**Lead rozhoduje:** [ ] Hard 80% (a)  [ ] Soft ≥1 (b) — planovač recommendation  [ ] Bez targetu (c)

---

## §19 — Conclusion

Plán pokrývá Stripe Connect Express onboarding flow pro partnery (vrakoviště + autobazary). Rozsah: 8 Prisma fieldů, 4 API endpointy, 1 webhook extension, 3 nové komponenty (admin + PWA), 13 files touched total. 

**Rozhodnutí hotová v plánu:**
- Connect **Express** (ne Standard, ne Custom) — §3
- **Samostatný** `lib/stripe-connect.ts` (ne rozšiřovat `lib/stripe.ts`) — §2.1, STOP-6
- **Graceful fallback** zachován — §2.5, §15 bod 7
- **Jeden webhook endpoint** reuse — §6.1 (může být přehodnoceno v Q6)
- **3 fáze** deploy (schema/backend → admin UI → PWA UI) — §12

**Rozhodnutí čekající na lead (§18):** Q1-Q8, 8 otázek. Nejdůležitější: Q2 (entry points), Q3 (business type), Q5 (requirements mapping).

**Follow-up tickets (ne #161 scope):**
- FU1: Refactor `applyCommissionSplit` na check `stripePayoutsEnabled` (ne jen `stripeAccountId`).
- FU2: Email notifikace partnerovi po onboarding complete.
- FU3: Admin dashboard filtr "partneři bez Stripe onboardingu".
- FU4: Partner re-onboarding flow při změně legal entity.
- FU5: Marketplace VIP dealery onboarding (jiný flow).

**Estimated effort (informační, ne committed):**
- Fáze A (schema + backend): malá-střední.
- Fáze B (admin UI): malá.
- Fáze C (PWA UI + E2E): střední.

Plán je ready for lead review. Čekám na rozhodnutí §18 Q1-Q8 → updatuji §18 jako LEAD DECISIONS → dispatch implementator.

— planovac
