import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ochrana osobních údajů — CarMakléř";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ochrana osobních", "údajů", "Zásady ochrany osobních údajů CarMakléř");
