# Plan D16 — PDF dokumenty (Partner objednávky)

**Datum:** 2026-04-11
**Agent:** Plánovač
**Zdroj:** plan-faze3-batch-a.md §5, codebase audit
**Effort:** ~2h
**DB migrace:** ŽÁDNÁ
**Nové dependencies:** ŽÁDNÉ (jsPDF v4.2.1 already installed)

---

## §0 Executive summary

Server-side PDF generace pro partner objednávky. Dva typy dokumentů:
1. **Dodací list** — tištěný dokument přibalený k zásilce
2. **Potvrzení objednávky** — pro zákazníka (email/stažení)

**Proven pattern:** `app/api/contracts/[id]/pdf/route.ts` (lines 78-240) — `jsPDF` + `addText` helper s word-wrap + page breaks. Tohle je copy-adapt.

**Klíčový insight:** Order detail page (`app/(partner)/partner/orders/[id]/page.tsx`) volá shared endpoint `/api/orders/${id}` (GET) a `/api/orders/${id}/status` (PUT). PDF endpoint bude nový partner-specific route.

---

## §1 Soubory k vytvoření

### 1.1 `lib/pdf/partner-documents.ts` (NEW, ~180 lines)

Sdílený PDF builder pro partner dokumenty. Reusable helpery extrahované z contracts PDF.

