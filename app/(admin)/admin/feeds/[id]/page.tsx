import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AdminFeedDetailContent } from "@/components/admin/AdminFeedDetailContent";

export const metadata: Metadata = {
  title: "Detail feedu | Carmakler Admin",
  description: "Detail feed konfigurace.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export default async function FeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const feed = await prisma.partsFeedConfig.findUnique({
    where: { id },
    include: {
      supplier: {
        select: { id: true, firstName: true, lastName: true, companyName: true },
      },
      _count: { select: { parts: true, importLogs: true } },
      importLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!feed) {
    notFound();
  }

  const serialized = JSON.parse(JSON.stringify(feed));

  return <AdminFeedDetailContent initialData={serialized} userRole={session.user.role} />;
}
