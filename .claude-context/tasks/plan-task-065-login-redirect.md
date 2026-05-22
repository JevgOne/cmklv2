# TASK-065 — Login na homepage + auto-redirect dle role

## Stav po auditu

### Co UZ existuje (a funguje):
- **Login page** `/login` — plne funkcni prihlaseni s role-based redirect switch (radky 60-96)
- **Role-based redirect** v `app/(web)/login/page.tsx` — switch po session fetch
- **Middleware** — chrání admin, makler, parts, marketplace, partner, inzeraty routy
- **Inzerce/Shop/Marketplace navbary** — mají statický "Přihlásit se" link (→ `/login`)

### Co CHYBI:
1. **Main Navbar** (`components/main/Navbar.tsx`) — NEMA žádný login tlačítko ani auth-aware stav
2. **Main MobileMenu** (`components/main/MobileMenu.tsx`) — NEMA login link
3. **Žádný auth-aware UI v navbarech** — všechny navbary jsou statické, nereaují na přihlášení (nezobrazí avatar/jméno/dropdown)
4. **`callbackUrl` se ignoruje** — middleware ho nastaví, ale login page ho nečte (rovnou switch dle role)
5. **Helper `getRedirectByRole()`** — neexistuje, role redirect logika je inline v login page

---

## Plan implementace

### Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `lib/auth-redirect.ts` | **NOVÝ** — helper `getRedirectByRole(role: string): string` (extrahovat z login page) |
| 2 | `components/ui/AuthButton.tsx` | **NOVÝ** — "use client" auth-aware komponenta: nepřihlášen → "Přihlásit se" link; přihlášen → avatar/jméno + dropdown (Můj dashboard, Odhlásit se) |
| 3 | `components/main/Navbar.tsx` | Přidat `<AuthButton />` do desktop CTA sekce (vedle "Chci prodat"/"Chci koupit") |
| 4 | `components/main/MobileMenu.tsx` | Přidat login/auth UI do spodní CTA sekce mobilního menu |
| 5 | `app/(web)/login/page.tsx` | Refaktor: (a) importovat `getRedirectByRole()` místo inline switch; (b) přidat čtení `callbackUrl` z searchParams — callbackUrl má prioritu, pokud existuje |

### Neměnit:
- `middleware.ts` — žádný velký refaktor nutný, middleware je v pořádku
- Ostatní navbary (inzerce/shop/marketplace) — bonus, ne scope TASK-065

---

## Detailní spec

### 1. `lib/auth-redirect.ts`
```ts
export function getRedirectByRole(role: string): string {
  switch (role) {
    case "ADMIN":
    case "BACKOFFICE":
    case "REGIONAL_DIRECTOR":
    case "MANAGER":
      return "/admin/dashboard";
    case "BROKER":
      return "/makler/dashboard";
    case "ADVERTISER":
      return "/moje-inzeraty";
    case "PARTS_SUPPLIER":
    case "WHOLESALE_SUPPLIER":
      return "/parts/my";
    case "INVESTOR":
      return "/marketplace/investor";
    case "VERIFIED_DEALER":
      return "/marketplace/dealer";
    case "PARTNER_BAZAR":
    case "PARTNER_VRAKOVISTE":
      return "/partner/dashboard";
    case "BUYER":
      return "/shop/moje-objednavky";
    default:
      return "/";
  }
}
```

### 2. `components/ui/AuthButton.tsx`
- `"use client"`, importuje `useSession`, `signOut` z next-auth/react
- Nepřihlášen: `<Link href="/login">Přihlásit se</Link>` (outline styl, konzistentní s "Chci prodat")
- Přihlášen: avatar kruh (initials fallback) + dropdown:
  - "Můj dashboard" → `getRedirectByRole(session.user.role)`
  - "Odhlásit se" → `signOut({ callbackUrl: "/" })`
- Dropdown: hover/click toggle, rounded-xl shadow-xl (stejný design pattern jako Služby/O nás dropdown)

### 3. Navbar integrace
- Desktop: `<AuthButton />` mezi CartIcon a "Chci prodat" tlačítko
- Mobile: login link v bottom CTA area; po přihlášení zobrazit jméno + "Můj dashboard" + "Odhlásit se"

### 4. Login page — callbackUrl
- Přečíst `searchParams.get("callbackUrl")` z URL
- Po úspěšném loginu: `if (callbackUrl) router.push(callbackUrl); else router.push(getRedirectByRole(role));`

---

## Akceptační kritéria

1. **AC-1:** Na hlavní homepage (`/`) je v navbaru viditelné tlačítko "Přihlásit se" (desktop i mobile)
2. **AC-2:** Po přihlášení se uživatel automaticky přesměruje na správný dashboard dle role (BROKER→makler/dashboard, ADMIN→admin/dashboard, ADVERTISER→moje-inzeraty, atd.)
3. **AC-3:** Přihlášený uživatel vidí v navbaru své jméno/avatar s dropdownem (Můj dashboard, Odhlásit se)
4. **AC-4:** callbackUrl z middleware redirectu funguje — pokud uživatel přistoupí na chráněnou stránku, po loginu se vrátí zpět
5. **AC-5:** Helper `getRedirectByRole()` je sdílený (login page + AuthButton dropdown) — žádná duplikace role→URL mapování

---

## STOP pravidla

- **STOP-1:** Pokud by middleware.ts potřeboval velký refaktor → eskalovat (aktuálně NENÍ potřeba)
- **STOP-2:** ~~SessionProvider~~ — VYŘEŠENO: `AuthProvider` (SessionProvider) je již v `app/layout.tsx` (root). `useSession()` funguje všude.

---

## Odhad: S (malý task, ~150 řádků nového kódu)
