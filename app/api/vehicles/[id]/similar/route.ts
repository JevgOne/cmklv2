import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "6"), 6);

    // Get the source vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        brand: true,
        model: true,
        price: true,
        year: true,
        bodyType: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
    }

    const yearMin = vehicle.year - 3;
    const yearMax = vehicle.year + 3;
    const priceMin = Math.round(vehicle.price * 0.8);
    const priceMax = Math.round(vehicle.price * 1.2);

    const includeFields = {
      id: true,
      brand: true,
      model: true,
      variant: true,
      year: true,
      mileage: true,
      fuelType: true,
      transmission: true,
      enginePower: true,
      price: true,
      city: true,
      slug: true,
      trustScore: true,
      sellerType: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      broker: { select: { firstName: true, lastName: true } },
    } as const;

    // Tier 1: Same brand + model
    let results = await prisma.vehicle.findMany({
      where: {
        status: "ACTIVE",
        id: { not: vehicle.id },
        brand: vehicle.brand,
        model: vehicle.model,
        year: { gte: yearMin, lte: yearMax },
      },
      select: includeFields,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Tier 2: Same brand + similar price
    if (results.length < limit) {
      const existingIds = [vehicle.id, ...results.map((r) => r.id)];
      const tier2 = await prisma.vehicle.findMany({
        where: {
          status: "ACTIVE",
          id: { notIn: existingIds },
          brand: vehicle.brand,
          price: { gte: priceMin, lte: priceMax },
          year: { gte: yearMin, lte: yearMax },
        },
        select: includeFields,
        take: limit - results.length,
        orderBy: { createdAt: "desc" },
      });
      results = [...results, ...tier2];
    }

    // Tier 3: Same body type + similar price
    if (results.length < limit && vehicle.bodyType) {
      const existingIds = [vehicle.id, ...results.map((r) => r.id)];
      const tier3 = await prisma.vehicle.findMany({
        where: {
          status: "ACTIVE",
          id: { notIn: existingIds },
          bodyType: vehicle.bodyType,
          price: { gte: priceMin, lte: priceMax },
          year: { gte: yearMin, lte: yearMax },
        },
        select: includeFields,
        take: limit - results.length,
        orderBy: { createdAt: "desc" },
      });
      results = [...results, ...tier3];
    }

    // Tier 4: Fallback - same price range
    if (results.length < limit) {
      const existingIds = [vehicle.id, ...results.map((r) => r.id)];
      const tier4 = await prisma.vehicle.findMany({
        where: {
          status: "ACTIVE",
          id: { notIn: existingIds },
          price: { gte: priceMin, lte: priceMax },
        },
        select: includeFields,
        take: limit - results.length,
        orderBy: { createdAt: "desc" },
      });
      results = [...results, ...tier4];
    }

    const similar = results.map((v) => ({
      id: v.id,
      brand: v.brand,
      model: v.model,
      variant: v.variant,
      year: v.year,
      mileage: v.mileage,
      fuelType: v.fuelType,
      transmission: v.transmission,
      enginePower: v.enginePower,
      price: v.price,
      city: v.city,
      slug: v.slug,
      trustScore: v.trustScore,
      sellerType: v.sellerType,
      photo: v.images[0]?.url || "/images/placeholder-car.jpg",
      brokerName: v.broker
        ? `${v.broker.firstName} ${v.broker.lastName}`
        : null,
    }));

    return NextResponse.json({ similar });
  } catch (error) {
    console.error("Similar vehicles error:", error);
    return NextResponse.json(
      { error: "Chyba pri nacitani podobnych vozidel" },
      { status: 500 },
    );
  }
}
