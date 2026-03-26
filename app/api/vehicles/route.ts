import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/vehicles — Listing s filtry a stránkováním                */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const brand = searchParams.get("brand");
    const model = searchParams.get("model");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const fuelType = searchParams.get("fuelType");
    const transmission = searchParams.get("transmission");
    const bodyType = searchParams.get("bodyType");
    const minYear = searchParams.get("minYear");
    const maxYear = searchParams.get("maxYear");
    const statusParam = searchParams.get("status") || "ACTIVE";
    const sellerType = searchParams.get("sellerType");
    const brokerId = searchParams.get("brokerId");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));

    // Admin/backoffice může vidět všechny statusy
    const session = await getServerSession(authOptions);
    const isAdmin =
      session?.user?.role === "ADMIN" || session?.user?.role === "BACKOFFICE";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (statusParam === "all" && isAdmin) {
      // Admin vidí všechny statusy — žádný filtr
    } else {
      where.status = isAdmin ? statusParam : "ACTIVE";
    }

    if (brand) where.brand = brand;
    if (model) where.model = model;
    if (fuelType) where.fuelType = fuelType;
    if (transmission) where.transmission = transmission;
    if (bodyType) where.bodyType = bodyType;
    if (sellerType) where.sellerType = sellerType;
    if (brokerId) where.brokerId = brokerId;

    // Price range
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      const parsedMin = minPrice ? parseInt(minPrice, 10) : NaN;
      const parsedMax = maxPrice ? parseInt(maxPrice, 10) : NaN;
      if (!isNaN(parsedMin)) priceFilter.gte = parsedMin;
      if (!isNaN(parsedMax)) priceFilter.lte = parsedMax;
      if (Object.keys(priceFilter).length > 0) where.price = priceFilter;
    }

    // Year range
    if (minYear || maxYear) {
      const yearFilter: Record<string, number> = {};
      const parsedMinY = minYear ? parseInt(minYear, 10) : NaN;
      const parsedMaxY = maxYear ? parseInt(maxYear, 10) : NaN;
      if (!isNaN(parsedMinY)) yearFilter.gte = parsedMinY;
      if (!isNaN(parsedMaxY)) yearFilter.lte = parsedMaxY;
      if (Object.keys(yearFilter).length > 0) where.year = yearFilter;
    }

    // Sort mapping
    type SortOrder = "asc" | "desc";
    let orderBy: Record<string, SortOrder>;
    switch (sort) {
      case "cheapest":
        orderBy = { price: "asc" };
        break;
      case "expensive":
        orderBy = { price: "desc" };
        break;
      case "lowest-km":
        orderBy = { mileage: "asc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          broker: { select: { id: true, firstName: true, lastName: true, slug: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      vehicles,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/vehicles error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/vehicles — Vytvoření nového vozidla (vyžaduje auth)      */
/* ------------------------------------------------------------------ */

const createVehicleSchema = z.object({
  vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "VIN musí mít 17 znaků a platný formát").transform((v) => v.toUpperCase()),
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  variant: z.string().optional(),
  year: z.number().int().min(1900).max(2100),
  mileage: z.number().int().min(0),
  fuelType: z.string().min(1),
  transmission: z.string().min(1),
  enginePower: z.number().int().optional(),
  engineCapacity: z.number().int().optional(),
  bodyType: z.string().optional(),
  color: z.string().optional(),
  doorsCount: z.number().int().optional(),
  seatsCount: z.number().int().optional(),
  condition: z.string().min(1),
  stkValidUntil: z.string().optional(),
  serviceBook: z.boolean().optional(),
  price: z.number().int().min(0),
  priceNegotiable: z.boolean().optional(),
  equipment: z.array(z.string()).optional(),
  description: z.string().optional(),
  city: z.string().min(1, "Město je povinné"),
  district: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  sellerName: z.string().optional(),
  sellerPhone: z.string().optional(),
  sellerEmail: z.string().email().optional().or(z.literal("")),
});

function generateSlug(brand: string, model: string, year: number): string {
  const base = `${brand}-${model}-${year}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = createVehicleSchema.parse(body);

    // Kontrola duplicity VIN
    const existingVin = await prisma.vehicle.findUnique({
      where: { vin: data.vin },
    });
    if (existingVin) {
      return NextResponse.json(
        { error: "Vozidlo s tímto VIN již existuje" },
        { status: 409 }
      );
    }

    const slug = generateSlug(data.brand, data.model, data.year);

    const vehicle = await prisma.vehicle.create({
      data: {
        vin: data.vin,
        vinLocked: true,
        brand: data.brand,
        model: data.model,
        variant: data.variant ?? null,
        year: data.year,
        mileage: data.mileage,
        slug,
        fuelType: data.fuelType,
        transmission: data.transmission,
        enginePower: data.enginePower ?? null,
        engineCapacity: data.engineCapacity ?? null,
        bodyType: data.bodyType ?? null,
        color: data.color ?? null,
        doorsCount: data.doorsCount ?? null,
        seatsCount: data.seatsCount ?? null,
        condition: data.condition,
        stkValidUntil: data.stkValidUntil ? new Date(data.stkValidUntil) : null,
        serviceBook: data.serviceBook ?? false,
        price: data.price,
        priceNegotiable: data.priceNegotiable ?? true,
        equipment: data.equipment ? JSON.stringify(data.equipment) : null,
        description: data.description ?? null,
        status: "DRAFT",
        sellerType: "broker",
        brokerId: session.user.id,
        city: data.city,
        district: data.district ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
      include: {
        images: true,
        broker: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Auto-create/update SellerContact if seller info provided
    if (data.sellerName && data.sellerPhone) {
      try {
        const existingContact = await prisma.sellerContact.findFirst({
          where: {
            brokerId: session.user.id,
            phone: data.sellerPhone,
          },
        });

        let sellerContactId: string;

        if (existingContact) {
          await prisma.sellerContact.update({
            where: { id: existingContact.id },
            data: {
              name: data.sellerName,
              email: data.sellerEmail || existingContact.email,
              totalVehicles: { increment: 1 },
              lastContactAt: new Date(),
            },
          });
          sellerContactId = existingContact.id;
        } else {
          const newContact = await prisma.sellerContact.create({
            data: {
              brokerId: session.user.id,
              name: data.sellerName,
              phone: data.sellerPhone,
              email: data.sellerEmail || null,
              totalVehicles: 1,
              lastContactAt: new Date(),
            },
          });
          sellerContactId = newContact.id;
        }

        // Link vehicle to seller contact
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { sellerContactId },
        });
      } catch (contactError) {
        // Don't fail vehicle creation if contact linking fails
        console.error("SellerContact upsert error:", contactError);
      }
    }

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    // Race condition: unikátnost na úrovni DB (VIN nebo slug)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[]) ?? [];
      if (target.includes("vin")) {
        return NextResponse.json(
          { error: "Vozidlo s tímto VIN již existuje" },
          { status: 409 }
        );
      }
      // Slug kolize — interní chyba, klient nemůže opravit
      return NextResponse.json(
        { error: "Interní chyba serveru. Zkuste to prosím znovu." },
        { status: 500 }
      );
    }

    console.error("POST /api/vehicles error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
