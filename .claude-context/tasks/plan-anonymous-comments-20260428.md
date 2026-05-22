# Plán: Komentáře na blogu bez registrace

**Datum:** 2026-04-28
**Autor:** planovač
**Task:** #51

---

## PROBLÉM

Blog komentáře aktuálně VYŽADUJÍ přihlášení:
- API: `app/api/blog/articles/[id]/comments/route.ts:71` — `if (!session?.user) return 401`
- UI: `components/web/blog/ArticleComments.tsx:113` — `isLoggedIn ? <form> : "Pro komentování se přihlaste"`
- Blog stránka: `app/(web)/blog/[slug]/page.tsx:375` — `isLoggedIn={!!session?.user}`

Uživatel chce aby anonymní návštěvníci mohli komentovat bez registrace.

---

## SOUČASNÝ STAV

### Prisma model (`prisma/schema.prisma:2176-2201`)
```prisma
model ProfileComment {
  id         String   @id @default(cuid())
  userId     String                        // ← REQUIRED, problém
  user       User     @relation(...)
  vehicleId  String?
  listingId  String?
  partId     String?
  articleId  String?
  text       String
  isHidden   Boolean  @default(false)      // ← pozor: false = viditelný
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### API: POST komentář
- Session required (line 71)
- Rate limit: 3/min per userId (lines 78-87)
- `isHidden: true` při vytvoření (line 91) — čeká na schválení ✅

### UI: ArticleComments
- Props: `articleId`, `initialComments`, `total`, `isLoggedIn`
- isLoggedIn=true → textarea + submit
- isLoggedIn=false → "Pro komentování se přihlaste" + link

### Admin moderace
- `/admin/blog/comments` — plně funkční ✅
- CommentsModeration: zobrazuje `c.author.firstName`, `c.author.lastName`, `c.author.email`

---

## IMPLEMENTACE

### Fáze 1: Prisma schema — userId nullable + nová pole

**Soubor:** `prisma/schema.prisma:2176-2201`

```prisma
model ProfileComment {
  id          String   @id @default(cuid())
  userId      String?                       // ← NULLABLE (anonymní komentáře)
  user        User?    @relation(...)       // ← NULLABLE
  authorName  String?                       // pro anonymní: "Jan Novák"
  authorEmail String?                       // pro anonymní: volitelný email
  authorIp    String?                       // IP adresa pro rate limiting

  // ... rest stays the same ...
  vehicleId   String?
  vehicle     Vehicle?  @relation(...)
  listingId   String?
  listing     Listing?  @relation(...)
  partId      String?
  part        Part?     @relation(...)
  articleId   String?
  article     Article?  @relation(...)

  text        String
  isHidden    Boolean   @default(true)      // ← ZMĚNA: default TRUE (čeká na schválení)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([vehicleId])
  @@index([listingId])
  @@index([partId])
  @@index([articleId])
  @@index([userId])
}
```

**DŮLEŽITÉ ZMĚNY:**
1. `userId` → `String?` (nullable)
2. `user` → `User?` (nullable relace)
3. `+authorName String?`
4. `+authorEmail String?`
5. `+authorIp String?`
6. `isHidden` default: `false` → `true` (POZOR: stávající komentáře to neovlivní, jen nové)

**Migrace:** `npx prisma migrate dev --name anonymous_comments`

**POZOR na isHidden default změnu:** Aktuálně je `@default(false)` ale v API POST se nastavuje `isHidden: true` explicitně (line 91). Změna defaultu na `true` je BEZPEČNÁ — stávající komentáře mají hodnotu uloženou v DB, default se aplikuje jen na nové záznamy. A API POST už stejně nastavuje `true` explicitně.

### Fáze 2: API route — povolit anonymní POST

**Soubor:** `app/api/blog/articles/[id]/comments/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";

// Schema pro přihlášeného uživatele
const authCommentSchema = z.object({
  text: z.string().min(5).max(1000),
});

