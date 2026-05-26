import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetý Citroën — prověřená auta";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetý", "Citroën", "C3, C4, C5 Aircross — prověřená auta");
