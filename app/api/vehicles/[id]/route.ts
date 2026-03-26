import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/vehicles/[id] — Detail vozidla (dle id NEBO slug)         */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const isAdmin =
      session?.user?.role === "ADMIN" || session?.user?.role === "BACKOFFICE";
    const isOwnerOrAdmin = (brokerId: string | null) =>
      isAdmin || brokerId === session?.user?.id;

    // Hledání dle id nebo slug
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        images: { orderBy: { order: "asc" } },
        broker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            slug: true,
            avatar: true,
            cities: true,
            specializations: true,
          },
        },
        changeLog: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    // Neaktivní vozidla vidí pouze vlastník nebo admin
    if (vehicle.status !== "ACTIVE" && vehicle.status !== "SOLD") {
      if (!isOwnerOrAdmin(vehicle.brokerId)) {
        return NextResponse.json(
          { error: "Vozidlo nenalezeno" },
          { status: 404 }
        );
      }
    }

    // Inkrementace počtu zobrazení (fire-and-forget)
    prisma.vehicle
      .update({
        where: { id: vehicle.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {
        /* noncritical */
      });

    // ChangeLog obsahuje interní data — viditelný pouze vlastníkovi a adminovi
    const responseVehicle = isOwnerOrAdmin(vehicle.brokerId)
      ? vehicle
      : { ...vehicle, changeLog: undefined };

    return NextResponse.json({ vehicle: responseVehicle });
  } catch (error) {
    console.error("GET /api/vehicles/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/vehicles/[id] — Úprava vozidla (vyžaduje auth)          */
/* ------------------------------------------------------------------ */

const updateVehicleSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  variant: z.string().optional(),
  year: z.number().int().optional(),
  mileage: z.number().int().min(0).optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  enginePower: z.number().int().optional(),
  engineCapacity: z.number().int().optional(),
  bodyType: z.string().optional(),
  color: z.string().optional(),
  doorsCount: z.number().int().optional(),
  seatsCount: z.number().int().optional(),
  condition: z.string().optional(),
  stkValidUntil: z.string().optional(),
  serviceBook: z.boolean().optional(),
  price: z.number().int().min(0).optional(),
  priceNegotiable: z.boolean().optional(),
  equipment: z.array(z.string()).optional(),
  description: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  vin: z.string().optional(),
  reason: z.string().optional(), // Důvod změny (povinný při změně ceny/km/roku)
  status: z.enum(["PENDING"]).optional(), // Povolená změna: DRAFT_QUICK -> PENDING
});

// Pole vyžadující důvod při změně
const FIELDS_REQUIRING_REASON = ["price", "mileage", "year"];

export async function PATCH(
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
    const data = updateVehicleSchema.parse(body);

    // Načtení existujícího vozidla
    const existing = await prisma.vehicle.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    // Autorizace: vlastník nebo admin
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (existing.brokerId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Nemáte oprávnění upravovat toto vozidlo" },
        { status: 403 }
      );
    }

    // Kontrola VIN lock
    if (data.vin && existing.vinLocked && data.vin !== existing.vin) {
      return NextResponse.json(
        { error: "VIN je uzamčen a nelze ho změnit" },
        { status: 403 }
      );
    }

    // Kontrola, zda je důvod uveden při změně citlivých polí
    const changedSensitiveFields = FIELDS_REQUIRING_REASON.filter(
      (field) =>
        data[field as keyof typeof data] !== undefined &&
        data[field as keyof typeof data] !== (existing as Record<string, unknown>)[field]
    );

    if (changedSensitiveFields.length > 0 && !data.reason) {
      return NextResponse.json(
        {
          error: `Při změně polí ${changedSensitiveFields.join(", ")} je vyžadován důvod (reason)`,
        },
        { status: 400 }
      );
    }

    // Vytvoření change log záznamů
    const changeLogEntries: {
      vehicleId: string;
      userId: string;
      field: string;
      oldValue: string | null;
      newValue: string | null;
      reason: string | null;
      flagged: boolean;
      flagReason: string | null;
    }[] = [];

    for (const field of FIELDS_REQUIRING_REASON) {
      const newValue = data[field as keyof typeof data];
      if (newValue === undefined) continue;

      const oldValue = (existing as Record<string, unknown>)[field];
      if (newValue === oldValue) continue;

      let flagged = false;
      let flagReason: string | null = null;

      // Flag: sleva > 10%
      if (field === "price" && typeof oldValue === "number" && typeof newValue === "number") {
        const drop = (oldValue - newValue) / oldValue;
        if (drop > 0.1) {
          flagged = true;
          flagReason = `Cena klesla o ${Math.round(drop * 100)}% (z ${oldValue} na ${newValue})`;
        }
      }

      // Flag: změna nájezdu > 5000 km jakýmkoli směrem
      if (field === "mileage" && typeof oldValue === "number" && typeof newValue === "number") {
        const diff = Math.abs(newValue - oldValue);
        if (diff > 5000) {
          flagged = true;
          flagReason = `Nájezd změněn o ${diff} km (z ${oldValue} km na ${newValue} km)`;
        }
      }

      // Flag: změna roku výroby — vždy
      if (field === "year") {
        flagged = true;
        flagReason = `Rok výroby změněn z ${oldValue} na ${newValue}`;
      }

      changeLogEntries.push({
        vehicleId: existing.id,
        userId: session.user.id,
        field,
        oldValue: oldValue != null ? String(oldValue) : null,
        newValue: newValue != null ? String(newValue) : null,
        reason: data.reason ?? null,
        flagged,
        flagReason,
      });
    }

    // Validace přechodu DRAFT_QUICK -> PENDING
    if (data.status === "PENDING") {
      if (existing.status !== "DRAFT_QUICK" && existing.status !== "DRAFT") {
        return NextResponse.json(
          { error: "Změna stavu na PENDING je povolena pouze z DRAFT nebo DRAFT_QUICK" },
          { status: 400 }
        );
      }
    }

    // Build update data (bez reason)
    const { reason: _reason, vin: _vin, ...updateFields } = data;

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        if (key === "equipment" && Array.isArray(value)) {
          updateData[key] = JSON.stringify(value);
        } else if (key === "stkValidUntil" && typeof value === "string") {
          updateData[key] = new Date(value);
        } else {
          updateData[key] = value;
        }
      }
    }

    // VIN update (pokud není locked)
    if (data.vin && !existing.vinLocked) {
      updateData.vin = data.vin;
    }

    // Provést update + change log v transakci
    const vehicle = await prisma.$transaction(async (tx) => {
      if (changeLogEntries.length > 0) {
        await tx.vehicleChangeLog.createMany({ data: changeLogEntries });
      }

      return tx.vehicle.update({
        where: { id: existing.id },
        data: updateData,
        include: {
          images: { orderBy: { order: "asc" } },
          broker: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });
    });

    return NextResponse.json({ vehicle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PATCH /api/vehicles/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
