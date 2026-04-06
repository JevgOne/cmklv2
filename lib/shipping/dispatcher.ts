import { prisma } from "@/lib/prisma";
import type { CarrierClient, CreateShipmentResult, DeliveryMethod } from "./types";
import { ZasilkovnaClient } from "./carriers/zasilkovna";
import { DpdClient } from "./carriers/dpd";
import { PplClient } from "./carriers/ppl";
import { GlsClient } from "./carriers/gls";
import { CeskaPostaClient } from "./carriers/ceska-posta";
import { calculateShipmentWeight } from "./weight";

/**
 * Vrátí klienta pro danou metodu doručení.
 * PICKUP → null (zákazník si vyzvedává osobně, žádná zásilka).
 */
export function getCarrierClient(method: DeliveryMethod): CarrierClient | null {
  switch (method) {
    case "ZASILKOVNA":
      return new ZasilkovnaClient();
    case "DPD":
      return new DpdClient();
    case "PPL":
      return new PplClient();
    case "GLS":
      return new GlsClient();
    case "CESKA_POSTA":
      return new CeskaPostaClient();
    case "PICKUP":
      return null;
    default: {
      // Exhaustiveness check — TypeScript si stěžuje pokud přidáme novou metodu
      const _exhaustive: never = method;
      void _exhaustive;
      return null;
    }
  }
}

/**
 * Hlavní entry point — vytvoří zásilku pro objednávku.
 *
 * Flow:
 * 1. Načte Order včetně items
 * 2. Validuje stav (skip PICKUP, skip pokud už má tracking)
 * 3. Spočítá weight
 * 4. Vybere klienta podle deliveryMethod
 * 5. Zavolá carrier.createShipment() → real API nebo dry-run
 * 6. Uloží trackingNumber, trackingUrl, shippingLabelUrl do Order
 * 7. Vrátí CreateShipmentResult
 *
 * Idempotentní — pokud už Order má trackingNumber, vrátí cached výsledek
 * bez dalšího volání API. Důležité pro retry Stripe webhooků.
 *
 * Použití: Stripe webhook (task #17) po payment_intent.succeeded.
 */
export async function createShipmentForOrder(
  orderId: string,
): Promise<CreateShipmentResult | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  if (order.deliveryMethod === "PICKUP") {
    console.log(`[shipping] Order ${order.orderNumber} is PICKUP — skipping shipment`);
    return null;
  }

  // Idempotence: pokud už má tracking, vrátíme cached výsledek
  if (order.trackingNumber) {
    console.log(
      `[shipping] Order ${order.orderNumber} already has tracking (${order.trackingNumber}) — skipping`,
    );
    return {
      trackingNumber: order.trackingNumber,
      carrier: order.deliveryMethod as DeliveryMethod,
      labelUrl: order.shippingLabelUrl ?? "",
      trackingUrl: order.trackingUrl ?? "",
      dryRun: order.trackingNumber.startsWith("DRY-"),
    };
  }

  const client = getCarrierClient(order.deliveryMethod as DeliveryMethod);
  if (!client) {
    throw new Error(`No carrier client for deliveryMethod=${order.deliveryMethod}`);
  }

  const weightKg = await calculateShipmentWeight(order.items);

  const result = await client.createShipment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    recipient: {
      name: order.deliveryName,
      phone: order.deliveryPhone,
      email: order.deliveryEmail,
      street: order.deliveryAddress,
      city: order.deliveryCity,
      zip: order.deliveryZip,
      country: "CZ",
    },
    zasilkovnaPointId: order.zasilkovnaPointId ?? undefined,
    zasilkovnaPointName: order.zasilkovnaPointName ?? undefined,
    weightKg,
    priceCzk: order.totalPrice,
    codAmountCzk: order.paymentMethod === "COD" ? order.totalPrice : undefined,
    description: `Objednávka ${order.orderNumber}`,
  });

  // Uložit výsledek do DB
  await prisma.order.update({
    where: { id: order.id },
    data: {
      trackingNumber: result.trackingNumber,
      trackingCarrier: result.carrier,
      trackingUrl: result.trackingUrl,
      shippingLabelUrl: result.labelUrl,
    },
  });

  return result;
}
