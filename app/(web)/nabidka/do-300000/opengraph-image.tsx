import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Auta do 300 000 Kč";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Auta do", "300 000 Kč", "Prověřená ojetá auta v cenové relaci do 300 tisíc");
