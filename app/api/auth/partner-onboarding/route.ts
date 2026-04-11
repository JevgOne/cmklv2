import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

// PATCH /api/auth/partner-onboarding — save partner onboarding step data
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (
      !PARTNER_ROLES.includes(session.user.role) ||
      session.user.status !== "ONBOARDING"
    ) {
      return NextResponse.json(
        { error: "Tato akce je dostupná pouze pro partnery v onboardingu" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { step, data } = body;

    if (step === 1) {
      // Step 1: Company profile
      const { companyName, ico, phone, street, city, zip, description } = data;

      if (!companyName?.trim() || !ico?.trim() || !phone?.trim()) {
        return NextResponse.json(
          { error: "Název firmy, IČO a telefon jsou povinné" },
          { status: 400 }
        );
      }

      if (!/^\d{8}$/.test(ico)) {
        return NextResponse.json(
          { error: "IČO musí mít přesně 8 číslic" },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          companyName: companyName.trim(),
          ico: ico.trim(),
          phone: phone.trim(),
          cities: JSON.stringify(
            [city?.trim(), zip?.trim()].filter(Boolean).length > 0
              ? [`${street?.trim() || ""}, ${city?.trim() || ""} ${zip?.trim() || ""}`]
              : []
          ),
          bio: description?.trim() || null,
          onboardingStep: 2,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (step === 2) {
      // Step 2: Documents
      const { documents } = data;

      if (!Array.isArray(documents) || documents.length < 2) {
        return NextResponse.json(
          { error: "Nahrajte oba dokumenty" },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          documents: JSON.stringify({
            businessLicense: documents[0],
            idCard: documents[1],
          }),
          onboardingStep: 3,
          status: "PENDING",
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Neplatný krok" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Partner onboarding error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
