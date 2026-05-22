import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inquiryStatusSchema } from "@/lib/validators/dealer-inquiry";

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
    const data = inquiryStatusSchema.parse(body);

    // Verify ownership through listing
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

    // Require viewingDate for VIEWING status
    if (data.status === "VIEWING" && !data.viewingDate) {
      return NextResponse.json(
        { error: "Pro status VIEWING je nutné zadat datum prohlídky" },
        { status: 400 }
      );
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        status: data.status,
        read: true,
        ...(data.viewingDate && { viewingDate: new Date(data.viewingDate) }),
        ...(data.viewingResult && { viewingResult: data.viewingResult }),
      },
    });

    return NextResponse.json({ inquiry: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/dealer/inquiries/[id]/status error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
