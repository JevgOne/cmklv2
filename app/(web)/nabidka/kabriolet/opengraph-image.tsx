import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojeté kabriolety";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojeté", "kabriolety", "Prověřené kabriolety od makléřů i soukromých prodejců");
