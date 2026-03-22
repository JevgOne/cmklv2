import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  PATCH /api/listings/[id]/inquiry/[inquiryId]/status — Změna statusu */
/* ------------------------------------------------------------------ */

const statusSchema = z.object({
  status: z.enum(["NEW", "READ", "REPLIED", "CLOSED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inquiryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const { id, inquiryId } = await params;
    const body = await request.json();
    const data = statusSchema.parse(body);

    // Ověřit vlastnictví inzerátu
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (listing.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    // Ověřit, že dotaz patří k inzerátu
    const inquiry = await prisma.inquiry.findFirst({
      where: { id: inquiryId, listingId: id },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Dotaz nenalezen" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status: data.status };

    if (data.status === "READ") {
      updateData.read = true;
    }

    const updated = await prisma.inquiry.update({
      where: { id: inquiryId },
      data: updateData,
    });

    return NextResponse.json({ inquiry: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PATCH /api/listings/[id]/inquiry/[inquiryId]/status error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
