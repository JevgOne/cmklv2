# Implementace — Blog redesign (magazine systém)

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Zdroj:** plan-blog-redesign.md + lead decisions  
**Status:** ČEKÁ NA IMPLEMENTACI

---

## Rozhodnutí leada

1. **Anonymní reakce:** ANO — cookie-based sessionId
2. **Komentáře:** MODERACE-FIRST — `isHidden=true` default, admin schvaluje
3. **Newsletter:** DOUBLE OPT-IN — potvrzovací email přes Resend
4. **Modely:** Nový `ArticleReaction` + rozšíření `ProfileComment` o `articleId`

---

## Přehled

| Fáze | Popis | Soubory |
|------|-------|---------|
| 1 | Prisma schema + migrace | 1 (schema.prisma) |
| 2 | API routes | 5 nových |
| 3 | Client komponenty | 4 nové + 1 refaktor |
| 4 | Integrace do stránek | 2 úpravy |
| 5 | Admin panel | 2 nové + 2 úpravy |
| 6 | Newsletter Resend | 1 úprava |

**Celkem:** 11 nových souborů + 6 úprav

---

## FÁZE 1: Prisma schema + migrace

**Soubor:** `prisma/schema.prisma`

### 1.1 — Rozšířit ProfileComment o articleId

**Řádek 2152 (za `partId` a `part` řádky) — přidat:**

```prisma
  articleId  String?
  article    Article?  @relation("ArticleComments", fields: [articleId], references: [id], onDelete: Cascade)
```

**Řádek 2155 — změnit default isHidden:**

Stávající:
```prisma
  isHidden   Boolean   @default(false)
```

**NEMĚNIT** — default false zůstává pro Vehicle/Listing/Part komentáře. Blog komentáře budou mít `isHidden: true` nastaveno v API route POST handleru.

**Řádek 2162 (za `@@index([partId])`) — přidat:**

```prisma
  @@index([articleId])
```

### 1.2 — Nový model ArticleReaction

**Za řádek 2164 (konec ProfileComment modelu) — vložit:**

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

### 1.3 — Nový model NewsletterSubscriber

**Za konec ArticleReaction modelu — vložit:**

```prisma

// ============================================
// NEWSLETTER
// ============================================

model NewsletterSubscriber {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  status          String    @default("PENDING") // PENDING, ACTIVE, UNSUBSCRIBED
  source          String    @default("BLOG")    // BLOG, FOOTER, POPUP
  confirmToken    String?   @unique             // Token pro double opt-in
  confirmedAt     DateTime?
  unsubscribedAt  DateTime?

  createdAt       DateTime  @default(now())

  @@index([status])
}
```

### 1.4 — Rozšířit Article model o relace

**Řádek 2292 (za `tags` relaci) — přidat:**

```prisma
  comments       ProfileComment[]   @relation("ArticleComments")
  reactions      ArticleReaction[]
```

### 1.5 — Rozšířit User model o articleReactions relaci

**Řádek 165 (za `articles` relaci) — přidat:**

```prisma
  articleReactions ArticleReaction[] @relation("UserArticleReactions")
```

### 1.6 — Migrace

```bash
npx prisma migrate dev --name add-blog-engagement
```

**POZOR:** Pokud tsvector drift → `npx prisma migrate reset --force` (jen dev).

Po migraci: `npx prisma generate`

---

## FÁZE 2: API routes

### 2.1 — Vytvořit `app/api/blog/articles/[id]/reactions/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { z } from "zod";

const reactionSchema = z.object({
  type: z.enum(["LIKE", "HEART", "CLAP", "FIRE", "THINKING"]),
});

