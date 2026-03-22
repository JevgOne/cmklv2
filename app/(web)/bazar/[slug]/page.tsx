import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const partner = await prisma.partner.findUnique({
    where: { slug },
    select: { name: true, city: true, description: true },
  });

  if (!partner) return { title: "Partner nenalezen" };

  return {
    title: `${partner.name} | Overeny partner Carmakler`,
    description: partner.description || `Autobazar ${partner.name} v ${partner.city || "CR"} — overeny partner Carmakler.`,
  };
}

export default async function BazarProfilePage({ params }: Props) {
  const { slug } = await params;

  const partner = await prisma.partner.findUnique({
    where: { slug },
  });

  if (!partner || partner.status !== "AKTIVNI_PARTNER" || partner.type !== "AUTOBAZAR") {
    notFound();
  }

  // Get partner's vehicles
  let vehicles: Array<{
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    slug: string | null;
    images: Array<{ url: string }>;
  }> = [];

  if (partner.userId) {
    vehicles = await prisma.vehicle.findMany({
      where: { brokerId: partner.userId, status: "ACTIVE" },
      select: {
        id: true,
        brand: true,
        model: true,
        year: true,
        price: true,
        mileage: true,
        slug: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  const openingHours = partner.openingHours
    ? (() => { try { return JSON.parse(partner.openingHours); } catch { return null; } })()
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
        {partner.logo ? (
          <img
            src={partner.logo}
            alt={partner.name}
            className="w-24 h-24 rounded-2xl object-cover bg-gray-100"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center text-4xl">
            🏢
          </div>
        )}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-gray-900">
              {partner.name}
            </h1>
            <Badge variant="verified">Overeny partner</Badge>
          </div>
          {partner.city && (
            <p className="text-gray-500 mb-1">📍 {partner.address || partner.city}</p>
          )}
          {partner.phone && (
            <p className="text-gray-500">📞 {partner.phone}</p>
          )}
          {partner.googleRating && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-500">⭐</span>
              <span className="font-bold">{partner.googleRating.toFixed(1)}</span>
              {partner.googleReviewCount && (
                <span className="text-gray-400 text-sm">
                  ({partner.googleReviewCount} hodnoceni)
                </span>
              )}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-2">
            Na Carmakler od {new Date(partner.createdAt).toLocaleDateString("cs-CZ")}
          </div>
        </div>
      </div>

      {/* Description */}
      {partner.description && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">O nas</h2>
          <p className="text-gray-600 whitespace-pre-line">{partner.description}</p>
        </Card>
      )}

      {/* Opening hours */}
      {openingHours && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Oteviraci doba</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(openingHours as Record<string, string>).map(([day, hours]) => (
              <div key={day} className="flex justify-between">
                <span className="font-medium text-gray-700">{day}</span>
                <span className="text-gray-500">{hours}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Vehicles */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Vozidla ({vehicles.length})
        </h2>
        {vehicles.length === 0 ? (
          <p className="text-gray-400">Zadna vozidla k dispozici.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <Card key={v.id} hover className="overflow-hidden">
                <div className="aspect-[16/10] bg-gray-100">
                  {v.images[0] ? (
                    <img
                      src={v.images[0].url}
                      alt={`${v.brand} ${v.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                      🚗
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">
                    {v.brand} {v.model} ({v.year})
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-orange-500">
                      {new Intl.NumberFormat("cs-CZ", {
                        style: "currency",
                        currency: "CZK",
                        maximumFractionDigits: 0,
                      }).format(v.price)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Intl.NumberFormat("cs-CZ").format(v.mileage)} km
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Kontakt</h2>
        <div className="space-y-2 text-sm">
          {partner.address && (
            <div className="flex gap-2">
              <span>📍</span>
              <span className="text-gray-600">{partner.address}</span>
            </div>
          )}
          {partner.phone && (
            <div className="flex gap-2">
              <span>📞</span>
              <a href={`tel:${partner.phone}`} className="text-orange-500 font-semibold">
                {partner.phone}
              </a>
            </div>
          )}
          {partner.email && (
            <div className="flex gap-2">
              <span>📧</span>
              <a href={`mailto:${partner.email}`} className="text-orange-500 font-semibold">
                {partner.email}
              </a>
            </div>
          )}
          {partner.web && (
            <div className="flex gap-2">
              <span>🌐</span>
              <a
                href={partner.web}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 font-semibold"
              >
                {partner.web}
              </a>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
