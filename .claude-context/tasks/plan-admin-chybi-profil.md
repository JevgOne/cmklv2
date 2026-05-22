# Plan: Admin — chybí profil uživatele

## Analýza problému

### Co existuje

1. **Sidebar footer** (`components/admin/AdminSidebar.tsx`, řádky 186–196) — zobrazuje:
   - Iniciály uživatele (barevný kruh)
   - Jméno uživatele
   - Roli (Administrátor, BackOffice, Manažer, Regionální ředitel)
   - Tlačítko "Odhlásit"

2. **Session data** — NextAuth session obsahuje:
   - `user.firstName`, `user.lastName`
   - `user.role`
   - `user.id`
   - `user.email` (standard NextAuth)

### Co CHYBÍ

1. **Stránka profilu** — `app/(admin)/admin/profile/` **NEEXISTUJE**
2. **Link na profil v sidebar** — žádný odkaz
3. **API endpoint** pro update profilu admina — neexistuje
4. **Settings/nastavení stránka** — neexistuje

### Prisma User model (relevantní pole)

Potřebuji zkontrolovat jaká pole User model má pro profilovou stránku.

## Řešení

### Krok 1: Prozkoumat User model

Zjistit jaká pole User model obsahuje, aby profil mohl zobrazit a editovat relevantní údaje.

### Krok 2: Vytvořit API endpoint

**Nový soubor:** `app/api/admin/profile/route.ts`

```
GET  — vrátí profil přihlášeného admina
PATCH — aktualizuje profil (firstName, lastName, phone, avatar)
```

### Krok 3: Vytvořit stránku profilu

**Nové soubory:**
- `app/(admin)/admin/profile/page.tsx` — Server Component, fetch session + user data
- `app/(admin)/admin/profile/loading.tsx` — loading skeleton
- `app/(admin)/admin/profile/error.tsx` — error boundary

**Obsah stránky profilu:**
- Jméno a příjmení (editovatelné)
- Email (read-only — login credential)
- Telefon (editovatelné)
- Role (read-only — badge)
- Avatar/profilový obrázek (upload přes Cloudinary)
- Tlačítko "Uložit změny"
- Sekce "Změna hesla" (volitelně ve fázi 2)

### Krok 4: Vytvořit ProfileForm komponentu

**Nový soubor:** `components/admin/ProfileForm.tsx`

"use client" komponenta s React Hook Form + Zod validací.

```tsx
// Pole:
// - firstName (required, min 2)
// - lastName (required, min 2)  
// - phone (optional, phone format)
// - avatar upload (optional, Cloudinary)
```

### Krok 5: Přidat link na profil do sidebaru

**Soubor:** `components/admin/AdminSidebar.tsx`

Ve footer sekci (řádky 186–196) udělat user info klikatelné — link na `/admin/profile`.

```tsx
// BEFORE: <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
// AFTER:  <Link href="/admin/profile" className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
```

## Dotčené soubory

| Soubor | Akce |
|--------|------|
| `app/(admin)/admin/profile/page.tsx` | **NOVÝ** — profilová stránka |
| `app/(admin)/admin/profile/loading.tsx` | **NOVÝ** — loading state |
| `app/(admin)/admin/profile/error.tsx` | **NOVÝ** — error boundary |
| `components/admin/ProfileForm.tsx` | **NOVÝ** — formulář profilu |
| `app/api/admin/profile/route.ts` | **NOVÝ** — GET + PATCH API |
| `components/admin/AdminSidebar.tsx` | **EDIT** — user info → klikatelný link na /admin/profile |

## Acceptance Criteria

- [ ] Admin může kliknout na svůj profil v sidebar footer
- [ ] Profilová stránka zobrazí aktuální údaje (jméno, email, telefon, role)
- [ ] Admin může editovat jméno, příjmení a telefon
- [ ] Po uložení se údaje aktualizují i v sidebar footer
- [ ] Email a role jsou read-only
- [ ] Validace formuláře (Zod + React Hook Form)

## Složitost

**Střední** — 5 nových souborů, 1 edit. Standardní CRUD pattern.

## Prerekvizity

Zkontrolovat User model v Prisma schema pro dostupná pole (phone, avatar, etc.).
