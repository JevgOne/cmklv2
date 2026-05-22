# Fáze 3 Batch A — Search + Grafy + Otevírací doba + PDF

**Datum:** 2026-04-11
**Autor:** Plánovač
**Scope:** D11, D13, D15, D16 — features bez external service konfigurace

---

## §1 Research Findings

### 1.1 Search Infrastructure

**tsvector je na 3 modelech:**
- `Vehicle.searchVector` (line 182) — tsvector z brand+model+vin
- `Listing.searchVector` (line 603) — tsvector z brand+model+variant
- `Part.searchVector` (line 901) — tsvector z name+description+oemNumber+partNumber

**Existující search:**
| Soubor | Popis | Auth |
|--------|-------|------|
| `lib/search.ts` | `smartSearch()` — ts_rank + pg_trgm pro Part + Listing | N/A (lib) |
| `api/search/smart/route.ts` | Public fulltext search endpoint | NE (public) |
| `api/search/route.ts` | Broker PWA search (vehicles, contacts, contracts) | ANO (session) |
| `components/pwa/GlobalSearch.tsx` | Modal overlay, debounced, 3 kategorie | Broker only |
| `components/web/SmartSearchBar.tsx` | Autocomplete s suggestions | Web public |

**GAP:** Ani Partner PWA ani PWA-Parts nemají search komponentu. API endpointy `api/partner/parts` a `api/partner/vehicles` nepodporují search query parametr.

### 1.2 Charts

- **recharts v3.8.1** je v package.json — HOTOVÝ
- `components/web/PriceHistory.tsx` — proven pattern: `LineChart`, `ResponsiveContainer`, `Tooltip`, `XAxis`, `YAxis`
- Broker stats (`makler/stats/page.tsx`) — CSS-only bar chart (div heights), žádné recharts
- Partner stats (`partner/stats/page.tsx`) — `StatCard` grid + CSS funnel, žádné recharts, žádný time-series API
- PWA-Parts `SupplierStats.tsx` — simple `StatCard` grid, žádné grafy
- `api/partner/stats` — vrací jen základní counts (totalParts, activeParts, totalOrders), žádná time-series data

### 1.3 Opening Hours

- **`Partner.openingHours` already exists** jako `String?` (JSON) na line 1678 — **NO MIGRATION NEEDED**
- Partner profil page (`partner/profile/page.tsx`) — **placeholder** na line 123-130: "Editor oteviraci doby bude brzy k dispozici."
- `api/partner/profile` GET **vrací** openingHours (line 33), PUT **NE-ukládá** (chybí v update data)
- `api/partners/public/[slug]` **vrací** openingHours (line 33)
- `bazar/[slug]/page.tsx` **renderuje** openingHours jako `Record<string, string>` (line 128-137)
- `lib/validators/partner.ts` — `updatePartnerSchema` **akceptuje** `openingHours: z.string().optional().nullable()`
- **Formát JSON:** `{"Pondělí": "8:00 - 17:00", "Úterý": "8:00 - 17:00", ..., "Neděle": "Zavřeno"}`

### 1.4 PDF

- **jspdf v4.2.1** je v package.json — HOTOVÝ
- `api/contracts/[id]/pdf/route.ts` — proven server-side pattern: `new jsPDF()` → build layout → `doc.output("arraybuffer")` → Cloudinary upload
- Helper pattern: `addText(text, fontSize, bold, lineHeight)` s word-wrap + page break
- Partner potřebuje: delivery notes (dodací listy) + order confirmations
- Order + OrderItem modely existují v schema

### 1.5 Layout & Navigation

- **PWA-Parts:** `SupplierTopBar.tsx` — logo + online indicator + notifications. **Žádný search button.**
- **Partner PWA:** `PartnerLayout.tsx` — sidebar nav + top bar. **Žádný search button.**
- `PartnerBottomNav` — bottom navigation pro mobile.

---

## §2 D11 — Fulltext Search (obě PWA)

### 2.1 Architektura

Vytvořit **sdílený search komponent** `components/ui/SearchOverlay.tsx` který bude reusovatelný jak pro Partner PWA tak pro PWA-Parts. Každá instance bude volat jiný API endpoint.

### 2.2 Soubory k vytvoření

