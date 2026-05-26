import type { Metadata } from "next";
import { CompareTable } from "./CompareTable";
import { pageCanonical } from "@/lib/canonical";
import { generateWebPageJsonLd } from "@/lib/seo";
import { BASE_URL } from "@/lib/seo-data";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";

export const metadata: Metadata = {
  title: "Porovnání vozidel",
  description: "Porovnejte až 3 vozidla vedle sebe. Srovnání ceny, parametrů, výbavy a stavu.",
  alternates: pageCanonical("/nabidka/porovnani"),
  openGraph: {
    title: "Porovnání vozidel",
    description: "Porovnejte až 3 vozidla vedle sebe. Srovnání ceny, parametrů, výbavy a stavu.",
  },
};

const webPageJsonLd = generateWebPageJsonLd({
  name: "Porovnání vozidel",
  description: "Porovnejte až 3 vozidla vedle sebe. Srovnání ceny, parametrů, výbavy a stavu.",
  url: `${BASE_URL}/nabidka/porovnani`,
});

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: webPageJsonLd }} />
      <Breadcrumbs items={[
        { label: "Domů", href: "/" },
        { label: "Nabídka", href: "/nabidka" },
        { label: "Porovnání" },
      ]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-8">
          Porovnání vozidel
        </h1>
        <CompareTable />
      </div>
    </div>
  );
}
