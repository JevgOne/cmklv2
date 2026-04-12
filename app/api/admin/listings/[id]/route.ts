import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/admin/listings/[id] — Detail inzeratu pro admin           */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE" || session.user.role === "MANAGER";
    if (!isAdmin) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
            accountType: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Inzerat nenalezen" },
        { status: 404 }
      );
    }

    // Parse flagReasons JSON into flags array
    let flags: Array<{
      id: string;
      reason: string;
      details: string | null;
      createdAt: string;
      resolvedAt: string | null;
    }> = [];

    if (listing.flagged && listing.flagReasons) {
      try {
        const parsed = JSON.parse(listing.flagReasons);
        if (Array.isArray(parsed)) {
          flags = parsed;
        }
      } catch {
        // Not valid JSON - ignore
      }
    }

    return NextResponse.json({
      listing: {
        ...listing,
        flagCount: flags.length || (listing.flagged ? 1 : 0),
        flags,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        publishedAt: listing.publishedAt?.toISOString() ?? null,
        images: listing.images.map((img) => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary,
          order: img.order,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/listings/[id] error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/admin/listings/[id] — Moderacni akce (schvalit/zamitnout) */
/* ------------------------------------------------------------------ */

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "deactivate"]),
  reason: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE" || session.user.role === "MANAGER";
    if (!isAdmin) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = actionSchema.parse(body);

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Inzerat nenalezen" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    switch (data.action) {
      case "approve":
        updateData.status = "ACTIVE";
        updateData.moderationStatus = "APPROVED";
        updateData.flagged = false;
        if (!listing.status || listing.status === "DRAFT") {
          updateData.publishedAt = new Date();
        }
        break;
      case "reject":
        updateData.status = "INACTIVE";
        updateData.moderationStatus = "REJECTED";
        break;
      case "deactivate":
        updateData.status = "INACTIVE";
        break;
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ listing: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatna data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PATCH /api/admin/listings/[id] error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}
