import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  PUT /api/contracts/[id]/sign — Uložení podpisů                     */
/* ------------------------------------------------------------------ */

// Max ~500KB per signature base64 image (reasonable for a canvas-drawn signature PNG)
const MAX_SIGNATURE_LENGTH = 500_000;

const signContractSchema = z.object({
  sellerSignature: z
    .string()
    .min(1, "Podpis prodejce je povinný")
    .max(MAX_SIGNATURE_LENGTH, "Podpis prodejce je příliš velký"),
  brokerSignature: z
    .string()
    .min(1, "Podpis makléře je povinný")
    .max(MAX_SIGNATURE_LENGTH, "Podpis makléře je příliš velký"),
  sellerName: z.string().optional(),
  brokerName: z.string().optional(),
  signedLocation: z.string().nullable().optional(),
  signedAt: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check ownership
    const existing = await prisma.contract.findUnique({
      where: { id },
      select: { brokerId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Smlouva nenalezena" },
        { status: 404 }
      );
    }

    if (existing.brokerId !== session.user.id) {
      return NextResponse.json(
        { error: "Přístup odepřen" },
        { status: 403 }
      );
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Smlouva již byla podepsána" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = signContractSchema.parse(body);

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        sellerSignature: data.sellerSignature,
        brokerSignature: data.brokerSignature,
        signedAt: data.signedAt ? new Date(data.signedAt) : new Date(),
        signedLocation: data.signedLocation || null,
        status: "SIGNED",
      },
    });

    return NextResponse.json({ contract });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PUT /api/contracts/[id]/sign error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
