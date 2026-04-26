import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";

const BONUS_PER_SALE = 2500; // Kč za prodej makléře

interface MonthlyBonus {
  month: string;
  sales: number;
  bonus: number;
}

// Admin pages call Prisma at top of server component — force dynamic
// rendering aby Next.js neskoušel prerender v build time bez DB.
export const dynamic = "force-dynamic";

export default async function ManagerBonusesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!["MANAGER", "REGIONAL_DIRECTOR", "ADMIN"].includes(session.user.role)) {
    redirect("/admin/dashboard");
  }

  // ADMIN vidí všechny makléře, MANAGER jen své
  const managerFilter = session.user.role === "ADMIN" ? {} : { managerId: session.user.id };
  const teamBrokers = await prisma.user.findMany({
    where: { ...managerFilter, role: "BROKER" },
    select: { id: true },
  });

  const brokerIds = teamBrokers.map((b) => b.id);

  // Načti prodeje (PAID commissions) od makléřů tohoto manažera
  const commissions = await prisma.commission.findMany({
    where: {
      brokerId: { in: brokerIds },
      status: "PAID",
    },
    select: {
      soldAt: true,
      salePrice: true,
    },
    orderBy: { soldAt: "desc" },
  });

  // Aktuální měsíc
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Seskupit prodeje po měsících
  const monthlyMap = new Map<string, number>();

  for (const c of commissions) {
    const date = new Date(c.soldAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
  }

  // Aktuální měsíc stats
  const currentMonthSales = monthlyMap.get(currentMonthKey) ?? 0;
  const currentMonthBonus = currentMonthSales * BONUS_PER_SALE;

  // Historie (posledních 12 měsíců)
  const history: MonthlyBonus[] = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const sales = monthlyMap.get(key) ?? 0;
    history.push({
      month: date.toLocaleDateString("cs-CZ", {
        month: "long",
        year: "numeric",
      }),
      sales,
      bonus: sales * BONUS_PER_SALE,
    });
  }

  // Celkové bonusy
  const totalSales = commissions.length;
  const totalBonus = totalSales * BONUS_PER_SALE;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Manager</span>
          <span>/</span>
          <span className="text-gray-900">Bonusy</span>
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">
          Manazerske bonusy
        </h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          icon="💰"
          iconColor="green"
          value={`${currentMonthBonus.toLocaleString("cs-CZ")} Kc`}
          label={`Bonusy tento mesic (${currentMonthSales} prodeju)`}
        />
        <StatCard
          icon="📊"
          iconColor="blue"
          value={`${totalBonus.toLocaleString("cs-CZ")} Kc`}
          label={`Celkove bonusy (${totalSales} prodeju)`}
        />
        <StatCard
          icon="🎯"
          iconColor="orange"
          value={`${BONUS_PER_SALE.toLocaleString("cs-CZ")} Kc`}
          label="Bonus za prodej"
        />
      </div>

      {/* History table */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Historie bonusu
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-4 sm:px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  Mesic
                </th>
                <th className="text-right px-4 sm:px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  Prodeje
                </th>
                <th className="text-right px-4 sm:px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  Bonus
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, i) => (
                <tr
                  key={i}
                  className={`hover:bg-gray-50 transition-colors ${
                    i === 0 ? "bg-orange-50/50" : ""
                  }`}
                >
                  <td className="px-4 sm:px-6 py-4 border-b border-gray-100 text-sm font-medium text-gray-900">
                    {row.month}
                    {i === 0 && (
                      <span className="ml-2 text-xs font-bold text-orange-500">
                        aktualni
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 border-b border-gray-100 text-sm text-gray-600 text-right">
                    {row.sales}
                  </td>
                  <td className="px-4 sm:px-6 py-4 border-b border-gray-100 text-sm font-semibold text-right">
                    <span
                      className={row.bonus > 0 ? "text-success-500" : "text-gray-400"}
                    >
                      {row.bonus.toLocaleString("cs-CZ")} Kc
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
