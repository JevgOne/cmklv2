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

    // TODO: Odeslat email přes Resend
    // const registrationUrl = `${process.env.NEXTAUTH_URL}/registrace/makler?token=${token}`;
    // await resend.emails.send({ ... });

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
