import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContractsList } from "@/components/pwa/contracts/ContractsList";
import { canAccess, getNextLevelInfo } from "@/lib/feature-gates";
import { LockedFeatureCard } from "@/components/pwa/LockedFeatureCard";

export default async function ContractsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Feature gate: CONTRACTS requires STAR_3+
  if (session.user.role === "BROKER" && !canAccess(session.user.level ?? "STAR_1", "CONTRACTS")) {
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totalRevenue: true, level: true, region: { select: { tier: true } } },
    });
    const nextInfo = getNextLevelInfo(
      userData?.level ?? "STAR_1",
      userData?.totalRevenue ?? 0,
      userData?.region?.tier ?? "SMALL"
    );
    return (
      <div className="p-4 pb-24">
        <LockedFeatureCard
          feature="CONTRACTS"
          fullscreen
          percentage={nextInfo?.percentage ?? 0}
          revenueNeeded={nextInfo?.revenueNeeded ?? 0}
        />
      </div>
    );
  }

  const contracts = await prisma.contract.findMany({
    where: { brokerId: session.user.id },
    include: {
      vehicle: {
        select: {
          id: true,
          brand: true,
          model: true,
          variant: true,
          year: true,
          vin: true,
          price: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = contracts.map((c) => ({
    id: c.id,
    type: c.type,
    sellerName: c.sellerName,
    sellerPhone: c.sellerPhone,
    price: c.price,
    commission: c.commission,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    signedAt: c.signedAt?.toISOString() ?? null,
    vehicle: c.vehicle
      ? {
          id: c.vehicle.id,
          brand: c.vehicle.brand,
          model: c.vehicle.model,
          variant: c.vehicle.variant,
          year: c.vehicle.year,
        }
      : null,
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Smlouvy</h1>
        <span className="text-sm text-gray-500">{contracts.length} celkem</span>
      </div>

      <ContractsList contracts={serialized} />
    </div>
  );
}
