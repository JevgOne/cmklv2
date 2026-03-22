import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FinancingCalculator } from "@/components/pwa/gamification/FinancingCalculator";

export default async function FinancingCalculatorPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Kalkulacka financovani
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Vypocitejte mesicni splatky pro kupujiciho
        </p>
      </div>

      <FinancingCalculator />
    </div>
  );
}
