import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrokerPayoutsContent } from "@/components/pwa/BrokerPayoutsContent";

export const metadata = {
  title: "Provize | Carmakler",
};

export default async function BrokerPayoutsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "BROKER" && session.user.role !== "ADMIN") {
    redirect("/makler/dashboard");
  }

  const userId = session.user.id;

  const payouts = await prisma.brokerPayout.findMany({
    where: { brokerId: userId },
    include: {
      commissions: {
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
        orderBy: { soldAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = payouts.map((p) => ({
    id: p.id,
    period: p.period,
    totalAmount: p.totalAmount,
    status: p.status,
    invoiceUrl: p.invoiceUrl,
    invoiceNumber: p.invoiceNumber,
    paidAt: p.paidAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    commissions: p.commissions.map((c) => ({
      id: c.id,
      salePrice: c.salePrice,
      commission: c.commission,
      brokerShare: c.brokerShare,
      status: c.status,
      soldAt: c.soldAt.toISOString(),
      vehicle: c.vehicle
        ? {
            id: c.vehicle.id,
            name: `${c.vehicle.brand} ${c.vehicle.model}${c.vehicle.variant ? ` ${c.vehicle.variant}` : ""}`,
            price: c.vehicle.price,
          }
        : null,
    })),
  }));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-extrabold text-gray-900">Výplaty provizí</h1>
      <BrokerPayoutsContent payouts={serialized} />
    </div>
  );
}
