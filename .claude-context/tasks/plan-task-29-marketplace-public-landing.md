# Plan task #29 — Marketplace public landing + apply form

**Datum:** 2026-04-06
**Planner:** planovac
**Priorita:** P1
**Scope:** střední — většina už existuje, opravit apply form + přidat /apply route + model
**Blocked by:** #27 (hotovo), #30 (hotovo jako plán)

---

## 1. TL;DR — co je hotovo, co chybí

**Dobrá zpráva:** Velká část práce je už hotová. Landing page `/marketplace` existuje, je obsáhlá (hero, how-it-works, ROI examples, guarantees, FAQ, apply form anchor), middleware chrání gated sekce. **Ale:**

### ✅ Co funguje
1. `app/(web)/marketplace/page.tsx` — **veřejná landing page** (~349 řádků, kompletní marketing obsah). Není v middleware chráněných seznamech → opravdu veřejná.
2. `middleware.ts:227-261` — gating `/marketplace/dealer/*` a `/marketplace/investor/*` (MARKETPLACE_DEALER_ROLES, MARKETPLACE_INVESTOR_ROLES).
3. `components/web/marketplace/ApplyForm.tsx` — UI formuláře s role selection.
4. `/api/marketplace/apply` — existuje, vytváří admin notifikace.
5. `lib/validators/marketplace.ts` — `applySchema` existuje.

### ❌ Co je rozbité / chybí
1. **Apply form vyžaduje login** — `POST /api/marketplace/apply:15` má `if (!session?.user?.id) return 401`. To kompletně blokuje zadání: neregistrovaný návštěvník nemůže podat žádost.
2. **Apply form neukládá data z inputů** — `ApplyForm.tsx:20-22` sbírá `name`, `email`, `phone`, ale `handleSubmit:38-44` odesílá jen `role`, `companyName`, `ico`, `message`. Jméno/email/telefon se ignorují (server bere z session).
3. **Chybí `MarketplaceApplication` Prisma model** — žádosti se nikde neukládají, jen vytváří notifikaci pro admina. Admin nemůže udělat CRM workflow, history, status tracking.
4. **Chybí dedikovaná stránka `/marketplace/apply`** — task explicitně chce `/marketplace/apply?role=investor|dealer`. Aktuálně je apply form jen anchor `#apply` na landing page.
5. **Chybí thank-you state po úspěšném odeslání** — form to má inline v `ApplyForm.tsx:57-69`, ale není to dedikovaná stránka.
6. **Chybí email adminovi** přes Resend (task chtěl) — zatím jen Prisma notifikace.
7. **GDPR souhlas** — task ho chce, ale form ho nemá.
8. **Redirect důvody** — task chce "`?reason=auth_required`" a "`?reason=not_authorized`" query params s toast hláškami; aktuálně middleware redirectuje bez důvodu.

---

## 2. Scope

### V SCOPE
1. **Prisma model** `MarketplaceApplication` — nová tabulka pro persistent žádosti
2. **API refactor** `/api/marketplace/apply` — odebrat auth requirement, validovat name/email/phone, ukládat do DB, posílat email adminovi (Resend), vracet jasnou odpověď
3. **Validator update** `applySchema` — přidat name/email/phone/gdprConsent
4. **Apply form** oprav: odesílat všechna pole, zobrazovat GDPR checkbox, vybírat roli přes query param `?role=investor|dealer`
5. **Nová dedikovaná stránka** `/marketplace/apply` — samostatný route s form (nebo reuse ApplyForm komponenty) + breadcrumbs
6. **Thank-you UI** — dedikovaný "Žádost odeslána" stav (zůstává v ApplyForm nebo separátní `/marketplace/apply/dekujeme` — rozhodneme níže)
7. **Toast hlášky pro redirect důvody** — na landing page zachytit `?reason=auth_required` a `?reason=not_authorized` a zobrazit toast
8. **Middleware update** — přidat query param `?reason=not_authorized` při redirectu z gated sekcí
9. **Admin CRM UI** (jen naplánovat, implementace volitelná) — v admin panelu přidat seznam aplikací s možností approve/reject
10. **Emailové notifikace** — template pro admin notifikaci + confirmation email pro žadatele

