# Implementace: 4 admin panel fixy

**Datum:** 2026-04-24
**Status:** HOTOVO
**Build:** OK (všechny routes v outputu)

## Implementované fixy

### 1. Role badge overflow v sidebar
- **Soubor:** `components/admin/AdminSidebar.tsx`
- **Změna:** Badge přesunut pod brand name na vlastní řádek (zabaleno do `<div>` s `mt-1`)
- **Výsledek:** Badge nepřetéká u žádné role

### 2. Vozidla — detail + edit + tooltip
- **Nové soubory:**
  - `app/(admin)/admin/vehicles/[id]/page.tsx` — Server Component, detail vozidla (VIN, cena, makléř, fotky, stav)
  - `app/(admin)/admin/vehicles/[id]/loading.tsx` — skeleton
  - `app/(admin)/admin/vehicles/[id]/error.tsx` — error boundary
  - `app/(admin)/admin/vehicles/[id]/edit/page.tsx` — edit formulář (reuse VehicleEditForm)
  - `app/(admin)/admin/vehicles/[id]/edit/loading.tsx` — skeleton
  - `app/(admin)/admin/vehicles/[id]/edit/error.tsx` — error boundary
  - `app/api/admin/vehicles/[id]/route.ts` — GET (detail) + PATCH (update) s Zod validací a changeLog
- **Editované soubory:**
  - `components/admin/VehiclesPageContent.tsx` — přidán tooltip "Vozidla přidávají makléři přes PWA aplikaci"
  - `components/admin/VehicleEditForm.tsx` — přidány optional props `apiUrl` a `redirectUrl` pro reuse v admin kontextu

### 3. Profil uživatele
- **Nové soubory:**
  - `app/(admin)/admin/profile/page.tsx` — Server Component, profil s iniciály + role badge
  - `app/(admin)/admin/profile/loading.tsx` — skeleton
  - `app/(admin)/admin/profile/error.tsx` — error boundary
  - `components/admin/ProfileForm.tsx` — "use client" formulář (firstName, lastName, phone)
  - `app/api/admin/profile/route.ts` — GET + PATCH s Zod validací
- **Editované soubory:**
  - `components/admin/AdminSidebar.tsx` — footer user info → `<Link href="/admin/profile">` (klikatelný)

### 4. Notifikace
- **Nové soubory:**
  - `components/admin/NotificationBell.tsx` — "use client" dropdown (fetch, mark-as-read, click-outside, timeAgo)
  - `app/(admin)/admin/notifications/page.tsx` — Server Component, všechny notifikace (50, mark-all-read)
  - `app/(admin)/admin/notifications/loading.tsx` — skeleton
  - `app/(admin)/admin/notifications/error.tsx` — error boundary
  - `components/admin/NotificationsPageContent.tsx` — "use client" seznam notifikací s mark-all-read
- **Editované soubory:**
  - `components/admin/AdminHeader.tsx` — statický bell nahrazen `<NotificationBell />` komponentou

## Celkový souhrn
- **Nových souborů:** 16
- **Editovaných souborů:** 4 (AdminSidebar, AdminHeader, VehiclesPageContent, VehicleEditForm)
- **Build:** PASS
