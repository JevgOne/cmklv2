import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateAllBrokers } from "@/lib/reputation/recalculate";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const result = await recalculateAllBrokers();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("POST /api/reputation/recalculate error:", error);
    return NextResponse.json({ error: "Interní chyba" }, { status: 500 });
  }
}
