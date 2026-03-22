import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/listings/[id]/inquiry — Odeslat dotaz na inzerát        */
/* ------------------------------------------------------------------ */

const inquirySchema = z.object({
  name: z.string().min(1, "Jméno je povinné"),
  email: z.string().email("Neplatný email"),
  phone: z.string().optional(),
  message: z.string().min(1, "Zpráva je povinná"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = inquirySchema.parse(body);

    // Ověřit, že inzerát existuje a je aktivní
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!listing || listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    // Zjistit, zda je uživatel přihlášený
    const session = await getServerSession(authOptions);
    const senderId = session?.user?.id ?? null;

    const inquiry = await prisma.inquiry.create({
      data: {
        listingId: id,
        senderId,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        message: data.message,
      },
    });

    // Inkrementovat inquiry count
    await prisma.listing.update({
      where: { id },
      data: { inquiryCount: { increment: 1 } },
    });

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/listings/[id]/inquiry error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/listings/[id]/inquiry — Seznam dotazů (pro vlastníka)    */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const { id } = await params;

    // Ověřit vlastnictví
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

    // Filtrovat podle statusu
    const statusFilter = request.nextUrl.searchParams.get("status");
    const where: Record<string, unknown> = { listingId: id };
    if (statusFilter) {
      where.status = statusFilter;
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Označit nepřečtené jako READ (pokud vlastník inzerátu)
    if (listing.userId === session.user.id) {
      const unreadIds = inquiries
        .filter((i) => i.status === "NEW")
        .map((i) => i.id);

      if (unreadIds.length > 0) {
        await prisma.inquiry.updateMany({
          where: { id: { in: unreadIds } },
          data: { status: "READ", read: true },
        });
      }
    }

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("GET /api/listings/[id]/inquiry error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
