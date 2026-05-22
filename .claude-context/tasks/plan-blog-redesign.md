# Implementační plán — Blog redesign (magazine systém)

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Status:** ČEKÁ NA SCHVÁLENÍ LEADEM

---

## Analýza aktuálního stavu

### Co UŽ existuje (solidní základ)

| Feature | Stav | Kde |
|---------|------|-----|
| Article model + Category + Tags | HOTOVO | `prisma/schema.prisma:2270-2328` |
| Blog listing s featured article | HOTOVO | `app/(web)/blog/page.tsx` (275 řádků) |
| Article detail s cover image | HOTOVO | `app/(web)/blog/[slug]/page.tsx` (313 řádků) |
| Category pages | HOTOVO | `app/(web)/blog/kategorie/[slug]/page.tsx` |
| Category sidebar | HOTOVO | blog/page.tsx řádky 238-269 |
| Reading time | HOTOVO | Article.readTime (schema) + zobrazení v UI |
| Author profile card | HOTOVO | blog/[slug]/page.tsx řádky 234-267 (avatar, bio, link) |
| ShareButtons (copy link + native share) | BASIC | blog/[slug]/ShareButtons.tsx — jen 2 tlačítka |
| Related articles | BASIC | blog/[slug]/page.tsx řádky 92-104 — jen ze stejné kategorie |
| View counter | HOTOVO | fire-and-forget increment (řádek 87-89) |
| Admin: CRUD, status flow, publish | HOTOVO | admin/blog/* (table, editor, publish API) |
| Admin: AI draft generator | HOTOVO | admin/blog/ai-drafts/ |
| Tags display | PARTIAL | Tagy se zobrazují na detailu, ale NEJSOU klikatelné/filtrovatelné |
| Article JSON-LD | HOTOVO | Article schema.org na detail page |
| Blog JSON-LD | HOTOVO | Blog schema.org na listing page |
| Pagination | HOTOVO | query param ?page= |

### Co CHYBÍ (požadavky uživatele)

| Feature | Priorita | Složitost |
|---------|----------|-----------|
| **Like/reakce systém** | VYSOKÁ | STŘEDNÍ — nový model + API + UI komponenta |
| **Komentáře s moderací** | VYSOKÁ | VYSOKÁ — nový model + API + UI + admin panel |
| **Social share buttons** (FB, X, LinkedIn, WhatsApp) | STŘEDNÍ | NÍZKÁ — rozšíření existujícího ShareButtons |
| **Related articles (vylepšení)** | STŘEDNÍ | NÍZKÁ — přidat tag-based matching |
| **Tag filtering na listing** | STŘEDNÍ | NÍZKÁ — přidat tag stránky |
| **Newsletter signup** | STŘEDNÍ | STŘEDNÍ — nový model + API + Resend integrace |
| **Magazine-style design** | NÍZKÁ | STŘEDNÍ — čistě UI refaktor |

---

## Prisma schema — nové modely

### Existující vzor: `ProfileLike` a `ProfileComment`

Projekt již má polymorfní Like/Comment systém (`prisma/schema.prisma:2118-2164`) pro Vehicle/Listing/Part. **Rozšíříme tento vzor o `articleId`** místo vytváření duplicitních modelů.

### Nové modely a rozšíření

```
1. ProfileLike — přidat articleId (rozšíření polymorfního targetu)
2. ProfileComment — přidat articleId (rozšíření polymorfního targetu)
3. ArticleReaction — NOVÝ (emoji reakce: like, heart, clap, fire, thinking)
4. NewsletterSubscriber — NOVÝ
```

---

## Implementační plán — 6 fází

### FÁZE 1: Schema rozšíření + migrace (~20 řádků)

**Soubor:** `prisma/schema.prisma`

#### 1.1 — Rozšířit ProfileLike o articleId

```prisma
model ProfileLike {
  // ... existující pole ...
  articleId  String?
  article    Article?  @relation("ArticleLikes", fields: [articleId], references: [id], onDelete: Cascade)

  // Přidat unique constraint
  @@unique([userId, articleId])
  // Přidat index
  @@index([articleId])
}
```

#### 1.2 — Rozšířit ProfileComment o articleId

```prisma
model ProfileComment {
  // ... existující pole ...
  articleId  String?
  article    Article?  @relation("ArticleComments", fields: [articleId], references: [id], onDelete: Cascade)

  // Přidat index
  @@index([articleId])
}
```

#### 1.3 — Nový model ArticleReaction

```prisma
model ArticleReaction {
  id         String   @id @default(cuid())
  articleId  String
  article    Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  userId     String?  // Null = anonymní (cookie-based)
  user       User?    @relation("UserArticleReactions", fields: [userId], references: [id], onDelete: Cascade)
  sessionId  String?  // Fallback pro nepřihlášené (z cookie)
  type       String   // LIKE, HEART, CLAP, FIRE, THINKING

  createdAt  DateTime @default(now())

  @@unique([articleId, userId, type])
  @@unique([articleId, sessionId, type])
  @@index([articleId])
}
```

#### 1.4 — Nový model NewsletterSubscriber

```prisma
model NewsletterSubscriber {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  status          String    @default("ACTIVE") // ACTIVE, UNSUBSCRIBED
  source          String    @default("BLOG")   // BLOG, FOOTER, POPUP
  confirmedAt     DateTime?
  unsubscribedAt  DateTime?

  createdAt       DateTime  @default(now())

  @@index([status])
  @@index([email])
}
```

#### 1.5 — Rozšířit Article model

```prisma
model Article {
  // ... existující pole ...

  // Nové relace
  likes       ProfileLike[]      @relation("ArticleLikes")
  comments    ProfileComment[]   @relation("ArticleComments")
  reactions   ArticleReaction[]
}
```

#### 1.6 — Rozšířit User model

```prisma
model User {
  // ... existující pole ...
  articleReactions ArticleReaction[] @relation("UserArticleReactions")
}
```

**Migrace:** `npx prisma migrate dev --name add-blog-engagement`

---

### FÁZE 2: API routes (~5 souborů, ~300 řádků)

#### 2.1 — `app/api/blog/articles/[id]/reactions/route.ts`

```
GET  /api/blog/articles/[id]/reactions
     → { counts: { LIKE: 12, HEART: 5, ... }, userReactions: ["LIKE"] }
     Auth: optional (anonymní vidí počty, přihlášení i své reakce)

POST /api/blog/articles/[id]/reactions
     Body: { type: "LIKE" | "HEART" | "CLAP" | "FIRE" | "THINKING" }
     Auth: optional (userId nebo sessionId z cookie)
     Toggle: pokud existuje → smaže, pokud ne → vytvoří

DELETE /api/blog/articles/[id]/reactions
     Body: { type: "LIKE" }
     → Odstraní reakci
```

**Logika:**
- Přihlášený uživatel: userId z session
- Nepřihlášený: sessionId z cookie `cm_session` (vytvořit pokud neexistuje)
- Rate limit: max 5 typů reakcí na článek na uživatele/session
- Revalidate cache po změně

#### 2.2 — `app/api/blog/articles/[id]/comments/route.ts`

```
GET  /api/blog/articles/[id]/comments?page=1
     → { comments: [...], total, totalPages }
     Vrací jen isHidden=false (+ ADMIN vidí všechny)
     Seřazeno: newest first

POST /api/blog/articles/[id]/comments
     Body: { text: string }
     Auth: REQUIRED (přihlášený uživatel)
     Validace: text 5-1000 znaků, Zod
     Auto-moderation: isHidden=false default (pre-approved)
```

#### 2.3 — `app/api/blog/articles/[id]/comments/[commentId]/route.ts`

```
DELETE /api/blog/articles/[id]/comments/[commentId]
     Auth: vlastník komentáře NEBO ADMIN/BACKOFFICE

PATCH  /api/blog/articles/[id]/comments/[commentId]
     Body: { isHidden: boolean }
     Auth: ADMIN/BACKOFFICE only (moderace)
```

#### 2.4 — `app/api/newsletter/subscribe/route.ts`

```
POST /api/newsletter/subscribe
     Body: { email: string, name?: string, source?: string }
     Validace: email Zod, honeypot pole
     Logika:
     1. Upsert NewsletterSubscriber (email unique)
     2. Poslat potvrzovací email přes Resend (lib/resend.ts existuje)
     3. Status ACTIVE hned (single opt-in; double opt-in = fáze 2)
```

#### 2.5 — `app/api/newsletter/unsubscribe/route.ts`

```
GET /api/newsletter/unsubscribe?email=...&token=...
    → Nastaví status=UNSUBSCRIBED, redirect na success page
```

---

### FÁZE 3: Client komponenty (~5 souborů, ~500 řádků)

#### 3.1 — `components/web/blog/ArticleReactions.tsx` (~120 řádků)

Emoji reakce bar pod článkem (jako Medium/DEV.to).

```
"use client"

Reakce: 👍 Like, ❤️ Heart, 👏 Clap, 🔥 Fire, 🤔 Thinking

UI:
┌──────────────────────────────────────────────┐
│  👍 12   ❤️ 5   👏 8   🔥 3   🤔 1          │
└──────────────────────────────────────────────┘

Klik na emoji → toggle (přidá/odebere)
Přihlášený: instant feedback + API call
Nepřihlášený: cookie-based (sessionId)
Animace: Framer Motion scale bounce na toggle
Optimistic update: okamžitě zobrazit, revert při chybě
```

**Props:** `{ articleId: string, initialCounts: Record<string, number>, initialUserReactions: string[] }`

#### 3.2 — `components/web/blog/ArticleComments.tsx` (~200 řádků)

Komentářová sekce pod článkem.

```
"use client"

UI:
┌──────────────────────────────────────────────┐
│  Komentáře (12)                              │
│                                              │
│  ┌─ Comment form (jen přihlášení) ─────────┐ │
│  │  [Avatar] Napište komentář...           │ │
│  │                           [Odeslat]     │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  [Avatar] Jan Novák · 2h                     │
│  Text komentáře...                           │
│                                              │
│  [Avatar] Petra K. · 1d                      │
│  Text komentáře...                           │
│                                              │
│  [Načíst další komentáře]                    │
└──────────────────────────────────────────────┘

Nepřihlášení: vidí komentáře + "Přihlaste se pro komentování"
Přihlášení: form + submit
Pagination: load more (infinite scroll nebo button)
Optimistic insert: komentář se objeví hned
```

**Props:** `{ articleId: string, initialComments: Comment[], total: number }`

#### 3.3 — `components/web/blog/ShareButtons.tsx` — REFAKTOR

Rozšířit existující `app/(web)/blog/[slug]/ShareButtons.tsx` o social share:

```
UI:
┌──────────────────────────────────────────────┐
│  Sdílet:  [FB] [X] [LinkedIn] [WhatsApp] [📋 Kopírovat] │
└──────────────────────────────────────────────┘

Share URLs:
- Facebook:  https://www.facebook.com/sharer/sharer.php?u={url}
- X/Twitter: https://twitter.com/intent/tweet?url={url}&text={title}
- LinkedIn:  https://www.linkedin.com/sharing/share-offsite/?url={url}
- WhatsApp:  https://api.whatsapp.com/send?text={title}%20{url}
- Copy link: navigator.clipboard (existující)
- Native share: navigator.share (existující, mobil)

Ikony: SVG inline (bez icon library dependency)
Target: _blank, rel="noopener noreferrer"
```

#### 3.4 — `components/web/blog/NewsletterSignup.tsx` (~80 řádků)

Newsletter signup box — vloží se na konec článku a do sidebaru.

```
"use client"

UI:
┌──────────────────────────────────────────────┐
│  📬 Nechte si posílat nové články            │
│  Jednou týdně ty nejlepší rady o autech.     │
│                                              │
│  [email@example.com    ] [Odebírat]          │
│                                              │
│  Žádný spam. Odhlásíte se jedním klikem.     │
└──────────────────────────────────────────────┘

Stav: idle → loading → success ("Děkujeme! ✓") / error
Validace: client-side email regex + server Zod
Honeypot: hidden `name` field pro bot protection
```

#### 3.5 — `components/web/blog/TagCloud.tsx` (~50 řádků)

Tag cloud/filter pro blog listing stránku.

```
Server Component (data z Prisma)

UI: Badge list — klikatelné tagy, které filtrují články
Navigace: /blog?tag={slug}

Zobrazit: top 15 tagů seřazených dle počtu článků
```

---

### FÁZE 4: Integrace do stránek

#### 4.1 — `app/(web)/blog/[slug]/page.tsx` — rozšíření detail stránky

**Přidat data loading:**
```typescript
// Za related articles query (řádek 92)
const [reactionCounts, userReactions, comments, commentCount] = await Promise.all([
  prisma.articleReaction.groupBy({
    by: ["type"],
    where: { articleId: article.id },
    _count: true,
  }),
  session?.user
    ? prisma.articleReaction.findMany({
        where: { articleId: article.id, userId: session.user.id },
        select: { type: true },
      })
    : [],
  prisma.profileComment.findMany({
    where: { articleId: article.id, isHidden: false },
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  }),
  prisma.profileComment.count({ where: { articleId: article.id, isHidden: false } }),
]);
```

**Přidat do JSX (za Tags, před Share):**
```tsx
{/* Reactions */}
<ArticleReactions
  articleId={article.id}
  initialCounts={Object.fromEntries(reactionCounts.map(r => [r.type, r._count]))}
  initialUserReactions={userReactions.map(r => r.type)}
