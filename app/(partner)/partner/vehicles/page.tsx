import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PartnerVehiclesList } from "@/components/partner/PartnerVehiclesList";

export const metadata: Metadata = {
  title: "Moje vozidla | Carmakler Partner",
  description: "Sprava vasich vozidel v systemu Carmakler.",
};

export const dynamic = "force-dynamic";

export default async function PartnerVehiclesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PARTNER_BAZAR") {
    redirect("/login");
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where: { brokerId: session.user.id },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { inquiries: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.vehicle.count({ where: { brokerId: session.user.id } }),
  ]);

  const serialized = vehicles.map((v) => ({
    id: v.id,
    brand: v.brand,
    model: v.model,
    year: v.year,
    mileage: v.mileage,
    price: v.price,
    status: v.status,
    viewCount: v.viewCount,
    images: v.images.map((img) => ({ url: img.url })),
    _count: v._count,
  }));

  return (
    <PartnerVehiclesList
      initialVehicles={serialized}
      initialTotal={total}
      initialTotalPages={Math.ceil(total / 20)}
    />
  );
}
