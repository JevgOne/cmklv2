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
 * Vytvoří zásilku pro konkrétní SubOrder.
 *
 * Flow:
 * 1. Načte SubOrder + parent Order (pro adresu příjemce)
 * 2. Validuje stav (skip PICKUP, skip pokud už má tracking)
 * 3. Spočítá weight z SubOrder items
 * 4. Vybere klienta podle SubOrder.deliveryMethod
 * 5. Zavolá carrier.createShipment()
 * 6. Uloží trackingNumber, trackingUrl, shippingLabelUrl do SubOrder
 * 7. Vrátí CreateShipmentResult
 *
 * Idempotentní — pokud už SubOrder má trackingNumber, vrátí cached výsledek.
 */
export async function createShipmentForSubOrder(
  subOrderId: string,
): Promise<CreateShipmentResult | null> {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: {
      items: true,
      order: true,
    },
  });
  if (!subOrder) throw new Error(`SubOrder ${subOrderId} not found`);

  const order = subOrder.order;

  if (subOrder.deliveryMethod === "PICKUP") {
    console.log(`[shipping] SubOrder ${subOrderId} is PICKUP — skipping shipment`);
    return null;
  }

  // Idempotence: pokud už má tracking, vrátíme cached výsledek
  if (subOrder.trackingNumber) {
    console.log(
      `[shipping] SubOrder ${subOrderId} already has tracking (${subOrder.trackingNumber}) — skipping`,
    );
    return {
      trackingNumber: subOrder.trackingNumber,
      carrier: subOrder.deliveryMethod as DeliveryMethod,
      labelUrl: subOrder.shippingLabelUrl ?? "",
      trackingUrl: subOrder.trackingUrl ?? "",
      dryRun: subOrder.trackingNumber.startsWith("DRY-"),
    };
  }

  const client = getCarrierClient(subOrder.deliveryMethod as DeliveryMethod);
  if (!client) {
    throw new Error(`No carrier client for deliveryMethod=${subOrder.deliveryMethod}`);
  }

  const weightKg = await calculateShipmentWeight(subOrder.items);

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
    zasilkovnaPointId: subOrder.zasilkovnaPointId ?? undefined,
    zasilkovnaPointName: subOrder.zasilkovnaPointName ?? undefined,
    weightKg,
    priceCzk: subOrder.subtotal,
    codAmountCzk: order.paymentMethod === "COD" ? subOrder.subtotal : undefined,
    description: `Objednávka ${order.orderNumber}`,
  });

  // Uložit výsledek do SubOrder
  await prisma.subOrder.update({
    where: { id: subOrderId },
    data: {
      trackingNumber: result.trackingNumber,
      trackingCarrier: result.carrier,
      trackingUrl: result.trackingUrl,
      shippingLabelUrl: result.labelUrl,
    },
  });

  return result;
}

/**
 * Wrapper — vytvoří zásilky pro všechny SubOrders v objednávce.
 *
 * Iteruje přes SubOrders bez trackingu (skip PICKUP), volá createShipmentForSubOrder.
 * Používá se ze Stripe webhooku po payment_intent.succeeded.
 */
export async function createShipmentForOrder(
  orderId: string,
): Promise<CreateShipmentResult[]> {
  const subOrders = await prisma.subOrder.findMany({
    where: {
      orderId,
      trackingNumber: null,
      NOT: { deliveryMethod: "PICKUP" },
    },
  });

  const results: CreateShipmentResult[] = [];
  for (const so of subOrders) {
    const result = await createShipmentForSubOrder(so.id);
    if (result) results.push(result);
  }
  return results;
}
