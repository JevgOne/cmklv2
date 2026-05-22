import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
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

    // Send email reply to buyer
    if (data.reply && existing.buyerEmail) {
      const vehicleName = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}`;
      const brokerName = `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Makléř";
      const vehicleUrl = `${process.env.NEXTAUTH_URL || "https://carmakler.cz"}/nabidka/${vehicle.slug || vehicle.id}`;

      sendEmail({
        to: existing.buyerEmail,
        subject: `Odpověď na dotaz: ${vehicleName} — CarMakléř`,
        html: `
          <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; padding: 24px; border-radius: 12px 12px 0 0;">
              <img src="${process.env.NEXTAUTH_URL || "https://carmakler.cz"}/brand/logo-white.png" alt="CarMakléř" style="height: 32px;" />
            </div>
            <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">Dobrý den${existing.buyerName ? `, ${existing.buyerName}` : ""},</p>
              <p style="color: #374151; font-size: 14px; margin: 0 0 16px;">
                Makléř <strong>${brokerName}</strong> odpověděl na váš dotaz k vozidlu <strong>${vehicleName}</strong>:
              </p>
              <div style="background: #f9fafb; border-left: 4px solid #f97316; padding: 16px; border-radius: 0 8px 8px 0; margin: 0 0 24px;">
                <p style="color: #374151; font-size: 14px; margin: 0; white-space: pre-wrap;">${data.reply}</p>
              </div>
              <a href="${vehicleUrl}" style="display: inline-block; background: #f97316; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Zobrazit vozidlo
              </a>
            </div>
            <div style="background: #f9fafb; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                CarMakléř — Váš osobní makléř pro prodej auta
              </p>
            </div>
          </div>
        `,
      }).catch((err) => console.error("[Email] Inquiry reply failed:", err));
    }

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
