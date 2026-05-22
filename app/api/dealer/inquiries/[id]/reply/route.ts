import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inquiryReplySchema } from "@/lib/validators/dealer-inquiry";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = inquiryReplySchema.parse(body);

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { listing: { select: { id: true, userId: true } } },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Poptávka nenalezena" }, { status: 404 });
    }

    if (inquiry.listing.userId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        reply: data.reply,
        repliedAt: new Date(),
        read: true,
        status: inquiry.status === "NEW" || inquiry.status === "READ" ? "REPLIED" : inquiry.status,
      },
    });

    // Update listing lastResponseAt
    await prisma.listing.update({
      where: { id: inquiry.listing.id },
      data: { lastResponseAt: new Date() },
    });

    return NextResponse.json({ inquiry: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/dealer/inquiries/[id]/reply error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
