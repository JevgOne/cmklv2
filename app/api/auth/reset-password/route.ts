import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(32),
  password: z.string().min(8, "Heslo musi mit alespon 8 znaku"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = schema.parse(body);

    // Najit platny token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Neplatny nebo expirovaný odkaz" }, { status: 400 });
    }

    if (resetToken.used) {
      return NextResponse.json({ error: "Tento odkaz jiz byl pouzit" }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Odkaz vyprsel. Zadejte novou zadost." }, { status: 400 });
    }

    // Najit uzivatele
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Uzivatel nenalezen" }, { status: 404 });
    }

    // Zmenit heslo + oznacit token jako pouzity
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      // Invalidovat vsechny ostatni tokeny pro tento email
      prisma.passwordResetToken.updateMany({
        where: { email: resetToken.email, id: { not: resetToken.id }, used: false },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ message: "Heslo bylo uspesne zmeneno" });
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
