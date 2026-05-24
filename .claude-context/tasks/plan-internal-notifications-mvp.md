# Plan: Interní notifikace + komentáře — MVP

**Task:** Interní komunikace MVP
**Status:** PLAN READY
**Datum:** 2026-05-23
**Typ:** Feature — interní komunikace
**Závažnost:** HIGH — uživatel nevidí komunikaci v platformě
**Rodičovský plán:** `plan-internal-workflow-system.md` (fáze 2+)

---

## PROBLÉM

Uživatel řekl: *"Já třeba nevidím tu komunikaci, předávání požadavků, chat atd"*

**Aktuální stav:**
1. **Notifikace existují** ale jsou neúplné — admin schválí/zamítne vozidlo → **notifikace se NEVYTVOŘÍ** (approve API pouze mění status + VehicleChangeLog, nevolá `createNotification()`)
2. **Komentáře u vozidla NEEXISTUJÍ** — admin nemůže napsat "Doplň fotky interiéru" k vozidlu
3. **Inbox** — `/makler/messages` ukazuje jen VehicleInquiry (dotazy kupujících), ne interní komunikaci
4. **NotificationBell** funguje — polling, zobrazí 5 posledních, mark as read — ale dostává málo notifikací

---

## AKTUÁLNÍ INFRASTRUKTURA (co už máme)

### Funguje a rozšíříme:

| Komponenta | Stav | Soubor |
|---|---|---|
| `Notification` model | 4 typy (COMMISSION, VEHICLE, SYSTEM, MESSAGE) | `schema.prisma:521-537` |
| `createNotification()` | Helper — vytvoří záznam v DB | `lib/notifications.ts` |
| `createManagerNotification()` | Notifikace pro schválení/zamítnutí/vrácení | `lib/notifications.ts:29-61` |
| `NotificationBell` | Dropdown s 5 notifikacemi, polling | `components/pwa/NotificationBell.tsx` |
| `NotificationsList` | Dashboard widget | `components/pwa/dashboard/NotificationsList.tsx` |
| `GET/PATCH /api/broker/notifications` | List + mark as read | `app/api/broker/notifications/route.ts` |
| `NotificationPreference` | Per-event push/email/sms toggles | `schema.prisma:1750-1760` |

### Chybí a přidáme:

| Co | Proč chybí | Řešení |
|---|---|---|
| Notifikace při approve/reject | `POST /api/admin/vehicles/[id]/approve` NEVOLÁ `createNotification()` | Přidat volání |
| Notifikace při DRAFT→PENDING | `PATCH /api/vehicles/[id]/status` NEVOLÁ `createNotification()` | Přidat volání |
| Komentáře u vozidla | Žádný model | Nový `VehicleComment` model |
| Inbox stránka | `/makler/messages` = jen VehicleInquiry | Nová stránka `/makler/notifications` |
| Admin komentářový formulář | Admin nemůže psát poznámky k autu | Nová komponenta v admin vehicle detailu |

---

## NAVRHOVANÉ ŘEŠENÍ

### Flow overview

```
Admin/BackOffice
    │
    ├── Schválí vozidlo → Notifikace makléři: "Vozidlo schváleno"
    ├── Zamítne vozidlo → Notifikace makléři: "Vozidlo zamítnuto: {důvod}"
    └── Napíše komentář → Notifikace makléři: "Nový komentář: {text}"
    
Makléř
    │
    ├── Odešle ke schválení (DRAFT→PENDING) → Notifikace admin/backoffice
    ├── Vidí notifikace v NotificationBell (existující)
    ├── Klikne → přejde na vozidlo/komentář
    └── Otevře /makler/notifications → seznam VŠECH notifikací
    
Makléř → Komentář pod vozidlem
    │
    └── Odpovědí na komentář admina → Notifikace adminovi
```

---

## IMPLEMENTACE

### 1. Nový model — VehicleComment

**Soubor:** `prisma/schema.prisma`

```prisma
model VehicleComment {
  id        String  @id @default(cuid())
  vehicleId String
  vehicle   Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  userId    String
  user      User    @relation("VehicleCommentAuthor", fields: [userId], references: [id])
  
  content   String  @db.Text
  
  // Kdo může vidět
  // true = vidí jen ADMIN/BACKOFFICE/MANAGER (interní poznámka)
  // false = vidí i makléř (broker)
  isInternal Boolean @default(false)
  
  createdAt DateTime @default(now())
  
  @@index([vehicleId])
  @@index([userId])
  @@index([createdAt])
}
```

