import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToServer } from "@/lib/upload";

// PUT /api/onboarding/profile — uložení profilu makléře (krok 1)
export async function PUT(request: Request) {
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

    // ProfileForm sends FormData
    const formData = await request.formData();
    const bio = formData.get("bio") as string | null;
    const specializations = formData.get("specializations") as string | null;
    const cities = formData.get("cities") as string | null;
    const iban = formData.get("iban") as string | null;

    // Validace
    let citiesArray: string[] = [];
    try {
      citiesArray = cities ? JSON.parse(cities) : [];
    } catch {
      citiesArray = [];
    }

    if (citiesArray.length === 0) {
      return NextResponse.json(
        { error: "Vyberte alespoň jedno město" },
        { status: 400 }
      );
    }

    if (!iban?.trim()) {
      return NextResponse.json(
        { error: "Bankovní účet je povinný" },
        { status: 400 }
      );
    }

    const ibanClean = iban.trim();
    // Czech bank account format: [předčíslí-]číslo_účtu/kód_banky (e.g. 1234567890/0800 or 19-1234567890/0800)
    if (!/^(\d{1,6}-)?(\d{1,10})\/\d{4}$/.test(ibanClean)) {
      return NextResponse.json(
        { error: "Neplatný formát účtu (očekáváno číslo účtu/kód banky, např. 1234567890/0800)" },
        { status: 400 }
      );
    }

    // Upload profilove fotky
    const photo = formData.get("photo") as File | null;
    let avatarUrl: string | null = null;
    if (photo && photo.size > 0) {
      try {
        avatarUrl = await uploadToServer(photo, `carmakler/avatars/${session.user.id}`);
      } catch (uploadError) {
        console.error("Avatar upload failed:", uploadError);
        // Pokracovat bez fotky — neni to bloker pro onboarding
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bio: bio || null,
        specializations: specializations || null,
        cities: JSON.stringify(citiesArray),
        bankAccount: iban,
        onboardingStep: 2, // posun na krok 2 (dokumenty)
        ...(avatarUrl && { avatar: avatarUrl }),
      },
      select: {
        id: true,
        onboardingStep: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Onboarding profile error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
