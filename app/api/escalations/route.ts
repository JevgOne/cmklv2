import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEscalationSchema } from "@/lib/validators/escalation";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createEscalationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { type, urgency, description, attachments, vehicleId, contactId } = parsed.data;
    const brokerId = session.user.id;

    // Najít manažera makléře
    const broker = await prisma.user.findUnique({
      where: { id: brokerId },
      select: { managerId: true },
    });

    const escalation = await prisma.escalation.create({
      data: {
        brokerId,
        managerId: broker?.managerId || null,
        vehicleId: vehicleId || null,
        contactId: contactId || null,
        type,
        urgency,
        description,
        attachments: attachments ? JSON.stringify(attachments) : null,
        status: "OPEN",
      },
    });

    // Notifikace manažerovi
    if (broker?.managerId) {
      await createNotification({
        userId: broker.managerId,
        type: "SYSTEM",
        title: urgency === "URGENT" ? "Urgentní eskalace" : "Nová eskalace",
        body: `Makléř nahlásil problém: ${type}`,
        link: `/admin/escalations/${escalation.id}`,
      });
    }

    return NextResponse.json({ escalation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/escalations error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    let where: Record<string, unknown> = {};
    if (role === "BROKER") {
      where = { brokerId: userId };
    } else if (role === "MANAGER") {
      where = { managerId: userId };
    }
    // ADMIN/BACKOFFICE vidí vše

    const escalations = await prisma.escalation.findMany({
      where,
      include: {
        broker: {
          select: { id: true, firstName: true, lastName: true },
        },
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
        vehicle: {
          select: { id: true, brand: true, model: true, vin: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      escalations: escalations.map((e) => ({
        ...e,
        attachments: e.attachments ? JSON.parse(e.attachments) : [],
      })),
    });
  } catch (error) {
    console.error("GET /api/escalations error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
