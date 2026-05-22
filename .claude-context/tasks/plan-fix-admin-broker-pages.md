# Implementační plán — Oprava admin broker stránek

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-25  
**Zdroj:** audit-admin-buttons-links.md  
**Status:** ČEKÁ NA SCHVÁLENÍ LEADEM

---

## Scope oprav

| Priorita | Popis | Stav |
|----------|-------|------|
| **P0** | Vytvořit broker detail stránku (`/admin/brokers/[id]`) | TODO |
| **P0** | Vytvořit broker edit stránku (`/admin/brokers/[id]/edit`) | TODO |
| **P0** | Vytvořit API route `GET /api/admin/brokers/[id]` (detail) | TODO |
| **P0** | Vytvořit API route `PATCH /api/admin/brokers/[id]` (edit) | TODO |
| **P1** | Opravit NotificationBell — volá broker API z admin kontextu | TODO |

---

## Analýza existujících vzorů

### Vzor: Vehicle detail stránka
**Soubor:** `app/(admin)/admin/vehicles/[id]/page.tsx` (252 řádků)  
**Pattern:**
1. Server Component (NO "use client")
2. `getServerSession(authOptions)` → role check `["ADMIN", "BACKOFFICE", "MANAGER"]`
3. `await params` → `prisma.vehicle.findUnique({ where: { id }, include: {...} })`
4. `notFound()` pokud neexistuje
5. Breadcrumb → status + metadata → info grid (2 sloupce Card) → popis
6. Tlačítko "Upravit" linkuje na `[id]/edit`
7. `export const dynamic = "force-dynamic"` — NE, vehicle page toto nemá (ale dashboard ano)

### Vzor: Vehicle edit stránka
**Soubor:** `app/(admin)/admin/vehicles/[id]/edit/page.tsx` (77 řádků)  
**Pattern:**
1. Server Component — načte data z Prisma, předá do client VehicleEditForm
2. Role check shodný s detail stránkou
3. Breadcrumb s linkem zpět na detail
4. `<VehicleEditForm>` client komponenta s `apiUrl` a `redirectUrl` props

### Vzor: Manager broker detail stránka
**Soubor:** `app/(admin)/admin/manager/brokers/[id]/page.tsx` (158 řádků)  
**Pattern:**
1. Server Component → `prisma.user.findFirst({ where: { id, managerId, role: "BROKER" } })`
2. Načte broker profil + vehicles + commissions
3. JSON parse pro `specializations` a `cities` (jsou uložené jako string v DB)
4. Předá data do `<ManagerBrokerDetailContent>` client komponenty
5. `export const dynamic = "force-dynamic"`

### Existující API routes pro brokery
| Route | Method | Účel |
|-------|--------|------|
| `GET /api/admin/brokers` | GET | Seznam všech makléřů (list + onboarding) |
| `PUT /api/admin/brokers/[id]/activate` | PUT | Aktivace makléře (ONBOARDING → ACTIVE) |
| `POST /api/admin/brokers/[id]/reject` | POST | Zamítnutí makléře |
| **`GET /api/admin/brokers/[id]`** | — | **NEEXISTUJE — potřeba vytvořit** |
| **`PATCH /api/admin/brokers/[id]`** | — | **NEEXISTUJE — potřeba vytvořit** |

### NotificationBell analýza
**Soubor:** `components/admin/NotificationBell.tsx`  
**Problém:** Volá `/api/broker/notifications` (linka 25, 56)  
**API route:** `app/api/broker/notifications/route.ts`  
- `ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN", "PARTS_SUPPLIER"]`  
- Vrací notifikace pro `session.user.id` — tedy **funguje i pro ADMIN** (role je v ALLOWED_ROLES)
- Query: `prisma.notification.findMany({ where: { userId } })` — filtruje podle přihlášeného uživatele

**Závěr P1:** API route `/api/broker/notifications` **technicky funguje i pro ADMIN roli** (je v ALLOWED_ROLES). Problém je jen semantický — admin endpoint by neměl volat `/api/broker/*`. Ale funkčně je to OK. Oprava = buď přejmenovat URL, nebo vytvořit proxy. Viz §5 níže.

---

## Prisma schema — relevantní pole User modelu

```
model User {
  id, email, phone, passwordHash, firstName, lastName, avatar
  role        // ADMIN, BACKOFFICE, MANAGER, BROKER, ...
  status      // PENDING, ONBOARDING, ACTIVE, SUSPENDED, INACTIVE
  managerId, manager, teamMembers  // Hierarchie
  regionId, region                 // Region relace
  level, totalSales, totalRevenue  // Gamifikace
  specializations, cities, bio, slug  // Profil makléře (JSON strings)
  coverPhoto, favoriteBrands, city, showPhone, showEmail
  profileViews, yearsExperience, website, motto
  socialLinks, services, languageSkills  // JSON fields
  ico, bankAccount, documents           // Onboarding
  onboardingStep, onboardingCompleted, quizScore
  brokerContractUrl, brokerSignature
  // Relace
  vehicles[], commissions[], notifications[], contracts[]
}
```

