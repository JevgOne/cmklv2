import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateListingSlug } from "@/lib/listings";
import { autoFlagListing } from "@/lib/listing-flagging";
import { getQuickFilterBySlug, quickFilterToWhere } from "@/lib/listing-quick-filters";

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                        */
/* ------------------------------------------------------------------ */

const createListingSchema = z.object({
  // Vozidlo
  vin: z.string().optional(),
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

  // Stav
  condition: z.string().min(1),
  serviceBook: z.boolean().optional(),
  stkValidUntil: z.string().optional(),
  odometerStatus: z.string().optional(),
  ownerCount: z.number().int().optional(),
  originCountry: z.string().optional(),

  // Cena
  price: z.number().int().min(0),
  priceNegotiable: z.boolean().default(false),
  vatStatus: z.string().optional(),

  // Kontakt
  contactName: z.string().min(1, "Jméno je povinné"),
  contactPhone: z.string().min(9, "Telefon je povinný"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  city: z.string().min(1, "Město je povinné"),
  district: z.string().optional(),

  // Obsah
  description: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),

  // Propojení
  wantsBrokerHelp: z.boolean().default(false),
  vehicleId: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  POST /api/listings — Vytvoření inzerátu                           */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const body = await request.json();
    const data = createListingSchema.parse(body);

    // Určit listingType na základě role uživatele
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, accountType: true },
    });

    let listingType = "PRIVATE";
    if (user?.role === "BROKER" || user?.role === "MANAGER") {
      listingType = "BROKER";
    } else if (user?.accountType === "DEALER" || user?.accountType === "BAZAAR") {
      listingType = "DEALER";
    }

    // Automatické schválení
    const autoApprove = listingType === "BROKER" || listingType === "DEALER";

    const slug = generateListingSlug(data.brand, data.model, data.year);

    const listing = await prisma.listing.create({
      data: {
        slug,
        listingType,
        userId: session.user.id,
        vehicleId: data.vehicleId ?? null,
        vin: data.vin ?? null,
        brand: data.brand,
        model: data.model,
        variant: data.variant ?? null,
        year: data.year,
        mileage: data.mileage,
        fuelType: data.fuelType,
        transmission: data.transmission,
        enginePower: data.enginePower ?? null,
        engineCapacity: data.engineCapacity ?? null,
        bodyType: data.bodyType ?? null,
        color: data.color ?? null,
        doorsCount: data.doorsCount ?? null,
        seatsCount: data.seatsCount ?? null,
        condition: data.condition,
        serviceBook: data.serviceBook ?? false,
        stkValidUntil: data.stkValidUntil ? new Date(data.stkValidUntil) : null,
        odometerStatus: data.odometerStatus ?? null,
        ownerCount: data.ownerCount ?? null,
        originCountry: data.originCountry ?? null,
        price: data.price,
        priceNegotiable: data.priceNegotiable,
        vatStatus: data.vatStatus ?? null,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail || null,
        city: data.city,
        district: data.district ?? null,
        description: data.description ?? null,
        equipment: data.equipment ? JSON.stringify(data.equipment) : null,
        highlights: data.highlights ? JSON.stringify(data.highlights) : null,
        wantsBrokerHelp: data.wantsBrokerHelp,
        status: autoApprove ? "ACTIVE" : "ACTIVE", // V MVP automatické schválení pro všechny
        publishedAt: new Date(),
      },
      include: {
        images: true,
      },
    });

    // Auto-flag po vytvoření
    const flagResult = await autoFlagListing(listing.id);

    return NextResponse.json({ listing, flagResult }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/listings error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/listings — Seznam inzerátů s filtrací                    */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    // Build where clause
    const where: Record<string, unknown> = { status: "ACTIVE" };

    // Quick filter — předdefinované presety
    const quickFilterSlug = params.get("quickFilter");
    if (quickFilterSlug) {
      const quickFilter = getQuickFilterBySlug(quickFilterSlug);
      if (quickFilter) {
        const presetWhere = quickFilterToWhere(quickFilter);
        Object.assign(where, presetWhere);
      }
    }

    // Manuální filtry (přepisují quick filter pokud jsou zadané)
    if (params.get("brand")) where.brand = params.get("brand");
    if (params.get("model")) where.model = params.get("model");
    if (params.get("fuelType")) where.fuelType = params.get("fuelType");
    if (params.get("transmission")) where.transmission = params.get("transmission");
    if (params.get("bodyType")) where.bodyType = params.get("bodyType");
    if (params.get("listingType")) where.listingType = params.get("listingType");
    if (params.get("city")) where.city = params.get("city");

    // Price range
    if (params.get("minPrice") || params.get("maxPrice")) {
      const priceFilter: Record<string, number> = {};
      if (params.get("minPrice")) priceFilter.gte = parseInt(params.get("minPrice")!, 10);
      if (params.get("maxPrice")) priceFilter.lte = parseInt(params.get("maxPrice")!, 10);
      where.price = priceFilter;
    }

    // Year range
    if (params.get("minYear") || params.get("maxYear")) {
      const yearFilter: Record<string, number> = {};
      if (params.get("minYear")) yearFilter.gte = parseInt(params.get("minYear")!, 10);
      if (params.get("maxYear")) yearFilter.lte = parseInt(params.get("maxYear")!, 10);
      where.year = yearFilter;
    }

    // Sort
    type SortOrder = "asc" | "desc";
    let orderBy: Record<string, SortOrder>[];
    switch (params.get("sort")) {
      case "cheapest":
        orderBy = [{ price: "asc" }];
        break;
      case "expensive":
        orderBy = [{ price: "desc" }];
        break;
      case "lowestkm":
        orderBy = [{ mileage: "asc" }];
        break;
      case "newest":
      default:
        // Premium inzeráty nahoře
        orderBy = [{ isPremium: "desc" }, { createdAt: "desc" }];
        break;
    }

    // Pagination
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(params.get("limit") || "18", 10));
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          user: {
            select: { id: true, firstName: true, lastName: true, companyName: true, accountType: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/listings error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
