import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PartEditClient } from "@/components/pwa-parts/parts/PartEditClient";

export const metadata: Metadata = {
  title: "Upravit díl | Carmakler",
  description: "Editace dílu dodavatele.",
};

export const dynamic = "force-dynamic";

const SUPPLIER_ROLES = [
  "PARTS_SUPPLIER",
  "WHOLESALE_SUPPLIER",
  "PARTNER_VRAKOVISTE",
  "ADMIN",
  "BACKOFFICE",
];

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !SUPPLIER_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const part = await prisma.part.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      condition: true,
      description: true,
      oemNumber: true,
      manufacturer: true,
      warranty: true,
      price: true,
      vatIncluded: true,
      stock: true,
      supplierId: true,
      compatibleBrands: true,
      compatibleModels: true,
      compatibleYearFrom: true,
      compatibleYearTo: true,
      images: {
        select: { url: true, order: true, isPrimary: true },
        orderBy: { order: "asc" as const },
      },
    },
  });

  if (!part) {
    notFound();
  }

  // Ownership check: only owner or admin can edit
  const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);
  if (part.supplierId !== session.user.id && !isAdmin) {
    redirect("/parts/my");
  }

  const { supplierId: _, ...partData } = part;

  return <PartEditClient initialPart={partData} />;
}
