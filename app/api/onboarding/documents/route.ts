import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Maximalni velikost souboru: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * Upload jednoho souboru na Cloudinary pres REST API.
 * Pokud Cloudinary neni nakonfigurovano, ulozi placeholder URL.
 */
async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Dev mode — Cloudinary neni nakonfigurovano
  if (!cloudName || !apiKey || !apiSecret) {
    console.log(`[Cloudinary:DEV] Skipping upload for: ${file.name}`);
    return `dev_upload:${folder}/${file.name}`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  // Generovat signature pro Cloudinary upload
  const timestamp = Math.round(Date.now() / 1000).toString();
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;

  // SHA-1 hash pro Cloudinary signature
  const { createHash } = await import("crypto");
  const signature = createHash("sha1").update(paramsToSign).digest("hex");

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Cloudinary] Upload error:", response.status, errorBody);
    throw new Error(`Cloudinary upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.secure_url as string;
}

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
