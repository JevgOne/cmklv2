import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetá auta Praha";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetá auta", "Praha", "Prověřená ojetá auta v Praze od makléřů");
