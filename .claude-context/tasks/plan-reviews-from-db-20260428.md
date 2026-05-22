# Plán: Recenze z DB + Team Management + Admin Dashboard Grafy

**Datum:** 2026-04-28
**Autor:** planovac
**Účel:** Kompletní plán pro 3 oblasti: (1) Recenze, (2) Admin team, (3) Admin dashboard grafy

---

## 1. RECENZE Z DB (KRITICKÉ)

### 1.0 Současný stav

- `app/(web)/recenze/page.tsx` — `"use client"`, **8 hardcoded fake recenzí**, žádný Prisma import
- `app/(web)/page.tsx:195-214` — 3 hardcoded testimonials (Jana K., Martin D., Tomáš H.)
- Existující `SupplierReview` model je jen pro dodavatele dílů, NE pro makléřské recenze

### 1.1 Prisma schema

**Soubor:** `prisma/schema.prisma`

```prisma
model Review {
  id          String    @id @default(cuid())
  authorName  String                        // "Jana K."
  authorCity  String?                       // "Praha"
  rating      Int                           // 1-5
  text        String    @db.Text
  type        String    @default("prodejce") // "prodejce" | "kupujici"
  vehicleId   String?
  vehicle     Vehicle?  @relation(fields: [vehicleId], references: [id])
  isPublished Boolean   @default(false)     // admin schvaluje
  isFeatured  Boolean   @default(false)     // zobrazit na homepage
  source      String    @default("MANUAL")  // MANUAL | GOOGLE | FORM
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isPublished, isFeatured])
  @@index([isPublished, type])
}
```

Vehicle relace:
```prisma
model Vehicle {
  // ... existing ...
  reviews Review[]
}
```

### 1.2 API routes

**Nový:** `app/api/admin/reviews/route.ts`
```
GET  — seznam recenzí (pagination, filtr: all/pending/published/featured)
POST — vytvořit recenzi manuálně (admin)
```

**Nový:** `app/api/admin/reviews/[id]/route.ts`
```
PUT    — upravit / schválit (isPublished) / featured toggle
DELETE — smazat
```

**Nový:** `app/api/reviews/route.ts` (public)
```
GET  — published recenze (pagination, filtr type)
POST — zákazník posílá recenzi (rate limit: 5/IP/hodinu, honeypot)
```

**Validace:** `lib/validators/review.ts`
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
- Tabs: Vše | Ke schválení | Publikované | Featured
- Tabulka: autor, město, ★ rating, typ badge, zkrácený text (50 znaků), datum
- Quick actions: ✅ Schválit, ⭐ Featured toggle, 🗑️ Smazat
- Tlačítko "+ Přidat recenzi" → formulář (modal nebo inline)
- Search bar (hledat v textu/jménu)

**AdminSidebar:** `components/admin/AdminSidebar.tsx`
```typescript
{ id: "reviews", href: "/admin/reviews", icon: "⭐", label: "Recenze" }
```

### 1.4 Stránka /recenze — PŘEPSAT

**Soubor:** `app/(web)/recenze/page.tsx` — z `"use client"` na **server component**

```typescript
import { prisma } from "@/lib/prisma";

export default async function RecenzePage({
  searchParams,
}: { searchParams: Promise<{ type?: string; page?: string }> }) {
  const params = await searchParams;
  const type = params.type; // "prodejce" | "kupujici" | undefined (vše)
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const perPage = 12;

  const where = {
    isPublished: true,
    ...(type ? { type } : {}),
  };

  const [reviews, total, avgRating] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({
      where: { isPublished: true },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  // Zobrazit aggregate stats nahoře (průměr, počet)
  // Tabs jako URL params (?type=prodejce)
  // Pokud 0 recenzí → "Zatím žádné recenze. Buďte první!"
  // Pagination
}
```

- Zachovat stávající card design (hvězdičky, citát, autor, město, datum)
- Tabs: `?type=prodejce`, `?type=kupujici`, bez params = vše
- Přidat CTA "Napsat recenzi" → link na formulář (přihlášení vyžadováno)
- **PRÁZDNÝ STAV:** "Zatím žádné recenze. Buďte první!" — NE fake data

### 1.5 Homepage testimonials — z DB

**Soubor:** `app/(web)/page.tsx`