// Schema pro anonymního uživatele
const anonCommentSchema = z.object({
  text: z.string().min(5).max(1000),
  authorName: z.string().min(2, "Jméno musí mít alespoň 2 znaky").max(100),
  authorEmail: z.string().email("Neplatný email").optional().or(z.literal("")),
  honeypot: z.string().max(0).optional(),  // musí být prázdné
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const body = await request.json();

  // Honeypot check (anonymní)
  if (!session?.user && body.honeypot) {
    // Bot detected — tiše vrátit success (neplést bota)
    return NextResponse.json({
      message: "Komentář odeslán ke schválení.",
    }, { status: 201 });
  }

  // Validace
  if (session?.user) {
    authCommentSchema.parse(body);
  } else {
    anonCommentSchema.parse(body);
  }

  // Rate limiting
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headersList.get("x-real-ip")
    || "unknown";

  if (session?.user) {
    // Přihlášený: 3/min per user (stávající logika)
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recentCount = await prisma.profileComment.count({
      where: { userId: session.user.id, createdAt: { gte: oneMinuteAgo } },
    });
    if (recentCount >= 3) {
      return NextResponse.json({ error: "Příliš mnoho komentářů." }, { status: 429 });
    }
  } else {
    // Anonymní: 5/hodinu per IP
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const recentCount = await prisma.profileComment.count({
      where: { authorIp: ip, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 5) {
      return NextResponse.json({ error: "Příliš mnoho komentářů. Zkuste to za hodinu." }, { status: 429 });
    }
  }

  // Vytvořit komentář
  const comment = await prisma.profileComment.create({
    data: {
      articleId: id,
      text: body.text,
      isHidden: true,  // vždy čeká na schválení
      ...(session?.user
        ? { userId: session.user.id }
        : {
            authorName: body.authorName,
            authorEmail: body.authorEmail || null,
            authorIp: ip,
          }),
    },
  });

  return NextResponse.json({
    comment: { id: comment.id },
    message: "Komentář odeslán. Zobrazí se po schválení administrátorem.",
  }, { status: 201 });
}
```

**GET zůstává beze změny** — jen přidat do response authorName pro anonymní komentáře:
```typescript
// V GET response mapování:
comments: comments.map((c) => ({
  id: c.id,
  text: c.text,
  isHidden: c.isHidden,
  createdAt: c.createdAt.toISOString(),
  author: c.user
    ? { id: c.user.id, firstName: c.user.firstName, lastName: c.user.lastName, avatar: c.user.avatar }
    : { id: null, firstName: c.authorName || "Anonym", lastName: "", avatar: null },
})),
```

### Fáze 3: UI — ArticleComments.tsx

**Soubor:** `components/web/blog/ArticleComments.tsx`

Změny:
1. **Odebrat prop `isLoggedIn`** — formulář je vždy viditelný
2. **Přidat prop `userName`** — jméno přihlášeného uživatele (auto-fill)
3. **Přidat pole `authorName`** — pro nepřihlášené (povinné)
4. **Přidat pole `authorEmail`** — pro nepřihlášené (volitelné)
5. **Přidat honeypot pole** — skryté, CSS `display: none`

```typescript
interface ArticleCommentsProps {
  articleId: string;
  initialComments: Comment[];
  total: number;
  userName?: string;  // jméno přihlášeného uživatele (auto-fill)
}

// Ve formuláři:
{/* Honeypot — skryté pro uživatele, boti ho vyplní */}
<input
  name="website"
  value={honeypot}
  onChange={(e) => setHoneypot(e.target.value)}
  style={{ position: "absolute", left: "-9999px", opacity: 0, tabIndex: -1 }}
  autoComplete="off"
  aria-hidden="true"
/>

{/* Jméno — jen pro nepřihlášené */}
{!userName && (
  <input
    value={authorName}
    onChange={(e) => setAuthorName(e.target.value)}
    placeholder="Vaše jméno *"
    required
    maxLength={100}
    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm ..."
  />
)}

{/* Email — jen pro nepřihlášené, volitelný */}
{!userName && (
  <input
    type="email"
    value={authorEmail}
    onChange={(e) => setAuthorEmail(e.target.value)}
    placeholder="Email (volitelné)"
    maxLength={200}
    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm ..."
  />
)}
```

### Fáze 4: Blog stránka — upravit props

**Soubor:** `app/(web)/blog/[slug]/page.tsx:365-375`

```typescript
// Aktuální:
<ArticleComments
  articleId={article.id}
  initialComments={approvedComments.map((c) => ({...}))}
  total={commentTotal}
  isLoggedIn={!!session?.user}
/>

// Nové:
<ArticleComments
  articleId={article.id}
  initialComments={approvedComments.map((c) => ({
    id: c.id,
    text: c.text,
    isHidden: c.isHidden,
    createdAt: c.createdAt.toISOString(),
    author: c.user
      ? c.user
      : { id: "", firstName: c.authorName || "Anonym", lastName: "", avatar: null },
  }))}
  total={commentTotal}
  userName={session?.user ? `${session.user.firstName} ${session.user.lastName}` : undefined}
/>
```

### Fáze 5: Admin moderace — zobrazit anon info

**Soubor:** `app/(admin)/admin/blog/comments/page.tsx:15-23`

Upravit query — include i authorName/authorEmail:
```typescript
const comments = await prisma.profileComment.findMany({
  where: { articleId: { not: null } },
  include: {
    user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
    article: { select: { title: true, slug: true } },
  },
  orderBy: { createdAt: "desc" },
  take: 100,
});
```

Ale `authorName` a `authorEmail` jsou přímo na `ProfileComment`, ne v relaci. Takže v mapování:
```typescript
comments.map((c) => ({
  id: c.id,
  text: c.text,
  isHidden: c.isHidden,
  createdAt: c.createdAt.toISOString(),
  author: c.user
    ? c.user
    : { firstName: c.authorName || "Anonym", lastName: "(nepřihlášený)", email: c.authorEmail || "—", avatar: null },
  article: c.article!,
}))
```

**CommentsModeration.tsx** — beze změny (zobrazuje `c.author.firstName`, `c.author.lastName`, `c.author.email` — funguje s oběma formáty).

---

## SOUBORY

| Soubor | Akce | Fáze |
|--------|------|------|
| `prisma/schema.prisma` | userId nullable, +authorName, +authorEmail, +authorIp, isHidden default true | 1 |
| `app/api/blog/articles/[id]/comments/route.ts` | POST: anon allowed, honeypot, IP rate limit. GET: authorName fallback | 2 |
| `components/web/blog/ArticleComments.tsx` | Form vždy viditelný, jméno/email pole pro anon, honeypot | 3 |
| `app/(web)/blog/[slug]/page.tsx` | Props: userName místo isLoggedIn, authorName mapping | 4 |
| `app/(admin)/admin/blog/comments/page.tsx` | Mapping: authorName/authorEmail pro anon komentáře | 5 |

**Celkem:** 0 nových + 5 upravených souborů

---

## STOP PRAVIDLA

1. **STOP** — `isHidden: true` default ZŮSTÁVÁ — admin schvaluje VŠECHNY komentáře (přihlášené i anonymní)
2. **STOP** — honeypot pole: CSS skryté, NE `type="hidden"` (boti detekují hidden inputs)
3. **STOP** — IP rate limit: 5/hodinu per IP pro anon, 3/min per user pro přihlášené
4. **STOP** — žádné CAPTCHA dependency — honeypot + rate limit + admin moderace stačí
5. **STOP** — `ProfileComment` model rozšířit, NE nový model
6. **STOP** — `authorIp` se NEZOBRAZUJE v UI (jen pro rate limiting)
7. **STOP** — nepřihlášený vidí "Vaše jméno *" (povinné) + "Email (volitelné)"
8. **STOP** — přihlášený vidí jen textarea (jméno auto-filled z session)
