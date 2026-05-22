# Deep Dive P0-5 + P0-6: Admin dodavatelé a díly

**Datum:** 2026-04-13
**Autor:** Plánovač
**Pro:** Implementátor

---

## ⚠️ DŮLEŽITÉ ZJIŠTĚNÍ — P0-1 JE HOTOVÝ!

Admin reklamace UI (P0-1) je **plně implementovaný** — nebyl zachycen v původním auditu:
- ✅ `app/(admin)/admin/returns/page.tsx` — seznam (filtry: status, typ, search, paginace)
- ✅ `app/(admin)/admin/returns/[id]/page.tsx` — detail (editace statusu, schválená částka, zamítnutí, poznámky)
- ✅ `app/api/admin/returns/route.ts` — list API s filtrováním + paginací
- ✅ `app/api/admin/returns/[id]/route.ts` — GET/PUT detail
- ✅ Sidebar link v sekci ESHOP: `{ id: "returns", href: "/admin/returns", icon: "🔄", label: "Reklamace" }`

**P0-1 blok z plánu task020-completion.md lze přeskočit.**

---

## Existující admin infrastruktura

### Sidebar navigace
**Soubor:** `components/admin/AdminSidebar.tsx`

**Struktura:** Pole `navSections: NavSection[]` s role-gated sekcemi:

```typescript
interface NavItem {
  id: string;
  href: string;
  icon: string;
  label: string;
  badge?: string;  // červený badge (pro počty)
}
interface NavSection {
  title: string;    // "HLAVNÍ", "ESHOP", "FINANCE"...
  items: NavItem[];
  roles?: string[]; // kdo vidí sekci
}
```

**Existující sekce:**
| Sekce | Role | Položky |
|-------|------|---------|
| HLAVNÍ | ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | Dashboard, Vozidla, Inzerce, Makléři, Leady, Uživatelé |
| MANAŽER | MANAGER, REGIONAL_DIRECTOR | Můj tým, Moji makléři, Schvalování, Bonusy |
| PARTNEŘI | ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | Všichni partneři, Autobazary, Vrakoviště |
| ESHOP | ADMIN, BACKOFFICE, MANAGER | Feed importy, Objednávky, Reklamace |
| FINANCE | ADMIN, BACKOFFICE, MANAGER | Platby, Výplaty |
| MARKETPLACE | ADMIN, BACKOFFICE, MANAGER | Marketplace |

**Kam přidat nové položky:**
- Dodavatelé → sekce **ESHOP** (za "Reklamace")
- Díly → sekce **ESHOP** (za dodavatele)

### Layout pattern
**Soubor:** `components/admin/AdminLayout.tsx` → `app/(admin)/layout.tsx`

Layout = sidebar (280px fixed left) + header + content area (`p-4 sm:p-6 lg:p-8`).

### Admin stránka pattern — "use client" (Orders, Returns)

Orders a Returns používají **client component** pattern:
```
"use client" stránka → useState/useEffect → fetch(/api/admin/xxx) → render tabulku
```

**Společné prvky:**
1. **Header:** breadcrumb + h1 + počet záznamů
2. **Filters:** `<Card>` s inputy (search, select filtry)
3. **Table:** `<Card>` wrapping `<table>` s thead/tbody
4. **Paginace:** prev/next tlačítka + strana X z Y (pokud totalPages > 1)

### Admin stránka pattern — Server Component (Partners)

Partners page používá **server component** pattern:
```
async server component → prisma.xxx.count() → StatCards + server-rendered table component
```

**Pro P0-5 a P0-6 doporučuji client component pattern** (jako Orders/Returns) — jednodušší pro filtry a interakce.

### UI komponenty k dispozici
| Komponenta | Import | Použití |
|------------|--------|---------|
| `Card` | `@/components/ui/Card` | Wrapper pro tabulky, formuláře |
| `Badge` | `@/components/ui/Badge` | Status badges (variant: success/pending/rejected) |
| `Button` | `@/components/ui/Button` | Akční tlačítka (variant: primary/secondary/success/outline) |
| `StatCard` | `@/components/ui/StatCard` | Stat karty (icon, iconColor, value, label) |
| `Select` | `@/components/ui/Select` | Dropdown select |
| `Tabs` | `@/components/ui/Tabs` | Tab přepínání |
| `Pagination` | `@/components/ui/Pagination` | Stránkování |
| `EmptyState` | `@/components/ui/EmptyState` | Prázdný stav |

