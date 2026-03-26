import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContractPreview } from "@/components/pwa/contracts/ContractPreview";
import { ContractPdfButton } from "@/components/pwa/contracts/ContractPdfButton";
import { ContractSendButton } from "@/components/pwa/contracts/ContractSendButton";
import { EmailButton } from "@/components/pwa/emails/EmailButton";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import Link from "next/link";

export default async function ContractDetailPage({
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
    include: {
      vehicle: {
        select: {
          brand: true,
          model: true,
          variant: true,
          year: true,
          mileage: true,
          vin: true,
          price: true,
          condition: true,
          fuelType: true,
          transmission: true,
        },
      },
      broker: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
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

  const statusMap: Record<string, { variant: "draft" | "active" | "pending" | "sold"; label: string }> = {
    DRAFT: { variant: "draft", label: "Koncept" },
    SIGNED: { variant: "active", label: "Podepsaná" },
    SENT: { variant: "sold", label: "Odeslaná" },
    ARCHIVED: { variant: "pending", label: "Archivovaná" },
  };

  const statusInfo = statusMap[contract.status] || statusMap.DRAFT;

  const serializedContract = {
    id: contract.id,
    type: contract.type,
    status: contract.status,
    content: contract.content,
    sellerName: contract.sellerName,
    sellerPhone: contract.sellerPhone,
    sellerEmail: contract.sellerEmail,
    price: contract.price,
    commission: contract.commission,
    signedAt: contract.signedAt?.toISOString() || null,
    signedLocation: contract.signedLocation,
    sellerSignature: contract.sellerSignature,
    brokerSignature: contract.brokerSignature,
    pdfUrl: contract.pdfUrl,
    vehicle: contract.vehicle,
    broker: contract.broker,
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/makler/contracts"
            className="text-sm text-orange-500 font-medium"
          >
            &larr; Zpět na seznam
          </Link>
          <h1 className="text-xl font-extrabold text-gray-900 mt-1">
            {contract.type === "BROKERAGE"
              ? "Zprostředkovatelská smlouva"
              : "Předávací protokol"}
          </h1>
        </div>
        <StatusPill variant={statusInfo.variant}>{statusInfo.label}</StatusPill>
      </div>

      {/* Contract Preview */}
      <ContractPreview contract={serializedContract} />

      {/* Actions based on status */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] z-50 space-y-3">
        {contract.status === "DRAFT" && (
          <Link href={`/makler/contracts/${contract.id}/sign`} className="block">
            <Button variant="primary" className="w-full">
              Pokračovat k podpisu
            </Button>
          </Link>
        )}

        {contract.status === "SIGNED" && (
          <div className="flex gap-3">
            <ContractPdfButton
              contractId={contract.id}
              hasPdf={!!contract.pdfUrl}
              pdfUrl={contract.pdfUrl}
            />
          </div>
        )}

        {contract.status === "SIGNED" && contract.pdfUrl && contract.sellerEmail && (
          <div className="flex gap-3">
            <ContractSendButton contractId={contract.id} />
            <EmailButton
              vehicleId={contract.vehicleId ?? undefined}
              vehicleName={contract.vehicle ? `${contract.vehicle.brand} ${contract.vehicle.model}${contract.vehicle.variant ? ` ${contract.vehicle.variant}` : ""}` : undefined}
              defaultTemplate="CONTRACT_OFFER"
              defaultRecipientEmail={contract.sellerEmail || undefined}
              defaultRecipientName={contract.sellerName || undefined}
              label="Poslat emailem"
              variant="outline"
              size="sm"
            />
          </div>
        )}

        {contract.status === "SENT" && contract.pdfUrl && (
          <ContractPdfButton
            contractId={contract.id}
            hasPdf={true}
            pdfUrl={contract.pdfUrl}
          />
        )}
      </div>
    </div>
  );
}
