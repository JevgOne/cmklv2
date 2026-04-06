# Impl #65a — Fix PartnerDetail aktivační tlačítko (Varianta STD)

**Task ID:** #69
**Plán:** `.claude-context/tasks/plan-task-65.md` — Varianta STD + sekce 7.1 (Manager gate)
**Datum:** 2026-04-06
**Commit:** (viz git log)

## Problem

Self-service registrovaný `PARTNER_VRAKOVISTE` (status `PENDING`) se nemůže přihlásit. Admin v `/admin/partners/[id]` nevidí žádné tlačítko pro schválení registrace, protože existující tlačítko „Aktivovat partnerství" má vadnou podmínku `!partner.userId` — self-service partneři ale `userId` mají od první sekundy (nastaveno v `register/partner/route.ts:115`).

Backend `POST /api/partners/[id]/activate` (Path A — řádky 40-76) je hotový a idempotentně řeší přepnutí `User.status` z PENDING na ACTIVE pro již propojený userId. Plán identifikoval tohle jako čistě UI bug.

## Fix (per plán Varianta STD)

### 1. `app/api/partners/[id]/route.ts:25` (1 řádek)

GET handler include zahrnoval `user.select` bez `status`:

```diff
- user: { select: { id: true, email: true, firstName: true, lastName: true } },
+ user: { select: { id: true, email: true, firstName: true, lastName: true, status: true } },
```

Bez tohoto by frontend neměl `partner.user.status` k rozlišení PENDING vs ACTIVE.

### 2. `components/admin/partners/PartnerDetail.tsx`

#### 2.1 Interface rozšíření (řádek 38)
```diff
- user: { id: string; email: string; firstName: string; lastName: string } | null;
+ user: { id: string; email: string; firstName: string; lastName: string; status: string } | null;
```

#### 2.2 useSession + canActivate gate (sekce 7.1 plánu)
```ts
import { useSession } from "next-auth/react";
// ...
const { data: session } = useSession();
const canActivate =
  session?.user?.role === "ADMIN" || session?.user?.role === "BACKOFFICE";
```

`/api/partners/[id]` GET povoluje i `MANAGER` (řádek 7: `ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"]`), ale `/api/partners/[id]/activate` POST guarduje jen ADMIN/BACKOFFICE → manager dostal 403 i kdyby klikl. Client-side gate skryje tlačítko pro manager session a vyhne se matoucímu UX.

#### 2.3 Header — Badge „Čeká na schválení" + tlačítko fix
```diff
  <div className="flex items-center gap-3 flex-wrap">
    <h1>{partner.name}</h1>
    <PartnerStatusBadge status={partner.status} />
    <Badge variant="default">{partner.type === "AUTOBAZAR" ? "Autobazar" : "Vrakoviště"}</Badge>
+   {partner.user?.status === "PENDING" && (
+     <Badge variant="warning">Čeká na schválení</Badge>
+   )}
  </div>
  // ...
- {partner.status !== "AKTIVNI_PARTNER" && !partner.userId && (
+ {canActivate && partner.status !== "AKTIVNI_PARTNER" && (
    <Button variant="success" size="sm" onClick={() => setShowActivateModal(true)}>
-     Aktivovat partnerství
+     {partner.userId && partner.user?.status === "PENDING"
+       ? "Schválit registraci"
+       : "Aktivovat partnerství"}
    </Button>
  )}
```

Dynamický label umožňuje admin instinktivně rozlišit „schvalujem self-service" vs „vytvářím účet manuálně".

#### 2.4 Modal title + button label + copy
Dynamický title (`title={…}` per scénář), 3-cestný conditional content:
- `activateResult` → success state (s podporou Path A bez `temporaryPassword`)
- `partner.userId && partner.user?.status === "PENDING"` → „Schválením povolíte uživateli {email} přihlášení…" + drobný hint o self-service
- jinak → původní „Aktivací se vytvoří uživatelský účet…"

Footer button label: „Schválit" pro PENDING approval, jinak „Aktivovat".

#### 2.5 ActivateResult type — `temporaryPassword?: string`
Path A backend response je `{ success, userId, email, existingAccount }` — bez `temporaryPassword`. Path B vrací `temporaryPassword`. Změnil jsem type na optional + conditional render password řádku v success state.

```diff
- useState<{ email: string; temporaryPassword: string } | null>
+ useState<{ email: string; temporaryPassword?: string } | null>
```

