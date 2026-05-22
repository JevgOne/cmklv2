import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const city = searchParams.get("city") || undefined;
  const category = searchParams.get("category") || undefined;
  const tier = searchParams.get("tier") || undefined;
  const insurance = searchParams.get("insurance");
  const minRating = searchParams.get("minRating");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const search = searchParams.get("q") || undefined;

  const where: Record<string, unknown> = { isPublished: true };
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (category) where.categories = { has: category };
  if (tier) where.tier = tier;
  if (insurance === "true") where.insurancePartner = true;
  if (minRating) where.averageRating = { gte: parseFloat(minRating) };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  const [servisy, total] = await Promise.all([
    prisma.autoServis.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { averageRating: "desc" }, { reviewCount: "desc" }],
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.autoServis.count({ where }),
  ]);

  return NextResponse.json({
    servisy,
    total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
  });
}

const createSchema = z.object({
  name: z.string().min(2).max(200),
  city: z.string().min(2).max(100),
  description: z.string().max(5000).optional(),
  address: z.string().max(200).optional(),
  region: z.string().max(100).optional(),
  zip: z.string().max(10).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  web: z.string().max(200).optional(),
  categories: z.array(z.string()).default([]),
  brands: z.array(z.string()).default([]),
  tier: z.enum(["AUTORIZOVANY", "NEOFICIALNI"]).default("NEOFICIALNI"),
  insurancePartner: z.boolean().default(false),
  insuranceNames: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Přihlaste se" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatná data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, city, ...rest } = parsed.data;

  // STOP-4: slug from name + city
  const baseSlug = slugify(`${name} ${city}`);
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.autoServis.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";

  const servis = await prisma.autoServis.create({
    data: {
      name,
      city,
      slug,
      ...rest,
      isPublished: isAdmin,
      addedById: session.user.id,
      source: isAdmin ? "ADMIN" : "USER",
    },
  });

  return NextResponse.json(servis, { status: 201 });
}
