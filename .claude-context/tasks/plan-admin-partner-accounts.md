# Plan: Admin vytvareni uctu pro partnery (vrakoviste/autobazar)

**Datum:** 2026-04-26 (v2 — zjednoduseny)
**Status:** PLAN READY
**Ucel:** Admin vyplni formular a ROVNOU se vytvori Partner + User ucet v jednom kroku

---

## Analyza aktualniho stavu

### Existujici kod k reuse:

| Co | Kde | Popis |
|----|-----|-------|
| Partner model | `prisma/schema.prisma:1823-1883` | Kompletni, type AUTOBAZAR/VRAKOVISTE, propojeni na User pres userId |
| User model | `prisma/schema.prisma:13-93` | Role PARTNER_BAZAR, PARTNER_VRAKOVISTE uz definovane |
| generatePassword() | `api/partners/[id]/activate/route.ts:7-13` | 12-znakove alfanumericke heslo |
| Aktivacni logika | `api/partners/[id]/activate/route.ts:89-108` | Vytvori User, bcrypt hash, propoji s Partner |
| createPartnerSchema | `lib/validators/partner.ts:18-38` | Validace vsech poli |
| slugify() | `lib/utils.ts` | Generovani slugu |
| sendEmail() | `lib/resend.ts:34-69` | Resend wrapper s graceful fallback |
| UI komponenty | `components/ui/{Input,Select,Textarea,Button,Card,Modal}` | Vsechny existuji |
| Partners page | `app/(admin)/admin/partners/page.tsx` | Tabulka + funnel (chybi tlacitko "Pridat") |

### Co chybi:
- UI formular pro vytvoreni noveho partnera
- "Pridat partnera" tlacitko na prehledove strance
- API endpoint/logika pro kombinovane vytvoreni Partner + User

---

## Plan implementace

### Krok 1: Nova stranka `/admin/partners/new`

**Novy soubor:** `app/(admin)/admin/partners/new/page.tsx`
```tsx
// Server Component — jen renderuje formular
import { CreatePartnerForm } from "@/components/admin/partners/CreatePartnerForm";
export default function NewPartnerPage() {
  return <CreatePartnerForm />;
}
```

**Novy soubor:** `app/(admin)/admin/partners/new/loading.tsx` — standardni skeleton
**Novy soubor:** `app/(admin)/admin/partners/new/error.tsx` — standardni error boundary

### Krok 2: Formular `CreatePartnerForm.tsx`

**Novy soubor:** `components/admin/partners/CreatePartnerForm.tsx`

"use client" komponenta s React Hook Form (nebo useState — dle existujicich patternu v projektu).

#### Pole formulare:

| Pole | Label | Typ | Povinne | Validace |
|------|-------|-----|---------|----------|
| type | Typ partnera | Select: AUTOBAZAR / VRAKOVISTE | ANO | enum |
| name | Nazev firmy | Text input | ANO | min 1 char |
| contactPerson | Kontaktni osoba | Text input | ANO | min 1 char |
| email | Email | Email input | ANO | Zod email |
| phone | Telefon | Text input | NE | — |
| ico | ICO | Text input | NE | regex 8 cislic |
| address | Adresa | Text input | NE | — |
| city | Mesto | Text input | NE | — |
| region | Kraj | Select (14 kraju) | NE | — |
| zip | PSC | Text input | NE | — |
| notes | Poznamky | Textarea | NE | — |

**Pozn:** Email je POVINNY (protoze vzdy tvorime ucet). V puvodnim `createPartnerSchema` je email optional — bude treba novy schema nebo override.

#### Chovani po odeslani:
1. POST na `/api/partners/create-with-account`
2. Zobrazit vysledek v modalu:
   - Email: partner@firma.cz
   - Docasne heslo: `Ab3kM7nPqR2x`
   - Tlacitko "Zkopirovat udaje"
   - Info text: "Odeslali jsme partnerovi email s prihlasovacimi udaji."
3. Po zavreni modalu → redirect na `/admin/partners/[id]`

#### Wireframe:

```
+--------------------------------------------------+
| Admin / Partneri / Novy partner                   |
+--------------------------------------------------+
|                                                    |
| Typ partnera:  ( ) Autobazar  ( ) Vrakoviste      |
|                                                    |
| Nazev firmy *     [________________________]      |
| Kontaktni osoba * [________________________]      |
| Email *           [________________________]      |
| Telefon           [________________________]      |
| ICO               [________]                       |
|                                                    |
| Adresa            [________________________]      |
| Mesto              [____________]                   |
| Kraj              [Vyberte... ▾]                   |
| PSC               [_____]                          |
|                                                    |
| Poznamky          [________________________]      |
|                    [________________________]      |
|                                                    |
|              [Zrusit]  [Vytvorit ucet]             |
+--------------------------------------------------+
```

### Krok 3: Novy API endpoint

**Novy soubor:** `app/api/partners/create-with-account/route.ts`

Protoze existujici POST `/api/partners` slouzi pro CRM (jen Partner zaznam), vytvorime separatni endpoint pro combined flow. Nemichame dve ruzne logiky do jednoho endpointu.

#### Logika:

```
1. Auth check: session.user.role in [ADMIN, BACKOFFICE]
2. Validace: createPartnerWithAccountSchema (email POVINNY)
3. Duplicate check: User s timto emailem uz existuje? → 400
4. $transaction:
   a. Partner.create({ ...data, slug, status: "AKTIVNI_PARTNER" })
   b. User.create({
        email, passwordHash: bcrypt(generatedPassword),
        firstName: contactPerson.split(" ")[0],
        lastName: contactPerson.split(" ").slice(1).join(" "),
        role: type === "AUTOBAZAR" ? "PARTNER_BAZAR" : "PARTNER_VRAKOVISTE",
        status: "ACTIVE",
        phone, companyName: name, ico, logo: null
      })
   c. Partner.update({ userId: user.id })
   d. PartnerActivity.create({ type: "SYSTEM", title: "Ucet vytvoren adminem" })
5. sendEmail → partner s prihlasovacimi udaji
6. Return { partner, credentials: { email, temporaryPassword } }
```

