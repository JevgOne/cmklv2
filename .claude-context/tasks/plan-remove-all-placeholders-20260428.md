# Plán: Odstranění všech placeholderů — Recenze, Partner Documents, Partner Messages

**Datum:** 2026-04-28
**Autor:** planovac
**Účel:** Kompletní implementační plán pro nahrazení VŠECH fake/hardcoded dat reálnými DB daty.

---

## 1. RECENZE Z DB (KRITICKÉ — fake recenze = právní riziko)

### 1.0 Současný stav

`app/(web)/recenze/page.tsx` je `"use client"` komponenta s **8 hardcoded fake recenzí** (Jana K., Martin D., Tomáš H., Eva S., Pavel K., Marie L., Jiří N., Lucie V.). Žádný Prisma import, žádná DB query.

`app/(web)/page.tsx:195-214` má 3 hardcoded testimonials (stejné fake osoby).

**Existující model v DB:** `SupplierReview` (schema.prisma:2113) — pro hodnocení dodavatelů dílů, NE pro obecné recenze makléřské služby. Potřebujeme nový model.

### 1.1 Prisma schema — Review model

**Soubor:** `prisma/schema.prisma`

```prisma
model Review {
  id          String    @id @default(cuid())
  authorName  String                        // "Jana K."
  authorCity  String?                       // "Praha"
  rating      Int                           // 1-5
  text        String    @db.Text            // text recenze
  type        String    @default("prodejce") // "prodejce" | "kupujici"
  vehicleId   String?                       // optional vazba na Vehicle
  vehicle     Vehicle?  @relation(fields: [vehicleId], references: [id])
  isPublished Boolean   @default(false)     // admin musí schválit
  isFeatured  Boolean   @default(false)     // zobrazit na homepage
  source      String    @default("MANUAL")  // "MANUAL" | "GOOGLE" | "FORM"
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isPublished, isFeatured])
  @@index([isPublished, type])
}
```

**Vehicle relace** — přidat do Vehicle modelu:
```prisma
model Vehicle {
  // ... existing ...
  reviews  Review[]
}
```

**Migrace:** `npx prisma migrate dev --name add_review`

### 1.2 API routes

**Nový:** `app/api/admin/reviews/route.ts`
```
GET  /api/admin/reviews          — seznam recenzí (pagination, filtr published/type)
POST /api/admin/reviews          — vytvořit recenzi manuálně
```

**Nový:** `app/api/admin/reviews/[id]/route.ts`
```
PUT    /api/admin/reviews/[id]   — upravit / schválit / označit featured
DELETE /api/admin/reviews/[id]   — smazat
```

**Nový:** `app/api/reviews/route.ts` (public)
```
GET  /api/reviews                — veřejný seznam (jen published, pagination)
POST /api/reviews                — zákazník posílá recenzi (rate limiting, honeypot)
```

**Validace (Zod):**
```typescript
const reviewSchema = z.object({
  authorName: z.string().min(2).max(100),
  authorCity: z.string().max(50).optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(20).max(2000),
  type: z.enum(["prodejce", "kupujici"]),
  vehicleId: z.string().cuid().optional(),
});
```

### 1.3 Admin stránka

**Nový:** `app/(admin)/admin/reviews/page.tsx`

UI:
- Tabulka recenzí s filtry (Vše / Ke schválení / Publikované / Featured)
- Sloupce: autor, město, rating (hvězdičky), typ, zkrácený text, datum, akce
- Quick actions: Schválit, Zamítnout, Označit jako featured, Smazat
- Tlačítko "Přidat recenzi" (manuální zadání)

**AdminSidebar:**
```typescript
{ id: "reviews", href: "/admin/reviews", icon: "⭐", label: "Recenze" }
```

### 1.4 Stránka /recenze — přepsat

**Soubor:** `app/(web)/recenze/page.tsx` — KOMPLETNÍ PŘEPIS

Z `"use client"` na **server component**:

```typescript
import { prisma } from "@/lib/prisma";

export default async function RecenzePage() {
  const reviews = await prisma.review.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (reviews.length === 0) {
    return <EmptyState text="Zatím žádné recenze. Buďte první!" />;
  }
  // ... render reviews from DB
}
```

- Zachovat stávající design (tabs Vše/Prodejci/Kupující, star rating, cards)
- Tabs implementovat jako URL params (`?type=prodejce`) místo client state
- Přidat CTA "Napsat recenzi" → modální formulář nebo dedikovaná stránka
- Přidat aggregate stats nahoře (průměrné hodnocení, počet recenzí)
- **DOKUD NEJSOU DATA:** zobrazit "Zatím žádné recenze", NE fake

### 1.5 Homepage testimonials — z DB

**Soubor:** `app/(web)/page.tsx`

