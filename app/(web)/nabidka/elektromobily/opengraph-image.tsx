import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojeté elektromobily";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojeté", "elektromobily", "Prověřené elektromobily od makléřů i soukromých prodejců");
