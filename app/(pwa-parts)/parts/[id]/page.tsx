import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PartDetailClient } from "@/components/pwa-parts/parts/PartDetailClient";

export const metadata: Metadata = {
  title: "Detail dílu | Carmakler",
  description: "Detail dílu dodavatele.",
};

export const dynamic = "force-dynamic";

const SUPPLIER_ROLES = [
  "PARTS_SUPPLIER",
  "WHOLESALE_SUPPLIER",
  "PARTNER_VRAKOVISTE",
  "ADMIN",
  "BACKOFFICE",
];

export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !SUPPLIER_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const part = await prisma.part.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      images: { orderBy: { order: "asc" } },
      supplier: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
        },
      },
    },
  });

  if (!part) {
    notFound();
  }

  const serialized = JSON.parse(JSON.stringify(part));

  return <PartDetailClient initialData={serialized} />;
}
