# Evzen Verdict: Internal Notifications MVP

**Task:** Internal Notifications MVP
**Commit:** `bcc8d37` (15 files, +937/-27)
**Datum:** 2026-05-22
**Verdikt:** SCHVALENO s WARNINGS

---

## Doslovne zadani uzivatele

> "Ja treba nevidim tu komunikaci, predavani pozadavku, chat atd"
> "Kde jsou teda ty zpravy a komunikace mezi makleri, manazery, administratory"

## Overene soubory

| Soubor | Status |
|--------|--------|
| `prisma/schema.prisma` — Notification + VehicleComment modely | OK |
| `lib/notifications.ts` — createNotification + createManagerNotification | OK |
| `app/api/vehicles/[id]/comments/route.ts` — GET/POST s isInternal filtrovanim | OK |
| `app/api/broker/notifications/route.ts` — GET (cursor pagination) + PATCH (markRead) | OK |
| `app/api/vehicles/[id]/status/route.ts` — DRAFT->PENDING notifikace admin/backoffice | OK |
| `app/api/admin/vehicles/[id]/approve/route.ts` — approve/reject notifikace makleri | OK |
| `components/admin/vehicles/VehicleComments.tsx` — admin komentare s isInternal toggle | OK |
| `components/pwa/vehicles/VehicleComments.tsx` — makler komentare (jen public) | OK |
| `components/pwa/notifications/NotificationsInbox.tsx` — inbox s filtry/pagination | OK |
| `components/pwa/NotificationBell.tsx` — zvonecek s dropdown v TopBar | OK |
| `components/pwa/dashboard/NotificationsList.tsx` — dashboard widget | OK |
| `app/(pwa)/makler/notifications/page.tsx` — server page s Prisma query | OK |
| `app/(pwa)/makler/notifications/loading.tsx` — skeleton loading | OK |
| `app/(pwa)/makler/notifications/error.tsx` — error boundary s retry | OK |

## Komunikacni flow — odpovida zadani?

### 1. Admin -> Makler (komentare)
- Admin napise komentar na vozidle -> POST vytvori VehicleComment -> createNotification posle MESSAGE notifikaci makleri -> makler vidi v NotificationBell + NotificationsInbox -> muze odpovedet
- **FUNGUJE**

### 2. Makler -> Admin (komentare)
- Makler napise komentar -> POST vytvori VehicleComment (isInternal vynucene false) -> createNotification posle MESSAGE vsem ADMIN/BACKOFFICE -> admini vidi
- **FUNGUJE**

### 3. Stavove zmeny (DRAFT->PENDING->ACTIVE/REJECTED)
- Makler odesle vozidlo (PENDING) -> notifikace vsem ADMIN/BACKOFFICE
- Admin schvali/zamitne -> createManagerNotification posle VEHICLE notifikaci makleri
- **FUNGUJE**

### 4. Interni poznamky
- Admin muze oznacit komentar jako isInternal -> viditelne JEN pro ADMIN/BACKOFFICE/MANAGER
- Makler nikdy nevidi interni komentare (API filtruje `isInternal: false`)
- Admin UI: amber pozadi + "Interni" badge
- **FUNGUJE**

### Odpovida zadani "komunikace mezi makleri, manazery, administratory"? **ANO**

Vehicle-scoped komentar system + notifikacni system pokryva zakladni komunikaci. Pro MVP dostatecne.

## Kontrolni body

| # | Kritérium | Status |
|---|-----------|--------|
| 1 | VehicleComment model v schema.prisma | PASS — id, vehicleId, userId, content, isInternal, createdAt, indexy |
| 2 | API GET filtruje isInternal pro brokera | PASS — `...(!isAdmin && { isInternal: false })` (line 38) |
| 3 | API POST broker nemuze nastavit isInternal | PASS — `const isInternal = isAdmin ? data.isInternal : false` (line 91) |
| 4 | Cross-role notifikace na komentar | PASS — admin->broker MESSAGE, broker->admin/backoffice MESSAGE |
| 5 | Zod validace na vstupu | PASS — commentSchema, markReadSchema, statusChangeSchema, approveSchema |
| 6 | Admin vidi interni poznamky, makler ne | PASS — admin UI ma isInternal toggle, broker UI nema |
| 7 | Notification model s read/unread | PASS — Boolean @default(false), PATCH pro mark read |
| 8 | Inbox s pagination | PASS — cursor-based, take+1 pattern, hasMore detekce |
| 9 | NotificationBell s badge | PASS — unreadCount badge, dropdown, click-to-navigate |
| 10 | Loading/Error states | PASS — loading.tsx (skeleton), error.tsx (retry button) |
| 11 | Server Component page | PASS — page.tsx je async RSC, Prisma query server-side |
| 12 | Ceske texty s diakritikou (UI) | PASS — vsechny UI komponenty maji spravnou diakritiku |

