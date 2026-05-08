import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PartnerLeadsList } from "@/components/partner/PartnerLeadsList";

export const metadata: Metadata = {
  title: "Zajemci | Carmakler Partner",
  description: "Prehled zajemcu o vase vozidla.",
};

export const dynamic = "force-dynamic";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

export default async function PartnerLeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
  });

  if (!partner) redirect("/partner/onboarding");

  const limit = 20;
  const [leads, total] = await Promise.all([
    prisma.partnerLead.findMany({
      where: { partnerId: partner.id },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, year: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.partnerLead.count({ where: { partnerId: partner.id } }),
  ]);

  const serialized = leads.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email,
    message: l.message,
    status: l.status,
    notes: l.notes,
    createdAt: l.createdAt.toISOString(),
    vehicle: l.vehicle
      ? { id: l.vehicle.id, brand: l.vehicle.brand, model: l.vehicle.model, year: l.vehicle.year }
      : null,
  }));

  return (
    <PartnerLeadsList
      initialLeads={serialized}
      initialTotal={total}
      initialTotalPages={Math.ceil(total / limit)}
    />
  );
}
