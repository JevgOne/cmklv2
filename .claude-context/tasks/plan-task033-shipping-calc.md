# Plan — Task #33: Shipping calculate + Zásilkovna points proxy

**Datum:** 2026-04-14
**Gap:** G-22 + G-23 (P0/P2)
**Effort:** S-M (4-8h)

---

## 1. KONTEXT

Aktuální stav:
- `lib/shipping/prices.ts` — flat ceny (Zásilkovna 79, PPL 99, DPD 109, GLS 109, ČP 129, PICKUP 0)
- `lib/shipping/weight.ts` — `calculateShipmentWeight()` existuje (fallback 1kg per díl)
- Part model má `weight Float?` a `dimensions String?` — existují ale nejsou validovány
- Žádná logika pro omezení dopravců pro velké/těžké díly
- Žádný proxy pro Zásilkovna points API

---

## 2. POST /api/shipping/calculate (NOVÝ)

**Soubor:** `app/api/shipping/calculate/route.ts`

### Request:
```typescript
{
  items: Array<{ partId: string; quantity: number }>;
  deliveryAddress?: {
    city: string;
    zip: string;
  };
}
```

### Response:
```typescript
{
  methods: Array<{
    method: DeliveryMethod;
    label: string;
    description: string;
    eta: string;
    price: number;       // Kč
    available: boolean;  // false pokud díl příliš velký/těžký
    unavailableReason?: string; // "Zásilka přesahuje 30 kg — Zásilkovna nedostupná"
  }>;
  totalWeight: number;   // kg
  maxDimension: number;  // cm (největší rozměr)
}
```

### Logika:

```typescript
import { calculateShipmentWeight } from "@/lib/shipping/weight";
import { SHIPPING_METHOD_INFO, getShippingMethods } from "@/lib/shipping/prices";

// Limity dopravců
const CARRIER_LIMITS: Record<string, { maxWeightKg: number; maxDimensionCm: number }> = {
  ZASILKOVNA: { maxWeightKg: 10, maxDimensionCm: 70 },   // Zásilkovna Z-BOX max 10kg, 70cm
  DPD:        { maxWeightKg: 31.5, maxDimensionCm: 175 }, // DPD standard
  PPL:        { maxWeightKg: 31.5, maxDimensionCm: 200 }, // PPL
  GLS:        { maxWeightKg: 40, maxDimensionCm: 200 },   // GLS
  CESKA_POSTA:{ maxWeightKg: 30, maxDimensionCm: 240 },   // ČP Balík do ruky
  PICKUP:     { maxWeightKg: Infinity, maxDimensionCm: Infinity },
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { items } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "Prázdný košík" }, { status: 400 });
  }

  // Načíst díly
  const partIds = items.map((i: { partId: string }) => i.partId);
  const parts = await prisma.part.findMany({
    where: { id: { in: partIds } },
    select: { id: true, weight: true, dimensions: true },
  });

  // Spočítat celkovou váhu
  const totalWeight = await calculateShipmentWeight(items);

  // Spočítat maximální rozměr
  let maxDimension = 0;
  for (const part of parts) {
    if (part.dimensions) {
      try {
        // dimensions = "60x40x30" nebo JSON { l: 60, w: 40, h: 30 }
        const dims = parseDimensions(part.dimensions);
        maxDimension = Math.max(maxDimension, ...dims);
      } catch {
        // ignore malformed dimensions
      }
    }
  }

  // Vyhodnotit dostupnost per metoda
  const methods = getShippingMethods().map((info) => {
    const limits = CARRIER_LIMITS[info.method];
    let available = true;
    let unavailableReason: string | undefined;

    if (limits) {
      if (totalWeight > limits.maxWeightKg) {
        available = false;
        unavailableReason = `Zásilka přesahuje ${limits.maxWeightKg} kg — ${info.label} nedostupná`;
      } else if (maxDimension > limits.maxDimensionCm) {
        available = false;
        unavailableReason = `Rozměr přesahuje ${limits.maxDimensionCm} cm — ${info.label} nedostupná`;
      }
    }

    return {
      method: info.method,
      label: info.label,
      description: info.description,
      eta: info.eta,
      price: info.price,
      available,
      unavailableReason,
    };
  });

  return NextResponse.json({
    methods,
    totalWeight,
    maxDimension,
  });
}
```

### Helper — parseDimensions:

```typescript
function parseDimensions(dim: string): number[] {
  // Formát "60x40x30" nebo "60×40×30"
  if (typeof dim === "string" && /[\dx×]/i.test(dim)) {
    return dim.split(/[x×]/i).map(Number).filter(n => !isNaN(n));
  }
  // JSON formát { l: 60, w: 40, h: 30 }
  try {
    const parsed = JSON.parse(dim);
    return [parsed.l ?? 0, parsed.w ?? 0, parsed.h ?? 0].filter(n => n > 0);
  } catch {
    return [];
  }
}
```

---

## 3. GET /api/shipping/zasilkovna-points (NOVÝ)

**Soubor:** `app/api/shipping/zasilkovna-points/route.ts`

Proxy na Zásilkovna widget API — frontend ZasilkovnaWidget.tsx už funguje přes `Packeta.Widget.pick()` (client-side JS), takže server-side proxy je jen pro SEO/fallback a search.

