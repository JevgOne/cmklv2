import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetý Ford Focus";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetý Ford", "Focus", "Prověřené vozy Ford Focus od makléřů");
