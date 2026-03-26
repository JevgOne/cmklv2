import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface TimelineEvent {
  type: "created" | "inspection" | "published" | "interest" | "price_change" | "update";
  date: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        brand: true,
        model: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        viewCount: true,
        overallRating: true,
        inspectionData: true,
        broker: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
    }

    const events: TimelineEvent[] = [];

    // 1. Created by broker
    events.push({
      type: "created",
      date: vehicle.createdAt.toISOString(),
      title: "Zadáno makléřem",
      description: vehicle.broker
        ? `Makléř ${vehicle.broker.firstName} ${vehicle.broker.lastName}`
        : null,
      icon: "circle",
      color: "green",
    });

    // 2. Inspection (if inspection data exists)
    if (vehicle.inspectionData || vehicle.overallRating) {
      let inspectionDesc = "";
      if (vehicle.overallRating) {
        inspectionDesc = `Celkové hodnocení: ${vehicle.overallRating}/5`;
      }
      let inspData: { testDrive?: boolean } | null = null;
      if (vehicle.inspectionData) {
        try {
          inspData = JSON.parse(vehicle.inspectionData);
        } catch { /* ignore */ }
      }
      if (inspData?.testDrive !== undefined) {
        inspectionDesc += inspectionDesc
          ? `, Testovací jízda: ${inspData.testDrive ? "Ano" : "Ne"}`
          : `Testovací jízda: ${inspData.testDrive ? "Ano" : "Ne"}`;
      }

      events.push({
        type: "inspection",
        date: vehicle.createdAt.toISOString(),
        title: "Prohlídka vozidla",
        description: inspectionDesc || null,
        icon: "search",
        color: "blue",
      });
    }

    // 3. Published
    if (vehicle.publishedAt) {
      events.push({
        type: "published",
        date: vehicle.publishedAt.toISOString(),
        title: "Schváleno a publikováno",
        description: null,
        icon: "check",
        color: "green",
      });
    }

    // 4. Get change log entries (price changes, updates — no internal data)
    const changeLogs = await prisma.vehicleChangeLog.findMany({
      where: {
        vehicleId: id,
        field: {
          in: ["price", "mileage", "description", "equipment", "status"],
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        field: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
      },
    });

    for (const log of changeLogs) {
      if (log.field === "price" && log.oldValue && log.newValue) {
        const oldPrice = new Intl.NumberFormat("cs-CZ").format(
          parseInt(log.oldValue),
        );
        const newPrice = new Intl.NumberFormat("cs-CZ").format(
          parseInt(log.newValue),
        );
        events.push({
          type: "price_change",
          date: log.createdAt.toISOString(),
          title: "Změna ceny",
          description: `${oldPrice} Kč -> ${newPrice} Kč`,
          icon: "price",
          color: "orange",
        });
      } else if (log.field === "status") {
        // Only show activation, not internal status changes
        if (log.newValue === "ACTIVE" && log.oldValue !== "ACTIVE") {
          events.push({
            type: "update",
            date: log.createdAt.toISOString(),
            title: "Aktivováno",
            description: null,
            icon: "refresh",
            color: "blue",
          });
        }
      } else if (log.field !== "status") {
        events.push({
          type: "update",
          date: log.createdAt.toISOString(),
          title: "Aktualizace inzerátu",
          description: null,
          icon: "refresh",
          color: "gray",
        });
      }
    }

    // 5. Interest stats (aggregated, not per-view)
    const inquiryCount = await prisma.vehicleInquiry.count({
      where: { vehicleId: id },
    });

    if (vehicle.viewCount > 0 || inquiryCount > 0) {
      events.push({
        type: "interest",
        date: new Date().toISOString(),
        title: "Zájem",
        description: `${vehicle.viewCount} zobrazení, ${inquiryCount} dotazů`,
        icon: "eye",
        color: "purple",
      });
    }

    // Sort by date
    events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return NextResponse.json({ timeline: events });
  } catch (error) {
    console.error("Timeline error:", error);
    return NextResponse.json(
      { error: "Chyba při načítání timeline" },
      { status: 500 },
    );
  }
}
