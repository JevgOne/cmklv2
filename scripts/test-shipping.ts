/**
 * Manuální test shipping dispatcher v dry-run módu.
 *
 * Spuštění:
 *   npx tsx scripts/test-shipping.ts
 *
 * Co dělá:
 *   1. Najde první PENDING objednávku (non-PICKUP) v DB
 *   2. Zavolá createShipmentForOrder() → dry-run result
 *   3. Vypíše tracking number + confirmation že funguje
 *
 * Požadavky:
 *   - Alespoň 1 objednávka s status=PENDING v DB (seed data)
 *   - Dry-run mód (žádné ENV klíče pro dopravce) nebo reálné klíče
 */
import { createShipmentForOrder } from "@/lib/shipping/dispatcher";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("=== Shipping dry-run test ===\n");

  // Najít libovolnou PENDING objednávku (non-PICKUP)
  const order = await prisma.order.findFirst({
    where: {
      status: "PENDING",
      deliveryMethod: { not: "PICKUP" },
      trackingNumber: null, // ještě nemá zásilku
    },
  });

  if (!order) {
    console.log(
      "❌ Žádná vhodná objednávka nenalezena (potřebujeme PENDING, non-PICKUP, bez trackingu).",
    );
    console.log("💡 Tip: spusť `npx prisma db seed` pro vygenerování dat.");
    return;
  }

  console.log(`📦 Testing shipment for order:`);
  console.log(`   - orderNumber: ${order.orderNumber}`);
  console.log(`   - deliveryMethod: ${order.deliveryMethod}`);
  console.log(`   - recipient: ${order.deliveryName}, ${order.deliveryCity}`);
  console.log(`   - totalPrice: ${order.totalPrice} Kč\n`);

  const result = await createShipmentForOrder(order.id);

  if (!result) {
    console.log("⏩ Skipped (PICKUP nebo jiný důvod)");
    return;
  }

  console.log("\n✅ Result:");
  console.log(JSON.stringify(result, null, 2));
  console.log(`\n🏷  Dry-run: ${result.dryRun ? "YES (žádné reálné volání)" : "NO (reálné API)"}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
