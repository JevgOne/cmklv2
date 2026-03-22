import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBankAccountSchema } from "@/lib/validators/settings";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateBankAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { bankAccount } = parsed.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { bankAccount },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/settings/bank-account error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