1. SMAZAT `const testimonials = [...]` (řádky 195-214)
2. Přidat:
```typescript
async function getFeaturedReviews() {
  try {
    return await prisma.review.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  } catch { return []; }
}
```
3. Pokud 0 featured → sekci testimonials NEZOBRAZOVAT

### 1.6 Kariéra pozice — z DB

**Soubor:** `app/(web)/kariera/page.tsx`

Aktuálně hardcoded: 3 pozice (Automakléř Praha/Brno, Regionální manažer).

**Prisma model:**
```prisma
model JobPosition {
  id          String   @id @default(cuid())
  title       String                       // "Automakléř"
  location    String                       // "Praha"
  description String   @db.Text
  isActive    Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**API:** `app/api/admin/jobs/route.ts` (GET/POST), `app/api/admin/jobs/[id]/route.ts` (PUT/DELETE)

**Admin stránka:** `app/(admin)/admin/jobs/page.tsx` — CRUD seznam pozic

**AdminSidebar:** Přidat `{ id: "jobs", href: "/admin/jobs", icon: "💼", label: "Kariéra" }`

**Kariéra stránka:** Smazat `const positions = [...]`, nahradit DB query:
```typescript
const positions = await prisma.jobPosition.findMany({
  where: { isActive: true },
  orderBy: { order: "asc" },
});
```
Pokud 0 pozic → "Aktuálně nehledáme nové kolegy. Sledujte nás."

**Seed data:** Přidat stávající 3 pozice.

### 1.7 Soubory — recenze + kariéra

| Soubor | Akce | Fáze |
|--------|------|------|
| `prisma/schema.prisma` | Review + JobPosition modely | 1 |
| `lib/validators/review.ts` | NOVÝ | 1 |
| `app/api/admin/reviews/route.ts` | NOVÝ | 2 |
| `app/api/admin/reviews/[id]/route.ts` | NOVÝ | 2 |
| `app/api/reviews/route.ts` | NOVÝ (public) | 2 |
| `app/(admin)/admin/reviews/page.tsx` | NOVÝ | 3 |
| `app/api/admin/jobs/route.ts` | NOVÝ | 2 |
| `app/api/admin/jobs/[id]/route.ts` | NOVÝ | 2 |
| `app/(admin)/admin/jobs/page.tsx` | NOVÝ | 3 |
| `components/admin/AdminSidebar.tsx` | +2 linky (Recenze, Kariéra) | 3 |
| `app/(web)/recenze/page.tsx` | PŘEPSAT | 4 |
| `app/(web)/page.tsx` | UPRAVIT testimonials | 4 |
| `app/(web)/kariera/page.tsx` | UPRAVIT positions | 4 |
| `prisma/seed.ts` | Seed reviews + jobs | 5 |

**Celkem:** 8 nových + 6 upravených

---

## 2. ADMIN TEAM MANAGEMENT

Plán existuje: `plan-admin-team-management-20260428.md`

Shrnutí:
- `TeamMember` model (name, initials, position, bio, photoUrl, order, isPublic)
- Admin CRUD `/admin/team` + API routes
- O nás stránka → DB query místo hardcoded `const team = [...]`
- 3 nové + 4 upravené soubory
- Yevgen = "Zakladatel, CEO & CTO" ✅ (už je správně v kódu)

---

## 3. ADMIN DASHBOARD GRAFY (PLACEHOLDER BOXY)

### 3.0 Současný stav

`app/(admin)/admin/dashboard/page.tsx` — řádky 117-144:

Dva prázdné placeholder boxy:
```
řádek 127-129: <div class="bg-gray-50 h-[300px]">📊 Graf prodejů</div>
řádek 140-142: <div class="bg-gray-50 h-[300px]">📊 Graf provizí</div>
```

StatCards (řádky 90-115) jsou z reálných Prisma queries ✅
Activity feed (řádky 147-195) je z reálných DB dat ✅
Pending approvals (řádky 198-264) je z reálných DB dat ✅

**JEN grafy jsou placeholder.**

### 3.1 Implementace — Sales Chart (prodeje za 12 měsíců)

**Data query** — přidat do page.tsx:
```typescript
const salesByMonth = await Promise.all(
  Array.from({ length: 12 }, (_, i) => {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - 10 + i, 1);
    return prisma.vehicle.count({
      where: { status: "SOLD", soldAt: { gte: monthStart, lt: monthEnd } },
    }).then(count => ({
      label: monthStart.toLocaleDateString("cs-CZ", { month: "short" }),
      count,
    }));
  })
);
```

**UI:** Simple CSS bar chart (stejný pattern jako makléř stats — funguje bez Recharts):
```tsx
<div className="flex items-end gap-2 h-[280px]">
  {salesByMonth.map((m, i) => (
    <div key={i} className="flex-1 flex flex-col items-center gap-1">
      <span className="text-xs text-gray-500 font-bold">{m.count}</span>
      <div
        className="w-full bg-orange-500 rounded-t-md"
        style={{ height: `${Math.max((m.count / maxSales) * 100, 4)}%` }}
      />
      <span className="text-xs text-gray-400">{m.label}</span>
    </div>
  ))}
