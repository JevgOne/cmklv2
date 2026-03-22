import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/emails/history/[vehicleId] — Historie emailů k vozu       */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Pristup odepren" }, { status: 401 });
    }

    const { vehicleId } = await params;

    // Verify vehicle belongs to broker
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { brokerId: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
    }

    // Allow access for vehicle owner, managers, and admins
    const isOwner = vehicle.brokerId === session.user.id;
    const isAdmin = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"].includes(
      session.user.role
    );

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Pristup odepren" }, { status: 403 });
    }

    const emails = await prisma.emailLog.findMany({
      where: { vehicleId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        templateType: true,
        recipientEmail: true,
        recipientName: true,
        subject: true,
        status: true,
        createdAt: true,
        sender: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(emails);
  } catch (error) {
    console.error("GET /api/emails/history/[vehicleId] error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
