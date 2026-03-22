import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processSellerPayoutSchema } from "@/lib/validators/payment";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "BACKOFFICE"
    ) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = processSellerPayoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payout = await prisma.sellerPayout.findUnique({
      where: { id },
    });

    if (!payout) {
      return NextResponse.json(
        { error: "Výplata nenalezena" },
        { status: 404 }
      );
    }

    if (payout.status === "PAID") {
      return NextResponse.json(
        { error: "Výplata je již zpracována" },
        { status: 400 }
      );
    }

    await prisma.sellerPayout.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        bankReference: parsed.data.bankReference,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Process seller payout error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
