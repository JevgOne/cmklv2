# Plan: FIX — /parts/my API vrací jen ACTIVE díly

**Task:** #33
**Issue:** Supplier nevidí neaktivní/prodané díly v "Moje díly"
**Autor:** Plánovač
**Datum:** 2026-04-24

---

## ANALÝZA

### Stávající stav:

**Client stránka** `app/(pwa-parts)/parts/my/page.tsx:29`:
```ts
// Získáme všechny díly a filtrujeme na klientu
// API vrací jen ACTIVE díly, ale supplier potřebuje vidět i ostatní
const res = await fetch("/api/parts?limit=100");
```
Komentář v kódu přímo popisuje bug — vývojář o problému věděl.

**Veřejné API** `app/api/parts/route.ts:93`:
```ts
const where: Record<string, unknown> = { status: "ACTIVE" };
```
Hardcoded filtr — korektní pro veřejný katalog (zákazníci vidí jen aktivní díly), ale špatné pro supplier "Moje díly" dashboard.

**PartFilters component** `components/pwa-parts/parts/PartFilters.tsx`:
- Taby: "Vše", "Aktivní", "Neaktivní", "Prodané"
- Filtruje na klientu ale INACTIVE/SOLD díly nikdy nepřijdou z API → taby "Neaktivní" a "Prodané" jsou vždy prázdné

**Důsledky:**
1. Supplier nevidí díly které deaktivoval (INACTIVE) — nemůže je znovu aktivovat
2. Supplier nevidí prodané díly (SOLD) — nemá přehled o prodejích
3. "Moje díly" stránka ukazuje max 100 dílů (limit=100) bez paginace

**Neexistuje** dedikovaný `/api/parts/my` endpoint.

### Bezpečnostní úvaha:
Veřejné API `/api/parts` nesmí vracet neaktivní díly — zákazníci je nemají vidět. Řešení je **dedikovaný endpoint** pro suppliéra, ne parametr na veřejném API.

---

## IMPLEMENTAČNÍ PLÁN (2 kroky)

### Krok 1: Vytvořit `/api/parts/my` endpoint

**Nový soubor:** `app/api/parts/my/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SUPPLIER_ROLES = [
  "PARTS_SUPPLIER",
  "WHOLESALE_SUPPLIER",
  "PARTNER_VRAKOVISTE",
  "ADMIN",
  "BACKOFFICE",
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }
    if (!SUPPLIER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávněn��" }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const status = params.get("status"); // optional: "ACTIVE", "INACTIVE", "SOLD"
    const page = Math.max(1, parseInt(params.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "50")));

    const where: Record<string, unknown> = {
      supplierId: session.user.id,
    };

    // Admin/Backoffice může vidět díly všech supplierů pokud zadá supplierId
    if (["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
      const targetSupplier = params.get("supplierId");
      if (targetSupplier) where.supplierId = targetSupplier;
      else delete where.supplierId; // Admin bez filtru vidí vše
    }

    if (status && ["ACTIVE", "INACTIVE", "SOLD"].includes(status)) {
      where.status = status;
    }
    // Bez status filtru → vrátí všechny statusy

    const skip = (page - 1) * limit;

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          price: true,
          stock: true,
          status: true,
          viewCount: true,
          createdAt: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.part.count({ where }),
    ]);

    // Počty per status pro UI taby
    const [activeCount, inactiveCount, soldCount] = await Promise.all([
      prisma.part.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.part.count({ where: { ...where, status: "INACTIVE" } }),
      prisma.part.count({ where: { ...where, status: "SOLD" } }),
    ]);

    return NextResponse.json({
      parts: parts.map((p) => ({
        ...p,
        image: p.images[0]?.url ?? null,
        images: undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      counts: {
        all: total,
        ACTIVE: activeCount,
        INACTIVE: inactiveCount,
        SOLD: soldCount,
      },
    });
  } catch (error) {
    console.error("GET /api/parts/my error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
```

**Klíčové rozdíly od `/api/parts`:**
- Filtruje `supplierId: session.user.id` (jen vlastní díly)
- **NEMÁ** hardcoded `status: "ACTIVE"` — vrací všechny statusy
- Vrací `counts` per status pro tab badges
- Auth required (supplier roles)
- Žádné cache headers (privátní data)

---

### Krok 2: Aktualizovat "Moje díly" stránku

**Soubor:** `app/(pwa-parts)/parts/my/page.tsx`

**2a) Změnit fetch URL (ř. 29):**
```ts
const res = await fetch(`/api/parts/my`);
```

**2b) Přidat counts state + tab badges:**
```ts
const [counts, setCounts] = useState<Record<string, number>>({});

// V fetch parsingu:
const data = await res.json();
setParts(data.parts ?? []);
setCounts(data.counts ?? {});
```

**2c) Přidat server-side status filtr:**
Při změně tabu, přidat status jako query param:
```ts
const statusParam = activeTab !== "all" ? `?status=${activeTab}` : "";
const res = await fetch(`/api/parts/my${statusParam}`);
```

Nebo ponechat client-side filtrování (jednodušší, funguje pro <100 dílů).

**2d) Aktualizovat PartFilters — přidat počty do tabů:**
```tsx
<PartFilters
  activeTab={activeTab}
  onTabChange={setActiveTab}
  counts={counts}
/>
```

Upravit `PartFilters.tsx` aby přijímal `counts` prop a zobrazil:
```ts
const tabs = [
  { value: "all", label: `Vše (${counts.all ?? 0})` },
  { value: "ACTIVE", label: `Aktivní (${counts.ACTIVE ?? 0})` },
  { value: "INACTIVE", label: `Neaktivní (${counts.INACTIVE ?? 0})` },
  { value: "SOLD", label: `Prodané (${counts.SOLD ?? 0})` },
];
```

**2e) Smazat komentář na ř. 27-28:**
```ts
// Získáme všechny díly a filtrujeme na klientu
// API vrací jen ACTIVE díly, ale supplier potřebuje vidět i ostatní
```

---

## SOUBORY K EDITACI

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `app/api/parts/my/route.ts` | **CREATE** | Dedikovaný endpoint pro supplier's own parts (~80 řádků) |
| 2 | `app/(pwa-parts)/parts/my/page.tsx` | EDIT | Přepnout na `/api/parts/my`, přidat counts |
| 3 | `components/pwa-parts/parts/PartFilters.tsx` | EDIT | Přidat counts prop pro tab badges |

---

## ACCEPTANCE CRITERIA

- [ ] Supplier vidí ACTIVE díly v tabu "Aktivní"
- [ ] Supplier vidí INACTIVE díly v tabu "Neaktivní"
- [ ] Supplier vidí SOLD díly v tabu "Prodané"
- [ ] Tab "Vše" zobrazuje díly všech statusů
- [ ] Každý tab ukazuje počet dílů v závorce
- [ ] Supplier vidí JEN VLASTNÍ díly (ne cizí)
- [ ] Veřejné API `/api/parts` stále vrací jen ACTIVE (nezměněno)
- [ ] Auth: nepřihlášený → 401, špatná role → 403
- [ ] TypeScript build OK

## STOP PRAVIDLA

- **STOP-1:** Pokud `supplierId` field neexistuje na Part modelu → zkontrolovat schema, eskalovat
- **STOP-2:** Pokud Part nemá status "INACTIVE"/"SOLD" enum → zkontrolovat reálné hodnoty v DB

## ODHAD

- **Složitost:** Nízká (1 nový soubor, 2 edits)
- **Risk:** Minimální — nový endpoint, žádné breaking changes
