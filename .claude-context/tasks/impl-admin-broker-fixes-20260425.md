# Implementace oprav admin panelu — broker detail/edit + notifications

**Datum:** 2026-04-25
**Implementátor:** implementator
**Zdroj:** audit-admin-buttons-links.md + plan-fix-admin-broker-pages.md

---

## Vytvořené soubory (5 nových)

### P0 — Kritické (chybějící stránky)

1. **`app/(admin)/admin/brokers/[id]/page.tsx`** — Detail makléře
   - Server Component s `force-dynamic`
   - Auth: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR
   - Manager filter: MANAGER vidí jen své makléře (managerId)
   - Prisma query: profil, vozidla (20), provize (20), manažer
   - Sekce: profil card, statistiky (4 karty), kontaktní údaje, bio, tabulka vozidel, tabulka provizí
   - Breadcrumb navigace + podmíněné tlačítko Upravit (jen ADMIN/BACKOFFICE) + Zpět

2. **`app/(admin)/admin/brokers/[id]/edit/page.tsx`** — Editace makléře
   - Server Component, fetchuje data z Prisma
   - Auth: **jen ADMIN, BACKOFFICE** (manager nemůže editovat přes admin)
   - Předává data do BrokerEditForm klient komponenty

3. **`components/admin/BrokerEditForm.tsx`** — Formulář editace makléře
   - Client Component
   - Pole: jméno, příjmení, email, telefon, status, IČO, bankovní účet, města, specializace, bio
   - PATCH request na `/api/admin/brokers/[id]`
   - Po úspěchu redirect na detail

4. **`app/api/admin/brokers/[id]/route.ts`** — API endpoint
   - GET: detail jednoho makléře (ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR + manager filter)
   - PATCH: aktualizace údajů makléře (**jen ADMIN, BACKOFFICE** + Zod validace)

### P1 — NotificationBell fix

5. **`app/api/admin/notifications/route.ts`** — Admin notifications API
   - GET: notifikace přihlášeného admin uživatele (top 5)
   - PATCH: označení jako přečtené (Zod validace)
   - Auth: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR

## Upravené soubory (2)

6. **`components/admin/NotificationBell.tsx`** — URL změna
   - `/api/broker/notifications` → `/api/admin/notifications` (řádky 25, 56)

7. **`components/admin/NotificationsPageContent.tsx`** — URL změna
   - `/api/broker/notifications` → `/api/admin/notifications` (řádky 37, 54)

---

## P2 — Neimplementováno (nízká priorita)

- AdminHeader search bar — nefunkční placeholder, UX issue
- ExportButton — placeholder tooltip

---

## STOP kritéria — výsledky

| # | Kritérium | Stav |
|---|-----------|------|
| 1 | Klik na 👁 u makléře → detail stránka (ne 404) | ✅ Stránka existuje |
| 2 | Klik na ✏️ u makléře → edit stránka (ne 404) | ✅ Stránka existuje |
| 3 | Edit uloží a redirectne na detail | ✅ PATCH API + redirect |
| 4 | `npm run build` bez chyb | ⚠️ Pre-existující issue (pages-manifest.json — Next.js 16 + webpack) |
| 5 | Žádné TypeScript errory | ✅ 0 chyb v nových souborech |
| 6 | NotificationBell nevolá `/api/broker/*` | ✅ Přesměrováno na `/api/admin/notifications` |
| 7 | `npm run build` TypeScript compilation | ✅ "Compiled successfully" |
