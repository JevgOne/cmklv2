import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VehicleEditForm } from "@/components/admin/VehicleEditForm";

export default async function ManagerVehicleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "MANAGER") {
    redirect("/admin/dashboard");
  }

  const { id } = await params;

  // Najdi makléře pod tímto manažerem
  const teamBrokers = await prisma.user.findMany({
    where: { managerId: session.user.id, role: "BROKER" },
    select: { id: true },
  });

  const brokerIds = teamBrokers.map((b) => b.id);

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id,
      brokerId: { in: brokerIds },
    },
    include: {
      broker: {
        select: { firstName: true, lastName: true },
      },
      images: {
        orderBy: { order: "asc" },
        take: 1,
      },
    },
  });

  if (!vehicle) {
    redirect("/admin/manager/approvals");
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Manager</span>
          <span>/</span>
          <span>Vozidla</span>
          <span>/</span>
          <span className="text-gray-900">Editace</span>
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">
          {vehicle.brand} {vehicle.model}
          {vehicle.variant ? ` ${vehicle.variant}` : ""}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Makler: {vehicle.broker?.firstName} {vehicle.broker?.lastName} · VIN:{" "}
          {vehicle.vin}
        </p>
      </div>

      <VehicleEditForm
        vehicleId={vehicle.id}
        initialData={{
          price: vehicle.price,
          description: vehicle.description ?? "",
          equipment: vehicle.equipment ?? "",
          condition: vehicle.condition,
        }}
      />
    </div>
  );
}
