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

    const role = session.user.role;
    if (!["ADMIN", "BACKOFFICE", "REGIONAL_DIRECTOR", "MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    // Scope by role
    const where: Record<string, unknown> = {};

    if (role === "MANAGER") {
      const manager = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { regionId: true },
      });
      if (manager?.regionId) {
        where.regionId = manager.regionId;
      }
    }

    const [total, assigned, contacted, vehicleAdded, rejected, expired] =
      await Promise.all([
        prisma.lead.count({ where }),
        prisma.lead.count({ where: { ...where, status: "ASSIGNED" } }),
        prisma.lead.count({ where: { ...where, status: "CONTACTED" } }),
        prisma.lead.count({ where: { ...where, status: "VEHICLE_ADDED" } }),
        prisma.lead.count({ where: { ...where, status: "REJECTED" } }),
        prisma.lead.count({ where: { ...where, status: "EXPIRED" } }),
      ]);

    const conversionRate =
      total > 0 ? Math.round((vehicleAdded / total) * 100) : 0;

    // Average time from creation to VEHICLE_ADDED
    const convertedLeads = await prisma.lead.findMany({
      where: {
        ...where,
        status: "VEHICLE_ADDED",
        vehicleId: { not: null },
      },
      select: { createdAt: true, updatedAt: true },
    });

    let avgDaysToConvert = 0;
    if (convertedLeads.length > 0) {
      const totalMs = convertedLeads.reduce((sum, lead) => {
        return sum + (lead.updatedAt.getTime() - lead.createdAt.getTime());
      }, 0);
      avgDaysToConvert = Math.round(
        totalMs / convertedLeads.length / (1000 * 60 * 60 * 24)
      );
    }

    return NextResponse.json({
      total,
      assigned,
      contacted,
      vehicleAdded,
      rejected,
      expired,
      conversionRate,
      avgDaysToConvert,
    });
  } catch (error) {
    console.error("GET /api/leads/stats error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