---

## P0-5: Admin dodavatelé/vrakoviště

### Kontext: Dodavatelé vs Partneři

V systému existují DVĚ entity:

1. **Partner** (model `Partner`) — akvizični CRM záznam. Typ: AUTOBAZAR | VRAKOVISTE. Status: NEOSLOVENY→OSLOVEN→AKTIVNI_PARTNER. Admin stránka `/admin/partners/` existuje s funnel, tabulkou, detail stránkou. **TOTO NENÍ totéž co dodavatel dílů.**

2. **User s rolí PARTS_SUPPLIER/WHOLESALE_SUPPLIER/PARTNER_VRAKOVISTE** — skutečný dodavatel dílů v eshopu. Má `Part[]` relaci (díly), `OrderItem[]` (objednávky), `PartsFeedConfig[]` (feedy).

**Vztah:** Partner (CRM) se aktivací stane User (PARTNER_VRAKOVISTE/PARTNER_BAZAR) přes `partner.userId` relaci.

### Co chybí

Existující `/admin/partners/` stránka zobrazuje CRM funnel (akviziční flow: neosloveno→osloveno→partner). **NEMÁ** přehled:
- kolik dílů dodavatel nabízí
- kolik objednávek zpracoval
- jaký obrat/provize
- status feedu (aktivní/neaktivní)

### Implementační plán

#### Soubory k vytvoření:
| # | Soubor | Typ |
|---|--------|-----|
| 1 | `app/(admin)/admin/suppliers/page.tsx` | Client component — hlavní stránka |
| 2 | `app/(admin)/admin/suppliers/loading.tsx` | Loading skeleton |
| 3 | `app/(admin)/admin/suppliers/error.tsx` | Error boundary |
| 4 | `app/api/admin/suppliers/route.ts` | API endpoint |

#### Sidebar úprava:
**Soubor:** `components/admin/AdminSidebar.tsx`

Přidat do sekce ESHOP:
```typescript
{
  title: "ESHOP",
  items: [
    { id: "feeds", href: "/admin/feeds", icon: "📡", label: "Feed importy" },
    { id: "orders", href: "/admin/orders", icon: "📦", label: "Objednávky" },
    { id: "returns", href: "/admin/returns", icon: "🔄", label: "Reklamace" },
    // ★ NOVÉ:
    { id: "suppliers", href: "/admin/suppliers", icon: "🏭", label: "Dodavatelé" },
    { id: "parts", href: "/admin/parts", icon: "🔩", label: "Díly" },
  ],
  roles: ["ADMIN", "BACKOFFICE", "MANAGER"],
},
```

#### API endpoint `GET /api/admin/suppliers`:

```typescript
// Query: Users s rolí PARTS_SUPPLIER, WHOLESALE_SUPPLIER, nebo PARTNER_VRAKOVISTE
const SUPPLIER_ROLES = ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE"];

const where: Record<string, unknown> = {
  role: { in: SUPPLIER_ROLES },
};

// Filtry:
// ?role=PARTS_SUPPLIER — filtr podle konkrétní role
// ?status=ACTIVE — filtr podle statusu (ACTIVE/INACTIVE/PENDING)
// ?search=xxx — fulltext na firstName, lastName, companyName, email

const suppliers = await prisma.user.findMany({
  where,
  select: {
    id: true,
    firstName: true,
    lastName: true,
    companyName: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    createdAt: true,
    // Agregace:
    _count: {
      select: {
        parts: true,       // počet dílů
        // Pozor: OrderItem nemá přímou relaci supplier→User
        // Ale Part.supplierId = user.id, takže:
      },
    },
  },
  orderBy: { createdAt: "desc" },
  skip: (page - 1) * limit,
  take: limit,
});

// Pro obrat/provize — raw query nebo separátní agregace:
// SELECT u.id, COUNT(DISTINCT oi.id) as orderCount, COALESCE(SUM(oi."supplierPayout"), 0) as totalPayout
// FROM "User" u
// LEFT JOIN "OrderItem" oi ON oi."supplierId" = u.id
// WHERE u.role IN ('PARTS_SUPPLIER', 'WHOLESALE_SUPPLIER', 'PARTNER_VRAKOVISTE')
// GROUP BY u.id
```

