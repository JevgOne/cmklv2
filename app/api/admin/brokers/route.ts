import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    // Manager vidí jen své makléře, admin/backoffice všechny
    const isManager = session.user.role === "MANAGER";
    const where = {
      role: "BROKER" as const,
      ...(isManager ? { managerId: session.user.id } : {}),
    };

    // Aktivní makléři (ne-ONBOARDING)
    const brokers = await prisma.user.findMany({
      where: { ...where, status: { not: "ONBOARDING" } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        cities: true,
        createdAt: true,
        _count: {
          select: { vehicles: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = brokers.map((b) => ({
      id: b.id,
      name: `${b.firstName} ${b.lastName}`,
      email: b.email,
      phone: b.phone,
      region: b.cities ? (JSON.parse(b.cities) as string[])[0] || "—" : "—",
      vehicles: b._count.vehicles,
      status: b.status.toLowerCase() as "active" | "pending" | "rejected",
      createdAt: b.createdAt.toISOString(),
    }));

    // Onboarding makléři
    const onboardingUsers = await prisma.user.findMany({
      where: { ...where, status: "ONBOARDING" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        ico: true,
        bio: true,
        specializations: true,
        cities: true,
        quizScore: true,
        documents: true,
        onboardingStep: true,
        onboardingCompleted: true,
        brokerSignature: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const stepLabels: Record<number, string> = {
      1: "PROFILE",
      2: "DOCUMENTS",
      3: "TRAINING",
      4: "CONTRACT",
      5: "PENDING",
    };

    const onboardingBrokers = onboardingUsers.map((b) => ({
      id: b.id,
      name: `${b.firstName} ${b.lastName}`,
      email: b.email,
      phone: b.phone ?? "",
      avatar: b.avatar,
      ico: b.ico ?? undefined,
      bio: b.bio ?? undefined,
      specializations: b.specializations ? JSON.parse(b.specializations) : [],
      cities: b.cities ? JSON.parse(b.cities) : [],
      quizScore: b.quizScore ?? undefined,
      quizTotal: 10,
      documentsUploaded: !!b.documents,
      contractSigned: !!b.brokerSignature,
      onboardingStep: b.onboardingCompleted
        ? "PENDING"
        : stepLabels[b.onboardingStep] || "PROFILE",
      createdAt: b.createdAt.toISOString(),
    }));

    return NextResponse.json({ brokers: result, onboardingBrokers });
  } catch (error) {
    console.error("Admin brokers error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
