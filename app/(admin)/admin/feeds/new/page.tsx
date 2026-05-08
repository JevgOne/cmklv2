import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminNewFeedForm } from "@/components/admin/AdminNewFeedForm";

export const metadata: Metadata = {
  title: "Novy feed | Carmakler Admin",
  description: "Vytvoreni nove feed konfigurace.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export default async function NewFeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const suppliers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      companyName: true,
    },
    orderBy: [
      { companyName: "asc" },
      { lastName: "asc" },
    ],
    take: 100,
  });

  return <AdminNewFeedForm initialSuppliers={suppliers} />;
}
