import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary, WATERMARK_TRANSFORMATION } from "@/lib/cloudinary";

/* ------------------------------------------------------------------ */
/*  POST /api/listings/[id]/images — Upload obrázků k inzerátu        */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    const { id } = await params;

    // Ověřit existenci inzerátu
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { userId: true, createdAt: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Inzerát nenalezen" }, { status: 404 });
    }

    // Vlastnictví: přihlášený uživatel musí být vlastníkem
    // Nepřihlášený uživatel může přidat fotky k inzerátu vytvořenému v posledních 30 minutách
    if (session?.user?.id) {
      if (listing.userId !== session.user.id) {
        return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
      }
    } else {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (listing.createdAt < thirtyMinutesAgo) {
        return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
      }
    }

    const formData = await request.formData();
    const photos = formData.getAll("photos") as File[];

    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: "Žádné fotky" }, { status: 400 });
    }

    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxFileSize = 10 * 1024 * 1024;

    for (const photo of photos) {
      if (!allowedImageTypes.includes(photo.type)) {
        return NextResponse.json(
          { error: `Nepodporovaný formát souboru: ${photo.type}. Povolené: JPG, PNG, WebP` },
          { status: 400 }
        );
      }
      if (photo.size > maxFileSize) {
        return NextResponse.json(
          { error: "Soubor je příliš velký (max 10 MB)" },
          { status: 400 }
        );
      }
    }

    // Upload na Cloudinary
    const images = [];
    for (let i = 0; i < photos.length; i++) {
      const order = parseInt(formData.get(`order_${i}`) as string, 10) || i;
      const isPrimary = formData.get(`isPrimary_${i}`) === "true";

      let url: string;
      try {
        url = await uploadToCloudinary(photos[i], `carmakler/listings/${id}`, {
          transformation: WATERMARK_TRANSFORMATION,
        });
      } catch (uploadError) {
        console.error(`Failed to upload photo ${i}:`, uploadError);
        continue; // Preskocit selhany upload, pokracovat s dalsimi
      }

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
