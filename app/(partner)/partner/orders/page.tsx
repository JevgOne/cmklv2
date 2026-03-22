"use client";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PartnerOrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
        Objednavky
      </h1>
      <Card>
        <EmptyState
          icon="📦"
          title="Zadne objednavky"
          description="Zatim nemáte zadne objednavky v systemu."
        />
      </Card>
    </div>
  );
}
