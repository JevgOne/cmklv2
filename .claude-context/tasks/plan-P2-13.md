# Plan P2-13: Email Verifikace

**Priorita:** P2 (TOP 2 z 25 — Business Value 3/5, UX 2/5, Security 5/5 = 10/15)
**Slozitost:** M (3-4 hodiny)
**Zavislosti:** P1-05 (Resend konfigurace), P0-08 (PostgreSQL)
**Batch:** 4+

---

## Zduvodneni vyberu

**Bezpecnostni kriticky feature.** Bez email verifikace:
- Kdokoli muze registrovat fake ucet s cizim emailem
- Spameři mohou vytvorit stovky uctu
- Inzerenti mohou podvadeni (kontakt pres neovereny email)
- GDPR: odeslani emailu na neoverene adresy je problematicke
- Watchdog notifikace mohou jit na spatne adresy

**Pole `emailVerified DateTime?` jiz existuje** v User modelu (radek 122 schema.prisma) — ale **NIKDE se nepouziva**. Registrace aktivuje ucet okamzite bez overeni.

---

## Analyza aktualniho stavu

### Schema

```
model User {
  // ...
  emailVerified DateTime?  // radek 122 — EXISTUJE ale nikdy se nenastavuje
  // ...
}
```

### Registracni API

**Soubor:** `app/api/auth/register/route.ts`

Radek 49-51:
```ts
const autoActivate = role === "ADVERTISER" || role === "BUYER";
```
ADVERTISER a BUYER se aktivuji okamzite, bez jakekoli verifikace.

Radek 54-68: `prisma.user.create()` — **NENASTAVUJE** `emailVerified`.

### Dalsi registracni cesty

- `app/api/auth/register/broker/route.ts` — maklerska registrace
- `app/api/auth/register/partner/route.ts` — partnerska registrace
- Vsechny sdileji stejny problem — zadna email verifikace

### NextAuth konfigurace

**Soubor:** `lib/auth.ts` — CredentialsProvider. NEKONTROLUJE `emailVerified`.

### Existujici Resend infrastruktura

`lib/resend.ts` (vytvoreno v Batch 1) — `sendEmail()` helper je pripraven.

---

## Kroky implementace

### Krok 1: Novy Prisma model EmailVerificationToken

**Soubor:** `prisma/schema.prisma`

Pridat za PasswordResetToken model (pokud existuje z P1-09):

```prisma
model EmailVerificationToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)

  createdAt DateTime @default(now())

  @@index([email])
  @@index([token])
}
```

**Migrace:**
```bash
npx prisma migrate dev --name add_email_verification_token
```

### Krok 2: Helper funkce pro token generovani

**Soubor:** `lib/email-verification.ts` (NOVY)

