import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

const steps = [
  {
    icon: "📸",
    title: "Nafoťte auto",
    desc: "Stačí pár fotek z mobilu",
  },
  {
    icon: "📝",
    title: "Vyplňte údaje",
    desc: "Značka, model, cena — to je vše",
  },
  {
    icon: "✅",
    title: "Inzerát je online",
    desc: "Během minuty viditelný pro tisíce lidí",
  },
];

const benefits = [
  {
    icon: "💰",
    title: "Zcela zdarma",
    desc: "Žádné poplatky, žádné skryté náklady",
  },
  {
    icon: "👁",
    title: "Tisíce kupujících",
    desc: "Vaše auto uvidí tisíce lidí denně",
  },
  {
    icon: "⚡",
    title: "Za minutu online",
    desc: "Žádné zdlouhavé formuláře",
  },
  {
    icon: "📱",
    title: "Jednoduše z mobilu",
    desc: "Nafoťte a vložte odkudkoliv",
  },
];

const recentListings = [
  {
    id: "1",
    title: "Škoda Fabia 1.0 TSI",
    year: 2019,
    km: "65 000 km",
    fuel: "Benzín",
    price: "195 000",
    city: "Praha",
    photo:
      "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80",
  },
  {
    id: "2",
    title: "VW Polo 1.6 TDI",
    year: 2018,
    km: "82 000 km",
    fuel: "Diesel",
    price: "165 000",
    city: "Brno",
    photo:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
  },
  {
    id: "3",
    title: "Hyundai i30 1.4 T-GDI",
    year: 2020,
    km: "45 000 km",
    fuel: "Benzín",
    price: "289 000",
    city: "Ostrava",
    photo:
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function InzercePage() {
  return (
    <main className="min-h-screen">
      {/* ============================================================ */}
      {/* Hero                                                          */}
      {/* ============================================================ */}
      <section className="bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-28 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Prodejte své auto.{" "}
            <span className="text-orange-500">Zdarma.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mt-5 max-w-2xl mx-auto leading-relaxed">
            Vložte inzerát za minutu. Bez registrace, bez poplatků.
          </p>
          <div className="mt-8">
            <Link href="/inzerce/pridat" className="no-underline">
              <Button variant="primary" size="lg">
                Vložit inzerát zdarma
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-5 flex items-center justify-center gap-4 flex-wrap">
            <span className="text-green-500 font-medium">&#10003; Zcela zdarma</span>
            <span className="text-green-500 font-medium">&#10003; Bez registrace</span>
            <span className="text-green-500 font-medium">&#10003; Online za 60 sekund</span>
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Stats strip                                                   */}
      {/* ============================================================ */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center">
            <div>
              <span className="text-2xl font-extrabold text-gray-900">189</span>
              <span className="text-sm text-gray-500 ml-2">aktivních inzerátů</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200" />
            <div>
              <span className="text-2xl font-extrabold text-gray-900">12 500+</span>
              <span className="text-sm text-gray-500 ml-2">zobrazení denně</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200" />
            <div>
              <span className="text-2xl font-extrabold text-gray-900">14 dní</span>
              <span className="text-sm text-gray-500 ml-2">průměrný prodej</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Prohlédněte si nabídku                                       */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Prohlédněte si nabídku
            </h2>
            <p className="text-gray-500 mt-4 text-lg">
              <span className="font-bold text-orange-500">189</span> vozidel od makléřů i soukromých prodejců
            </p>
            <div className="mt-8">
              <Link href="/nabidka" className="no-underline">
                <Button variant="primary" size="lg">
                  Zobrazit nabídku &rarr;
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Jak to funguje                                                */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Jak to funguje
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <Card key={step.title} hover className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-[32px] mx-auto">
                  {step.icon}
                </div>
                <div className="text-sm font-bold text-orange-500 mt-4">
                  Krok {index + 1}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {step.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Proč inzerovat u nás                                          */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Proč inzerovat u nás
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} hover className="p-6 text-center">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-[28px] mx-auto">
                  {benefit.icon}
                </div>
                <h3 className="text-[16px] font-bold text-gray-900 mt-4">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {benefit.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Nejnovější inzeráty                                           */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Nejnovější inzeráty
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {recentListings.map((listing) => (
              <Link key={listing.id} href="/nabidka" className="no-underline block">
                <Card hover className="group">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={listing.photo}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-[17px] font-bold text-gray-900 truncate">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {listing.year} &middot; {listing.km} &middot; {listing.fuel}
                    </p>
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="text-[22px] font-extrabold text-gray-900">
                        {listing.price}{" "}
                        <span className="text-sm font-medium text-gray-400">
                          Kč
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{listing.city}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/nabidka"
              className="text-orange-500 hover:text-orange-600 font-semibold no-underline transition-colors"
            >
              Zobrazit všechny inzeráty &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Bottom CTA                                                    */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-gray-900 to-gray-950">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Máte auto na prodej?
            </h2>
            <p className="text-white/60 mt-4 text-lg">
              Vložte inzerát zdarma a prodejte ho tisícům kupujících.
            </p>
            <div className="mt-8">
              <Link href="/inzerce/pridat" className="no-underline">
                <Button variant="primary" size="lg">
                  Vložit inzerát zdarma
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
