import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInquirySchema } from "@/lib/validators/sales";
import { createNotification } from "@/lib/notifications";

/* ------------------------------------------------------------------ */
/*  GET /api/vehicles/[id]/inquiries — Seznam dotazů k vozidlu         */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Načtení vozidla
    const vehicle = await prisma.vehicle.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    // Autorizace: vlastník, manažer nebo admin
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    const isOwner = vehicle.brokerId === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Nemáte oprávnění zobrazit dotazy k tomuto vozidlu" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const inquiries = await prisma.vehicleInquiry.findMany({
      where: {
        vehicleId: vehicle.id,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("GET /api/vehicles/[id]/inquiries error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/vehicles/[id]/inquiries — Nový dotaz (z webu, bez auth)  */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Načtení vozidla (musí být aktivní)
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: "ACTIVE",
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno nebo není aktivní" },
        { status: 404 }
      );
    }

    if (!vehicle.brokerId) {
      return NextResponse.json(
        { error: "Vozidlo nemá přiřazeného makléře" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = createInquirySchema.parse(body);

    const inquiry = await prisma.vehicleInquiry.create({
      data: {
        vehicleId: vehicle.id,
        brokerId: vehicle.brokerId,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        buyerEmail: data.buyerEmail || null,
        message: data.message,
        status: "NEW",
      },
    });

    // Notifikace makléři o novém dotazu
    await createNotification({
      userId: vehicle.brokerId,
      type: "MESSAGE",
      title: `Nový dotaz na ${vehicle.brand} ${vehicle.model}`,
      body: `${data.buyerName}: ${data.message}`,
      link: `/makler/vehicles/${vehicle.id}/inquiries`,
    });

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/vehicles/[id]/inquiries error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