### MIMO SCOPE
- Implementace CRM workflow v admin panelu (jen scaffolding + model; implementace může být separátní task)
- Refactor gated dealer/investor dashboardů (funkční, netřeba měnit)
- Rebuild landing page content (existuje, výborný)
- Automatické vytvoření user accountu při odeslání žádosti (rozhodnuto: žadatel se registruje později, pokud schválen)
- Integrace s externí CRM (Pipedrive, HubSpot)
- 2FA pro apply form (jen standardní rate limit)

---

## 3. Detailní návrh

### 3.1 Prisma model `MarketplaceApplication`

**Lokace:** `prisma/schema.prisma` na konec souboru, vedle existujících marketplace modelů (FlipOpportunity, Investment).

```prisma
model MarketplaceApplication {
  id             String   @id @default(cuid())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Basic contact (public — nepožaduje login)
  firstName      String
  lastName       String
  email          String
  phone          String
  role           String   // "VERIFIED_DEALER" | "INVESTOR"

  // Dealer-specific (optional)
  companyName    String?
  ico            String?

  // Investor-specific (optional)
  investmentRange String? // např. "10k-50k", "50k-200k", "200k+"

  // Common
  message        String   @db.Text
  gdprConsent    Boolean  @default(false)

  // Admin workflow
  status         String   @default("NEW") // NEW | CONTACTED | APPROVED | REJECTED | SPAM
  adminNotes     String?  @db.Text
  reviewedAt     DateTime?
  reviewedById   String?
  reviewedBy     User?    @relation("MarketplaceApplicationReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)

  // Když byl převeden na user account, propojit
  convertedUserId String?
  convertedUser   User?   @relation("MarketplaceApplicationConvertedUser", fields: [convertedUserId], references: [id], onDelete: SetNull)

  // Rate limiting / anti-spam
  ipAddress      String?
  userAgent      String?  @db.Text

  @@index([status, createdAt])
  @@index([email])
  @@index([role, status])
}

// V User modelu přidat:
model User {
  // ...existing...
  marketplaceApplicationsReviewed  MarketplaceApplication[] @relation("MarketplaceApplicationReviewer")
  marketplaceApplicationsConverted MarketplaceApplication[] @relation("MarketplaceApplicationConvertedUser")
}
```

**Migrace:** `npx prisma migrate dev --name marketplace_application`.

**Pozn.:** Status string namísto enum, aby se dal rozšiřovat bez migrace. Validace přes Zod.

### 3.2 Validator `applySchema` (update)

**Soubor:** `lib/validators/marketplace.ts:94-99`

```typescript
// Žádost o přístup — PUBLIC (nevyžaduje login)
export const applySchema = z.object({
  role: z.enum(["VERIFIED_DEALER", "INVESTOR"]),
  firstName: z.string().min(2, "Jméno je povinné"),
  lastName: z.string().min(2, "Příjmení je povinné"),
  email: z.string().email("Neplatný email"),
  phone: z.string().min(9, "Telefon je povinný (min. 9 znaků)"),
  companyName: z.string().optional(),
  ico: z.string().regex(/^\d{8}$/, "IČO musí mít 8 číslic").optional(),
  investmentRange: z.enum(["10k-50k", "50k-200k", "200k-1M", "1M+"]).optional(),
  message: z.string().min(10, "Zpráva musí mít alespoň 10 znaků").max(2000),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: "Musíte souhlasit se zpracováním osobních údajů" }),
  }),
}).refine(
  (data) => data.role !== "VERIFIED_DEALER" || (!!data.companyName && !!data.ico),
  {
    message: "Dealer musí vyplnit název firmy a IČO",
    path: ["companyName"],
  }
);
```

### 3.3 API refactor `POST /api/marketplace/apply`

**Soubor:** `app/api/marketplace/apply/route.ts` (kompletní rewrite)

**Klíčové změny:**
1. **Odstranit session check** — endpoint je public
2. **Persist do DB** přes `prisma.marketplaceApplication.create(...)`
3. **Email adminovi** přes Resend (admin notifikace s linkem do admin panelu)
4. **Confirmation email žadateli** přes Resend
5. **Rate limit** — základní IP-based (možno reuse existing rate limiter, pokud je)
6. **Anti-spam** — honeypot field + basic validace (délka, doména, atd.)
7. **Vracet jasný response** — 201 + ID aplikace, 400 při validaci

