# Plan P1-09: Zapomenute heslo ��� password reset flow

**Priorita:** P1
**Slozitost:** M
**Zavislosti:** P1-05 (Resend email — HOTOVO v Batch 2, sdileny `lib/resend.ts`)
**Batch:** 3

---

## Cil

Implementovat plnohodnotny password reset flow. Aktualne je na login strance jen odkaz `mailto:info@carmakler.cz` (radek 131 login/page.tsx). Nahradit fungujicim self-service flow.

---

## Analyza aktualniho stavu

### Login stranka: `app/(web)/login/page.tsx` (radky 129-135)

```tsx
<a
  href="mailto:info@carmakler.cz?subject=Obnova%20hesla"
  className="text-sm text-orange-600 hover:text-orange-700 no-underline"
>
  Zapomenuté heslo?
</a>
```

### Auth konfigurace: `lib/auth.ts`

- Pouziva `CredentialsProvider` s `bcryptjs`
- `bcrypt.compare(credentials.password, user.passwordHash)`
- User model ma `passwordHash String`
- ZADNY `PasswordResetToken` model v schema

### Existujici auth API routes

- `app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `app/api/auth/register/route.ts` — registrace
- `app/api/settings/password/route.ts` — zmena hesla (prihlaseny uzivatel)

**NEEXISTUJE:** `/api/auth/forgot-password`, `/api/auth/reset-password`

### Resend: `lib/resend.ts` (Batch 2)

Sdileny modul `sendEmail()` s graceful fallback — pouzije se pro odeslani reset emailu.

---

## Kroky implementace

### Krok 1: Pridat PasswordResetToken model

**Soubor:** `prisma/schema.prisma`

Pridat za model `User` (nebo na konec):

```prisma
// ============================================
// PASSWORD RESET
// ============================================

