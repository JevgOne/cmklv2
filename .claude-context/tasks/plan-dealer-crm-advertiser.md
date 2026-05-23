# Plan: Dealer CRM — Leady, poptávky, komunikace pro ADVERTISER roli

**Task:** #48
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Feature — nová sekce platformy
**Závažnost:** HIGH — brožura slibuje CRM, ale neexistuje

---

## PROBLÉM

Brožura **"CarMakler pro autobazary"** slibuje:
- ✅ CRM & Lead Management — "Centrální přehled poptávek"
- ✅ Integrovaný Messaging — "Integrovaný systém zpráv pro komunikaci se zájemci"
- ✅ Real-time Dashboard, Statistics & Analytics

**Realita v kódu:**
- Makléři (BROKER) mají plný CRM: `/makler/leads/` s taby, statusy, stats, gamifikací
- Dealeři (ADVERTISER) mají jen `/moje-inzeraty/[id]` s inline inquiry sekcí v `ListingDetailManager`
- **Neexistuje** centrální přehled všech poptávek, statistiky, stavy leadů, ani komunikační historie

### Co ADVERTISER aktuálně vidí

| Stránka | Co dělá | Problém |
|---------|---------|---------|
| `/moje-inzeraty` | Seznam inzerátů s počty | Žádný přehled poptávek |
| `/moje-inzeraty/[id]` | Detail inzerátu + inquiries inline | Musí proklikat každý inzerát zvlášť |
| `/muj-ucet/dotazy` | Dotazy odeslané KUPUJÍCÍM | Opačná strana — pro kupující |

### Co ADVERTISER potřebuje

1. **Centrální inbox** — všechny poptávky na jednom místě (ne per-listing)
2. **Stavy poptávek** — Nový → Přečteno → Odpovězeno → Schůzka → Prodáno / Zavřeno
3. **Statistiky** — kolik poptávek za měsíc, na které auto, konverzní poměr
4. **Rychlé akce** — odpovědět, zavolat, naplánovat prohlídku

---

## ARCHITEKTONICKÉ ROZHODNUTÍ

### ❌ Varianta A: Rozšířit Lead model (ZAMÍTNUTO)
Lead model je pro **sourcing vozidel** — makléř hledá auta k prodeji.
Inquiry model je pro **buyer interest** — zájemce se ptá na konkrétní inzerát.
Jsou to zásadně odlišné workflow. Míchat je = chaos.

### ❌ Varianta B: Nový DealerLead model (ZAMÍTNUTO)
Zbytečná duplikace. Inquiry model už má vše potřebné — jen chybí rozšířené statusy a CRM UI.

### ✅ Varianta C: Rozšířit Inquiry model + nové CRM stránky (DOPORUČENÁ)

**Proč:**
- Inquiry model už existuje a funguje (NEW → READ → REPLIED → CLOSED)
- Stačí rozšířit o dealerské statusy + CRM metadata
- Nové stránky pod `/moje-inzeraty/poptavky/` (dealer CRM dashboard)
- Nové API endpointy pro aggregované dotazy a statistiky
- Minimum schema změn, maximum funkcionality

---

## NAVRHOVANÉ ŘEŠENÍ

### 1. Schema rozšíření — Inquiry model

```prisma
model Inquiry {
  id        String  @id @default(cuid())
  listingId String
  listing   Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  senderId  String?
  sender    User?   @relation("BuyerInquiries", fields: [senderId], references: [id])

  // Kontakt (pro nepřihlášené zájemce)
  name    String
  email   String
  phone   String?
  message String

  // Odpověď inzerenta
  reply     String?
  repliedAt DateTime?

  // === NOVÉ FIELDY PRO DEALER CRM ===
  
  // Rozšířené statusy
  status String @default("NEW")
  // Staré: NEW, READ, REPLIED, CLOSED
  // Nové: NEW → READ → REPLIED → VIEWING → SOLD → CLOSED | NO_INTEREST
  
  // Prohlídka
  viewingDate   DateTime?    // Datum plánované prohlídky
  viewingResult String?      // INTERESTED | THINKING | NO_INTEREST
  
  // Interní poznámky dealera  
  note          String?      // Interní poznámka (zájemce ji nevidí)
  
  // Priorita
  priority      String?      // HIGH | NORMAL | LOW
  
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt   // NOVÉ — pro tracking

  @@index([listingId])
  @@index([senderId])
  @@index([status])
}
```