function getSessionId(): string {
  const cookieStore = cookies();
  let sid = cookieStore.get("cm_session")?.value;
  if (!sid) {
    sid = crypto.randomUUID();
    // Cookie bude nastaven v response
  }
  return sid;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const counts = await prisma.articleReaction.groupBy({
      by: ["type"],
      where: { articleId: id },
      _count: true,
    });

    const countsMap: Record<string, number> = {};
    for (const c of counts) {
      countsMap[c.type] = c._count;
    }

    let userReactions: string[] = [];
    if (session?.user?.id) {
      const mine = await prisma.articleReaction.findMany({
        where: { articleId: id, userId: session.user.id },
        select: { type: true },
      });
      userReactions = mine.map((r) => r.type);
    } else {
      const sid = getSessionId();
      const mine = await prisma.articleReaction.findMany({
        where: { articleId: id, sessionId: sid },
        select: { type: true },
      });
      userReactions = mine.map((r) => r.type);
    }

    return NextResponse.json({ counts: countsMap, userReactions });
  } catch (error) {
    console.error("GET reactions error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type } = reactionSchema.parse(body);

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const sessionId = userId ? null : getSessionId();

    // Toggle: existuje → smaž, neexistuje → vytvoř
    const existing = await prisma.articleReaction.findFirst({
      where: {
        articleId: id,
        type,
        ...(userId ? { userId } : { sessionId }),
      },
    });

    if (existing) {
      await prisma.articleReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.articleReaction.create({
        data: {
          articleId: id,
          type,
          userId,
          sessionId,
        },
      });
    }

    // Vrátit aktualizované počty
    const counts = await prisma.articleReaction.groupBy({
      by: ["type"],
      where: { articleId: id },
      _count: true,
    });

    const countsMap: Record<string, number> = {};
    for (const c of counts) {
      countsMap[c.type] = c._count;
    }

    const response = NextResponse.json({
      counts: countsMap,
      toggled: !existing,
    });

    // Nastavit session cookie pro anonymní
    if (!userId && sessionId) {
      response.cookies.set("cm_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 rok
        path: "/",
      });
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatný typ reakce" }, { status: 400 });
    }
    console.error("POST reactions error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
```

### 2.2 — Vytvořit `app/api/blog/articles/[id]/comments/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
  text: z.string().min(5, "Komentář musí mít alespoň 5 znaků").max(1000, "Komentář může mít max 1000 znaků"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = 10;

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && ["ADMIN", "BACKOFFICE"].includes(session.user.role);

    // Admin vidí i skryté komentáře
    const where = {
      articleId: id,
      ...(!isAdmin && { isHidden: false }),
    };

    const [comments, total] = await Promise.all([
      prisma.profileComment.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.profileComment.count({ where }),
    ]);

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        text: c.text,
        isHidden: c.isHidden,
        createdAt: c.createdAt.toISOString(),
        author: c.user,
      })),
      total,
      totalPages: Math.ceil(total / perPage),
      page,
    });
  } catch (error) {
    console.error("GET comments error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Pro komentování se přihlaste" }, { status: 401 });
    }

    const body = await request.json();
    const { text } = commentSchema.parse(body);

    // Rate limit: max 3 komentáře za minutu
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recentCount = await prisma.profileComment.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: oneMinuteAgo },
      },
    });
    if (recentCount >= 3) {
      return NextResponse.json({ error: "Příliš mnoho komentářů. Zkuste to za chvíli." }, { status: 429 });
    }

    // MODERACE-FIRST: isHidden=true — komentář čeká na schválení
    const comment = await prisma.profileComment.create({
      data: {
        articleId: id,
        userId: session.user.id,
        text,
        isHidden: true,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        text: comment.text,
        isHidden: comment.isHidden,
        createdAt: comment.createdAt.toISOString(),
        author: comment.user,
      },
      message: "Komentář odeslán. Zobrazí se po schválení administrátorem.",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST comment error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
```

### 2.3 — Vytvořit `app/api/blog/articles/[id]/comments/[commentId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const moderateSchema = z.object({
  isHidden: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Nedostatečná oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const { isHidden } = moderateSchema.parse(body);

    const comment = await prisma.profileComment.update({
      where: { id: commentId },
      data: { isHidden },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data" }, { status: 400 });
    }
    console.error("PATCH comment error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const comment = await prisma.profileComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: "Komentář nenalezen" }, { status: 404 });
    }

    // Vlastník nebo admin může smazat
    const isOwner = comment.userId === session.user.id;
    const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Nedostatečná oprávnění" }, { status: 403 });
    }

    await prisma.profileComment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE comment error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
```

### 2.4 — Vytvořit `app/api/newsletter/subscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, RESEND_FROM } from "@/lib/resend";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Neplatný email"),
  name: z.string().max(100).optional(),
  source: z.enum(["BLOG", "FOOTER", "POPUP"]).optional(),
  honeypot: z.string().max(0).optional(), // Bot trap — musí být prázdné
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = subscribeSchema.parse(body);

    // Honeypot check
    if (data.honeypot) {
      // Bot detected — tiše vrátíme úspěch
      return NextResponse.json({ success: true });
    }

    const confirmToken = crypto.randomUUID();

    // Upsert — pokud email existuje a je PENDING/UNSUBSCRIBED, aktualizovat
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        name: data.name,
        source: data.source || "BLOG",
        status: "PENDING",
        confirmToken,
      },
      update: {
        name: data.name || undefined,
        status: "PENDING",
        confirmToken,
        unsubscribedAt: null,
      },
    });

    // Double opt-in — poslat potvrzovací email
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"}/api/newsletter/confirm?token=${confirmToken}`;

    await sendEmail({
      from: RESEND_FROM,
      to: data.email,
      subject: "Potvrďte odběr novinek — CarMakléř",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #F97316;">Potvrďte odběr novinek</h2>
          <p>Děkujeme za zájem o novinky z CarMakléř blogu!</p>
          <p>Pro aktivaci odběru klikněte na tlačítko:</p>
          <a href="${confirmUrl}" 
             style="display: inline-block; background: #F97316; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Potvrdit odběr
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            Pokud jste se nepřihlásili k odběru, tento email ignorujte.
          </p>
        </div>
      `,
      text: `Potvrďte odběr novinek CarMakléř: ${confirmUrl}`,
    });

    return NextResponse.json({
      success: true,
      message: "Na váš email jsme odeslali potvrzovací odkaz.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
```

### 2.5 — Vytvořit `app/api/newsletter/confirm/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/blog?newsletter=error", request.url));
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { confirmToken: token },
    });

    if (!subscriber) {
      return NextResponse.redirect(new URL("/blog?newsletter=error", request.url));
    }

    if (subscriber.status === "ACTIVE") {
      return NextResponse.redirect(new URL("/blog?newsletter=already", request.url));
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "ACTIVE",
        confirmedAt: new Date(),
        confirmToken: null, // Invalidovat token
      },
    });

    return NextResponse.redirect(new URL("/blog?newsletter=confirmed", request.url));
  } catch (error) {
    console.error("Newsletter confirm error:", error);
    return NextResponse.redirect(new URL("/blog?newsletter=error", request.url));
  }
}
```

---

## FÁZE 3: Client komponenty

### 3.1 — Vytvořit `components/web/blog/ArticleReactions.tsx`

```typescript
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const REACTION_TYPES = [
  { type: "LIKE", emoji: "👍", label: "Líbí se" },
  { type: "HEART", emoji: "❤️", label: "Super" },
  { type: "CLAP", emoji: "👏", label: "Výborné" },
  { type: "FIRE", emoji: "🔥", label: "Hot" },
  { type: "THINKING", emoji: "🤔", label: "Zajímavé" },
] as const;

