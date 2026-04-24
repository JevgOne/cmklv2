import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Služby — financování, pojištění, prověrka vozidla",
  description:
    "Kompletní služby pro nákup i prodej auta. Financování na splátky, srovnání pojištění, prověrka historie vozidla. Vše online, rychle a výhodně.",
  openGraph: {
    title: "Služby | CarMakléř",
    description:
      "Financování, pojištění a prověrka vozidla. Online služby pro chytřejší nákup auta.",
  },
  alternates: pageCanonical("/sluzby"),
};

const services = [
  {
    href: "/sluzby/financovani",
    icon: "🧮",
    title: "Financování auta",
    description:
      "Auto na splátky bez zálohy. Schválení do 30 minut, úrok od 3,9 %.",
  },
  {
    href: "/sluzby/pojisteni",
    icon: "🛡️",
    title: "Pojištění auta",
    description:
      "Srovnání povinného ručení a havarijního pojištění od všech pojišťoven.",
  },
  {
    href: "/sluzby/proverka",
    icon: "🔍",
    title: "Prověrka vozidla",
    description:
      "Kontrola havárií, stočení km, zástav a servisní historie. Report do 30 minut.",
  },
];

export default function SluzbyPage() {
  return (
    <main>
      <Breadcrumbs items={[{ label: "Domů", href: "/" }, { label: "Služby" }]} />

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Naše služby
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Pomůžeme vám s financováním, pojištěním i prověrkou vozidla.
              Vše online, rychle a výhodně.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {services.map((service) => (
              <Link key={service.href} href={service.href} className="no-underline">
                <Card hover className="p-6 h-full text-center">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    {service.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {service.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