**Nové fieldy (5):**
- `viewingDate` — datum prohlídky
- `viewingResult` — výsledek prohlídky (INTERESTED, THINKING, NO_INTEREST)
- `note` — interní poznámka dealera
- `priority` — priorita (HIGH, NORMAL, LOW)
- `updatedAt` — tracking poslední změny

**Rozšířené statusy:**
```
NEW → READ → REPLIED → VIEWING → SOLD → CLOSED
                                      ↘ NO_INTEREST
```

| Status | Popis | Trigger |
|--------|-------|---------|
| `NEW` | Nový dotaz od zájemce | Automaticky při vytvoření |
| `READ` | Dealer viděl dotaz | Automaticky při prvním zobrazení |
| `REPLIED` | Dealer odpověděl | Při odeslání reply |
| `VIEWING` | Prohlídka naplánována | Dealer nastaví viewingDate |
| `SOLD` | Vozidlo prodáno tomuto zájemci | Dealer potvrdí |
| `CLOSED` | Uzavřeno (generic) | Dealer uzavře |
| `NO_INTEREST` | Zájemce ztratil zájem | Dealer označí |

**Zpětná kompatibilita:** Stávající Inquiry flow (NEW→READ→REPLIED→CLOSED) funguje beze změn. Nové statusy (VIEWING, SOLD, NO_INTEREST) jsou opt-in pro CRM.

---

### 2. Nové stránky — Dealer CRM Dashboard

```
app/(web)/moje-inzeraty/
├── page.tsx                    [EXISTUJE — seznam inzerátů]
├── [id]/page.tsx               [EXISTUJE — detail inzerátu s inquiries]
├── poptavky/                   [NOVÉ — CRM dashboard]
│   ├── page.tsx                [Centrální inbox — všechny poptávky]
│   ├── loading.tsx             [Loading skeleton]
│   └── error.tsx               [Error boundary]
└── statistiky/                 [NOVÉ — Analytics dashboard]
    ├── page.tsx                [Statistiky a přehledy]
    └── loading.tsx             [Loading skeleton]
```

**Proč `/moje-inzeraty/poptavky/` a ne `/moje-poptavky/`:**
- Konzistence s existující strukturou (dealer features pod `/moje-inzeraty/`)
- Middleware už chrání `/moje-inzeraty` prefix → žádná nová config
- Logická hierarchie: moje inzeráty → poptávky na ně

---

### 3. Centrální Inbox — `/moje-inzeraty/poptavky/`

