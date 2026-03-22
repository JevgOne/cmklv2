import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/onboarding/documents — upload dokumentů (krok 2)
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

    const formData = await request.formData();
    const tradeLicense = formData.get("trade_license") as File | null;
    const idFront = formData.get("id_front") as File | null;
    const idBack = formData.get("id_back") as File | null;

    if (!tradeLicense || !idFront || !idBack) {
      return NextResponse.json(
        { error: "Všechny dokumenty jsou povinné (živnostenský list, přední a zadní strana OP)" },
        { status: 400 }
      );
    }

    // TODO: Upload souborů na Cloudinary a získat URL
    // Pro MVP uložíme placeholder s názvy souborů
    const documentsData = {
      tradeLicense: `pending_upload:${tradeLicense.name}`,
      idFront: `pending_upload:${idFront.name}`,
      idBack: `pending_upload:${idBack.name}`,
    };

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        documents: JSON.stringify(documentsData),
        onboardingStep: 3, // posun na krok 3 (školení + kvíz)
      },
      select: {
        id: true,
        onboardingStep: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Onboarding documents error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
