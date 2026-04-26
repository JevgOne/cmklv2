import type { Metadata } from "next";
import Link from "next/link";
import { companyInfo } from "@/lib/company-info";

export const revalidate = 3600;
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TrustScore } from "@/components/ui/TrustScore";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { pageCanonical } from "@/lib/canonical";
import { BrokerCard, type BrokerCardBroker } from "@/components/web/BrokerCard";

export const metadata: Metadata = {
  title: "Prodejte auto za nejlepší cenu, kupte bezpečně",
  description:
    "Pomáháme lidem prodat auto za nejvyšší cenu a koupit bezpečně. Váš makléř se postará o fotky, inzerci, prohlídky i papíry. Průměrně do 20 dní.",
  openGraph: {
    title: "Prodejte auto za nejlepší cenu, kupte bezpečně | CarMakléř",
    description:
      "Pomáháme lidem prodat auto za nejvyšší cenu a koupit bezpečně. Váš makléř zajistí vše od A do Z.",
    type: "website",
    url: "https://carmakler.cz",
  },
  alternates: pageCanonical("/"),
};

/* ------------------------------------------------------------------ */
/*  Fuel / Transmission label mapování                                 */
/* ------------------------------------------------------------------ */

const fuelLabels: Record<string, string> = {
  PETROL: "Benzín", DIESEL: "Diesel", ELECTRIC: "Elektro", HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in Hybrid", LPG: "LPG", CNG: "CNG",
};

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuál", AUTOMATIC: "Automat", DSG: "DSG", CVT: "CVT",
};

/* ------------------------------------------------------------------ */
/*  Data loaders                                                       */
/* ------------------------------------------------------------------ */

async function getFeaturedCars() {
  try {
    const dbVehicles = await prisma.vehicle.findMany({
      where: { status: "ACTIVE" },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { trustScore: "desc" },
      take: 3,
    });

    if (dbVehicles.length > 0) {
      return dbVehicles.map((v) => {
        let badge: "verified" | "top" | "default" = "default";
        if (v.trustScore >= 95) badge = "top";
        else if (v.trustScore >= 80) badge = "verified";

        return {
          name: `${v.brand} ${v.model}${v.variant ? " " + v.variant : ""}`,
          slug: v.slug || v.id,
          year: v.year,
          km: new Intl.NumberFormat("cs-CZ").format(v.mileage) + " km",
          fuel: fuelLabels[v.fuelType] || v.fuelType,
          transmission: transmissionLabels[v.transmission] || v.transmission,
          city: v.city,
          hp: v.enginePower ? `${v.enginePower} HP` : "",
          price: new Intl.NumberFormat("cs-CZ").format(v.price),
          trust: v.trustScore,
          badge,
          photo: v.images[0]?.url || "/images/placeholder-car.jpg",
          isExternal: false,
        };
      });
    }
  } catch {
    /* DB unavailable — fall back to empty */
  }
  return [];
}

async function getFeaturedBrokers(): Promise<BrokerCardBroker[]> {
  try {
    const dbBrokers = await prisma.user.findMany({
      where: { role: { in: ["BROKER", "ADMIN", "MANAGER"] }, status: "ACTIVE", slug: { not: null } },
      select: {
        slug: true,
        firstName: true,
        lastName: true,
        avatar: true,
        level: true,
        city: true,
        cities: true,
        bio: true,
        totalSales: true,
        phone: true,
        showPhone: true,
        tags: { select: { slug: true, label: true } },
        _count: { select: { vehicles: { where: { status: "ACTIVE" } } } },
      },
      take: 3,
      orderBy: { totalSales: "desc" },
    });

    if (dbBrokers.length > 0) {
      return dbBrokers.map((b) => ({
        slug: b.slug || "makler",
        firstName: b.firstName,
        lastName: b.lastName,
        avatar: b.avatar,
        level: b.level,
        city: b.city,
        cities: b.cities
          ? (() => { try { return JSON.parse(b.cities); } catch { return []; } })()
          : [],
        bio: b.bio,
        totalSales: b.totalSales,
        activeVehicles: b._count.vehicles,
        phone: b.phone,
        showPhone: b.showPhone,
        tags: b.tags,
      }));
    }
  } catch {
    /* DB unavailable — fall back to empty */
  }
  return [];
}