Změny:
1. Smazat hardcoded `const testimonials = [...]` (řádky 195-214)
2. Přidat DB query:
```typescript
async function getFeaturedReviews() {
  try {
    return await prisma.review.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  } catch {
    return [];
  }
}
```
3. Pokud je `reviews.length === 0` → sekci testimonials NEZOBRAZOVAT (ne fake)

### 1.6 Soubory — recenze

| Soubor | Akce |
|--------|------|
| `prisma/schema.prisma` | Přidat Review model + Vehicle relace |
| `lib/validators/review.ts` | NOVÝ — Zod schémata |
| `app/api/admin/reviews/route.ts` | NOVÝ — admin CRUD list/create |
| `app/api/admin/reviews/[id]/route.ts` | NOVÝ — admin update/delete |
| `app/api/reviews/route.ts` | NOVÝ — public GET + customer POST |
| `app/(admin)/admin/reviews/page.tsx` | NOVÝ — admin správa |
| `components/admin/AdminSidebar.tsx` | Přidat "Recenze" link |
| `app/(web)/recenze/page.tsx` | PŘEPSAT — server component z DB |
| `app/(web)/page.tsx` | UPRAVIT — testimonials z DB |

**Celkem:** 5 nových + 4 upravených

---

## 2. PARTNER DOCUMENTS

### 2.0 Současný stav

`app/(partner)/partner/documents/page.tsx` — 3 hardcoded document cards, 2 z nich "Připravujeme". Neexistuje DB model ani upload.

### 2.1 Prisma schema — PartnerDocument model

**Soubor:** `prisma/schema.prisma`

```prisma
model PartnerDocument {
  id          String   @id @default(cuid())
  partnerId   String
  partner     Partner  @relation(fields: [partnerId], references: [id])
  title       String
  description String?
  fileUrl     String
  fileName    String
  fileSize    Int                          // bytes
  category    String                       // CONTRACT | INSURANCE | BUSINESS_ID | TRADE_LICENSE | INVOICE | OTHER
  status      String   @default("PENDING") // PENDING | APPROVED | REJECTED
  uploadedBy  String                       // userId
  uploader    User     @relation(fields: [uploadedBy], references: [id])
  reviewNote  String?                      // admin poznámka při zamítnutí
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([partnerId])
  @@index([status])
}
```

**Relace:**
```prisma
model Partner {
  // ... existing ...
  documents PartnerDocument[]
}

model User {
  // ... existing ...
  uploadedDocuments PartnerDocument[]
}
```

**Migrace:** `npx prisma migrate dev --name add_partner_document`

### 2.2 API routes

**Nový:** `app/api/partners/[id]/documents/route.ts`
```
GET  /api/partners/[id]/documents          — seznam dokumentů (partner nebo admin)
POST /api/partners/[id]/documents          — upload dokumentu (multipart/form-data)
```

**Nový:** `app/api/partners/[id]/documents/[docId]/route.ts`
```
PUT    /api/partners/[id]/documents/[docId]   — admin: schválit/zamítnout
DELETE /api/partners/[id]/documents/[docId]   — smazat
```

**Auth:**
- Partner: GET/POST/DELETE jen na SVOJE dokumenty (`session.user.partnerId === id`)
- Admin/Backoffice: plný přístup na všechny + PUT (approve/reject)

**Upload:**
- Přes `lib/upload.ts` → `{UPLOAD_DIR}/partners/{partnerId}/documents/`
- Max 10 MB per soubor
- Povolené typy: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
- Max 50 dokumentů per partner

**Validace (Zod):**
```typescript
const documentCategoryEnum = z.enum([
  "CONTRACT", "INSURANCE", "BUSINESS_ID", "TRADE_LICENSE", "INVOICE", "OTHER"
]);

const categoryLabels: Record<string, string> = {
  CONTRACT: "Partnerská smlouva",
  INSURANCE: "Pojištění",
  BUSINESS_ID: "IČO doklad",
  TRADE_LICENSE: "Živnostenský list",
  INVOICE: "Měsíční vyúčtování",
  OTHER: "Ostatní",
};
```

### 2.3 Partner Documents stránka — přepsat

**Soubor:** `app/(partner)/partner/documents/page.tsx` — KOMPLETNÍ PŘEPIS

```typescript
export default async function PartnerDocumentsPage() {
  const session = await getServerSession(authOptions);
  const partner = await prisma.partner.findFirst({
    where: { userId: session.user.id },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div>
      {/* Sekce 1: Statické odkazy */}
      {/* - Obchodní podmínky → /obchodni-podminky (ZŮSTÁVÁ) */}

      {/* Sekce 2: Požadované dokumenty */}
      {/* Grid karet s kategoriemi — každá ukazuje status:
          - ✅ Schváleno (zelená) — se download linkem
          - ⏳ Čeká na schválení (oranžová)
          - ❌ Zamítnuto (červená) — s poznámkou + možnost nahrát znovu
          - ⬆️ Chybí (šedá) — s upload tlačítkem
      */}

      {/* Sekce 3: Všechny dokumenty (tabulka/seznam) */}
      {/* Upload zone na spodku stránky */}
    </div>
  );
}
```

