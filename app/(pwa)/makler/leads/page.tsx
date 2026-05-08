import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BrokerLeadsClient } from "@/components/pwa/leads/BrokerLeadsClient";

export const metadata: Metadata = {
  title: "Leady | Carmakler",
  description: "Přehled přiřazených leadů makléře.",
};

export const dynamic = "force-dynamic";

const BROKER_ROLES = ["BROKER", "ADMIN", "BACKOFFICE"];

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !BROKER_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const leads = await prisma.lead.findMany({
    where: {
      assignedToId: session.user.id,
      status: "NEW",
    },
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true, slug: true },
      },
      assignedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      region: { select: { id: true, name: true } },
      vehicle: { select: { id: true, brand: true, model: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const serialized = JSON.parse(JSON.stringify(leads));

  return <BrokerLeadsClient initialLeads={serialized} />;
}
