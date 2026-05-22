# Plán — Task #65: Admin aktivace PARTNER_VRAKOVISTE (BLOCKER #1)

**Priorita:** HIGH (blocker pro vrakoviště onboarding flow — uživatel se zaregistruje, ale nemůže se přihlásit)
**Typ:** Bugfix UI + UX upgrade (NE nový API endpoint)
**Zadal:** team-lead 2026-04-06 (z QA #64)
**Návazný na:** task #60a/b/c (vrakoviště flow fixes)

---

## 1. Cíl

Umožnit adminovi/backoffice schválit (aktivovat) self-service registrovaný PARTNER_VRAKOVISTE/PARTNER_BAZAR účet → změnit `User.status` z `PENDING` na `ACTIVE`, aby se mohl přihlásit.

## 2. 🎯 KLÍČOVÝ INSIGHT — backend i UI UŽ EXISTUJE, jen je vadná podmínka

Při discovery jsem zjistil, že **velká část řešení je už implementovaná**:

### 2.1 Backend `POST /api/partners/[id]/activate` ✅ HOTOVÝ
`app/api/partners/[id]/activate/route.ts` (141 řádků) řeší **OBA scénáře**:

**Path A — Self-service (partner už má `userId`)** — řádky 40-76:
```ts
if (partner.userId) {
  const existingUser = await prisma.user.findUnique({ where: { id: partner.userId } });
  // ...
  await prisma.$transaction([
    prisma.user.update({ where: { id: partner.userId }, data: { status: "ACTIVE" } }),
    prisma.partner.update({ where: { id }, data: { status: "AKTIVNI_PARTNER" } }),
    prisma.partnerActivity.create({ /* audit log */ }),
  ]);
  return NextResponse.json({ success: true, userId, email, existingAccount: true });
}
```

**Path B — Manual create (žádný userId)** — řádky 79-136:
- Generuje password
- Vytvoří User + linkuje na Partner
- Vrací temporaryPassword

**Guard:** `if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role))` → 403
**Edge cases:** chybějící email (400), neexistující partner (404), duplikát email (400), neexistující propojený user (400)
**Audit log:** `PartnerActivity` typu SYSTEM s old/new status ✅

**→ ŽÁDNÝ NOVÝ ENDPOINT NENÍ POTŘEBA.** Endpoint v `/api/partners` (ne `/api/admin/partners`) je správně umístěný — guarduje role na backendu.

### 2.2 Admin UI tlačítko ✅ EXISTUJE, ale s rozbitou podmínkou ❌
`components/admin/partners/PartnerDetail.tsx:321-330`:
```tsx
{partner.status !== "AKTIVNI_PARTNER" && !partner.userId && (
  <Button variant="success" size="sm" onClick={() => setShowActivateModal(true)}>
    Aktivovat partnerství
  </Button>
)}
```

**🐛 BUG:** Podmínka `!partner.userId` znamená "skryj tlačítko, pokud partner už má propojený účet". Ale **self-service registrovaní partneři MAJÍ userId od první sekundy** (`register/partner/route.ts:115` nastavuje `userId: user.id` v transakci).

→ Tlačítko se nikdy nezobrazí pro self-service path → admin nemůže schválit PENDING uživatele přes UI.

### 2.3 Admin partners list page ✅ FUNKČNÍ
`app/(admin)/admin/partners/page.tsx` zobrazí self-service registrovaného partnera v seznamu se statusem `JEDNAME` (auto-nastaveno v `register/partner/route.ts:114`). Admin ho najde v CRM funnel "Jednáme" sloupci, klikne, otevře detail → ale tlačítko aktivace je skryté (BUG 2.2).

### 2.4 NextAuth blokace `lib/auth.ts:23`
```ts
if (user.status !== "ACTIVE" && user.status !== "ONBOARDING") return null;
```
PENDING user nemůže zadat credentials. To je **správné chování** — fix musí být v admin UI, ne tady.

## 3. Současný stav vs. cílový stav

| Krok | Současný stav | Cílový stav |
|------|--------------|-------------|
| 1. Self-service registrace | ✅ Funguje. Vytvoří User(PENDING) + Partner(JEDNAME) v transakci | ✅ Beze změny |
| 2. Confirmation page | ✅ "Po schválení budete moci přidávat díly" | ✅ Beze změny |
| 3. Admin uvidí partnera v seznamu | ✅ V CRM tabulce jako JEDNAME | 🟡 Lepší: viditelný signál "self-service čeká na schválení" |
| 4. Admin otevře detail | ✅ Funguje | ✅ Beze změny |
| 5. **Admin klikne "Aktivovat partnerství"** | ❌ Tlačítko skryté kvůli `!partner.userId` | ✅ Tlačítko viditelné pro self-service |
| 6. Modal potvrzení | ✅ Existuje, ale copy říká "vytvoříme nový účet" | 🟡 Odlišit "aktivace existujícího účtu" |
| 7. Backend aktivace | ✅ Endpoint hotový (path A) | ✅ Beze změny |
| 8. User → ACTIVE, Partner → AKTIVNI_PARTNER | ✅ Funguje | ✅ Beze změny |
| 9. User se přihlásí → /login úspěšný | ✅ Bude fungovat hned po fix #5 | ✅ Beze změny |
| 10. Email notifikace partnerovi | ❌ Není implementováno | ⚠️ Out of scope (#65b follow-up) |

## 4. Fix scope — 3 varianty

### Varianta MIN (1 řádek, 5 minut)
Pouze odebrat `&& !partner.userId` z `PartnerDetail.tsx:321`. Ostatní logika funguje.

**Pros:** Triviální, nulové riziko, blocker fix.
**Cons:** Nedořešený UX — admin nevidí, který partner čeká na schválení vs který je v JEDNAME stavu z důvodu CRM jednání (manual partner). Modal copy říká "vytvoříme nový účet" ale ve skutečnosti se aktivuje existující.

### Varianta STD (doporučeno) — 1 soubor, ~30 řádků
1. Fix podmínky tlačítka v `PartnerDetail.tsx:321`
2. Modal copy update — rozlišit oba scénáře (existing account vs new account creation)
3. Vizuální signál pro PENDING user status v hlavičce detailu
4. Refresh hook po aktivaci — partner.user.status musí být v `Partner` interface

**Pros:** Funguje + UX jasný admin.
**Cons:** ~30 řádků TypeScript edits.

### Varianta MAX (#65 + UX upgrade) — 2 soubory, ~80 řádků
Vše z STD plus:
1. Nový tab "Čeká na schválení" v `PartnersTable.tsx` (filter `user.status = PENDING`)
2. `/api/partners` GET query param `?pendingApproval=true` (filter)
3. Stat card "Čekající schválení" na `app/(admin)/admin/partners/page.tsx`

**Pros:** Plný UX dashboard pro admin.
**Cons:** Větší scope, nezbytné jen pokud team-lead chce dashboard.

**→ DOPORUČENÍ: Varianta STD.** Blocker se vyřeší, UX nebude matoucí, není zbytečně velký scope. MAX můžeme udělat jako follow-up #65a.

## 5. Dotčené soubory (Varianta STD)

| # | Soubor | Akce | Řádky | Riziko |
|---|--------|------|-------|--------|
| 1 | `components/admin/partners/PartnerDetail.tsx` | Edit | ~30 řádků | nízké — pouze JSX + interface field |

**Pozn.:** ŽÁDNÉ změny v API routes, validátorech, schématu Prisma, lib/auth.ts. Backend je hotový.

## 6. Detailní změny — `PartnerDetail.tsx`

### 6.1 Rozšířit `Partner` interface (řádek 14)
```diff
  user: { id: string; email: string; firstName: string; lastName: string } | null;
+ user: { id: string; email: string; firstName: string; lastName: string; status: string } | null;
```

### 6.2 Update `/api/partners/[id]/route.ts` GET handler — include user.status
**File:** `app/api/partners/[id]/route.ts:25`
```diff
- user: { select: { id: true, email: true, firstName: true, lastName: true } },
+ user: { select: { id: true, email: true, firstName: true, lastName: true, status: true } },
```
**Pozn.:** Toto je 1 řádek navíc mimo PartnerDetail.tsx. Doplňuje seznam dotčených souborů na 2.

### 6.3 Fix podmínky tlačítka (řádek 321)
```diff
  <div className="flex gap-2">
-   {partner.status !== "AKTIVNI_PARTNER" && !partner.userId && (
+   {partner.status !== "AKTIVNI_PARTNER" && (
      <Button variant="success" size="sm" onClick={() => setShowActivateModal(true)}>
-       Aktivovat partnerství
+       {partner.userId && partner.user?.status === "PENDING"
+         ? "Schválit registraci"
+         : "Aktivovat partnerství"}
      </Button>
    )}
  </div>
```

### 6.4 Vizuální signál PENDING v hlavičce (po řádku 318)
```tsx
{partner.user?.status === "PENDING" && (
  <Badge variant="warning">Čeká na schválení</Badge>
)}
```

### 6.5 Update Modal copy (řádky 649-661)
Rozdělit na dva scénáře:
```tsx
{activateResult ? (
  /* existing success state — beze změny */
) : partner.userId && partner.user?.status === "PENDING" ? (
  <div className="space-y-3">
    <p className="text-sm text-gray-600">
      Schválením povolíte uživateli <strong>{partner.user.email}</strong> přihlášení.
      Účet partnera <strong>{partner.name}</strong> přejde do stavu Aktivní partner.
    </p>
    <p className="text-xs text-gray-400">
      Self-service registrace přes /registrace/dodavatel.
    </p>
  </div>
) : (
  /* original create-new-account text — beze změny */
)}
```

A button label v Modal footeru:
```tsx
<Button variant="success" size="sm" onClick={activatePartnership}>
  {partner.userId && partner.user?.status === "PENDING" ? "Schválit" : "Aktivovat"}
</Button>
```

## 7. Edge cases (všechny už pokryty backendem)

| Edge case | Backend handling | UI handling |
|-----------|------------------|-------------|
| Partner už ACTIVE | Path A přesto projde (idempotentní), vrátí success | Tlačítko skryté (`status !== AKTIVNI_PARTNER`) ✅ |
| Neexistující partner | 404 "Partner nenalezen" | Page render "Partner nenalezen" (řádky 286-293) ✅ |
| Partner bez emailu | 400 "Partner nema email" | Self-service vždy má email (validace v register schema) ✅ |
| Partner.userId existuje, ale User smazán | 400 "Propojeny uzivatel nenalezen" | Edge case — error log, admin musí ručně řešit |
| Duplicate email (Path B) | 400 "Uzivatel s timto emailem jiz existuje" | Self-service path (A) tento case nemá ✅ |
| Manager (ne ADMIN/BACKOFFICE) | 403 | Manager nemá tlačítko (na backendu zaručeno) — POZN: UI tlačítko se však zobrazí všem rolím mající partner detail. **TODO: client-side gate `session.user.role === "ADMIN" / "BACKOFFICE"`** |

### 7.1 ⚠️ TODO — client-side role gate
Detail page je dostupný i pro MANAGER (`ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"]` v `/api/partners/[id]:7`). MANAGER ale dostane 403 z activate endpointu. UI by mělo tlačítko skrýt.

**Fix:** Načíst session v PartnerDetail nebo přidat prop:
```tsx
import { useSession } from "next-auth/react";
const { data: session } = useSession();
const canActivate = session?.user?.role === "ADMIN" || session?.user?.role === "BACKOFFICE";

{canActivate && partner.status !== "AKTIVNI_PARTNER" && (
  <Button>...</Button>
)}
```

## 8. Out of scope

- ❌ **Email notifikace partnerovi po aktivaci** — follow-up #65b. Aktuálně admin musí ručně odeslat email s informací "váš účet byl aktivován". Pro #65 stačí redirect přes UI.
- ❌ **Welcome email s instrukcemi** ("nyní se přihlaste na shop.carmakler.cz/parts") — follow-up #65b
- ❌ **Filter tab "Čeká na schválení" v PartnersTable** — Varianta MAX, follow-up #65c
- ❌ **REJECTED user status flow** — User.status nemá "REJECTED" hodnotu. Použít existing Partner.status = ODMITNUTO + nezasílat aktivační email. Žádný kód nepřidávat.
- ❌ **Bulk approval** — admin schvaluje individuálně, žádný "schválit všechny PENDING" tlačítko.
- ❌ **Notification badge v admin sidebar** ("3 partneři čekají na schválení") — UX nice-to-have, mimo scope.
- ❌ **Nový endpoint `/api/admin/users/[id]/activate`** — generic user activation by byl over-engineering. Existing `/api/partners/[id]/activate` pokrývá use case PARTNER_VRAKOVISTE/PARTNER_BAZAR. Pro BROKER existuje `/api/admin/brokers/[id]/activate`. Pro INVESTOR/VERIFIED_DEALER use marketplaceApplication flow (#45/#53). Žádný další role typ nemá self-service registraci.

## 9. Acceptance criteria

**Backend (žádné změny, jen ověření):**
- [x] `POST /api/partners/[id]/activate` existuje a guarduje ADMIN/BACKOFFICE
- [x] Path A (self-service partner se userId) přepíná User.status → ACTIVE
- [x] PartnerActivity audit log se vytvoří
- [x] Path B (manual create) také funguje

**Frontend changes:**
- [ ] `PartnerDetail.tsx` — `Partner.user` interface obsahuje `status: string`
- [ ] `app/api/partners/[id]/route.ts` GET — `select.user` zahrnuje `status: true`
- [ ] `PartnerDetail.tsx` — tlačítko "Aktivovat partnerství" se zobrazí když `partner.status !== "AKTIVNI_PARTNER"` (bez podmínky `!partner.userId`)
- [ ] Tlačítko se NEZOBRAZÍ pro MANAGER session role (jen ADMIN/BACKOFFICE)
- [ ] Tlačítko label se mění na "Schválit registraci" pokud `partner.user?.status === "PENDING"`
- [ ] Badge "Čeká na schválení" se zobrazí v hlavičce když `partner.user?.status === "PENDING"`
- [ ] Modal copy se mění podle scénáře (PENDING approval vs new account creation)
- [ ] Po úspěšné aktivaci se UI refreshne (`setPartner` s novými hodnotami)

**E2E ověření (test-chrome / manual):**
- [ ] Zaregistrovat dodavatele přes `/registrace/dodavatel`
- [ ] Login pokus z /login → odmítnut (PENDING)
- [ ] Login jako ADMIN → otevřít `/admin/partners` → najít nového partnera (status JEDNAME)
- [ ] Otevřít detail → vidět badge "Čeká na schválení"
- [ ] Kliknout "Schválit registraci" → modal → potvrdit
- [ ] Status partnera se přepne na AKTIVNI_PARTNER, badge zmizí
- [ ] Logout admin
- [ ] Login dodavatele s původním heslem → úspěch
- [ ] Redirect do `/parts` (nebo příslušné PWA dle middleware)

## 10. Risks

1. **Manager role uvidí tlačítko** — pokud nezahrnem 7.1 fix, manager klikne, dostane 403, špatný UX. **Mitigation:** Implementovat 7.1 jako součást STD varianty.
2. **Activate endpoint vrací 400 pro Partner bez userId** — pouze v exotickém case kdy admin hand-craftne partner v DB bez registrace. Tlačítko v tomto případě stále funguje (Path B). Nízké riziko.
3. **Race condition při paralelní aktivaci** — admin1 + admin2 současně kliknou. Druhý dostane idempotent success. Activity log bude duplicate. Nízké riziko, akceptovatelné.
4. **NextAuth JWT cache** — uživatel po aktivaci může mít staré PENDING ve stávající (neexistující) session. Není problém — login je po aktivaci, fresh JWT.
5. **Partner.userId orphaned** — pokud User je smazán ale Partner zůstane, Path A vrátí 400. Cleanup task mimo scope.

## 11. Open questions pro team-leada

1. **Email notifikace dodavateli po aktivaci** — chceš to v #65 nebo separátní #65b?
   - Default: separátní #65b (mailovací template + sendgrid/resend integration je samostatný scope).
2. **Vizuální dashboard "Čekající schválení"** — chceš Variantu MAX (filter tab + stat card)?
   - Default: NE (Varianta STD stačí, MAX jako #65c follow-up).
3. **Manager může schválit?** — současný backend říká NE (jen ADMIN/BACKOFFICE). Souhlasí?
   - Default: NE — manager je sales role, nemá auditní oprávnění.
4. **REJECT button pro PENDING dodavatele** — současný flow nemá způsob, jak admin "zamítnout" self-service registraci. Existuje Partner.status = ODMITNUTO, ale nesmaže User. Je to potřeba pro #65, nebo follow-up?
   - Default: follow-up #65d (REJECT button + DELETE linked User v transakci).

## 12. Velikost a status

- **Změny:** 2 soubory (`PartnerDetail.tsx` ~30 řádků, `api/partners/[id]/route.ts` 1 řádek)
- **Rizikovost:** nízká — frontend-only pro kritickou cestu, backend hotový
- **Testování:** manual click-through (10 kroků v sekci 9) + případně Playwright e2e
- **Souběžnost:** Může běžet paralelně s #66 (Cloudinary fix)
- **Status plánu:** ready k dispatch na implementátora

---

## Poznámka pro team-leada

**Klíčový závěr:** Tohle není BLOCKER #1 v původním smyslu "chybí endpoint a UI". Backend je 100% hotový — někdo (pravděpodobně předchozí impl partnership feature) zapomněl, že self-service registrace vytvoří partner s `userId`, takže UI condition `!partner.userId` skryla tlačítko ve vlastním use-case.

**1-řádkový minimal fix** (Varianta MIN) vyřeší blocker. Doporučuji ale Variantu STD (~30 řádků) — UX bude jasný a nezůstanou matoucí flow pro admin.

**Žádný nový API endpoint není potřeba.** Reusable `/api/partners/[id]/activate` už pokrývá use-case. Generic `/api/admin/users/[id]/activate` jako jsi navrhoval v zadání by byl over-engineering — každý role typ má svůj activation flow (BROKER, PARTNER, marketplace dealer/investor) s odlišnou business logikou.

Pokud chceš jen 1-řádkový minimal fix (Varianta MIN), stačí říct a upravím plán.