```ts
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

const TOKEN_EXPIRY_HOURS = 24;

/**
 * Generuje verifikacni token a odesle email
 */
export async function sendVerificationEmail(email: string, firstName: string) {
  // Invalidovat stare tokeny pro tento email
  await prisma.emailVerificationToken.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  // Generovat novy token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

  await prisma.emailVerificationToken.create({
    data: { email, token, expiresAt },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL}/overeni-emailu/${token}`;

  await sendEmail({
    to: email,
    subject: "Ověřte svůj email — CarMakléř",
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 32px 0;">
          <img src="${process.env.NEXTAUTH_URL}/brand/logo-dark.png" alt="CarMakléř" height="40" />
        </div>
        <h1 style="font-size: 24px; color: #18181B; margin-bottom: 16px;">
          Dobrý den, ${firstName}!
        </h1>
        <p style="font-size: 16px; color: #52525B; line-height: 1.6;">
          Děkujeme za registraci na CarMakléř. Pro dokončení registrace prosím ověřte svůj email kliknutím na tlačítko níže.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Ověřit email
          </a>
        </div>
        <p style="font-size: 14px; color: #71717A; line-height: 1.6;">
          Odkaz je platný 24 hodin. Pokud jste se neregistrovali, tento email ignorujte.
        </p>
        <hr style="border: none; border-top: 1px solid #E4E4E7; margin: 32px 0;" />
        <p style="font-size: 12px; color: #A1A1AA; text-align: center;">
          CarMakléř s.r.o. | <a href="${process.env.NEXTAUTH_URL}" style="color: #F97316;">www.carmakler.cz</a>
        </p>
      </div>
    `,
  });

  return token;
}

/**
 * Verifikuje token a aktivuje email
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return { success: false, error: "Neplatný odkaz" };
  }

  if (record.used) {
    return { success: false, error: "Odkaz již byl použit" };
  }

  if (record.expiresAt < new Date()) {
    return { success: false, error: "Odkaz vypršel. Požádejte o nový." };
  }

  // Oznacit token jako pouzity
  await prisma.emailVerificationToken.update({
    where: { id: record.id },
    data: { used: true },
  });

  // Nastavit emailVerified na uzivateli
  await prisma.user.updateMany({
    where: { email: record.email },
    data: { emailVerified: new Date() },
  });

  return { success: true, email: record.email };
}
```

### Krok 3: Upravit registracni API

**Soubor:** `app/api/auth/register/route.ts`

**Diff (za user.create):**

```diff
+ import { sendVerificationEmail } from "@/lib/email-verification";

  // Vytvoreni uzivatele
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      role,
-     status: autoActivate ? "ACTIVE" : "PENDING",
+     status: autoActivate ? "ACTIVE" : "PENDING",
+     // emailVerified se nastavi az po kliknuti na odkaz
      accountType: data.accountType ?? null,
      companyName: data.companyName ?? null,
      ico: data.ico ?? null,
    },
  });

+ // Odeslat verifikacni email
+ try {
+   await sendVerificationEmail(user.email, user.firstName);
+ } catch (error) {
+   console.error("Failed to send verification email:", error);
+   // Neblokovat registraci — email se muze odeslat znovu
+ }

  return NextResponse.json({
    message: "Registrace uspesna",
    userId: user.id,
+   emailVerificationRequired: true,
  }, { status: 201 });
```

**Stejna zmena v:**
- `app/api/auth/register/broker/route.ts`
- `app/api/auth/register/partner/route.ts`

### Krok 4: Verifikacni API endpoint

**Soubor:** `app/api/auth/verify-email/[token]/route.ts` (NOVY)

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/email-verification";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const result = await verifyEmailToken(token);

  if (!result.success) {
    // Redirect na chybovou stranku
    const errorUrl = new URL("/overeni-emailu/chyba", process.env.NEXTAUTH_URL);
    errorUrl.searchParams.set("error", result.error || "Neznámá chyba");
    return NextResponse.redirect(errorUrl);
  }

  // Redirect na uspech stranku
  const successUrl = new URL("/overeni-emailu/uspech", process.env.NEXTAUTH_URL);
  return NextResponse.redirect(successUrl);
}
```

### Krok 5: Re-send verifikacniho emailu

**Soubor:** `app/api/auth/resend-verification/route.ts` (NOVY)

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email-verification";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip, 3, 60 * 60 * 1000); // 3x za hodinu
  if (!success) {
    return NextResponse.json(
      { error: "Příliš mnoho pokusů. Zkuste to za hodinu." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { email } = schema.parse(body);

  // Bezpecnostni: vzdy vracet OK (neprozrazovat jestli email existuje)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, emailVerified: true },
  });

  if (user && !user.emailVerified) {
    await sendVerificationEmail(email, user.firstName);
  }

  return NextResponse.json({
    message: "Pokud máte u nás účet, odeslali jsme vám ověřovací email.",
  });
}
```

### Krok 6: Verifikacni stranky (UI)

**Soubor:** `app/(web)/overeni-emailu/[token]/page.tsx` (NOVY)

```tsx
import { redirect } from "next/navigation";
import { verifyEmailToken } from "@/lib/email-verification";

export const metadata = { title: "Ověření emailu" };

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyEmailToken(token);

  if (result.success) {
    redirect("/overeni-emailu/uspech");
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-error-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">!</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          Ověření se nezdařilo
        </h1>
        <p className="text-gray-600 mb-6">{result.error}</p>
        <a
          href="/login"
          className="inline-block bg-orange-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors"
        >
          Přejít na přihlášení
        </a>
      </div>
    </div>
  );
}
```

**Soubor:** `app/(web)/overeni-emailu/uspech/page.tsx` (NOVY)

```tsx
import Link from "next/link";

export const metadata = { title: "Email ověřen" };

export default function VerifyEmailSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-success-500">✓</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          Email úspěšně ověřen!
        </h1>
        <p className="text-gray-600 mb-6">
          Váš účet je nyní plně aktivní. Můžete se přihlásit a začít používat všechny funkce CarMakléř.
        </p>
        <Link
          href="/login"
          className="inline-block bg-orange-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors no-underline"
        >
          Přihlásit se
        </Link>
      </div>
    </div>
  );
}
```

### Krok 7: Banner na login strance pro neoverene

**Soubor:** `app/(web)/login/page.tsx`

Po neuspesnem prihlaseni s neoverenym emailem zobrazit:

```tsx
{error === "EMAIL_NOT_VERIFIED" && (
  <div className="bg-warning-50 border border-warning-500/20 rounded-lg p-4 mb-4">
    <p className="text-sm text-gray-700 font-medium">
      Váš email ještě nebyl ověřen. Zkontrolujte svou schránku.
    </p>
    <button
      onClick={() => resendVerification(email)}
      className="text-sm text-orange-600 underline mt-1"
    >
      Odeslat znovu
    </button>
  </div>
)}
```

### Krok 8: NextAuth — kontrola emailVerified (OPATRNE)

**Soubor:** `lib/auth.ts` — CredentialsProvider authorize callback

**Pristup: Soft enforcement** — neblokovat prihlaseni, ale informovat:

```diff
  async authorize(credentials) {
    // ... existujici logika ...
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    // ... overeni hesla ...

+   // Prenaset info o verifikaci do session
    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
+     emailVerified: !!user.emailVerified,
    };
  }
```

**Volitelne: Hard enforcement (blokovat prihlaseni):**
```ts
if (!user.emailVerified) {
  throw new Error("EMAIL_NOT_VERIFIED");
}
```

**Doporuceni:** Zacit s soft enforcement. Hard enforcement az po overeni ze vsichni existujici uzivatele maji moznost si email overit (napr. posalni hromadny verifikacni email).

### Krok 9: Hromadne odeslani verifikacnich emailu (existujici uzivatele)

**Soubor:** `app/api/admin/send-verification-emails/route.ts` (NOVY, one-time)

```ts
// Admin-only endpoint pro jednorázové odeslání verifikačních emailů
// všem existujícím uživatelům bez emailVerified
export async function POST(request: NextRequest) {
  // ... admin auth check ...
  const users = await prisma.user.findMany({
    where: { emailVerified: null, status: "ACTIVE" },
    select: { email: true, firstName: true },
  });

  let sent = 0;
  for (const user of users) {
    try {
      await sendVerificationEmail(user.email, user.firstName);
      sent++;
      // Rate limit: 2 emaily/sekunda (Resend limit)
      await new Promise(r => setTimeout(r, 500));
    } catch { /* skip failures */ }
  }

  return NextResponse.json({ total: users.length, sent });
}
```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena | Narocnost |
|--------|-------|-----------|
| `prisma/schema.prisma` | Novy model EmailVerificationToken | XS |
| `lib/email-verification.ts` | NOVY — token generation + verification + email | M |
| `app/api/auth/register/route.ts` | Pridat sendVerificationEmail po create | S |
| `app/api/auth/register/broker/route.ts` | Stejna zmena | XS |
| `app/api/auth/register/partner/route.ts` | Stejna zmena | XS |
| `app/api/auth/verify-email/[token]/route.ts` | NOVY — GET verifikace | S |
| `app/api/auth/resend-verification/route.ts` | NOVY — POST re-send | S |
| `app/(web)/overeni-emailu/[token]/page.tsx` | NOVY — verifikacni stranka | S |
| `app/(web)/overeni-emailu/uspech/page.tsx` | NOVY — uspech stranka | XS |
| `app/(web)/login/page.tsx` | Banner pro neoverene emaily | S |
| `lib/auth.ts` | emailVerified do session (soft) | XS |
| `app/api/admin/send-verification-emails/route.ts` | NOVY — hromadne odeslani (one-time) | S |

---

## Overeni

- [ ] Registrace → email s verifikacnim odkazem doruzen
- [ ] Klik na odkaz → emailVerified nastaveno na aktualní timestamp
- [ ] Opetovny klik na stejny odkaz → "Odkaz jiz byl pouzit"
- [ ] Expirovan odkaz (po 24h) → "Odkaz vypršel"
- [ ] Resend endpoint: max 3x za hodinu, nezdrazuje existenci uctu
- [ ] Login s neoverenym emailem: banner s moznosti resend (soft mode)
- [ ] Admin hromadne odeslani: vsechny existujici uzivatele dostanou email
- [ ] Build prochazi
