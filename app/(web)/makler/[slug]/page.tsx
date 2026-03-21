import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VehicleCard } from "@/components/web/VehicleCard";
import { MaklerContactForm } from "./MaklerContactForm";
import type { VehicleData } from "@/components/web/VehicleCard";

/* ------------------------------------------------------------------ */
/*  Static params                                                      */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return [{ slug: "jan-novak-praha" }];
}

/* ------------------------------------------------------------------ */
/*  Dummy data                                                         */
/* ------------------------------------------------------------------ */

const broker = {
  name: "Jan Novák",
  initials: "JN",
  region: "Praha a okolí",
  memberSince: "ledna 2024",
  rating: "4.9",
  sales: 156,
  avgDays: 14,
  activeVehicles: 8,
  phone: "+420 777 123 456",
  bio: "Jan je zkušený automakléř s více než 5letou praxí v prodeji vozidel. Specializuje se na prémiové vozy a SUV. Jeho klienti oceňují rychlou komunikaci, profesionální přístup a schopnost prodat auto za nejlepší možnou cenu. Jan pravidelně dosahuje jedněch z nejlepších výsledků v celé síti CarMakléř.",
};

const stats = [
  { value: broker.rating, label: "Hodnocení", highlight: true },
  { value: String(broker.sales), label: "Prodejů", highlight: false },
  { value: `${broker.avgDays} dní`, label: "Průměrná doba", highlight: false },
  { value: String(broker.activeVehicles), label: "Aktivních vozidel", highlight: false },
];

const vehicles: VehicleData[] = [
  {
    id: "1",
    name: "Škoda Octavia RS Combi",
    year: 2021,
    km: "45 000 km",
    fuel: "Benzín",
    transmission: "DSG",
    city: "Praha",
    hp: "245 HP",
    price: "589 000",
    trust: 96,
    badge: "verified",
    photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80",
  },
  {
    id: "2",
    name: "BMW 330i xDrive M Sport",
    year: 2022,
    km: "28 000 km",
    fuel: "Benzín",
    transmission: "Automat",
    city: "Praha",
    hp: "258 HP",
    price: "1 150 000",
    trust: 98,
    badge: "top",
    photo: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600&q=80",
  },
  {
    id: "3",
    name: "VW Golf GTI",
    year: 2020,
    km: "52 000 km",
    fuel: "Benzín",
    transmission: "DSG",
    city: "Praha",
    hp: "245 HP",
    price: "485 000",
    trust: 92,
    badge: "verified",
    photo: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80",
  },
  {
    id: "4",
    name: "Mercedes C300 AMG Line",
    year: 2021,
    km: "38 000 km",
    fuel: "Benzín",
    transmission: "Automat",
    city: "Praha",
    hp: "258 HP",
    price: "980 000",
    trust: 94,
    badge: "verified",
    photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80",
  },
];

interface ReviewItem {
  stars: number;
  text: string;
  name: string;
  date: string;
}

const reviews: ReviewItem[] = [
  {
    stars: 5,
    text: "Jan je naprostý profesionál. Auto prodal za 10 dní a za skvělou cenu. Vše zařídil sám, já nemusel řešit nic.",
    name: "Petr M.",
    date: "15. 2. 2026",
  },
  {
    stars: 5,
    text: "Perfektní komunikace, vždy dostupný. Pomohl mi s výběrem vozu a zajistil kompletní prověrku. Doporučuji!",
    name: "Klára S.",
    date: "2. 2. 2026",
  },
  {
    stars: 4,
    text: "Spokojený s celým procesem prodeje. Jan byl vstřícný a vše proběhlo hladce. Určitě bych využil znovu.",
    name: "Tomáš R.",
    date: "20. 1. 2026",
  },
  {
    stars: 5,
    text: "Nejlepší zkušenost s prodejem auta, jakou jsem měl. Rychle, bezpečně a za férovou cenu. Díky!",
    name: "Jana V.",
    date: "8. 1. 2026",
  },
];

/* ------------------------------------------------------------------ */
/*  Stars helper                                                       */
/* ------------------------------------------------------------------ */

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-lg ${i < count ? "text-orange-400" : "text-gray-200"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MaklerProfilePage() {
  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 py-10 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="w-[80px] h-[80px] sm:w-[120px] sm:h-[120px] bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-[28px] sm:text-[44px] font-extrabold text-white shrink-0">
              {broker.initials}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
                {broker.name}
              </h1>
              <p className="text-orange-400 font-semibold mt-2">
                Certifikovaný makléř CarMakléř
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
                <span className="text-white/60 text-sm">
                  📍 {broker.region}
                </span>
                <span className="text-white/60 text-sm">
                  · Člen od {broker.memberSince}
                </span>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                <Badge variant="top">⭐ TOP Makléř</Badge>
                <Badge variant="default">⚡ Rychlá reakce</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-5 text-center">
                <div
                  className={`text-3xl font-extrabold ${
                    stat.highlight
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent"
                      : "text-gray-900"
                  }`}
                >
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-500 mt-1">
                  {stat.label}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 mb-4">
            O makléři
          </h2>
          <p className="text-gray-600 leading-relaxed">{broker.bio}</p>
        </div>
      </section>

      {/* Vehicles */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Vozidla makléře
            </h2>
            <span className="text-sm text-gray-500">
              {vehicles.length} z {broker.activeVehicles} vozidel
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {vehicles.map((car) => (
              <VehicleCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 mb-6 sm:mb-8">
            Recenze
          </h2>

          <div className="flex flex-col gap-6">
            {reviews.map((review, index) => (
              <Card key={index} className="p-6">
                <Stars count={review.stars} />
                <p className="text-gray-700 italic leading-relaxed mt-3">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="font-bold text-gray-900 text-sm">
                    {review.name}
                  </span>
                  <span className="text-gray-400 text-sm"> · {review.date}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form + Call CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Form */}
            <MaklerContactForm />

            {/* Call CTA */}
            <div className="flex flex-col justify-center items-center text-center gap-6">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl">
                📞
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Raději zavolejte?
                </h3>
                <p className="text-gray-500 mt-2">
                  Jan je k dispozici Po-Pá 8:00-18:00
                </p>
              </div>
              <a
                href={`tel:${broker.phone.replace(/\s/g, "")}`}
                className="no-underline"
              >
                <Button variant="secondary" size="lg">
                  Zavolat {broker.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
