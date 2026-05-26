import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetá auta Brno";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetá auta", "Brno", "Prověřená ojetá auta v Brně od makléřů");
