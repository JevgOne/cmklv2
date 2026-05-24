import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SeoPageEditForm } from "@/components/admin/seo/SeoPageEditForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SeoMetadataDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;
  const page = await prisma.seoPageMeta.findUnique({ where: { id } });

  if (!page) {
    redirect("/admin/seo/metadata");
  }

  return (
    <SeoPageEditForm
      page={{
        ...page,
        lastAuditedAt: page.lastAuditedAt?.toISOString() || null,
        updatedAt: page.updatedAt.toISOString(),
      }}
    />
  );
}
