import type { Metadata } from "next";
import Link from "next/link";
import { companyInfo } from "@/lib/company-info";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TrustScore } from "@/components/ui/TrustScore";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "CarMakléř | Prodej aut přes certifikované makléře",
  description:
    "Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů. Rychle, transparentně a bez starostí. Průměrná doba prodeje 20 dní.",
  openGraph: {
    title: "CarMakléř | Prodej aut přes certifikované makléře",
    description:
      "Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů. Rychle, transparentně a bez starostí.",
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

async function getFeaturedBrokers() {
  try {
    const dbBrokers = await prisma.user.findMany({
      where: { role: "BROKER", status: "ACTIVE" },
      select: {
        firstName: true,
        lastName: true,
        slug: true,
        avatar: true,
        cities: true,
        bio: true,
        totalSales: true,
        _count: { select: { vehicles: { where: { status: "ACTIVE" } } } },
      },
      take: 3,
      orderBy: { vehicles: { _count: "desc" } },
    });

    if (dbBrokers.length > 0) {
      return dbBrokers.map((b) => {
        const name = `${b.firstName} ${b.lastName}`;
        const initials = `${(b.firstName || "")[0] || ""}${(b.lastName || "")[0] || ""}`;
        const cities = b.cities ? (typeof b.cities === "string" ? JSON.parse(b.cities) : b.cities) : [];
        return {
          name,
          initials,
          slug: b.slug || "makler",
          region: (cities as string[])[0] || "Česká republika",
          photo: b.avatar || "",
          bio: b.bio || `Certifikovaný makléř CarMakléř`,
          badges: ["verified"] as const,
          badgeLabels: ["✓ Ověřený"],
          rating: "—",
          sales: String(b.totalSales),
          avgDays: "—",
          activeVehicles: b._count.vehicles,
        };
      });
    }
  } catch {
    /* DB unavailable — fall back to empty */
  }
  return [];
}

const services = [
  {
    icon: "🚗",
    title: "Prodej vozidla",
    desc: "Prodáme vaše auto rychleji za férovou tržní cenu",
    href: "/chci-prodat",
  },
  {
    icon: "🛒",
    title: "Koupě vozidla",
    desc: "Najděte si z naší nabídky prověřených vozidel",
    href: "/nabidka",
  },
  {
    icon: "🔍",
    title: "Prověrka vozidla",
    desc: "Kupujeme a prodáváme jen kvalitní a prověřená vozidla",
    href: "/sluzby/proverka",
  },
  {
    icon: "💰",
    title: "Financování",
    desc: "Získejte financování do 30 minut bez zbytečného papírování",
    href: "/sluzby/financovani",
  },
  {
    icon: "📋",
    title: "Inzerce",
    desc: "Inzerujte své vozidlo a oslovte tisíce kupujících",
    href: "/inzerce",
  },
  {
    icon: "🛍️",
    title: "Shop",
    desc: "Autodíly z vrakovišť, příslušenství a autokosmetika",
    href: "/shop",
  },
];

const benefits = [
  {
    icon: "⏱️",
    title: "Šetříme váš čas",
    desc: "Auto prodáme rychleji díky kvalitní inzerci na všech portálech",
  },
  {
    icon: "📄",
    title: "Vyřídíme vše za vás",
    desc: "Smlouvy, financování, pojištění, prověrka — my to zařídíme",
  },
  {
    icon: "🛡️",
    title: "Bezpečnost",
    desc: "Každé vozidlo prochází důkladnou prověrkou historie i technického stavu",
  },
  {
    icon: "🤝",
    title: "Síť makléřů",
    desc: "Síť certifikovaných makléřů po celé ČR, vždy blízko vás",
  },
];

const testimonials = [
  {
    quote:
      "Prodej proběhl hladce a rychle. Auto bylo prodané za 12 dní za cenu, která mě příjemně překvapila.",
    name: "Jana K.",
    city: "Praha",
  },
  {
    quote:
      "Konečně někdo, kdo se o všechno postará. Nemusel jsem řešit nic — od fotek po převod.",
    name: "Martin D.",
    city: "Brno",
  },
  {
    quote:
      "Makléř byl profesionální, vždy dostupný. Auto jsem koupil s jistotou, že je prověřené.",
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
                  Nová éra prodeje aut
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                  Vaše auto prodáme v průměru{" "}
                  <span className="text-orange-500">do 20 dní</span>
                </h1>
                <p className="text-lg text-gray-500 mt-5 leading-relaxed max-w-lg">
                  Nechte to na nás. Prodej, koupě, financování i prověrka —
                  vše na jednom místě.
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
                  alt="Prodej ojetých vozidel přes certifikované makléře CarMakléř"
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
              Auto u nás dostane každý.
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
              Co vám nabízíme
            </h2>
            <p className="text-gray-500 mt-2">Kompletní servis od A do Z</p>
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
              <Link key={broker.slug} href={`/profil/${broker.slug}`} className="no-underline block group">
                <Card hover className="overflow-hidden">
                  {/* Header s fotkou a gradient overlay */}
                  <div className="relative h-[200px] bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
                    {broker.photo && (
                    <img
                      src={broker.photo}
                      alt={broker.name}
                      className="w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                    />
                    )}
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {broker.badges.map((variant, i) => (
                        <Badge key={i} variant={variant}>
                          {broker.badgeLabels[i]}
                        </Badge>
                      ))}
                    </div>
                    {/* Avatar + jméno overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="flex items-end gap-4">
                        <div className="w-[72px] h-[72px] bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-[26px] font-extrabold text-white shrink-0 shadow-lg border-4 border-white/20">
                          {broker.initials}
                        </div>
                        <div className="mb-1">
                          <h3 className="text-xl font-extrabold text-white">
                            {broker.name}
                          </h3>
                          <p className="text-sm text-white/70">
                            📍 {broker.region}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Bio */}
                    <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-2">
                      {broker.bio}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-xl font-extrabold bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent">
                          {broker.rating}
                        </div>
                        <div className="text-[10px] font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">
                          Hodnocení
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-extrabold text-gray-900">
                          {broker.sales}
                        </div>
                        <div className="text-[10px] font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">
                          Prodejů
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-extrabold text-gray-900">
                          {broker.avgDays}
                        </div>
                        <div className="text-[10px] font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">
                          Dní
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-extrabold text-gray-900">
                          {broker.activeVehicles}
                        </div>
                        <div className="text-[10px] font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">
                          Vozidel
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-5">
                      <Button variant="outline" size="sm" className="w-full">
                        Zobrazit profil
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
      {/* Section 8 — CTA                                              */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl py-12 sm:py-16 lg:py-20 px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
              Chcete prodávat s námi?
            </h2>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto text-base sm:text-lg">
              Získejte přístup k širokému zázemí a moderním nástrojům pro
              správu vozidel
            </p>
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <Link href="/kariera" className="no-underline">
                <Button variant="primary" size="lg">
                  Registrace makléře
                </Button>
              </Link>
              <Link href="/o-nas" className="no-underline">
                <Button variant="outline" size="lg" className="!border-2 !border-white/30 !text-white !bg-transparent !shadow-none hover:!bg-white/10 hover:!border-white/50">
                  Zjistit více o CarMakléři
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
