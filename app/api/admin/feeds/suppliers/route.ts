import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  GET /api/admin/feeds/suppliers — Seznam uzivatelu pro feed config  */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const suppliers = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
      orderBy: [
        { companyName: "asc" },
        { lastName: "asc" },
      ],
      take: 100,
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("GET /api/admin/feeds/suppliers error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
