import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — nacist workflow checklist
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neprihlasen" }, { status: 401 });
  }

  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { workflowChecklist: true, brokerId: true },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
  }

  if (
    vehicle.brokerId !== session.user.id &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "BACKOFFICE"
  ) {
    return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
  }

  const data = vehicle.workflowChecklist
    ? JSON.parse(vehicle.workflowChecklist)
    : { steps: {}, lastUpdated: new Date().toISOString() };

  return NextResponse.json(data);
}

// PUT — ulozit workflow checklist
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neprihlasen" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { brokerId: true },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
  }

  if (
    vehicle.brokerId !== session.user.id &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "BACKOFFICE"
  ) {
    return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
  }

  await prisma.vehicle.update({
    where: { id },
    data: {
      workflowChecklist: JSON.stringify({
        ...body,
        lastUpdated: new Date().toISOString(),
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
