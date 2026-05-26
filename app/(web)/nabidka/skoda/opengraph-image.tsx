import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetá Škoda — prověřená auta";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetá", "Škoda", "Octavia, Fabia, Superb, Kodiaq — prověřená auta");