const services = [
  {
    icon: "🚗",
    title: "Chci prodat auto",
    desc: "Váš makléř zajistí fotky, inzerci na všech portálech, prohlídky se zájemci i smlouvu. Vy nemusíte řešit nic.",
    href: "/chci-prodat",
  },
  {
    icon: "🔍",
    title: "Chci koupit auto",
    desc: "Prověřená vozidla s kompletní historií. Makléř vás provede celým nákupem od výběru po přepis.",
    href: "/nabidka",
  },
  {
    icon: "🛡️",
    title: "Prověrka vozidla",
    desc: "Kompletní kontrola historie, stočení tachometru, zástavy a technického stavu. Kupujte s jistotou.",
    href: "/sluzby/proverka",
  },
  {
    icon: "💰",
    title: "Financování na míru",
    desc: "Schválení do 30 minut, bez zbytečného papírování. Pro zaměstnance, živnostníky i firmy.",
    href: "/sluzby/financovani",
  },
  {
    icon: "📋",
    title: "Inzerce zdarma",
    desc: "Podejte inzerát zdarma a oslovte tisíce kupujících. Pro soukromé prodejce i autobazary.",
    href: "/inzerce",
  },
  {
    icon: "🔧",
    title: "Autodíly",
    desc: "Originální díly z vrakovišť i nové aftermarket. Hledejte podle vozu nebo VIN.",
    href: "/dily",
  },
];

const benefits = [
  {
    icon: "⏱️",
    title: "Prodáno průměrně za 20 dní",
    desc: "Díky profesionální inzerci na všech portálech v ČR prodáváme výrazně rychleji než soukromí prodejci.",
  },
  {
    icon: "📄",
    title: "Od fotek po přepis — zařídíme vše",
    desc: "Fotky, popis, inzerce, prohlídky, smlouva, přepis na úřadě, odhlášení pojištění. Vy jenom podepíšete.",
  },
  {
    icon: "🛡️",
    title: "Každé auto prověříme",
    desc: "Kontrola VIN, historie nehod, zástavy, stočení km, servisní kniha. Kupujete s jistotou, ne naslepo.",
  },
  {
    icon: "🤝",
    title: "Makléř vždy blízko vás",
    desc: "Síť certifikovaných makléřů po celé ČR. Osobní přístup, ne call centrum.",
  },
];

const testimonials = [
  {
    quote:
      "Auto prodané za 12 dní, za cenu o 40 000 Kč vyšší, než mi nabízel bazar. Makléř se postaral o všechno — od fotek po přepis na úřadě.",
    name: "Jana K.",
    city: "Praha",
  },
  {
    quote:
      "Nemusel jsem řešit vůbec nic. Makléř nafotil auto, napsal inzerát, domluvil prohlídky i kupní smlouvu. Já jen dostal peníze.",
    name: "Martin D.",
    city: "Brno",
  },
  {
    quote:
      "Díky prověrce jsem zjistil, že auto mělo stočený tachometr. Ušetřil jsem si 200 000 Kč a problém. Skvělá služba.",
    name: "Tomáš H.",
    city: "Ostrava",
  },
];

const proKoho = [
  { icon: "👨‍💼", title: "Zaměstnanec", subtitle: "V ČR" },
  { icon: "✈️", title: "Zaměstnanec", subtitle: "V zahraničí" },
  { icon: "🔧", title: "Živnostník", subtitle: "Od 3 měsíců" },
  { icon: "🏢", title: "Právnická osoba", subtitle: "Od 6 měsíců" },
  { icon: "👴", title: "Důchodce", subtitle: "" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: companyInfo.name,
  url: companyInfo.web.url,
  logo: companyInfo.web.logo,
  description:
    "Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů. Rychle, transparentně a bez starostí.",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: companyInfo.contact.phoneJsonLd,
    contactType: "customer service",
    areaServed: "CZ",
    availableLanguage: "Czech",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: companyInfo.address.street,
    addressLocality: companyInfo.address.city,
    postalCode: companyInfo.address.zip,
    addressCountry: "CZ",
  },
};

