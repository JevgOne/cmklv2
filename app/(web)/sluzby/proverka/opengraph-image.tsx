import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Prověrka VIN — CarMakléř";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Prověrka", "VIN", "Ověřte historii vozu před koupí");