| Soubor | Typ | Popis |
|--------|-----|-------|
| `components/ui/SearchOverlay.tsx` | NEW | Reusable search modal (based on GlobalSearch pattern) |
| `app/api/partner/search/route.ts` | NEW | Partner search endpoint (vehicles OR parts based on role) |

### 2.3 Soubory k editaci

| Soubor | Změna |
|--------|-------|
| `app/api/partner/parts/route.ts` | Přidat `?q=` search param (ILIKE fallback pro jednoduchost) |
| `app/api/partner/vehicles/route.ts` | Přidat `?q=` search param (brand/model/vin ILIKE) |
| `components/partner/PartnerLayout.tsx` | Přidat search button + SearchOverlay do top baru |
| `components/pwa-parts/SupplierTopBar.tsx` | Přidat search button + SearchOverlay |
| `app/(partner)/partner/parts/page.tsx` | Přidat lokální search input nad listingem dílů |
| `app/(partner)/partner/vehicles/page.tsx` | Přidat lokální search input nad listingem vozidel |

### 2.4 Detail implementace

#### `components/ui/SearchOverlay.tsx`

```tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image?: string | null;
}

interface SearchCategory {
  label: string;
  results: SearchResult[];
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<SearchCategory[]>;
  placeholder?: string;
}

export function SearchOverlay({ isOpen, onClose, onSearch, placeholder }: SearchOverlayProps) {
  // Pattern z GlobalSearch: debounced input, results grouped by category
  // Full-screen overlay na mobile, focus na input při otevření
  // ESC / backdrop click zavře
}
```

#### `app/api/partner/search/route.ts`

```tsx
// Unified search endpoint pro partnery
// PARTNER_BAZAR: hledá vehicles (brand, model, vin) + partnerLeads (name)
// PARTNER_VRAKOVISTE: hledá parts (name, oemNumber, category) + orders (id)
// Parametry: ?q=query&limit=10
// Auth: session required, role check

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // Role check: PARTNER_BAZAR | PARTNER_VRAKOVISTE
  
  const q = searchParams.get("q");
  
  if (session.user.role === "PARTNER_BAZAR") {
    // Search vehicles (brand ILIKE, model ILIKE, vin contains)
    // Search partner leads (name ILIKE)
    const [vehicles, leads] = await Promise.all([...]);
    return { vehicles: [...], leads: [...] };
  } else {
    // Search parts (name ILIKE, oemNumber contains)  
    // Search orders (orderItems where supplierId)
    const [parts, orders] = await Promise.all([...]);
    return { parts: [...], orders: [...] };
  }
}
```

#### Existing API extension — parts & vehicles

V `api/partner/parts/route.ts` přidat:
```tsx
const search = searchParams.get("q");
if (search) {
  where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { oemNumber: { contains: search, mode: "insensitive" } },
    { category: { contains: search, mode: "insensitive" } },
  ];
}
```

V `api/partner/vehicles/route.ts` přidat:
```tsx
const search = searchParams.get("q");
if (search) {
  where.OR = [
    { brand: { contains: search, mode: "insensitive" } },
    { model: { contains: search, mode: "insensitive" } },
    { vin: { contains: search } },
  ];
}
```

#### Lokální search na list pages

Pro `partner/parts/page.tsx` a `partner/vehicles/page.tsx` přidat:
```tsx
const [search, setSearch] = useState("");
// Debounce 300ms, přidat ?q= do fetch URL
// Input nad kartami: simple text input s search ikonou
```

#### Layout integration

V `PartnerLayout.tsx` — přidat search button do mobile top baru:
```tsx
<button onClick={() => setSearchOpen(true)} aria-label="Hledat">
  <SearchIcon />
</button>
<SearchOverlay
  isOpen={searchOpen}
  onClose={() => setSearchOpen(false)}
  onSearch={handlePartnerSearch}
  placeholder={isVrakoviste ? "Hledat díly, objednávky..." : "Hledat vozidla, zájemce..."}
/>
```

V `SupplierTopBar.tsx` — přidat search button vedle notifikací:
```tsx
<button onClick={() => setSearchOpen(true)} aria-label="Hledat">
  <SearchIcon />
</button>
<SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} ... />
```

### 2.5 STOP kritéria (eskaluj pokud)

