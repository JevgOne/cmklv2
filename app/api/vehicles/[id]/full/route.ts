import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/vehicles/[id]/full — Kompletní data vozidla pro PWA HUB   */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Pristup odepren. Prihlaste se." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;
    const userRole = session.user.role;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        inquiries: {
          orderBy: { createdAt: "desc" },
          include: {
            broker: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        contracts: {
          orderBy: { createdAt: "desc" },
        },
        changeLog: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        damageReports: {
          orderBy: { createdAt: "desc" },
          include: {
            reportedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        broker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            managerId: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    // Autorizace: vlastnik, manazer vlastnika, nebo admin/backoffice
    const isAdmin = userRole === "ADMIN" || userRole === "BACKOFFICE";
    const isOwner = vehicle.brokerId === userId;
    const isManager =
      userRole === "MANAGER" && vehicle.broker?.managerId === userId;

    if (!isAdmin && !isOwner && !isManager) {
      return NextResponse.json(
        { error: "Nemate opravneni zobrazit toto vozidlo" },
        { status: 403 }
      );
    }

    // Spocitej statistiky
    const daysOnPlatform = vehicle.publishedAt
      ? Math.floor(
          (Date.now() - new Date(vehicle.publishedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const newInquiriesCount = vehicle.inquiries.filter(
      (i) => i.status === "NEW"
    ).length;

    return NextResponse.json({
      vehicle,
      stats: {
        viewCount: vehicle.viewCount,
        totalInquiries: vehicle.inquiries.length,
        newInquiries: newInquiriesCount,
        daysOnPlatform,
        damageReportsCount: vehicle.damageReports.length,
        contractsCount: vehicle.contracts.length,
      },
    });
  } catch (error) {
    console.error("GET /api/vehicles/[id]/full error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}