```
┌──────────────────────────────────────────────────────────┐
│ 📬 Poptávky                                    [Filtr ▼]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─ Tabs ─────────────────────────────────────────────┐   │
│ │ Nové (5) │ Rozpracované (3) │ Prohlídky │ Uzavřené │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 🔴 NOVÝ                                      1h ▎│   │
│ │ Jan Novák · 608 123 456                           │   │
│ │ Škoda Octavia III 2018 — 359 000 Kč               │   │
│ │ "Dobrý den, mám zájem o prohlídku..."             │   │
│ │                          [📞 Zavolat] [✉️ Odpovědět]│   │
│ ├────────────────────────────────────────────────────┤   │
│ │ 🟡 PŘEČTENO                                  3h ▎│   │
│ │ Marie Svobodová · marie@email.cz                  │   │
│ │ BMW X3 2020 — 650 000 Kč                          │   │
│ │ "Jak je to s financováním?"                       │   │
│ │                          [📞 Zavolat] [✉️ Odpovědět]│   │
│ ├────────────────────────────────────────────────────┤   │
│ │ 🟢 ODPOVĚZENO · Prohlídka za 2 dny         včera ▎│   │
│ │ Petr Černý · 777 888 999                          │   │
│ │ VW Golf 8 2021 — 480 000 Kč                       │   │
│ │ "Super, přijedu se podívat"                       │   │
│ │                     [📅 Prohlídka 24.5.] [✏️ Poznámka]│   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌─ Quick Stats ──────────────────────────────────────┐   │
│ │ Tento měsíc: 12 poptávek · 4 odpovězeno · 1 sold  │   │
│ │ Průměrná doba odpovědi: 2.3h · Response rate: 75%  │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Tab definice:**

| Tab | Filtr | Badge count |
|-----|-------|-------------|
| Nové | `status IN (NEW, READ)` | Počet NEW |
| Rozpracované | `status IN (REPLIED)` | Celkový count |
| Prohlídky | `status = VIEWING` | Count s viewingDate v budoucnosti |
| Uzavřené | `status IN (SOLD, CLOSED, NO_INTEREST)` | — |

---

### 4. Statistiky — `/moje-inzeraty/statistiky/`

```
┌──────────────────────────────────────────────────────────┐
│ 📊 Statistiky inzerce                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │  Aktivní  │ │ Poptávky │ │ Prodáno  │ │ Response │    │
│ │ inzeráty  │ │ celkem   │ │ tento m. │ │   rate   │    │
│ │    8      │ │   47     │ │    2     │ │   78%    │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                          │
│ ┌─ Poptávky po autech ──────────────────────────────┐   │
│ │ Škoda Octavia 2018      ████████████  8 poptávek   │   │
│ │ BMW X3 2020             ██████        4 poptávky   │   │
│ │ VW Golf 8 2021          ████          3 poptávky   │   │
│ │ Ford Focus 2019         ██            1 poptávka   │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌─ Konverzní trychtýř ──────────────────────────────┐   │
│ │ Poptávky   ████████████████████████████  47 (100%) │   │
│ │ Odpovězeno ██████████████████           35 (74%)   │   │
│ │ Prohlídky  ████████                     12 (26%)   │   │
│ │ Prodáno    ████                          5 (11%)   │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌─ Průměrná doba odpovědi ──────────────────────────┐   │
│ │ Tento měsíc: 2.3 hodiny                           │   │
│ │ Minulý měsíc: 4.1 hodiny                          │   │
│ │ ↓ Zlepšení o 44%                                  │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

### 5. Nové API endpointy

| # | Endpoint | Method | Popis |
|---|----------|--------|-------|
| 1 | `/api/dealer/inquiries` | GET | Centrální inbox — všechny inquiry across all dealer's listings |
| 2 | `/api/dealer/inquiries/stats` | GET | Statistiky — counts, rates, top vehicles |
| 3 | `/api/dealer/inquiries/[id]/status` | PUT | Změna statusu inquiry (VIEWING, SOLD, etc.) |
| 4 | `/api/dealer/inquiries/[id]/note` | PUT | Přidat/editovat interní poznámku |
| 5 | `/api/dealer/inquiries/[id]/reply` | POST | Odpovědět na inquiry (+ email notifikace) |

#### 5.1 `GET /api/dealer/inquiries`

```typescript
// Query params:
// status?: string (comma-separated: "NEW,READ")
// listingId?: string (filter by specific listing)
// search?: string (buyer name, email, phone)
// sort?: "newest" | "oldest" | "priority"
// page?: number
// limit?: number (default 20)

// Response:
{
  inquiries: [
    {
      id: string,
      name: string,
      email: string,
      phone: string | null,
      message: string,
      reply: string | null,
      repliedAt: string | null,
      status: string,
      priority: string | null,
      note: string | null,
      viewingDate: string | null,
      viewingResult: string | null,
      createdAt: string,
      updatedAt: string,
      listing: {
        id: string,
        slug: string,
        brand: string,
        model: string,
        variant: string | null,
        year: number,
        price: number,
        image: string | null, // Primary image URL
      }
    }
  ],
  total: number,
  page: number,
  totalPages: number,
}
```