**Požadované kategorie (zobrazit vždy jako karty):**
1. Partnerská smlouva (CONTRACT)
2. Pojištění (INSURANCE)
3. IČO doklad (BUSINESS_ID)
4. Živnostenský list (TRADE_LICENSE)

Upload komponenta: drag & drop zone + file input, kategorie select.

### 2.4 Admin — partner documents review

V existující admin partner detail stránce přidat sekci:

**Soubor:** Upravit existující admin partner detail NEBO nová stránka `app/(admin)/admin/partners/[id]/documents/page.tsx`

UI:
- Seznam dokumentů partnera
- Tlačítka: Schválit / Zamítnout (s poznámkou) / Stáhnout / Smazat
- Upload dokumentu PRO partnera (admin nahraje smlouvu)
- Badge s počtem PENDING dokumentů v partner listu

### 2.5 Soubory — partner documents

| Soubor | Akce |
|--------|------|
| `prisma/schema.prisma` | Přidat PartnerDocument + relace |
| `lib/validators/partner-document.ts` | NOVÝ — Zod schémata |
| `app/api/partners/[id]/documents/route.ts` | NOVÝ — GET/POST |
| `app/api/partners/[id]/documents/[docId]/route.ts` | NOVÝ — PUT/DELETE |
| `app/(partner)/partner/documents/page.tsx` | PŘEPSAT — server component |
| Admin partner detail | UPRAVIT — přidat documents sekci |

**Celkem:** 3 nové + 3 upravené

---

## 3. PARTNER MESSAGES

### 3.0 Současný stav

`app/(partner)/partner/messages/page.tsx` — **NENÍ STUB!** Stránka je plně funkční:
- Tahat notifikace z DB: `prisma.notification.findMany({ where: { userId } })`
- Zobrazuje reálné systémové notifikace (title, body, type, read/unread badge, datum)
- Prázdný stav: "Žádné zprávy" + "Pro komunikaci nás kontaktujte na info@carmakler.cz / +420 733 179 199"

**Verdikt: NENÍ PLACEHOLDER. Partner messages jsou funkční.**

Stránka zobrazuje systémové notifikace (type: COMMISSION, VEHICLE, SYSTEM, MESSAGE) z existujícího Notification modelu. Kontaktní info (email + telefon) slouží jako fallback pro přímou komunikaci s adminem.

### 3.1 Co PŘÍPADNĚ zlepšit (NÍZKÁ priorita)

Pokud je v budoucnu potřeba real-time messaging:
1. **Pusher** — tech stack uvádí Pusher ale NENÍ implementován (žádné importy v kódu). Pro real-time chat by byl potřeba:
   - Pusher server-side push při nové notifikaci
   - Client-side subscribe v Navbar/NotificationBell
   - ~2-3h implementace
2. **Mark as read** — stránka neukazuje možnost označit notifikaci jako přečtenou. Endpoint existuje v marketplace (`/api/marketplace/notifications/[id]/read`), ale ne obecný.
3. **Filtering** — přidat filtry po typu notifikace

**Doporučení:** NE-implementovat teď. Partner messages fungují. Zaměřit se na recenze a documents.

---

## SOUHRNNÁ TABULKA

| Oblast | Nové soubory | Upravené soubory | Effort | Priorita |
|--------|-------------|-----------------|--------|----------|
| Recenze z DB | 5 | 4 | STŘEDNÍ (4-6h) | KRITICKÁ |
| Partner Documents | 3 | 3 | STŘEDNÍ (3-5h) | VYSOKÁ |
| Partner Messages | 0 | 0 | 0 | HOTOVO (funkční) |

**Celkem:** 8 nových souborů + 7 upravených

---

## POŘADÍ IMPLEMENTACE

```
1. Prisma schema (Review + PartnerDocument) ──→ npx prisma migrate dev
2. Recenze API + admin stránka (PARALELNĚ s 3.)
3. Partner Documents API + stránka (PARALELNĚ s 2.)
4. Přepis /recenze stránky
5. Homepage testimonials z DB
```

Fáze 2 a 3 jsou na sobě nezávislé — implementátor je může řešit paralelně nebo sekvenčně.

---

## STOP PRAVIDLA

1. **STOP** — žádné fake/hardcoded recenze. Dokud nejsou reálná data → "Zatím žádné recenze"
2. **STOP** — žádné "Připravujeme" texty. Chybějící dokument = upload tlačítko
3. **STOP** — partner vidí JEN svoje dokumenty (session check)
4. **STOP** — recenze musí projít admin schválením (`isPublished: false` default)
5. **STOP** — upload přes `lib/upload.ts`, NE přes Cloudinary SDK
6. **STOP** — rate limiting na public POST /api/reviews (5 per IP per hodinu)
7. **STOP** — partner messages = NEZASAHOVAT, funguje
