import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// REGIONAL_DIRECTOR/MANAGER/BROKER nesmí — commission má direct revenue impact
// a vyžaduje central control.
function canEditCommission(role: string | undefined): boolean {
  return role === "ADMIN" || role === "BACKOFFICE";
}

const bodySchema = z.object({
  newRate: z.number().min(12).max(20).multipleOf(0.5),
  reason: z.string().min(10).max(500),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canEditCommission(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id: partnerId } = await params;

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { newRate, reason } = parsed.data;

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { id: true, commissionRate: true },
    });
    if (!partner) {
      return NextResponse.json({ error: "Partner nenalezen" }, { status: 404 });
    }

    const oldRate = Number(partner.commissionRate);
    if (oldRate === newRate) {
      return NextResponse.json(
        { error: "Nová sazba je stejná jako aktuální" },
        { status: 400 }
      );
    }

    const [, updated] = await prisma.$transaction([
      prisma.partnerCommissionLog.create({
        data: {
          partnerId,
          oldRate,
          newRate,
          reason,
          changedById: session.user.id,
        },
      }),
      prisma.partner.update({
        where: { id: partnerId },
        data: {
          commissionRate: newRate,
          commissionRateAt: new Date(),
        },
        select: {
          id: true,
          commissionRate: true,
          commissionRateAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      id: updated.id,
      commissionRate: Number(updated.commissionRate),
      commissionRateAt: updated.commissionRateAt.toISOString(),
    });
  } catch (error) {
    console.error("PATCH /api/admin/partners/[id]/commission error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
