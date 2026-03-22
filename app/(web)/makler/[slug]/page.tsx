import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VehicleCard } from "@/components/web/VehicleCard";
import { MaklerContactForm } from "./MaklerContactForm";
import type { VehicleData } from "@/components/web/VehicleCard";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const broker = await prisma.user.findFirst({
      where: { slug, role: "BROKER", status: "ACTIVE" },
      select: { firstName: true, lastName: true },
    });

    if (broker) {
      return {
        title: `${broker.firstName} ${broker.lastName} — CarMakléř`,
        description: `Profil certifikovaného automakléře ${broker.firstName} ${broker.lastName}. Hodnocení, aktivní vozidla a kontakt.`,
      };
    }
  } catch {
    /* DB error */
  }

  return {
    title: "Profil makléře — CarMakléř",
    description:
      "Profil certifikovaného automakléře CarMakléř. Hodnocení, recenze, aktivní vozidla a kontakt.",
  };
}

/* ------------------------------------------------------------------ */
/*  Label maps                                                         */
/* ------------------------------------------------------------------ */

const fuelLabels: Record<string, string> = {
  PETROL: "Benzín",
  DIESEL: "Diesel",
  ELECTRIC: "Elektro",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in Hybrid",
  LPG: "LPG",
  CNG: "CNG",
};

const transLabels: Record<string, string> = {
  MANUAL: "Manuál",
  AUTOMATIC: "Automat",
  DSG: "DSG",
  CVT: "CVT",
};

const levelBadges: Record<string, { variant: "top" | "default" | "verified"; label: string }[]> = {
  TOP: [
    { variant: "top", label: "TOP Makléř" },
    { variant: "default", label: "Rychlá reakce" },
  ],
  SENIOR: [{ variant: "top", label: "TOP Makléř" }],
  BROKER: [{ variant: "verified", label: "Ověřený" }],
  JUNIOR: [{ variant: "verified", label: "Ověřený" }],
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function MaklerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let broker;
  try {
    broker = await prisma.user.findFirst({
      where: { slug, role: "BROKER", status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        cities: true,
        bio: true,
        level: true,
        totalSales: true,
        createdAt: true,
        vehicles: {
          where: { status: "ACTIVE" },
          include: { images: { where: { isPrimary: true }, take: 1 } },
          orderBy: { createdAt: "desc" },
          take: 8,
        },
      },
    });
  } catch {
    /* DB error */
  }

  if (!broker) {
    notFound();
  }

  const initials =
    (broker.firstName?.[0] ?? "") + (broker.lastName?.[0] ?? "");
  const cities: string[] = broker.cities
    ? (() => { try { return JSON.parse(broker.cities); } catch { return []; } })()
    : [];
  const primaryCity = cities[0] || "ČR";
  const memberSince = new Intl.DateTimeFormat("cs-CZ", {
    month: "long",
    year: "numeric",
  }).format(broker.createdAt);
  const badges = levelBadges[broker.level] || levelBadges.JUNIOR;

  const activeVehicleCount = broker.vehicles.length;

  const vehicles: VehicleData[] = broker.vehicles.map((v) => ({
    id: v.id,
    name: `${v.brand} ${v.model}${v.variant ? " " + v.variant : ""}`,
    year: v.year,
    km: new Intl.NumberFormat("cs-CZ").format(v.mileage) + " km",
    fuel: fuelLabels[v.fuelType] || v.fuelType,
    transmission: transLabels[v.transmission] || v.transmission,
    city: v.city,
    hp: v.enginePower ? `${v.enginePower} HP` : "",
    price: new Intl.NumberFormat("cs-CZ").format(v.price),
    trust: v.trustScore,
    badge: v.trustScore >= 90 ? "top" : "verified",
    photo: v.images[0]?.url || "/images/placeholder-car.jpg",
    slug: v.slug || undefined,
    sellerType: "broker",
    brokerName: `${broker.firstName} ${broker.lastName}`,
  }));

  const stats = [
    {
      value: String(broker.totalSales),
      label: "Prodejů",
      highlight: false,
    },
    {
      value:
        broker.level === "TOP"
          ? "TOP"
          : broker.level === "SENIOR"
          ? "Senior"
          : "Makléř",
      label: "Úroveň",
      highlight: true,
    },
    {
      value: String(activeVehicleCount),
      label: "Aktivních vozidel",
      highlight: false,
    },
  ];

  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 py-10 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* Avatar */}
            {broker.avatar ? (
              <img
                src={broker.avatar}
                alt={`${broker.firstName} ${broker.lastName}`}
                className="w-[80px] h-[80px] sm:w-[120px] sm:h-[120px] rounded-2xl object-cover shrink-0"
              />
            ) : (
              <div className="w-[80px] h-[80px] sm:w-[120px] sm:h-[120px] bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-[28px] sm:text-[44px] font-extrabold text-white shrink-0">
                {initials}
              </div>
            )}

            {/* Info */}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
                {broker.firstName} {broker.lastName}
              </h1>
              <p className="text-orange-400 font-semibold mt-2">
                Certifikovaný makléř CarMakléř
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
                <span className="text-white/60 text-sm">
                  {primaryCity}
                </span>
                <span className="text-white/60 text-sm">
                  · Člen od {memberSince}
                </span>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                {badges.map((b, i) => (
                  <Badge key={i} variant={b.variant}>
                    {b.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4">
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
      {broker.bio && (
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 mb-4">
              O makléři
            </h2>
            <p className="text-gray-600 leading-relaxed">{broker.bio}</p>
          </div>
        </section>
      )}

      {/* Vehicles */}
      {vehicles.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
                Vozidla makléře
              </h2>
              <span className="text-sm text-gray-500">
                {activeVehicleCount} aktivních vozidel
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {vehicles.map((car) => (
                <VehicleCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact form + Call CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Form */}
            <MaklerContactForm />

            {/* Call CTA */}
            {broker.phone && (
              <div className="flex flex-col justify-center items-center text-center gap-6">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl">
                  📞
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Raději zavolejte?
                  </h3>
                  <p className="text-gray-500 mt-2">
                    {broker.firstName} je k dispozici Po-Pá 8:00-18:00
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
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
