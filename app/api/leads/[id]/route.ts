import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            slug: true,
            phone: true,
            email: true,
          },
        },
        assignedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        region: { select: { id: true, name: true } },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    // Role-based access
    const role = session.user.role;
    const userId = session.user.id;

    if (role === "BROKER" && lead.assignedToId !== userId) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    if (role === "MANAGER") {
      const manager = await prisma.user.findUnique({
        where: { id: userId },
        select: { regionId: true },
      });
      if (manager?.regionId && lead.regionId !== manager.regionId) {
        return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
      }
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("GET /api/leads/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
