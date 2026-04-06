import { prisma } from "@/lib/prisma";

/**
 * Default fallback weight per položka, když `part.weight` není vyplněný.
 * 1 kg je rozumný průměr pro použité autodíly.
 */
const DEFAULT_WEIGHT_KG = 1.0;

/**
 * Spočítá celkovou hmotnost zásilky (v kg) z položek objednávky.
 * Načte `weight` z Part přes partId a vynásobí quantity.
 *
 * Fallbacky:
 * - prázdný input → DEFAULT_WEIGHT_KG
 * - `part.weight === null` → DEFAULT_WEIGHT_KG per položka
 * - výsledná váha < 0.1 kg → 0.1 kg (minimum dopravců)
 *
 * Výsledek je zaokrouhlený na 1 desetinné místo.
 */
export async function calculateShipmentWeight(
  orderItems: Array<{ partId: string; quantity: number }>,
): Promise<number> {
  if (orderItems.length === 0) return DEFAULT_WEIGHT_KG;

  const partIds = orderItems.map((i) => i.partId);
  const parts = await prisma.part.findMany({
    where: { id: { in: partIds } },
    select: { id: true, weight: true },
  });

  const weightMap = new Map(parts.map((p) => [p.id, p.weight ?? DEFAULT_WEIGHT_KG]));

  const totalKg = orderItems.reduce((sum, item) => {
    const w = weightMap.get(item.partId) ?? DEFAULT_WEIGHT_KG;
    return sum + w * item.quantity;
  }, 0);

  // Zaokrouhlit na 1 desetinné místo, minimum 0.1 kg
  return Math.max(0.1, Math.round(totalKg * 10) / 10);
}
