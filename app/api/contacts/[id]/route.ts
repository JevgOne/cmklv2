import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateContactSchema } from "@/lib/validators/contact";

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
      include: {
        vehicles: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            price: true,
            status: true,
            slug: true,
            city: true,
          },
          orderBy: { createdAt: "desc" },
        },
        communications: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: { select: { vehicles: true, communications: true } },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Kontakt nenalezen" }, { status: 404 });
    }

    if (contact.brokerId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("GET /api/contacts/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

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

    const existing = await prisma.sellerContact.findUnique({
      where: { id },
      select: { brokerId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kontakt nenalezen" }, { status: 404 });
    }
    if (existing.brokerId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { nextFollowUp, ...rest } = parsed.data;

    const contact = await prisma.sellerContact.update({
      where: { id },
      data: {
        ...rest,
        ...(nextFollowUp !== undefined
          ? { nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null }
          : {}),
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("PUT /api/contacts/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.sellerContact.findUnique({
      where: { id },
      select: { brokerId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kontakt nenalezen" }, { status: 404 });
    }
    if (existing.brokerId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    await prisma.sellerContact.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/contacts/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