#### Novy Zod schema:

**Edit:** `lib/validators/partner.ts` — pridat:

```typescript
export const createPartnerWithAccountSchema = z.object({
  name: z.string().min(1, "Nazev je povinny"),
  type: z.enum(PARTNER_TYPES),
  email: z.string().email("Neplatny email"),           // POVINNE
  contactPerson: z.string().min(1, "Kontaktni osoba je povinna"),  // POVINNE
  ico: z.string().regex(/^\d{8}$/, "ICO musi mit 8 cislic").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
```

### Krok 4: Email s prihlasovacimi udaji

Pouzit existujici `sendEmail()` z `lib/resend.ts`.

```typescript
await sendEmail({
  to: email,
  subject: "Vas ucet na Carmakler — prihlasovaci udaje",
  html: `
    <h2>Vitejte v Carmakler!</h2>
    <p>Vas ucet byl vytvoren. Prihlaste se na:</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Heslo:</strong> ${temporaryPassword}</p>
    <p><a href="${BASE_URL}/login">Prihlasit se</a></p>
    <p>Po prvnim prihlaseni si prosim zmente heslo.</p>
  `,
});
```

### Krok 5: Tlacitko na prehledove strance

**Edit:** `app/(admin)/admin/partners/page.tsx`

Pridat do headeru vedle nadpisu:

```tsx
<Link href="/admin/partners/new">
  <Button variant="primary" size="sm">+ Novy partner</Button>
</Link>
```

### Krok 6: Extrahovat generatePassword()

**Edit:** Presunout `generatePassword()` z `api/partners/[id]/activate/route.ts` do `lib/auth-utils.ts` (nebo `lib/utils.ts`) a importovat na obou mistech.

---

## Souhrn zmen

| Soubor | Akce | Slozitost |
|--------|------|-----------|
| `app/(admin)/admin/partners/new/page.tsx` | NOVY | Trivialni (wrapper) |
| `app/(admin)/admin/partners/new/loading.tsx` | NOVY | Trivialni |
| `app/(admin)/admin/partners/new/error.tsx` | NOVY | Trivialni |
| `components/admin/partners/CreatePartnerForm.tsx` | NOVY | STREDNI (hlavni formular + success modal) |
| `app/api/partners/create-with-account/route.ts` | NOVY | STREDNI (Partner + User + email) |
| `lib/validators/partner.ts` | EDIT | MALA (pridat 1 schema) |
| `app/(admin)/admin/partners/page.tsx` | EDIT | MALA (pridat 1 tlacitko) |
| `lib/auth-utils.ts` (nebo lib/utils.ts) | EDIT | MALA (extrahovat generatePassword) |
| `app/api/partners/[id]/activate/route.ts` | EDIT | MALA (import generatePassword) |

**Celkem: 5 novych souboru, 4 edity. Slozitost: STREDNI.**

---

## Prisma zmeny

**ZADNE.** Vsechny modely a pole existuji:
- Partner.userId → User.id (1:1 relace)
- Partner.status = "AKTIVNI_PARTNER"
- User.role = "PARTNER_BAZAR" | "PARTNER_VRAKOVISTE"
- User.status = "ACTIVE"
- PartnerActivity pro logging

---

## Bezpecnost

1. **Autorizace:** Pouze ADMIN a BACKOFFICE
2. **Email validace:** Zod `.email()`
3. **Email duplicita:** Check `prisma.user.findUnique({ where: { email } })` pred vytvorenim
4. **Heslo:** 12-char alphanumeric (bez ambiguoznich znaku 0/O/l/I)
5. **Bcrypt:** Hash s cost 10
6. **Transaction:** Partner + User vytvoreni v jedne transakci (atomicita)
7. **CSRF:** NextAuth session check

---

## Existujici kod k reuse

| Co | Odkud | Jak |
|----|-------|-----|
| `generatePassword()` | `api/partners/[id]/activate/route.ts:7-13` | Extrahovat do shared, import |
| User create logika | `api/partners/[id]/activate/route.ts:93-108` | Zkopirovat pattern |
| `sendEmail()` | `lib/resend.ts` | Import a pouzit |
| `slugify()` | `lib/utils.ts` | Import a pouzit |
| `createPartnerSchema` | `lib/validators/partner.ts` | Jako zaklad pro novy schema |
| UI: Input, Select, Button, Card, Modal, Textarea | `components/ui/` | Import a pouzit |
| PartnerStatusBadge | `components/admin/partners/` | Pro success modal |

---

## Flow diagram

```
Admin klikne "+ Novy partner"
    |
    v
/admin/partners/new (formular)
    |
    v
Vyplni: typ, nazev, kontakt, email, telefon, ICO, adresa
    |
    v
Klik "Vytvorit ucet"
    |
    v
POST /api/partners/create-with-account
    |
    v
[Validace] → [Duplicate check] → [$transaction: Partner + User] → [sendEmail]
    |
    v
Response: { partner, credentials }
    |
    v
Modal: "Ucet vytvoren!"
  - Email: partner@firma.cz
  - Heslo: Ab3kM7nPqR2x
  - [Zkopirovat] [Hotovo]
    |
    v
Redirect → /admin/partners/[id]
```
