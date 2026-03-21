import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VehiclesList } from "@/components/pwa/vehicles/VehiclesList";

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { brokerId: session.user.id },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const serialized = vehicles.map((v) => ({
    id: v.id,
    brand: v.brand,
    model: v.model,
    variant: v.variant,
    year: v.year,
    mileage: v.mileage,
    price: v.price,
    status: v.status,
    fuelType: v.fuelType,
    transmission: v.transmission,
    viewCount: v.viewCount,
    images: v.images.map((img) => ({
      url: img.url,
      isPrimary: img.isPrimary,
    })),
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Moje vozy</h1>
        <span className="text-sm text-gray-500">{vehicles.length} celkem</span>
      </div>

      <VehiclesList vehicles={serialized} />
    </div>
  );
}