**Pseudokód:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit (IP-based, např. 5 req / 15 min)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const limited = await checkRateLimit(`marketplace-apply:${ip}`, 5, 900);
    if (limited) return NextResponse.json({ error: "Příliš mnoho žádostí, zkuste to později" }, { status: 429 });

    // 2. Parse + validate
    const body = await request.json();

    // Honeypot check (field "website" should be empty)
    if (body.website) {
      return NextResponse.json({ message: "OK" }); // silent success pro bota
    }

    const data = applySchema.parse(body);

    // 3. Anti-duplicate check — stejný email + PENDING status za posledních 24h
    const recentDuplicate = await prisma.marketplaceApplication.findFirst({
      where: {
        email: data.email,
        status: "NEW",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recentDuplicate) {
      return NextResponse.json(
        { error: "Již jste podali žádost v posledních 24 hodinách. Kontaktujeme vás co nejdříve." },
        { status: 409 }
      );
    }

    // 4. Uložit do DB
    const application = await prisma.marketplaceApplication.create({
      data: {
        ...data,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || null,
        status: "NEW",
      },
    });

    // 5. Poslat email adminovi (dry-run-safe přes lib/resend.ts)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { email: true },
    });
    await sendMarketplaceApplicationAdminEmail(admins.map(a => a.email), application);

    // 6. Poslat confirmation žadateli
    await sendMarketplaceApplicationConfirmationEmail(data.email, data.firstName);

    // 7. Vytvořit notification pro admina (existing pattern)
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: adminUsers.map((admin) => ({
        userId: admin.id,
        type: "SYSTEM",
        title: `Nová marketplace žádost — ${data.role === "VERIFIED_DEALER" ? "Realizátor" : "Investor"}`,
        body: `${data.firstName} ${data.lastName} (${data.email}): ${data.message.slice(0, 100)}`,
        link: `/admin/marketplace/applications/${application.id}`,
      })),
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: "Žádost byla odeslána. Ozveme se vám do 48 hodin.",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/marketplace/apply error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
```

### 3.4 Nová stránka `/marketplace/apply`

**Soubor:** `app/(web)/marketplace/apply/page.tsx`

```tsx
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { ApplyForm } from "@/components/web/marketplace/ApplyForm";

export const metadata: Metadata = {
  title: "Žádost o přístup | Marketplace | CarMakléř",
  description: "Vyplňte žádost o přístup k marketplace. Buďte součástí investiční platformy pro flipping aut.",
  robots: { index: true, follow: true },
};

type Props = {
  searchParams: Promise<{ role?: "investor" | "dealer"; reason?: string }>;
};

export default async function MarketplaceApplyPage({ searchParams }: Props) {
  const { role, reason } = await searchParams;

  const initialRole =
    role === "investor" ? "INVESTOR" :
    role === "dealer" ? "VERIFIED_DEALER" : null;

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: "Žádost o přístup" },
        ]}
      />

      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {reason === "auth_required" && (
            <Alert variant="info" className="mb-6">
              Pro přístup k marketplace musíte být ověřený uživatel. Vyplňte žádost níže.
            </Alert>
          )}
          {reason === "not_authorized" && (
            <Alert variant="warning" className="mb-6">
              Vaše současná role nemá přístup k této sekci. Vyplňte žádost o ověření.
            </Alert>
          )}

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center">
            Žádost o přístup
          </h1>
          <p className="text-gray-500 text-center mt-3 mb-10">
            Ověříme váš profil a ozveme se vám do 48 hodin
          </p>

          <ApplyForm initialRole={initialRole} />
        </div>
      </section>
    </main>
  );
}
```

**Také:** `app/(web)/marketplace/apply/loading.tsx` a `error.tsx` (standardní boilerplate).

### 3.5 ApplyForm komponenta — refactor

**Soubor:** `components/web/marketplace/ApplyForm.tsx`

**Klíčové změny:**
1. Přidat `initialRole` prop
2. Poslat VŠECHNA pole do API (firstName, lastName, email, phone, companyName, ico, message, gdprConsent, investmentRange)
3. Přidat GDPR checkbox (povinný)
4. Přidat honeypot hidden field `website` (anti-bot)
5. Přidat investmentRange select pro investor role
6. Zlepšit validaci — inline error messages
7. Zlepšit thank-you stav s next steps

**Props:**
```typescript
type ApplyFormProps = {
  initialRole?: "VERIFIED_DEALER" | "INVESTOR" | null;
};

