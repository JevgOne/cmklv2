import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generatePassword, slugify } from "@/lib/utils";
import { sendEmail } from "@/lib/resend";
import { createPartnerWithAccountSchema } from "@/lib/validators/partner";

const BASE_URL = process.env.NEXTAUTH_URL || "https://carmakler.cz";

export async function POST(request: NextRequest) {
  try {
    // Auth: pouze ADMIN a BACKOFFICE
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = createPartnerWithAccountSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Duplicate check: email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Uživatel s tímto emailem již existuje" },
        { status: 400 }
      );
    }

    // Duplicate check: partner name slug
    const slug = slugify(data.name);
    const existingPartner = await prisma.partner.findUnique({
      where: { slug },
    });

    const finalSlug = existingPartner
      ? `${slug}-${Date.now().toString(36)}`
      : slug;

    // Generate password
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    // Role based on type
    const role = data.type === "AUTOBAZAR" ? "PARTNER_BAZAR" : "PARTNER_VRAKOVISTE";

    // Split contact person into first/last name
    const nameParts = data.contactPerson.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    // Transaction: create Partner + User atomically
    const result = await prisma.$transaction(async (tx) => {
      const partner = await tx.partner.create({
        data: {
          name: data.name,
          slug: finalSlug,
          type: data.type,
          status: "AKTIVNI_PARTNER",
          email: data.email,
          contactPerson: data.contactPerson,
          phone: data.phone || null,
          ico: data.ico || null,
          address: data.address || null,
          city: data.city || null,
          region: data.region || null,
          zip: data.zip || null,
          notes: data.notes || null,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName,
          lastName,
          role,
          status: "ACTIVE",
          phone: data.phone || null,
          companyName: data.name,
          ico: data.ico || null,
        },
      });

      await tx.partner.update({
        where: { id: partner.id },
        data: { userId: user.id },
      });

      await tx.partnerActivity.create({
        data: {
          partnerId: partner.id,
          userId: session.user.id,
          type: "SYSTEM",
          title: "Účet vytvořen adminem",
          description: `Vytvořen účet: ${data.email}, role: ${role}`,
          newStatus: "AKTIVNI_PARTNER",
        },
      });

      return { partner, user };
    });

    // Send welcome email (non-blocking)
    await sendEmail({
      to: data.email,
      subject: "Váš účet na Carmakler — přihlašovací údaje",
      html: `
        <h2>Vítejte v Carmakler!</h2>
        <p>Váš partnerský účet byl vytvořen. Přihlaste se na:</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Heslo:</strong> ${password}</p>
        <p><a href="${BASE_URL}/login">Přihlásit se</a></p>
        <p>Po prvním přihlášení si prosím změňte heslo.</p>
      `,
    });

    return NextResponse.json({
      partner: {
        id: result.partner.id,
        name: result.partner.name,
        slug: result.partner.slug,
        type: result.partner.type,
      },
      credentials: {
        email: data.email,
        temporaryPassword: password,
      },
    });
  } catch (error) {
    console.error("POST /api/partners/create-with-account error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
