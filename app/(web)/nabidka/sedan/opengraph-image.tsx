import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojeté sedany";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojeté", "sedany", "Prověřené sedany od makléřů i soukromých prodejců");
