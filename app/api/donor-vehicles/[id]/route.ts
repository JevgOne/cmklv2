import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["PARTS_SUPPLIER", "ADMIN", "BACKOFFICE"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const donor = await prisma.donorVehicle.findUnique({
    where: { id },
    include: {
      parts: {
        include: { images: { take: 1 } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!donor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Supplier can only see own
  if (
    session.user.role === "PARTS_SUPPLIER" &&
    donor.supplierId !== session.user.id
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ donor });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const donor = await prisma.donorVehicle.findUnique({ where: { id } });
  if (!donor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    session.user.role === "PARTS_SUPPLIER" &&
    donor.supplierId !== session.user.id
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updated = await prisma.donorVehicle.update({
    where: { id },
    data: {
      status: body.status ?? undefined,
    },
  });

  return NextResponse.json({ donor: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const donor = await prisma.donorVehicle.findUnique({ where: { id } });
  if (!donor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    session.user.role === "PARTS_SUPPLIER" &&
    donor.supplierId !== session.user.id
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Soft delete — archive
  await prisma.donorVehicle.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json({ ok: true });
}
