/**
 * Cloudinary upload pres REST API.
 * Pouziva primo fetch + SHA-1 podpis — NEPOUZIVA npm package `cloudinary`.
 *
 * Podporuje dev mode: pokud env promenne nejsou nastavene,
 * vrati validni placeholder URL na placehold.co (projde Zod url() validaci).
 */

// Maximalni velikost souboru: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Upload souboru na Cloudinary pres REST API.
 * @param file - File objekt (z FormData)
 * @param folder - Cloudinary folder (napr. "carmakler/avatars", "carmakler/onboarding/xyz")
 * @param options - Volitelne transformace
 * @returns URL uploadovaneho obrazku (secure_url)
 */
export async function uploadToCloudinary(
  file: File,
  folder: string,
  options?: {
    transformation?: string;
  }
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Dev mode — Cloudinary neni nakonfigurovano
  if (!cloudName || !apiKey || !apiSecret) {
    console.log(`[Cloudinary:DEV] Skipping upload for: ${file.name}`);
    // Validni HTTPS placeholder URL — projde Zod z.string().url() validaci.
    // Folder + timestamp v `?text=` query pro identifikaci uploadu v dev.
    const label = encodeURIComponent(`dev-${folder.replace(/\//g, "-")}-${Date.now()}`);
    return `https://placehold.co/600x400/png?text=${label}`;
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${file.size} bytes (max ${MAX_FILE_SIZE})`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  // Generovat signature pro Cloudinary upload
  const timestamp = Math.round(Date.now() / 1000).toString();

  // Parametry pro podpis (alphabetical order!)
  let paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  if (options?.transformation) {
    paramsToSign = `folder=${folder}&timestamp=${timestamp}&transformation=${options.transformation}`;
  }
  paramsToSign += apiSecret;

  // SHA-1 hash pro Cloudinary signature
  const { createHash } = await import("crypto");
  const signature = createHash("sha1").update(paramsToSign).digest("hex");

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);
  if (options?.transformation) {
    formData.append("transformation", options.transformation);
  }

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

/**
 * Transformuje Cloudinary URL na optimalizovanou verzi.
 * Input:  https://res.cloudinary.com/xxx/image/upload/v123/photo.jpg
 * Output: https://res.cloudinary.com/xxx/image/upload/w_800,q_auto,f_auto,c_fill/v123/photo.jpg
 */
export function getOptimizedUrl(
  url: string,
  width: number = 800,
  quality: string = "auto"
): string {
  if (!url.includes("res.cloudinary.com")) return url;
  return url.replace(
    "/image/upload/",
    `/image/upload/w_${width},q_${quality},f_auto,c_fill/`
  );
}
