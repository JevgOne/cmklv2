# QA — Blog redesign: reactions, comments, newsletter, sharing
**Commit:** `9e04d4f`  
**Datum:** 2026-04-26  
**Kontrolor:** kontrolor

---

## STOP kritéria — 13/13 PASS ✅

| # | Kritérium | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | Prisma migrace — ArticleReaction, NewsletterSubscriber, ProfileComment.articleId | ✅ PASS | Všechny modely + relace v schema.prisma |
| 2 | Emoji reakce — 5 typů, toggle, Framer Motion | ✅ PASS | LIKE/HEART/CLAP/FIRE/THINKING, optimistic update, animace |
| 3 | Anonymní reakce — cookie cm_session | ✅ PASS | `getSessionId()` async + `await cookies()` (Next.js 15 compat) |
| 4 | Přihlášený komentář → "čeká na schválení" | ✅ PASS | POST nastavuje `isHidden: true`, rate limit 3/min |
| 5 | Nepřihlášený vidí komentáře + výzvu | ✅ PASS | `isLoggedIn` prop, fallback CTA s odkazem na /prihlaseni |
| 6 | Admin /admin/blog/comments — schválit/skrýt/smazat | ✅ PASS | CommentsModeration client, API `/api/admin/comments/[commentId]` |
| 7 | ShareButtons: FB, X, LinkedIn, WhatsApp, copy link | ✅ PASS | Všechny 4 kanály + clipboard fallback |
| 8 | Related articles — tag-based matching | ✅ PASS | OR: categoryId + tagIds v query |
| 9 | Klikatelné tagy → /blog?tag=... | ✅ PASS | Tags wrapped v `<Link>` |
| 10 | Tag filtrování na blog listing | ✅ PASS | `tagSlug` param, `articleTag.findUnique` → `where.tags` |
| 11 | Newsletter signup — na článku + v sidebaru | ✅ PASS | `<NewsletterSignup />` na obou místech |
| 12 | Newsletter double opt-in | ✅ PASS | subscribe → PENDING + email → confirm → ACTIVE, token invalidován |
| 13 | `npm run build` projde | ✅ PASS | **1282/1282** stránek, 0 chyb |

---

## Bod po bodu — detailní ověření

### 1. Prisma schema

| Požadavek | Kde | Stav |
|-----------|-----|------|
| `ArticleReaction` model | schema.prisma:2170 | ✅ |
| `@@unique([articleId, userId, type])` | schema.prisma:2181 | ✅ |
| `@@unique([articleId, sessionId, type])` | schema.prisma:2182 | ✅ |
| `@@index([articleId])` | schema.prisma:2183 | ✅ |
| `NewsletterSubscriber` model | schema.prisma:2190 | ✅ |
| `confirmToken String? @unique` | schema.prisma:2196 | ✅ |
| `ProfileComment.articleId` + relace | schema.prisma:2154-2155 | ✅ |
| `@@index([articleId])` v ProfileComment | schema.prisma:2166 | ✅ |
| `Article.comments + reactions` relace | schema.prisma:2332-2333 | ✅ |
| `User.articleReactions` relace | schema.prisma:166 | ✅ |

### 2. API routes (5 endpointů)

| Route | Metody | Stav |
|-------|--------|------|
| `/api/blog/articles/[id]/reactions/route.ts` | GET + POST | ✅ |
| `/api/blog/articles/[id]/comments/route.ts` | GET + POST | ✅ |
| `/api/blog/articles/[id]/comments/[commentId]/route.ts` | PATCH + DELETE | ✅ |
| `/api/newsletter/subscribe/route.ts` | POST | ✅ |
| `/api/newsletter/confirm/route.ts` | GET | ✅ |
| `/api/admin/comments/[commentId]/route.ts` | PATCH + DELETE | ✅ (bonus) |

### 3. Komponenty

| Soubor | Stav | Detail |
|--------|------|--------|
| `ArticleReactions.tsx` | ✅ | framer-motion@^12.38, AnimatePresence, 5 emoji |
| `ArticleComments.tsx` | ✅ | pagination, auth-gated form, timeAgo |
| `NewsletterSignup.tsx` | ✅ | honeypot field, success state, error state |
| `ShareButtons.tsx` (refaktor) | ✅ | FB, X (Twitter), LinkedIn, WhatsApp, clipboard |

### 4. Stránky

| Stránka | Změna | Stav |
|---------|-------|------|
| `blog/[slug]/page.tsx` | Reactions + Comments + Newsletter + tag-based related + klikatelné tagy | ✅ |
| `blog/page.tsx` | Tag filtering + articleTags query + Newsletter sidebar | ✅ |

### 5. Admin

| Soubor | Stav |
|--------|------|
| `app/(admin)/admin/blog/comments/page.tsx` | ✅ |
| `app/(admin)/admin/blog/comments/CommentsModeration.tsx` | ✅ |
| CommentsModeration URL: `/api/admin/comments/${commentId}` | ✅ |
| `AdminSidebar.tsx:93` — Komentáře odkaz | ✅ |

---

## Simplify kontrola — drobné nálezy (P3 / info)

**ArticleReactions.tsx** — optimistic revert logika je duplikována 2× (v `else` větvi a v `catch` bloku). Možná extrakce do `revertReaction()` helper funkce. Neblokuje.

**CommentsModeration.tsx** — `handleModerate` a `handleDelete` mají identickou strukturu (setLoading + fetch + setState). Kandidát na `handleAction()` abstrakci. Neblokuje.

**DB poznámka:** `@@unique([articleId, sessionId, type])` — v PostgreSQL NULL ≠ NULL, takže constraint neplatí pro sessionId=NULL záznamy. V praxi API vždy nastaví buď userId nebo sessionId (nikdy obojí null), takže business logika toto ošetřuje. Žádné riziko za předpokladu, že API route zůstane správně implementována.

---

## Debug

- **TypeScript:** ✅ 0 chyb v nových souborech (verifikováno `npx tsc --noEmit`)
- **Build:** ✅ 1282/1282 stránek (o 1 více než minulý build — `/admin/blog/comments`)
- **framer-motion:** ✅ `^12.38.0` v package.json

---

## Verdikt

**SCHVÁLENO ✅ — 13/13 STOP kritérií splněno**

Implementace kompletní a správná. Commit `9e04d4f` připraven pro deploy.
