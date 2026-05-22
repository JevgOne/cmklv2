# Chrome E2E Test Report: TASK-053 — Instagram-style Profil
**Datum:** 2026-04-16  
**Tester:** TEST-CHROME  
**Route:** `/profil/[slug]`  
**Screenshot:** viz níže  
**Playwright:** 3/4 chromium testů passed (mobile skip — webkit chybí)

---

## Verdict: ⚠️ TEST PARTIALLY PASSED (1 kritický GAP)

---

## Screenshot — profil Jan Novák (anonymous view)

![profil](../../test-results/test-profile-053-TASK-053--5b2fa-us-BUYER-—-profil-Jan-Novák-chromium/test-failed-1.png)

Vizuálně: orange cover, initials "JN", "Certifikovaný makléř" badge, bio text, stats bar "3 Vozidla", tahy "Vozidla" / "Oblíbené", "Sdílet profil" button.

---

## ROLE 1: Anonymous BUYER — profil /profil/jan-novak-praha

| Test case | Výsledek | Poznámka |
|-----------|----------|---------|
| Profil se zobrazil (H1: "Jan Novák") | ✅ | |
| Avatar/initials "JN" viditelný | ✅ | No avatar → initials fallback |
| Bio text zobrazen | ✅ | "Certifikovaný makléř s 5 lety zkušeností..." |
| Role badge "Certifikovaný makléř" | ✅ | |
| Oblíbené značky (osobní, SUV) | ✅ | |
| Tab "Vozidla" viditelný | ✅ | |
| Tab "Oblíbené" viditelný | ✅ | |
| Items grid načten (3 vozidla) | ✅ | Hyundai Tucson, Mercedes C300, Škoda Octavia |
| LikeButton viditelný (♡) | ✅ | |
| Like klik → redirect /prihlaseni | ✅ | Frontend: router.push('/prihlaseni?callbackUrl=...') |
| API POST /api/likes bez auth → 401 | ✅ | |
| CommentSection tlačítko "Přidat komentář" | ✅ | |
| Comment expand → zobrazí "Přihlaste se" | ✅ | Link na /prihlaseni |
| Comment expand → NEzobrazí input field | ✅ | Správně blokuje anonymous |
| API POST /api/comments bez auth → 401 | ✅ | |
| "Sdílet profil" button | ✅ | |
| Žádné edit controls pro anonymous | ✅ | |
| "Člen od duben..." zobrazeno | ✅ | |
| Stats bar (Vozidla: 3, Lajky: 1) | ✅ | |

---

## ROLE 2: Broker (Jan Novák) — vlastní profil

| Test case | Výsledek | Poznámka |
|-----------|----------|---------|
| Login jan.novak@carmakler.cz / heslo123 | ✅ | Redirect na /makler/dashboard |
| Přejít na /profil/jan-novak-praha | ✅ | H1: "Jan Novák" |
| Like jako přihlášený → zůstane na profilu | ✅ | URL: /profil/jan-novak-praha |
| Comment input viditelný pro přihlášeného | ✅ | input[placeholder] visible |
| **"Upravit profil" tlačítko na vlastním profilu** | **❌ CHYBÍ** | Viz GAP níže |

### ❌ KRITICKÝ GAP: Chybí owner edit mode na profilu

`page.tsx` **neobsahuje `useSession()`** — profil nedetekuje kdo je přihlášen. Proto se makléřovi na vlastním profilu NEZOBRAZÍ tlačítko "Upravit profil" nebo jiné owner controls.

Nalezeno v kódu (řádky 296-313 page.tsx):
```jsx
{/* Actions — STATIC, no session check! */}
<div className="flex gap-2 sm:pb-2">
  {user.phone && <a href="tel:...">Kontaktovat</a>}
  <button onClick={handleShare}>Sdílet profil</button>
  {/* ← Zde by mělo být: {isOwner && <Link href="/muj-ucet/profil">Upravit profil</Link>} */}
</div>
```

**Expected behavior:** Broker vidí "Upravit profil" button na svém profilu → odkazuje na `/muj-ucet/profil`  
**Actual behavior:** Profile page is completely stateless — žádná session awareness, žádný owner detection

---

## ROLE 3: Admin — profil makléře

| Test case | Výsledek | Poznámka |
|-----------|----------|---------|
| Login admin@carmakler.cz / heslo123 | ✅ | Redirect na /admin/dashboard |
| Přejít na /profil/jan-novak-praha | ✅ | |
| Admin vidí tahy (Vozidla + Oblíbené) | ✅ | 2 tahy (profile owner is BROKER) |
| Admin moderation controls (ban/moderate) | ❌ CHYBÍ | Žádné admin controls na profilu |

---

## GAP Checks (z předchozího QA)

| GAP/BUG | Status | Detail |
|---------|--------|--------|
| BUG-1: delete tlačítko | ✅ RESOLVED | CommentSection má × button pro owner/admin |
| GAP-1: badges bez triggeru | ⚠️ INFO | API vrací 2 badges pro Jana, badge_catalog má ikony, vše funguje |
| GAP-3: MANAGER/RD v ROLE_TABS | ⚠️ CONFIRMED | `MANAGER: ["liked"]` a `REGIONAL_DIRECTOR: ["liked"]` — vlastní profil manažera/ředitele zobrazuje jen tab "Oblíbené". Ostatní profily vidí správně (role profilu, ne diváka). |
| N1: "Prům. ROI" | ✅ CORRECT | Zobrazuje se jen pro roleStats.avgROI (INVESTOR/VERIFIED_DEALER) — pro BROKER Jan Novák správně NENI |
| N3: "Dokončené" | ✅ CORRECT | Zobrazuje se jen pro roleStats.completedDeals (VERIFIED_DEALER) |

---

## Paginace

| Test | Výsledek |
|------|---------|
| Jan Novák: 3 vozidla, nextCursor=null | ✅ |
| "Načíst další" button — nezobrazuje se (správně, méně než 12 items) | ✅ |

---

## Souhrn — co funguje vs. co chybí

### ✅ PASSES (14/15 flows)
- Renderování profilu (foto, bio, level, badges, tahy, stats)
- Auth gate pro like/comment (anonymous → redirect/login prompt + API 401)
- Broker: login, like bez redirect, comment input
- Admin: login, přístup k profilu
- Paginace
- CommentSection delete button (pro autora/admin)
- Role-specific tabs (based on profile owner role)
- Stats bar (vozidla, lajky, prodeje)
- Sdílet profil funkce
- API endpoint /api/profile/[slug] vrací správná data

### ❌ FAILURES / CHYBÍ (opravit)
1. **[MUST FIX] Owner edit mode:** Profile page nemá `useSession()` → makléř nevidí "Upravit profil" na vlastním profilu. Fix: přidat `useSession()`, detekovat `session.user.id === user.id`, zobrazit Link na `/muj-ucet/profil`.
2. **[NICE-TO-HAVE] Admin moderation controls:** Admin na profilu nevidí žádné moderation buttons. 
3. **[MINOR] GAP-3:** MANAGER a REGIONAL_DIRECTOR mají vlastní profil jen s tabem "Oblíbené" — zvážit přidání dalších tabů nebo zobrazit aspoň "Prodeje" tab.

---

## Celkový verdikt: ⚠️ PARTIALLY PASSED

Core flows fungují ✅. Kritický missing feature: **owner edit mode na profilu** (makléř nevidí "Upravit profil" na vlastním profilu). Toto je MUST FIX pro TASK-053 acceptance.
