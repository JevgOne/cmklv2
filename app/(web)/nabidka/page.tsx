import type { Metadata } from "next";
import Link from "next/link";
import { VehicleCard } from "@/components/web/VehicleCard";
import { VehicleFilters } from "@/components/web/VehicleFilters";
import { QuickFilters } from "@/components/web/QuickFilters";
import { WatchdogEmailForm } from "@/components/web/WatchdogEmailForm";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import type { VehicleData } from "@/components/web/VehicleCard";
import { pageCanonical } from "@/lib/canonical";
import { fuelLabels, transmissionLabels } from "@/lib/vehicle-labels";

export const revalidate = 300; // ISR: 5 minut

export const metadata: Metadata = {
  title: "Nabídka vozidel",
  description:
    "Prohlédněte si nabídku prověřených ojetých vozidel od ověřených makléřů i soukromých prodejců. Filtry, řazení a snadné vyhledávání.",
  openGraph: {
    title: "Nabídka vozidel | CarMakléř",
    description:
      "Prověřená ojetá vozidla od makléřů i soukromých prodejců. Snadné vyhledávání s filtry.",
  },
  alternates: pageCanonical("/nabidka"),
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function NabidkaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  // Determine if filtering by seller type
  const sellerTypeFilter = params.sellerType;
  // "dealer" maps to Listing.listingType === "DEALER"
  // "broker" maps to Vehicle.sellerType === "broker" or Listing.listingType === "BROKER"
  // "private" maps to Vehicle.sellerType === "private" or Listing.listingType === "PRIVATE"

  // Build Vehicle where clause
  const vehicleWhere: Record<string, unknown> = { status: "ACTIVE" };
  if (params.brand) vehicleWhere.brand = params.brand;
  if (params.model) vehicleWhere.model = params.model;
  if (params.fuelType) vehicleWhere.fuelType = params.fuelType;
  if (params.transmission) vehicleWhere.transmission = params.transmission;
  if (params.bodyType) vehicleWhere.bodyType = params.bodyType;
  if (sellerTypeFilter === "broker") vehicleWhere.sellerType = "broker";
  else if (sellerTypeFilter === "private") vehicleWhere.sellerType = "private";
  else if (sellerTypeFilter === "dealer") {
    // No Vehicle results for dealer filter
    vehicleWhere.id = "__NONE__";
  }

  // Build Listing where clause
  const listingWhere: Record<string, unknown> = { status: "ACTIVE" };
  if (params.brand) listingWhere.brand = params.brand;
  if (params.model) listingWhere.model = params.model;
  if (params.fuelType) listingWhere.fuelType = params.fuelType;
  if (params.transmission) listingWhere.transmission = params.transmission;
  if (params.bodyType) listingWhere.bodyType = params.bodyType;
  if (sellerTypeFilter === "broker") listingWhere.listingType = "BROKER";
  else if (sellerTypeFilter === "private") listingWhere.listingType = "PRIVATE";
  else if (sellerTypeFilter === "dealer") listingWhere.listingType = "DEALER";

  // Price range — shared
  if (params.minPrice || params.maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (params.minPrice) priceFilter.gte = parseInt(params.minPrice, 10);
    if (params.maxPrice) priceFilter.lte = parseInt(params.maxPrice, 10);
    vehicleWhere.price = priceFilter;
    listingWhere.price = { ...priceFilter };
  }

  // Year range — shared
  if (params.minYear || params.maxYear) {
    const yearFilter: Record<string, number> = {};
    if (params.minYear) yearFilter.gte = parseInt(params.minYear, 10);
    if (params.maxYear) yearFilter.lte = parseInt(params.maxYear, 10);
    vehicleWhere.year = yearFilter;
    listingWhere.year = { ...yearFilter };
  }

  // Pagination
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = 18;

  // Fetch both Vehicle and Listing counts
  const [dbVehicles, vehicleTotal, dbListings, listingTotal] = await Promise.all([
    prisma.vehicle.findMany({
      where: vehicleWhere,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        broker: {
          select: { id: true, firstName: true, lastName: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.count({ where: vehicleWhere }),
    prisma.listing.findMany({
      where: listingWhere,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        user: {
          select: { id: true, firstName: true, lastName: true, companyName: true },
        },
      },
      orderBy: [{ isPremium: "desc" }, { createdAt: "desc" }],
    }),
    prisma.listing.count({ where: listingWhere }),
  ]);

  const total = vehicleTotal + listingTotal;

  // Map Vehicle data
  const vehicleCards: VehicleData[] = dbVehicles.map((v) => {
    const primaryImage = v.images[0];
    const brokerName = v.broker
      ? `${v.broker.firstName} ${v.broker.lastName}`
      : undefined;

    let badge: "verified" | "top" | "default" = "default";
    if (v.trustScore >= 95) badge = "top";
    else if (v.trustScore >= 80) badge = "verified";

    return {
      id: v.id,
      name: `${v.brand} ${v.model}${v.variant ? " " + v.variant : ""}`,
      year: v.year,
      km: new Intl.NumberFormat("cs-CZ").format(v.mileage) + " km",
      fuel: fuelLabels[v.fuelType] || v.fuelType,
      transmission: transmissionLabels[v.transmission] || v.transmission,
      city: v.city,
      hp: v.enginePower ? `${v.enginePower} HP` : "",
      price: new Intl.NumberFormat("cs-CZ").format(v.price),
      trust: v.trustScore,
      badge,
      photo: primaryImage?.url || "/images/placeholder-car.jpg",
      slug: v.slug || v.id,
      sellerType: v.sellerType as "broker" | "private",
      brokerName,
      source: "vehicle" as const,
    };
  });

  // Map Listing data
  const listingCards: VehicleData[] = dbListings.map((l) => {
    const primaryImage = l.images[0];
    const sellerName = l.user.companyName || `${l.user.firstName} ${l.user.lastName}`;

    return {
      id: l.id,
      name: `${l.brand} ${l.model}${l.variant ? " " + l.variant : ""}`,
      year: l.year,
      km: new Intl.NumberFormat("cs-CZ").format(l.mileage) + " km",
      fuel: fuelLabels[l.fuelType] || l.fuelType,
      transmission: transmissionLabels[l.transmission] || l.transmission,
      city: l.city,
      hp: l.enginePower ? `${l.enginePower} HP` : "",
      price: new Intl.NumberFormat("cs-CZ").format(l.price),
      trust: 0,
      badge: l.isPremium ? ("top" as const) : ("default" as const),
      photo: primaryImage?.url || "/images/placeholder-car.jpg",
      slug: l.slug,
      sellerType: "listing" as const,
      listingType: l.listingType as "BROKER" | "DEALER" | "PRIVATE",
      isPremium: l.isPremium,
      brokerName: l.listingType === "DEALER" ? sellerName : undefined,
      source: "listing" as const,
    };
  });

  // Merge and sort
  let allCards = [...listingCards.filter((c) => c.isPremium), ...vehicleCards, ...listingCards.filter((c) => !c.isPremium)];

  // Apply sort
  type SortOrder = "asc" | "desc";
  const sortKey = params.sort || "newest";
  if (sortKey === "cheapest") {
    allCards.sort((a, b) => parseInt(a.price.replace(/\s/g, ""), 10) - parseInt(b.price.replace(/\s/g, ""), 10));
  } else if (sortKey === "expensive") {
    allCards.sort((a, b) => parseInt(b.price.replace(/\s/g, ""), 10) - parseInt(a.price.replace(/\s/g, ""), 10));
  }
  // newest and lowestkm are already ordered from DB queries

  // Paginate the merged results
  const skip = (page - 1) * limit;
  const vehicles = allCards.slice(skip, skip + limit);
  const totalPages = Math.ceil(total / limit);

  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nabídka vozidel — CarMakléř",
    description: "Prověřená ojetá vozidla od ověřených makléřů i soukromých prodejců.",
    numberOfItems: total,
    itemListElement: vehicles.slice(0, 10).map((car, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://carmakler.cz/nabidka/${car.slug}`,
      name: car.name,
    })),
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }}
      />
      {/* ============================================================ */}
      {/* Hero strip                                                    */}
      {/* ============================================================ */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Nabídka vozidel
              </h1>
              <p className="text-gray-500 mt-2">
                <span className="font-bold text-orange-500">{total}</span>{" "}
                vozidel od makléřů, autobazarů i soukromých prodejců
              </p>
            </div>
            <Link href="/inzerce/pridat" className="no-underline shrink-0">
              <Button variant="outline" size="default">
                Vložit inzerát zdarma
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Filters + Grid                                                */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick filters */}
        <div className="mb-4">
          <QuickFilters />
        </div>

        {/* Filter bar */}
        <div className="mb-4">
          <VehicleFilters resultCount={total} />
        </div>

        {/* Watchdog email-only form */}
        <div className="mb-8">
          <WatchdogEmailForm />
        </div>

        {/* Vehicle grid or empty state */}
        {vehicles.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-[32px]">
              🚗
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Žádná vozidla nenalezena</h3>
            <p className="text-gray-500 mb-6">Zkuste upravit filtry nebo se podívejte později. Nová vozidla přibývají každý den.</p>
            <Link href="/nabidka" className="no-underline">
              <Button variant="primary">
                Resetovat filtry
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((car) => (
                <VehicleCard key={car.id} car={car} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                {page > 1 && (
                  <Link
                    href={`/nabidka?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                    className="no-underline"
                  >
                    <Button variant="outline" size="default">
                      &larr; Předchozí
                    </Button>
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  Stránka {page} z {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/nabidka?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                    className="no-underline"
                  >
                    <Button variant="outline" size="default">
                      Další &rarr;
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Cross-linking SEO section */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">
            Další služby CarMakléř
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Link href="/chci-prodat" className="text-orange-500 hover:text-orange-600 no-underline font-medium">
              Prodat auto přes makléře
            </Link>
            <Link href="/sluzby/proverka" className="text-orange-500 hover:text-orange-600 no-underline font-medium">
              Prověrka vozidla před koupí
            </Link>
            <Link href="/sluzby/financovani" className="text-orange-500 hover:text-orange-600 no-underline font-medium">
              Financování auta na splátky
            </Link>
            <Link href="/sluzby/pojisteni" className="text-orange-500 hover:text-orange-600 no-underline font-medium">
              Pojištění vozidla online
            </Link>
            <Link href="/makleri" className="text-orange-500 hover:text-orange-600 no-underline font-medium">
              Najít ověřeného makléře
            </Link>
            <Link href="/nabidka/porovnani" className="text-orange-500 hover:text-orange-600 no-underline font-medium">
              Porovnání vozidel
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