model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([email])
  @@index([token])
  @@index([expiresAt])
}
```

**Proc vlastni model misto poli v User:** Token je kratkodoby (1 hodina), muze byt vice tokenu pro stejny email (opakovanejzadosti), a snadno se cistí cronem.

### Krok 2: Vytvorit migraci

```bash
npx prisma migrate dev --name add_password_reset_token
```

### Krok 3: Vytvorit API `app/api/auth/forgot-password/route.ts`

**Soubor:** `app/api/auth/forgot-password/route.ts` (NOVY)

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    // Rate limiting: max 3 requesty za hodinu na email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = await prisma.passwordResetToken.count({
      where: {
        email,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentTokens >= 3) {
      // Nevracet chybu — security (neodhalovat zda email existuje)
      return NextResponse.json({
        message: "Pokud ucet s timto emailem existuje, odeslali jsme odkaz pro obnovu hesla.",
      });
    }

    // Najit uzivatele
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, email: true, status: true },
    });

    // BEZPECNOST: Vzdy vracet stejnou odpoved (i pokud email neexistuje)
    if (!user || (user.status !== "ACTIVE" && user.status !== "ONBOARDING")) {
      return NextResponse.json({
        message: "Pokud ucet s timto emailem existuje, odeslali jsme odkaz pro obnovu hesla.",
      });
    }

    // Generovat token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hodina

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    // Odeslat email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.carmakler.cz"}/reset-hesla/${token}`;

    await sendEmail({
      to: email,
      subject: "Obnova hesla | Carmakler",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Carmakler</h1>
          </div>
          <div style="padding: 32px;">
            <p>Dobry den${user.firstName ? ` ${user.firstName}` : ""},</p>
            <p>obdrzeli jsme zadost o obnovu hesla k vasemu uctu.</p>
            <p>Pro nastaveni noveho hesla kliknete na tlacitko nize:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}"
                 style="background-color: #f97316; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Nastavit nove heslo
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Odkaz je platny 1 hodinu. Pokud jste o obnovu hesla nezadali, tento email ignorujte.</p>
            <p style="color: #6b7280; font-size: 12px; word-break: break-all;">Pokud tlacitko nefunguje, zkopirujte tento odkaz: ${resetUrl}</p>
          </div>
          <div style="padding: 16px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">Carmakler — prodej aut pres certifikovane maklere</p>
          </div>
        </div>
      `,
      text: `Obnova hesla Carmakler\n\nPro nastaveni noveho hesla otevrete tento odkaz: ${resetUrl}\n\nOdkaz je platny 1 hodinu.`,
    });

    return NextResponse.json({
      message: "Pokud ucet s timto emailem existuje, odeslali jsme odkaz pro obnovu hesla.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
```

### Krok 4: Vytvorit API `app/api/auth/reset-password/route.ts`

**Soubor:** `app/api/auth/reset-password/route.ts` (NOVY)

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(32),
  password: z.string().min(8, "Heslo musi mit alespon 8 znaku"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = schema.parse(body);

    // Najit platny token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Neplatny nebo expirovaný odkaz" }, { status: 400 });
    }

    if (resetToken.used) {
      return NextResponse.json({ error: "Tento odkaz jiz byl pouzit" }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Odkaz vyprsel. Zadejte novou zadost." }, { status: 400 });
    }

    // Najit uzivatele
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Uzivatel nenalezen" }, { status: 404 });
    }

    // Zmenit heslo + oznacit token jako pouzity
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      // Invalidovat vsechny ostatni tokeny pro tento email
      prisma.passwordResetToken.updateMany({
        where: { email: resetToken.email, id: { not: resetToken.id }, used: false },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ message: "Heslo bylo uspesne zmeneno" });
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
```

### Krok 5: Vytvorit stranku `app/(web)/zapomenute-heslo/page.tsx`

**Soubor:** `app/(web)/zapomenute-heslo/page.tsx` (NOVY)

"use client" formular:
- Input pro email
- Submit na `POST /api/auth/forgot-password`
- Po uspechu: zprava "Zkontrolujte svuj email"
- Link zpet na prihlaseni
- Design: shodny s login strankou (centered card, orange button)

### Krok 6: Vytvorit stranku `app/(web)/reset-hesla/[token]/page.tsx`

**Soubor:** `app/(web)/reset-hesla/[token]/page.tsx` (NOVY)

"use client" formular:
- 2x input pro nove heslo (heslo + potvrzeni)
- Minimalne 8 znaku
- Submit na `POST /api/auth/reset-password`
- Po uspechu: zprava "Heslo zmeneno" + redirect na `/login`
- Chybovy stav: "Odkaz vyprsel" s odkazem na `/zapomenute-heslo`

### Krok 7: Upravit login stranku

**Soubor:** `app/(web)/login/page.tsx` (radky 129-135)

```diff
-            <a
-              href="mailto:info@carmakler.cz?subject=Obnova%20hesla"
-              className="text-sm text-orange-600 hover:text-orange-700 no-underline"
-            >
-              Zapomenuté heslo?
-            </a>
+            <Link
+              href="/zapomenute-heslo"
+              className="text-sm text-orange-600 hover:text-orange-700 no-underline"
+            >
+              Zapomenuté heslo?
+            </Link>
```

A pridat import `Link` z `next/link` (pokud jeste neni — uz je na radku 6).

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `prisma/schema.prisma` | Pridat model PasswordResetToken |
| `app/api/auth/forgot-password/route.ts` | NOVY — odeslani reset emailu |
| `app/api/auth/reset-password/route.ts` | NOVY — zmena hesla s tokenem |
| `app/(web)/zapomenute-heslo/page.tsx` | NOVY — formular pro zadani emailu |
| `app/(web)/reset-hesla/[token]/page.tsx` | NOVY — formular pro nove heslo |
| `app/(web)/login/page.tsx` | Zmena mailto odkazu na Link na /zapomenute-heslo |

## Bezpecnostni opatreni

1. **Neodhalovat existenci emailu:** Vzdy stejna odpoved ("pokud ucet existuje...")
2. **Rate limiting:** Max 3 tokeny za hodinu na email
3. **Token expirace:** 1 hodina
4. **Jednorazovy token:** Po pouziti se oznaci `used: true`
5. **Invalidace:** Vsechny ostatni tokeny pro email se invaliduji
6. **Bcrypt hash:** Nove heslo hashovat se stejnou silou (12 rounds)
7. **Min. delka hesla:** 8 znaku

## Overeni

- [ ] Model PasswordResetToken existuje, migrace projde
- [ ] POST forgot-password odesle email s platnym linkem
- [ ] POST forgot-password vraci stejnou odpoved pro neexistujici email (bezpecnost)
- [ ] Rate limiting: 4. request za hodinu je ignorovan
- [ ] POST reset-password zmeni heslo, invaliduje vsechny tokeny
- [ ] Expirovaný token vraci 400
- [ ] Pouzity token vraci 400
- [ ] Stranka /zapomenute-heslo funguje
- [ ] Stranka /reset-hesla/[token] funguje
- [ ] Login stranka ma Link misto mailto
- [ ] Po zmene hesla se lze prihlasit s novym heslem
- [ ] Build prochazi
