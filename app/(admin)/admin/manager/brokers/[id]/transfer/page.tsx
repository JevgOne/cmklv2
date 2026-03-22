import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransferVehiclesContent } from "@/components/admin/TransferVehiclesContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TransferVehiclesPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "MANAGER") {
    redirect("/");
  }

  const { id: sourceBrokerId } = await params;
  const managerId = session.user.id;

  // Zdrojový makléř
  const sourceBroker = await prisma.user.findFirst({
    where: { id: sourceBrokerId, managerId, role: "BROKER" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!sourceBroker) {
    notFound();
  }

  // Vozidla zdrojového makléře
  const vehicles = await prisma.vehicle.findMany({
    where: {
      brokerId: sourceBrokerId,
      status: { in: ["DRAFT", "PENDING", "ACTIVE", "RESERVED"] },
    },
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      price: true,
      status: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  // Ostatní makléři pod stejným manažerem
  const targetBrokers = await prisma.user.findMany({
    where: {
      managerId,
      role: "BROKER",
      status: "ACTIVE",
      id: { not: sourceBrokerId },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { lastName: "asc" },
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Manažer</span>
          <span>/</span>
          <a href="/admin/manager/brokers" className="hover:text-gray-700">
            Moji makléři
          </a>
          <span>/</span>
          <a
            href={`/admin/manager/brokers/${sourceBrokerId}`}
            className="hover:text-gray-700"
          >
            {sourceBroker.firstName} {sourceBroker.lastName}
          </a>
          <span>/</span>
          <span className="text-gray-900">Přenos vozů</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Přenos vozů — {sourceBroker.firstName} {sourceBroker.lastName}
        </h1>
      </div>

      <TransferVehiclesContent
        sourceBrokerId={sourceBrokerId}
        sourceBrokerName={`${sourceBroker.firstName} ${sourceBroker.lastName}`}
        vehicles={vehicles.map((v) => ({
          id: v.id,
          brand: v.brand,
          model: v.model,
          year: v.year,
          price: v.price,
          status: v.status,
          image: v.images[0]?.url || null,
        }))}
        targetBrokers={targetBrokers.map((b) => ({
          id: b.id,
          name: `${b.firstName} ${b.lastName}`,
        }))}
      />
    </div>
  );
}
