import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { VehicleEditForm } from "@/components/admin/VehicleEditForm";

export default async function AdminVehicleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BACKOFFICE", "MANAGER"].includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: {
      id: true,
      brand: true,
      model: true,
      price: true,
      description: true,
      equipment: true,
      condition: true,
    },
  });

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-1">
          <Link href="/admin/vehicles" className="hover:text-gray-700">
            Admin / Vozidla
          </Link>{" "}
          /{" "}
          <Link href={`/admin/vehicles/${vehicle.id}`} className="hover:text-gray-700">
            {vehicle.brand} {vehicle.model}
          </Link>{" "}
          / Upravit
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Upravit: {vehicle.brand} {vehicle.model}
          </h1>
          <Link href={`/admin/vehicles/${vehicle.id}`}>
            <Button variant="outline" size="sm">
              ← Zpět na detail
            </Button>
          </Link>
        </div>
      </div>

      <VehicleEditForm
        vehicleId={vehicle.id}
        initialData={{
          price: vehicle.price,
          description: vehicle.description || "",
          equipment: vehicle.equipment || "",
          condition: vehicle.condition,
        }}
        apiUrl={`/api/admin/vehicles/${vehicle.id}`}
        redirectUrl={`/admin/vehicles/${vehicle.id}`}
      />
    </div>
  );
}
