import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applySchema } from "@/lib/validators/marketplace";

/* ------------------------------------------------------------------ */
/*  POST /api/marketplace/apply — Žádost o přístup (dealer/investor)    */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    // Ověřit, že uživatel ještě nemá marketplace roli
    if (
      ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"].includes(
        session.user.role
      )
    ) {
      return NextResponse.json(
        { error: "Již máte přístup k marketplace" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = applySchema.parse(body);

    // Vytvořit notifikaci pro admina
    // V budoucnu: email přes Resend, Pusher notifikace
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });

    const applicant = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!applicant) {
      return NextResponse.json(
        { error: "Uživatel nenalezen" },
        { status: 404 }
      );
    }

    const roleLabel =
      data.role === "VERIFIED_DEALER" ? "ověřený dealer" : "investor";

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: "SYSTEM",
        title: `Nová žádost o přístup — ${roleLabel}`,
        body: `${applicant.firstName} ${applicant.lastName} (${applicant.email}) žádá o roli ${roleLabel}. Zpráva: ${data.message}`,
        link: `/admin/users/${session.user.id}`,
      })),
    });

    return NextResponse.json({
      message: "Žádost byla odeslána. Budeme vás kontaktovat.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/marketplace/apply error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
