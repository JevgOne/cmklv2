# QA Report — Task #53: Instagram-style profil

**Commit:** 8d74958  
**Reviewer:** KONTROLOR  
**Date:** 2026-04-15

---

## BUGS

### BUG-1 (Minor) — CommentSection delete tlačítko chybí pro item-ownery

**File:** `components/web/CommentSection.tsx` lines 164–167

```tsx
{session?.user && (
  session.user.id === comment.userId ||
  ["ADMIN", "BACKOFFICE"].includes(session.user.role)
) && (
  <button onClick={() => handleDelete(comment.id)}>✕</button>
)}
```

API `DELETE /api/comments/[id]` správně povoluje mazání item-ownerovi (broker svého vozidla, vlastník inzerátu, dodavatel svého dílu). UI tlačítko se mu ale nezobrazí.

Důsledek: Broker, který dostane negativní komentář na své vozidlo, může komentář smazat přes API, ale v UI k tomu nemá tlačítko.

**Fix:** Přidat kontrolu pro item-ownery. Protože klient nezná `supplierId/brokerId/userId` položky přímo, nejjednodušší fix je zobrazit tlačítko pro všechny přihlášené uživatele, a nechat API vrátit 403 (pokud nejsou oprávněni).

Alternativa: API GET /api/comments vrací `comment.vehicleId/listingId/partId` — klient by mohl porovnat s user.id přes zvláštní endpoint. Ale toto by bylo přetechnizované. Jednodušší: zobrazit tlačítko vždy, API zapečeče oprávnění.

---

## GAPS

### GAP-1 — 4 badge typy v katalogu bez auto-award mechanismu

**File:** `lib/badges.ts`

`BADGE_CATALOG` definuje 11 typů. `checkAndAwardBadges()` uděluje pouze 6:
- FIRST_SALE / FIVE_SALES / TEN_SALES / FIFTY_SALES (přes `totalSales`) ✅
- VERIFIED (přes `onboardingCompleted`) ✅
- POPULAR (50+ likes) ✅
- COMMUNITY (20+ comments) ✅

**Nikdy neudelovány:**
- `PHOTO_PRO` — "10+ fotek na jedné položce" — žádný trigger
- `FAST_RESPONDER` — "Odpovídá do 1 hodiny" — žádný trigger ani tracking
- `TOP_RATED` — "Hodnocení 4.5+" — `checkAndAwardBadges` je nečte
- `EARLY_ADOPTER` — "Mezi prvními uživateli" — žádný trigger

Katalogové itemy bez triggeru jsou dead code. Buď doplnit triggery, nebo je z katalogu dočasně vyjmout.

---

### GAP-2 — `isHidden` na ProfileComment bez API pro nastavení

**File:** `prisma/schema.prisma` + `app/api/comments/route.ts`

GET filtruje `{ isHidden: false }` — skryté komentáře se nezobrazí. Ale neexistuje žádný API endpoint (ani ADMIN), který by `isHidden: true` nastavil. Pole je v DB, ale efektivně mrtví kód.

Scénář: Admin chce skrýt nevhodný komentář bez smazání (pro audit). Nemůže — musí smazat.

---

### GAP-3 — MANAGER, REGIONAL_DIRECTOR chybí v ROLE_TABS

**File:** `app/(web)/profil/[slug]/page.tsx` lines 76–88

Definované role v systému (viz CLAUDE.md): MANAGER, REGIONAL_DIRECTOR. V `ROLE_TABS` nejsou — profil těchto rolí fallbackuje na `["liked"]` tab. Malá UX issue.

---

## PASS ✅

### Prisma schema (8d74958)
- `ProfileLike`: 3× `@@unique([userId, vehicleId/listingId/partId])`, `@@index` na každý FK ✅
- `ProfileComment`: `text`, `isHidden`, cursor-párovatelné indexy ✅
- `ProfileBadge`: `@@unique([userId, badgeKey])` — zabrání duplicitním odznakům ✅
- `User` rozšíření: `coverPhoto`, `favoriteBrands`, `city`, `showPhone`, `showEmail`, `profileViews` ✅
- `onDelete: Cascade` na všech polymorfních FK ✅

### API routes
- **GET /api/profile/[slug]**: public (no auth), stats z DB (vehicleCount/listingCount/partCount/totalLikes) — žádné hardcoded hodnoty ✅
- **profileViews increment**: Prisma `{ increment: 1 }` je DB-side atomická operace — race condition nehrozí ✅
- **Privacy gates**: `phone: user.showPhone ? user.phone : null` ✅
- **GET /api/profile/[slug]/items**: cursor pagination ✅, tab validation ✅, `liked` tab: polymorfní unwrap ✅
- **POST /api/likes**: Zod `.refine()` → právě 1 non-null target ✅, toggle (like/unlike) ✅, best-effort badge check ✅
- **POST /api/comments**: Zod refine ✅, rate limit 10/5 min ✅, `isHidden: false` default ✅
- **GET /api/comments**: cursor pagination ✅, multi-target guard (require at least one) ✅
- **DELETE /api/comments/[id]**: 3-way auth — comment-owner / ADMIN-BACKOFFICE / item-owner ✅
- **GET/PUT /api/profile/edit**: only own profile (session guard) ✅, Zod ✅, auto-slug při první editaci ✅

### favoriteBrands JSON round-trip
- DB: stored as `String` (JSON.stringify'd array)
- GET edit → raw string → edit page `JSON.parse()` ✅
- PUT edit → array → API `JSON.stringify()` ✅
- GET public profile → raw string → profile page `JSON.parse()` ✅

### Frontend
- **LikeButton**: optimistic UI (revert on error) ✅, login redirect pro nepřihlášené ✅, animace ✅
- **CommentSection**: lazy-load (expand on click) ✅, timeAgo ✅, auth-gated form ✅, auto-refresh po přidání ✅
- **ProfilePage**: role-based tabs ✅, stats bar (conditional, 0-hidden) ✅, badges z BADGE_CATALOG ✅, `favoriteBrands` JSON.parse ✅
- **ProfileItemCard**: liked type — unwrap vehicle/listing/part ✅, regular — LikeButton + comment count ✅
- **generateProfileSlug**: NFD normalizace ✅, loop-with-counter collision handling ✅
- **lib/badges.ts**: `checkAndAwardBadges` idempotent (`skipDuplicates: true`) ✅, best-effort wrapping v likes/comments ✅

---

## Summary

| Typ | Počet | Popis |
|-----|-------|-------|
| MINOR | 1 | CommentSection delete tlačítko chybí pro item-ownery |
| GAP | 3 | 4 nepřidělované badge typy; isHidden bez API; MANAGER/RD chybí v ROLE_TABS |

**Core funkcionalita je solid.** BUG-1 je kosmetická UX issue (API auth funguje správně). Hlavní GAP jsou nepřidělované badge typy — katalog slibuje funkci, která neexistuje.