export default async function HomePage() {
  const cars = await getFeaturedCars();
  const brokers = await getFeaturedBrokers();

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ============================================================ */}
      {/* Section 1 — Hero + Pro koho strip                            */}
      {/* ============================================================ */}
      <section className="md:mx-4 lg:mx-8 md:mt-4">
        <div className="bg-orange-50 md:rounded-t-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Left — text */}
              <div>
                <span className="inline-block bg-orange-100 text-orange-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                  Síť certifikovaných automakléřů v ČR
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                  Prodejte auto za{" "}
                  <span className="text-orange-500">nejvyšší cenu</span>.
                  {" "}Kupte s jistotou.
                </h1>
                <p className="text-lg text-gray-500 mt-5 leading-relaxed max-w-lg">
                  Váš makléř se postará o fotky, inzerci, prohlídky, smlouvu i přepis.
                  Vy jen podepíšete a inkasujete.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/nabidka" className="no-underline">
                    <Button variant="primary" size="lg">
                      Koupit auto
                    </Button>
                  </Link>
                  <Link href="/chci-prodat" className="no-underline">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="!bg-amber-400 !text-gray-900 hover:!bg-amber-500"
                    >
                      Prodat auto
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right — video/image placeholder */}
              <div className="relative aspect-video bg-gray-200 rounded-2xl overflow-hidden flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80"
                  alt="Prodej ojetých vozidel přes ověřené makléře CarMakléř"
                  className="w-full h-full object-cover"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Pro koho strip */}
        <div className="bg-orange-50 md:rounded-b-2xl pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-orange-500 font-semibold text-lg mb-6">
              Pomáháme všem — bez ohledu na příjem nebo zaměstnání.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-10">
              {proKoho.map((item) => (
                <div
                  key={item.title + item.subtitle}
                  className="flex items-center gap-3 text-center"
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 text-sm">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-orange-500 text-xs font-medium">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Section 3 — Služby / Co vám nabízíme                        */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Vše kolem auta na jednom místě
            </h2>
            <p className="text-gray-500 mt-2">Od prodeje přes financování až po autodíly — postaráme se o vás</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {services.map((service) => (
              <Link key={service.title} href={service.href} className="no-underline block">
                <Card hover className="p-8 text-center h-full">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-[32px] mx-auto">
                    {service.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mt-5 flex items-center justify-center gap-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {service.desc}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Section 4 — Nabídka vozidel                                  */}
      {/* ============================================================ */}
      {cars.length > 0 && (
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Nabídka vozidel
            </h2>
            <Link
              href="/nabidka"
              className="text-orange-500 font-semibold hover:text-orange-600 transition-colors no-underline"
            >
              Zobrazit celou nabídku vozidel &rarr;
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {cars.map((car) => (
              <Link key={car.slug} href={`/nabidka/${car.slug}`} className="no-underline block">
                <Card hover className="group">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={car.photo}
                      alt={car.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      {car.badge === "verified" ? (
                        <Badge variant="verified">✓ Ověřeno</Badge>
                      ) : (
                        <Badge variant="top">⭐ TOP</Badge>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <TrustScore value={car.trust} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-[17px] font-bold text-gray-900 truncate">
                      {car.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {car.year} · {car.km} · {car.fuel} · {car.transmission}
                    </p>

                    <div className="flex gap-2 flex-wrap mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-[10px] text-[13px] font-medium text-gray-600">
                        📍 {car.city}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-[10px] text-[13px] font-medium text-gray-600">
                        ⚡ {car.hp}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="text-[22px] font-extrabold text-gray-900">
                        {car.price}{" "}
                        <span className="text-sm font-medium text-gray-500">
                          Kč
                        </span>
                      </div>
                      <Button variant="secondary" size="sm">
                        Detail &rarr;
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ============================================================ */}
      {/* Section 5 — Proč CarMakléř / Benefity                       */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Proč CarMakléř?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} hover className="p-5 sm:p-6">
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
      {/* Section 6 — Recenze                                          */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Co říkají naši klienti
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} hover className="p-6">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-orange-400 text-lg">
                      ⭐
                    </span>
                  ))}
                </div>
                {/* Quote */}
                <p className="text-gray-700 italic leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Author */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="font-bold text-gray-900 text-sm">
                    {t.name}
                  </span>
                  <span className="text-gray-500 text-sm">, {t.city}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Section 7 — TOP Makléři                                      */}
      {/* ============================================================ */}
      {brokers.length > 0 && (
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              TOP Makléři
            </h2>
            <Link
              href="/makleri"
              className="text-orange-500 font-semibold hover:text-orange-600 transition-colors no-underline"
            >
              Zobrazit všechny makléře &rarr;
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {brokers.map((broker) => (
              <BrokerCard key={broker.slug} broker={broker} />
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ============================================================ */}
      {/* Section 8 — CTA                                              */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl py-12 sm:py-16 lg:py-20 px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
              Jste autobazar nebo vrakoviště?
            </h2>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto text-base sm:text-lg">
              Zaregistrujte se jako partner a získejte přístup k tisícům kupujících.
              Žádné poplatky za start — platíte jen z úspěšného prodeje.
            </p>
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <Link href="/registrace/partner" className="no-underline">
                <Button variant="primary" size="lg">
                  Registrovat se jako partner
                </Button>
              </Link>
              <Link href="/kariera" className="no-underline">
                <Button variant="outline" size="lg" className="!border-2 !border-white/30 !text-white !bg-transparent !shadow-none hover:!bg-white/10 hover:!border-white/50">
                  Chci být makléřem
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
