import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = ADMIN_ROLES.includes(session.user.role);

    // Broker může vidět jen své vozidlo
    if (!isAdmin) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        select: { brokerId: true },
      });
      if (!vehicle || vehicle.brokerId !== session.user.id) {
        return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
      }
    }

    const comments = await prisma.vehicleComment.findMany({
      where: {
        vehicleId: id,
        // Broker nevidí interní komentáře
        ...(!isAdmin && { isInternal: false }),
      },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { firstName: true, lastName: true, role: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/vehicles/[id]/comments error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

const commentSchema = z.object({
  content: z.string().min(1, "Komentář nesmí být prázdný").max(2000),
  isInternal: z.boolean().optional().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = ADMIN_ROLES.includes(session.user.role);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { brokerId: true, brand: true, model: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
    }

    // Autorizace: admin/backoffice/manager NEBO vlastník
    if (!isAdmin && vehicle.brokerId !== session.user.id) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const body = await request.json();
    const data = commentSchema.parse(body);

    // Broker nemůže nastavit isInternal
    const isInternal = isAdmin ? data.isInternal : false;

    const comment = await prisma.vehicleComment.create({
      data: {
        vehicleId: id,
        userId: session.user.id,
        content: data.content,
        isInternal,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, role: true, avatar: true },
        },
      },
    });

    // Notifikace pro druhou stranu
    const vehicleName = `${vehicle.brand} ${vehicle.model}`;
    const authorName = `${session.user.firstName} ${session.user.lastName}`;
    const preview = data.content.length > 80 ? data.content.slice(0, 80) + "…" : data.content;

    if (isAdmin && vehicle.brokerId && !isInternal) {
      // Admin napsal → notifikace makléři
      await createNotification({
        userId: vehicle.brokerId,
        type: "MESSAGE",
        title: "Nový komentář k vozidlu",
        body: `${authorName}: "${preview}"`,
        link: `/makler/vehicles/${id}`,
      });
    } else if (!isAdmin && vehicle.brokerId === session.user.id) {
      // Makléř napsal → notifikace všem admin/backoffice
      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "BACKOFFICE"] }, status: "ACTIVE" },
        select: { id: true },
      });
      await Promise.all(
        admins.map((admin) =>
          createNotification({
            userId: admin.id,
            type: "MESSAGE",
            title: `Komentář od makléře — ${vehicleName}`,
            body: `${authorName}: "${preview}"`,
            link: `/admin/vehicles/${id}`,
          })
        )
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/vehicles/[id]/comments error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
