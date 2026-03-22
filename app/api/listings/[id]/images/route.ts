import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/listings/[id]/images — Upload obrázků k inzerátu        */
/* ------------------------------------------------------------------ */

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

    // Ověřit vlastnictví
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

    const formData = await request.formData();
    const photos = formData.getAll("photos") as File[];

    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: "Žádné fotky" }, { status: 400 });
    }

    // V MVP ukládáme jen placeholder URL (v produkci Cloudinary upload)
    const images = [];
    for (let i = 0; i < photos.length; i++) {
      const order = parseInt(formData.get(`order_${i}`) as string, 10) || i;
      const isPrimary = formData.get(`isPrimary_${i}`) === "true";

      // V produkci: upload na Cloudinary, zde placeholder
      const url = `/uploads/listings/${id}/photo-${i}.jpg`;

      const image = await prisma.listingImage.create({
        data: {
          listingId: id,
          url,
          order,
          isPrimary,
        },
      });
      images.push(image);
    }

    return NextResponse.json({ images }, { status: 201 });
  } catch (error) {
    console.error("POST /api/listings/[id]/images error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
