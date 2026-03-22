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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 401 });
    }

    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        brokerId: true,
        exclusiveUntil: true,
        exclusiveContractId: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (vehicle.brokerId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    let contract = null;
    if (vehicle.exclusiveContractId) {
      contract = await prisma.contract.findUnique({
        where: { id: vehicle.exclusiveContractId },
        select: {
          id: true,
          exclusiveDuration: true,
          exclusiveStartDate: true,
          exclusiveEndDate: true,
          earlyTermination: true,
          terminationReason: true,
          terminationDate: true,
          violationReported: true,
          violationDetails: true,
          penaltyAmount: true,
          status: true,
          pdfUrl: true,
          signedAt: true,
        },
      });
    }

    const now = new Date();
    const exclusiveUntil = vehicle.exclusiveUntil;
    let exclusiveStatus: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "TERMINATED" | "NONE" = "NONE";
    let daysRemaining: number | null = null;

    if (contract?.earlyTermination) {
      exclusiveStatus = "TERMINATED";
    } else if (exclusiveUntil) {
      const diffMs = exclusiveUntil.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0) {
        exclusiveStatus = "EXPIRED";
      } else if (daysRemaining <= 14) {
        exclusiveStatus = "EXPIRING_SOON";
      } else {
        exclusiveStatus = "ACTIVE";
      }
    }

    return NextResponse.json({
      exclusiveStatus,
      exclusiveUntil,
      daysRemaining,
      contract,
    });
  } catch (error) {
    console.error("GET /api/vehicles/[id]/exclusive-status error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
