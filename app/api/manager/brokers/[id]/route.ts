import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBrokerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  ico: z.string().optional(),
  bankAccount: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Neprihlasen" }, { status: 401 });
    }

    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;

    // Overit ze makler patri pod tohoto manazera
    const broker = await prisma.user.findFirst({
      where: { id, managerId: session.user.id, role: "BROKER" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        bio: true,
        specializations: true,
        cities: true,
        ico: true,
        bankAccount: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            vehicles: true,
            commissions: true,
          },
        },
      },
    });

    if (!broker) {
      return NextResponse.json(
        { error: "Makler nenalezen nebo neni ve vasem tymu" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...broker,
      specializations: broker.specializations
        ? JSON.parse(broker.specializations)
        : [],
      cities: broker.cities ? JSON.parse(broker.cities) : [],
    });
  } catch (error) {
    console.error("Manager broker GET error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Neprihlasen" }, { status: 401 });
    }

    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;

    // Overit ze makler patri pod tohoto manazera
    const existingBroker = await prisma.user.findFirst({
      where: { id, managerId: session.user.id, role: "BROKER" },
    });

    if (!existingBroker) {
      return NextResponse.json(
        { error: "Makler nenalezen nebo neni ve vasem tymu" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateBrokerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatna data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { specializations, cities, ...rest } = parsed.data;

    const updateData: Record<string, unknown> = { ...rest };
    if (specializations !== undefined) {
      updateData.specializations = JSON.stringify(specializations);
    }
    if (cities !== undefined) {
      updateData.cities = JSON.stringify(cities);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Manager broker PUT error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}
