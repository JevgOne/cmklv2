import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateInquirySchema } from "@/lib/validators/sales";

/* ------------------------------------------------------------------ */
/*  PUT /api/vehicles/[id]/inquiries/[inquiryId] — Aktualizace dotazu  */
/* ------------------------------------------------------------------ */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inquiryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    const { id, inquiryId } = await params;

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

    // Autorizace: vlastník nebo admin
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    const isOwner = vehicle.brokerId === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Nemáte oprávnění upravovat dotazy k tomuto vozidlu" },
        { status: 403 }
      );
    }

    // Načtení dotazu
    const existing = await prisma.vehicleInquiry.findFirst({
      where: { id: inquiryId, vehicleId: vehicle.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dotaz nenalezen" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateInquirySchema.parse(body);

    // Sestavení update dat
    const updateData: Record<string, unknown> = {};

    if (data.status) updateData.status = data.status;

    if (data.reply) {
      updateData.reply = data.reply;
      updateData.repliedAt = new Date();
      if (!data.status && existing.status === "NEW") {
        updateData.status = "REPLIED";
      }
    }

    if (data.viewingDate) {
      updateData.viewingDate = new Date(data.viewingDate);
      if (!data.status) {
        updateData.status = "VIEWING_SCHEDULED";
      }
    }

    if (data.viewingResult) {
      updateData.viewingResult = data.viewingResult;
    }

    if (data.offeredPrice !== undefined) {
      updateData.offeredPrice = data.offeredPrice;
      if (!data.status) {
        updateData.status = "NEGOTIATING";
      }
    }

    if (data.agreedPrice !== undefined) {
      updateData.agreedPrice = data.agreedPrice;
    }

    const inquiry = await prisma.vehicleInquiry.update({
      where: { id: inquiryId },
      data: updateData,
    });

    return NextResponse.json({ inquiry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PUT /api/vehicles/[id]/inquiries/[inquiryId] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