/>

{/* Comments */}
<ArticleComments
  articleId={article.id}
  initialComments={comments}
  total={commentCount}
/>

{/* Newsletter */}
<NewsletterSignup />
```

#### 4.2 — `app/(web)/blog/page.tsx` — rozšíření listing stránky

**Přidat tag loading:**
```typescript
// V Promise.all (řádek 51)
tags: prisma.articleTag.findMany({
  include: { _count: { select: { articles: true } } },
  orderBy: { articles: { _count: "desc" } },
  take: 15,
}),
```

**Přidat do sidebar (za kategorie):**
```tsx
{/* Tags */}
<div className="mt-8">
  <h2 className="font-bold text-lg mb-4">Témata</h2>
  <div className="flex flex-wrap gap-2">
    {tags.map(tag => (
      <Link
        key={tag.id}
        href={`/blog?tag=${tag.slug}`}
        className="..."
      >
        #{tag.name} <span className="text-xs">({tag._count.articles})</span>
      </Link>
    ))}
  </div>
</div>
```

**Přidat Newsletter signup na konec sidebaru.**

#### 4.3 — Related articles vylepšení

Aktuální logika (řádek 92-104): jen articles ze stejné kategorie.

**Vylepšení — tag-based matching:**
```typescript
const articleTagIds = article.tags.map(t => t.tagId);

