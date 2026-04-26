import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { pageCanonical } from "@/lib/canonical";
import { BASE_URL } from "@/lib/seo-data";
import { NewsletterSignup } from "@/components/web/blog/NewsletterSignup";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — magazín o autech",
  description:
    "Rady, tipy, recenze a analýzy z automobilového světa. Průvodce nákupem a prodejem ojetin od CarMakléř.",
  openGraph: {
    title: "Blog | CarMakléř",
    description:
      "Rady, tipy, recenze a analýzy z automobilového světa. Průvodce nákupem a prodejem ojetin.",
  },
  alternates: pageCanonical("/blog"),
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>;
}) {
  const { page: pageParam, category: categorySlug, tag: tagSlug } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const perPage = 12;

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (categorySlug) {
    const cat = await prisma.articleCategory.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });
    if (cat) where.categoryId = cat.id;
  }
  if (tagSlug) {
    const tag = await prisma.articleTag.findUnique({
      where: { slug: tagSlug },
      select: { id: true },
    });
    if (tag) {
      where.tags = { some: { tagId: tag.id } };
    }
  }

  const [articles, total, categories, featured, articleTags] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true, icon: true } },
        author: { select: { firstName: true, lastName: true, avatar: true, slug: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.article.count({ where }),
    prisma.articleCategory.findMany({
      include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } },
      orderBy: { name: "asc" },
    }),
    !categorySlug && page === 1
      ? prisma.article.findFirst({
          where: { status: "PUBLISHED", coverImage: { not: null } },
          include: {
            category: { select: { name: true, slug: true, icon: true } },
            author: { select: { firstName: true, lastName: true, avatar: true, slug: true } },
          },
          orderBy: { publishedAt: "desc" },
        })
      : null,
    prisma.articleTag.findMany({
      include: { _count: { select: { articles: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "CarMakléř Blog",
    url: `${BASE_URL}/blog`,
    description: "Magazín o autech — rady, tipy, recenze a analýzy.",
    publisher: {
      "@type": "Organization",
      name: "CarMakléř",
      url: BASE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: "Domů", href: "/" }, { label: "Blog" }]} />

        <h1 className="text-3xl md:text-4xl font-extrabold mt-6 mb-2">
          Blog <span className="text-orange-500">&</span> Magazín
        </h1>
        <p className="text-gray-500 mb-8 max-w-2xl">
          Rady, tipy, recenze a analýzy z automobilového světa. Vše, co potřebujete vědět o nákupu a prodeji aut.
        </p>

        {/* Featured article */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="block mb-10 group no-underline">
            <Card className="overflow-hidden">
              <div className="md:flex">
                {featured.coverImage && (
                  <div className="md:w-1/2 relative aspect-[16/9] md:aspect-auto">
                    <Image
                      src={featured.coverImage}
                      alt={featured.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
                <div className={`p-6 md:p-8 flex flex-col justify-center ${featured.coverImage ? "md:w-1/2" : ""}`}>
                  <Badge className="self-start mb-3">
                    {featured.category.icon} {featured.category.name}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold group-hover:text-orange-500 transition-colors mb-3">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-gray-500 mb-4 line-clamp-3">{featured.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span>
                      {featured.author.firstName} {featured.author.lastName}
                    </span>
                    <span>·</span>
                    {featured.publishedAt && <span>{formatDate(featured.publishedAt)}</span>}
                    {featured.readTime && (
                      <>
                        <span>·</span>
                        <span>{featured.readTime} min čtení</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}

        <div className="lg:flex gap-8">
          {/* Articles grid */}
          <div className="flex-1">
            {articles.length === 0 ? (
              <p className="text-gray-500 py-12 text-center">Zatím zde nejsou žádné články.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="group no-underline"
                  >
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                      {article.coverImage ? (
                        <div className="relative aspect-[16/9]">
                          <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                          <span className="text-4xl">{article.category?.icon || "\ud83d\udcdd"}</span>
                        </div>
                      )}
                      <div className="p-4">
                        <Badge className="mb-2">
                          {article.category.icon} {article.category.name}
                        </Badge>
                        <h3 className="font-bold text-lg group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.excerpt}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>
                            {article.author.firstName} {article.author.lastName}
                          </span>
                          <span>·</span>
                          {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
                          {article.readTime && (
                            <>
                              <span>·</span>
                              <span>{article.readTime} min</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {page > 1 && (
                  <Link
                    href={`/blog?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ""}`}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 no-underline"
                  >
                    ← Předchozí
                  </Link>
                )}
                <span className="px-4 py-2 text-sm text-gray-500">
                  Strana {page} z {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/blog?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ""}`}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 no-underline"
                  >
                    Další →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Category sidebar */}
          <aside className="lg:w-64 mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <h2 className="font-bold text-lg mb-4">Kategorie</h2>
              {/* Horizontal scroll on mobile */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
                <Link
                  href="/blog"
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${
                    !categorySlug
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Vše
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/blog?category=${cat.slug}`}
                    className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${
                      categorySlug === cat.slug
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat.icon} {cat.name}
                    <span className="ml-1 text-xs opacity-70">({cat._count.articles})</span>
                  </Link>
                ))}
              </div>

              {/* Tags */}
              {articleTags.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-bold text-lg mb-4">Témata</h2>
                  <div className="flex flex-wrap gap-2">
                    {articleTags.map((t) => (
                      <Link
                        key={t.id}
                        href={`/blog?tag=${t.slug}`}
                        className={`text-sm px-3 py-1 rounded-full no-underline transition-colors ${
                          tagSlug === t.slug
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        #{t.name}
                        <span className="ml-1 text-xs opacity-70">
                          ({t._count.articles})
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter */}
              <div className="mt-8">
                <NewsletterSignup />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