**Auth:** Session required. Filtruje automaticky `WHERE listing.userId = session.user.id`.

#### 5.2 `GET /api/dealer/inquiries/stats`

```typescript
// Response:
{
  activeListings: number,       // Počet ACTIVE inzerátů
  totalInquiries: number,       // Celkem poptávek (all time)
  monthlyInquiries: number,     // Poptávky tento měsíc
  newUnread: number,            // Nepřečtené (NEW status)
  repliedCount: number,         // Odpovězené
  viewingsScheduled: number,    // Naplánované prohlídky
  soldCount: number,            // Prodáno (tento měsíc)
  responseRate: number,         // % odpovězených (replied / total)
  avgResponseTime: number,      // Průměrná doba odpovědi v hodinách
  topVehicles: [                // Top 5 nejpoptávanějších
    { brand: string, model: string, year: number, count: number }
  ],
  funnel: {                     // Konverzní trychtýř
    total: number,
    replied: number,
    viewing: number,
    sold: number,
  }
}
```

#### 5.3 `PUT /api/dealer/inquiries/[id]/status`

```typescript
// Body:
{
  status: "READ" | "REPLIED" | "VIEWING" | "SOLD" | "CLOSED" | "NO_INTEREST",
  viewingDate?: string,         // Povinné pro VIEWING
  viewingResult?: string,       // Optional po prohlídce
}

// Validation:
// - NEW → READ (automatické)
// - READ → REPLIED (po reply)
// - REPLIED → VIEWING (s viewingDate)
// - VIEWING → SOLD | CLOSED | NO_INTEREST
// - Nelze se vrátit zpět (jednosměrný flow)
```

#### 5.4 `PUT /api/dealer/inquiries/[id]/note`

```typescript
// Body:
{
  note: string,       // Max 500 chars
  priority?: string,  // HIGH | NORMAL | LOW
}
```

#### 5.5 `POST /api/dealer/inquiries/[id]/reply`

```typescript
// Body:
{
  reply: string,  // Text odpovědi
}

// Side effects:
// 1. Uloží reply + repliedAt
// 2. Status → REPLIED (pokud byl NEW/READ)
// 3. Odešle email zájemci (Resend template)
// 4. Aktualizuje listing.lastResponseAt
```

---

### 6. Nové komponenty

| # | Soubor | Typ | Popis |
|---|--------|-----|-------|
| 1 | `components/web/dealer/DealerInquiryInbox.tsx` | Client | Centrální inbox s taby, search, filtrování |
| 2 | `components/web/dealer/InquiryCard.tsx` | Client | Karta jedné poptávky s quick actions |
| 3 | `components/web/dealer/InquiryReplyModal.tsx` | Client | Modal pro odpověď |
| 4 | `components/web/dealer/InquiryActions.tsx` | Client | Status progression tlačítka |
| 5 | `components/web/dealer/DealerStatsCards.tsx` | Server | 4 stat karty (aktivní, poptávky, prodáno, response rate) |
| 6 | `components/web/dealer/DealerFunnel.tsx` | Client | Konverzní trychtýř vizualizace |
| 7 | `components/web/dealer/TopVehiclesChart.tsx` | Client | Top 5 nejpoptávanějších horizontal bar chart |

**Proč `components/web/dealer/` a ne `components/pwa/`:**
- ADVERTISER nepoužívá PWA (`/makler/` prefix je pro BROKER)
- Dealer pages jsou pod `(web)` route group
- Oddělení od broker komponent = jasná ownership

