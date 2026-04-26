import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateApplicationSchema } from "@/lib/validators/marketplace";
import { sendEmail } from "@/lib/resend";
import bcrypt from "bcryptjs";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  GET /api/admin/marketplace/applications/[id] — Detail žádosti       */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const application = await prisma.marketplaceApplication.findUnique({
      where: { id },
      include: {
        reviewedBy: { select: { firstName: true, lastName: true } },
        convertedUser: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Žádost nenalezena" }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("GET /api/admin/marketplace/applications/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/marketplace/applications/[id] — Aktualizace stavu    */
/* ------------------------------------------------------------------ */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const application = await prisma.marketplaceApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: "Žádost nenalezena" }, { status: 404 });
    }

    const body = await request.json();
    const data = updateApplicationSchema.parse(body);

    const updateData: Record<string, unknown> = {
      status: data.status,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    };

    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;

    // Approve flow — vytvoření user account
    if (data.status === "APPROVED" && !application.convertedUserId) {
      // Check if user with same email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: application.email },
      });

      if (existingUser) {
        // Link existing user
        updateData.convertedUserId = existingUser.id;
      } else {
        // Generate random password
        const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        const newUser = await prisma.user.create({
          data: {
            email: application.email,
            firstName: application.firstName,
            lastName: application.lastName,
            phone: application.phone,
            role: application.role,
            status: "ACTIVE",
            passwordHash,
            companyName: application.companyName,
            ico: application.ico,
          },
        });

        updateData.convertedUserId = newUser.id;

        // Send welcome email with credentials
        const roleLabel = application.role === "VERIFIED_DEALER" ? "Realizátor" : "Investor";
        await sendEmail({
          to: application.email,
          subject: `Váš účet na CarMakléř Marketplace byl schválen — ${roleLabel}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #F97316, #EA580C); padding: 32px; border-radius: 16px 16px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Vítejte v CarMakléř Marketplace</h1>
              </div>
              <div style="background: white; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 16px 16px;">
                <p>Dobrý den, ${application.firstName},</p>
                <p>vaše žádost o přístup k Marketplace jako <strong>${roleLabel}</strong> byla schválena.</p>
                <div style="background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0 0 8px 0; font-weight: bold;">Přihlašovací údaje:</p>
                  <p style="margin: 4px 0;">Email: <strong>${application.email}</strong></p>
                  <p style="margin: 4px 0;">Heslo: <strong>${tempPassword}</strong></p>
                </div>
                <p style="color: #DC2626; font-size: 14px;">Po prvním přihlášení si prosím změňte heslo.</p>
                <a href="${process.env.NEXTAUTH_URL || "https://carmakler.cz"}/prihlaseni"
                   style="display: inline-block; background: #F97316; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: bold; margin-top: 16px;">
                  Přihlásit se
                </a>
              </div>
            </div>
          `,
        });
      }
    }

    const updated = await prisma.marketplaceApplication.update({
      where: { id },
      data: updateData,
      include: {
        reviewedBy: { select: { firstName: true, lastName: true } },
        convertedUser: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/admin/marketplace/applications/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
