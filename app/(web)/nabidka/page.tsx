import type { Metadata } from "next";
import Link from "next/link";
import { VehicleCard } from "@/components/web/VehicleCard";
import { VehicleFilters } from "@/components/web/VehicleFilters";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import type { VehicleData } from "@/components/web/VehicleCard";

export const metadata: Metadata = {
  title: "Nabídka vozidel",
  description:
    "Prohlédněte si nabídku prověřených ojetých vozidel od certifikovaných makléřů i soukromých prodejců. Filtry, řazení a snadné vyhledávání.",
  openGraph: {
    title: "Nabídka vozidel | CarMakléř",
    description:
      "Prověřená ojetá vozidla od makléřů i soukromých prodejců. Snadné vyhledávání s filtry.",
  },
};

/* ------------------------------------------------------------------ */
/*  Fuel / Transmission label mapování                                 */
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

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuál",
  AUTOMATIC: "Automat",
  DSG: "DSG",
  CVT: "CVT",
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

  // Build Prisma where clause
  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (params.brand) where.brand = params.brand;
  if (params.model) where.model = params.model;
  if (params.fuelType) where.fuelType = params.fuelType;
  if (params.transmission) where.transmission = params.transmission;
  if (params.bodyType) where.bodyType = params.bodyType;
  if (params.sellerType) where.sellerType = params.sellerType;

  // Price range
  if (params.minPrice || params.maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (params.minPrice) priceFilter.gte = parseInt(params.minPrice, 10);
    if (params.maxPrice) priceFilter.lte = parseInt(params.maxPrice, 10);
    where.price = priceFilter;
  }

  // Year range
  if (params.minYear || params.maxYear) {
    const yearFilter: Record<string, number> = {};
    if (params.minYear) yearFilter.gte = parseInt(params.minYear, 10);
    if (params.maxYear) yearFilter.lte = parseInt(params.maxYear, 10);
    where.year = yearFilter;
  }

  // Sort
  type SortOrder = "asc" | "desc";
  let orderBy: Record<string, SortOrder>;
  switch (params.sort) {
    case "cheapest":
      orderBy = { price: "asc" };
      break;
    case "expensive":
      orderBy = { price: "desc" };
      break;
    case "lowestkm":
      orderBy = { mileage: "asc" };
      break;
    case "newest":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  // Pagination
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = 18;
  const skip = (page - 1) * limit;

  const [dbVehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        broker: {
          select: { id: true, firstName: true, lastName: true, slug: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.vehicle.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Map DB data to VehicleData format
  const vehicles: VehicleData[] = dbVehicles.map((v) => {
    const primaryImage = v.images[0];
    const formattedKm =
      new Intl.NumberFormat("cs-CZ").format(v.mileage) + " km";
    const formattedPrice = new Intl.NumberFormat("cs-CZ").format(v.price);
    const fuelLabel = fuelLabels[v.fuelType] || v.fuelType;
    const transLabel = transmissionLabels[v.transmission] || v.transmission;
    const brokerName = v.broker
      ? `${v.broker.firstName} ${v.broker.lastName}`
      : undefined;

    // Badge logic
    let badge: "verified" | "top" | "default" = "default";
    if (v.trustScore >= 95) badge = "top";
    else if (v.trustScore >= 80) badge = "verified";

    return {
      id: v.id,
      name: `${v.brand} ${v.model}${v.variant ? " " + v.variant : ""}`,
      year: v.year,
      km: formattedKm,
      fuel: fuelLabel,
      transmission: transLabel,
      city: v.city,
      hp: v.enginePower ? `${v.enginePower} HP` : "",
      price: formattedPrice,
      trust: v.trustScore,
      badge,
      photo: primaryImage?.url || "/images/placeholder-car.jpg",
      slug: v.slug || v.id,
      sellerType: v.sellerType as "broker" | "private",
      brokerName,
    };
  });

  return (
    <main className="min-h-screen bg-gray-50">
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
                vozidel od makléřů i soukromých prodejců
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
        {/* Filter bar */}
        <div className="mb-8">
          <VehicleFilters resultCount={total} />
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
    </main>
  );
}
