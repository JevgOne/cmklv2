import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLeadStatusSchema } from "@/lib/validators/lead";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    // Broker can only update own leads, manager/admin can update any
    const role = session.user.role;
    const userId = session.user.id;

    if (role === "BROKER" && lead.assignedToId !== userId) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    if (!["ADMIN", "BACKOFFICE", "REGIONAL_DIRECTOR", "MANAGER", "BROKER"].includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const data = updateLeadStatusSchema.parse(body);

    // Validate status transitions
    const updateData: Record<string, unknown> = {
      status: data.status,
    };

    if (data.status === "REJECTED") {
      updateData.rejectionReason = data.rejectionReason || null;
    }

    if (data.status === "VEHICLE_ADDED" && data.vehicleId) {
      // Verify vehicle exists
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
      });
      if (!vehicle) {
        return NextResponse.json(
          { error: "Vozidlo nenalezeno" },
          { status: 400 }
        );
      }
      updateData.vehicleId = data.vehicleId;
    }

    if (data.status === "MEETING_SCHEDULED" && data.meetingDate) {
      updateData.meetingDate = new Date(data.meetingDate);
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        vehicle: {
          select: { id: true, brand: true, model: true, slug: true },
        },
      },
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PUT /api/leads/[id]/status error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
