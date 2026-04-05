import Link from "next/link";
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

  if (!partner) return { title: "Dodavatel nenalezen" };

  return {
    title: `${partner.name} | Ověřený dodavatel CarMakléř`,
    description: partner.description || `Dodavatel autodílů ${partner.name} — ověřený partner CarMakléř.`,
  };
}

export default async function DodavatelProfilePage({ params }: Props) {
  const { slug } = await params;

  const partner = await prisma.partner.findUnique({
    where: { slug },
  });

  if (!partner || partner.status !== "AKTIVNI_PARTNER" || partner.type !== "VRAKOVISTE") {
    notFound();
  }

  // Get partner's parts
  let parts: Array<{
    id: string;
    name: string;
    compatibleBrands: string | null;
    compatibleModels: string | null;
    price: number;
    condition: string;
    slug: string;
  }> = [];

  if (partner.userId) {
    parts = await prisma.part.findMany({
      where: { supplierId: partner.userId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        compatibleBrands: true,
        compatibleModels: true,
        price: true,
        condition: true,
        slug: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

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
            🔧
          </div>
        )}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-gray-900">
              {partner.name}
            </h1>
            <Badge variant="verified">Ověřený dodavatel</Badge>
          </div>
          {partner.city && (
            <p className="text-gray-500 mb-1">📍 {partner.address || partner.city}</p>
          )}
          {partner.phone && (
            <p className="text-gray-500">📞 {partner.phone}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {partner.description && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">O nás</h2>
          <p className="text-gray-600 whitespace-pre-line">{partner.description}</p>
        </Card>
      )}

      {/* Parts */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Nabízené díly ({parts.length})
        </h2>
        {parts.length === 0 ? (
          <p className="text-gray-500">Žádné díly k dispozici.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {parts.map((p) => (
              <Link
                key={p.id}
                href={`/dily/${p.slug}`}
                className="block no-underline"
              >
                <Card hover className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">
                    {p.name}
                  </h3>
                  <div className="text-xs text-gray-500 mb-2">
                    {p.compatibleBrands ? JSON.parse(p.compatibleBrands).join(", ") : ""} {p.compatibleModels ? JSON.parse(p.compatibleModels).join(", ") : ""} | {p.condition}
                  </div>
                  <span className="text-lg font-extrabold text-orange-500">
                    {new Intl.NumberFormat("cs-CZ", {
                      style: "currency",
                      currency: "CZK",
                      maximumFractionDigits: 0,
                    }).format(p.price)}
                  </span>
                </Card>
              </Link>
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
              <a href={partner.web} target="_blank" rel="noopener noreferrer" className="text-orange-500 font-semibold">
                {partner.web}
              </a>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