---

### 7. Navigace — přidat do `/moje-inzeraty` layout

Aktuálně `/moje-inzeraty` nemá sub-navigaci. Přidat tabs/menu:

```
┌─────────────────────────────────────────────────────┐
│ Moje inzeráty                                       │
│ [Inzeráty] [Poptávky (5)] [Statistiky]              │
│                                                     │
│ ... obsah aktuální stránky ...                      │
└─────────────────────────────────────────────────────┘
```

**Implementace:**
- Nový `app/(web)/moje-inzeraty/layout.tsx` s tab navigací
- Tabs: Inzeráty (`/moje-inzeraty`), Poptávky (`/moje-inzeraty/poptavky`), Statistiky (`/moje-inzeraty/statistiky`)
- Badge s počtem nových poptávek na tab "Poptávky"
- Badge data z lightweight API call nebo server component

---

### 8. Email notifikace — rozšíření

**Existující template:** `lib/email-templates/listing/inquiry-notification.ts` — posílá se dealerovi při nové poptávce. OK, beze změn.

**Nové template:**
- `lib/email-templates/listing/inquiry-reply-to-buyer.ts` — odpověď dealera → email kupujícímu
  - Subject: "Odpověď na Váš dotaz — {brand} {model} {year}"
  - Body: Dealer name, reply text, link na listing, CTA "Zobrazit nabídku"

**Existující template `inquiry-reply.ts`** — ověřit obsah, případně rozšířit. Pokud už posílá reply kupujícímu, jen upravit.

---

## IMPLEMENTACE — FÁZE

### Fáze 1: Schema + API (backend)

| # | Co | Soubor | Akce |
|---|---|--------|------|
| 1.1 | Rozšířit Inquiry model | `prisma/schema.prisma` | +5 polí (viewingDate, viewingResult, note, priority, updatedAt) |
| 1.2 | Migrace | `prisma/migrations/` | `npx prisma migrate dev --name add_dealer_crm_fields` |
| 1.3 | Centrální inbox API | `app/api/dealer/inquiries/route.ts` | GET s filtry, paginací |
| 1.4 | Stats API | `app/api/dealer/inquiries/stats/route.ts` | GET aggregované statistiky |
| 1.5 | Status update API | `app/api/dealer/inquiries/[id]/status/route.ts` | PUT změna statusu |
| 1.6 | Note API | `app/api/dealer/inquiries/[id]/note/route.ts` | PUT poznámka + priorita |
| 1.7 | Reply API | `app/api/dealer/inquiries/[id]/reply/route.ts` | POST odpověď + email |
| 1.8 | Zod validators | `lib/validators/dealer-inquiry.ts` | Schémata pro nové endpointy |

### Fáze 2: UI — Centrální inbox

| # | Co | Soubor | Akce |
|---|---|--------|------|
| 2.1 | Layout s taby | `app/(web)/moje-inzeraty/layout.tsx` | Nový layout s tab navigací |
| 2.2 | Inbox stránka | `app/(web)/moje-inzeraty/poptavky/page.tsx` | Server component + client inbox |
| 2.3 | Loading/Error | `app/(web)/moje-inzeraty/poptavky/loading.tsx`, `error.tsx` | UX states |
| 2.4 | DealerInquiryInbox | `components/web/dealer/DealerInquiryInbox.tsx` | Tabbed inbox client component |
| 2.5 | InquiryCard | `components/web/dealer/InquiryCard.tsx` | Karta poptávky s listing info |
| 2.6 | InquiryReplyModal | `components/web/dealer/InquiryReplyModal.tsx` | Modal pro odpověď |
| 2.7 | InquiryActions | `components/web/dealer/InquiryActions.tsx` | Status buttons + viewing modal |

### Fáze 3: UI — Statistiky

