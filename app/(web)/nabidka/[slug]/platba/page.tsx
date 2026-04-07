import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PaymentPageContent } from "./PaymentPageContent";

export const metadata: Metadata = {
  title: "Platba za vozidlo — CarMakléř",
  description: "Bezpečná platba za vozidlo přes CarMakléř",
  // Transactional/private page — not indexable. Žádný canonical, místo toho
  // robots noindex.
  robots: { index: false, follow: false },
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Najít vozidlo přes slug (Vehicle nebo Listing)
  const vehicle = await prisma.vehicle.findFirst({
    where: { slug },
    select: {
      id: true,
      brand: true,
      model: true,
      variant: true,
      year: true,
      price: true,
      reservedPrice: true,
      status: true,
      slug: true,
      city: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
      broker: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  if (!vehicle) {
    notFound();
  }

  if (vehicle.status !== "RESERVED") {
    notFound();
  }

  const amount = vehicle.reservedPrice || vehicle.price;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Platba za vozidlo
        </h1>

        <PaymentPageContent
          vehicle={{
            id: vehicle.id,
            name: `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`,
            year: vehicle.year,
            amount,
            slug: vehicle.slug || slug,
            city: vehicle.city,
            imageUrl: vehicle.images[0]?.url || null,
            brokerName: vehicle.broker
              ? `${vehicle.broker.firstName} ${vehicle.broker.lastName}`
              : null,
          }}
        />
      </div>
    </div>
  );
}
