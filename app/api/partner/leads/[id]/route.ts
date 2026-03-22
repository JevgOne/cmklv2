import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePartnerLeadSchema } from "@/lib/validators/partner";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updatePartnerLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
    });
    if (!partner) {
      return NextResponse.json({ error: "Partner nenalezen" }, { status: 404 });
    }

    // Verify this lead belongs to the partner
    const lead = await prisma.partnerLead.findFirst({
      where: { id, partnerId: partner.id },
    });
    if (!lead) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    const updated = await prisma.partnerLead.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/partner/leads/[id] error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