| # | Co | Soubor | Akce |
|---|---|--------|------|
| 3.1 | Stats stránka | `app/(web)/moje-inzeraty/statistiky/page.tsx` | Server component + charts |
| 3.2 | Loading | `app/(web)/moje-inzeraty/statistiky/loading.tsx` | Skeleton |
| 3.3 | DealerStatsCards | `components/web/dealer/DealerStatsCards.tsx` | 4 stat boxes |
| 3.4 | DealerFunnel | `components/web/dealer/DealerFunnel.tsx` | Konverzní trychtýř |
| 3.5 | TopVehiclesChart | `components/web/dealer/TopVehiclesChart.tsx` | Horizontal bar chart |

### Fáze 4: Integrace + polish

| # | Co | Soubor | Akce |
|---|---|--------|------|
| 4.1 | Middleware check | `middleware.ts` | Ověřit `/moje-inzeraty/poptavky` je chráněno (mělo by automaticky být) |
| 4.2 | ListingDetailManager update | `components/web/ListingDetailManager.tsx` | Přidat link "Zobrazit v CRM" + nové statusy |
| 4.3 | MyListingsManager update | `components/web/MyListingsManager.tsx` | Přidat badge s novými poptávkami per listing |
| 4.4 | Email reply template | `lib/email-templates/listing/` | Ověřit/rozšířit buyer reply template |
| 4.5 | Notifikace | `lib/notifications.ts` | Přidat dealer-specific notification types |

---

## SOUBORY — KOMPLETNÍ SEZNAM

### Nové soubory (15)

| # | Soubor | Typ |
|---|--------|-----|
| 1 | `app/(web)/moje-inzeraty/layout.tsx` | Page layout |
| 2 | `app/(web)/moje-inzeraty/poptavky/page.tsx` | Page |
| 3 | `app/(web)/moje-inzeraty/poptavky/loading.tsx` | Loading |
| 4 | `app/(web)/moje-inzeraty/poptavky/error.tsx` | Error |
| 5 | `app/(web)/moje-inzeraty/statistiky/page.tsx` | Page |
| 6 | `app/(web)/moje-inzeraty/statistiky/loading.tsx` | Loading |
| 7 | `app/api/dealer/inquiries/route.ts` | API |
| 8 | `app/api/dealer/inquiries/stats/route.ts` | API |
| 9 | `app/api/dealer/inquiries/[id]/status/route.ts` | API |
| 10 | `app/api/dealer/inquiries/[id]/note/route.ts` | API |
| 11 | `app/api/dealer/inquiries/[id]/reply/route.ts` | API |
| 12 | `lib/validators/dealer-inquiry.ts` | Validator |
| 13 | `components/web/dealer/DealerInquiryInbox.tsx` | Component |
| 14 | `components/web/dealer/InquiryCard.tsx` | Component |
| 15 | `components/web/dealer/InquiryReplyModal.tsx` | Component |
| 16 | `components/web/dealer/InquiryActions.tsx` | Component |
| 17 | `components/web/dealer/DealerStatsCards.tsx` | Component |
| 18 | `components/web/dealer/DealerFunnel.tsx` | Component |
| 19 | `components/web/dealer/TopVehiclesChart.tsx` | Component |

### Editované soubory (5)

| # | Soubor | Akce |
|---|--------|------|
| 1 | `prisma/schema.prisma` | +5 polí na Inquiry model |
| 2 | `middleware.ts` | Ověřit coverage (pravděpodobně OK bez změn) |
| 3 | `components/web/ListingDetailManager.tsx` | Link na CRM + nové statusy |
| 4 | `components/web/MyListingsManager.tsx` | Badge s novými poptávkami |
| 5 | `lib/notifications.ts` | Dealer notification types |

---

## STOP PRAVIDLA