export function ApplyForm({ initialRole = null }: ApplyFormProps) {
  const [role, setRole] = useState<Role | null>(initialRole);
  // ...
  // Přidat firstName, lastName, gdprConsent, investmentRange state
  // Přidat honeypot <input name="website" type="text" className="hidden" tabIndex={-1} autoComplete="off" />
}
```

**Submit body:**
```typescript
body: JSON.stringify({
  role,
  firstName,
  lastName,
  email,
  phone,
  companyName: role === "VERIFIED_DEALER" ? companyName : undefined,
  ico: role === "VERIFIED_DEALER" ? ico : undefined,
  investmentRange: role === "INVESTOR" ? investmentRange : undefined,
  message,
  gdprConsent,
  website, // honeypot, should be empty
}),
```

**GDPR checkbox:**
```tsx
<label className="flex items-start gap-3 text-sm">
  <input
    type="checkbox"
    checked={gdprConsent}
    onChange={(e) => setGdprConsent(e.target.checked)}
    className="mt-1"
    required
  />
  <span className="text-gray-600">
    Souhlasím se zpracováním osobních údajů za účelem vyřízení žádosti o přístup k marketplace. Více v{" "}
    <Link href="/gdpr" className="text-orange-500 underline">zásadách ochrany osobních údajů</Link>.
  </span>
</label>
```

### 3.6 Landing page — toast pro redirect reasons

**Soubor:** `app/(web)/marketplace/page.tsx`

**Úprava:** Přidat `searchParams` prop a zobrazit toast při `?reason=auth_required` nebo `?reason=not_authorized`. Vzhledem k tomu, že toast je client-side, vytvořit malou client komponentu `<MarketplaceRedirectNotice reason={reason} />`.

```tsx
type Props = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function MarketplacePage({ searchParams }: Props) {
  const { reason } = await searchParams;
  const stats = await getMarketplaceStats();
  return (
    <main>
      {reason && <MarketplaceRedirectNotice reason={reason} />}
      {/* ... existing content ... */}
    </main>
  );
}
```

Nový komponent `components/web/marketplace/MarketplaceRedirectNotice.tsx`:
```tsx
"use client";
import { useEffect } from "react";
import { toast } from "@/lib/toast"; // pokud existuje
// nebo inline render Alert na top of page

export function MarketplaceRedirectNotice({ reason }: { reason: string }) {
  useEffect(() => {
    if (reason === "auth_required") {
      toast.info("Pro detailní nabídku se musíte přihlásit");
    } else if (reason === "not_authorized") {
      toast.warning("Vaše role nemá přístup k této sekci");
    }
  }, [reason]);
  return null;
}
```

**Alternativa (jednodušší):** Server-side render `<Alert>` na topu stránky, bez client toast. To je defensivnější a nekomplikuje client bundle.

**Doporučení planovače:** Jdi s Alert variantou — jednodušší, A11Y friendly, není potřeba další toast library setup.

### 3.7 Middleware update — přidat reason query param

**Soubor:** `middleware.ts:227-261`

```typescript
// Chráněné marketplace dealer routy
if (pathname.startsWith("/marketplace/dealer")) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const redirectUrl = new URL("/marketplace/apply", request.url);
    redirectUrl.searchParams.set("reason", "auth_required");
    redirectUrl.searchParams.set("role", "dealer");
    return NextResponse.redirect(redirectUrl);
  }

  if (!MARKETPLACE_DEALER_ROLES.includes(token.role as string)) {
    const redirectUrl = new URL("/marketplace", request.url);
    redirectUrl.searchParams.set("reason", "not_authorized");
    return NextResponse.redirect(redirectUrl);
  }
}

