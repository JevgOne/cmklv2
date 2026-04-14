import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const offerSchema = z.object({
  partName: z.string().min(1, "Název dílu je povinný"),
  price: z.number().int().min(1, "Cena musí být alespoň 1 Kč"),
  condition: z.enum(["FUNCTIONAL", "WITH_DEFECT"]),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const SUPPLIER_ROLES = ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE"];

/* ------------------------------------------------------------------ */
/*  POST /api/part-requests/[id]/offer — Nabídnout díl na poptávku     */
/* ------------------------------------------------------------------ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (!SUPPLIER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = offerSchema.parse(body);

    // Ověřit že poptávka existuje a je otevřená
    const partRequest = await prisma.partRequest.findUnique({
      where: { id },
      select: { id: true, status: true, expiresAt: true },
    });

    if (!partRequest) {
      return NextResponse.json({ error: "Poptávka nenalezena" }, { status: 404 });
    }

    if (!["OPEN", "OFFERS_RECEIVED"].includes(partRequest.status)) {
      return NextResponse.json({ error: "Poptávka je uzavřená" }, { status: 400 });
    }

    if (partRequest.expiresAt < new Date()) {
      return NextResponse.json({ error: "Poptávka vypršela" }, { status: 400 });
    }

    // Vytvořit nabídku + aktualizovat status poptávky
    const [offer] = await prisma.$transaction([
      prisma.partRequestOffer.create({
        data: {
          requestId: id,
          supplierId: session.user.id,
          partName: data.partName,
          price: data.price,
          condition: data.condition,
          description: data.description ?? null,
          imageUrl: data.imageUrl ?? null,
        },
      }),
      prisma.partRequest.update({
        where: { id },
        data: { status: "OFFERS_RECEIVED" },
      }),
    ]);

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/part-requests/[id]/offer error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
