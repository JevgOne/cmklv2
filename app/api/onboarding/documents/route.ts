import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Maximalni velikost souboru: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// POST /api/onboarding/documents — upload dokumentu (krok 2)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    if (session.user.role !== "BROKER" || session.user.status !== "ONBOARDING") {
      return NextResponse.json(
        { error: "Tato akce je dostupna pouze pro maklere v onboardingu" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const tradeLicense = formData.get("trade_license") as File | null;
    const idFront = formData.get("id_front") as File | null;
    const idBack = formData.get("id_back") as File | null;

    if (!tradeLicense || !idFront || !idBack) {
      return NextResponse.json(
        { error: "Vsechny dokumenty jsou povinne (zivnostensky list, predni a zadni strana OP)" },
        { status: 400 }
      );
    }

    // Validace velikosti a typu souboru
    const files = [
      { name: "trade_license", file: tradeLicense },
      { name: "id_front", file: idFront },
      { name: "id_back", file: idBack },
    ];

    for (const { name, file } of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Soubor "${name}" je prilis velky (max 10 MB)` },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Soubor "${name}" ma nepodporovany format. Povolene: JPG, PNG, WebP, PDF` },
          { status: 400 }
        );
      }
    }

    // Upload na Cloudinary
    const folder = `carmakler/onboarding/${session.user.id}`;

    const [tradeLicenseUrl, idFrontUrl, idBackUrl] = await Promise.all([
      uploadToCloudinary(tradeLicense, folder),
      uploadToCloudinary(idFront, folder),
      uploadToCloudinary(idBack, folder),
    ]);

    const documentsData = {
      tradeLicense: tradeLicenseUrl,
      idFront: idFrontUrl,
      idBack: idBackUrl,
    };

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        documents: JSON.stringify(documentsData),
        onboardingStep: 3, // posun na krok 3 (skoleni + kviz)
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
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}