- STOP-1: tsvector migration drift blokuje build → resetni dev DB, NEřeš v produkci
- STOP-2: Prisma `mode: "insensitive"` nefunguje na PostgreSQL → fallback na `$queryRawUnsafe` s ILIKE
- STOP-3: SearchOverlay nefunguje na obou PWA současně → oddělej na dva komponenty

---

## §3 D13 — Dashboard Grafy (obě PWA)

### 3.1 Architektura

Použít **recharts** (v3.8.1, already installed). Vytvořit reusable chart wrappers + rozšířit API o time-series data.

### 3.2 Soubory k vytvoření

| Soubor | Typ | Popis |
|--------|-----|-------|
| `components/ui/charts/RevenueChart.tsx` | NEW | Line/Area chart pro tržby/provize po měsících |
| `components/ui/charts/OrdersChart.tsx` | NEW | Bar chart pro objednávky/prodeje po měsících |
| `app/api/partner/stats/charts/route.ts` | NEW | Time-series API endpoint |

### 3.3 Soubory k editaci

| Soubor | Změna |
|--------|-------|
| `app/(partner)/partner/stats/page.tsx` | Přidat RevenueChart + OrdersChart |
| `app/(pwa-parts)/parts/page.tsx` | Přidat mini stats graf na dashboard |
| `components/pwa-parts/dashboard/SupplierStats.tsx` | Rozšířit o mini graf |

### 3.4 Detail implementace

#### `app/api/partner/stats/charts/route.ts`

```tsx
// GET /api/partner/stats/charts?months=6
// Auth: PARTNER_BAZAR | PARTNER_VRAKOVISTE

// PARTNER_BAZAR: monthly vehicle sales count + revenue, leads per month
// PARTNER_VRAKOVISTE: monthly order count + revenue (sum of OrderItem prices)

// Response:
{
  months: [
    { label: "lis", month: "2025-11", orders: 12, revenue: 45000 },
    { label: "pro", month: "2025-12", orders: 18, revenue: 67000 },
    // ...
  ]
}
```

Pro PARTNER_BAZAR:
```sql
-- Prodeje po měsících (posledních 6)
SELECT 
  date_trunc('month', "soldAt") as month,
  COUNT(*) as sales,
  SUM("soldPrice") as revenue
FROM "Vehicle"
WHERE "brokerId" = $1 AND "status" = 'SOLD' AND "soldAt" IS NOT NULL
  AND "soldAt" >= NOW() - INTERVAL '6 months'
GROUP BY date_trunc('month', "soldAt")
ORDER BY month;

-- Leads po měsících
SELECT
  date_trunc('month', "createdAt") as month,
  COUNT(*) as leads
FROM "PartnerLead"
WHERE "partnerId" = $1
  AND "createdAt" >= NOW() - INTERVAL '6 months'
GROUP BY date_trunc('month', "createdAt")
ORDER BY month;
```

Pro PARTNER_VRAKOVISTE:
```sql
-- Objednávky po měsících
SELECT
  date_trunc('month', o."createdAt") as month,
  COUNT(DISTINCT o."id") as orders,
  SUM(oi."price" * oi."quantity") as revenue
FROM "OrderItem" oi
JOIN "Order" o ON o."id" = oi."orderId"
WHERE oi."supplierId" = $1
  AND o."createdAt" >= NOW() - INTERVAL '6 months'
GROUP BY date_trunc('month', o."createdAt")
ORDER BY month;
```

#### `components/ui/charts/RevenueChart.tsx`

```tsx
"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  data: Array<{ label: string; revenue: number }>;
  height?: number;
}

export function RevenueChart({ data, height = 200 }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11 }}
          width={50}
        />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString("cs-CZ")} Kč`, "Tržby"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#F97316"
          fill="#F97316"
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

#### `components/ui/charts/OrdersChart.tsx`

```tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface OrdersChartProps {
  data: Array<{ label: string; orders: number }>;
  height?: number;
  barLabel?: string;
}

export function OrdersChart({ data, height = 200, barLabel = "Objednávky" }: OrdersChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} width={30} />
        <Tooltip formatter={(value) => [value, barLabel]} />
        <Bar dataKey="orders" fill="#F97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

#### Partner stats page update

V `app/(partner)/partner/stats/page.tsx`:
- Fetch z `/api/partner/stats/charts?months=6`
- Pod existující StatCard grid přidat:
  - `<Card>` s `<RevenueChart />` — "Tržby po měsících"
  - `<Card>` s `<OrdersChart />` — "Objednávky/Prodeje po měsících" (label based on role)

#### PWA-Parts dashboard

V `components/pwa-parts/dashboard/SupplierStats.tsx`:
- Přidat mini sparkline pod "Tržby (měsíc)" StatCard — nebo přidat separátní graf pod stats grid
- Jednoduchý `RevenueChart` s height=120

### 3.5 STOP kritéria

- STOP-1: recharts import failure / tree-shaking issue → ověř `"use client"` na chart components
- STOP-2: Raw SQL query selhává → fallback na Prisma aggregate s groupBy
- STOP-3: Rendering SSR error (recharts requires window) → ověř client component boundary

---

## §4 D15 — Otevírací doba Editor (Partner PWA)

### 4.1 Architektura

**Nejjednodušší feature:** Schema field `Partner.openingHours` JIŽ EXISTUJE. Display v public profile JIŽ FUNGUJE. Chybí jen:
1. Editor component
2. Uložení v PUT API

### 4.2 Soubory k vytvoření

| Soubor | Typ | Popis |
|--------|-----|-------|
| `components/partner/OpeningHoursEditor.tsx` | NEW | UI editor Po-Ne s časy |

### 4.3 Soubory k editaci

| Soubor | Změna |
|--------|-------|
| `app/(partner)/partner/profile/page.tsx` | Nahradit placeholder OpeningHoursEditorem |
| `app/api/partner/profile/route.ts` | PUT: přidat `openingHours` do update data |

### 4.4 Detail implementace

#### `components/partner/OpeningHoursEditor.tsx`

```tsx
"use client";

import { useState } from "react";

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];

interface DayHours {
  open: string;  // "08:00"
  close: string; // "17:00"
  closed: boolean;
}

type OpeningHours = Record<string, DayHours>;

interface OpeningHoursEditorProps {
  value: string | null;  // JSON string or null
  onChange: (json: string) => void;
}

export function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
  // Parse existing JSON → Record<string, DayHours>
  // Default: Mon-Fri 8:00-17:00, Sat-Sun closed
  
  // For each day: checkbox "Zavřeno" + time inputs (open/close)
  // "Kopírovat na všechny pracovní dny" button
  // Serialize to JSON on change: {"Pondělí": "8:00 - 17:00", ..., "Neděle": "Zavřeno"}
  
  const [hours, setHours] = useState<OpeningHours>(() => parseHours(value));
  
  // Render:
  // DAYS.map(day => (
  //   <div className="flex items-center gap-3">
  //     <span className="w-20 text-sm font-medium">{day}</span>
  //     <input type="checkbox" checked={!hours[day].closed} onChange={...} />
  //     {!hours[day].closed && (
  //       <>
  //         <input type="time" value={hours[day].open} onChange={...} />
  //         <span>—</span>
  //         <input type="time" value={hours[day].close} onChange={...} />
  //       </>
  //     )}
  //   </div>
  // ))
  
  // Serialize: {"Pondělí": "08:00 - 17:00", "Sobota": "Zavřeno"}
}

function parseHours(json: string | null): OpeningHours {
  // Parse existing JSON or return defaults
}

function serializeHours(hours: OpeningHours): string {
  // Convert to JSON string matching existing format on public profile
  const result: Record<string, string> = {};
  for (const day of DAYS) {
    result[day] = hours[day].closed ? "Zavřeno" : `${hours[day].open} - ${hours[day].close}`;
  }
  return JSON.stringify(result);
}
```

#### API update — `app/api/partner/profile/route.ts` PUT

```diff
  const updated = await prisma.partner.update({
    where: { id: partner.id },
    data: {
      description: body.description ?? partner.description,
      phone: body.phone ?? partner.phone,
      email: body.email ?? partner.email,
      web: body.web ?? partner.web,
      address: body.address ?? partner.address,
+     openingHours: body.openingHours !== undefined ? body.openingHours : partner.openingHours,
    },
  });
```

#### Profile page update

V `app/(partner)/partner/profile/page.tsx`:
- Import `OpeningHoursEditor`
- Přidat `openingHours` do form state
- Nahradit placeholder Card (line 123-130):
```tsx
<Card className="p-6">
  <h3 className="text-lg font-bold text-gray-900 mb-4">Otevírací doba</h3>
  <OpeningHoursEditor
    value={partner.openingHours ?? null}
    onChange={(json) => setForm(p => ({ ...p, openingHours: json }))}
  />