#### Stránka — sloupce tabulky:
| Sloupec | Zdroj | Formát |
|---------|-------|--------|
| Jméno/Firma | firstName + lastName NEBO companyName | text + email pod |
| Role | role | Badge (PARTS_SUPPLIER=zelená, WHOLESALE=modrá, VRAKOVISTE=oranžová) |
| Status | status | Badge (ACTIVE/PENDING/SUSPENDED) |
| Počet dílů | _count.parts | číslo |
| Aktivních dílů | (extra query) | číslo |
| Obrat | SUM(OrderItem.supplierPayout) | CZK formát |
| Registrace | createdAt | datum |
| Akce | — | Link na detail |

#### Role labels:
```typescript
const ROLE_LABELS: Record<string, string> = {
  PARTS_SUPPLIER: "Dodavatel dílů",
  WHOLESALE_SUPPLIER: "Velkoobchod",
  PARTNER_VRAKOVISTE: "Vrakoviště",
};
```

#### Stat cards (nahoře):
```
[Celkem dodavatelů] [Aktivních] [Celkem dílů] [Aktivních dílů]
```

---

## P0-6: Admin správa dílů

### Kontext: Part model

**Pole dostupná pro admin správu:**

| Pole | Typ | Filtr? | Editovatelné? |
|------|-----|--------|---------------|
| name | String | search fulltext | ❌ (supplier) |
| category | String enum | ✅ select | ❌ (supplier) |
| partType | USED/NEW/AFTERMARKET | ✅ select | ❌ (supplier) |
| condition | NEW/USED_GOOD/USED_FAIR/USED_POOR/REFURBISHED | ✅ select | ❌ (supplier) |
| status | DRAFT/ACTIVE/SOLD/INACTIVE | ✅ select | ✅ admin bulk |
| price | Int (Kč) | ✅ range | ❌ (supplier) |
| stock | Int | zobrazení | ❌ (supplier) |
| supplierId | String (User.id) | ✅ select | ❌ |
| manufacturer | String? | zobrazení | ❌ |
| oemNumber | String? | search | ❌ |
| partNumber | String? | search | ❌ |
| createdAt | DateTime | ✅ sort | ❌ |
| viewCount | Int | zobrazení | ❌ |

**Admin může měnit pouze `status`** — zbytek je zodpovědnost dodavatele.

### Implementační plán

#### Soubory k vytvoření:
| # | Soubor | Typ |
|---|--------|-----|
| 1 | `app/(admin)/admin/parts/page.tsx` | Client component — hlavní stránka |
| 2 | `app/(admin)/admin/parts/loading.tsx` | Loading skeleton |
| 3 | `app/(admin)/admin/parts/error.tsx` | Error boundary |
| 4 | `app/api/admin/parts/route.ts` | GET seznam + PATCH bulk status update |

#### API endpoint:

**GET `/api/admin/parts`:**

```typescript
// Query params: category, partType, status, supplierId, search, page, limit, sort
const where: Record<string, unknown> = {};

if (category) where.category = category;
if (partType) where.partType = partType;
if (status) where.status = status;
if (supplierId) where.supplierId = supplierId;
if (search) {
  where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { partNumber: { contains: search, mode: "insensitive" } },
    { oemNumber: { contains: search, mode: "insensitive" } },
    { manufacturer: { contains: search, mode: "insensitive" } },
  ];
}

const parts = await prisma.part.findMany({
  where,
  select: {
    id: true,
    name: true,
    slug: true,
    category: true,
    partType: true,
    condition: true,
    status: true,
    price: true,
    stock: true,
    manufacturer: true,
    oemNumber: true,
    partNumber: true,
    viewCount: true,
    createdAt: true,
    supplier: {
      select: { id: true, firstName: true, lastName: true, companyName: true },
    },
    images: {
      select: { url: true },
      take: 1,
      orderBy: { order: "asc" },
    },
  },
  orderBy: { createdAt: "desc" },
  skip: (page - 1) * limit,
  take: limit,
});
```

**PATCH `/api/admin/parts`** — bulk status update:

