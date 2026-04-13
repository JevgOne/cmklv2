export const RETURN_STATUSES = [
  "NEW", "RECEIVED", "SHIPPED_BACK", "IN_REVIEW", "APPROVED",
  "REFUNDED", "PARTIALLY_REFUNDED", "REJECTED", "CANCELLED",
] as const;

export const RETURN_STATUS_MAP: Record<string, { label: string; variant: "success" | "pending" | "rejected" }> = {
  NEW: { label: "Nová", variant: "pending" },
  RECEIVED: { label: "Přijata", variant: "pending" },
  SHIPPED_BACK: { label: "Odesláno zpět", variant: "pending" },
  IN_REVIEW: { label: "Posuzování", variant: "pending" },
  APPROVED: { label: "Schválena", variant: "success" },
  REFUNDED: { label: "Vráceno", variant: "success" },
  PARTIALLY_REFUNDED: { label: "Částečně vráceno", variant: "success" },
  REJECTED: { label: "Zamítnuta", variant: "rejected" },
  CANCELLED: { label: "Zrušena", variant: "rejected" },
};

export const RETURN_TYPE_MAP: Record<string, string> = {
  WITHDRAWAL: "Odstoupení od smlouvy",
  WARRANTY: "Záruční reklamace",
};

export const RETURN_TYPES = ["WITHDRAWAL", "WARRANTY"] as const;

export function formatPriceCZK(amount: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(amount);
}