</Card>
```
- Přidat `openingHours` do save body

### 4.5 STOP kritéria

- STOP-1: `input type="time"` nemá konzistentní UI na iOS/Android → použij 2 selecty (hodiny + minuty) jako fallback
- STOP-2: JSON parsing selhává na starých datech → defensive parsing s try/catch + defaults

---

## §5 D16 — PDF dokumenty (Partner PWA)

### 5.1 Architektura

Server-side PDF generace s jsPDF (already installed). Dva typy dokumentů:
1. **Dodací list** (delivery note) — pro objednávky
2. **Potvrzení objednávky** (order confirmation) — pro zákazníka

### 5.2 Soubory k vytvoření

| Soubor | Typ | Popis |
|--------|-----|-------|
| `app/api/partner/orders/[id]/pdf/route.ts` | NEW | PDF generation endpoint |
| `lib/pdf/partner-documents.ts` | NEW | Shared PDF builder helpers |

### 5.3 Soubory k editaci

| Soubor | Změna |
|--------|-------|
| `app/(partner)/partner/orders/[id]/page.tsx` | Přidat "Stáhnout PDF" button |

### 5.4 Detail implementace

#### `lib/pdf/partner-documents.ts`

```tsx
import { jsPDF } from "jspdf";

interface PdfHelpers {
  doc: jsPDF;
  y: number;
  margin: number;
  contentWidth: number;
  addText: (text: string, fontSize: number, bold?: boolean, lineHeight?: number) => void;
  addLine: () => void;
  checkPageBreak: (neededSpace: number) => void;
}

export function createPdfDocument(): PdfHelpers {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const margin = 20;
  const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin;
  let y = margin;
  
  // Reuse addText pattern from contracts/[id]/pdf/route.ts
  // addLine: horizontal divider
  // checkPageBreak: if y > threshold, addPage + reset y
  
  return { doc, y, margin, contentWidth, addText, addLine, checkPageBreak };
}

interface DeliveryNoteData {
  orderNumber: string;
  date: string;
  supplier: { name: string; address?: string; ico?: string; phone?: string; email?: string };
  buyer: { name: string; address?: string; phone?: string; email?: string };
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  notes?: string;
}

export function generateDeliveryNote(data: DeliveryNoteData): Buffer {
  const { doc, addText, addLine } = createPdfDocument();
  
  // Header: CARMAKLER + Dodací list
  // Supplier info (left) + Buyer info (right)
  // Divider
  // Table: # | Název dílu | Množství | Cena/ks | Celkem
  // Divider
  // Total
  // Notes
  // Footer: "Vygenerováno systémem CarMakléř"
  
  return Buffer.from(doc.output("arraybuffer"));
}

interface OrderConfirmationData {
  orderNumber: string;
  date: string;
  supplier: { name: string; address?: string; phone?: string };
  buyer: { name: string; email?: string; phone?: string };
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  shippingMethod?: string;
  paymentMethod?: string;
}

export function generateOrderConfirmation(data: OrderConfirmationData): Buffer {
  // Similar to delivery note but with shipping/payment info
  // "Potvrzení objednávky č. {orderNumber}"
}
```

#### `app/api/partner/orders/[id]/pdf/route.ts`

```tsx
// POST /api/partner/orders/[id]/pdf?type=delivery|confirmation
// Auth: PARTNER_BAZAR | PARTNER_VRAKOVISTE

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  // Role check
  
  const { id } = await params;
  const type = request.nextUrl.searchParams.get("type") || "delivery";
  
  // Load order + items + buyer + supplier (partner)
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { part: true } },
      buyer: { select: { firstName, lastName, email, phone } },
    },
  });
  
  // Verify supplier owns this order's items
  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  
  // Generate PDF
  const pdfBuffer = type === "delivery"
    ? generateDeliveryNote({ ... })
    : generateOrderConfirmation({ ... });
  
  // Return PDF as download
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${type}-${id}.pdf"`,
    },
  });
}
```

#### Order detail page update

V `app/(partner)/partner/orders/[id]/page.tsx` přidat:
```tsx
<div className="flex gap-2">
  <Button
    variant="secondary"
    size="sm"
    onClick={() => downloadPdf("delivery")}
  >
    📄 Dodací list
  </Button>
  <Button
    variant="secondary"
    size="sm"
    onClick={() => downloadPdf("confirmation")}
  >
    📄 Potvrzení objednávky
  </Button>
