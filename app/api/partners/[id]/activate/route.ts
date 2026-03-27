import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;

    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner) {
      return NextResponse.json({ error: "Partner nenalezen" }, { status: 404 });
    }

    if (!partner.email) {
      return NextResponse.json({ error: "Partner nema email" }, { status: 400 });
    }

    const role = partner.type === "AUTOBAZAR" ? "PARTNER_BAZAR" : "PARTNER_VRAKOVISTE";

    // Pokud partner uz ma propojeny ucet (self-registrace), jen aktivujeme
    if (partner.userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: partner.userId },
      });
      if (!existingUser) {
        return NextResponse.json({ error: "Propojeny uzivatel nenalezen" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: partner.userId },
          data: { status: "ACTIVE" },
        }),
        prisma.partner.update({
          where: { id },
          data: { status: "AKTIVNI_PARTNER" },
        }),
        prisma.partnerActivity.create({
          data: {
            partnerId: id,
            userId: session.user.id,
            type: "SYSTEM",
            title: "Partnerství aktivováno",
            description: `Aktivován existující účet: ${partner.email}, role: ${role}`,
            oldStatus: partner.status,
            newStatus: "AKTIVNI_PARTNER",
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        userId: partner.userId,
        email: partner.email,
        existingAccount: true,
      });
    }

    // Check if user with this email already exists (without partner link)
    const existingUser = await prisma.user.findUnique({
      where: { email: partner.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Uzivatel s timto emailem jiz existuje" },
        { status: 400 }
      );
    }

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user account and link to partner
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: partner.email,
          passwordHash,
          firstName: partner.contactPerson?.split(" ")[0] || partner.name,
          lastName: partner.contactPerson?.split(" ").slice(1).join(" ") || "",
          role,
          status: "ACTIVE",
          phone: partner.phone,
          companyName: partner.name,
          ico: partner.ico,
          logo: partner.logo,
        },
      }),
    ]);

    await prisma.partner.update({
      where: { id },
      data: {
        userId: user.id,
        status: "AKTIVNI_PARTNER",
      },
    });

    // Log activity
    await prisma.partnerActivity.create({
      data: {
        partnerId: id,
        userId: session.user.id,
        type: "SYSTEM",
        title: "Partnerství aktivováno",
        description: `Vytvořen účet: ${partner.email}, role: ${role}`,
        oldStatus: partner.status,
        newStatus: "AKTIVNI_PARTNER",
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: partner.email,
      temporaryPassword: password,
    });
  } catch (error) {
    console.error("POST /api/partners/[id]/activate error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