### Request:
```
GET /api/shipping/zasilkovna-points?q=Brno&limit=10
```

### Response:
```typescript
{
  points: Array<{
    id: number;
    name: string;
    address: string;
    city: string;
    zip: string;
    latitude: number;
    longitude: number;
    openingHours: string;
    photo?: string;
  }>;
}
```

### Implementace:

```typescript
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("q")?.trim();
  const limit = Math.min(20, parseInt(params.get("limit") || "10", 10));

  if (!query || query.length < 2) {
    return NextResponse.json({ points: [] });
  }

  const apiKey = process.env.ZASILKOVNA_API_PASSWORD;
  if (!apiKey) {
    // Dry-run: vrátit mock data
    return NextResponse.json({
      points: [{
        id: 12345, name: "Zásilkovna - Brno, Joštova 4",
        address: "Joštova 4", city: "Brno", zip: "60200",
        latitude: 49.1951, longitude: 16.6068,
        openingHours: "Po-Pá 8-18, So 9-12",
      }],
    });
  }

  // Zásilkovna Branch API v5 (XML)
  const xmlBody = `<createPacketClaimWithPassword>
    <apiPassword>${apiKey}</apiPassword>
  </createPacketClaimWithPassword>`;

  // Pozn: Zásilkovna nemá REST API pro hledání poboček.
  // Widget (Packeta.Widget.pick) funguje client-side přes jejich CDN.
  // Pro server-side search: stáhnout feed poboček a hledat lokálně,
  // nebo proxy na widget feed URL.

  // Zásilkovna Feed URL: https://www.zasilkovna.cz/api/v4/{apiKey}/branch.json
  try {
    const res = await fetch(
      `https://www.zasilkovna.cz/api/v4/${process.env.NEXT_PUBLIC_ZASILKOVNA_API_KEY}/branch.json`,
      { next: { revalidate: 86400 } } // cache 24h
    );

    if (!res.ok) {
      return NextResponse.json({ points: [], error: "Nepodařilo se načíst pobočky" });
    }

    const data = await res.json();
    const normalizedQuery = query.toLowerCase();

    // Filter + search
    const filtered = (data.data || [])
      .filter((b: Record<string, string>) =>
        b.name?.toLowerCase().includes(normalizedQuery) ||
        b.city?.toLowerCase().includes(normalizedQuery) ||
        b.zip?.includes(normalizedQuery)
      )
      .slice(0, limit)
      .map((b: Record<string, unknown>) => ({
        id: b.id,
        name: b.name,
        address: b.street,
        city: b.city,
        zip: b.zip,
        latitude: b.latitude,
        longitude: b.longitude,
        openingHours: b.openingHours?.compactShort ?? "",
        photo: b.photo?.normal ?? undefined,
      }));

    return NextResponse.json({ points: filtered });
  } catch (error) {
    console.error("Zásilkovna points error:", error);
    return NextResponse.json({ points: [] });
  }
}
```

**Poznámka:** Zásilkovna widget v6 (Packeta.Widget.pick) funguje přímo v browseru a je primární způsob výběru. Server-side proxy je doplněk pro:
- SEO (statické stránky s výdejními místy)
- Fallback když widget nenačte JS
- Backend validace vybraného bodu

---

## 4. CHECKOUT UI INTEGRACE

### 4a. Fetch dostupných metod v checkout flow

V `app/(web)/dily/objednavka/page.tsx`, na Step 1 (Doručení):

```typescript
// Na mount: fetch dostupné dopravní metody
useEffect(() => {
  const fetchMethods = async () => {
    const res = await fetch('/api/shipping/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({ partId: i.id, quantity: i.quantity })),
      }),
    });
    const data = await res.json();
    setAvailableMethods(data.methods);
    setTotalWeight(data.totalWeight);
  };
  if (items.length > 0) fetchMethods();
}, [items]);
```

### 4b. OrderForm — disabled metody

V `components/web/OrderForm.tsx`:
```typescript
// Metody kde available=false → disabled + reason tooltip
<label className={cn(
  "...",
  !method.available && "opacity-50 cursor-not-allowed"
)}>
  <input type="radio" disabled={!method.available} ... />
  <div>
    <span>{method.label} — {formatPrice(method.price)}</span>
    {!method.available && (
      <span className="text-xs text-red-500">{method.unavailableReason}</span>
    )}
  </div>
</label>
```

---

## 5. POŘADÍ IMPLEMENTACE

1. `POST /api/shipping/calculate` — core endpoint s weight/dimension limity
2. `GET /api/shipping/zasilkovna-points` — proxy s caching
3. Checkout UI — fetch available methods, disable unavailable
4. (Volitelné) Part admin — zobrazit weight/dimensions, upozornit pokud chybí

---

## 6. STOP & ESCALATE

- **STOP-1:** Zásilkovna branch.json API změní formát → fallback na prázdný response
- **STOP-2:** Part.dimensions formát inconsistentní v DB → parseDimensions musí zvládnout oba formáty

---

## 7. COMMIT

```
feat: add shipping calculate API with weight limits + Zásilkovna points proxy

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
