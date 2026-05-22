# Bug report: "Nejde kliknout na notifikace"

**Datum:** 2026-04-25
**Autor:** Plánovač
**Priorita:** VYSOKÁ
**Typ:** Bug fix

---

## Shrnutí

Nalezeny **3 samostatné bugy** v notifikačním systému. Admin verze (`NotificationBell`, `NotificationsPageContent`) funguje správně — má onClick handlery, router.push na `notification.link`, mark-as-read. Problémy jsou v **PWA makléř** a **PWA dodavatel dílů**.

---

## BUG 1 (KRITICKÝ): NotificationsList — žádný onClick handler

**Soubor:** `components/pwa/dashboard/NotificationsList.tsx`
**Kde se zobrazuje:** PWA makléř dashboard (`app/(pwa)/makler/dashboard/page.tsx`, řádek 195)

**Problém:** Notifikace na dashboardu makléře jsou vykresleny jako **statické, neklikatelné karty**. Komponenta:
- Nemá `onClick` handler ❌
- Nemá import `useRouter` ani `Link` ❌
- Interface `Notification` nemá pole `link` ❌ (API ho přitom vrací)
- Nemá funkci pro mark-as-read ❌
- Používá `<Card>` bez jakékoliv interakce

**Srovnání s funkční verzí:**
Admin verze (`NotificationsPageContent.tsx`) má:
- `handleClick()` s mark-as-read PATCH + `router.push(n.link)` ✅
- `<button>` elementy s `cursor-pointer` ✅
- Vizuální odlišení přečtených/nepřečtených ✅

**Fix:** Přepsat `NotificationsList.tsx` — přidat:
1. `"use client"` directive
2. `link` do interface
3. `onClick` handler s mark-as-read (PATCH `/api/broker/notifications`)
4. `router.push(notification.link)` pro navigaci
5. `cursor-pointer` + hover efekt na karty

```tsx
// Klíčové změny:
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;  // ← PŘIDAT
  read: boolean;
  createdAt: string;
}

// V renderování:
<button
  key={notification.id}
  type="button"
  onClick={() => handleClick(notification)}
  className="w-full text-left cursor-pointer hover:bg-gray-50 transition-colors ..."
>

// Handler:
const handleClick = async (n: Notification) => {
  if (!n.read) {
    await fetch("/api/broker/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [n.id] }),
    });
    // update local state
  }
  if (n.link) router.push(n.link);
};
```

**Rozsah:** ~30 řádků změn v 1 souboru + update props v `dashboard/page.tsx` (přidat `link` do mapování)

---

## BUG 2 (STŘEDNÍ): PWA TopBar zvonek — naviguje na nastavení místo notifikací

**Soubor:** `components/pwa/TopBar.tsx`, řádek 77
**Kde se zobrazuje:** Horní lišta PWA makléře (všechny stránky)

**Problém:** Klik na ikonu zvonku naviguje na `/makler/settings/notifications` — to je stránka s **nastavením preferencí** (push/email/SMS přepínače), NE seznam notifikací.

```tsx
// Řádek 77 — AKTUÁLNÍ:
<Link href="/makler/settings/notifications" ...>

// Uživatel klikne na zvonek → vidí přepínače push/email/SMS
// Očekává → seznam notifikací
```

**Fix — varianta A (rychlá):** Změnit cíl na dashboard (kde jsou notifikace):
```tsx
<Link href="/makler/dashboard#notifications" ...>
```

**Fix — varianta B (lepší):** Přidat `NotificationBell` dropdown jako v admin verzi. PWA TopBar by měl mít stejný dropdown pattern jako `AdminHeader` → `NotificationBell`.

```tsx
// Nahradit <Link> za <NotificationBell /> komponentu
// (sdílenou nebo novou PWA variantu)
```

**Doporučení:** Varianta B — použít/adaptovat existující `NotificationBell.tsx` z admin verze. Komponenta je self-contained, fetchuje data sama, má dropdown + mark-as-read. Stačí:
1. Přesunout z `components/admin/` do `components/ui/` (sdílená)
2. Nebo vytvořit PWA variantu `components/pwa/NotificationBell.tsx`
3. Import do `TopBar.tsx` místo `<Link>`

**Rozsah:** 1 nový soubor (~170 řádků, kopie admin verze) + 5 řádků v TopBar.tsx

