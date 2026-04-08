import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePartnerSchema } from "@/lib/validators/partner";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;

    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true, status: true } },
        _count: { select: { activities: true, leads: true } },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner nenalezen" }, { status: 404 });
    }

    return NextResponse.json({
      ...partner,
      commissionRate: Number(partner.commissionRate),
      commissionRateAt: partner.commissionRateAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/partners/[id] error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updatePartnerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.partner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Partner nenalezen" }, { status: 404 });
    }

    const data = parsed.data;

    // Log status change
    if (data.status && data.status !== existing.status) {
      await prisma.partnerActivity.create({
        data: {
          partnerId: id,
          userId: session.user.id,
          type: "ZMENA_STAVU",
          title: `Zmena stavu: ${existing.status} -> ${data.status}`,
          oldStatus: existing.status,
          newStatus: data.status,
        },
      });
    }

    // Log manager assignment
    if (data.managerId !== undefined && data.managerId !== existing.managerId) {
      await prisma.partnerActivity.create({
        data: {
          partnerId: id,
          userId: session.user.id,
          type: "SYSTEM",
          title: data.managerId ? "Prirazen manazer" : "Odebran manazer",
        },
      });
    }

    const partner = await prisma.partner.update({
      where: { id },
      data,
    });

    return NextResponse.json(partner);
  } catch (error) {
    console.error("PATCH /api/partners/[id] error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.partner.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/partners/[id] error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
