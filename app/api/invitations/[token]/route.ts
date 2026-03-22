import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/invitations/[token] — ověření tokenu pozvánky
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        manager: {
          select: { firstName: true, lastName: true },
        },
        region: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Pozvánka nebyla nalezena" },
        { status: 404 }
      );
    }

    if (invitation.status === "USED") {
      return NextResponse.json(
        { error: "Tato pozvánka již byla použita" },
        { status: 410 }
      );
    }

    if (invitation.status === "EXPIRED" || invitation.expiresAt < new Date()) {
      // Označit jako expirovanou, pokud ještě nebyla
      if (invitation.status !== "EXPIRED") {
        await prisma.invitation.update({
          where: { token },
          data: { status: "EXPIRED" },
        });
      }

      return NextResponse.json(
        { error: "Platnost pozvánky vypršela" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        name: invitation.name,
        manager: `${invitation.manager.firstName} ${invitation.manager.lastName}`,
        region: invitation.region,
      },
    });
  } catch (error) {
    console.error("Verify invitation error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