---

## BUG 3 (STŘEDNÍ): SupplierTopBar zvonek — kompletně nefunkční

**Soubor:** `components/pwa-parts/SupplierTopBar.tsx`, řádky 60-78
**Kde se zobrazuje:** Horní lišta PWA dodavatele dílů

**Problém:** Notifikační zvonek je `<button>` **bez onClick handleru**. Kliknutí nedělá vůbec nic. Navíc badge count "2" je **hardcoded** — nezobrazuje skutečný počet nepřečtených notifikací.

```tsx
// Řádek 60 — AKTUÁLNÍ:
<button className="..." aria-label="Notifikace">
  {/* SVG icon */}
  <span className="...">2</span>  // ← HARDCODED "2"
</button>
// Žádný onClick ❌
// Žádný fetch notifikací ❌
```

**Fix:** Nahradit za funkční `NotificationBell` komponentu (stejná jako pro PWA makléře z Bugu 2). Poznámka: API `/api/broker/notifications` povoluje role `BROKER, MANAGER, REGIONAL_DIRECTOR, ADMIN` — **nepokrývá `PARTS_SUPPLIER`**. Buď:
- A) Přidat `PARTS_SUPPLIER` do `ALLOWED_ROLES` v `app/api/broker/notifications/route.ts`
- B) Vytvořit separátní API `/api/parts/notifications/route.ts`

**Doporučení:** Varianta A (přidat roli do existujícího API) — notifikační model je sdílený, není důvod mít 2 endpointy.

**Rozsah:** 1 řádek v API (přidat roli) + ~10 řádků v SupplierTopBar.tsx (nahradit button za komponentu)

---

## BUG 4 (NÍZKÝ): Chybí dedicovaná stránka s notifikacemi pro PWA

**Problém:** Admin má `/admin/notifications` s `NotificationsPageContent` (full-page seznam). PWA makléř a dodavatel nemají ekvivalent — notifikace jsou jen na dashboardu jako malá sekce.

**Fix (volitelný):** Vytvořit `app/(pwa)/makler/notifications/page.tsx` s importem `NotificationsPageContent` (nebo PWA varianty). "Zobrazit vše" z dropdownu by pak navigoval sem.

---

## Přehled fixů

| # | Bug | Priorita | Soubor(y) | Rozsah |
|---|-----|----------|-----------|--------|
| 1 | NotificationsList bez onClick | KRITICKÝ | `components/pwa/dashboard/NotificationsList.tsx`, `app/(pwa)/makler/dashboard/page.tsx` | ~30 řádků |
| 2 | TopBar zvonek → nastavení místo notifikací | STŘEDNÍ | `components/pwa/TopBar.tsx` + nový `NotificationBell` | ~175 řádků |
| 3 | SupplierTopBar zvonek nefunkční | STŘEDNÍ | `components/pwa-parts/SupplierTopBar.tsx`, `app/api/broker/notifications/route.ts` | ~15 řádků |
| 4 | Chybí PWA notifications page | NÍZKÝ | Nový soubor | ~40 řádků |

## Pořadí implementace

1. **BUG 1** — nejrychlejší fix, řeší hlavní uživatelský problém
2. **BUG 2 + BUG 3** — souvisejí (sdílená NotificationBell komponenta)
3. **BUG 4** — volitelné vylepšení

## Soubory k editaci

| # | Soubor | Akce |
|---|--------|------|
| 1 | `components/pwa/dashboard/NotificationsList.tsx` | EDIT — přidat onClick, link, mark-as-read |
| 2 | `app/(pwa)/makler/dashboard/page.tsx` | EDIT — přidat `link` do notification mapping (řádek 196) |
| 3 | `components/pwa/NotificationBell.tsx` | NOVÝ — PWA verze admin NotificationBell |
| 4 | `components/pwa/TopBar.tsx` | EDIT — nahradit Link za NotificationBell |
| 5 | `components/pwa-parts/SupplierTopBar.tsx` | EDIT — nahradit statický button za NotificationBell |
| 6 | `app/api/broker/notifications/route.ts` | EDIT — přidat PARTS_SUPPLIER do ALLOWED_ROLES |
| 7 | `app/(pwa)/makler/notifications/page.tsx` | NOVÝ (volitelné) — full-page seznam |
