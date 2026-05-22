import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inquiryNoteSchema } from "@/lib/validators/dealer-inquiry";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "ADVERTISER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Nedostatečná oprávnění" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = inquiryNoteSchema.parse(body);

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { listing: { select: { userId: true } } },
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
        ...(data.note !== undefined && { note: data.note || null }),
        ...(data.priority !== undefined && { priority: data.priority }),
      },
    });

    return NextResponse.json({ inquiry: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/dealer/inquiries/[id]/note error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
