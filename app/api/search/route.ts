import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (q.length < 2) {
      return NextResponse.json({
        vehicles: [],
        contacts: [],
        contracts: [],
      });
    }

    const userId = session.user.id;
    const role = session.user.role;

    // Broker filter — broker vidí jen své, manager vidí svých makléřů
    let brokerFilter: Record<string, unknown> = {};
    if (role === "BROKER") {
      brokerFilter = { brokerId: userId };
    } else if (role === "MANAGER") {
      brokerFilter = {
        broker: { managerId: userId },
      };
    }

    // Hledat vozidla (VIN, značka, model)
    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...brokerFilter,
        OR: [
          { vin: { contains: q } },
          { brand: { contains: q } },
          { model: { contains: q } },
        ],
      },
      select: {
        id: true,
        vin: true,
        brand: true,
        model: true,
        year: true,
        status: true,
        price: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
    });

    // Hledat kontakty (jméno, telefon)
    const contacts = await prisma.sellerContact.findMany({
      where: {
        brokerId: role === "BROKER" ? userId : undefined,
        OR: [
          { name: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        city: true,
        totalVehicles: true,
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
    });

    // Hledat smlouvy (jméno prodejce)
    const contracts = await prisma.contract.findMany({
      where: {
        ...(role === "BROKER" ? { brokerId: userId } : {}),
        OR: [
          { sellerName: { contains: q } },
        ],
      },
      select: {
        id: true,
        type: true,
        sellerName: true,
        status: true,
        createdAt: true,
        vehicle: {
          select: { brand: true, model: true },
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      vehicles: vehicles.map((v) => ({
        id: v.id,
        vin: v.vin,
        brand: v.brand,
        model: v.model,
        year: v.year,
        status: v.status,
        price: v.price,
        image: v.images[0]?.url || null,
      })),
      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        city: c.city,
        totalVehicles: c.totalVehicles,
      })),
      contracts: contracts.map((c) => ({
        id: c.id,
        type: c.type,
        sellerName: c.sellerName,
        status: c.status,
        vehicle: c.vehicle ? `${c.vehicle.brand} ${c.vehicle.model}` : null,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
