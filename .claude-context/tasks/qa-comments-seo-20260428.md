# QA Report — Task #51 + #52: Anonymní komentáře + SEO fixes

**Datum:** 2026-04-28  
**Autor:** Kontrolor  
**Status: ✅ SCHVÁLENO — 0 blokerů, 2 poznámky**

---

## VERDICT

Build prošel bez TS/lint chyb. Všechny kontrolované body jsou správně implementovány. Dva runtime DB errory (nesouvisí s tímto taskem) jsou zdokumentovány jako INFO.

---

## BUILD

```
npm run build → ✅ Compiled successfully in 38.9s
TypeScript: ✅ bez chyb
ESLint: ✅ bez chyb
```

**INFO-1 (nesouvisí s tímto taskem):** 2 Prisma runtime errory při generování statických stránek:
- `prisma.review.findFirst()` — tabulka `public.Review` chybí v dev DB (known bloker z Task #42)
- `prisma.teamMember.findMany()` — tabulka `public.TeamMember` chybí v dev DB

Build přesto proběhl úspěšně — errory jsou zachyceny v try/catch, produkce má tabulky k dispozici.

---

## TASK #52 — SEO fixes

### ✅ `app/sitemap.ts` — /cenik a /sluzby v staticPages

```typescript
{ url: `${BASE_URL}/cenik`, ... },   // řádek 96 ✅
{ url: `${BASE_URL}/sluzby`, ... },  // řádek 101 ✅
```

### ✅ `app/robots.ts` — disallow správně

```typescript
disallow: [
  "/api/",
  "/admin/",
  "/makler/",
  "/partner/",   ✅
  "/parts/",     ✅
  "/muj-ucet/",  ✅
  ...
]
```

### ✅ `app/(web)/cenik/page.tsx` — OG + canonical

```typescript
openGraph: {
  title: "Ceník služeb | CarMakléř",
  description: "Provize 5 % z prodejní ceny, min. 25 000 Kč. Vše zahrnuto — fotky, inzerce, smlouvy, přepis.",
},
alternates: pageCanonical("/cenik"),  ✅
```

---

## TASK #51 — Anonymní komentáře

### ✅ Schema `prisma/schema.prisma` — ProfileComment

```prisma
model ProfileComment {
  userId      String?   // nullable → hosté mohou komentovat ✅
  user        User?     // optional relation ✅

  // Guest komentáře
  authorName  String?   // ✅ (pozn.: sloupec se jmenuje authorName, ne guestName)
  authorEmail String?   // ✅ (pozn.: sloupec se jmenuje authorEmail, ne guestEmail)
  guestIp     String?   // ✅
  ...
  articleId   String?   // polymorfní target pro blog ✅
}
```

**POZN.:** Zadání uvádělo `guestName`/`guestEmail` — implementace zvolila `authorName`/`authorEmail`. Pojmenování je konzistentní napříč schématem, migrací, API i UI. Funkčně ekvivalentní, jedná se o stylistické rozhodnutí.

### ✅ Migrace `20260428070000_guest_comments/migration.sql`

```sql
ALTER TABLE "ProfileComment" ALTER COLUMN "userId" DROP NOT NULL;  ✅
ALTER TABLE "ProfileComment" ADD COLUMN "authorName" TEXT;          ✅
ALTER TABLE "ProfileComment" ADD COLUMN "authorEmail" TEXT;         ✅
ALTER TABLE "ProfileComment" ADD COLUMN "guestIp" TEXT;             ✅
ALTER TABLE "ProfileComment" ALTER COLUMN "isHidden" SET DEFAULT true; ✅
CREATE INDEX "ProfileComment_guestIp_idx" ON "ProfileComment"("guestIp"); ✅
```

### ✅ API POST `/api/blog/articles/[id]/comments` — vše správně

| Požadavek | Stav |
|-----------|------|
| POST bez session → guestName povinné | ✅ — `if (!parsed.authorName \|\| !parsed.authorEmail) → 400` |
| Honeypot `website` → fake 201 bez uložení | ✅ — `if (parsed.website) { return 201 (fake) }` |
| IP rate limit hosté: max 5/h | ✅ — `guestRecentCount >= 5 → 429` |
| Auth rate limit: 3/min | ✅ — `recentCount >= 3 → 429` |
| `isHidden: true` default | ✅ — všechny komentáře čekají na moderaci |

### ✅ UI `components/web/blog/ArticleComments.tsx`

| Požadavek | Stav |
|-----------|------|
| Nepřihlášení: jméno + email + textarea | ✅ — `{!isLoggedIn && <div className="grid sm:grid-cols-2...">}` |
| Přihlášení: jen textarea | ✅ — guest pole skryté při `isLoggedIn` |
| Honeypot skrytý CSS (ne `type="hidden"`) | ✅ — `<div className="absolute -left-[9999px]" aria-hidden="true">` |

### ✅ Admin — rozlišení guest vs registered komentářů

`app/(admin)/admin/blog/comments/page.tsx` + `CommentsModeration.tsx`:
- Stránka `/admin/blog/comments` v buildu ✅
- Zobrazuje `authorName` + badge "host" pro hosty ✅
- Zobrazuje `authorEmail` pro hosty ✅
- Zobrazuje jméno + email registrovaných uživatelů ✅
- Filtry: Všechny / Ke schválení / Schválené ✅
- Approve / Skrýt / Smazat akce přes PATCH/DELETE API ✅

---

## SOUHRNNÁ TABULKA

| Kontrola | Status |
|----------|--------|
| Build (TS/lint) | ✅ |
| sitemap: /cenik + /sluzby | ✅ |
| robots: /partner/ /parts/ /muj-ucet/ | ✅ |
| ceník OG + canonical | ✅ |
| Schema: userId nullable | ✅ |
| Schema: authorName/Email/guestIp | ✅ |
| Migrace: ALTER TABLE správně | ✅ |
| API: guestName povinné (POST bez session) | ✅ |
| API: honeypot → fake 201 | ✅ |
| API: IP rate limit 5/h | ✅ |
| API: auth rate limit 3/min | ✅ |
| API: isHidden default true | ✅ |
| UI: nepřihlášení — jméno + email + textarea | ✅ |
| UI: přihlášení — jen textarea | ✅ |
| UI: honeypot CSS (ne type=hidden) | ✅ |
| Admin: rozlišení guest vs registered | ✅ |

**✅ SCHVÁLENO — obě tasky procházejí bez blokerů.**
