/**
 * Generate static og-default.png (1200x630) for fallback OG image.
 * Uses sharp to composite logo on dark gradient background.
 *
 * Usage: node scripts/generate-og-default.mjs
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const WIDTH = 1200;
const HEIGHT = 630;

// Create dark gradient background as SVG (sharp renders SVG natively)
const bgSvg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080818"/>
      <stop offset="30%" stop-color="#1a1a2e"/>
      <stop offset="65%" stop-color="#16213e"/>
      <stop offset="100%" stop-color="#0f3460"/>
    </linearGradient>
    <radialGradient id="orb" cx="90%" cy="10%" r="30%">
      <stop offset="0%" stop-color="rgba(249,115,22,0.12)"/>
      <stop offset="70%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#orb)"/>
  <!-- Orange accent line -->
  <rect x="575" y="370" width="50" height="3" rx="1.5" fill="#F97316"/>
  <!-- Bottom bar -->
  <defs>
    <linearGradient id="bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="50%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
  </defs>
  <rect x="0" y="626" width="1200" height="4" fill="url(#bar)"/>
  <!-- URL watermark -->
  <text x="1160" y="615" font-family="sans-serif" font-size="14" fill="rgba(255,255,255,0.4)" text-anchor="end">www.carmakler.cz</text>
  <!-- Title text -->
  <text x="600" y="440" font-family="sans-serif" font-size="42" font-weight="800" fill="white" text-anchor="middle">
    <tspan>Kompletni automobilova </tspan>
    <tspan fill="#F97316">platforma</tspan>
  </text>
  <!-- Subtitle -->
  <text x="600" y="480" font-family="sans-serif" font-size="20" fill="rgba(255,255,255,0.7)" text-anchor="middle">Prodej aut · Inzerce · Autodily · Marketplace</text>
</svg>`;

async function main() {
  // Read the white logo PNG
  const logoPng = readFileSync(join(ROOT, "public/brand/logo-white.png"));

  // Create background from SVG
  const background = sharp(Buffer.from(bgSvg)).png();

  // Resize logo to fit (height ~64px, maintaining aspect ratio)
  const logoResized = await sharp(logoPng)
    .resize({ height: 64 })
    .toBuffer();

  // Get logo metadata for positioning
  const logoMeta = await sharp(logoResized).metadata();
  const logoWidth = logoMeta.width || 200;

  // Composite logo centered on background
  const result = await background
    .composite([
      {
        input: logoResized,
        top: 280, // Center area, above the accent line
        left: Math.round((WIDTH - logoWidth) / 2),
      },
    ])
    .toFile(join(ROOT, "public/og-default.png"));

  console.log(`Generated public/og-default.png (${result.width}x${result.height})`);
}

main().catch((err) => {
  console.error("Failed to generate og-default.png:", err);
  process.exit(1);
});
