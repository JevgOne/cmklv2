import { NextRequest, NextResponse } from "next/server";
import { getSessionOrMobileToken } from "@/lib/auth-mobile";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrMobileToken(request);
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
