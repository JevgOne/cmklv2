import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetá auta Plzeň";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetá auta", "Plzeň", "Prověřená ojetá auta v Plzni od makléřů");
