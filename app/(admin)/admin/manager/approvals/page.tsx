import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QualityChecklist } from "@/components/admin/QualityChecklist";
import { ManagerApprovalActions } from "@/components/admin/ManagerApprovalActions";

export default async function ManagerApprovalsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "MANAGER") {
    redirect("/admin/dashboard");
  }

  // Najdi makléře pod tímto manažerem
  const teamBrokers = await prisma.user.findMany({
    where: { managerId: session.user.id, role: "BROKER" },
    select: { id: true },
  });

  const brokerIds = teamBrokers.map((b) => b.id);

  // Načti PENDING + DRAFT_QUICK vozidla od makléřů tohoto manažera
  const pendingVehicles = await prisma.vehicle.findMany({
    where: {
      status: { in: ["PENDING", "DRAFT_QUICK"] },
      brokerId: { in: brokerIds },
    },
    include: {
      broker: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      images: {
        orderBy: { order: "asc" },
      },
      contracts: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Manager</span>
          <span>/</span>
          <span className="text-gray-900">Schvalovani</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-extrabold text-gray-900">
            Schvalovaci fronta
          </h1>
          <Badge variant="rejected">{pendingVehicles.length}</Badge>
        </div>
      </div>

      {/* Empty state */}
      {pendingVehicles.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Zadna vozidla ke schvaleni
          </h2>
          <p className="text-sm text-gray-500">
            Vsechna vozidla vasich makleru byla zpracovana.
          </p>
        </Card>
      )}

      {/* Vehicle cards */}
      <div className="space-y-4">
        {pendingVehicles.map((vehicle) => {
          const brokerName = vehicle.broker
            ? `${vehicle.broker.firstName} ${vehicle.broker.lastName}`
            : "Neznamy";

          const primaryImage = vehicle.images.find((img) => img.isPrimary) ?? vehicle.images[0];

          return (
            <Card key={vehicle.id} className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Vehicle image */}
                <div className="w-full lg:w-[200px] h-[150px] bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {primaryImage?.url ? (
                    <img
                      src={primaryImage.url}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl text-gray-300">🚗</span>
                    </div>
                  )}
                </div>

                {/* Vehicle info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {vehicle.brand} {vehicle.model}
                        {vehicle.variant ? ` ${vehicle.variant}` : ""}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {vehicle.year} · {vehicle.mileage.toLocaleString("cs-CZ")} km ·{" "}
                        {vehicle.fuelType} · {vehicle.transmission}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-extrabold text-gray-900">
                        {vehicle.price.toLocaleString("cs-CZ")} Kc
                      </div>
                      {vehicle.status === "DRAFT_QUICK" ? (
                        <div className="space-y-1">
                          <Badge variant="default">Rychly draft</Badge>
                          {vehicle.quickDraftDeadline && (
                            <p className="text-xs text-orange-600">
                              {new Date(vehicle.quickDraftDeadline) > new Date()
                                ? `Zbývá ${Math.ceil((new Date(vehicle.quickDraftDeadline).getTime() - Date.now()) / (1000 * 60 * 60))}h`
                                : "Deadline vypršel"}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="pending">Ceka na schvaleni</Badge>
                      )}
                    </div>
                  </div>

                  {/* Broker info */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        {vehicle.broker
                          ? `${vehicle.broker.firstName[0]}${vehicle.broker.lastName[0]}`
                          : "?"}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">{brokerName}</span>
                    <span className="text-xs text-gray-400">
                      · zadano{" "}
                      {vehicle.createdAt.toLocaleDateString("cs-CZ", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Quality checklist */}
                    <QualityChecklist vehicle={vehicle} />

                    {/* Description preview */}
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                        Popis
                      </span>
                      <p className="text-sm text-gray-600 line-clamp-4">
                        {vehicle.description || "Bez popisu"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <ManagerApprovalActions vehicleId={vehicle.id} />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
