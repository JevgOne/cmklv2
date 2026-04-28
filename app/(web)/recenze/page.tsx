import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { ReviewList } from "@/components/web/ReviewList";

export const revalidate = 3600;

export default async function RecenzePage() {
  const reviews = await prisma.review.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  return (
    <main>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li><Link href="/" className="hover:text-orange-500 transition-colors no-underline">Domů</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Recenze</li>
        </ol>
      </nav>

      {/* Header */}
      <section className="py-10 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900">
            Co o nás říkají klienti
          </h1>
          {reviews.length > 0 ? (
            <p className="text-gray-500 mt-4 text-lg">
              {avgRating} z 5 ★ · {reviews.length} recenzí
            </p>
          ) : (
            <p className="text-gray-500 mt-4 text-lg">
              Zatím žádné recenze
            </p>
          )}
        </div>
      </section>

      {/* Filter + Reviews */}
      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Zatím žádné recenze</h3>
              <p className="text-sm text-gray-500 mb-6">Buďte první, kdo nám napíše!</p>
              <a href="mailto:info@carmakler.cz?subject=Recenze%20CarMakl%C3%A9%C5%99" className="no-underline">
                <Button variant="primary" size="lg">
                  Napište nám recenzi
                </Button>
              </a>
            </div>
          ) : (
            <>
              <ReviewList
                reviews={reviews.map((r) => ({
                  id: r.id,
                  rating: r.rating,
                  text: r.text,
                  authorName: r.authorName,
                  authorCity: r.authorCity,
                  type: r.type,
                  createdAt: r.createdAt.toISOString(),
                }))}
              />

              {/* CTA */}
              <div className="text-center mt-12">
                <a href="mailto:info@carmakler.cz?subject=Recenze%20CarMakl%C3%A9%C5%99" className="no-underline">
                  <Button variant="primary" size="lg">
                    Napište nám recenzi
                  </Button>
                </a>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Cross-linking */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/chci-prodat" className="no-underline block">
              <Card hover className="p-6 text-center h-full">
                <h3 className="font-bold text-gray-900 mb-2">Chcete prodat auto?</h3>
                <p className="text-sm text-gray-500">Průměrná doba prodeje 20 dní</p>
                <span className="inline-block mt-3 text-orange-500 font-semibold text-sm">Prodat auto &rarr;</span>
              </Card>
            </Link>
            <Link href="/makleri" className="no-underline block">
              <Card hover className="p-6 text-center h-full">
                <h3 className="font-bold text-gray-900 mb-2">Naši makléři</h3>
                <p className="text-sm text-gray-500">Ověření makléři po celé ČR</p>
                <span className="inline-block mt-3 text-orange-500 font-semibold text-sm">Zobrazit makléře &rarr;</span>
              </Card>
            </Link>
            <Link href="/nabidka" className="no-underline block">
              <Card hover className="p-6 text-center h-full">
                <h3 className="font-bold text-gray-900 mb-2">Nabídka vozidel</h3>
                <p className="text-sm text-gray-500">Prověřená auta od makléřů</p>
                <span className="inline-block mt-3 text-orange-500 font-semibold text-sm">Zobrazit nabídku &rarr;</span>
              </Card>
            </Link>
            <Link href="/jak-to-funguje" className="no-underline block">
              <Card hover className="p-6 text-center h-full">
                <h3 className="font-bold text-gray-900 mb-2">Jak to funguje</h3>
                <p className="text-sm text-gray-500">Prodej i nákup krok za krokem</p>
                <span className="inline-block mt-3 text-orange-500 font-semibold text-sm">Zjistit více &rarr;</span>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
