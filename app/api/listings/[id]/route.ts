import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/listings/[id] — Detail inzerátu                          */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await prisma.listing.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        images: { orderBy: { order: "asc" } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            accountType: true,
            avatar: true,
            phone: true,
          },
        },
        _count: { select: { inquiries: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    // Inkrementovat view count
    await prisma.listing.update({
      where: { id: listing.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("GET /api/listings/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/listings/[id] — Editace inzerátu                         */
/* ------------------------------------------------------------------ */

const updateListingSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  variant: z.string().optional(),
  year: z.number().int().optional(),
  mileage: z.number().int().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  enginePower: z.number().int().nullable().optional(),
  bodyType: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  price: z.number().int().optional(),
  priceNegotiable: z.boolean().optional(),
  description: z.string().nullable().optional(),
  equipment: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().nullable().optional(),
  city: z.string().optional(),
  district: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD"]).optional(),
});

export async function PUT(
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
    const data = updateListingSchema.parse(body);

    // Ověřit vlastnictví
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (existing.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.equipment) updateData.equipment = JSON.stringify(data.equipment);
    if (data.highlights) updateData.highlights = JSON.stringify(data.highlights);

    const listing = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: { images: true },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PUT /api/listings/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/listings/[id] — Změna statusu inzerátu                 */
/* ------------------------------------------------------------------ */

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD", "DRAFT"]),
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

    const { id } = await params;
    const body = await request.json();
    const data = patchSchema.parse(body);

    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (existing.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status: data.status };
    if (data.status === "ACTIVE") {
      updateData.publishedAt = new Date().toISOString();
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ listing });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PATCH /api/listings/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/listings/[id] — Smazání inzerátu                      */
/* ------------------------------------------------------------------ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (existing.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    // Soft delete — nastavit status na INACTIVE
    await prisma.listing.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/listings/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