```tsx
import { jsPDF } from "jspdf";

/* ── types ── */

interface PdfContext {
  doc: jsPDF;
  y: number;
  margin: number;
  contentWidth: number;
  pageWidth: number;
}

interface SupplierInfo {
  name: string;
  ico?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface BuyerInfo {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface LineItem {
  name: string;
  quantity: number;
  unitPrice: number;  // v haléřích (Int z DB)
  totalPrice: number; // v haléřích
}

interface DeliveryNoteData {
  orderNumber: string;
  date: string;
  supplier: SupplierInfo;
  buyer: BuyerInfo;
  items: LineItem[];
  totalPrice: number;       // v haléřích
  shippingPrice: number;    // v haléřích
  deliveryMethod: string;
  note?: string | null;
}

interface OrderConfirmationData extends DeliveryNoteData {
  paymentMethod: string;
  trackingNumber?: string | null;
}

/* ── helpers ── */

function createPdf(): PdfContext {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  return { doc, y: margin, margin, contentWidth: pageWidth - 2 * margin, pageWidth };
}

function addText(ctx: PdfContext, text: string, fontSize: number, bold = false, lineHeight = 6) {
  ctx.doc.setFontSize(fontSize);
  ctx.doc.setFont("helvetica", bold ? "bold" : "normal");
  const lines = ctx.doc.splitTextToSize(text, ctx.contentWidth);
  for (const line of lines) {
    if (ctx.y > 270) { ctx.doc.addPage(); ctx.y = ctx.margin; }
    ctx.doc.text(line, ctx.margin, ctx.y);
    ctx.y += lineHeight;
  }
}

function addLine(ctx: PdfContext) {
  ctx.doc.setDrawColor(200);
  ctx.doc.line(ctx.margin, ctx.y, ctx.pageWidth - ctx.margin, ctx.y);
  ctx.y += 6;
}

function formatCZK(halere: number): string {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(halere);
}

const DELIVERY_LABELS: Record<string, string> = {
  ZASILKOVNA: "Zásilkovna",
  DPD: "DPD",
  PPL: "PPL",
  GLS: "GLS",
  CESKA_POSTA: "Česká pošta",
  PICKUP: "Osobní odběr",
};

const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bankovní převod",
  COD: "Dobírka",
  CARD: "Platba kartou",
};

/* ── header (reused by both document types) ── */

function addHeader(ctx: PdfContext, title: string, orderNumber: string, date: string) {
  addText(ctx, "CARMAKLER", 10, true);
  ctx.y += 2;
  addText(ctx, title, 16, true, 8);
  ctx.y += 2;
  addText(ctx, `Cislo objednavky: ${orderNumber}`, 10);
  addText(ctx, `Datum: ${date}`, 10);
  ctx.y += 4;
  addLine(ctx);
}

/* ── parties section ── */

function addParties(ctx: PdfContext, supplier: SupplierInfo, buyer: BuyerInfo) {
  addText(ctx, "Dodavatel:", 11, true);
  addText(ctx, supplier.name, 10);
  if (supplier.ico) addText(ctx, `ICO: ${supplier.ico}`, 9);
  if (supplier.address) addText(ctx, supplier.address, 9);
  if (supplier.phone) addText(ctx, `Tel: ${supplier.phone}`, 9);
  if (supplier.email) addText(ctx, `Email: ${supplier.email}`, 9);
  ctx.y += 4;

  addText(ctx, "Odberatel:", 11, true);
  addText(ctx, buyer.name, 10);
  if (buyer.address) addText(ctx, buyer.address, 9);
  if (buyer.phone) addText(ctx, `Tel: ${buyer.phone}`, 9);
  if (buyer.email) addText(ctx, `Email: ${buyer.email}`, 9);
  ctx.y += 4;
  addLine(ctx);
}

/* ── items table ── */

function addItemsTable(ctx: PdfContext, items: LineItem[]) {
  // Table header
  addText(ctx, "Polozky:", 11, true);
  ctx.y += 2;

  ctx.doc.setFontSize(9);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.text("#", ctx.margin, ctx.y);
  ctx.doc.text("Nazev", ctx.margin + 8, ctx.y);
  ctx.doc.text("Ks", ctx.margin + 110, ctx.y);
  ctx.doc.text("Cena/ks", ctx.margin + 125, ctx.y);
  ctx.doc.text("Celkem", ctx.margin + 150, ctx.y);
  ctx.y += 5;

  ctx.doc.setFont("helvetica", "normal");
  items.forEach((item, i) => {
    if (ctx.y > 265) { ctx.doc.addPage(); ctx.y = ctx.margin; }
    ctx.doc.setFontSize(9);
    ctx.doc.text(String(i + 1), ctx.margin, ctx.y);
    // Truncate long names
    const name = item.name.length > 45 ? item.name.substring(0, 42) + "..." : item.name;
    ctx.doc.text(name, ctx.margin + 8, ctx.y);
    ctx.doc.text(String(item.quantity), ctx.margin + 110, ctx.y);
    ctx.doc.text(formatCZK(item.unitPrice), ctx.margin + 125, ctx.y);
    ctx.doc.text(formatCZK(item.totalPrice), ctx.margin + 150, ctx.y);
    ctx.y += 5;
  });
  ctx.y += 3;
  addLine(ctx);
}

/* ── totals section ── */

function addTotals(ctx: PdfContext, itemsTotal: number, shippingPrice: number, totalPrice: number, deliveryMethod: string) {
  ctx.doc.setFontSize(10);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.text("Polozky:", ctx.margin + 110, ctx.y);
  ctx.doc.text(formatCZK(itemsTotal), ctx.margin + 150, ctx.y);
  ctx.y += 5;
  ctx.doc.text(`Doprava (${DELIVERY_LABELS[deliveryMethod] || deliveryMethod}):`, ctx.margin + 80, ctx.y);
  ctx.doc.text(formatCZK(shippingPrice), ctx.margin + 150, ctx.y);
  ctx.y += 6;

  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(12);
  ctx.doc.text("Celkem:", ctx.margin + 110, ctx.y);
  ctx.doc.text(formatCZK(totalPrice), ctx.margin + 150, ctx.y);
  ctx.y += 8;
}

/* ── footer ── */

function addFooter(ctx: PdfContext) {
  ctx.y += 6;
  ctx.doc.setFontSize(8);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setTextColor(150);
  ctx.doc.text("Vygenerovano systemem CarMakler — carmakler.cz", ctx.margin, ctx.y);
  ctx.doc.setTextColor(0);
}

/* ── public API ── */

export function generateDeliveryNote(data: DeliveryNoteData): Buffer {
  const ctx = createPdf();
  const date = data.date;

  addHeader(ctx, "Dodaci list", data.orderNumber, date);
  addParties(ctx, data.supplier, data.buyer);

  const itemsTotal = data.items.reduce((s, i) => s + i.totalPrice, 0);
  addItemsTable(ctx, data.items);
  addTotals(ctx, itemsTotal, data.shippingPrice, data.totalPrice, data.deliveryMethod);

  if (data.note) {
    addText(ctx, "Poznamka:", 10, true);
    addText(ctx, data.note, 9);
  }

  addFooter(ctx);
  return Buffer.from(ctx.doc.output("arraybuffer"));
}

export function generateOrderConfirmation(data: OrderConfirmationData): Buffer {
  const ctx = createPdf();
  const date = data.date;

  addHeader(ctx, "Potvrzeni objednavky", data.orderNumber, date);
  addParties(ctx, data.supplier, data.buyer);

  const itemsTotal = data.items.reduce((s, i) => s + i.totalPrice, 0);
  addItemsTable(ctx, data.items);
  addTotals(ctx, itemsTotal, data.shippingPrice, data.totalPrice, data.deliveryMethod);

  // Payment + tracking info
  addText(ctx, "Platba:", 10, true);
  addText(ctx, PAYMENT_LABELS[data.paymentMethod] || data.paymentMethod, 10);
  ctx.y += 2;
  if (data.trackingNumber) {
    addText(ctx, "Sledovaci cislo:", 10, true);
    addText(ctx, data.trackingNumber, 10);
    ctx.y += 2;
  }

  if (data.note) {
    ctx.y += 2;
    addText(ctx, "Poznamka:", 10, true);
    addText(ctx, data.note, 9);
  }

  addFooter(ctx);
  return Buffer.from(ctx.doc.output("arraybuffer"));
}
```

