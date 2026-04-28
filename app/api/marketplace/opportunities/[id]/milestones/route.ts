import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMilestoneSchema } from "@/lib/validators/marketplace";
import { notifyMarketplace } from "@/lib/marketplace/notifications";
import {
  marketplaceRepairUpdateSubject,
  marketplaceRepairUpdateHtml,
  marketplaceRepairUpdateText,
} from "@/lib/email-templates/marketplace-repair-update";

interface Milestone {
  label: string;
  progressPct: number;
  photos?: string[];
  note?: string;
  date: string;
}

/* ------------------------------------------------------------------ */
/*  POST /api/marketplace/opportunities/[id]/milestones                */
/*  Dealer přidá milník opravy                                         */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const { id } = await params;

    const opportunity = await prisma.flipOpportunity.findUnique({
      where: { id },
      select: {
        id: true,
        dealerId: true,
        status: true,
        repairMilestones: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Příležitost nenalezena" },
        { status: 404 }
      );
    }

    // Jen owner dealer nebo admin
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (opportunity.dealerId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Pouze realizátor nebo admin může přidávat milníky" },
        { status: 403 }
      );
    }

    // Milníky lze přidávat jen v relevantních stavech
    const allowedStatuses = ["FUNDED", "IN_REPAIR", "FOR_SALE"];
    if (!allowedStatuses.includes(opportunity.status) && !isAdmin) {
      return NextResponse.json(
        { error: "Milníky lze přidávat jen v průběhu opravy" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = createMilestoneSchema.parse(body);

    // Parse existing milestones
    let milestones: Milestone[] = [];
    if (opportunity.repairMilestones) {
      try {
        milestones = JSON.parse(opportunity.repairMilestones) as Milestone[];
      } catch { /* start fresh */ }
    }

    // Add new milestone
    const newMilestone: Milestone = {
      label: data.label,
      progressPct: data.progressPct,
      photos: data.photos,
      note: data.note,
      date: new Date().toISOString(),
    };
    milestones.push(newMilestone);

    // Update opportunity
    await prisma.flipOpportunity.update({
      where: { id },
      data: {
        repairMilestones: JSON.stringify(milestones),
        repairProgress: data.progressPct,
      },
    });

    // Notify investors about repair update (fire-and-forget)
    const opp = await prisma.flipOpportunity.findUnique({
      where: { id },
      select: { brand: true, model: true, year: true, investments: { select: { investorId: true }, distinct: ["investorId"] } },
    });
    if (opp) {
      const carTitle = `${opp.brand} ${opp.model} ${opp.year}`;
      const link = `/marketplace/deals/${id}`;
      const investorIds = opp.investments.map((i) => i.investorId);
      if (investorIds.length > 0) {
        const baseEmailData = {
          carTitle,
          milestoneName: data.label,
          progressPct: data.progressPct,
          note: data.note,
          link: `${process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"}${link}`,
        };
        notifyMarketplace({
          type: "REPAIR_UPDATE",
          opportunityId: id,
          recipientIds: investorIds,
          title: `Oprava — ${data.progressPct}%`,
          body: `${carTitle}: ${data.label}`,
          link,
          email: (recipientName) => {
            const emailData = { ...baseEmailData, recipientName };
            return {
              subject: marketplaceRepairUpdateSubject(emailData),
              html: marketplaceRepairUpdateHtml(emailData),
              text: marketplaceRepairUpdateText(emailData),
            };
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      milestone: newMilestone,
      milestones,
      repairProgress: data.progressPct,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/marketplace/opportunities/[id]/milestones error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/marketplace/opportunities/[id]/milestones                 */
/*  Načíst milníky + progress                                         */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const { id } = await params;

    const opportunity = await prisma.flipOpportunity.findUnique({
      where: { id },
      select: {
        id: true,
        repairProgress: true,
        repairMilestones: true,
        status: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Příležitost nenalezena" },
        { status: 404 }
      );
    }

    let milestones: Milestone[] = [];
    if (opportunity.repairMilestones) {
      try {
        milestones = JSON.parse(opportunity.repairMilestones) as Milestone[];
      } catch { /* empty */ }
    }

    return NextResponse.json({
      milestones,
      repairProgress: opportunity.repairProgress,
      status: opportunity.status,
    });
  } catch (error) {
    console.error("GET /api/marketplace/opportunities/[id]/milestones error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
