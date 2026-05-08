import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PartnerPartsList } from "@/components/partner/PartnerPartsList";

export const metadata: Metadata = {
  title: "Moje dily | Carmakler Partner",
  description: "Sprava vasich dilu v systemu Carmakler.",
};

export const dynamic = "force-dynamic";

export default async function PartnerPartsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PARTNER_VRAKOVISTE") {
    redirect("/login");
  }

  const limit = 20;
  const [parts, total] = await Promise.all([
    prisma.part.findMany({
      where: { supplierId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.part.count({ where: { supplierId: session.user.id } }),
  ]);

  const serialized = parts.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    brand: p.compatibleBrands ? (JSON.parse(p.compatibleBrands)[0] || "") : "",
    model: p.compatibleModels ? (JSON.parse(p.compatibleModels)[0] || "") : "",
    condition: p.condition,
    price: p.price,
    quantity: p.stock,
    status: p.status,
    images: "",
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <PartnerPartsList
      initialParts={serialized}
      initialTotal={total}
      initialTotalPages={Math.ceil(total / limit)}
    />
  );
}
