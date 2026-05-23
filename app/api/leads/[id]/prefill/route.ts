import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const role = session.user.role;
    if (!["ADMIN", "BACKOFFICE", "REGIONAL_DIRECTOR", "MANAGER", "BROKER"].includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        brand: true,
        model: true,
        year: true,
        mileage: true,
        expectedPrice: true,
        description: true,
        city: true,
        regionId: true,
        vehicleId: true,
        assignedToId: true,
        status: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    // Broker can only prefill own assigned leads
    if (role === "BROKER" && lead.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění k tomuto leadu" }, { status: 403 });
    }

    return NextResponse.json({
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        brand: lead.brand,
        model: lead.model,
        year: lead.year,
        mileage: lead.mileage,
        expectedPrice: lead.expectedPrice,
        description: lead.description,
        city: lead.city,
        regionId: lead.regionId,
        vehicleId: lead.vehicleId,
        status: lead.status,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Chyba při načítání leadu" },
      { status: 500 }
    );
  }
}
