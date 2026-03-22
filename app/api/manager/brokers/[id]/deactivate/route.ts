import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Neprihlasen" }, { status: 401 });
    }

    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;

    // Overit ze makler patri pod tohoto manazera
    const broker = await prisma.user.findFirst({
      where: { id, managerId: session.user.id, role: "BROKER" },
    });

    if (!broker) {
      return NextResponse.json(
        { error: "Makler nenalezen nebo neni ve vasem tymu" },
        { status: 404 }
      );
    }

    if (broker.status === "INACTIVE") {
      return NextResponse.json(
        { error: "Makler je jiz neaktivni" },
        { status: 400 }
      );
    }

    // Archivovat aktivni vozidla maklere
    await prisma.vehicle.updateMany({
      where: {
        brokerId: id,
        status: { in: ["ACTIVE", "PENDING", "DRAFT"] },
      },
      data: { status: "ARCHIVED" },
    });

    // Deaktivovat maklere
    await prisma.user.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({
      message: "Makler byl deaktivovan a jeho vozidla archivovana",
    });
  } catch (error) {
    console.error("Manager broker deactivate error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}
