import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  DELETE /api/garage/[id] — Smazat auto z garáže                     */
/* ------------------------------------------------------------------ */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;

    const car = await prisma.customerGarage.findUnique({ where: { id } });
    if (!car || car.userId !== session.user.id) {
      return NextResponse.json({ error: "Auto nenalezeno" }, { status: 404 });
    }

    await prisma.customerGarage.delete({ where: { id } });

    // Pokud smazané auto bylo default, nastavit nejnovější jako default
    if (car.isDefault) {
      const next = await prisma.customerGarage.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await prisma.customerGarage.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/garage/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/garage/[id] — Nastavit jako výchozí                       */
/* ------------------------------------------------------------------ */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;

    const car = await prisma.customerGarage.findUnique({ where: { id } });
    if (!car || car.userId !== session.user.id) {
      return NextResponse.json({ error: "Auto nenalezeno" }, { status: 404 });
    }

    // Reset všech default, pak set nový
    await prisma.$transaction([
      prisma.customerGarage.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      }),
      prisma.customerGarage.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/garage/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
