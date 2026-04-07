import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ManagerBrokerDetailContent } from "@/components/admin/ManagerBrokerDetailContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Admin pages call Prisma at top of server component — force dynamic
// rendering aby Next.js neskoušel prerender v build time bez DB.
export const dynamic = "force-dynamic";

export default async function ManagerBrokerDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "MANAGER") {
    redirect("/");
  }

  const { id } = await params;
  const managerId = session.user.id;

  const broker = await prisma.user.findFirst({
    where: { id, managerId, role: "BROKER" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      status: true,
      bio: true,
      specializations: true,
      cities: true,
      ico: true,
      bankAccount: true,
      slug: true,
      createdAt: true,
      _count: {
        select: {
          vehicles: true,
          commissions: true,
        },
      },
    },
  });

  if (!broker) {
    notFound();
  }

  // Vozidla maklere
  const vehicles = await prisma.vehicle.findMany({
    where: { brokerId: id },
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      price: true,
      status: true,
      mileage: true,
      createdAt: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Provize maklere
  const commissions = await prisma.commission.findMany({
    where: { brokerId: id },
    select: {
      id: true,
      salePrice: true,
      commission: true,
      rate: true,
      status: true,
      soldAt: true,
      vehicle: {
        select: { brand: true, model: true },
      },
    },
    orderBy: { soldAt: "desc" },
    take: 20,
  });

  const brokerData = {
    id: broker.id,
    firstName: broker.firstName,
    lastName: broker.lastName,
    email: broker.email,
    phone: broker.phone || "",
    avatar: broker.avatar,
    status: broker.status,
    bio: broker.bio || "",
    specializations: broker.specializations
      ? JSON.parse(broker.specializations)
      : [],
    cities: broker.cities ? JSON.parse(broker.cities) : [],
    ico: broker.ico || "",
    bankAccount: broker.bankAccount || "",
    slug: broker.slug || "",
    createdAt: broker.createdAt.toISOString(),
    totalVehicles: broker._count.vehicles,
    totalCommissions: broker._count.commissions,
  };

  const vehiclesData = vehicles.map((v) => ({
    id: v.id,
    brand: v.brand,
    model: v.model,
    year: v.year,
    price: v.price,
    status: v.status,
    mileage: v.mileage,
    image: v.images[0]?.url || null,
    createdAt: v.createdAt.toISOString(),
  }));

  const commissionsData = commissions.map((c) => ({
    id: c.id,
    vehicle: `${c.vehicle.brand} ${c.vehicle.model}`,
    salePrice: c.salePrice,
    commission: c.commission,
    rate: c.rate,
    status: c.status,
    soldAt: c.soldAt.toISOString(),
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Manazer</span>
          <span>/</span>
          <a href="/admin/manager/brokers" className="hover:text-gray-700">
            Moji makleri
          </a>
          <span>/</span>
          <span className="text-gray-900">
            {broker.firstName} {broker.lastName}
          </span>
        </div>
      </div>

      <ManagerBrokerDetailContent
        broker={brokerData}
        vehicles={vehiclesData}
        commissions={commissionsData}
      />
    </div>
  );
}