---

## Implementační kroky

### KROK 1: API route — GET single broker
**Vytvořit:** `app/api/admin/brokers/[id]/route.ts`

```
GET /api/admin/brokers/[id]
```

**Logika:**
1. Auth check: `session.user.role` in `["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"]`
2. Manager filtr: pokud role === "MANAGER", přidej `{ managerId: session.user.id }`
3. Prisma query:
```typescript
prisma.user.findFirst({
  where: { id, role: "BROKER", ...managerFilter },
  select: {
    id, firstName, lastName, email, phone, avatar, status,
    bio, specializations, cities, ico, bankAccount, slug,
    level, totalSales, totalRevenue,
    coverPhoto, city, showPhone, showEmail, profileViews,
    yearsExperience, website, motto,
    regionId, region: { select: { id, name } },
    manager: { select: { id, firstName, lastName } },
    createdAt, updatedAt,
    _count: { select: { vehicles: true, commissions: true } },
  },
})
```
4. Vrátit broker data + parsované JSON pole (specializations, cities)
5. 404 pokud neexistuje

**Vzor:** Kombinace `app/api/admin/brokers/route.ts` (auth pattern) + manager broker detail (prisma query)

### KROK 2: API route — PATCH update broker
**Přidat do:** `app/api/admin/brokers/[id]/route.ts` (stejný soubor jako GET)

```
PATCH /api/admin/brokers/[id]
```

**Logika:**
1. Auth check: jen `["ADMIN", "BACKOFFICE"]` — manager nemůže editovat přes admin
2. Zod validace vstupu:
```typescript
const updateBrokerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specializations: z.array(z.string()).optional(),  // uložit jako JSON string
  cities: z.array(z.string()).optional(),            // uložit jako JSON string
  regionId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
  ico: z.string().optional(),
});
```
3. Prisma update s validovanými daty
4. Vrátit aktualizovaný broker

**Vzor:** `app/api/admin/users/page.tsx` (existující admin user PATCH pattern) + `VehicleEditForm` (client→API flow)

### KROK 3: Admin broker detail stránka
**Vytvořit:** `app/(admin)/admin/brokers/[id]/page.tsx`

**Struktura (Server Component):**
1. `export const dynamic = "force-dynamic"`
2. Auth check: `["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"]`
3. Prisma query — PŘÍMÝ (jako vehicle detail, NE přes API) — Server Component může přímo volat Prisma:
```typescript
const broker = await prisma.user.findFirst({
  where: { id, role: "BROKER" },
  select: { /* viz KROK 1 select */ },
});
```
4. Načti i vehicles a commissions (jako manager broker detail):
```typescript
const vehicles = await prisma.vehicle.findMany({
  where: { brokerId: id },
  select: { id, brand, model, year, price, status, mileage, createdAt, images: { where: { isPrimary: true }, take: 1 } },
  orderBy: { createdAt: "desc" },
  take: 20,
});
const commissions = await prisma.commission.findMany({
  where: { brokerId: id },
  select: { id, salePrice, commission, rate, status, soldAt, vehicle: { select: { brand, model } } },
  orderBy: { soldAt: "desc" },
  take: 20,
});
```

**UI layout (vzor = vehicle detail + manager broker detail):**
```
Breadcrumb: Admin / Makléři / {jméno}
Header: Jméno + Status + tlačítka [Upravit] [Zpět]

Grid 2 sloupce:
  LEFT Card "Profil":
    - Avatar (nebo initials gradient)
    - Jméno, email, telefon
    - IČO, bankovní účet
    - Region, města
    - Specializace (tagy)
    - Bio
    - Level + total sales + total revenue
    - Registrován (datum)

  RIGHT Card "Statistiky":
    - Počet vozidel
    - Počet provizí
    - Celkový obrat

Card "Vozidla makléře" (tabulka):
  - brand+model, rok, cena, status, nájezd, datum
  - Link na /admin/vehicles/[vehicleId]

Card "Provize" (tabulka):
  - vozidlo, prodejní cena, provize, sazba, status, datum prodeje
```

**Cílový počet řádků:** ~180-220 (podobný rozsah jako vehicle detail)

### KROK 4: Admin broker edit stránka
**Vytvořit:** `app/(admin)/admin/brokers/[id]/edit/page.tsx`

**Struktura (Server Component + Client Form):**
1. `export const dynamic = "force-dynamic"`
2. Auth check: `["ADMIN", "BACKOFFICE"]` (edit jen pro admin, ne manager — ten má svou sekci)
3. Prisma query — načti broker data pro formulář:
```typescript
const broker = await prisma.user.findFirst({
  where: { id, role: "BROKER" },
  select: {
    id, firstName, lastName, email, phone, bio,
    specializations, cities, regionId, status, ico,
  },
});
```
4. Předej do client komponenty `<BrokerEditForm>`

**Vytvořit:** `components/admin/BrokerEditForm.tsx` (client komponenta)