**Proč NE `DealComment` pattern (threaded s parentId)?**
MVP nepotřebuje vlákna. Komentáře jsou lineární list pod vozidlem. Threaded comments = fáze 2 (workflow systém).

**Relace v existujících modelech:**

```prisma
// User — přidat:
vehicleComments VehicleComment[] @relation("VehicleCommentAuthor")

// Vehicle — přidat:
comments VehicleComment[]
```

### 2. API endpoint — komentáře u vozidla

**Nový soubor:** `app/api/vehicles/[id]/comments/route.ts`

```typescript
// GET — seznam komentářů pro vozidlo
// Auth: ADMIN, BACKOFFICE, MANAGER, BROKER (vlastník)
// BROKER vidí jen !isInternal komentáře
// Response: { comments: VehicleComment[] }

// POST — přidat komentář
// Auth: ADMIN, BACKOFFICE, MANAGER, BROKER (vlastník)
// Body: { content: string, isInternal?: boolean }
// BROKER nemůže nastavit isInternal=true
// Side-effect: createNotification() pro relevantní uživatele
```

**Logika notifikací při komentáři:**
- Admin/backoffice napíše komentář → notifikace makléři (vlastníkovi vozidla)
- Makléř napíše komentář → notifikace všem ADMIN + BACKOFFICE (nebo jen poslednímu, kdo komentoval)

### 3. Rozšíření approve API — přidat notifikaci

**Editovaný soubor:** `app/api/admin/vehicles/[id]/approve/route.ts`

**Aktuální stav:** Mění status, vytváří VehicleChangeLog, ale NEvytváří Notification.

**Přidat za `prisma.$transaction`:**

```typescript
import { createManagerNotification } from "@/lib/notifications";

// Po úspěšném update:
const vehicleName = `${vehicle.brand} ${vehicle.model}`;
if (vehicle.brokerId) {
  await createManagerNotification({
    brokerId: vehicle.brokerId,
    vehicleId: vehicle.id,
    action: data.action === "approve" ? "approved" : "rejected",
    vehicleName,
    reason: data.reason,
  });
}
```

**Poznámka:** `createManagerNotification()` již existuje v `lib/notifications.ts` s přesně touto logikou — jen se nevolá z approve API. Toto je **1-řádkový fix**.

### 4. Rozšíření status API — notifikace při DRAFT→PENDING

**Editovaný soubor:** `app/api/vehicles/[id]/status/route.ts`

**Přidat po úspěšném statusu PENDING:**

```typescript
import { createNotification } from "@/lib/notifications";

// Po vehicle update, pokud nový stav = PENDING:
if (data.status === "PENDING") {
  // Notifikace všem ADMIN + BACKOFFICE uživatelům
  const admins = await prisma.user.findMany({
    where: { 
      role: { in: ["ADMIN", "BACKOFFICE"] },
      status: "ACTIVE",
    },
    select: { id: true },
  });
  
  const vehicleName = `${updated.brand} ${updated.model}`;
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "VEHICLE",
        title: "Nové vozidlo ke schválení",
        body: `${vehicleName} čeká na schválení.`,
        link: `/admin/vehicles/${updated.id}`,
      })
    )
  );
}
```

### 5. Inbox stránka — /makler/notifications

**Nový soubor:** `app/(pwa)/makler/notifications/page.tsx`

Server component — seznam VŠECH notifikací přihlášeného uživatele (ne jen 5 jako v NotificationBell).

```typescript
// Funkce:
// - Stránkovaný seznam všech notifikací (take: 20, cursor pagination)
// - Filtr: Všechny / Nepřečtené
// - Klik → mark as read + navigate to link
// - "Označit vše jako přečtené" button
```

**Nové soubory:**
- `app/(pwa)/makler/notifications/page.tsx` — server component
- `app/(pwa)/makler/notifications/loading.tsx`
- `app/(pwa)/makler/notifications/error.tsx`
- `components/pwa/notifications/NotificationsInbox.tsx` — client component (mark as read, filtry)

### 6. Komentáře v admin vehicle detailu

