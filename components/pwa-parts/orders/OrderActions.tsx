"use client";

import { Button } from "@/components/ui/Button";

type OrderStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface OrderActionsProps {
  status: OrderStatus;
  onStatusChange: (newStatus: OrderStatus) => void;
}

const nextAction: Partial<Record<OrderStatus, { label: string; next: OrderStatus; variant: "primary" | "success" }>> = {
  NEW: { label: "Potvrdit objednávku", next: "CONFIRMED", variant: "success" },
};

export function OrderActions({ status, onStatusChange }: OrderActionsProps) {
  const action = nextAction[status];

  // CONFIRMED — instrukce směřuje uživatele na ShippingLabelCard výše
  if (status === "CONFIRMED") {
    return (
      <div className="text-center text-sm text-gray-500 py-4">
        Stáhněte si přepravní štítek výše, přilepte na krabici a označte jako odesláno.
      </div>
    );
  }

  if (!action) {
    return (
      <div className="text-center text-sm text-gray-500 py-4">
        {status === "SHIPPED" && "Čeká se na doručení"}
        {status === "DELIVERED" && "Objednávka dokončena"}
        {status === "CANCELLED" && "Objednávka zrušena"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        variant={action.variant}
        size="lg"
        className="w-full"
        onClick={() => onStatusChange(action.next)}
      >
        {action.label}
      </Button>

      {status === "NEW" && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-red-500"
          onClick={() => onStatusChange("CANCELLED")}
        >
          Odmítnout objednávku
        </Button>
      )}
    </div>
  );
}
