import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignatureFlow } from "@/components/pwa/contracts/SignatureFlow";

export default async function SignContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const contract = await prisma.contract.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      status: true,
      brokerId: true,
      sellerName: true,
      price: true,
      content: true,
      vehicle: {
        select: {
          brand: true,
          model: true,
          year: true,
          vin: true,
        },
      },
      broker: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!contract) {
    notFound();
  }

  if (contract.brokerId !== session.user.id) {
    redirect("/makler/contracts");
  }

  if (contract.status !== "DRAFT") {
    redirect(`/makler/contracts/${id}`);
  }

  return (
    <SignatureFlow
      contractId={contract.id}
      sellerName={contract.sellerName}
      brokerName={`${contract.broker.firstName} ${contract.broker.lastName}`}
      vehicleName={
        contract.vehicle
          ? `${contract.vehicle.brand} ${contract.vehicle.model} (${contract.vehicle.year})`
          : undefined
      }
    />
  );
}
