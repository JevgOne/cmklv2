import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AdminApplicationDetailContent } from "@/components/admin/AdminApplicationDetailContent";

export const metadata: Metadata = {
  title: "Detail zadosti | Carmakler Admin",
  description: "Detail marketplace zadosti.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE"];

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const application = await prisma.marketplaceApplication.findUnique({
    where: { id },
    include: {
      reviewedBy: { select: { firstName: true, lastName: true } },
      convertedUser: {
        select: { id: true, firstName: true, lastName: true, role: true, email: true },
      },
    },
  });

  if (!application) {
    notFound();
  }

  const serialized = JSON.parse(JSON.stringify(application));

  return <AdminApplicationDetailContent initialData={serialized} />;
}
