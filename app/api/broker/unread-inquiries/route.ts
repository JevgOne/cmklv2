import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const count = await prisma.vehicleInquiry.count({
      where: {
        brokerId: session.user.id,
        status: "NEW",
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("GET /api/broker/unread-inquiries error:", error);
    return NextResponse.json({ error: "Interní chyba" }, { status: 500 });
  }
}
