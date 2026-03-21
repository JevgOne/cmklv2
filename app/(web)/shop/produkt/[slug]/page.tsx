import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProductCard } from "@/components/web/ProductCard";
import type { ProductCardProps } from "@/components/web/ProductCard";
import { ProductDetailTabs } from "./ProductDetailTabs";
import { AddToCartButton } from "./AddToCartButton";

/* ------------------------------------------------------------------ */
/*  Static params                                                      */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return [{ slug: "dvere-predni-leve-octavia-iii" }];
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const product = {
  name: "Dveře přední levé",
  compatibility: "Škoda Octavia III (5E) 2013-2020",
  partNumber: "OE: 5E4 831 051",
  condition: 4,
  conditionLabel: "Velmi dobrý",
  conditionNotes: [
    "Bez koroze",
    "Funkční mechanismus",
    "Drobné oděrky na hraně",
    "Originál sklo, lišty, madlo",
  ],
  color: "Bílá Candy (kód LS9R)",
  origin: {
    wreckedId: "V2847",
    year: 2019,
    mileage: "85 000 km",
    damageReason: "Náraz zezadu (přední část OK)",
  },
  price: 4500,
  inStock: true,
  stockLocation: "Vrakoviště Praha",
  shipping: [
    { method: "Osobní odběr", price: "Zdarma" },
    { method: "PPL", price: "299 Kč" },
  ],
};

const similarProducts: ProductCardProps[] = [
  {
    name: "Dveře přední pravé",
    compatibility: "Škoda Octavia III 2013-2020",
    condition: 3,
    price: 3800,
    badge: "used",
    slug: "dvere-predni-leve-octavia-iii",
  },
  {
    name: "Dveře zadní levé",
    compatibility: "Škoda Octavia III 2013-2020",
    condition: 4,
    price: 3500,
    badge: "used",
    slug: "dvere-predni-leve-octavia-iii",
  },
  {
    name: "Blatník přední levý",
    compatibility: "Škoda Octavia III 2013-2020",
    condition: 5,
    price: 2800,
    badge: "used",
    slug: "dvere-predni-leve-octavia-iii",
  },
];

/* ------------------------------------------------------------------ */
/*  Stars helper                                                       */
/* ------------------------------------------------------------------ */

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= count ? "text-orange-400" : "text-gray-200"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function formatCzk(price: number): string {
  return new Intl.NumberFormat("cs-CZ").format(price);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProductDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/shop"
              className="hover:text-orange-500 transition-colors no-underline text-gray-500"
            >
              Shop
            </Link>
            <span>/</span>
            <Link
              href="/shop/katalog"
              className="hover:text-orange-500 transition-colors no-underline text-gray-500"
            >
              Katalog
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              Dveře přední levé
            </span>
          </nav>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Main product layout                                           */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Left — Gallery */}
          <div>
            {/* Main image */}
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
              <div className="text-center">
                <span className="text-7xl block mb-3">🚗</span>
                <span className="text-sm text-gray-400">Foto 1/4</span>
              </div>
            </div>
            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`aspect-square bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                    i === 1
                      ? "ring-2 ring-orange-500"
                      : "hover:ring-2 hover:ring-gray-300"
                  }`}
                >
                  <span className="text-2xl text-gray-300">📷</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Product info */}
          <div>
            {/* Badge */}
            <div className="mb-3">
              <Badge variant="default">Z vraku</Badge>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
              {product.name}
            </h1>

            {/* Compatibility */}
            <p className="text-gray-500 mt-2 text-lg">
              {product.compatibility}
            </p>

            {/* Part number */}
            <p className="text-sm text-gray-400 mt-1 font-mono">
              {product.partNumber}
            </p>

            {/* Divider */}
            <hr className="my-6 border-gray-200" />

            {/* Condition */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                Stav dílu
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <Stars count={product.condition} />
                <span className="font-semibold text-gray-900">
                  {product.conditionLabel}
                </span>
              </div>
              <ul className="space-y-1.5">
                {product.conditionNotes.map((note) => (
                  <li
                    key={note}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            {/* Color */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">
                Barva
              </h3>
              <p className="text-gray-600">{product.color}</p>
            </div>

            {/* Origin */}
            <div className="mb-6 p-4 bg-gray-100 rounded-xl">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                Původ
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Vrak:</span>{" "}
                  <span className="font-medium text-gray-900">
                    #{product.origin.wreckedId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Rok:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {product.origin.year}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Najeto:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {product.origin.mileage}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Poškození:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {product.origin.damageReason}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="my-6 border-gray-200" />

            {/* Price */}
            <div className="mb-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                {formatCzk(product.price)} Kč
              </div>
              <p className="text-sm text-gray-400 mt-1">Cena včetně DPH</p>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <span className="text-green-600 font-semibold text-sm">
                Skladem ({product.stockLocation})
              </span>
            </div>

            {/* Shipping */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {product.shipping.map((s) => (
                  <span key={s.method}>
                    {s.method}:{" "}
                    <span className="font-semibold">{s.price}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <AddToCartButton />

            {/* Contact */}
            <div className="mt-4 text-center">
              <Link
                href="/kontakt"
                className="text-orange-500 font-semibold text-sm hover:text-orange-600 transition-colors no-underline"
              >
                Máte dotaz? Napište nám
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Tabs: Popis / Kompatibilita / Záruka                        */}
        {/* ============================================================ */}
        <div className="mt-12">
          <ProductDetailTabs />
        </div>

        {/* ============================================================ */}
        {/* Similar parts                                                */}
        {/* ============================================================ */}
        <section className="mt-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8">
            Podobné díly
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProducts.map((p) => (
              <ProductCard key={p.name} {...p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
