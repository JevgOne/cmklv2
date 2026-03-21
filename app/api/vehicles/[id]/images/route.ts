import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/vehicles/[id]/images — Upload obrázků k vozidlu          */
/* ------------------------------------------------------------------ */

const imagesSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().url("Neplatná URL obrázku"),
        isPrimary: z.boolean().optional(),
      })
    )
    .min(1, "Je vyžadován alespoň jeden obrázek"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = imagesSchema.parse(body);

    // Načtení vozidla
    const vehicle = await prisma.vehicle.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { images: { orderBy: { order: "asc" } } },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    // Autorizace: vlastník nebo admin
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (vehicle.brokerId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Nemáte oprávnění přidávat obrázky k tomuto vozidlu" },
        { status: 403 }
      );
    }

    // Výpočet pořadí od posledního existujícího
    const lastOrder =
      vehicle.images.length > 0
        ? vehicle.images[vehicle.images.length - 1].order
        : -1;

    // Zjistit, zda nový obrázek bude primary
    const hasExistingPrimary = vehicle.images.some((img) => img.isPrimary);
    const newPrimaryIndex = data.images.findIndex((img) => img.isPrimary);
    const autoFirstPrimary = !hasExistingPrimary && newPrimaryIndex === -1;

    const result = await prisma.$transaction(async (tx) => {
      // Pokud nový obrázek je explicitně primary, odebrat primary z existujících
      if (newPrimaryIndex !== -1) {
        await tx.vehicleImage.updateMany({
          where: { vehicleId: vehicle.id, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Vytvořit nové obrázky
      const imageData = data.images.map((img, index) => {
        const order = lastOrder + 1 + index;
        let isPrimary = img.isPrimary ?? false;

        // První obrázek u vozidla bez fotek = automaticky primary
        if (autoFirstPrimary && index === 0) {
          isPrimary = true;
        }

        // Pokud je tento obrázek explicitně primary, jen jeden
        if (newPrimaryIndex !== -1) {
          isPrimary = index === newPrimaryIndex;
        }

        return {
          vehicleId: vehicle.id,
          url: img.url,
          order,
          isPrimary,
        };
      });

      await tx.vehicleImage.createMany({ data: imageData });

      // Vrátit všechny obrázky vozidla
      return tx.vehicleImage.findMany({
        where: { vehicleId: vehicle.id },
        orderBy: { order: "asc" },
      });
    });

    return NextResponse.json(
      { count: data.images.length, images: result },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/vehicles/[id]/images error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
