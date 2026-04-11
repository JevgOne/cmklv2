/**
 * One-time script: Upload watermark PNG na Cloudinary.
 * Spustit: npx tsx scripts/upload-watermark.ts
 *
 * Nahraje public/brand/logo-white.png jako "carmakler/watermark"
 * s fixed public_id pro pouziti v overlay transformacich.
 */
import { readFileSync } from "fs";
import { createHash } from "crypto";

async function main() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Missing CLOUDINARY env vars (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)");
    process.exit(1);
  }

  const fileBuffer = readFileSync("public/brand/logo-white.png");
  const base64 = fileBuffer.toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  const timestamp = Math.round(Date.now() / 1000).toString();
  const publicId = "carmakler/watermark";
  const paramsToSign = `overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(paramsToSign).digest("hex");

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("public_id", publicId);
  formData.append("overwrite", "true");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    console.error("Upload failed:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log("Watermark uploaded successfully!");
  console.log("Secure URL:", data.secure_url);
  console.log("Public ID:", data.public_id);
}

main();
