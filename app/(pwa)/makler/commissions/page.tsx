import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommissionsView } from "@/components/pwa/commissions/CommissionsView";

export default async function CommissionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  type VehicleSelect = { id: string; brand: string; model: string; variant: string | null; price: number };
  let rawCommissions: Array<{
    id: string;
    commission: number;
    status: string;
    createdAt: Date;
    vehicle: VehicleSelect;
  }> = [];
  const stats = { total: 0, paid: 0, pending: 0 };

  try {
    rawCommissions = await prisma.commission.findMany({
      where: {
        brokerId: userId,
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            variant: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const c of rawCommissions) {
      stats.total += c.commission;
      if (c.status === "PAID") {
        stats.paid += c.commission;
      } else {
        stats.pending += c.commission;
      }
    }
  } catch {
    // Commission model jeste nemusi existovat
  }

  const serialized = rawCommissions.map((c) => ({
    id: c.id,
    amount: c.commission,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    vehicle: c.vehicle ?? null,
  }));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-extrabold text-gray-900">Provize</h1>

      <CommissionsView
        initialCommissions={serialized}
        initialStats={stats}
        initialMonth={currentMonth}
      />
    </div>
  );
}
