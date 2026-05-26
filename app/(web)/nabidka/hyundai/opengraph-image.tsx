import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetý Hyundai — prověřená auta";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetý", "Hyundai", "i30, Tucson, Kona — prověřená auta");
