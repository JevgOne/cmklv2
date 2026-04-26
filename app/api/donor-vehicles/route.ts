import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDonorVehicleSchema } from "@/lib/validators/donor-vehicle";

const ALLOWED_ROLES = ["PARTS_SUPPLIER", "ADMIN", "BACKOFFICE"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const GRADE_TO_CONDITION: Record<string, string> = {
  A: "USED_GOOD",
  B: "USED_FAIR",
  C: "USED_POOR",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createDonorVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Neplatný vstup" },
      { status: 400 }
    );
  }

  const { vehicle, disposalType, damageZones, photos, parts } = parsed.data;
  const supplierId = session.user.id;

  const result = await prisma.$transaction(async (tx) => {
    // Create donor vehicle
    const donorVehicle = await tx.donorVehicle.create({
      data: {
        supplierId,
        vin: vehicle.vin,
        kTypeId: vehicle.kTypeId ?? undefined,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year ?? undefined,
        variant: vehicle.variant ?? undefined,
        engine: vehicle.engine ?? undefined,
        fuel: vehicle.fuel ?? undefined,
        transmission: vehicle.transmission ?? undefined,
        disposalType,
        damageZones: damageZones ?? undefined,
        photos: photos ?? undefined,
        status: "PUBLISHED",
      },
    });

    // Create parts
    let totalValue = 0;
    for (const part of parts) {
      const baseSlug = slugify(`${part.name}-${vehicle.brand}-${vehicle.model}`);
      const slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const category = mapCategory(part.category);

      await tx.part.create({
        data: {
          slug,
          supplierId,
          donorVehicleId: donorVehicle.id,
          name: part.name,
          category,
          condition: GRADE_TO_CONDITION[part.grade] ?? "USED_FAIR",
          partGrade: part.grade,
          partType: "USED",
          price: part.priceByAgreement ? 0 : part.price,
          vatIncluded: true,
          stock: 1,
          description: part.note || undefined,
          tecdocArticleId: part.tecdocArticleId ?? undefined,
          tecdocProductGroup: part.tecdocProductGroup ?? undefined,
          compatibleBrands: JSON.stringify([vehicle.brand]),
          compatibleModels: JSON.stringify([vehicle.model]),
          compatibleYearFrom: vehicle.year ?? undefined,
          compatibleYearTo: vehicle.year ?? undefined,
          status: "ACTIVE",
          ...(part.photo
            ? {
                images: {
                  create: {
                    url: part.photo,
                    order: 0,
                    isPrimary: true,
                  },
                },
              }
            : {}),
        },
      });

      if (!part.priceByAgreement) {
        totalValue += part.price;
      }
    }

    // Update donor vehicle stats
    const updated = await tx.donorVehicle.update({
      where: { id: donorVehicle.id },
      data: {
        totalParts: parts.length,
        publishedParts: parts.length,
        totalValue,
      },
    });

    return { donorVehicle: updated, partsCreated: parts.length };
  });

  return NextResponse.json(result, { status: 201 });
}

// Map TecDoc product group to Part category
function mapCategory(productGroup: string): string {
  const map: Record<string, string> = {
    ENGINE_BAY: "ENGINE",
    FRONT: "BODY",
    REAR: "BODY",
    LEFT: "BODY",
    RIGHT: "BODY",
    ROOF: "BODY",
    UNDERBODY: "SUSPENSION",
    INTERIOR: "INTERIOR",
  };
  return map[productGroup] ?? "OTHER";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "12");
  const status = searchParams.get("status") ?? undefined;

  const where = {
    ...(session.user.role === "PARTS_SUPPLIER"
      ? { supplierId: session.user.id }
      : {}),
    ...(status ? { status } : {}),
  };

  const [donors, total] = await Promise.all([
    prisma.donorVehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.donorVehicle.count({ where }),
  ]);

  return NextResponse.json({
    donors,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
