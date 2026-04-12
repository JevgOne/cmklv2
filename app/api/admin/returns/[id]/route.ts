import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateReturnSchema = z.object({
  status: z.enum([
    "NEW", "RECEIVED", "IN_REVIEW", "APPROVED",
    "REFUNDED", "PARTIALLY_REFUNDED", "REJECTED", "CANCELLED",
  ]).optional(),
  rejectionReason: z.string().optional(),
  approvedAmount: z.number().int().min(0).optional(),
  adminNotes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !["ADMIN", "BACKOFFICE", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { id } = await params;
    const returnRecord = await prisma.returnRequest.findUnique({
      where: { id },
      include: { order: { include: { items: true } } },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Reklamace nenalezena" }, { status: 404 });
    }

    return NextResponse.json({ return: returnRecord });
  } catch (error) {
    console.error("GET /api/admin/returns/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateReturnSchema.parse(body);

    const existing = await prisma.returnRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Reklamace nenalezena" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (data.status) {
      updateData.status = data.status;
      // Automaticky nastavit refundedAt při refundaci
      if (data.status === "REFUNDED" || data.status === "PARTIALLY_REFUNDED") {
        updateData.refundedAt = new Date();
      }
    }
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
    if (data.approvedAmount !== undefined) updateData.approvedAmount = data.approvedAmount;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;

    const updated = await prisma.returnRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ return: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/admin/returns/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
