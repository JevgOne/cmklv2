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

    if (!["ADMIN", "BACKOFFICE", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const vehicles = await prisma.vehicle.findMany({
      include: {
        broker: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = vehicles.map((v) => ({
      id: v.id,
      name: `${v.brand} ${v.model}`,
      vin: v.vin,
      brokerName: v.broker
        ? `${v.broker.firstName} ${v.broker.lastName}`
        : v.contactName || "Soukromý",
      brokerInitials: v.broker
        ? `${v.broker.firstName[0] || ""}${v.broker.lastName[0] || ""}`
        : (v.contactName || "S")[0] || "S",
      price: `${v.price.toLocaleString("cs-CZ")} Kč`,
      status: v.status.toLowerCase() as
        | "active"
        | "pending"
        | "rejected"
        | "sold"
        | "draft",
      trustScore: v.trustScore,
      date: v.createdAt.toLocaleDateString("cs-CZ"),
      imageUrl: v.images[0]?.url || null,
    }));

    return NextResponse.json({ vehicles: result });
  } catch (error) {
    console.error("Admin vehicles error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
