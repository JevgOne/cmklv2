import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToServer } from "@/lib/upload";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf", ...ALLOWED_IMAGE_TYPES];

// Mapping upload_preset -> folder + allowed types
const PRESETS: Record<string, { folder: string; allowedTypes: string[]; watermark?: boolean; skipProcessing?: boolean }> = {
  vehicles: { folder: "carmakler/vehicles", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  listings: { folder: "carmakler/listings", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  parts: { folder: "carmakler/parts", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  invoices: { folder: "carmakler/invoices", allowedTypes: ALLOWED_DOC_TYPES, skipProcessing: true },
  contracts: { folder: "carmakler/contracts", allowedTypes: ALLOWED_DOC_TYPES, skipProcessing: true },
  damages: { folder: "carmakler/damages", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  // NEW (TASK-060) — profile avatar + cover, no watermark
  avatar: { folder: "carmakler/avatars", allowedTypes: ALLOWED_IMAGE_TYPES },
  cover: { folder: "carmakler/covers", allowedTypes: ALLOWED_IMAGE_TYPES },
  marketplace: { folder: "carmakler/marketplace", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  team: { folder: "carmakler/team", allowedTypes: ALLOWED_IMAGE_TYPES },
};

/**
 * POST /api/upload — Univerzalni upload souboru.
 *
 * FormData:
 * - file: File (povinny)
 * - upload_preset: string (povinny) — urcuje folder a povolene typy
 * - subfolder?: string (volitelny) — napr. userId nebo vehicleId
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const preset = formData.get("upload_preset") as string | null;
    const subfolder = formData.get("subfolder") as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Soubor je povinny" }, { status: 400 });
    }

    if (!preset || !PRESETS[preset]) {
      return NextResponse.json(
        { error: `Neplatny upload_preset. Povolene: ${Object.keys(PRESETS).join(", ")}` },
        { status: 400 }
      );
    }

    const { folder, allowedTypes } = PRESETS[preset];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Nepodporovany typ souboru: ${file.type}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Soubor je prilis velky (max 10 MB)" },
        { status: 400 }
      );
    }

    const targetFolder = subfolder ? `${folder}/${subfolder}` : folder;
    const { watermark, skipProcessing } = PRESETS[preset];
    const url = await uploadToServer(file, targetFolder, { watermark, skipProcessing });

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Chyba pri uploadu" }, { status: 500 });
  }
}