**Editovaný soubor:** `app/(admin)/admin/vehicles/[id]/page.tsx`

Přidat sekci "Komentáře" pod fotografie:
- Seznam existujících komentářů (chronologicky)
- Formulář pro přidání komentáře
- Toggle "Interní poznámka" (vidí jen admin/backoffice)

**Nová komponenta:** `components/admin/vehicles/VehicleComments.tsx`

```typescript
"use client";
// Props: vehicleId, comments (initial), currentUserRole
// Funkce:
// - Zobrazí seznam komentářů s avatarem, jménem, datem
// - Interní komentáře mají žlutý pozadí + badge "Interní"
// - Textarea + "Odeslat" button
// - Toggle "Interní poznámka" (checkbox)
// - Po odeslání → refetch komentářů (optimistic update)
```

### 7. Komentáře v makléř vehicle detailu (PWA)

**Editovaný soubor:** `app/(pwa)/makler/vehicles/[id]/page.tsx` nebo odpovídající hub komponenta

Přidat sekci "Zprávy od admina":
- Seznam komentářů (jen !isInternal)
- Formulář pro odpověď

**Nová komponenta:** `components/pwa/vehicles/VehicleComments.tsx`

```typescript
"use client";
// Props: vehicleId, comments (initial)
// Jednodušší verze admin komponenty:
// - Žádný isInternal toggle
// - Kompaktnější design (mobile-first)
```

### 8. Rozšíření NotificationBell — link na inbox

**Editovaný soubor:** `components/pwa/NotificationBell.tsx`

Změnit "Zobrazit vše" link z `/makler/dashboard` na `/makler/notifications`.

### 9. Rozšíření broker notifications API — podpora pagination

**Editovaný soubor:** `app/api/broker/notifications/route.ts`

Přidat query params:
- `?take=20` (default 5 pro bell, 20 pro inbox)
- `?cursor={id}` (pro infinite scroll v inbox)
- `?unreadOnly=true` (pro filtr)

### 10. "Označit vše jako přečtené"

**Editovaný soubor:** `app/api/broker/notifications/route.ts`

Přidat nový endpoint nebo rozšířit PATCH:
- `PATCH { markAllRead: true }` — nastaví read=true pro všechny notifikace uživatele

---

## SOUBORY — KOMPLETNÍ SEZNAM

### Nové soubory (7)

| # | Soubor | Typ | Popis |
|---|--------|-----|-------|
| 1 | `app/api/vehicles/[id]/comments/route.ts` | API | GET + POST komentáře u vozidla |
| 2 | `app/(pwa)/makler/notifications/page.tsx` | Page | Inbox — seznam všech notifikací |
| 3 | `app/(pwa)/makler/notifications/loading.tsx` | Loading | Skeleton |
| 4 | `app/(pwa)/makler/notifications/error.tsx` | Error | Error boundary |
| 5 | `components/pwa/notifications/NotificationsInbox.tsx` | Client | Inbox UI — filtry, mark as read, infinite scroll |
| 6 | `components/admin/vehicles/VehicleComments.tsx` | Client | Admin komentáře u vozidla |
| 7 | `components/pwa/vehicles/VehicleComments.tsx` | Client | PWA komentáře u vozidla (makléřský view) |

### Editované soubory (7)

| # | Soubor | Akce |
|---|--------|------|
| 1 | `prisma/schema.prisma` | +VehicleComment model, +relace v User a Vehicle |
| 2 | `app/api/admin/vehicles/[id]/approve/route.ts` | +createManagerNotification() volání po approve/reject |
| 3 | `app/api/vehicles/[id]/status/route.ts` | +notifikace admin/backoffice při DRAFT→PENDING |
| 4 | `app/api/broker/notifications/route.ts` | +pagination (take, cursor), +markAllRead, +unreadOnly filtr |
| 5 | `components/pwa/NotificationBell.tsx` | Změna "Zobrazit vše" href na /makler/notifications |
| 6 | `app/(admin)/admin/vehicles/[id]/page.tsx` | +VehicleComments sekce pod fotografie |
| 7 | `app/(pwa)/makler/vehicles/[id]/page.tsx` | +VehicleComments sekce (nebo odpovídající detail page) |

### Celkem: 14 souborů (7 nových + 7 editovaných)

