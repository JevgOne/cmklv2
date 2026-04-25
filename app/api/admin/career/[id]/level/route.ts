import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAR_LEVELS } from "@/lib/broker-points";

const levelOverrideSchema = z.object({
  level: z.enum(["STAR_1", "STAR_2", "STAR_3", "STAR_4", "STAR_5"]),
  reason: z.string().min(1, "Důvod je povinný"),
});

// PUT /api/admin/career/[id]/level — Snížení úrovně makléře
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // STOP-5: Pouze ADMIN nebo MANAGER (NE REGIONAL_DIRECTOR)
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Snížení úrovně může provést pouze ADMIN nebo MANAGER" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = levelOverrideSchema.parse(body);

    const broker = await prisma.user.findUnique({
      where: { id },
      select: { level: true, role: true },
    });

    if (!broker || broker.role !== "BROKER") {
      return NextResponse.json({ error: "Makléř nenalezen" }, { status: 404 });
    }

    // Validace: nová úroveň musí být NIŽŠÍ
    const currentIdx = STAR_LEVELS.findIndex((l) => l.key === broker.level);
    const newIdx = STAR_LEVELS.findIndex((l) => l.key === data.level);

    if (newIdx >= currentIdx) {
      return NextResponse.json(
        { error: "Nová úroveň musí být nižší než aktuální" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { level: data.level },
      }),
      prisma.brokerPointTransaction.create({
        data: {
          brokerId: id,
          type: "MANUAL_ADJUSTMENT",
          amount: 0,
          description: `Snížení úrovně z ${broker.level} na ${data.level}: ${data.reason}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, newLevel: data.level });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/admin/career/[id]/level error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
