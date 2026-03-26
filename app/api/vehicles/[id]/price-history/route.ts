import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, price: true, createdAt: true, publishedAt: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
    }

    // Get price change logs
    const priceChanges = await prisma.vehicleChangeLog.findMany({
      where: {
        vehicleId: id,
        field: "price",
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
      },
    });

    // Build price history timeline
    const history: {
      date: string;
      price: number;
      previousPrice: number | null;
      label: string;
    }[] = [];

    // Add initial publication price
    const firstPriceChange = priceChanges[0];
    const initialPrice = firstPriceChange?.oldValue
      ? parseInt(firstPriceChange.oldValue)
      : vehicle.price;

    history.push({
      date: (vehicle.publishedAt || vehicle.createdAt).toISOString(),
      price: initialPrice,
      previousPrice: null,
      label: "Publikováno",
    });

    // Add each price change
    for (const change of priceChanges) {
      const newPrice = change.newValue ? parseInt(change.newValue) : null;
      const oldPrice = change.oldValue ? parseInt(change.oldValue) : null;
      if (newPrice === null) continue;

      history.push({
        date: change.createdAt.toISOString(),
        price: newPrice,
        previousPrice: oldPrice,
        label:
          oldPrice && newPrice < oldPrice
            ? "Snížení ceny"
            : oldPrice && newPrice > oldPrice
              ? "Zvýšení ceny"
              : "Změna ceny",
      });
    }

    return NextResponse.json({
      vehicleId: id,
      currentPrice: vehicle.price,
      history,
      hasChanges: priceChanges.length > 0,
    });
  } catch (error) {
    console.error("Price history error:", error);
    return NextResponse.json(
      { error: "Chyba při načítání cenové historie" },
      { status: 500 },
    );
  }
}
