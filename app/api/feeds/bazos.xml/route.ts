import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBazosFeed, ExportableListing } from "@/lib/listing-export";

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      include: {
        images: { orderBy: { order: "asc" } },
      },
    });

    const exportable: ExportableListing[] = listings.map((l) => ({
      id: l.id,
      slug: l.slug,
      vin: l.vin,
      brand: l.brand,
      model: l.model,
      variant: l.variant,
      year: l.year,
      mileage: l.mileage,
      fuelType: l.fuelType,
      transmission: l.transmission,
      enginePower: l.enginePower,
      engineCapacity: l.engineCapacity,
      bodyType: l.bodyType,
      color: l.color,
      doorsCount: l.doorsCount,
      seatsCount: l.seatsCount,
      condition: l.condition,
      price: l.price,
      priceNegotiable: l.priceNegotiable,
      vatStatus: l.vatStatus,
      contactName: l.contactName,
      contactPhone: l.contactPhone,
      contactEmail: l.contactEmail,
      city: l.city,
      district: l.district,
      description: l.description,
      equipment: l.equipment,
      images: l.images.map((img) => ({
        url: img.url,
        order: img.order,
        isPrimary: img.isPrimary,
      })),
    }));

    const xml = generateBazosFeed(exportable);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("GET /api/feeds/bazos.xml error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
