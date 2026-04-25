import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { pageCanonical } from "@/lib/canonical";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.articleCategory.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!category) return { title: "Kategorie nenalezena" };

  return {
    title: `${category.name} — Blog`,
    description:
      category.description ||
      `Články z kategorie ${category.name} na CarMakléř blogu.`,
    alternates: pageCanonical(`/blog/kategorie/${slug}`),
  };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const perPage = 12;

  const category = await prisma.articleCategory.findUnique({
    where: { slug },
  });

  if (!category) notFound();

  const where = { status: "PUBLISHED", categoryId: category.id };

  const [articles, total] = await Promise.all([
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
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: category.name },
        ]}
      />

      {/* Category hero */}
      <div className="mt-6 mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{category.icon}</span>
          <h1 className="text-3xl md:text-4xl font-extrabold">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-gray-500 max-w-2xl">{category.description}</p>
        )}
      </div>

      {/* Articles grid */}
      {articles.length === 0 ? (
        <p className="text-gray-500 py-12 text-center">
          V této kategorii zatím nejsou žádné články.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="group no-underline"
            >
              <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                {article.coverImage && (
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
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
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>
                      {article.author.firstName} {article.author.lastName}
                    </span>
                    <span>·</span>
                    {article.publishedAt && (
                      <span>{formatDate(article.publishedAt)}</span>
                    )}
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
              href={`/blog/kategorie/${slug}?page=${page - 1}`}
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
              href={`/blog/kategorie/${slug}?page=${page + 1}`}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 no-underline"
            >
              Další →
            </Link>
          )}
        </div>
      )}

      {/* Back to blog */}
      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="text-orange-500 font-medium no-underline hover:underline"
        >
          ← Zpět na blog
        </Link>
      </div>
    </div>
  );
}
