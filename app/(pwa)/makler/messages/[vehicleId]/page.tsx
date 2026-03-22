import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InquiryActions } from "@/components/pwa/messages/InquiryActions";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function VehicleInquiriesPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      inquiries: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vehicle || vehicle.brokerId !== session.user.id) {
    notFound();
  }

  const title = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}`;

  const inquiries = vehicle.inquiries.map((i) => ({
    id: i.id,
    buyerName: i.buyerName,
    buyerPhone: i.buyerPhone,
    buyerEmail: i.buyerEmail,
    message: i.message,
    status: i.status,
    reply: i.reply,
    createdAt: i.createdAt.toISOString(),
    offeredPrice: i.offeredPrice,
  }));

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/makler/messages"
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            Dotazy
          </h1>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <EmptyState
          icon="💬"
          title="Zatim zadne dotazy"
          description="K tomuto vozidlu zatim nikdo neprojevil zajem."
        />
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <InquiryActions
              key={inquiry.id}
              inquiry={inquiry}
              vehicleId={vehicleId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
