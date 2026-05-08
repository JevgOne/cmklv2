import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminFeedsContent } from "@/components/admin/AdminFeedsContent";

export const metadata: Metadata = {
  title: "Feed importy | Carmakler Admin",
  description: "Sprava feed importu dilu.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export default async function AdminFeedsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const feeds = await prisma.partsFeedConfig.findMany({
    include: {
      supplier: {
        select: { id: true, firstName: true, lastName: true, companyName: true },
      },
      _count: { select: { parts: true, importLogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = JSON.parse(JSON.stringify(feeds));

  return <AdminFeedsContent initialFeeds={serialized} />;
}