// Stejně pro investor...
```

**Pozn.:** Změna z redirect na `/login` na redirect na `/marketplace/apply` — uživatel bez účtu by se nejdřív měl zaregistrovat přes marketplace application flow, až poté dostane přístup. Pokud user **má account** ale špatnou roli, redirectuje se na landing s `not_authorized` toast.

**Team-lead rozhodnutí needed:** Chceme neregistrované lidi nutit do `/apply` flow, nebo jim nabídnout klasické `/login` tlačítko? V plánu navrhuji **hybrid:**
- `not_authorized` (má account, nesprávná role) → `/marketplace?reason=not_authorized`
- `auth_required` (nemá account) → `/marketplace/apply?reason=auth_required&role=dealer|investor`

### 3.8 Email templates

**Nové templates v `lib/email-templates/`:**

1. `marketplace-application-admin.ts` — email pro admina s novou žádostí
   - Subject: `Nová marketplace žádost — [Investor/Realizátor] — [Jméno]`
   - Body: celý obsah žádosti, odkaz na admin panel

2. `marketplace-application-confirmation.ts` — confirmation pro žadatele
   - Subject: `Vaše žádost o přístup k marketplace byla přijata`
   - Body: poděkování, next steps, kontakt

**Podle konvence** `lib/email-templates/`:
```typescript
export function marketplaceApplicationAdminSubject(data): string { ... }
export function marketplaceApplicationAdminHtml(data): string { ... }
export function marketplaceApplicationAdminText(data): string { ... }
```

**Napojit na existující `sendEmail` infrastrukturu** (viz task #19 plán).

**Pozn.:** Aktualizace `lib/email-templates/index.ts` registry s novými templates. Tyto 2 templates **nejsou broker templates**, takže potvrzují potřebu refactoru `generateEmail()` factory z task #19 update (aby podporoval i ne-broker data).

### 3.9 Admin panel — zobrazení žádostí (nice-to-have)

**Mimo hlavní scope, ale připrav strukturu:**

**Nový route:** `app/(admin)/admin/marketplace/applications/`
- `page.tsx` — seznam s filtry (status, role, date)
- `[id]/page.tsx` — detail aplikace s approve/reject actions

**Nové API endpoints:**
- `GET /api/admin/marketplace/applications` — list
- `GET /api/admin/marketplace/applications/[id]` — detail
- `PATCH /api/admin/marketplace/applications/[id]` — update status, adminNotes
- `POST /api/admin/marketplace/applications/[id]/approve` — approve → vytvořit uživatele s rolí, poslat welcome email
- `POST /api/admin/marketplace/applications/[id]/reject` — reject → update status, poslat rejection email

**Planner doporučení:** Tyto admin endpointy vyřadit do separátního task `#29-admin-crm` — MVP stačí že se žádosti ukládají do DB a admin je vidí v Prisma Studio. Manual approve přes direct DB edit je OK pro MVP.

### 3.10 Gated dashboardy — beze změn

