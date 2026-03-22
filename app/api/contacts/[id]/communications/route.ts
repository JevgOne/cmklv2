import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCommunicationSchema } from "@/lib/validators/contact";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;

    const contact = await prisma.sellerContact.findUnique({
      where: { id },
      select: { brokerId: true },
    });

    if (!contact) {
      return NextResponse.json({ error: "Kontakt nenalezen" }, { status: 404 });
    }
    if (contact.brokerId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const [communications, total] = await Promise.all([
      prisma.sellerCommunication.findMany({
        where: { contactId: id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sellerCommunication.count({ where: { contactId: id } }),
    ]);

    return NextResponse.json({
      communications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/contacts/[id]/communications error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

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

    const contact = await prisma.sellerContact.findUnique({
      where: { id },
      select: { brokerId: true },
    });

    if (!contact) {
      return NextResponse.json({ error: "Kontakt nenalezen" }, { status: 404 });
    }
    if (contact.brokerId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createCommunicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { nextFollowUp, followUpNote, ...commData } = parsed.data;

    const [communication] = await Promise.all([
      prisma.sellerCommunication.create({
        data: {
          ...commData,
          contactId: id,
          brokerId: session.user.id,
        },
      }),
      prisma.sellerContact.update({
        where: { id },
        data: {
          lastContactAt: new Date(),
          ...(nextFollowUp !== undefined
            ? {
                nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
                followUpNote: followUpNote ?? null,
              }
            : {}),
        },
      }),
    ]);

    return NextResponse.json(communication, { status: 201 });
  } catch (error) {
    console.error("POST /api/contacts/[id]/communications error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
