import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { VehicleDetailContent } from "@/components/partner/VehicleDetailContent";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { brand: true, model: true, year: true },
  });
  if (!vehicle) return { title: "Vozidlo nenalezeno | Carmakler Partner" };
  return {
    title: `${vehicle.brand} ${vehicle.model} (${vehicle.year}) | Carmakler Partner`,
    description: `Detail vozidla ${vehicle.brand} ${vehicle.model} v systemu Carmakler.`,
  };
}

export default async function PartnerVehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PARTNER_BAZAR") {
    redirect("/login");
  }

  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      _count: { select: { inquiries: true } },
    },
  });

  if (!vehicle || vehicle.brokerId !== session.user.id) {
    notFound();
  }

  const serialized = {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    mileage: vehicle.mileage,
    price: vehicle.price,
    fuel: vehicle.fuelType,
    transmission: vehicle.transmission,
    power: vehicle.enginePower,
    vin: vehicle.vin,
    city: vehicle.city,
    description: vehicle.description,
    status: vehicle.status,
    viewCount: vehicle.viewCount,
    images: vehicle.images.map((img) => ({
      id: img.id,
      url: img.url,
      order: img.order,
      isPrimary: img.isPrimary,
    })),
    _count: vehicle._count,
  };

  return <VehicleDetailContent initialVehicle={serialized} />;
}
