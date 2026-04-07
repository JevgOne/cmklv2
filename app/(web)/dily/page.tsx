import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PartsSearch } from "@/components/web/PartsSearch";
import { SmartSearchBar } from "@/components/web/SmartSearchBar";
import { ProductCard } from "@/components/web/ProductCard";
import { prisma } from "@/lib/prisma";
import { PART_CATEGORIES } from "@/lib/parts-categories";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Autodíly — použité i nové náhradní díly | CarMakléř",
  description:
    "Použité autodíly z vrakovišť, aftermarket díly a autokosmetika. Garantovaná kvalita, rychlé doručení, 6 měsíců záruka.",
  openGraph: {
    title: "Autodíly a příslušenství | CarMakléř",
    description:
      "Největší výběr dílů z vrakovišť. Garantovaná kvalita, expedice do 24h.",
  },
  alternates: pageCanonical("/dily"),
};

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

const categoryIcons: Record<string, string> = {
  ENGINE: "⚙️",
  TRANSMISSION: "🔧",
  BRAKES: "🛑",
  SUSPENSION: "🔩",
  BODY: "🚗",
  ELECTRICAL: "💡",
  INTERIOR: "🛋️",
  WHEELS: "🛞",
  EXHAUST: "💨",
  COOLING: "❄️",
  FUEL: "⛽",
  OTHER: "📦",
};

function getPartTypeBadge(partType: string): "used" | "new" | "aftermarket" {
  switch (partType) {
    case "NEW": return "new";
    case "AFTERMARKET": return "aftermarket";
    default: return "used";
  }
}

export default async function DilyPage() {
  const featuredParts = await prisma.part.findMany({
    where: { status: "ACTIVE" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { viewCount: "desc" },
    take: 6,
  });

  const categoryCounts = await prisma.part.groupBy({
    by: ["category"],
    where: { status: "ACTIVE" },
    _count: true,
  });

  const countMap = new Map(categoryCounts.map((c) => [c.category, c._count]));

  const categories = PART_CATEGORIES.map((cat) => ({
    icon: categoryIcons[cat.value] ?? "📦",
    title: cat.label,
    count: countMap.get(cat.value) ?? 0,
    slug: cat.value.toLowerCase(),
  }));

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center">
          <span className="inline-block bg-orange-100 text-orange-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 sm:mb-6">
            Největší výběr dílů z vrakovišť
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            Autodíly a příslušenství
          </h1>
          <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
            Použité díly z vrakovišť, nové aftermarket díly a autokosmetika
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

      {/* Smart text search */}
      <section className="py-8 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SmartSearchBar className="w-full" />
        </div>
      </section>

      {/* Vehicle search box */}
      <section id="search" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PartsSearch basePath="/dily" />
        </div>
      </section>

      {/* Categories grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 text-center mb-6 sm:mb-10">
            Kategorie
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/dily/katalog?category=${cat.slug.toUpperCase()}`}
                className="no-underline block"
              >
                <Card hover className="p-6 text-center group">
                  <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-[28px] mx-auto group-hover:scale-110 transition-transform duration-300">
                    {cat.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mt-4 text-[15px]">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {cat.count} {cat.count === 1 ? "díl" : cat.count < 5 ? "díly" : "dílů"}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Doporučené produkty
            </h2>
            <Link
              href="/dily/katalog"
              className="text-orange-500 font-semibold hover:text-orange-600 transition-colors no-underline"
            >
              Zobrazit všechny autodíly &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredParts.map((part) => (
              <ProductCard
                key={part.id}
                partId={part.id}
                name={part.name}
                compatibility={
                  part.compatibleBrands
                    ? JSON.parse(part.compatibleBrands).join(", ")
                    : "Univerzální"
                }
                condition={
                  part.condition === "NEW"
                    ? undefined
                    : part.condition === "USED_GOOD"
                      ? 4
                      : part.condition === "USED_FAIR"
                        ? 3
                        : part.condition === "USED_POOR"
                          ? 2
                          : 5
                }
                price={part.price}
                badge={getPartTypeBadge(part.partType)}
                slug={part.slug}
                image={part.images[0]?.url}
                stock={part.stock}
                basePath="/dily"
              />
            ))}
          </div>

          {featuredParts.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              Zatím nejsou k dispozici žádné díly.
            </p>
          )}
        </div>
      </section>

      {/* Why shop at CarMakléř */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 text-center mb-6 sm:mb-10">
            Proč nakupovat u CarMakléře?
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

      {/* CTA */}
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
