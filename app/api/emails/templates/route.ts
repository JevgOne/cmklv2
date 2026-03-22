import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TEMPLATE_LIST } from "@/lib/email-templates";

/* ------------------------------------------------------------------ */
/*  GET /api/emails/templates — Seznam dostupných šablon               */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Pristup odepren" }, { status: 401 });
    }

    return NextResponse.json(TEMPLATE_LIST);
  } catch (error) {
    console.error("GET /api/emails/templates error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