interface ArticleReactionsProps {
  articleId: string;
  initialCounts: Record<string, number>;
  initialUserReactions: string[];
}

export function ArticleReactions({
  articleId,
  initialCounts,
  initialUserReactions,
}: ArticleReactionsProps) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [userReactions, setUserReactions] = useState<string[]>(initialUserReactions);
  const [animating, setAnimating] = useState<string | null>(null);

  const handleToggle = useCallback(
    async (type: string) => {
      const isActive = userReactions.includes(type);

      // Optimistic update
      setUserReactions((prev) =>
        isActive ? prev.filter((t) => t !== type) : [...prev, type]
      );
      setCounts((prev) => ({
        ...prev,
        [type]: (prev[type] || 0) + (isActive ? -1 : 1),
      }));
      setAnimating(type);
      setTimeout(() => setAnimating(null), 300);

      try {
        const res = await fetch(`/api/blog/articles/${articleId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });

        if (res.ok) {
          const data = await res.json();
          setCounts(data.counts);
        } else {
          // Revert
          setUserReactions((prev) =>
            isActive ? [...prev, type] : prev.filter((t) => t !== type)
          );
          setCounts((prev) => ({
            ...prev,
            [type]: (prev[type] || 0) + (isActive ? 1 : -1),
          }));
        }
      } catch {
        // Revert
        setUserReactions((prev) =>
          isActive ? [...prev, type] : prev.filter((t) => t !== type)
        );
        setCounts((prev) => ({
          ...prev,
          [type]: (prev[type] || 0) + (isActive ? 1 : -1),
        }));
      }
    },
    [articleId, userReactions]
  );

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-1 py-4">
      {REACTION_TYPES.map(({ type, emoji, label }) => {
        const isActive = userReactions.includes(type);
        const count = counts[type] || 0;

        return (
          <motion.button
            key={type}
            onClick={() => handleToggle(type)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors ${
              isActive
                ? "bg-orange-50 border border-orange-200 text-orange-700"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
            animate={animating === type ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            title={label}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={count}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="text-xs font-medium"
                >
                  {count}
                </motion.span>
              </AnimatePresence>
            )}
          </motion.button>
        );
      })}
      {totalReactions > 0 && (
        <span className="text-xs text-gray-400 ml-2">
          {totalReactions} {totalReactions === 1 ? "reakce" : totalReactions < 5 ? "reakce" : "reakcí"}
        </span>
      )}
    </div>
  );
}
```

### 3.2 — Vytvořit `components/web/blog/ArticleComments.tsx`

```typescript
"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface CommentAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

interface Comment {
  id: string;
  text: string;
  isHidden: boolean;
  createdAt: string;
  author: CommentAuthor;
}

interface ArticleCommentsProps {
  articleId: string;
  initialComments: Comment[];
  total: number;
  isLoggedIn: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "právě teď";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("cs-CZ");
}

export function ArticleComments({
  articleId,
  initialComments,
  total: initialTotal,
  isLoggedIn,
}: ArticleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length < 5) return;

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/blog/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (res.ok) {
        setText("");
        setMessage(data.message || "Komentář odeslán ke schválení.");
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(data.error || "Nepodařilo se odeslat komentář.");
      }
    } catch {
      setMessage("Chyba sítě. Zkuste to znovu.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/blog/articles/${articleId}/comments?page=${page + 1}`
      );
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, ...data.comments]);
        setTotal(data.total);
        setPage((p) => p + 1);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="mt-8 mb-12">
      <h2 className="text-xl font-bold mb-6">
        Komentáře {total > 0 && <span className="text-gray-400 font-normal">({total})</span>}
      </h2>

      {/* Comment form */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Napište komentář..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
            rows={3}
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{text.length}/1000</span>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || text.length < 5}
            >
              {submitting ? "Odesílám..." : "Odeslat komentář"}
            </Button>
          </div>
          {message && (
            <p className="text-sm text-orange-600 mt-2">{message}</p>
          )}
        </form>
      ) : (
        <div className="bg-gray-50 rounded-xl p-6 text-center mb-8">
          <p className="text-gray-500 text-sm">
            Pro komentování se{" "}
            <a href="/prihlaseni" className="text-orange-500 font-medium hover:underline">
              přihlaste
            </a>
            .
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            {comment.author.avatar ? (
              <Image
                src={comment.author.avatar}
                alt=""
                width={36}
                height={36}
                className="rounded-full shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
                {comment.author.firstName[0]}
                {comment.author.lastName[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.author.firstName} {comment.author.lastName}
                </span>
                <span className="text-xs text-gray-400">
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {comments.length < total && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Načítám..." : `Načíst další komentáře (${total - comments.length})`}
          </Button>
        </div>
      )}

      {comments.length === 0 && total === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">
          Zatím žádné komentáře. Buďte první!
        </p>
      )}
    </section>
  );
}
```

### 3.3 — Refaktor `app/(web)/blog/[slug]/ShareButtons.tsx`

**Nahradit celý obsah souboru:**

```typescript
"use client";

