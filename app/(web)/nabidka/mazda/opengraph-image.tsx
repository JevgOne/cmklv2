import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetá Mazda — prověřená auta";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetá", "Mazda", "CX-5, Mazda3, Mazda6 — prověřená auta");