**Žádné změny v:**
- `app/(web)/marketplace/dealer/*`
- `app/(web)/marketplace/investor/*`
- `/api/marketplace/opportunities/*` (fixne task #30)

---

## 4. Pořadí implementace

1. **DB:** Přidat Prisma model `MarketplaceApplication` + migrace
2. **Validator:** Update `applySchema` s novými fieldy
3. **API:** Rewrite `POST /api/marketplace/apply` — odstranit auth, přidat DB persist + emails + rate limit
4. **Email templates:** Vytvořit 2 templates (admin + confirmation)
5. **UI komponenta:** Refactor `ApplyForm.tsx` — přidat všechna pole, GDPR, honeypot, initialRole prop
6. **Nová stránka:** `app/(web)/marketplace/apply/page.tsx` + loading/error
7. **Landing update:** `app/(web)/marketplace/page.tsx` — přidat searchParams pro reason, render Alert
8. **Middleware update:** Přidat reason query params do redirect URL
9. **CTA update:** V landing page změnit `#apply` anchors na `/marketplace/apply?role=investor|dealer`
10. **Testing:** E2E test pro public apply flow

---

## 5. Acceptance criteria

### Must-have
- [ ] Prisma model `MarketplaceApplication` existuje, migrace prošla
- [ ] `GET /marketplace` → 200 OK i pro neauth usera (už funguje — regression check)
- [ ] `GET /marketplace/apply` → 200 OK pro neauth usera
- [ ] `GET /marketplace/apply?role=investor` → form předvolí INVESTOR role
- [ ] `GET /marketplace/apply?role=dealer` → form předvolí VERIFIED_DEALER role
- [ ] `POST /api/marketplace/apply` BEZ session token → 201 pokud data OK (bez autorizace!)
- [ ] Chybí GDPR consent → 400 s jasnou zprávou
- [ ] Duplicate email za 24h → 409 s info zprávou
- [ ] Honeypot field vyplněný → silent success (200 OK bez DB write)
- [ ] Rate limit 6. request z stejné IP → 429
- [ ] Po submitu: DB record vytvořen, admin dostane email + notifikaci, žadatel dostane confirmation email
- [ ] `GET /marketplace/dealer` neauth → redirect na `/marketplace/apply?reason=auth_required&role=dealer`
- [ ] `GET /marketplace/dealer` jako BROKER → redirect na `/marketplace?reason=not_authorized`
- [ ] `/marketplace?reason=not_authorized` zobrazí Alert na vrchu stránky
- [ ] `/marketplace/apply?reason=auth_required` zobrazí Alert nad form
- [ ] Build prošel, lint prošel

### Nice-to-have (může být follow-up task)
- [ ] Admin panel `/admin/marketplace/applications` — list + detail
- [ ] Admin approve endpoint — vytvoří user account, pošle welcome email
- [ ] Admin reject endpoint — pošle rejection email
- [ ] E2E test `e2e/marketplace-flows.spec.ts` — apply flow for investor + dealer

---

## 6. Test plan

### Manual
```bash
# 1. Landing je public
curl -i http://localhost:3000/marketplace
# Očekávané: 200 OK + HTML

# 2. Apply je public
curl -i http://localhost:3000/marketplace/apply
# Očekávané: 200 OK + HTML s formem

# 3. Apply s role=investor
curl -i "http://localhost:3000/marketplace/apply?role=investor"
# Očekávané: 200 OK, form má investor předvolen

# 4. POST apply bez auth
curl -i -X POST http://localhost:3000/api/marketplace/apply \
  -H "Content-Type: application/json" \
  -d '{
    "role": "INVESTOR",
    "firstName": "Jan",
    "lastName": "Novák",
    "email": "jan@example.com",
    "phone": "+420777123456",
    "message": "Zajímám se o investování do aut.",
    "gdprConsent": true
  }'
# Očekávané: 201 Created + applicationId

# 5. Duplicate check
# (repeat step 4)
# Očekávané: 409 Conflict

# 6. Missing GDPR
curl -i -X POST http://localhost:3000/api/marketplace/apply \
  -H "Content-Type: application/json" \
  -d '{ ..., "gdprConsent": false }'
# Očekávané: 400 Bad Request

# 7. Honeypot filled
curl -i -X POST http://localhost:3000/api/marketplace/apply \
  -H "Content-Type: application/json" \
  -d '{ ..., "website": "spam.com" }'
# Očekávané: 200 OK, ale žádný DB record

# 8. Gated redirect (neauth)
curl -i http://localhost:3000/marketplace/dealer
# Očekávané: 307 Redirect → /marketplace/apply?reason=auth_required&role=dealer

# 9. Gated redirect (auth but wrong role)
curl -i http://localhost:3000/marketplace/dealer \
  -H "Cookie: next-auth.session-token=<BROKER_TOKEN>"
# Očekávané: 307 Redirect → /marketplace?reason=not_authorized
```

### Prisma Studio kontrola
- [ ] Po submitu apply form: `prisma studio` → tabulka `MarketplaceApplication` obsahuje nový záznam
- [ ] Status="NEW", ipAddress je zaznamenán, gdprConsent=true

### E2E (budoucí task)
```typescript
test("public apply flow works", async ({ page }) => {
  await page.goto("/marketplace");
  await page.click("text=Chci investovat");
  await expect(page).toHaveURL(/\/marketplace\/apply\?role=investor/);
  await page.fill('[name="firstName"]', "Jan");
  // ... fill all fields ...
  await page.check('[name="gdprConsent"]');
  await page.click("text=Odeslat žádost");
  await expect(page.locator("text=Žádost odeslána")).toBeVisible();
});
```

---

## 7. Rizika a mitigace

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Rate limit helper neexistuje v projektu | Střední | Low | Reuse existing (viz `lib/rate-limit.ts`?) nebo inline Map-based. Fallback: jen basic IP check. |
| Resend není setup pro marketplace emails | Nízké | Low | `lib/resend.ts` má dry-run fallback (task #19). Templates se zalogují, žádný crash. |
| Spam attack na public endpoint | Střední | Medium | Honeypot + rate limit + Cloudflare (pokud produkce má WAF). |
| User spustí apply s existujícím emailem (already registered) | Vysoká | Low | Validace: `findFirst` v User table → pokud existuje, return 200 s info "Už jste registrován, přihlaste se". Neodhalovat existenci emailu pro neprihlášené. |
| GDPR compliance — ukládáme IP + UA | Jisté | Medium | Zdůvodnit v privacy policy (legitimate interest — anti-spam). Automatické mazání po 90 dnech. Přidat cron task? (mimo scope) |
| Middleware redirect na `/marketplace/apply` místo `/login` mate stávající usery | Střední | Medium | V UI na `/marketplace/apply` přidat prominent "Už máte účet? Přihlaste se" link vedle tlačítka. |

---

## 8. Kritické soubory

### Upravit
```
app/(web)/marketplace/page.tsx                    ← přidat searchParams + redirect notice
components/web/marketplace/ApplyForm.tsx          ← refactor na public form s všemi poli
app/api/marketplace/apply/route.ts                ← rewrite: no auth, DB persist, emails
lib/validators/marketplace.ts                     ← update applySchema
middleware.ts:227-261                             ← přidat reason query params
prisma/schema.prisma                              ← nový model MarketplaceApplication
```

### Vytvořit
```
app/(web)/marketplace/apply/page.tsx              ← nová dedikovaná stránka
app/(web)/marketplace/apply/loading.tsx           ← boilerplate
app/(web)/marketplace/apply/error.tsx             ← boilerplate
components/web/marketplace/MarketplaceRedirectNotice.tsx  ← Alert při redirectu
lib/email-templates/marketplace-application-admin.ts
lib/email-templates/marketplace-application-confirmation.ts
prisma/migrations/XXXXXX_marketplace_application/migration.sql
```

### Beze změny (jen referenced)
```
middleware.ts:1-226                              ← ostatní gating beze změn
app/(web)/marketplace/dealer/*                    ← gated dashboardy beze změn
app/(web)/marketplace/investor/*                  ← gated dashboardy beze změn
app/api/marketplace/opportunities/*               ← fix v task #30
lib/resend.ts                                     ← už existuje
lib/email-templates/index.ts                      ← update v task #19 update
```

---

## 9. Otázky pro team-leada

1. **Redirect strategie pro neauth:** `/marketplace/apply` nebo klasické `/login`? Navrhuji **`/marketplace/apply`** protože marketplace je VIP a většina návštěvníků nemá správnou roli; logicky je chceme do apply flow.

2. **Investment range picker:** Chceme to jako select s rozsahy (10k-50k, 50k-200k, ...) nebo volný text? Navrhuji **select** pro strukturovaný lead.

3. **Admin CRM scope:** Implementovat teď (+200-300 řádků kódu) nebo jako follow-up `#29a`? Navrhuji **follow-up** — MVP stačí DB persist + Prisma Studio review.

4. **Auto-convert žádosti na user account při approve:** Implementace teď nebo follow-up? Navrhuji **follow-up** — MVP může admin manually založit user + set role, pak propojit přes `convertedUserId`.

5. **Duplicate email — rozkrývat existující user?** Security best practice je neprozrazovat. Ale UX je lepší říct "Už máte účet, přihlaste se". Navrhuji **UX wins** — zpráva "Pokud jste již registrován, přihlaste se [link]".

---

## 10. Commit messages (suggested)

Rozdělit do menších commitů:

```
feat(marketplace): add MarketplaceApplication Prisma model

Persist public applications for admin workflow. Tracks status,
reviewer, GDPR consent, anti-spam metadata.
```

```
feat(marketplace): public apply API without auth requirement

Rewrite POST /api/marketplace/apply to accept applications from
unauthenticated visitors. Persists to MarketplaceApplication,
sends admin notification + applicant confirmation email.
Includes rate limit, honeypot anti-spam, duplicate guard.
```

```
feat(marketplace): dedicated /marketplace/apply page with role preselect

New public route /marketplace/apply accepts ?role=investor|dealer
to preselect applicant type. Shows redirect reasons for auth
failures from gated dealer/investor dashboards.
```

```
feat(marketplace): middleware redirect with reason query param

Redirect unauthorized users to /marketplace/apply with reason=auth_required
or /marketplace?reason=not_authorized for role mismatch. Landing page
renders Alert from reason query param.
```

---

## 11. Follow-up tasky

- **#29a** — Admin CRM panel pro marketplace applications (list, detail, approve/reject UI)
- **#29b** — Auto-convert approved application → user account + welcome email + set role
- **#29c** — E2E test `marketplace-apply-flow.spec.ts`
- **#29d** — Cron cleanup starých MarketplaceApplication záznamů po 90 dnech (GDPR)
- **#29e** — Rate limit infrastruktura (pokud neexistuje) — `lib/rate-limit.ts`

---

**Plán hotov. Scope: ~8 souborů upraveno, ~7 souborů vytvořeno, 1 migrace, ~500-600 řádků kódu celkem.**
