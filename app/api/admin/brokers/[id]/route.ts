import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    // Manager vidí jen své makléře
    const managerFilter = session.user.role === "MANAGER" ? { managerId: session.user.id } : {};

    const broker = await prisma.user.findFirst({
      where: { id, role: "BROKER", ...managerFilter },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        bio: true,
        specializations: true,
        cities: true,
        ico: true,
        bankAccount: true,
      },
    });

    if (!broker) {
      return NextResponse.json({ error: "Makléř nebyl nalezen" }, { status: 404 });
    }

    return NextResponse.json({
      broker: {
        ...broker,
        specializations: broker.specializations ? JSON.parse(broker.specializations) : [],
        cities: broker.cities ? JSON.parse(broker.cities) : [],
      },
    });
  } catch (error) {
    console.error("GET /api/admin/brokers/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

const updateBrokerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "INACTIVE"]).optional(),
  bio: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  ico: z.string().optional(),
  bankAccount: z.string().optional(),
});

const EDIT_ROLES = ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !EDIT_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateBrokerSchema.parse(body);

    // Manager může editovat jen své makléře, Regional Director jen ze svého regionu
    let editFilter: Record<string, string> = {};
    if (session.user.role === "MANAGER") {
      editFilter = { managerId: session.user.id };
    } else if (session.user.role === "REGIONAL_DIRECTOR") {
      const director = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { regionId: true },
      });
      if (director?.regionId) {
        editFilter = { regionId: director.regionId };
      }
    }

    const broker = await prisma.user.findFirst({
      where: { id, role: "BROKER", ...editFilter },
      select: { id: true },
    });

    if (!broker) {
      return NextResponse.json({ error: "Makléř nebyl nalezen" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.specializations !== undefined) updateData.specializations = JSON.stringify(data.specializations);
    if (data.cities !== undefined) updateData.cities = JSON.stringify(data.cities);
    if (data.ico !== undefined) updateData.ico = data.ico;
    if (data.bankAccount !== undefined) updateData.bankAccount = data.bankAccount;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
      },
    });

    return NextResponse.json({
      message: `Makléř ${updated.firstName} ${updated.lastName} byl aktualizován`,
      broker: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PATCH /api/admin/brokers/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
