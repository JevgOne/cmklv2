# Plan — Task #41: Visual search stub + Stripe refund v returns

**Datum:** 2026-04-14
**Gap:** G-01 + G-17 (P0 refund + P3 visual search)
**Effort:** S-M (4-6h)

---

## 1. STRIPE REFUND V RETURNS (P0 — kritické!)

### Problém
Admin změní ReturnRequest status na REFUNDED → jen nastaví `refundedAt = new Date()`.
**Stripe `refunds.create()` se NEVOLÁ.** Zákazníkovi se peníze nevrátí.

### Řešení

**Soubor:** `app/api/admin/returns/[id]/route.ts` — rozšířit PUT handler

**Potřeba:** Najít paymentIntentId pro objednávku.

Aktuální stav: Order NEMÁ `stripePaymentIntentId` pole. Ale:
- Stripe webhook uloží `orderId` do metadata `checkout.session.completed`
- Payment model má `stripePaymentIntent` ale je jen pro vehicle reservations

**Řešení A (doporučené):** Přidat `stripePaymentIntentId String?` na Order model.
Stripe webhook (`handleOrderPayment`) ho uloží při `checkout.session.completed`:
```typescript
// V handleOrderPayment() po order update:
await prisma.order.update({
  where: { id: orderId },
  data: {
    paymentStatus: "PAID",
    stripePaymentIntentId: session.payment_intent as string,
  },
});
```

**Refund logika v PUT /api/admin/returns/[id]:**
```typescript
if (data.status === "REFUNDED" || data.status === "PARTIALLY_REFUNDED") {
  updateData.refundedAt = new Date();

  // Stripe refund
  const order = await prisma.order.findUnique({
    where: { id: existing.orderId },
    select: { stripePaymentIntentId: true, paymentMethod: true },
  });

  if (order?.stripePaymentIntentId && order.paymentMethod === "CARD") {
    try {
      const stripe = getStripe();
      const refundAmount = data.approvedAmount ?? existing.requestedAmount;
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        amount: refundAmount * 100, // v haléřích
        reason: "requested_by_customer",
      });
    } catch (refundError) {
      console.error("Stripe refund error:", refundError);
      // Pokračovat — DB status se změní, refund se řeší manuálně
      updateData.adminNotes = (updateData.adminNotes || "") +
        `\n[SYSTEM] Stripe refund selhal: ${refundError}. Vyřešte manuálně.`;
    }
  }
}
```

### Prisma migrace
```prisma
// Na Order model přidat:
stripePaymentIntentId String?
```

---

## 2. VISUAL SEARCH STUB (P3 — fáze 2)

### POST /api/parts/visual-search
**Soubor:** `app/api/parts/visual-search/route.ts` (NOVÝ)

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Nahrajte fotografii dílu" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    // Stub response — AI nedostupné
    return NextResponse.json({
      recognized: false,
      message: "Vizuální vyhledávání je ve vývoji. Zkuste popsat díl textově.",
      suggestions: [],
    });
  }

  // Claude Vision rozpoznání
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: anthropicKey });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: `Rozpoznej tento autodíl. Odpověz v JSON:
            { "partType": "název dílu česky", "category": "ENGINE|BRAKES|BODY|...",
              "oemNumber": "pokud viditelné, jinak null",
              "manufacturer": "pokud viditelný, jinak null",
              "confidence": 0.0-1.0 }`,
          },
        ],
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);

    // Hledat díly v katalogu
    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (parsed.category) where.category = parsed.category;
    if (parsed.oemNumber) {
      where.OR = [
        { oemNumber: { contains: parsed.oemNumber, mode: "insensitive" } },
        { name: { contains: parsed.partType, mode: "insensitive" } },
      ];
    } else if (parsed.partType) {
      where.name = { contains: parsed.partType, mode: "insensitive" };
    }

    const suggestions = await prisma.part.findMany({
      where,
      select: { id: true, name: true, slug: true, price: true, stock: true,
        images: { where: { isPrimary: true }, take: 1 } },
      take: 6,
      orderBy: { viewCount: "desc" },
    });

    return NextResponse.json({
      recognized: true,
      partType: parsed.partType,
      category: parsed.category,
      oemNumber: parsed.oemNumber,
      manufacturer: parsed.manufacturer,
      confidence: parsed.confidence,
      suggestions,
    });
  } catch (error) {
    console.error("Visual search error:", error);
    return NextResponse.json({
      recognized: false,
      message: "Nepodařilo se rozpoznat díl. Zkuste popsat textově.",
      suggestions: [],
    });
  }
}
```

---

## 3. POŘADÍ

1. **Prisma migrace** — `stripePaymentIntentId` na Order
2. **Stripe webhook update** — uložit paymentIntentId při checkout.session.completed
3. **Returns refund** — Stripe refunds.create() v admin PUT handler
4. **Visual search stub** — POST endpoint s Claude Vision fallback

---

## 4. COMMIT
```
feat: add Stripe refund for returns + visual search stub (Claude Vision)
```
