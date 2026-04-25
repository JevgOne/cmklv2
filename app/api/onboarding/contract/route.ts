import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contractSignSchema } from "@/lib/validators/onboarding";
import { generateBrokerAgreement } from "@/lib/contract-templates/broker-agreement";
import { z } from "zod";

// GET /api/onboarding/contract — načtení obsahu smlouvy pro preview
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (session.user.role !== "BROKER" || session.user.status !== "ONBOARDING") {
      return NextResponse.json(
        { error: "Tato akce je dostupná pouze pro makléře v onboardingu" },
        { status: 403 }
      );
    }

    const broker = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        ico: true,
      },
    });

    if (!broker) {
      return NextResponse.json(
        { error: "Makléř nebyl nalezen" },
        { status: 404 }
      );
    }

    const contract = generateBrokerAgreement({
      brokerName: `${broker.firstName} ${broker.lastName}`,
      brokerIco: broker.ico ?? "",
      brokerEmail: broker.email,
      brokerPhone: broker.phone ?? "",
      date: new Date(),
    });

    // Převod na HTML pro zobrazení
    const html = `
      <h2 style="text-align:center;margin-bottom:1.5em;">${contract.title}</h2>
      <p style="text-align:center;color:#666;margin-bottom:2em;">${contract.date}</p>
      ${contract.sections
        .map(
          (s) => `
        <h3 style="margin-top:1.5em;margin-bottom:0.5em;">${s.heading}</h3>
        <div style="white-space:pre-line;">${s.content}</div>
      `
        )
        .join("")}
    `;

    return NextResponse.json({ html, contract });
  } catch (error) {
    console.error("Onboarding contract GET error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

// POST /api/onboarding/contract — podpis smlouvy (krok 5)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (session.user.role !== "BROKER" || session.user.status !== "ONBOARDING") {
      return NextResponse.json(
        { error: "Tato akce je dostupná pouze pro makléře v onboardingu" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = contractSignSchema.parse(body);

    // Načíst data makléře pro smlouvu
    const broker = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        ico: true,
      },
    });

    if (!broker) {
      return NextResponse.json(
        { error: "Makléř nebyl nalezen" },
        { status: 404 }
      );
    }

    // Generování obsahu smlouvy
    const contractContent = generateBrokerAgreement({
      brokerName: `${broker.firstName} ${broker.lastName}`,
      brokerIco: broker.ico ?? "",
      brokerEmail: broker.email,
      brokerPhone: broker.phone ?? "",
      date: new Date(),
    });

    // Uložit smlouvu a podpis, dokončit onboarding
    const updatedBroker = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        brokerSignature: data.signature,
        brokerContractUrl: JSON.stringify(contractContent),
        onboardingStep: 5,
        onboardingCompleted: true,
        // Status zůstane ONBOARDING — aktivaci provede manager/admin
      },
      select: { managerId: true, firstName: true, lastName: true },
    });

    // Notifikovat managera o dokončeném onboardingu
    if (updatedBroker.managerId) {
      try {
        await prisma.notification.create({
          data: {
            userId: updatedBroker.managerId,
            type: "BROKER_ONBOARDING_COMPLETE",
            title: "Nový makléř čeká na aktivaci",
            body: `${updatedBroker.firstName} ${updatedBroker.lastName} dokončil/a onboarding a čeká na schválení.`,
            link: "/admin/brokers",
          },
        });
      } catch (notifError) {
        console.error("Failed to notify manager:", notifError);
      }
    }

    return NextResponse.json({
      message: "Smlouva byla podepsána. Čekejte na aktivaci účtu.",
      contract: contractContent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Onboarding contract error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