import { useState } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

function ShareIcon({ d, viewBox = "0 0 24 24" }: { d: string; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} fill="currentColor" className="w-4 h-4">
      <path d={d} />
    </svg>
  );
}

const SHARE_CHANNELS = [
  {
    name: "Facebook",
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    icon: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z",
    color: "hover:text-[#1877F2]",
  },
  {
    name: "X",
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    color: "hover:text-black",
  },
  {
    name: "LinkedIn",
    getUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    color: "hover:text-[#0A66C2]",
  },
  {
    name: "WhatsApp",
    getUrl: (url: string, title: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
    icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
    color: "hover:text-[#25D366]",
  },
] as const;

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-500 mr-1">Sdílet:</span>

      {SHARE_CHANNELS.map((ch) => (
        <a
          key={ch.name}
          href={ch.getUrl(url, title)}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 transition-colors hover:bg-gray-200 ${ch.color}`}
          title={`Sdílet na ${ch.name}`}
        >
          <ShareIcon d={ch.icon} />
        </a>
      ))}

      <button
        onClick={copyLink}
        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 transition-colors hover:bg-gray-200 hover:text-orange-500"
        title="Kopírovat odkaz"
      >
        {copied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
      </button>
    </div>
  );
}
```

### 3.4 — Vytvořit `components/web/blog/NewsletterSignup.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "BLOG", honeypot: "" }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Zkontrolujte svůj email pro potvrzení.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Nepodařilo se přihlásit.");
      }
    } catch {
      setStatus("error");
      setMessage("Chyba sítě. Zkuste to znovu.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-green-700 font-medium">Zkontrolujte svůj email</p>
        <p className="text-green-600 text-sm mt-1">{message}</p>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
      <h3 className="font-bold text-gray-900 mb-1">Nechte si posílat nové články</h3>
      <p className="text-sm text-gray-500 mb-4">
        Jednou týdně ty nejlepší rady o autech. Žádný spam.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Honeypot — hidden */}
        <input type="text" name="name" className="hidden" tabIndex={-1} autoComplete="off" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vas@email.cz"
          required
          className="flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
        />
        <Button type="submit" size="sm" disabled={status === "loading"}>
          {status === "loading" ? "..." : "Odebírat"}
        </Button>
      </form>
      {status === "error" && (
        <p className="text-red-500 text-xs mt-2">{message}</p>
      )}
      <p className="text-xs text-gray-400 mt-3">
        Odhlásíte se jedním klikem. Vaše data nesdílíme.
      </p>
    </div>
  );
}
```

---

## FÁZE 4: Integrace do stránek

### 4.1 — `app/(web)/blog/[slug]/page.tsx` — rozšíření detail stránky

**Řádek 1-11 — přidat importy (za existující importy):**

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArticleReactions } from "@/components/web/blog/ArticleReactions";
import { ArticleComments } from "@/components/web/blog/ArticleComments";
import { NewsletterSignup } from "@/components/web/blog/NewsletterSignup";
```

**Řádek 62 (v async funkci, za `const { slug } = await params;`) — přidat session:**

```typescript
  const session = await getServerSession(authOptions);
```

**Řádky 91-104 — nahradit related articles query celým blokem:**

```typescript
  // Related articles — tag-based + category matching
  const articleTagIds = article.tags.map((t) => t.tagId);

  const related = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: article.id },
      OR: [
        { categoryId: article.categoryId },
        ...(articleTagIds.length > 0
          ? [{ tags: { some: { tagId: { in: articleTagIds } } } }]
          : []),
      ],
    },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      author: { select: { firstName: true, lastName: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  // Reactions
  const [reactionGroups, userReactionsList] = await Promise.all([
    prisma.articleReaction.groupBy({
      by: ["type"],
      where: { articleId: article.id },
      _count: true,
    }),
    session?.user?.id
      ? prisma.articleReaction.findMany({
          where: { articleId: article.id, userId: session.user.id },
          select: { type: true },
        })
      : [],
  ]);

  const reactionCounts: Record<string, number> = {};
  for (const r of reactionGroups) {
    reactionCounts[r.type] = r._count;
  }

  // Comments (only approved — isHidden=false)
  const [approvedComments, commentTotal] = await Promise.all([
    prisma.profileComment.findMany({
      where: { articleId: article.id, isHidden: false },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.profileComment.count({
      where: { articleId: article.id, isHidden: false },
    }),
  ]);
```

**Řádky 217-225 (Tags sekce) — udělat tagy klikatelné:**

Nahradit:
```tsx
            {article.tags.map(({ tag }) => (
              <Badge key={tag.id} variant="default">
                #{tag.name}
              </Badge>
            ))}
```

Za:
```tsx
            {article.tags.map(({ tag }) => (
              <Link key={tag.id} href={`/blog?tag=${tag.slug}`} className="no-underline">
                <Badge variant="default" className="hover:bg-orange-100 transition-colors">
                  #{tag.name}
                </Badge>
              </Link>
            ))}
```

**Řádky 228-231 (Share sekce) — přidat Reactions PŘED Share:**

Vložit PŘED `{/* Share */}`:
```tsx
        {/* Reactions */}
        <ArticleReactions
          articleId={article.id}
          initialCounts={reactionCounts}
          initialUserReactions={userReactionsList.map((r) => r.type)}
        />
```

**Řádky 267-268 (za Author card, PŘED Related articles) — přidat Comments + Newsletter:**

Vložit PŘED `{/* Related articles */}`:
```tsx
        {/* Comments */}
        <ArticleComments
          articleId={article.id}
          initialComments={approvedComments.map((c) => ({
            id: c.id,
            text: c.text,
            isHidden: c.isHidden,
            createdAt: c.createdAt.toISOString(),
            author: c.user,
          }))}
          total={commentTotal}
          isLoggedIn={!!session?.user}
        />

        {/* Newsletter */}
        <div className="mb-12">
          <NewsletterSignup />
        </div>
```

### 4.2 — `app/(web)/blog/page.tsx` — tag filtering + newsletter sidebar

**Řádek 9 — přidat import:**

```typescript
import { NewsletterSignup } from "@/components/web/blog/NewsletterSignup";
```

**Řádky 38-49 — rozšířit search params a where:**

Nahradit:
```typescript
  const { page: pageParam, category: categorySlug } = await searchParams;
```

Za:
```typescript
  const { page: pageParam, category: categorySlug, tag: tagSlug } = await searchParams;
```

A searchParams typ rozšířit:
```typescript
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>;
```

**Řádky 42-49 — rozšířit where o tag filter:**

Za existující category filter blok přidat:
```typescript
  if (tagSlug) {
    const tag = await prisma.articleTag.findUnique({
      where: { slug: tagSlug },
      select: { id: true },
    });
    if (tag) {
      where.tags = { some: { tagId: tag.id } };
    }
  }
```

**Řádek 51 — rozšířit Promise.all o tags:**

Do Promise.all přidat jako 5. element:
```typescript
    prisma.articleTag.findMany({
      include: { _count: { select: { articles: true } } },
      orderBy: { name: "asc" },
    }),
```

A destructuring aktualizovat:
```typescript
  const [articles, total, categories, featured, articleTags] = await Promise.all([
```

**Řádek 268 (za `</div>` sidebaru kategorií) — přidat tagy + newsletter:**

Vložit PŘED zavírací `</div>` sidebaru (`</aside>`):
```tsx
              {/* Tags */}
              {articleTags.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-bold text-lg mb-4">Témata</h2>
                  <div className="flex flex-wrap gap-2">
                    {articleTags.map((t) => (
                      <Link
                        key={t.id}
                        href={`/blog?tag=${t.slug}`}
                        className={`text-sm px-3 py-1 rounded-full no-underline transition-colors ${
                          tagSlug === t.slug
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        #{t.name}
                        <span className="ml-1 text-xs opacity-70">
                          ({t._count.articles})
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter */}
              <div className="mt-8">
                <NewsletterSignup />
              </div>
```

---

## FÁZE 5: Admin panel

### 5.1 — Vytvořit `app/(admin)/admin/blog/comments/page.tsx`

```typescript
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CommentsModeration } from "./CommentsModeration";

