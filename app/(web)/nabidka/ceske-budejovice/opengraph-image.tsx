import { createLandingOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Ojetá auta České Budějovice";
export const size = OG_SIZE;
export const contentType = "image/png";

export default createLandingOgImage("Ojetá auta", "České Budějovice", "Prověřená ojetá auta v Českých Budějovicích od makléřů");
