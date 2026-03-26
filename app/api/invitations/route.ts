import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invitationSchema } from "@/lib/validators/onboarding";
import { randomUUID } from "crypto";
import { z } from "zod";

const MANAGER_ROLES = ["MANAGER", "REGIONAL_DIRECTOR", "ADMIN", "BACKOFFICE"];

// POST — vytvoření pozvánky
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (!MANAGER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();

    // regionId je volitelné — pokud není, použije se region manažera
    const email = body.email as string;
    const name = body.name as string | undefined;
    let regionId = body.regionId as string | undefined;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Neplatný formát emailu" },
        { status: 400 }
      );
    }

    // Pokud regionId není zadáno, použij region manažera
    if (!regionId) {
      const manager = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { regionId: true },
      });

      if (manager?.regionId) {
        regionId = manager.regionId;
      } else {
        // Fallback: vytvoř/najdi výchozí region
        const defaultRegion = await prisma.region.findFirst();
        if (!defaultRegion) {
          const newRegion = await prisma.region.create({
            data: { name: "Hlavní" },
          });
          regionId = newRegion.id;
        } else {
          regionId = defaultRegion.id;
        }
      }
    }

    // Kontrola, zda uživatel s tímto emailem již neexistuje
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Uživatel s tímto emailem již existuje" },
        { status: 409 }
      );
    }

    // Kontrola, zda neexistuje platná pozvánka
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Pro tento email již existuje platná pozvánka" },
        { status: 409 }
      );
    }

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Platnost 7 dní

    const invitation = await prisma.invitation.create({
      data: {
        email,
        name: name || null,
        token,
        managerId: session.user.id,
        regionId,
        status: "PENDING",
        expiresAt,
      },
      include: {
        manager: {
          select: { firstName: true, lastName: true },
        },
        region: {
          select: { name: true },
        },
      },
    });

    // Odeslat pozvanku emailem
    const registrationUrl = `${process.env.NEXTAUTH_URL || "https://carmakler.cz"}/registrace/makler?token=${token}`;
    const managerName = invitation.manager
      ? `${invitation.manager.firstName} ${invitation.manager.lastName}`.trim()
      : "Carmakler";
    const regionName = invitation.region?.name || "";

    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
          to: email,
          subject: "Pozvanka do Carmakler",
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px 32px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Carmakler</h1>
              </div>
              <div style="padding: 32px;">
                <p>Dobry den${name ? ` ${name}` : ""},</p>
                <p>manazer <strong>${managerName}</strong> vas zve do maklerskesiti Carmakler${regionName ? ` (region ${regionName})` : ""}.</p>
                <p>Pro dokonceni registrace kliknete na tlacitko nize:</p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${registrationUrl}"
                     style="background-color: #f97316; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                    Registrovat se jako makler
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Pozvanka je platna 7 dni. Pokud odkaz nefunguje, zkopirujte tuto adresu do prohlizece:</p>
                <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${registrationUrl}</p>
              </div>
              <div style="padding: 16px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  Tento email byl odeslan ze systemu Carmakler. |
                  <a href="https://carmakler.cz" style="color: #f97316; text-decoration: none;">carmakler.cz</a>
                </p>
              </div>
            </div>
          `,
        });
        console.log(`[Invitation] Email odeslan na ${email}`);
      } catch (emailError) {
        // Email se nepodarilo odeslat, ale pozvanku uz mame v DB
        console.error("[Invitation] Chyba pri odesilani emailu:", emailError);
      }
    } else {
      // Dev mode — bez Resend API klice
      console.log(`[Invitation:DEV] Registracni odkaz pro ${email}: ${registrationUrl}`);
    }

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Invitation create error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

// GET — seznam pozvánek manažera
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (!MANAGER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const where =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE"
        ? {}
        : { managerId: session.user.id };

    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        manager: {
          select: { firstName: true, lastName: true },
        },
        region: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Invitations list error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
