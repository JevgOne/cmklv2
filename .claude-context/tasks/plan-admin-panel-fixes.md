# Souhrnný plán: Admin Panel — 4 UX/funkční opravy

## Přehled

| # | Problém | Root cause | Složitost | Priorita |
|---|---------|-----------|-----------|----------|
| 1 | Role badge "ADMINISTRÁTOR" přetéká sidebar | Badge + logo + brand na 1 řádku > 232px | Triviální | P1 |
| 2 | Nelze přidat/zobrazit/editovat auto | Tlačítko disabled, detail+edit stránky neexistují | Střední | P1 |
| 3 | Chybí profil uživatele | Stránka, API i link v sidebar neexistují | Střední | P2 |
| 4 | Notifikace nefungují | Zvoneček mrtvý (no onClick), frontend chybí, backend OK | Střední–Vyšší | P2 |

**Doporučené pořadí implementace:** 1 → 2 → 3 → 4 (od nejjednoduššího, #1 a #2 editují stejný sidebar soubor)

---

## Fix #1: Role badge overflow v sidebar header

**Problém:** `components/admin/AdminSidebar.tsx`, řádky 137–148

Logo (36px) + gap + "CarMakléř" (~120px) + gap + badge "ADMINISTRÁTOR" (~95px) = ~283px. Sidebar je 280px, padding 2×24px → jen 232px dostupných. Badge přetéká. U "REGIONÁLNÍ ŘEDITEL" (18 znaků) ještě horší.

**Řešení:** Přesunout badge na nový řádek pod brand name.

**Soubor:** `components/admin/AdminSidebar.tsx`

Nahradit řádky 137–148:
```tsx
{/* BEFORE — vše na jednom řádku */}
<div className="p-6 border-b border-white/[0.08]">
  <div className="flex items-center gap-3">
    <Image ... />
    <span className="text-xl font-extrabold tracking-tight">
      <span className="text-orange-400">Car</span>
      <span className="text-white">Makléř</span>
    </span>
    <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full ml-2">
      {roleLabel.toUpperCase()}
    </span>
  </div>
</div>

{/* AFTER — badge na novém řádku */}
<div className="p-6 border-b border-white/[0.08]">
  <div className="flex items-center gap-3">
    <Image src="/brand/logo-symbol-white.png" alt="" width={40} height={40} className="h-9 w-auto" priority />
    <div>
      <span className="text-xl font-extrabold tracking-tight">
        <span className="text-orange-400">Car</span>
        <span className="text-white">Makléř</span>
      </span>
      <div className="mt-1">
        <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
          {roleLabel.toUpperCase()}
        </span>
      </div>
    </div>
  </div>
</div>
```

**Dotčené soubory:** 1 edit
| Soubor | Akce |
|--------|------|
| `components/admin/AdminSidebar.tsx` | EDIT řádky 137–148 |

**AC:**
- [ ] Badge nepřetéká u žádné role (ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR)
- [ ] Logo + brand name zůstávají na jednom řádku
- [ ] Mobilní sidebar funguje stejně

---

## Fix #2: Admin — nelze přidat/zobrazit/editovat auto

**Problém:** 3 věci jsou rozbité:

1. **Tlačítko "Přidat vozidlo"** — `components/admin/VehiclesPageContent.tsx:192` je `disabled`, nemá onClick/href
2. **Detail vozidla** — `app/(admin)/admin/vehicles/[id]/` NEEXISTUJE, ale tabulka na něj linkuje (👁 tlačítko)
3. **Edit vozidla** — `app/(admin)/admin/vehicles/[id]/edit/` NEEXISTUJE, ale tabulka na něj linkuje (✏️ tlačítko)

**Existující kód k využití:**
- `components/admin/VehicleEditForm.tsx` — existuje, používá se v `/admin/manager/vehicles/[id]/edit/`
- `app/api/admin/vehicles/route.ts` — jen GET (seznam), POST chybí
- `app/api/admin/vehicles/[id]/approve/route.ts` — schvalování existuje

**Řešení (MVP):**

### Krok 2.1: API endpoint pro detail + update vozidla

**Nový soubor:** `app/api/admin/vehicles/[id]/route.ts`

```typescript
// GET  — vrátí detail vozidla (vehicle + images + broker)
// PATCH — aktualizuje vozidlo (brand, model, price, description, etc.)
// Auth: ADMIN, BACKOFFICE, MANAGER
```

### Krok 2.2: Admin vehicle detail page

**Nový soubor:** `app/(admin)/admin/vehicles/[id]/page.tsx`

Server Component — fetch vehicle via Prisma, zobrazit:
- Header: brand + model, VIN, status badge
- Galerie fotek
- Detaily: cena, rok, km, palivo, převodovka, karoserie
- Makléř info (kdo nahrál)
- Trust score
- Akce: Schválit/Zamítnout (pro PENDING), Editovat, Zpět

### Krok 2.3: Admin vehicle edit page

**Nový soubor:** `app/(admin)/admin/vehicles/[id]/edit/page.tsx`

Použít existující `VehicleEditForm` — stejný pattern jako `app/(admin)/admin/manager/vehicles/[id]/edit/page.tsx`:
```tsx
import { VehicleEditForm } from "@/components/admin/VehicleEditForm";
// Fetch vehicle data, pass as props
```

### Krok 2.4: Opravit tlačítko "Přidat vozidlo"

**Soubor:** `components/admin/VehiclesPageContent.tsx`, řádek 192

Pro MVP ponechat disabled + přidat tooltip:
```tsx
<Button variant="primary" size="sm" disabled title="Vozidla přidávají makléři přes mobilní aplikaci">
  Přidat vozidlo
</Button>
```

**⚠️ STOP-1 Eskalace:** Má admin mít možnost PŘIDÁVAT nová vozidla? Pokud ano → fáze 2 (nový wizard, POST API endpoint). Pro MVP stačí detail + edit.

**Dotčené soubory:** 7 nových, 1 edit
| Soubor | Akce |
|--------|------|
| `app/api/admin/vehicles/[id]/route.ts` | **NOVÝ** — GET detail + PATCH update |
| `app/(admin)/admin/vehicles/[id]/page.tsx` | **NOVÝ** — detail vozidla |
| `app/(admin)/admin/vehicles/[id]/loading.tsx` | **NOVÝ** — loading skeleton |
| `app/(admin)/admin/vehicles/[id]/error.tsx` | **NOVÝ** — error boundary |
| `app/(admin)/admin/vehicles/[id]/edit/page.tsx` | **NOVÝ** — edit (reuse VehicleEditForm) |
| `app/(admin)/admin/vehicles/[id]/edit/loading.tsx` | **NOVÝ** — loading skeleton |
| `app/(admin)/admin/vehicles/[id]/edit/error.tsx` | **NOVÝ** — error boundary |
| `components/admin/VehiclesPageContent.tsx` | **EDIT** — tooltip na disabled tlačítko |

**AC:**
- [ ] Admin vidí detail vozidla po kliknutí na 👁 v tabulce
- [ ] Admin může editovat vozidlo po kliknutí na ✏️
- [ ] "Přidat vozidlo" má tooltip vysvětlující flow
- [ ] GET /api/admin/vehicles/[id] vrací kompletní data vozidla
- [ ] PATCH /api/admin/vehicles/[id] umožňuje update

---

## Fix #3: Admin — chybí profil uživatele

**Problém:** Žádná profilová stránka neexistuje. Sidebar footer zobrazuje jméno + roli, ale není klikatelný. Admin nemá jak upravit svoje údaje.

**User model (prisma/schema.prisma:13–53) — relevantní editovatelná pole:**
- `firstName` (String, required)
- `lastName` (String, required)
- `phone` (String?, optional)
- `avatar` (String?, optional — Cloudinary URL)

**Read-only pole:**
- `email` (login credential)
- `role`
- `status`

**Řešení:**

### Krok 3.1: API endpoint pro profil

**Nový soubor:** `app/api/admin/profile/route.ts`

```typescript
// GET  — vrátí profil přihlášeného uživatele (firstName, lastName, email, phone, avatar, role)
// PATCH — aktualizuje firstName, lastName, phone
// Auth: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR (všichni admin users)
// Validace: Zod schema { firstName: min(2), lastName: min(2), phone: optional regex }
```

### Krok 3.2: ProfileForm komponenta

**Nový soubor:** `components/admin/ProfileForm.tsx`

"use client" — React Hook Form + Zod:
- Jméno (required, min 2)
- Příjmení (required, min 2)
- Telefon (optional, phone format)
- Email (read-only, zobrazený jako disabled input)
- Role (read-only, badge)
- Avatar (fáze 2 — Cloudinary upload)
- Tlačítko "Uložit změny"
- Success/error toast po uložení

### Krok 3.3: Stránka profilu

**Nové soubory:**
- `app/(admin)/admin/profile/page.tsx` — Server Component, fetch user data z Prisma
- `app/(admin)/admin/profile/loading.tsx` — skeleton
- `app/(admin)/admin/profile/error.tsx` — error boundary

### Krok 3.4: Link na profil v sidebar

**Soubor:** `components/admin/AdminSidebar.tsx`, řádky 186–196

Zabalit user info do `<Link href="/admin/profile">`:
```tsx
// BEFORE:
<div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">

// AFTER:
<Link href="/admin/profile" className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors no-underline">
```

**Dotčené soubory:** 5 nových, 1 edit
| Soubor | Akce |
|--------|------|
| `app/api/admin/profile/route.ts` | **NOVÝ** — GET + PATCH |
| `components/admin/ProfileForm.tsx` | **NOVÝ** — formulář profilu |
| `app/(admin)/admin/profile/page.tsx` | **NOVÝ** — profilová stránka |
| `app/(admin)/admin/profile/loading.tsx` | **NOVÝ** — skeleton |
| `app/(admin)/admin/profile/error.tsx` | **NOVÝ** — error boundary |
| `components/admin/AdminSidebar.tsx` | **EDIT** — user info → klikatelný Link |

**AC:**
- [ ] Admin může kliknout na svůj profil v sidebar footer
- [ ] Profilová stránka zobrazí aktuální údaje
- [ ] Admin může editovat jméno, příjmení a telefon
- [ ] Email a role jsou read-only
- [ ] Po uložení se údaje aktualizují (sidebar footer se refreshne)
- [ ] Validace formuláře funguje (Zod)

---

## Fix #4: Admin — notifikace nefungují

**Problém:** Backend je kompletní (Prisma model, lib/notifications.ts, API endpoint). Frontend je mrtvý:
- Zvoneček v AdminHeader je statický `<button>` bez onClick
- Red dot je hardcoded (vždy svítí)
- Žádný dropdown, žádná stránka notifikací

**Existující backend:**
- `Notification` model (schema.prisma:485) — type, title, body, link, read
- `lib/notifications.ts` — createNotification(), createManagerNotification()
- `app/api/broker/notifications/route.ts` — GET (5 posledních + unreadCount), PATCH (mark as read). ADMIN role povolena.

**Řešení:**

### Krok 4.1: NotificationBell komponenta

**Nový soubor:** `components/admin/NotificationBell.tsx`

"use client" — klíčová komponenta:
```
Chování:
1. Na mount → fetch GET /api/broker/notifications
2. Zobrazit bell icon + červený badge s počtem nepřečtených (nebo skrytý když 0)
3. Klik → toggle dropdown popover
4. Dropdown: seznam 5 notifikací (title, body, čas, read/unread stav)
5. Klik na notifikaci → PATCH mark as read + navigace na link
6. "Zobrazit vše" → Link na /admin/notifications
7. Click outside → zavřít dropdown
8. Polling každých 60s pro nové notifikace (nebo Pusher ve fázi 2)
```

**Design:**
- Badge: červený kruh s číslem (nahradí statický red dot)
- Dropdown: bílý card, shadow-lg, max-h-[400px] overflow-y-auto
- Nepřečtené: bg-orange-50 zvýraznění
- Přečtené: bg-white
- Ikony podle type: COMMISSION 💰, VEHICLE 🚗, SYSTEM ⚙️, MESSAGE 💬

### Krok 4.2: Nahradit bell v AdminHeader

**Soubor:** `components/admin/AdminHeader.tsx`, řádky 35–54

Nahradit celý statický `<button>` za `<NotificationBell />`. Přidat import.

### Krok 4.3: Stránka všech notifikací

**Nové soubory:**
- `app/(admin)/admin/notifications/page.tsx` — Server Component, fetch ALL notifikace z Prisma
- `app/(admin)/admin/notifications/loading.tsx` — skeleton
- `app/(admin)/admin/notifications/error.tsx` — error boundary

Stránka: seznam všech notifikací s paginací, tlačítko "Označit vše jako přečtené".

### Krok 4.4: Rozšířit API endpoint o paginaci

**Soubor:** `app/api/broker/notifications/route.ts`

Přidat query params:
- `?limit=50` (default 5 pro bell dropdown, 50 pro stránku)
- `?offset=0` pro paginaci
- `?markAllRead=true` pro PATCH na hromadné označení

**Dotčené soubory:** 4 nové, 2 edity
| Soubor | Akce |
|--------|------|
| `components/admin/NotificationBell.tsx` | **NOVÝ** — dropdown + bell |
| `app/(admin)/admin/notifications/page.tsx` | **NOVÝ** — stránka notifikací |
| `app/(admin)/admin/notifications/loading.tsx` | **NOVÝ** — skeleton |
| `app/(admin)/admin/notifications/error.tsx` | **NOVÝ** — error boundary |
| `components/admin/AdminHeader.tsx` | **EDIT** — nahradit statický bell |
| `app/api/broker/notifications/route.ts` | **EDIT** — přidat limit/offset/markAllRead |

**AC:**
- [ ] Zvoneček zobrazuje skutečný počet nepřečtených
- [ ] Klik na zvoneček otevře dropdown s 5 posledními notifikacemi
- [ ] Klik na notifikaci → mark as read + navigace
- [ ] Badge zmizí když 0 nepřečtených
- [ ] "Zobrazit vše" → stránka s paginovaným seznamem
- [ ] Click outside dropdown → zavře se
- [ ] "Označit vše jako přečtené" na stránce funguje

---

## Souhrnná tabulka dotčených souborů

| Soubor | Fix # | Akce |
|--------|-------|------|
| `components/admin/AdminSidebar.tsx` | 1, 3 | EDIT — badge layout + profil link |
| `components/admin/VehiclesPageContent.tsx` | 2 | EDIT — tooltip |
| `components/admin/AdminHeader.tsx` | 4 | EDIT — NotificationBell |
| `app/api/broker/notifications/route.ts` | 4 | EDIT — paginace |
| `app/api/admin/vehicles/[id]/route.ts` | 2 | NOVÝ |
| `app/(admin)/admin/vehicles/[id]/page.tsx` | 2 | NOVÝ |
| `app/(admin)/admin/vehicles/[id]/loading.tsx` | 2 | NOVÝ |
| `app/(admin)/admin/vehicles/[id]/error.tsx` | 2 | NOVÝ |
| `app/(admin)/admin/vehicles/[id]/edit/page.tsx` | 2 | NOVÝ |
| `app/(admin)/admin/vehicles/[id]/edit/loading.tsx` | 2 | NOVÝ |
| `app/(admin)/admin/vehicles/[id]/edit/error.tsx` | 2 | NOVÝ |
| `app/api/admin/profile/route.ts` | 3 | NOVÝ |
| `components/admin/ProfileForm.tsx` | 3 | NOVÝ |
| `app/(admin)/admin/profile/page.tsx` | 3 | NOVÝ |
| `app/(admin)/admin/profile/loading.tsx` | 3 | NOVÝ |
| `app/(admin)/admin/profile/error.tsx` | 3 | NOVÝ |
| `components/admin/NotificationBell.tsx` | 4 | NOVÝ |
| `app/(admin)/admin/notifications/page.tsx` | 4 | NOVÝ |
| `app/(admin)/admin/notifications/loading.tsx` | 4 | NOVÝ |
| `app/(admin)/admin/notifications/error.tsx` | 4 | NOVÝ |

**Celkem: 16 nových souborů, 4 edity**

## Závislosti mezi fixy

```
Fix #1 (badge overflow) ─── nezávislý, ale edituje AdminSidebar.tsx
                                │
Fix #3 (profil)        ─── také edituje AdminSidebar.tsx (footer → Link)
                                │
Fix #2 (vozidla)       ─── nezávislý
                                │
Fix #4 (notifikace)    ─── nezávislý
```

**Pozor:** Fix #1 a #3 oba editují `AdminSidebar.tsx` — implementovat sekvenčně, ne paralelně.

## ⚠️ Eskalace

**Task #2:** Potřeba clarifikace — má admin mít možnost PŘIDÁVAT nová vozidla (POST), nebo jen prohlížet a editovat existující? Plán pokrývá jen detail + edit (MVP). Přidávání = fáze 2.
