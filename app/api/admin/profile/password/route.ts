import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validators/settings";
import bcrypt from "bcryptjs";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const data = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Uživatel nemá nastavené heslo" },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Současné heslo je nesprávné" },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { error: "Neplatná data" },
        { status: 400 }
      );
    }
    console.error("PUT /api/admin/profile/password error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
