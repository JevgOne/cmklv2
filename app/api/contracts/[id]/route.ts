import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/contracts/[id] — Detail smlouvy                           */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            variant: true,
            year: true,
            mileage: true,
            vin: true,
            price: true,
            condition: true,
            fuelType: true,
            transmission: true,
            enginePower: true,
            color: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        broker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Smlouva nenalezena" },
        { status: 404 }
      );
    }

    // Only the broker who owns the contract can view it (or admin)
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (contract.brokerId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Přístup odepřen" },
        { status: 403 }
      );
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error("GET /api/contracts/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