**Formulářová pole:**
| Pole | Typ | Validace |
|------|-----|----------|
| firstName | text input | povinné |
| lastName | text input | povinné |
| email | email input | povinné, email format |
| phone | tel input | volitelné |
| bio | textarea | volitelné |
| specializations | multi-tag input (text, čárkou oddělené) | volitelné |
| cities | multi-tag input | volitelné |
| regionId | select (z dostupných regionů) — nebo jen text | volitelné |
| status | select: ACTIVE / SUSPENDED / INACTIVE | volitelné |
| ico | text input | volitelné |

**Submit:** `PATCH /api/admin/brokers/[id]`  
**Po úspěchu:** `router.push(/admin/brokers/${id})` (detail stránka)

**Vzor:** `VehicleEditForm.tsx` (51 řádků form s fetch + redirect)
**Cílový počet řádků:** ~120-150

### KROK 5: NotificationBell fix (P1)
**Soubor:** `components/admin/NotificationBell.tsx`

**Aktuální stav:**
- Volá `/api/broker/notifications` (řádek 25, 56)
- API route **přijímá ADMIN roli** (je v ALLOWED_ROLES)
- Query filtruje `where: { userId }` — vrací notifikace přihlášeného uživatele
- **Funkčně OK**, problém je pouze v URL path (`/api/broker/...` z admin kontextu)

**Doporučená oprava (minimální invaze):**
1. Vytvořit `app/api/admin/notifications/route.ts` — PROXY/ALIAS route
2. Zkopírovat logiku z `app/api/broker/notifications/route.ts` (nebo lépe: extrahovat shared helper)
3. V `NotificationBell.tsx` změnit URL na `/api/admin/notifications`
4. V `NotificationsPageContent.tsx` změnit URL na `/api/admin/notifications`

**Alternativa (jednodušší):** Ponechat stávající stav. API funguje, jen URL je semanticky nesprávná. Toto je P1, ne P0.

**Doporučení implementátorovi:** Zvolit jednoduchou cestu — vytvořit `/api/admin/notifications/route.ts` který reexportuje handlery z broker verze, a v komponentách změnit URL. Nebo ještě jednodušeji: přejmenovat stávající route na `/api/notifications` (univerzální) a aktualizovat oba kontexty.

---

## Pořadí implementace

```
1. KROK 1 — API route GET /api/admin/brokers/[id]     (~60 řádků)
2. KROK 2 — API route PATCH /api/admin/brokers/[id]    (~70 řádků, stejný soubor)
3. KROK 3 — Broker detail stránka                      (~200 řádků)
4. KROK 4 — Broker edit stránka + BrokerEditForm       (~80 + ~140 řádků)
5. KROK 5 — NotificationBell fix                       (~10 řádků změn)
```

**Celkový odhad nových souborů:** 4 nové soubory + 2 upravené soubory  
**Celkový odhad řádků:** ~550 nových řádků

---

## Soubory k vytvoření

| # | Soubor | Typ | Popis |
|---|--------|-----|-------|
| 1 | `app/api/admin/brokers/[id]/route.ts` | API | GET + PATCH single broker |
| 2 | `app/(admin)/admin/brokers/[id]/page.tsx` | Page | Broker detail (Server Component) |
| 3 | `app/(admin)/admin/brokers/[id]/edit/page.tsx` | Page | Broker edit wrapper (Server Component) |
| 4 | `components/admin/BrokerEditForm.tsx` | Component | Formulář pro editaci makléře (Client) |

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 5 | `components/admin/NotificationBell.tsx` | Změnit URL z `/api/broker/notifications` na `/api/admin/notifications` |
| 6 | `components/admin/NotificationsPageContent.tsx` | Stejná URL změna |
| 7 | `app/api/admin/notifications/route.ts` (NOVÝ) | Notifications route pro admin kontext |

---

## STOP kritéria (pro kontrolora)

1. Klik na 👁 u makléře v `/admin/brokers` → otevře se detail stránka (ne 404)
2. Klik na ✏️ u makléře v `/admin/brokers` → otevře se edit stránka (ne 404)
3. Edit formulář uloží změny přes API a přesměruje na detail
4. Detail stránka zobrazuje: profil, statistiky, vozidla, provize
5. NotificationBell v admin headeru nevolá `/api/broker/*` path
6. `npm run build` projde bez chyb
7. Žádné TypeScript errory

---

## Rizika

| Riziko | Pravděpodobnost | Mitigace |
|--------|----------------|----------|
| JSON parse error u specializations/cities | Nízká | Vždy wrap v try/catch, fallback na [] |
| Region select — nemáme list regionů | Střední | Použít textový input místo selectu, nebo načíst regiony z DB |
| Edit — email uniqueness conflict | Nízká | API route musí ošetřit Prisma unique constraint error |
| Manager filter v detail stránce | Střední | Manager by měl vidět jen své makléře — ověřit v KROK 3 |

---

*Plán připraven: 2026-04-25*  
*Čeká na schválení team leadem*
