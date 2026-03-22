import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approveOpportunitySchema } from "@/lib/validators/marketplace";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  POST /api/marketplace/opportunities/[id]/approve — Schválení/zamítnutí */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const opportunity = await prisma.flipOpportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Příležitost nenalezena" },
        { status: 404 }
      );
    }

    if (opportunity.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: "Příležitost není ve stavu čekajícím na schválení" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = approveOpportunitySchema.parse(body);

    const updated = await prisma.flipOpportunity.update({
      where: { id },
      data: {
        status: data.approved ? "FUNDING" : "CANCELLED",
        adminNotes: data.adminNotes ?? null,
        rejectionReason: data.approved
          ? null
          : data.rejectionReason ?? "Zamítnuto administrátorem",
      },
    });

    return NextResponse.json({ opportunity: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error(
      "POST /api/marketplace/opportunities/[id]/approve error:",
      error
    );
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
