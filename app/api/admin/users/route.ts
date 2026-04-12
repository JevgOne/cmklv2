import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const role = params.get("role") || "";
    const status = params.get("status") || "";
    const search = params.get("search") || "";

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        phone: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Pouze ADMIN může měnit uživatele" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, status } = body;

    if (!userId) {
      return NextResponse.json({ error: "Chybí userId" }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, role: true, status: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
