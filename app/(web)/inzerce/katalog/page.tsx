import { redirect } from "next/navigation";

// /inzerce/katalog → redirect to /nabidka
// On main domain: direct redirect. On inzerce subdomain: middleware rewrites
// /nabidka to serve main catalog page (avoiding redirect loop).
export default function InzerceKatalogPage() {
  redirect("/nabidka");
}