---

## NOTIFIKACE — KDY SE VYTVOŘÍ

| Událost | Kdo dostane | Typ | Aktuálně | MVP |
|---|---|---|---|---|
| Vehicle DRAFT→PENDING | ADMIN + BACKOFFICE | VEHICLE | NEVYTVÁŘÍ SE | PŘIDAT |
| Vehicle PENDING→ACTIVE | Makléř (vlastník) | VEHICLE | NEVYTVÁŘÍ SE | PŘIDAT (1-line fix) |
| Vehicle PENDING→REJECTED | Makléř (vlastník) | VEHICLE | NEVYTVÁŘÍ SE | PŘIDAT (1-line fix) |
| Nový komentář od admina | Makléř (vlastník) | MESSAGE | NEEXISTUJE | PŘIDAT |
| Nový komentář od makléře | ADMIN/BACKOFFICE | MESSAGE | NEEXISTUJE | PŘIDAT |
| Nový VehicleInquiry (kupující) | Makléř | MESSAGE | UŽ FUNGUJE | BEZ ZMĚNY |
| Commission paid | Makléř | COMMISSION | UŽ FUNGUJE | BEZ ZMĚNY |

---

## INBOX UI — WIREFRAME

```
┌──────────────────────────────────────┐
│ ← Zprávy a notifikace               │
│                                      │
│ [Všechny] [Nepřečtené]  [✓ Přečíst] │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 🔴 Vozidlo schváleno            │ │
│ │ Škoda Octavia 2024 bylo schvá...│ │
│ │ Před 2 hod                      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ │ 💬 Nový komentář                 │ │
│ │ Jan Admin: "Doplňte fotky int..."│ │
│ │ Před 5 hod                       │ │
│                                      │
│ │ ❌ Vozidlo zamítnuto              │ │
│ │ BMW 320d — Důvod: Chybí foto...  │ │
│ │ Včera                            │ │
│                                      │
│ │ 💬 Dotaz od kupujícího           │ │
│ │ Petr Novák: "Je auto ještě k..." │ │
│ │ Před 2 dny                       │ │
│                                      │
│ [Načíst starší...]                   │
└──────────────────────────────────────┘
```

---

## ADMIN KOMENTÁŘE — WIREFRAME