Success copy se mění:
- S password → „Účet úspěšně vytvořen!" + „Odešlete partnerovi tyto údaje emailem."
- Bez password → „Registrace schválena!" + „Partner se nyní může přihlásit svým heslem zvoleným při registraci."

## Verifikace

- ✅ `npx tsc --noEmit` — clean (žádné errors)
- ✅ `npx eslint components/admin/partners/PartnerDetail.tsx app/api/partners/[id]/route.ts` — 3 warnings, **všechny pre-existing** (`managers`, `setManagers`, `assignManager` unused vars). Ověřeno přes `git stash` baseline run — stejné 3 warnings před mojí změnou. 0 errors.
- ✅ Per-file scope — pouze 2 dotčené soubory

## Acceptance criteria (z plánu sekce 9)

**Backend (žádné změny, ověření):**
- [x] `POST /api/partners/[id]/activate` existuje a guarduje ADMIN/BACKOFFICE
- [x] Path A přepíná `User.status` → ACTIVE pro existing userId
- [x] PartnerActivity audit log se vytvoří
- [x] Path B (manual create) také funguje (žádná regrese)

**Frontend changes:**
- [x] `Partner.user` interface obsahuje `status: string`
- [x] `app/api/partners/[id]/route.ts` GET — `select.user` zahrnuje `status: true`
- [x] Tlačítko se zobrazí když `partner.status !== "AKTIVNI_PARTNER"` (bez `!partner.userId`)
- [x] Tlačítko se NEZOBRAZÍ pro MANAGER session role (canActivate gate)
- [x] Tlačítko label „Schválit registraci" pokud `partner.user?.status === "PENDING"`
- [x] Badge „Čeká na schválení" v hlavičce
- [x] Modal title + copy + button label se mění podle scénáře
- [x] Po úspěšné aktivaci se UI refreshne (existing `setPartner` call ve `activatePartnership` funguje, doplněn refresh access activities)

## Odchylky od plánu

1. **Path A success state copy** — plán neexplicitně řešil success message pro Path A (bez temporaryPassword). Přidal jsem rozlišení „Účet úspěšně vytvořen" (Path B) vs „Registrace schválena" (Path A) + conditional render password řádku. Bez tohoto by Path A success showoval prázdné „Dočasné heslo" pole. Považuji za logickou součást scope (existing modal copy je tightly coupled na obě branches).

2. **`flex-wrap` na header div** — přidal jsem `flex-wrap` k `flex items-center gap-3` aby čtvrtý badge („Čeká na schválení") nepřetékal mimo viewport na úzkých obrazovkách. Mini-fix vizuální konzistence.

## Files changed (2)

- `app/api/partners/[id]/route.ts` — 1 řádek (přidán `status: true` do user select)
- `components/admin/partners/PartnerDetail.tsx` — ~50 řádků (interface, useSession, canActivate, badge, button condition+label, modal title/footer/copy, type change)

## Risks

| Riziko | Severity | Notes |
|---|---|---|
| MANAGER už nevidí tlačítko | Intended | Per plán 7.1 — Manager nemůže schválit (backend 403), client-side gate vyhne se matoucímu pokusu |
| Activate endpoint vrací 400 pro Partner bez `userId` v PENDING | None | Tento case neexistuje — bez userId Path B vytvoří user fresh, bez ohledu na původní user.status |
| Activate endpoint vrací 400 pro orphaned userId | Low | Pokud User byl smazán ale Partner.userId zůstal, activate vrátí 400 „Propojený uživatel nenalezen". Edge case, admin musí ručně řešit. Existing chování. |
| Race condition (paralelní aktivace) | Low | Druhý admin dostane idempotent success. Activity log duplicate. Akceptovatelné. |
| Regrese pro existing manual-create flow (Path B) | None | Tlačítko se stále zobrazí kde se zobrazovalo (status !== AKTIVNI_PARTNER). Modal zachová původní copy pro non-PENDING případy. |

## Out of scope (per plán sekce 8)

- ❌ Email notifikace partnerovi po aktivaci (#65b follow-up)
- ❌ REJECT button pro PENDING (#65d follow-up)
- ❌ Filter tab „Čeká na schválení" + stat card (Varianta MAX, #65c follow-up)
- ❌ Notification badge v admin sidebar
- ❌ Bulk approval

## Follow-up

Per plán sekce 8 + 11:
1. **#65b** — email notifikace po aktivaci (template + Resend)
2. **#65c** — Variant MAX upgrade (filter tab + stat card)
3. **#65d** — REJECT button + DELETE linked User v transakci