const related = await prisma.article.findMany({
  where: {
    status: "PUBLISHED",
    id: { not: article.id },
    OR: [
      { categoryId: article.categoryId },
      { tags: { some: { tagId: { in: articleTagIds } } } },
    ],
  },
  include: { ... },
  orderBy: { publishedAt: "desc" },
  take: 3,
});
```

---

### FÁZE 5: Admin panel — moderace komentářů

#### 5.1 — `app/(admin)/admin/blog/comments/page.tsx` (~100 řádků)

Nová stránka pro moderaci komentářů v admin panelu.

```
UI:
- Tabulka komentářů s filtrem (Všechny / Skryté / Nové)
- Sloupce: Článek | Autor | Text | Datum | Stav | Akce
- Akce: Skrýt / Zobrazit / Smazat
- Počet nových komentářů v navigaci (badge)
```

#### 5.2 — `app/(admin)/admin/blog/page.tsx` — rozšíření

Přidat do tabulky článků sloupce:
- **Reakce** (celkový počet)
- **Komentáře** (počet)

#### 5.3 — Admin navigace

Přidat odkaz "Komentáře" do admin blog navigace.

---

### FÁZE 6: Newsletter admin + Resend integrace

#### 6.1 — `app/(admin)/admin/newsletter/page.tsx`

Správa odběratelů:
- Seznam subscribers s filtrem (ACTIVE / UNSUBSCRIBED)
- Export CSV
- Statistiky (celkem, tento měsíc, unsubscribed)

#### 6.2 — Resend integrace

Rozšířit `lib/resend.ts`:
- `sendNewsletterConfirmation(email)` — potvrzovací email po subscribu
- `sendNewsletterWeekly(articles[])` — týdenní digest (cron/manuální trigger)

---

## Soubory k vytvoření

| # | Soubor | Typ | Popis |
|---|--------|-----|-------|
| 1 | `components/web/blog/ArticleReactions.tsx` | Component | Emoji reakce bar |
| 2 | `components/web/blog/ArticleComments.tsx` | Component | Komentářová sekce |
| 3 | `components/web/blog/NewsletterSignup.tsx` | Component | Newsletter formulář |
| 4 | `components/web/blog/TagCloud.tsx` | Component | Tag filter |
| 5 | `app/api/blog/articles/[id]/reactions/route.ts` | API | CRUD reakcí |
| 6 | `app/api/blog/articles/[id]/comments/route.ts` | API | GET/POST komentářů |
| 7 | `app/api/blog/articles/[id]/comments/[commentId]/route.ts` | API | DELETE/PATCH komentáře |
| 8 | `app/api/newsletter/subscribe/route.ts` | API | Newsletter subscribe |
| 9 | `app/api/newsletter/unsubscribe/route.ts` | API | Newsletter unsubscribe |
| 10 | `app/(admin)/admin/blog/comments/page.tsx` | Page | Admin moderace komentářů |
| 11 | `app/(admin)/admin/newsletter/page.tsx` | Page | Admin newsletter správa |

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 12 | `prisma/schema.prisma` | +ArticleReaction, +NewsletterSubscriber, rozšíření ProfileLike/ProfileComment o articleId, rozšíření Article/User relací |
| 13 | `app/(web)/blog/[slug]/page.tsx` | Přidat reactions, comments, newsletter do detail stránky |
| 14 | `app/(web)/blog/[slug]/ShareButtons.tsx` | Rozšířit o FB, X, LinkedIn, WhatsApp ikony |
| 15 | `app/(web)/blog/page.tsx` | Přidat tag filtrování, newsletter v sidebaru, tag query param |
| 16 | `app/(admin)/admin/blog/page.tsx` | Přidat sloupce reakcí/komentářů do tabulky |
| 17 | `lib/resend.ts` | Přidat newsletter email funkce |

---

## STOP kritéria

1. [ ] Emoji reakce (5 typů) fungují na článku — toggle, počítadlo, animace
2. [ ] Anonymní uživatel může reagovat (cookie-based sessionId)
3. [ ] Přihlášený uživatel může reagovat (userId)
4. [ ] Komentáře: přihlášený může přidat komentář pod článek
5. [ ] Komentáře: nepřihlášený vidí komentáře + výzvu k přihlášení
6. [ ] Admin: moderace komentářů (skrýt/zobrazit/smazat)
7. [ ] ShareButtons: FB, X, LinkedIn, WhatsApp, copy link
8. [ ] Related articles: tag-based matching (nejen kategorie)
9. [ ] Tag filtering: /blog?tag=... filtruje články podle tagu
10. [ ] Newsletter: signup formulář na článku i v sidebaru
11. [ ] Newsletter: subscriber uložen do DB, potvrzovací email odeslán
12. [ ] Admin: newsletter subscribers stránka s exportem
13. [ ] `npm run build` projde bez chyb

---

## Pořadí implementace (doporučení)

1. **FÁZE 1** — Schema + migrace (na tom závisí vše)
2. **FÁZE 2** — API routes (na tom závisí komponenty)
3. **FÁZE 3.3** — ShareButtons refaktor (nejjednodušší, quick win)
4. **FÁZE 3.1** — ArticleReactions + 4.1 integrace
5. **FÁZE 3.2** — ArticleComments + 4.1 integrace
6. **FÁZE 3.5 + 4.2** — TagCloud + listing rozšíření
7. **FÁZE 3.4 + 4.2** — NewsletterSignup + sidebar
8. **FÁZE 5** — Admin moderace komentářů
9. **FÁZE 6** — Admin newsletter + Resend

---

## Rizika

| Riziko | Pravděpodobnost | Mitigace |
|--------|----------------|----------|
| ProfileLike/ProfileComment rozšíření rozbije existující queries | STŘEDNÍ | articleId je nullable, existující kód nemění; přidat migrace opatrně |
| Spam komentářů | VYSOKÁ | Rate limit (max 3 komentáře/min/user), honeypot, isHidden default false ale admin může skrýt |
| Anonymní reakce abuse | STŘEDNÍ | Cookie-based sessionId + rate limit per IP/session |
| tsvector drift při migrate dev | JISTÁ | Standardní fix: `migrate reset --force` v dev |
| Newsletter double opt-in | NÍZKÁ | MVP = single opt-in, double opt-in = fáze 2 |
| Velký počet komentářů | NÍZKÁ | Pagination (load more, 10 per page) |

---

## Rozhodnutí k potvrzení leadem

1. **Reakce: anonymní nebo jen přihlášení?** Plán navrhuje obojí (cookie fallback pro nepřihlášené). Lead rozhodne.
2. **Komentáře: pre-approved nebo moderace first?** Plán navrhuje pre-approved (isHidden=false) s možností skrýt. Alternativa: komentáře čekají na schválení.
3. **Newsletter: single vs double opt-in?** Plán navrhuje single opt-in pro MVP.
4. **Existující ProfileLike/ProfileComment rozšíření vs nové modely?** Plán navrhuje rozšíření polymorfního patternu (konzistentní s Vehicle/Listing/Part likes).

---

*Plán připraven: 2026-04-26*  
*Čeká na schválení team leadem*
