import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Staňte se makléřem — CarMakléř";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Staňte se", "makléřem", "Připojte se k síti certifikovaných automakléřů");
