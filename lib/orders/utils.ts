/**
 * Shared order utilities — used by SubOrder status/tracking routes.
 */

const STATUS_PRIORITY = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

/**
 * Aggregate Order status from SubOrders using worst-state-wins.
 * CANCELLED SubOrders are excluded. If all cancelled → CANCELLED.
 * Priority: PENDING < CONFIRMED < SHIPPED < DELIVERED.
 */
export function aggregateOrderStatus(subOrders: { status: string }[]): string {
  const active = subOrders.filter((s) => s.status !== "CANCELLED");
  if (active.length === 0) return "CANCELLED";
  const worst = Math.min(
    ...active.map((s) => {
      const idx = STATUS_PRIORITY.indexOf(s.status);
      return idx === -1 ? 0 : idx;
    }),
  );
  return STATUS_PRIORITY[worst] || "PENDING";
}