```typescript
// Body: { ids: string[], status: "ACTIVE" | "INACTIVE" | "DRAFT" }
// Validace: max 100 dílů naráz
// Role: jen ADMIN, BACKOFFICE

const { ids, status } = body;
if (!ids?.length || ids.length > 100) {
  return error(400, "Vyberte 1-100 dílů");
}
const validStatuses = ["ACTIVE", "INACTIVE", "DRAFT"];
if (!validStatuses.includes(status)) {
  return error(400, "Neplatný status");
}

const result = await prisma.part.updateMany({
  where: { id: { in: ids } },
  data: { status },
});

return { updated: result.count };
```

#### Stránka — sloupce tabulky:
| Sloupec | Formát |
|---------|--------|
| ☐ (checkbox) | pro bulk select |
| Foto | thumbnail 40x40 (images[0].url) |
| Název | name (link na detail?) |
| Kategorie | category label (z lib/parts-categories.ts) |
| Typ | Badge: USED/NEW/AFTERMARKET |
| Stav | Badge: DRAFT/ACTIVE/SOLD/INACTIVE |
| Cena | CZK formát |
| Sklad | stock počet (červeně pokud 0) |
| Dodavatel | supplier.companyName nebo firstName+lastName |
| Vytvořeno | datum |

#### Filtry:
1. **Search** — text input (fulltext na name, partNumber, oemNumber)
2. **Kategorie** — select z `lib/parts-categories.ts` (ENGINE, TRANSMISSION, BRAKES...)
3. **Typ** — select (USED/NEW/AFTERMARKET)
4. **Status** — select (DRAFT/ACTIVE/SOLD/INACTIVE)
5. **Dodavatel** — select (fetch z `/api/admin/feeds/suppliers` — již existuje!)

#### Bulk akce:
- Checkbox na každém řádku + "select all" v headeru
- Floating action bar (zobrazí se při selekci): "X vybraných — [Aktivovat] [Deaktivovat]"
- Confirm dialog před bulk operací: "Opravdu chcete změnit status X dílů na ACTIVE?"

#### Kategorie labels (importovat z existujícího):
**Soubor:** `lib/parts-categories.ts`
```typescript
// Již existuje — obsahuje:
// CATEGORY_LABELS: Record<string, string>
// CONDITION_LABELS: Record<string, string>
// Importovat pro zobrazení v tabulce
```

---

## Pořadí implementace

### P0-5 (Dodavatelé):
1. Vytvořit `app/api/admin/suppliers/route.ts` (GET)
2. Vytvořit `app/(admin)/admin/suppliers/page.tsx` (client component)
3. Přidat loading.tsx + error.tsx
4. Upravit sidebar — přidat "Dodavatelé" do ESHOP sekce

### P0-6 (Díly):
1. Vytvořit `app/api/admin/parts/route.ts` (GET + PATCH bulk)
2. Vytvořit `app/(admin)/admin/parts/page.tsx` (client component)
3. Přidat loading.tsx + error.tsx
4. Upravit sidebar — přidat "Díly" do ESHOP sekce (v kroku P0-5 sidebar edit)

### Sidebar edit (sdílený krok):
Udělat JEDNOU — přidat OBA odkazy (suppliers + parts) do ESHOP sekce naráz.

---

## STOP & ESCALATE

| Situace | Akce |
|---------|------|
| Part model nemá potřebné indexy pro admin filtry | Zkontrolovat — indexy na supplierId, category, status, price, partType JIŽ EXISTUJÍ (schema:952) |
| Bulk update mění >100 dílů | Odmítnout — limit 100 per request (bezpečnostní guard) |
| Dodavatel bez companyName | Zobrazit firstName + lastName jako fallback |
| Neexistuje `app/api/admin/feeds/suppliers` pro supplier dropdown | JIŽ EXISTUJE — endpoint vrací seznam aktivních userů |

---

## Referenční soubory (kopírovat pattern)

| Účel | Soubor |
|------|--------|
| Client component tabulka pattern | `app/(admin)/admin/orders/page.tsx` (220 řádků) |
| Filtry + paginace | `app/(admin)/admin/returns/page.tsx` (263 řádků) |
| API GET + PATCH pattern | `app/api/admin/orders/route.ts` |
| StatCards pattern | `app/(admin)/admin/partners/page.tsx` |
| Sidebar úprava | `components/admin/AdminSidebar.tsx` (řádek 56-63, sekce ESHOP) |
| Kategorie labels | `lib/parts-categories.ts` |
| Supplier dropdown data | `app/api/admin/feeds/suppliers/route.ts` (existující endpoint) |
