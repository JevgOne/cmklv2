import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePartSchema } from "@/lib/validators/parts";

/* ------------------------------------------------------------------ */
/*  GET /api/parts/[id] — Detail dílu                                  */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const part = await prisma.part.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        images: { orderBy: { order: "asc" } },
        supplier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
            cities: true,
          },
        },
      },
    });

    if (!part) {
      return NextResponse.json({ error: "Díl nenalezen" }, { status: 404 });
    }

    // Inkrementovat view count
    await prisma.part.update({
      where: { id: part.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ part });
  } catch (error) {
    console.error("GET /api/parts/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/parts/[id] — Editace dílu (ownership check)               */
/* ------------------------------------------------------------------ */

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
    const data = updatePartSchema.parse(body);

    const existing = await prisma.part.findUnique({
      where: { id },
      select: { supplierId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Díl nenalezen" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (existing.supplierId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.compatibleBrands) updateData.compatibleBrands = JSON.stringify(data.compatibleBrands);
    if (data.compatibleModels) updateData.compatibleModels = JSON.stringify(data.compatibleModels);

    // Handle images separately
    delete updateData.images;

    const part = await prisma.part.update({
      where: { id },
      data: updateData,
      include: { images: true },
    });

    // Update images if provided
    if (data.images) {
      await prisma.partImage.deleteMany({ where: { partId: id } });
      await prisma.partImage.createMany({
        data: data.images.map((img) => ({
          partId: id,
          url: img.url,
          order: img.order,
          isPrimary: img.isPrimary ?? false,
        })),
      });
    }

    return NextResponse.json({ part });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/parts/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/parts/[id] — Soft delete dílu                          */
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

    const existing = await prisma.part.findUnique({
      where: { id },
      select: { supplierId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Díl nenalezen" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (existing.supplierId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    await prisma.part.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/parts/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
