import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PartDetailContent } from "@/components/partner/PartDetailContent";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const part = await prisma.part.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!part) return { title: "Díl nenalezen | Carmakler Partner" };
  return {
    title: `${part.name} | Carmakler Partner`,
    description: `Detail dílu ${part.name} v systému Carmakler.`,
  };
}

export default async function PartnerPartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PARTNER_VRAKOVISTE") {
    redirect("/login");
  }

  const { id } = await params;

  const part = await prisma.part.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
    },
  });

  if (!part || part.supplierId !== session.user.id) {
    notFound();
  }

  const serialized = {
    id: part.id,
    name: part.name,
    category: part.category,
    condition: part.condition,
    price: part.price,
    vatIncluded: part.vatIncluded,
    stock: part.stock,
    status: part.status,
    description: part.description,
    oemNumber: part.oemNumber,
    manufacturer: part.manufacturer,
    warranty: part.warranty,
    compatibleBrands: part.compatibleBrands,
    compatibleModels: part.compatibleModels,
    images: part.images.map((img) => ({
      id: img.id,
      url: img.url,
      order: img.order,
    })),
  };

  return <PartDetailContent initialPart={serialized} />;
}
