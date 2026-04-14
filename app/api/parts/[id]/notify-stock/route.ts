import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const notifySchema = z.object({
  email: z.string().email("Neplatný email"),
});

/* ------------------------------------------------------------------ */
/*  POST /api/parts/[id]/notify-stock — "Upozornit na dostupnost"      */
/* ------------------------------------------------------------------ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: partId } = await params;
    const session = await getServerSession(authOptions);

    const body = await request.json();
    const data = notifySchema.parse(body);

    // Ověřit že díl existuje a je vyprodán
    const part = await prisma.part.findUnique({
      where: { id: partId },
      select: { id: true, stock: true },
    });

    if (!part) {
      return NextResponse.json({ error: "Díl nenalezen" }, { status: 404 });
    }

    if (part.stock > 0) {
      return NextResponse.json({ error: "Díl je skladem" }, { status: 400 });
    }

    // Upsert — pokud už existuje, nepřepisovat
    await prisma.stockNotification.upsert({
      where: {
        partId_email: { partId, email: data.email },
      },
      create: {
        partId,
        email: data.email,
        userId: session?.user?.id ?? null,
      },
      update: {
        notified: false, // reset pokud se přihlásil znovu
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/parts/[id]/notify-stock error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