export const dynamic = "force-dynamic";

export default async function AdminBlogCommentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const comments = await prisma.profileComment.findMany({
    where: { articleId: { not: null } },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
      article: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Moderace komentářů</h1>
      <CommentsModeration
        comments={comments.map((c) => ({
          id: c.id,
          text: c.text,
          isHidden: c.isHidden,
          createdAt: c.createdAt.toISOString(),
          author: c.user,
          article: c.article!,
        }))}
      />
    </div>
  );
}
```

### 5.2 — Vytvořit `app/(admin)/admin/blog/comments/CommentsModeration.tsx`

```typescript
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Comment {
  id: string;
  text: string;
  isHidden: boolean;
  createdAt: string;
  author: { firstName: string; lastName: string; email: string; avatar: string | null };
  article: { title: string; slug: string };
}

export function CommentsModeration({ comments: initial }: { comments: Comment[] }) {
  const [comments, setComments] = useState(initial);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = comments.filter((c) => {
    if (filter === "PENDING") return c.isHidden;
    if (filter === "APPROVED") return !c.isHidden;
    return true;
  });

  const pendingCount = comments.filter((c) => c.isHidden).length;

  const handleModerate = async (commentId: string, isHidden: boolean) => {
    setLoading(commentId);
    try {
      // Najít articleId z komentáře — potřebujeme pro API URL
      // Protože endpoint je nested, použijeme přímý fetch na PATCH
      const res = await fetch(`/api/blog/articles/_/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden }),
      });

      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, isHidden } : c))
        );
      }
    } catch {
      // Ignore
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Opravdu smazat komentář?")) return;
    setLoading(commentId);
    try {
      const res = await fetch(`/api/blog/articles/_/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      // Ignore
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["ALL", "PENDING", "APPROVED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "ALL" ? "Všechny" : f === "PENDING" ? `Ke schválení (${pendingCount})` : "Schválené"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-3 font-medium">Autor</th>
              <th className="pb-3 font-medium">Komentář</th>
              <th className="pb-3 font-medium">Článek</th>
              <th className="pb-3 font-medium">Datum</th>
              <th className="pb-3 font-medium">Stav</th>
              <th className="pb-3 font-medium">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="py-3 pr-3">
                  <div className="font-medium">{c.author.firstName} {c.author.lastName}</div>
                  <div className="text-xs text-gray-400">{c.author.email}</div>
                </td>
                <td className="py-3 pr-3 max-w-xs">
                  <p className="line-clamp-2">{c.text}</p>
                </td>
                <td className="py-3 pr-3">
                  <a
                    href={`/blog/${c.article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:underline no-underline"
                  >
                    {c.article.title}
                  </a>
                </td>
                <td className="py-3 pr-3 whitespace-nowrap text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString("cs-CZ")}
                </td>
                <td className="py-3 pr-3">
                  <Badge variant={c.isHidden ? "pending" : "verified"}>
                    {c.isHidden ? "Čeká" : "Schváleno"}
                  </Badge>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    {c.isHidden ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerate(c.id, false)}
                        disabled={loading === c.id}
                      >
                        Schválit
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerate(c.id, true)}
                        disabled={loading === c.id}
                      >
                        Skrýt
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(c.id)}
                      disabled={loading === c.id}
                      className="text-red-500 hover:text-red-700"
                    >
                      Smazat
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-400 text-center py-8">Žádné komentáře k zobrazení.</p>
      )}
    </div>
  );
}
```

**POZNÁMKA:** Admin moderation používá URL `/_/comments/[commentId]` — implementátor musí buď:
- (A) Vytvořit flat admin API route `app/api/admin/comments/[commentId]/route.ts` (DOPORUČENO)
- (B) Nebo upravit existující nested route aby akceptoval `_` jako wildcard articleId

### 5.3 — Přidat do admin sidebar

**Soubor:** `components/admin/AdminSidebar.tsx`  
**Řádek 92 (za AI Návrhy) — přidat:**

```typescript
      { id: "comments", href: "/admin/blog/comments", icon: "💬", label: "Komentáře" },
```

### 5.4 — Přidat admin API route pro moderaci

**Vytvořit:** `app/api/admin/comments/[commentId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const moderateSchema = z.object({
  isHidden: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Nedostatečná oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const { isHidden } = moderateSchema.parse(body);

    const comment = await prisma.profileComment.update({
      where: { id: commentId },
      data: { isHidden },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("PATCH admin comment error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Nedostatečná oprávnění" }, { status: 403 });
    }

    await prisma.profileComment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin comment error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
```

**DŮLEŽITÉ:** V `CommentsModeration.tsx` aktualizovat URL z `/api/blog/articles/_/comments/` na `/api/admin/comments/`:

```typescript
// Nahradit
fetch(`/api/blog/articles/_/comments/${commentId}`, ...
// Za
fetch(`/api/admin/comments/${commentId}`, ...
```

---

## FÁZE 6: Newsletter — Resend rozšíření

Resend integrace je hotová v FÁZE 2 (subscribe + confirm routes). `lib/resend.ts` již obsahuje `sendEmail()` funkci — newsletter subscribe ji volá přímo.

Pro budoucnost (mimo scope MVP): admin stránka pro newsletter + weekly digest cron.

---

## Soubory k vytvoření (12)

| # | Soubor | Typ |
|---|--------|-----|
| 1 | `components/web/blog/ArticleReactions.tsx` | Client component |
| 2 | `components/web/blog/ArticleComments.tsx` | Client component |
| 3 | `components/web/blog/NewsletterSignup.tsx` | Client component |
| 4 | `app/api/blog/articles/[id]/reactions/route.ts` | API |
| 5 | `app/api/blog/articles/[id]/comments/route.ts` | API |
| 6 | `app/api/blog/articles/[id]/comments/[commentId]/route.ts` | API |
| 7 | `app/api/newsletter/subscribe/route.ts` | API |
| 8 | `app/api/newsletter/confirm/route.ts` | API |
| 9 | `app/(admin)/admin/blog/comments/page.tsx` | Admin page |
| 10 | `app/(admin)/admin/blog/comments/CommentsModeration.tsx` | Admin component |
| 11 | `app/api/admin/comments/[commentId]/route.ts` | Admin API |

## Soubory k úpravě (5)

| # | Soubor | Změna |
|---|--------|-------|
| 12 | `prisma/schema.prisma` | +ArticleReaction, +NewsletterSubscriber, rozšířit ProfileComment + Article + User |
| 13 | `app/(web)/blog/[slug]/page.tsx` | +reactions, +comments, +newsletter, +tag-based related, +klikatelné tagy |
| 14 | `app/(web)/blog/[slug]/ShareButtons.tsx` | Kompletní refaktor — FB, X, LinkedIn, WhatsApp |
| 15 | `app/(web)/blog/page.tsx` | +tag filtering, +newsletter sidebar, +articleTags query |
| 16 | `components/admin/AdminSidebar.tsx` | +Komentáře link v blog sekci |

---

## Pořadí implementace

1. FÁZE 1 — Schema + migrace (vše závisí na tom)
2. FÁZE 2 — API routes (komponenty je volají)
3. FÁZE 3.3 — ShareButtons refaktor (nezávisí na ničem, quick win)
4. FÁZE 3.1 + 3.2 + 3.4 — Komponenty (reactions, comments, newsletter)
5. FÁZE 4 — Integrace do stránek
6. FÁZE 5 — Admin panel

---

## STOP kritéria

1. [ ] `npx prisma migrate dev` projde — ArticleReaction, NewsletterSubscriber, ProfileComment.articleId existují
2. [ ] Emoji reakce na článku — 5 typů, toggle, počítadla, Framer Motion animace
3. [ ] Anonymní reakce fungují (cookie cm_session)
4. [ ] Přihlášený může odeslat komentář — zobrazí se zpráva "čeká na schválení"
5. [ ] Nepřihlášený vidí komentáře + výzvu k přihlášení
6. [ ] Admin v `/admin/blog/comments` vidí čekající komentáře, může schválit/skrýt/smazat
7. [ ] ShareButtons: FB, X, LinkedIn, WhatsApp, copy link — ikony, target=_blank
8. [ ] Related articles: tag-based matching (nejen kategorie)
9. [ ] Klikatelné tagy na článku → /blog?tag=...
10. [ ] Tag filtrování na blog listing funguje
11. [ ] Newsletter signup formulář na článku + v sidebaru
12. [ ] Newsletter double opt-in: subscribe → email s odkazem → confirm → status ACTIVE
13. [ ] `npm run build` projde bez chyb

---

*Připraveno: 2026-04-26*  
*Copy-paste ready pro implementátora*
