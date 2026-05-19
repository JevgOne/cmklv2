import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;
    const role = session.user.role;
    const userId = session.user.id;

    const lead = await prisma.scoutLead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    if (lead.assignedToId) {
      return NextResponse.json(
        { error: "Lead je již přiřazen" },
        { status: 409 }
      );
    }

    // Category-based role check
    if (lead.category === "SOUKROMNIK") {
      if (!["BROKER", "MANAGER", "ADMIN", "BACKOFFICE"].includes(role)) {
        return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
      }
    } else if (lead.category === "AUTOBAZAR") {
      if (
        !["MANAGER", "REGIONAL_DIRECTOR", "ADMIN", "BACKOFFICE"].includes(role)
      ) {
        return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
      }
    } else if (lead.category === "VRAKOVISTE") {
      if (!["ADMIN", "BACKOFFICE"].includes(role)) {
        return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
      }
    }

    // Region check for REGIONAL_DIRECTOR
    if (role === "REGIONAL_DIRECTOR" && lead.regionId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { regionId: true },
      });
      if (user?.regionId && user.regionId !== lead.regionId) {
        return NextResponse.json(
          { error: "Lead není ve vašem regionu" },
          { status: 403 }
        );
      }
    }

    // Region check for BROKER
    if (role === "BROKER" && lead.regionId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { regionId: true },
      });
      if (user?.regionId && user.regionId !== lead.regionId) {
        return NextResponse.json(
          { error: "Lead není ve vašem regionu" },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.scoutLead.update({
      where: { id },
      data: {
        assignedToId: userId,
        assignedAt: new Date(),
      },
    });

    await prisma.scoutLeadActivity.create({
      data: {
        scoutLeadId: id,
        userId,
        type: "SYSTEM",
        title: "Převzato",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/scout-leads/[id]/claim error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
