import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
        level: true,
        bio: true,
        slug: true,
        bankAccount: true,
        ico: true,
        specializations: true,
        cities: true,
        totalSales: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Uživatel nenalezen" }, { status: 404 });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { brokerId: userId },
      select: {
        id: true,
        vin: true,
        brand: true,
        model: true,
        year: true,
        mileage: true,
        price: true,
        status: true,
        city: true,
        createdAt: true,
      },
    });

    const contacts = await prisma.sellerContact.findMany({
      where: { brokerId: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        note: true,
        totalVehicles: true,
        totalSold: true,
        createdAt: true,
      },
    });

    const commissions = await prisma.commission.findMany({
      where: { brokerId: userId },
      select: {
        id: true,
        salePrice: true,
        commission: true,
        rate: true,
        status: true,
        brokerShare: true,
        createdAt: true,
      },
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: user,
      vehicles,
      contacts,
      commissions,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="carmakler-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("GET /api/settings/export error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
