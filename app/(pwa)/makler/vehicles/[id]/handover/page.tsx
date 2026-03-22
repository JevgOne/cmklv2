import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HandoverChecklist } from "@/components/pwa/vehicles/HandoverChecklist";

export default async function HandoverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: {
      id: true,
      brand: true,
      model: true,
      variant: true,
      status: true,
      brokerId: true,
      price: true,
      reservedPrice: true,
      reservedFor: true,
    },
  });

  if (!vehicle || vehicle.brokerId !== session.user.id) {
    notFound();
  }

  if (vehicle.status !== "RESERVED") {
    redirect(`/makler/vehicles/${id}`);
  }

  const vehicleName = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}`;

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/makler/vehicles/${id}`}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            Predani vozidla
          </h1>
          <p className="text-sm text-gray-500">{vehicleName}</p>
          {vehicle.reservedFor && (
            <p className="text-sm text-orange-500 font-medium">
              Kupujici: {vehicle.reservedFor}
            </p>
          )}
        </div>
      </div>

      <HandoverChecklist
        vehicleId={vehicle.id}
        vehicleName={vehicleName}
        reservedPrice={vehicle.reservedPrice}
        originalPrice={vehicle.price}
      />
    </div>
  );
}
