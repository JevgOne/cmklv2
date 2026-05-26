import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetá auta Hradec Králové";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetá auta", "Hradec Králové", "Prověřená ojetá auta v Hradci Králové od makléřů");
