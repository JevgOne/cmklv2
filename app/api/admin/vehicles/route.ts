import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (!["ADMIN", "BACKOFFICE", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const vehicles = await prisma.vehicle.findMany({
      include: {
        broker: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = vehicles.map((v) => ({
      id: v.id,
      name: `${v.brand} ${v.model}`,
      vin: v.vin,
      brokerName: v.broker
        ? `${v.broker.firstName} ${v.broker.lastName}`
        : v.contactName || "Soukromý",
      brokerInitials: v.broker
        ? `${v.broker.firstName[0] || ""}${v.broker.lastName[0] || ""}`
        : (v.contactName || "S")[0] || "S",
      price: `${v.price.toLocaleString("cs-CZ")} Kč`,
      status: v.status.toLowerCase() as
        | "active"
        | "pending"
        | "rejected"
        | "sold"
        | "draft",
      trustScore: v.trustScore,
      date: v.createdAt.toLocaleDateString("cs-CZ"),
      imageUrl: v.images[0]?.url || null,
    }));

    return NextResponse.json({ vehicles: result });
  } catch (error) {
    console.error("Admin vehicles error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

const createVehicleSchema = z.object({
  vin: z.string().length(17, "VIN musí mít 17 znaků"),
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  variant: z.string().optional().default(""),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0),
  fuelType: z.string().min(1),
  transmission: z.string().min(1),
  bodyType: z.string().optional().default(""),
  condition: z.string().min(1),
  price: z.number().int().min(0),
  enginePower: z.number().int().nullable().optional(),
  engineCapacity: z.number().int().nullable().optional(),
  color: z.string().optional().default(""),
  description: z.string().optional().default(""),
  contactName: z.string().optional().default(""),
  contactPhone: z.string().optional().default(""),
  contactEmail: z.string().optional().default(""),
  city: z.string().min(1, "Město je povinné").default("Praha"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }
    if (!["ADMIN", "BACKOFFICE", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Neplatná data" },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // Check VIN uniqueness
    const existing = await prisma.vehicle.findUnique({ where: { vin: d.vin } });
    if (existing) {
      return NextResponse.json(
        { error: `Vozidlo s VIN ${d.vin} již existuje` },
        { status: 409 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        vin: d.vin,
        brand: d.brand,
        model: d.model,
        variant: d.variant || null,
        year: d.year,
        mileage: d.mileage,
        fuelType: d.fuelType,
        transmission: d.transmission,
        bodyType: d.bodyType || null,
        condition: d.condition,
        price: d.price,
        enginePower: d.enginePower ?? null,
        engineCapacity: d.engineCapacity ?? null,
        color: d.color || null,
        description: d.description || null,
        contactName: d.contactName || null,
        contactPhone: d.contactPhone || null,
        contactEmail: d.contactEmail || null,
        city: d.city,
        sellerType: "ADMIN",
        status: "ACTIVE",
        trustScore: 100,
      },
    });

    return NextResponse.json({ vehicle: { id: vehicle.id } }, { status: 201 });
  } catch (error) {
    console.error("Admin create vehicle error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
