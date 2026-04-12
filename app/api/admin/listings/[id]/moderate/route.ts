import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  PATCH /api/admin/listings/[id]/moderate — Schválit/zamítnout       */
/* ------------------------------------------------------------------ */

const moderateSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE" || session.user.role === "MANAGER";
    if (!isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = moderateSchema.parse(body);

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, flagged: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      moderationStatus: data.action,
    };

    if (data.action === "APPROVED") {
      updateData.flagged = false;
      updateData.status = "ACTIVE";
    } else if (data.action === "REJECTED") {
      updateData.status = "INACTIVE";
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ listing: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PATCH /api/admin/listings/[id]/moderate error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
