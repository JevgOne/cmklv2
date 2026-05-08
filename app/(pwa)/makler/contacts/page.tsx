import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BrokerContactsClient } from "@/components/pwa/contacts/BrokerContactsClient";

export const metadata: Metadata = {
  title: "Kontakty | Carmakler",
  description: "CRM kontaktů prodejců.",
};

export const dynamic = "force-dynamic";

const BROKER_ROLES = ["BROKER", "ADMIN", "BACKOFFICE"];

export default async function ContactsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !BROKER_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const contacts = await prisma.sellerContact.findMany({
    where: { brokerId: session.user.id },
    include: {
      _count: { select: { vehicles: true, communications: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const serialized = JSON.parse(JSON.stringify(contacts));

  return <BrokerContactsClient initialContacts={serialized} />;
}
