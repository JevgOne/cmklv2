import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/listings/[id]/inquiry/[inquiryId]/reply — Odpověď       */
/* ------------------------------------------------------------------ */

const replySchema = z.object({
  reply: z.string().min(1, "Odpověď je povinná"),
});

export async function POST(
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
    const data = replySchema.parse(body);

    // Ověřit vlastnictví inzerátu
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    // Ověřit, že dotaz patří k inzerátu
    const inquiry = await prisma.inquiry.findFirst({
      where: { id: inquiryId, listingId: id },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Dotaz nenalezen" }, { status: 404 });
    }

    const updated = await prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        reply: data.reply,
        repliedAt: new Date(),
        read: true,
      },
    });

    return NextResponse.json({ inquiry: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/listings/[id]/inquiry/[inquiryId]/reply error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