**Klíčové rozhodnutí:**
- Diakritika: jsPDF default helvetica **nepodporuje české znaky** → texty bez diakritiky (`Cislo`, `Dodaci list`, `Polozky`). Toto je vědomé rozhodnutí pro MVP. Custom font (s diakritikou) je follow-up.
- Ceny jsou v DB jako Int (haléře) → `formatCZK()` je formátuje
- Reusable `PdfContext` pattern místo closures — jednodušší testování
- Žádný Cloudinary upload — vrací PDF přímo jako response (partner si stáhne)

---

### 1.2 `app/api/partner/orders/[id]/pdf/route.ts` (NEW, ~80 lines)

```tsx
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDeliveryNote, generateOrderConfirmation } from "@/lib/pdf/partner-documents";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE", "PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "ADMIN", "BACKOFFICE"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;
    const type = request.nextUrl.searchParams.get("type") || "delivery";

    // Load order + items + parts + buyer
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            part: { select: { name: true, slug: true } },
          },
        },
        buyer: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Objednavka nenalezena" }, { status: 404 });
    }

    // Verify: supplier owns at least one item in this order
    const supplierItems = order.items.filter(item => item.supplierId === session.user.id);
    const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);
    if (supplierItems.length === 0 && !isAdmin) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    // Load partner profile for supplier info
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: { name: true, ico: true, address: true, city: true, phone: true, email: true },
    });

    const supplierInfo = {
      name: partner?.name || "Dodavatel",
      ico: partner?.ico,
      address: [partner?.address, partner?.city].filter(Boolean).join(", ") || null,
      phone: partner?.phone,
      email: partner?.email,
    };

    const buyerInfo = {
      name: order.deliveryName,
      email: order.deliveryEmail,
      phone: order.deliveryPhone,
      address: [order.deliveryAddress, order.deliveryCity, order.deliveryZip].filter(Boolean).join(", ") || null,
    };

    const items = (isAdmin ? order.items : supplierItems).map(item => ({
      name: item.part.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    const itemsTotal = items.reduce((s, i) => s + i.totalPrice, 0);
    const createdAt = new Date(order.createdAt).toLocaleDateString("cs-CZ", {
      day: "numeric", month: "long", year: "numeric",
    });

    const commonData = {
      orderNumber: order.orderNumber,
      date: createdAt,
      supplier: supplierInfo,
      buyer: buyerInfo,
      items,
      totalPrice: isAdmin ? order.totalPrice : itemsTotal + (isAdmin ? order.shippingPrice : 0),
      shippingPrice: order.shippingPrice,
      deliveryMethod: order.deliveryMethod,
      note: order.note,
    };

    const pdfBuffer = type === "confirmation"
      ? generateOrderConfirmation({
          ...commonData,
          paymentMethod: order.paymentMethod,
          trackingNumber: order.trackingNumber,
        })
      : generateDeliveryNote(commonData);

    const filename = type === "confirmation"
      ? `potvrzeni-${order.orderNumber}.pdf`
      : `dodaci-list-${order.orderNumber}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("POST /api/partner/orders/[id]/pdf error:", error);
    return NextResponse.json({ error: "Chyba pri generovani PDF" }, { status: 500 });
  }
}
```

**Klíčové rozhodnutí:**
- `params: Promise<{ id: string }>` — Next.js 15 async params pattern (konzistentní s contracts PDF route)
- Ownership check: supplier musí mít alespoň 1 item v objednávce (stejný pattern jako `/api/orders/[id]`)
- Admin/BackOffice vidí všechny items, supplier jen své
- PDF se vrací přímo jako attachment (Content-Disposition) — žádný Cloudinary upload
- Filename: `dodaci-list-{orderNumber}.pdf` nebo `potvrzeni-{orderNumber}.pdf`

---

## §2 Soubory k editaci

### 2.1 `app/(partner)/partner/orders/[id]/page.tsx` — přidat PDF tlačítka

**Kde:** Za "Price breakdown" Card (po line 208), před "Status actions" (line 211).

**Přidat:**

```tsx
{/* PDF download buttons */}
<div className="flex gap-3">
  <Button
    variant="secondary"
    size="sm"
    className="flex-1"
    onClick={() => downloadPdf("delivery")}
  >
    Dodaci list
  </Button>
  <Button
    variant="secondary"
    size="sm"
    className="flex-1"
    onClick={() => downloadPdf("confirmation")}
  >
    Potvrzeni objednavky
  </Button>
