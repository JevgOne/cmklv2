# QA Report — Internal Notifications MVP (commit `bcc8d37`)

**Datum:** 2026-05-23  
**Build:** ✓ Compiled 1312/1312 static pages (+1 `/makler/notifications`), exit 0  
**Soubory:** 15 (937 vložení, 27 smazání)

---

## 1. VehicleComment model + DB: PASS ✅ (s poznámkou)

### schema.prisma

```prisma
model VehicleComment {
  id        String  @id @default(cuid())
  vehicleId String
  vehicle   Vehicle @relation("VehicleInternalComments", ...)  // onDelete: Cascade ✅
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
✅ Model správný — `isInternal` flag, Cascade delete, indexy.  
✅ Relace v User i Vehicle modelu přidány.

### ⚠️ `prisma db push` místo migrace

Schema bylo nasazeno přes `prisma db push` (shadow DB drift blokoval `migrate dev`). Žádná migrace v `prisma/migrations/`. Pro produkci bude nutná ruční migrace.

---

## 2. Comments API (`/api/vehicles/[id]/comments`): PASS ✅

### GET — Viditelnost

```typescript
const isAdmin = ADMIN_ROLES.includes(session.user.role);
// Broker nemůže číst cizí vozidlo
if (!isAdmin) {
  // check brokerId === session.user.id → 403
}
// Broker nevidí isInternal=true komentáře
...(!isAdmin && { isInternal: false })
```
✅ Broker vidí jen vlastní vozidlo a jen veřejné komentáře.

### POST — Zápis

```typescript
// Broker nemůže nastavit isInternal
const isInternal = isAdmin ? data.isInternal : false;
```
✅ Force override — broker vždy dostane `isInternal: false`.

### POST — Notifikace

| Situace | Notifikace komu | Status |
|---|---|---|
| Admin napsal (ne interní) | Makléř → `/makler/vehicles/[id]` | ✅ |
| Makléř napsal | Všichni ADMIN+BACKOFFICE → `/admin/vehicles/[id]` | ✅ |
| Admin napsal interní | Nikdo (správně) | ✅ |
| Admin napsal neregistrovanému brokerovi | Guard `vehicle.brokerId &&` | ✅ |

---

## 3. Approve API — notifikace: PASS ✅

```typescript
if (vehicle.brokerId) {
  await createManagerNotification({
    brokerId: vehicle.brokerId,
    action: data.action === "approve" ? "approved" : "rejected",
    vehicleName,
    reason: data.reason,
  });
}
```
✅ `createManagerNotification()` existuje v `lib/notifications.ts`, typ `"VEHICLE"`.  
✅ Volá se jen pokud `brokerId` existuje.

---

## 4. Status API — DRAFT→PENDING notifikace: PASS ✅

```typescript
if (data.status === "PENDING" && 
    (vehicle.status === "DRAFT" || vehicle.status === "DRAFT_QUICK" || vehicle.status === "REJECTED")) {
  // notifikace všem ADMIN+BACKOFFICE
}
```
✅ Pokrývá DRAFT→PENDING, DRAFT_QUICK→PENDING i REJECTED→PENDING.  
✅ Filtr `status: "ACTIVE"` — jen aktivní admini dostávají notifikaci.

---

## 5. Notifications API — rozšíření: PASS ✅

`GET /api/broker/notifications`:
- `take` param, max 50 ✅
- `cursor` pagination ✅
- `unreadOnly` filter ✅

`PATCH /api/broker/notifications`:
- `markAllRead: true` → updateMany ✅
- `ids: [...]` → cílené označení ✅
- Ochrana `userId: session.user.id` u markRead ✅ (brání označení cizích notifikací)

---

## 6. Notifikace inbox stránka: PASS ✅

`/makler/notifications` — server component:
- Auth guard → redirect `/login` ✅
- Initial data fetch (Promise.all: items + unreadCount) ✅
- `take + 1` trick pro detekci dalších stránek ✅
- `createdAt.toISOString()` — serializace Date pro client props ✅
- `loading.tsx` + `error.tsx` přidány ✅

---

## 7. Rules of Hooks fix: PASS ✅

`app/(pwa)/makler/vehicles/new/page.tsx`:

```typescript
export default function NewVehiclePage() {
  const searchParams = useSearchParams();  // jediný hook vždy volaný
  const leadId = searchParams.get("leadId");
  if (leadId) return <LeadPrefillRedirect leadId={leadId} />;
  return <NewVehicleContent />;  // stateful hooks v oddělené komponentě
}

function NewVehicleContent() {
  // useRouter, useDraftContext, useState×3, useCallback, useEffect — vždy voláno
}
```
✅ Správná refaktorizace — `NewVehiclePage` volá vždy přesně 1 hook, `NewVehicleContent` má vlastní hooks bez podmínek.

---

## STOP Check

| Kritérium | Status |
|---|---|
| Žádný Pusher/real-time | ✅ |
| Žádný workflow engine | ✅ |
| Žádné threaded comments | ✅ |
| Žádné přílohy | ✅ |
| Existující 4 typy notifikací (VEHICLE použit) | ✅ |
| NotificationBell logika nezměněna (jen href) | ✅ |

---

## Build

```
✓ Compiled successfully
✓ Generating static pages (1312/1312) in 13.1s
Exit: 0
├ ƒ /makler/notifications  ← nová route viditelná
```

1312 stránek (+1 oproti předchozímu — nová `/makler/notifications`). ✅

---

## Souhrn

| Oblast | Status | Poznámka |
|---|---|---|
| VehicleComment model | PASS ⚠️ | `db push`, bez migrace — viz produkce |
| Comments API (auth, isInternal, notif) | PASS ✅ | |
| Approve API notifikace | PASS ✅ | |
| Status API DRAFT→PENDING notifikace | PASS ✅ | |
| Notifications API (cursor, markAllRead) | PASS ✅ | |
| Notifications inbox stránka | PASS ✅ | |
| Rules of Hooks fix | PASS ✅ | Správná split-component pattern |
| Build | PASS ✅ | 1312/1312 exit 0 |

**⚠️ Produkční poznámka:** `VehicleComment` tabulka neexistuje v `prisma/migrations/`. Před deplojem na produkci nutná migrace (např. `prisma migrate deploy` po ručním SQL nebo reset + nová migrace v dev).

**Celkový výsledek: PASS ✅**
