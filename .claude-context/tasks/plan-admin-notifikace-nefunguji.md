# Plan: Admin — upozornění (notifikace) nefunguje

## Analýza problému

### Co existuje (backend ✅)

1. **Prisma model `Notification`** (schema.prisma:485–500):
   - `id`, `userId`, `type` (COMMISSION/VEHICLE/SYSTEM/MESSAGE), `title`, `body`, `link`, `read`, `createdAt`
   - Indexy na `userId`, `read`, `createdAt`

2. **Prisma model `NotificationPreference`** (schema.prisma:1655–1666):
   - Push, email, SMS per event type
   - Events: NEW_LEAD, NEW_INQUIRY, VEHICLE_APPROVED, etc.

3. **Notification utility** (`lib/notifications.ts`):
   - `createNotification()` — generic
   - `createManagerNotification()` — vehicle approve/return/reject

4. **API endpoint** (`app/api/broker/notifications/route.ts`):
   - `GET` — vrátí posledních 5 notifikací + unreadCount
   - `PATCH` — mark as read
   - Povolené role: BROKER, MANAGER, REGIONAL_DIRECTOR, **ADMIN** ✅

5. **Manager notification preferences** (`app/(admin)/admin/manager/notifications/page.tsx`):
   - Pouze pro MANAGER roli

### Co NEFUNGUJE (frontend ❌)

1. **AdminHeader zvoneček je mrtvý** (`components/admin/AdminHeader.tsx`, řádky 35–54):
   ```tsx
   <button type="button" className="...">
     <svg>...bell icon...</svg>
     <span className="...">red dot</span>  ← STATICKÝ, vždy viditelný
   </button>
   ```
   - Žádný `onClick` handler
   - Žádný `href`/Link
   - Red dot je **hardcoded** (vždy viditelný, nezávisí na datech)
   - Nefetchuje notifikace z API

2. **Chybí notification dropdown/popover** — po kliknutí na zvoneček se nic neděje

3. **Chybí stránka notifikací** — `app/(admin)/admin/notifications/` **NEEXISTUJE**
   (existuje jen `/admin/manager/notifications/` — pouze preferences pro MANAGER)

4. **Chybí real-time** — Pusher je v tech stacku, ale notifikace ho nepoužívají

## Řešení

### Krok 1: Vytvořit NotificationBell komponentu

**Nový soubor:** `components/admin/NotificationBell.tsx`

"use client" komponenta, která:
1. Fetchuje `GET /api/broker/notifications` na mount
2. Zobrazuje počet nepřečtených (červený badge s číslem)
3. Po kliknutí zobrazí dropdown/popover s posledními 5 notifikacemi
4. Klik na notifikaci → mark as read (PATCH) + navigace na `link`
5. "Zobrazit vše" → link na `/admin/notifications`

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/broker/notifications")
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  // Click outside → close
  // Mark as read on click
  // Navigate to link
}
```

### Krok 2: Nahradit statický bell v AdminHeader

**Soubor:** `components/admin/AdminHeader.tsx`, řádky 35–54

Nahradit statický `<button>` za `<NotificationBell />`.

```tsx
// BEFORE:
<button type="button" className="...">
  <svg>...bell...</svg>
  <span>static red dot</span>
</button>

// AFTER:
<NotificationBell />
```

### Krok 3: Vytvořit stránku všech notifikací

**Nové soubory:**
- `app/(admin)/admin/notifications/page.tsx`
- `app/(admin)/admin/notifications/loading.tsx`
- `app/(admin)/admin/notifications/error.tsx`

Stránka zobrazí všechny notifikace (ne jen 5). Potřeba rozšířit API nebo vytvořit nový endpoint.

### Krok 4: Rozšířit API endpoint

**Soubor:** `app/api/broker/notifications/route.ts`

Přidat query parameter `?all=true` pro vrácení všech notifikací (s paginací), ne jen 5.

Alternativně vytvořit nový endpoint `app/api/admin/notifications/route.ts` s paginací.

### Krok 5 (volitelné, fáze 2): Real-time s Pusher

Přidat Pusher subscription do `NotificationBell` pro real-time update bez refreshe.

## Dotčené soubory

| Soubor | Akce |
|--------|------|
| `components/admin/NotificationBell.tsx` | **NOVÝ** — dropdown se zvonečkem |
| `components/admin/AdminHeader.tsx` | **EDIT** — nahradit statický bell za NotificationBell |
| `app/(admin)/admin/notifications/page.tsx` | **NOVÝ** — stránka všech notifikací |
| `app/(admin)/admin/notifications/loading.tsx` | **NOVÝ** — loading state |
| `app/(admin)/admin/notifications/error.tsx` | **NOVÝ** — error boundary |
| `app/api/broker/notifications/route.ts` | **EDIT** — přidat `?all=true` query param + paginaci |

## Acceptance Criteria

- [ ] Zvoneček v header zobrazuje skutečný počet nepřečtených notifikací
- [ ] Klik na zvoneček otevře dropdown s posledními 5 notifikacemi
- [ ] Klik na notifikaci v dropdown → mark as read + navigace
- [ ] Red badge zmizí když nejsou nepřečtené
- [ ] "Zobrazit vše" odkaz vede na stránku se všemi notifikacemi
- [ ] Stránka notifikací zobrazuje všechny notifikace s paginací
- [ ] Click outside dropdown → zavře se

## Složitost

**Střední–Vyšší** — 4 nové soubory, 2 edity. NotificationBell je nejsložitější (dropdown, fetch, mark-as-read, click-outside).

## Poznámky

- API endpoint `app/api/broker/notifications/route.ts` je pojmenovaný "broker" ale ADMIN role má přístup — pro MVP OK, v budoucnu přejmenovat na `app/api/notifications/route.ts`
- Pusher real-time je nice-to-have, ne MVP blocker
