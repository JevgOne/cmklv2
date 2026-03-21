import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PartsSearch } from "@/components/web/PartsSearch";
import { ProductCard } from "@/components/web/ProductCard";
import type { ProductCardProps } from "@/components/web/ProductCard";

export const metadata: Metadata = {
  title: "Shop — autodíly a příslušenství",
  description:
    "Použité autodíly z vrakovišť, aftermarket díly a autokosmetika. Garantovaná kvalita, rychlé doručení, 6 měsíců záruka.",
  openGraph: {
    title: "Autodíly a příslušenství | CarMakléř Shop",
    description:
      "Největší výběr dílů z vrakovišť. Garantovaná kvalita, expedice do 24h.",
  },
};

/* ------------------------------------------------------------------ */
/*  Dummy data                                                         */
/* ------------------------------------------------------------------ */

const categories = [
  { icon: "🚗", title: "Karoserie", count: "245 dílů", slug: "karoserie" },
  { icon: "⚙️", title: "Motor", count: "189 dílů", slug: "motor" },
  { icon: "🔧", title: "Podvozek", count: "312 dílů", slug: "podvozek" },
  { icon: "💡", title: "Elektro", count: "156 dílů", slug: "elektro" },
  { icon: "🪟", title: "Skla", count: "78 dílů", slug: "skla" },
  { icon: "🛋️", title: "Interiér", count: "203 dílů", slug: "interier" },
  {
    icon: "🧴",
    title: "Autokosmetika",
    count: "450+ produktů",
    slug: "autokosmetika",
  },
  {
    icon: "🔩",
    title: "Servisní díly",
    count: "380+ produktů",
    slug: "servisni-dily",
  },
];

const featuredProducts: ProductCardProps[] = [
  {
    name: "Dveře přední levé",
    compatibility: "Škoda Octavia III 2013-2020",
    condition: 4,
    price: 4500,
    badge: "used",
    slug: "dvere-predni-leve-octavia-iii",
  },
  {
    name: "Turbodmychadlo",
    compatibility: "2.0 TDI VW Group",
    condition: 5,
    price: 12000,
    badge: "used",
    slug: "turbodmychadlo-2-0-tdi",
  },
  {
    name: "Koch Chemie GSF",
    compatibility: "Autošampon 1L",
    price: 299,
    oldPrice: 399,
    badge: "sale",
    slug: "koch-chemie-gsf-1l",
  },
  {
    name: "LED světlomet přední",
    compatibility: "BMW F30 2012-2018",
    condition: 4,
    price: 8500,
    badge: "used",
    slug: "led-svetlomet-bmw-f30",
  },
  {
    name: "Brzdové destičky přední",
    compatibility: "VW Group",
    price: 890,
    badge: "new",
    slug: "brzdove-desticky-vw-group",
  },
  {
    name: "Sedačka řidiče",
    compatibility: "Škoda Octavia RS 2017-2020",
    condition: 3,
    price: 6200,
    badge: "used",
    slug: "sedacka-ridice-octavia-rs",
  },
];

const benefits = [
  {
    icon: "🏭",
    title: "Přímý dovoz z vrakovišť",
    desc: "Spolupracujeme s ověřenými vrakovišti po celé ČR",
  },
  {
    icon: "✅",
    title: "Garantovaná kvalita",
    desc: "Každý díl kontrolujeme a hodnotíme",
  },
  {
    icon: "🚚",
    title: "Rychlé doručení",
    desc: "Expedice do 24h, doprava od 69 Kč",
  },
  {
    icon: "🔄",
    title: "6 měsíců záruka",
    desc: "Na funkčnost použitých dílů",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ShopPage() {
  return (
    <div className="min-h-screen">
      {/* ============================================================ */}
      {/* Hero                                                          */}
      {/* ============================================================ */}
      <section className="bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center">
          <span className="inline-block bg-orange-100 text-orange-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 sm:mb-6">
            Největší výběr dílů z vrakovišť
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            Autodíly a příslušenství
          </h1>
          <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
            Použité díly z vrakovišť, aftermarket díly a autokosmetika
          </p>
          <div className="mt-8">
            <a href="#search" className="no-underline">
              <Button variant="primary" size="lg">
                Hledat díly pro váš vůz
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Vehicle search box                                            */}
      {/* ============================================================ */}
      <section id="search" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PartsSearch />
        </div>
      </section>

      {/* ============================================================ */}
      {/* Categories grid                                               */}
      {/* ============================================================ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 text-center mb-6 sm:mb-10">
            Kategorie
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href="/shop/katalog"
                className="no-underline block"
              >
                <Card hover className="p-6 text-center group">
                  <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-[28px] mx-auto group-hover:scale-110 transition-transform duration-300">
                    {cat.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mt-4 text-[15px]">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{cat.count}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Featured products                                             */}
      {/* ============================================================ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Doporučené produkty
            </h2>
            <Link
              href="/shop/katalog"
              className="text-orange-500 font-semibold hover:text-orange-600 transition-colors no-underline"
            >
              Zobrazit vše &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.name} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Why shop at CarMakléř                                         */}
      {/* ============================================================ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 text-center mb-6 sm:mb-10">
            Proč nakupovat u CarMakléř?
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} hover className="p-6">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-[28px] mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-gray-900">{benefit.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {benefit.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA                                                           */}
      {/* ============================================================ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl py-12 sm:py-16 px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
              Nenašli jste, co hledáte?
            </h2>
            <p className="text-white/60 mt-4 max-w-xl mx-auto">
              Napište nám, jaký díl potřebujete. Prohledáme naši síť vrakovišť
              a ozveme se vám do 24 hodin.
            </p>
            <div className="mt-8">
              <Link href="/kontakt" className="no-underline">
                <Button variant="primary" size="lg">
                  Poptat díl
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
