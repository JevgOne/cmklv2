import { redirect } from "next/navigation";

// /inzerce/katalog → permanentni redirect na /nabidka
// Puvodni thin-content stranka nahrazena redirectem pro SEO
export default function InzerceKatalogPage() {
  redirect("/nabidka");
}
