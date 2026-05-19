import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  convertToPartner,
  convertToLead,
} from "@/lib/scout-lead-management";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const role = session.user.role;
    const ALLOWED = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];
    if (!ALLOWED.includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const lead = await prisma.scoutLead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    if (lead.status === "WON") {
      return NextResponse.json(
        { error: "Lead je již konvertován" },
        { status: 409 }
      );
    }

    let result;
    let targetType: string;

    if (
      lead.category === "AUTOBAZAR" ||
      lead.category === "VRAKOVISTE"
    ) {
      result = await convertToPartner(id);
      targetType = "Partner";
    } else if (lead.category === "SOUKROMNIK") {
      result = await convertToLead(id);
      targetType = "Lead";
    } else {
      return NextResponse.json(
        { error: "Neznámá kategorie" },
        { status: 400 }
      );
    }

    await prisma.scoutLeadActivity.create({
      data: {
        scoutLeadId: id,
        userId: session.user.id,
        type: "KONVERZE",
        title: `Konvertováno na ${targetType} (${result.id})`,
        oldStatus: lead.status,
        newStatus: "WON",
      },
    });

    return NextResponse.json({
      converted: true,
      targetType,
      targetId: result.id,
    });
  } catch (error) {
    console.error("POST /api/scout-leads/[id]/convert error:", error);
    const message =
      error instanceof Error ? error.message : "Interní chyba serveru";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
