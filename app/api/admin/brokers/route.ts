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

    if (session.user.role !== "ADMIN" && session.user.role !== "BACKOFFICE") {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const brokers = await prisma.user.findMany({
      where: { role: "BROKER" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        cities: true,
        createdAt: true,
        _count: {
          select: { vehicles: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = brokers.map((b) => ({
      id: b.id,
      name: `${b.firstName} ${b.lastName}`,
      email: b.email,
      phone: b.phone,
      initials: `${b.firstName[0] || ""}${b.lastName[0] || ""}`,
      region: b.cities ? (JSON.parse(b.cities) as string[])[0] || "—" : "—",
      vehicles: b._count.vehicles,
      status: b.status.toLowerCase() as "active" | "pending" | "rejected",
      createdAt: b.createdAt.toISOString(),
    }));

    return NextResponse.json({ brokers: result });
  } catch (error) {
    console.error("Admin brokers error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
