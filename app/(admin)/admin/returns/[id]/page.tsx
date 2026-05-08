import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AdminReturnDetailContent } from "@/components/admin/AdminReturnDetailContent";

export const metadata: Metadata = {
  title: "Detail reklamace | Carmakler Admin",
  description: "Detail reklamace nebo vraceni.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export default async function AdminReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const returnRecord = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              part: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!returnRecord) {
    notFound();
  }

  const serialized = JSON.parse(JSON.stringify(returnRecord));

  return <AdminReturnDetailContent initialData={serialized} userRole={session.user.role} />;
}