</div>
```

### 3.2 Implementace — Commission Chart (provize podle regionů)

**Data query:**
```typescript
const commissionByRegion = await prisma.commission.groupBy({
  by: ["regionId"],
  _sum: { commission: true },
  _count: true,
  where: { soldAt: { gte: startOfMonth } },
});

// Enrichovat s regionovými jmény
const regions = await prisma.region.findMany({
  select: { id: true, name: true },
});
```

**UI:** Horizontal bar chart — region name vlevo, bar vpravo:
```tsx
{regionStats.map(r => (
  <div className="flex items-center gap-3">
    <span className="w-24 text-sm text-gray-600 truncate">{r.name}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-6">
      <div
        className="bg-blue-500 rounded-full h-6"
        style={{ width: `${(r.total / maxRegion) * 100}%` }}
      />
    </div>
    <span className="text-sm font-bold w-16 text-right">{formatPrice(r.total)}</span>
  </div>
))}
```

### 3.3 PeriodSelector — napojit na reálné filtrování

`components/admin/PeriodSelector.tsx` — pokud ještě nefunguje, implementovat jako URL param `?period=7d|30d|12m` a upravit queries.

### 3.4 Soubory — admin dashboard

| Soubor | Akce |
|--------|------|
| `app/(admin)/admin/dashboard/page.tsx` | UPRAVIT — reálné grafy místo placeholder boxů |
| `components/admin/PeriodSelector.tsx` | OVĚŘIT/UPRAVIT — funkční filtrování |

**Celkem:** 0 nových + 2 upravené. Žádné nové dependencies (CSS grafy, ne Recharts).

---

## CELKOVÝ SOUHRN

| Oblast | Nové soubory | Upravené | Effort |
|--------|-------------|----------|--------|
| Recenze z DB | 5 | 4 | 4-6h |
| Kariéra pozice z DB | 3 | 2 | 1-2h |
| Team management | 3 | 4 | 2-3h |
| Admin dashboard grafy | 0 | 2 | 1-2h |
| **CELKEM** | **11** | **12** | **8-13h** |

---

## POŘADÍ IMPLEMENTACE

```
FÁZE 0: Schema migrace (Review + JobPosition + TeamMember) ───┐
                                                               │
FÁZE 1a: Recenze API + admin stránka ─────────────────────────┤ PARALELNĚ
FÁZE 1b: Team management API + admin stránka ─────────────────┤
FÁZE 1c: Kariéra API + admin stránka ─────────────────────────┤
FÁZE 1d: Admin dashboard grafy ───────────────────────────────┘
                                                               │
FÁZE 2: Přepis web stránek (recenze, homepage, o-nas, kariéra)┘
```

Fáze 1a-1d jsou nezávislé — implementátor může řešit v libovolném pořadí.

---

## STOP PRAVIDLA

1. **STOP** — žádné fake recenze. Prázdný stav = "Zatím žádné recenze"
2. **STOP** — žádné "Připravujeme" texty nikde
3. **STOP** — recenze: `isPublished: false` default, admin musí schválit
4. **STOP** — rate limiting na public POST /api/reviews
5. **STOP** — dashboard grafy: CSS bar charts, NE Recharts (zbytečná dependency)
6. **STOP** — upload přes `lib/upload.ts`, NE Cloudinary SDK
7. **STOP** — seed: stávající texty z hardcoded polí, ne přepisovat
8. **STOP** — Yevgen pozice = "Zakladatel, CEO & CTO"
