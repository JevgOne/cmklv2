# QA Report — Internal Notifications MVP + Rules of Hooks fix

**Datum:** 2026-05-23  
**Commity:** `bcc8d37` (notifications MVP) + `288f93c` (Rules of Hooks fix)  
**Build:** ✓ 1312/1312 static pages, exit 0  
**Soubory:** 9 (dle zadání)

---

## 1. VehicleComment model — schema.prisma: PASS ✅

```prisma
model VehicleComment {
  id        String  @id @default(cuid())
  vehicleId String
  vehicle   Vehicle @relation("VehicleInternalComments", onDelete: Cascade)
  userId    String
  user      User    @relation("VehicleCommentAuthor", ...)
  content    String  @db.Text
  isInternal Boolean @default(false)
  createdAt DateTime @default(now())
  @@index([vehicleId])
  @@index([userId])
  @@index([createdAt])
}
```

✅ Model správný — `isInternal` flag, Cascade delete, 3 indexy.  
✅ Relace v `User.vehicleComments` i `Vehicle.internalComments` přidány.  
⚠️ Nasazeno přes `prisma db push` (ne migrací) — viz produkční poznámka.

---

## 2. Comments API (`/api/vehicles/[id]/comments`): PASS ✅

### Auth — viditelnost komentářů (GET)

```typescript
const isAdmin = ADMIN_ROLES.includes(session.user.role); // ADMIN|BACKOFFICE|MANAGER
// Broker: kontrola vlastnictví vozidla
if (!isAdmin) {
  const vehicle = await prisma.vehicle.findUnique(...);
  if (!vehicle || vehicle.brokerId !== session.user.id) return 403;
}
// Broker nevidí isInternal
...(!isAdmin && { isInternal: false })
```

✅ Admin vidí všechny komentáře (i interní).  
✅ Broker vidí jen vlastní vozidlo a jen veřejné komentáře.

### isInternal enforcement (POST)

```typescript
const isInternal = isAdmin ? data.isInternal : false;
```

✅ Force override — broker vždy dostane `false`, i kdyby poslal `isInternal: true`.

### Notifikace

| Situace | Notif. komu | Type | Status |
|---|---|---|---|
| Admin napsal (ne interní) | Makléř → `/makler/vehicles/[id]` | MESSAGE | ✅ |
| Makléř napsal | Všichni ADMIN+BACKOFFICE aktivní → `/admin/vehicles/[id]` | MESSAGE | ✅ |
| Admin napsal interní | Nikdo | — | ✅ |
| Admin napsal, brokerId null | Guard `vehicle.brokerId &&` | — | ✅ |

---

## 3. Approve API — notifikace: PASS ✅

`app/api/admin/vehicles/[id]/approve/route.ts`:

```typescript
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

✅ `createManagerNotification` v `lib/notifications.ts` — signature odpovídá (`vehicleId` předán).  
✅ Brokera notifikuje správně při approve i reject.  
✅ Guard na `vehicle.brokerId` — nenastane 500 pro vozidla bez makléře.

---

## 4. Status API — DRAFT→PENDING notifikace: PASS ✅

`app/api/vehicles/[id]/status/route.ts`:

```typescript
if (data.status === "PENDING" && 
    (vehicle.status === "DRAFT" || vehicle.status === "DRAFT_QUICK" || vehicle.status === "REJECTED")) {
  // createNotification pro všechny ADMIN+BACKOFFICE (status: ACTIVE)
}
```

✅ Pokrývá DRAFT, DRAFT_QUICK i REJECTED → PENDING.  
✅ `type: "VEHICLE"` — správný typ.  
✅ Filtr `status: "ACTIVE"` — jen aktivní admini.

**Mírná poznámka:** `isAdmin` je zde definován jako `role === "ADMIN" || role === "BACKOFFICE"` — MANAGER je vyloučen z PENDING→ACTIVE přes tuto route. Ale MANAGER může schvalovat přes `/admin/vehicles/[id]/approve`. Nekonzistence neblokuje funkčnost (schvalovací flow jde přes approve endpoint).

---

## 5. `app/api/notifications/route.ts` — POZOR ⚠️

**Tento soubor neexistuje.** Zadání odkazuje na `app/api/notifications/route.ts`, ale skutečný endpoint je:

```
app/api/broker/notifications/route.ts
```

Komponenta `NotificationsInbox.tsx` volá `/api/broker/notifications` — správně ✅. Jde o překlep v zadání, ne bug.

---

## 6. `app/api/broker/notifications/route.ts` — rozšíření: PASS ✅

**GET:**
- `take` param, max 50 ✅
- `cursor` pagination (`cursor: { id }, skip: 1`) ✅
- `unreadOnly` filter ✅
- `take + 1` trick pro detekci dalších stránek ✅

**PATCH:**
- `markAllRead: true` → `updateMany` ✅
- `ids: [...]` → cílené označení ✅
- Ochrana `userId: session.user.id` u obou variant ✅ (brání označení cizích notifikací)

---

## 7. Notifications inbox stránka (`/makler/notifications`): PASS ✅

Server component:
- Auth guard → `redirect("/login")` ✅
- `Promise.all([findMany, count])` ✅
- `take + 1` trick ✅
- `createdAt.toISOString()` — serializace Date pro client props ✅

---

## 8. Admin VehicleComments komponenta: PASS ✅

`components/admin/vehicles/VehicleComments.tsx`:

```typescript
const canSetInternal = ["ADMIN", "BACKOFFICE", "MANAGER"].includes(currentUserRole);
```

✅ Checkbox „Interní poznámka" viditelný pouze pro admin role — UI konzistentní s API.  
✅ Optimistický update: nový komentář přidán do `comments` state okamžitě po 201 response.

---

## 9. PWA VehicleComments komponenta: PASS ✅

`components/pwa/vehicles/VehicleComments.tsx`:

```typescript
body: JSON.stringify({ content: content.trim() })
// isInternal se vůbec neposílá
```

✅ Broker nemůže nastavit `isInternal` — ani z UI, ani z API vola.  
✅ API default `isInternal: false` (Zod `.default(false)`) ✅.  
✅ Podmíněný early return na `if (comments.length === 0 && !content) return null` je **po** všech `useState` hookách — Rules of Hooks OK.

**Minor:** `refetch` callback v `NotificationsInbox.tsx` je definován ale nikde nevolán — dead code. Neblokuje funkčnost.

---

## 10. Rules of Hooks fix (`288f93c`): PASS ✅

`app/(pwa)/makler/vehicles/new/page.tsx`:

```typescript
export default function NewVehiclePage() {
  const searchParams = useSearchParams(); // vždy 1 hook
  const leadId = searchParams.get("leadId");
  if (leadId) return <LeadPrefillRedirect leadId={leadId} />;
  return <NewVehicleContent />;
}

function NewVehicleContent() {
  // useRouter, useDraftContext, useState×3, useCallback, useEffect — vždy voláno
}
```

✅ Správná split-component pattern.  
✅ `NewVehiclePage` volá přesně 1 hook před early return.  
✅ `NewVehicleContent` má vlastní hooks bez podmínek.

---

## STOP check

| Kritérium | Status |
|---|---|
| Žádný Pusher/real-time | ✅ |
| Žádný workflow engine | ✅ |
| Žádné threaded comments | ✅ |
| Žádné přílohy | ✅ |
| Existující 4 typy notifikací (VEHICLE + MESSAGE) | ✅ |
| NotificationBell logika nezměněna | ✅ |

---

## Souhrn

| Oblast | Status | Poznámka |
|---|---|---|
| VehicleComment model | PASS ⚠️ | `db push` — viz produkce |
| Comments API (auth, isInternal, notif) | PASS ✅ | |
| Approve API notifikace | PASS ✅ | |
| Status API DRAFT→PENDING notifikace | PASS ✅ | |
| Notifications API (cursor, markAllRead) | PASS ✅ | endpoint je `/api/broker/notifications` |
| Notifications inbox stránka | PASS ✅ | |
| Admin VehicleComments | PASS ✅ | |
| PWA VehicleComments | PASS ✅ | |
| Rules of Hooks fix | PASS ✅ | |
| Build | PASS ✅ | 1312/1312 exit 0 |

**⚠️ Produkční poznámka:** `VehicleComment` tabulka nasazena přes `prisma db push`. Žádný soubor v `prisma/migrations/`. Před deplojem na produkci nutná ruční migrace.

**Celkový výsledek: PASS ✅**
