import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetý Mercedes-Benz — prověřená auta";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetý", "Mercedes-Benz", "Třídy C, E, GLC — prověřená auta");
