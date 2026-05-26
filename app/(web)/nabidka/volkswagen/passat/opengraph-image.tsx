import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetý Volkswagen Passat";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetý Volkswagen", "Passat", "Prověřené vozy Volkswagen Passat od makléřů");