- **STOP-1:** NEMĚNIT Lead model ani `/makler/leads/` — to je broker CRM, jiný workflow.
- **STOP-2:** NEMĚNIT VehicleInquiry model — to je inquiry na Vehicle (broker), ne na Listing (dealer).
- **STOP-3:** NEMĚNIT stávající Inquiry API (`/api/listings/[id]/inquiry`) — ty fungují pro buyer-side flow. Nové dealer endpoints jsou pod `/api/dealer/`.
- **STOP-4:** NEVYTVÁŘET nový Prisma model — rozšířit Inquiry, ne duplikovat.
- **STOP-5:** NEPOUŽÍVAT PWA layout (`/makler/`) pro dealer stránky — dealer je pod `(web)` route group.
- **STOP-6:** NEMĚNIT buyer-facing stránky (`/muj-ucet/dotazy`, `/nabidka/[slug]` contact form).
- **STOP-7:** Schema migrace MUSÍ být zpětně kompatibilní — všechna nová pole jsou nullable/optional.
- **STOP-8:** Nové statusy (VIEWING, SOLD, NO_INTEREST) NESMÍ breaknout stávající flow — stávající kód pracuje s NEW, READ, REPLIED, CLOSED a to musí dál fungovat.

---

## ACCEPTANCE CRITERIA

- [ ] Dealer vidí centrální inbox všech poptávek na `/moje-inzeraty/poptavky`
- [ ] Poptávky jsou filtrovatelné podle statusu (taby: Nové, Rozpracované, Prohlídky, Uzavřené)
- [ ] Dealer může odpovědět na poptávku → zájemce dostane email
- [ ] Dealer může naplánovat prohlídku (viewingDate) → status VIEWING
- [ ] Dealer může označit jako prodáno / bez zájmu
- [ ] Dealer může přidat interní poznámku + prioritu
- [ ] Statistiky zobrazují: aktivní inzeráty, celkem poptávek, response rate, konverzní trychtýř
- [ ] Top 5 nejpoptávanějších vozidel
- [ ] Tab navigace v `/moje-inzeraty`: Inzeráty / Poptávky (badge) / Statistiky
- [ ] Mobile-first responsive design
- [ ] `npm run build` projde
- [ ] Stávající buyer flow (ContactForm → Inquiry) funguje beze změn
- [ ] Stávající broker Lead flow funguje beze změn
- [ ] Middleware správně chrání nové stránky (pouze přihlášení uživatelé)

---

## POZNÁMKY PRO IMPLEMENTÁTORA

1. **Inquiry statusy zpětná kompatibilita:** `ListingDetailManager.tsx` aktuálně pracuje s NEW/READ/REPLIED/CLOSED. Po rozšíření musí zobrazovat i VIEWING/SOLD/NO_INTEREST. Zkontrolovat všechny `status ===` podmínky.

2. **Auto-READ:** Stávající `GET /api/listings/[id]/inquiry` automaticky markuje NEW→READ. Nový `/api/dealer/inquiries` by měl dělat totéž jen při explicit detail view, NE při list view (jinak se všechno přečte najednou).

3. **Response time kalkulace:** `avgResponseTime = avg(repliedAt - createdAt)` jen pro inquiry kde `repliedAt IS NOT NULL`. Výsledek v hodinách, zaokrouhlit na 1 desetinné místo.

4. **Funnel kalkulace:** Percentuální základ je `total inquiries` v daném období. `replied` = kde `status NOT IN (NEW, READ)`. `viewing` = kde `viewingDate IS NOT NULL`. `sold` = kde `status = SOLD`.

5. **Layout wrap:** Existující `/moje-inzeraty/page.tsx` vrací přímo `<MyListingsManager>`. Po přidání `layout.tsx` bude content wrappován do layoutu. Ověřit, že MyListingsManager nemá vlastní padding/wrapper, který by kolidoval.

6. **Badge count pro tab:** Lightweight query `prisma.inquiry.count({ where: { listing: { userId }, status: "NEW" } })` v layout.tsx (server component). NEPOUŽÍVAT full stats API pro badge.