</div>

async function downloadPdf(type: "delivery" | "confirmation") {
  const res = await fetch(`/api/partner/orders/${orderId}/pdf?type=${type}`, {
    method: "POST",
  });
  if (res.ok) {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-${orderId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

### 5.5 STOP kritéria

- STOP-1: jsPDF nemá česká diakritika v default fontech → použij helvetica (podporuje subset), nebo přidej custom font
- STOP-2: Order model nemá items relaci jak čekáno → ověř schema před implementací
- STOP-3: Cloudinary upload selhává → vrať PDF přímo jako response (neukládej)

---

## §6 Implementation Order

### Doporučené pořadí (od nejjednodušší po nejsložitější):

```
1. D15 — Otevírací doba editor       (~2h)  ← PRVNÍ — nejmenší scope, zero deps
2. D16 — PDF dokumenty               (~2h)  ← DRUHÝ — izolovaný, jsPDF proven
3. D11 — Fulltext Search             (~4h)  ← TŘETÍ — touches multiple files
4. D13 — Dashboard Grafy             (~5h)  ← ČTVRTÝ — needs new API + client charts
```

### Paralelizace

D15 a D16 jsou **zcela nezávislé** — mohou se implementovat paralelně.
D11 a D13 jsou nezávislé, ale obě editují partner stats/pages — lépe sekvenčně.

### Doporučená dávka:
- **Batch 1 (parallel):** D15 + D16
- **Batch 2 (sequential):** D11, pak D13

---

## §7 Acceptance Criteria

### D11 — Search
- [ ] Partner BAZAR: search overlay hledá vehicles (brand, model, vin) + naviguje na detail
- [ ] Partner VRAKOVISTE: search overlay hledá parts (name, OEM, category) + naviguje na detail
- [ ] PWA-Parts: search button v top baru, overlay funguje
- [ ] Lokální search na parts/vehicles list pages filtruje výsledky
- [ ] Debounce 300ms, min 2 znaky, loading indicator
- [ ] "Žádné výsledky" empty state

### D13 — Grafy
- [ ] Partner stats page zobrazuje RevenueChart (tržby po měsících, posledních 6)
- [ ] Partner stats page zobrazuje OrdersChart (objednávky/prodeje po měsících)
- [ ] Grafy správně zobrazují data pro BAZAR (prodeje) i VRAKOVISTE (objednávky)
- [ ] Grafy mají loading state
- [ ] Tooltip ukazuje přesné hodnoty v CZK formátu
- [ ] Responsive: grafy se přizpůsobí šířce na mobile

### D15 — Otevírací doba
- [ ] Profile page: 7 řádků (Po-Ne), každý s toggle "Otevřeno/Zavřeno" + time inputs
- [ ] Default: Po-Pá 8:00-17:00, So-Ne Zavřeno
- [ ] "Uložit profil" uloží openingHours do DB
- [ ] Po uložení se data zobrazují na public profilu `/bazar/[slug]`
- [ ] Editace existujících hodnot (load → edit → save roundtrip)
- [ ] Validace: open < close (nelze nastavit zavírací čas před otevíracím)

### D16 — PDF
- [ ] Order detail page má 2 tlačítka: "Dodací list" + "Potvrzení objednávky"
- [ ] PDF se stáhne jako soubor (Content-Disposition: attachment)
- [ ] Dodací list obsahuje: číslo objednávky, datum, dodavatel, odběratel, tabulka položek, celková cena
- [ ] Potvrzení objednávky obsahuje: stejné + způsob dopravy/platby
- [ ] PDF formát A4, čitelný, CarMakler branding v headeru
- [ ] Česká diakritika se zobrazuje správně (nebo graceful fallback bez diakritiky)

### Globální
- [ ] Žádné TypeScript errory (`npm run typecheck` passes)
- [ ] Žádné ESLint errory (`npm run lint` passes)
- [ ] Build prochází (`npm run build`)
- [ ] Stávající funkčnost nezlomená (regression check)
