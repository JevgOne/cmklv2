import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Pouze ADMIN" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Heslo musí mít alespoň 6 znaků" },
        { status: 400 }
      );
    }

    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Uživatel nenalezen" }, { status: 404 });
    }

    const hash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id },
      data: { passwordHash: hash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/users/[id]/password error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