</div>
```

**Přidat funkci** do component body (před `if (loading)`, asi kolem line 60):

```tsx
const downloadPdf = async (type: "delivery" | "confirmation") => {
  try {
    const res = await fetch(`/api/partner/orders/${id}/pdf?type=${type}`, {
      method: "POST",
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type === "delivery" ? "dodaci-list" : "potvrzeni"}-${order?.orderNumber || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch {
    // silent fail — uživatel zkusí znovu
  }
};
```

---

## §3 Directory structure

Vytvořit adresář `lib/pdf/` (pokud neexistuje) a `app/api/partner/orders/[id]/pdf/`.

```
lib/pdf/
  partner-documents.ts  ← NEW

app/api/partner/orders/
  [id]/
    pdf/
      route.ts          ← NEW
```

---

## §4 Acceptance criteria

- [ ] Order detail page má 2 tlačítka: "Dodaci list" + "Potvrzeni objednavky"
- [ ] Kliknutí stáhne PDF soubor (Content-Disposition: attachment)
- [ ] Dodací list: číslo objednávky, datum, dodavatel, odběratel, tabulka položek, celková cena
- [ ] Potvrzení objednávky: stejné + způsob platby/dopravy + tracking číslo (pokud existuje)
- [ ] PDF formát A4, čitelný layout
- [ ] CarMakler branding v headeru
- [ ] Ownership check: supplier vidí jen své items, admin vidí vše
- [ ] Non-supplier dostane 403
- [ ] TypeScript: 0 errors
- [ ] Build: passes

## §5 STOP kritéria

- **STOP-1:** jsPDF default font nepodporuje českou diakritiku → **VĚDOMÉ ROZHODNUTÍ** — v MVP používáme texty bez diakritiky. Follow-up: přidat custom Outfit font do jsPDF. Eskaluj pokud PO požaduje diakritiku hned.
- **STOP-2:** `order.items` include chain selhává (Part model changed) → ověř schema Part fields `name`, `slug` existují (ANO, existují na lines 889-954).
- **STOP-3:** `deliveryAddress` neexistuje na Order modelu → **EXISTUJE** (line 1022), ale order detail page UI používá `deliveryStreet` (line 177). Ověř: schema má `deliveryAddress` (celá adresa), UI interface má `deliveryStreet`. **Pozor na mapping!** API `/api/orders/[id]` může vracet fields pod jinými názvy. Implementator musí ověřit response shape z GET endpoint.
- **STOP-4:** `lib/pdf/` directory neexistuje → vytvořit `mkdir -p lib/pdf` nebo nechat Write tool vytvořit.
