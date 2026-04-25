import { jsPDF } from "jspdf";
import { getLogoBase64 } from "@/lib/pdf/logo";

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
  unitPrice: number;
  totalPrice: number;
}

interface DeliveryNoteData {
  orderNumber: string;
  date: string;
  supplier: SupplierInfo;
  buyer: BuyerInfo;
  items: LineItem[];
  totalPrice: number;
  shippingPrice: number;
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

function formatCZK(value: number): string {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
}

const DELIVERY_LABELS: Record<string, string> = {
  ZASILKOVNA: "Zasilkovna",
  DPD: "DPD",
  PPL: "PPL",
  GLS: "GLS",
  CESKA_POSTA: "Ceska posta",
  PICKUP: "Osobni odber",
};

const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bankovni prevod",
  COD: "Dobirka",
  CARD: "Platba kartou",
};

/* ── header ── */

function addHeader(ctx: PdfContext, title: string, orderNumber: string, date: string) {
  const logoData = getLogoBase64();
  const logoHeight = 10;
  const logoWidth = 21;
  ctx.doc.addImage(logoData, "PNG", ctx.margin, ctx.y, logoWidth, logoHeight);
  ctx.y += logoHeight + 2;
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

export function generateDeliveryNote(data: DeliveryNoteData): Uint8Array {
  const ctx = createPdf();

  addHeader(ctx, "Dodaci list", data.orderNumber, data.date);
  addParties(ctx, data.supplier, data.buyer);

  const itemsTotal = data.items.reduce((s, i) => s + i.totalPrice, 0);
  addItemsTable(ctx, data.items);
  addTotals(ctx, itemsTotal, data.shippingPrice, data.totalPrice, data.deliveryMethod);

  if (data.note) {
    addText(ctx, "Poznamka:", 10, true);
    addText(ctx, data.note, 9);
  }

  addFooter(ctx);
  return new Uint8Array(ctx.doc.output("arraybuffer"));
}

export function generateOrderConfirmation(data: OrderConfirmationData): Uint8Array {
  const ctx = createPdf();

  addHeader(ctx, "Potvrzeni objednavky", data.orderNumber, data.date);
  addParties(ctx, data.supplier, data.buyer);

  const itemsTotal = data.items.reduce((s, i) => s + i.totalPrice, 0);
  addItemsTable(ctx, data.items);
  addTotals(ctx, itemsTotal, data.shippingPrice, data.totalPrice, data.deliveryMethod);

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
  return new Uint8Array(ctx.doc.output("arraybuffer"));
}
