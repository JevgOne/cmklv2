import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SupplierStats } from "@/components/pwa-parts/dashboard/SupplierStats";
import { PendingOrders } from "@/components/pwa-parts/dashboard/PendingOrders";

export default function SupplierDashboardPage() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Dobrý den! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Přehled vašeho skladu a objednávek
        </p>
      </div>

      {/* CTA: Add part */}
      <Link href="/parts/new" className="block no-underline">
        <Button variant="primary" size="lg" className="w-full bg-gradient-to-br from-green-500 to-green-600 shadow-none hover:shadow-none">
          + Přidat nový díl
        </Button>
      </Link>

      {/* Stats */}
      <SupplierStats />

      {/* Pending orders */}
      <PendingOrders />
    </div>
  );
}
