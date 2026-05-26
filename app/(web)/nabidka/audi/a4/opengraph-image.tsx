import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetá Audi A4";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetá Audi", "A4", "Prověřené vozy Audi A4 od makléřů");
