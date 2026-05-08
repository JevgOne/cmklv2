import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { BrokerContactDetailClient } from "@/components/pwa/contacts/BrokerContactDetailClient";

export const metadata: Metadata = {
  title: "Detail kontaktu | Carmakler",
  description: "Detail kontaktu prodejce.",
};

export const dynamic = "force-dynamic";

const BROKER_ROLES = ["BROKER", "ADMIN", "BACKOFFICE"];

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !BROKER_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const contact = await prisma.sellerContact.findUnique({
    where: { id },
    include: {
      vehicles: {
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          price: true,
          status: true,
          slug: true,
          city: true,
        },
        orderBy: { createdAt: "desc" },
      },
      communications: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: { select: { vehicles: true, communications: true } },
    },
  });

  if (!contact) {
    notFound();
  }

  // Ownership check: broker can only see own contacts
  const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);
  if (contact.brokerId !== session.user.id && !isAdmin) {
    redirect("/makler/contacts");
  }

  const serialized = JSON.parse(JSON.stringify(contact));

  return <BrokerContactDetailClient initialData={serialized} />;
}
