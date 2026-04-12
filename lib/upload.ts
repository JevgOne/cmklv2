/**
 * Self-hosted upload: Sharp resize + watermark + WebP.
 * Nahrazuje Cloudinary — soubory se ukladaji na disk,
 * v produkci servirovane pres Nginx (files.carmakler.cz).
 *
 * Dev mode: pokud UPLOAD_DIR/UPLOAD_BASE_URL nejsou nastavene,
 * vrati placehold.co URL (projde Zod url() validaci).
 */

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";

// --- Config ---
const UPLOAD_DIR = process.env.UPLOAD_DIR; // /var/www/uploads
const UPLOAD_BASE_URL = process.env.UPLOAD_BASE_URL; // https://files.carmakler.cz

const MAX_IMAGE_WIDTH = 1920;
const WEBP_QUALITY = 85;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const WATERMARK_PATH = join(process.cwd(), "public/brand/logo-white.png");

const IMAGE_EXTENSIONS = new Set(["image/jpeg", "image/png", "image/webp"]);

interface UploadOptions {
  watermark?: boolean;
  skipProcessing?: boolean;
}

/**
 * Upload souboru na vlastni server.
 * @param file - File objekt (z FormData)
 * @param folder - cilovy folder (napr. "carmakler/vehicles/abc123")
 * @param options - watermark, skipProcessing
 * @returns Verejna URL souboru
 */
export async function uploadToServer(
  file: File,
  folder: string,
  options?: UploadOptions
): Promise<string> {
  // Dev mode — upload neni nakonfigurovano
  if (!UPLOAD_DIR || !UPLOAD_BASE_URL) {
    console.log(`[Upload:DEV] Skipping upload for: ${file.name}`);
    const label = encodeURIComponent(`dev-${folder.replace(/\//g, "-")}-${Date.now()}`);
    return `https://placehold.co/600x400/png?text=${label}`;
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${file.size} bytes (max ${MAX_FILE_SIZE})`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const isImage = IMAGE_EXTENSIONS.has(file.type);

  // Filename: timestamp + hash (unikatni, bez user inputu)
  const hash = createHash("md5").update(buffer).digest("hex").slice(0, 8);
  const timestamp = Date.now();
  const ext = isImage && !options?.skipProcessing ? "webp" : getExtension(file.name, file.type);
  const filename = `${timestamp}-${hash}.${ext}`;

  // Vytvorit adresar
  const targetDir = join(UPLOAD_DIR, folder);
  await mkdir(targetDir, { recursive: true });
  const targetPath = join(targetDir, filename);

  if (isImage && !options?.skipProcessing) {
    // Sharp processing pipeline
    const sharp = (await import("sharp")).default;

    let pipeline = sharp(buffer).resize({
      width: MAX_IMAGE_WIDTH,
      withoutEnlargement: true,
    });

    // Watermark overlay
    if (options?.watermark) {
      const metadata = await sharp(buffer).metadata();
      const imgWidth = metadata.width || MAX_IMAGE_WIDTH;
      const watermarkWidth = Math.round(imgWidth * 0.15);

      const watermarkBuffer = await sharp(WATERMARK_PATH)
        .resize({ width: watermarkWidth })
        .ensureAlpha()
        .composite([
          {
            input: Buffer.from([0, 0, 0, Math.round(255 * 0.4)]),
            raw: { width: 1, height: 1, channels: 4 },
            tile: true,
            blend: "dest-in",
          },
        ])
        .toBuffer();

      pipeline = pipeline.composite([
        {
          input: watermarkBuffer,
          gravity: "southeast",
        },
      ]);
    }

    const outputBuffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();

    await writeFile(targetPath, outputBuffer);
  } else {
    // PDF/dokumenty — ulozit as-is
    await writeFile(targetPath, buffer);
  }

  // Vratit verejnou URL
  return `${UPLOAD_BASE_URL}/${folder}/${filename}`;
}

/**
 * Ziskani optimalizovane URL pro zobrazeni.
 * Self-hosted: uz optimalizovano pri uploadu.
 * Zachovava zpetnou kompatibilitu s Cloudinary URLs v DB.
 */
export function getOptimizedUrl(
  url: string,
  _width: number = 800,
  _quality: string = "auto"
): string {
  return url;
}

/** Ziskat priponu z nazvu souboru nebo MIME typu */
function getExtension(filename: string, mimeType: string): string {
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;

  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  return mimeMap[mimeType] || "bin";
}
