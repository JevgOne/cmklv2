import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { brokerRegistrationSchema } from "@/lib/validators/onboarding";
import { sendVerificationEmail } from "@/lib/email-verification";

// POST /api/auth/register/broker — registrace makléře přes pozvánku
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = brokerRegistrationSchema.parse(body);

    // Najít a ověřit pozvánku
    const invitation = await prisma.invitation.findUnique({
      where: { token: data.token },
      include: {
        manager: { select: { id: true } },
        region: { select: { id: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Neplatná pozvánka" },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Tato pozvánka již byla použita nebo vypršela" },
        { status: 410 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { token: data.token },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Platnost pozvánky vypršela" },
        { status: 410 }
      );
    }

    // Kontrola, zda email už neexistuje
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Uživatel s tímto emailem již existuje" },
        { status: 409 }
      );
    }

    // Hash hesla
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Vytvoření uživatele a označení pozvánky jako použité v transakci
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          ico: data.ico,
          role: "BROKER",
          status: "ONBOARDING",
          managerId: invitation.manager.id,
          regionId: invitation.region.id,
          onboardingStep: 1,
          onboardingCompleted: false,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          onboardingStep: true,
        },
      });

      // Označit pozvánku jako použitou
      await tx.invitation.update({
        where: { token: data.token },
        data: { status: "USED" },
      });

      return newUser;
    });

    // Odeslat verifikacni email
    try {
      await sendVerificationEmail(user.email, user.firstName);
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }

    return NextResponse.json({ user, emailVerificationRequired: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Broker registration error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
