"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type OrderStatus = "NEW" | "CONFIRMED" | "PACKING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface OrderActionsProps {
  orderId: string;
  status: OrderStatus;
  onStatusChange: (newStatus: OrderStatus) => void;
}

const nextAction: Partial<Record<OrderStatus, { label: string; next: OrderStatus; variant: "primary" | "success" }>> = {
  NEW: { label: "Potvrdit objednávku", next: "CONFIRMED", variant: "success" },
  CONFIRMED: { label: "Začít balit", next: "PACKING", variant: "primary" },
  PACKING: { label: "Odeslat", next: "SHIPPED", variant: "primary" },
};

export function OrderActions({ orderId, status, onStatusChange }: OrderActionsProps) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const action = nextAction[status];

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
      {/* Tracking number input for shipping step */}
      {status === "PACKING" && (
        <Input
          label="Tracking číslo"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="CZ1234567890"
        />
      )}

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
