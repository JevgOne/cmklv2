# QA Report — Task #53: Komentáře bez registrace + SEO fixes

**Datum:** 2026-04-28  
**Autor:** Kontrolor  
**Status: ⚠️ SCHVÁLENO S UPOZORNĚNÍM — 1 WARN (bez blokeru)**

---

## VERDICT

Implementace je funkční a bezpečná. Anti-spam (honeypot + rate limiting), moderation-first přístup (isHidden=true), DB migrace a SEO metadata jsou správně implementovány.

**WARN-1:** Chybí admin UI stránka pro výpis čekajících komentářů (isHidden=true). Admin má k dispozici PATCH/DELETE API, ale bez listovacího endpointu nebo UI stránky nemůže moderátor zjistit, které komentáře čekají na schválení.

---

## TASK #51 — Komentáře na blogu bez registrace

### ✅ Migrace `20260428070000_guest_comments`
```sql
ALTER TABLE "ProfileComment" ALTER COLUMN "userId" DROP NOT NULL;  -- hosté mohou komentovat
ALTER TABLE "ProfileComment" ADD COLUMN "authorName" TEXT;
ALTER TABLE "ProfileComment" ADD COLUMN "authorEmail" TEXT;
ALTER TABLE "ProfileComment" ADD COLUMN "guestIp" TEXT;
ALTER TABLE "ProfileComment" ALTER COLUMN "isHidden" SET DEFAULT true;  -- moderation-first
CREATE INDEX "ProfileComment_guestIp_idx" ON "ProfileComment"("guestIp");
```
Všechna potřebná pole přidána, userId volitelné, index pro rate limiting ✅

### ✅ API GET `/api/blog/articles/[id]/comments`
- Stránkování (10/stránku) ✅
- Admini (ADMIN/BACKOFFICE) vidí i `isHidden: true` komentáře ✅
- Ostatní vidí pouze `isHidden: false` ✅

### ✅ API POST `/api/blog/articles/[id]/comments`
- Zod validace: `text` min:5 max:1000, `authorName` min:2 max:100, `authorEmail` email max:200 ✅
- Honeypot `website` pole: pokud vyplněno → vrátí fake 201 bez uložení do DB ✅
- Auth rate limit: 3 komentáře/minutu per userId ✅
- Guest rate limit: 5 komentářů/hodinu per guestIp ✅
- Všechny komentáře: `isHidden: true` (čekají na moderaci) ✅
- Hosté musí poskytnout `authorName` + `authorEmail` ✅

### ✅ Admin moderation API
- `PATCH /api/admin/comments/[commentId]` — toggle `isHidden`, ADMIN/BACKOFFICE only ✅
- `DELETE /api/admin/comments/[commentId]` — smazání, ADMIN/BACKOFFICE only ✅

### ✅ `components/web/blog/ArticleComments.tsx`
- Pole pro jméno + email zobrazena pouze pro `!isLoggedIn` ✅
- Honeypot: `<div className="absolute -left-[9999px]">`, `tabIndex={-1}`, `autoComplete="off"` ✅
- Honeypot hodnota odesílána do API pokud vyplněna ✅
- Load more pagination (cursor page+1) ✅
- Empty state: "Zatím žádné komentáře. Buďte první!" ✅
- Čítač znaků (text.length/1000) ✅
- Placeholder přizpůsoben přihlášenému uživateli ✅

### ✅ `app/(web)/blog/[slug]/page.tsx` — integrace
- Načítá pouze `isHidden: false` komentáře (approved) ✅
- Předává `article.id` jako `articleId` ✅
- Předává `total={commentTotal}` ✅
- Předává `isLoggedIn={!!session?.user}` ✅
- Serializuje `createdAt.toISOString()` ✅
- `userName` z session předán pro personalizovaný placeholder ✅

### ⚠️ WARN-1 — Chybí admin UI pro výpis pending komentářů

**Co chybí:**
- `GET /api/admin/comments?pending=true` — listovací endpoint
- `app/(admin)/admin/comments/page.tsx` — admin stránka pro moderaci

**Dopad:** Moderátor nemůže vidět, které komentáře čekají na schválení, pokud nezná přesné commentId. PATCH/DELETE API existuje, ale bez discovery mechanismu je nepoužitelné.

**Doporučení:** Přidat buď:
1. Admin stránku `/admin/blog` s tab "Komentáře ke schválení" (získat `prisma.profileComment.findMany({ where: { isHidden: true, articleId: { not: null } } })`)
2. NEBO endpoint `GET /api/admin/comments?pending=true` + minimální UI

---

## TASK #52 — SEO quick fixes

### ✅ `app/robots.ts`
- Disallow: `/api/`, `/admin/`, `/makler/`, `/partner/`, `/parts/`, `/muj-ucet/`, marketplace dashboards, login pages ✅
- `sitemap: ${BASE_URL}/sitemap.xml` ✅

### ✅ `app/sitemap.ts`
- 30+ statických stránek ✅
- SEO landing pages: značky (16), modely (12), karoserie (7), cenové rozsahy (5), města (8) ✅
- Díly: kategorie (11), značky (8), značka+model (~24), značka+model+rok (~72) ✅
- Dynamické DB stránky: vozidla, makléři, tagy, vrakoviště, bazary, inzeráty, blog články ✅

### ✅ `app/(web)/cenik/page.tsx` — OG metadata
```typescript
openGraph: {
  title: "Ceník služeb | CarMakléř",
  description: "Provize 5 % z prodejní ceny, min. 25 000 Kč. Vše zahrnuto — fotky, inzerce, smlouvy, přepis.",
},
alternates: pageCanonical("/cenik"),
```
OG title + description přidány ✅

---

## SOUHRNNÁ TABULKA

| Kontrola | Status |
|----------|--------|
| Migrace (guestName/Email/IP, isHidden default) | ✅ |
| API GET comments (admin/public oddělení) | ✅ |
| API POST auth rate limit (3/min) | ✅ |
| API POST guest rate limit (5/hod IP) | ✅ |
| API POST honeypot (fake 201) | ✅ |
| API POST isHidden: true default | ✅ |
| API POST guest name+email required | ✅ |
| Admin PATCH/DELETE (ADMIN/BACKOFFICE) | ✅ |
| ArticleComments UI (hosté, honeypot, load more) | ✅ |
| Blog [slug]/page.tsx integrace | ✅ |
| robots.ts (disallow + sitemap) | ✅ |
| sitemap.ts (static + dynamic) | ✅ |
| ceník OG metadata | ✅ |
| **Admin moderation UI (listing pending)** | **⚠️ WARN** |

**Status: ⚠️ SCHVÁLENO S UPOZORNĚNÍM**

WARN-1 není bloker — systém funguje, ale moderátor potřebuje nástroj k discovery pending komentářů. Doporučuji opravit v příštím sprintu.