```
┌──────────────────────────────────────┐
│ Komentáře                            │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ JA Jan Admin · 22.5. 14:30     │ │
│ │ Doplňte fotky interiéru, chybí  │ │
│ │ pohled na zadní sedačky.        │ │
│ │                    [Interní] 🟡 │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ PM Petr Makléř · 22.5. 15:10   │ │
│ │ Doplněno, přidal jsem 3 fotky.  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ [Napište komentář...]            │ │
│ │                                  │ │
│ │ ☐ Interní poznámka   [Odeslat] │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## EDGE CASES

### 1. Notifikace pro smazaného/neaktivního uživatele
- `createNotification()` nemá guard na user.status
- MVP: ignorovat — notifikace se vytvoří ale uživatel se nepřihlásí
- Fáze 2: zkontrolovat status=ACTIVE před vytvořením

### 2. Velký počet ADMIN/BACKOFFICE uživatelů
- Při DRAFT→PENDING notifikace JDE VŠEM adminům
- V MVP je to OK (typicky 2-5 adminů)
- Fáze 2: round-robin assignment (workflow systém)

### 3. Makléř odpoví na interní komentář
- Makléř NEVIDÍ interní komentáře (isInternal=true)
- Makléř vidí jen veřejné komentáře
- Makléř nemůže nastavit isInternal=true

### 4. Offline
- Komentáře vyžadují online — neukládáme do IndexedDB
- Notifikace se loadnou po reconnect (polling)
- MVP: žádná offline podpora pro komentáře

### 5. Příliš mnoho notifikací
- Inbox má pagination (take=20, cursor)
- Staré notifikace zůstávají v DB (fáze 2: auto-cleanup po 90 dnech)

---

## CO TOTO MVP NEŘEŠÍ (odloženo na fáze 2+)

| Feature | Plán | Kdy |
|---|---|---|
| Plnohodnotný chat | `plan-internal-workflow-system.md` Fáze 5 | Po workflow |
| Workflow požadavky (financování, dokumenty...) | `plan-internal-workflow-system.md` Fáze 1-4 | Samostatný task |
| Real-time (Pusher) | `plan-internal-workflow-system.md` Fáze 3 | Po workflow |
| SLA timery | `plan-internal-workflow-system.md` Fáze 2 | Po workflow |
| Threaded comments (odpovědi na konkrétní komentář) | Rozšíření VehicleComment o parentId | Dle potřeby |
| Přílohy u komentářů (fotky, PDF) | Rozšíření VehicleComment o attachmentUrl | Dle potřeby |
| Email notifikace | Integrace Resend | Fáze 2 |
| Push notifikace (PWA) | Service Worker + Web Push API | Fáze 2 |
| Offline komentáře | IndexedDB queue + pendingActions | Fáze 2 |
| Auto-cleanup starých notifikací | CRON job | Fáze 2 |

---

## STOP PRAVIDLA

- **STOP-1:** NEIMPLEMENTOVAT Pusher/real-time — MVP je polling-based (existující NotificationBell pattern).
- **STOP-2:** NEIMPLEMENTOVAT workflow engine — jen komentáře a notifikace.
- **STOP-3:** NEMĚNIT existující VehicleInquiry flow — to je kupující→makléř. Toto je admin↔makléř.
- **STOP-4:** NEIMPLEMENTOVAT threaded comments (parentId) — lineární list stačí pro MVP.
- **STOP-5:** NEIMPLEMENTOVAT přílohy u komentářů — jen text.
- **STOP-6:** NEIMPLEMENTOVAT nové Notification typy — používat existující 4 (COMMISSION, VEHICLE, SYSTEM, MESSAGE).
- **STOP-7:** NEMĚNIT existující NotificationBell logiku — jen změnit href pro "Zobrazit vše".
- **STOP-8:** NEIMPLEMENTOVAT email/push notifikace — jen in-app (existující Notification model).

---

## ACCEPTANCE CRITERIA

- [ ] Admin schválí vozidlo → makléř vidí notifikaci v NotificationBell
- [ ] Admin zamítne vozidlo → makléř vidí notifikaci s důvodem zamítnutí
- [ ] Makléř odešle vozidlo (DRAFT→PENDING) → admin/backoffice vidí notifikaci
- [ ] Admin napíše komentář k vozidlu → makléř vidí notifikaci + komentář u vozidla
- [ ] Makléř odpoví komentářem → admin vidí notifikaci + odpověď
- [ ] Admin může napsat interní poznámku (isInternal=true) → makléř ji NEVIDÍ
- [ ] Klik na notifikaci → navigace na správnou stránku (vozidlo, komentář)
- [ ] `/makler/notifications` zobrazí VŠECHNY notifikace s pagination
- [ ] Filtr "Nepřečtené" funguje
- [ ] "Označit vše jako přečtené" funguje
- [ ] `npm run build` projde
- [ ] Žádné nové npm závislosti

---

## DEPENDENCY CHAIN

```
1. Prisma schema (VehicleComment) + migrace
   │
   ├── 2a. API: /api/vehicles/[id]/comments (GET+POST)
   │     │
   │     ├── 3a. Admin: VehicleComments komponenta
   │     └── 3b. PWA: VehicleComments komponenta
   │
   └── 2b. Fix approve API (přidat createManagerNotification)
         │
         └── 2c. Fix status API (přidat notifikaci při PENDING)
               │
               ├── 3c. Rozšíření notifications API (pagination)
               │     │
               │     └── 4. Inbox stránka (/makler/notifications)
               │
               └── 3d. NotificationBell — href fix
```

**Kritická cesta:** 1 → 2a → 3a + 3b (komentáře)
**Quick win:** 2b (1-line fix — approve API → notifikace)

---

## ODHAD ROZSAHU

- **Quick wins (2b, 2c, 3d):** Přidat `createNotification()` volání do 2 existujících API routes + změnit href v NotificationBell. ~30 řádků kódu celkem.
- **Core feature (1, 2a, 3a, 3b):** VehicleComment model + API + 2 UI komponenty. ~300 řádků kódu.
- **Inbox (3c, 4):** Rozšíření notifications API + nová stránka. ~200 řádků kódu.
- **Celkem:** ~530 řádků nového kódu v 14 souborech.