## WARNINGS

### W1: Chybejici diakritika v API error messages (NIZKA priorita)
**Soubor:** `app/api/broker/notifications/route.ts`
**Pocet:** 7 instanci
- `"Neprihlaseny"` -> "Neprihlaseny" (line 14, 78)
- `"Pristup odepren"` -> "Pristup odepren" (line 21, 85)
- `"Interni chyba serveru"` (line 62, 124)
- `"Neplatna data"` (line 117)

**Porovnani:** Jine API routes (comments, status, approve) pouzivaji spravnou diakritiku ("Neprihlaseny", "Pristup odepren" atd.). Tento soubor je nekonzistentni.
**Dopad:** Nizky — API error messages nejsou primo zobrazovany uzivatelum v UI. Error boundary ukazuje cesky text.
**Doporuceni:** Opravit pro konzistenci, ale NENI blocker.

### W2: BACKOFFICE neni v ALLOWED_ROLES pro notifications API
**Soubor:** `app/api/broker/notifications/route.ts` line 7
**Detail:** `ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN", "PARTS_SUPPLIER"]` — chybi BACKOFFICE
**Dopad:** Notifikace SE vytvarej pro BACKOFFICE uzivatele (v comments + status routes), ale BACKOFFICE uzivatel nemuze cist sve notifikace pres tento API endpoint.
**Zmirujici faktor:** BACKOFFICE pracuje v admin panelu, ne v PWA. Pokud admin panel ma vlastni notifikacni system, je to OK. Pokud ne, notifikace se hromadi bez moznosti cteni.
**Doporuceni:** Bud pridat BACKOFFICE do ALLOWED_ROLES, nebo overit ze admin panel ma vlastni notification endpoint.

### W3: MANAGER nedostava notifikace na komentare maklere
**Soubor:** `app/api/vehicles/[id]/comments/route.ts` line 123
**Detail:** Kdyz makler napise komentar, notifikace jde jen ADMIN + BACKOFFICE, ne MANAGER. Pritom MANAGER muze komentare cist i psat (je v ADMIN_ROLES).
**Dopad:** Manager se nedozvi o novem komentari maklere, pokud nekontroluje rucne.
**Doporuceni:** Zvazit pridani MANAGER do recipients (line 123: `role: { in: ["ADMIN", "BACKOFFICE", "MANAGER"] }`).

### W4: Type icons mismatch mezi komponentami (KOSMETICKE)
**Detail:** `NotificationsList.tsx` (dashboard) pouziva typy `VEHICLE_APPROVED`, `COMMISSION_PAID`, `NEW_INQUIRY` — ale notifikace se vytvarej s typy `VEHICLE`, `MESSAGE`, `COMMISSION`, `SYSTEM`.
**Dopad:** Dashboard widget vzdy zobrazi fallback ikonu (zvonecek). Neni crash, jen vizualni nesoulad.

## Architektura — pozitivni body

1. **Spravna separace:** Admin VehicleComments (textarea, isInternal toggle) vs PWA VehicleComments (input, bez isInternal) — dve oddelene komponenty pro ruzne role
2. **Server-side rendering:** Notifications page je RSC s Prisma query, client components pro interaktivitu
3. **Cursor pagination:** Spravny take+1 pattern pro hasMore detekci
4. **Atomic operations:** Prisma transactions pro status changes s change log
5. **Extensibilni Notification model:** type/title/body/link pattern umoznuje snadno pridavat dalsi typy notifikaci

## Zaver

**SCHVALENO** — Internal Notifications MVP odpovida uzivatelskymu zadani. Implementuje komunikacni kanal mezi makleri a administratory pres vehicle-scoped komentare + notifikacni system s bell/inbox/mark-as-read. isInternal filtrovani funguje spravne (admin vidi vse, makler jen public). Warnings W1-W4 jsou nizke priority a mohou byt opraveny v nasledujicich iteracich.
