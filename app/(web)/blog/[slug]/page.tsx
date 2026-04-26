import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { pageCanonical } from "@/lib/canonical";
import { BASE_URL } from "@/lib/seo-data";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArticleReactions } from "@/components/web/blog/ArticleReactions";
import { ArticleComments } from "@/components/web/blog/ArticleComments";
import { NewsletterSignup } from "@/components/web/blog/NewsletterSignup";
import { ShareButtons } from "./ShareButtons";
import { ReadingProgress } from "./ReadingProgress";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      seoTitle: true,
      seoDescription: true,
      coverImage: true,
    },
  });

  if (!article) return { title: "Článek nenalezen" };

  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt || "";

  return {
    title,
    description,
    openGraph: {
      title: `${title} | CarMakléř Blog`,
      description,
      ...(article.coverImage ? { images: [{ url: article.coverImage }] } : {}),
    },
    alternates: pageCanonical(`/blog/${slug}`),
  };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          slug: true,
        },
      },
      tags: { include: { tag: true } },
    },
  });

  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  // Increment views (fire-and-forget)
  prisma.article
    .update({ where: { id: article.id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  // Related articles — tag-based + category matching
  const articleTagIds = article.tags.map((t) => t.tagId);

  const related = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: article.id },
      OR: [
        { categoryId: article.categoryId },
        ...(articleTagIds.length > 0
          ? [{ tags: { some: { tagId: { in: articleTagIds } } } }]
          : []),
      ],
    },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      author: { select: { firstName: true, lastName: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  // Reactions
  const [reactionGroups, userReactionsList] = await Promise.all([
    prisma.articleReaction.groupBy({
      by: ["type"],
      where: { articleId: article.id },
      _count: true,
    }),
    session?.user?.id
      ? prisma.articleReaction.findMany({
          where: { articleId: article.id, userId: session.user.id },
          select: { type: true },
        })
      : Promise.resolve([]),
  ]);

  const reactionCounts: Record<string, number> = {};
  for (const r of reactionGroups) {
    reactionCounts[r.type] = r._count;
  }

  // Comments (only approved — isHidden=false)
  const [approvedComments, commentTotal] = await Promise.all([
    prisma.profileComment.findMany({
      where: { articleId: article.id, isHidden: false },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.profileComment.count({
      where: { articleId: article.id, isHidden: false },
    }),
  ]);

  const articleUrl = `${BASE_URL}/blog/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || "",
    url: articleUrl,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: `${article.author.firstName} ${article.author.lastName}`,
    },
    publisher: {
      "@type": "Organization",
      name: "CarMakléř",
      url: BASE_URL,
    },
    ...(article.coverImage
      ? { image: { "@type": "ImageObject", url: article.coverImage } }
      : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />

      {/* Hero header with gradient */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-orange-500 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-orange-400 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pt-8 pb-12">
          <Breadcrumbs
            items={[
              { label: "Domů", href: "/" },
              { label: "Blog", href: "/blog" },
              { label: article.category.name, href: `/blog/kategorie/${article.category.slug}` },
              { label: article.title },
            ]}
            className="[&_a]:text-gray-300 [&_a:hover]:text-white [&_span]:text-gray-500 [&_li:last-child_span]:text-gray-400 mb-8"
          />

          <Link
            href={`/blog/kategorie/${article.category.slug}`}
            className="no-underline"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-sm font-medium text-orange-300 hover:bg-orange-500/30 transition-colors mb-5">
              {article.category.icon} {article.category.name}
            </span>
          </Link>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-lg md:text-xl text-gray-300 mb-6 max-w-3xl">{article.excerpt}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2.5">
              {article.author.avatar ? (
                <Image
                  src={article.author.avatar}
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-full ring-2 ring-white/20"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-orange-500/30 text-orange-300 flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
                  {article.author.firstName[0]}
                  {article.author.lastName[0]}
                </div>
              )}
              <span className="font-medium text-gray-200">
                {article.author.firstName} {article.author.lastName}
              </span>
            </div>
            <span className="text-gray-600">·</span>
            {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
            {article.readTime && (
              <>
                <span className="text-gray-600">·</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {article.readTime} min čtení
                </span>
              </>
            )}
            <span className="text-gray-600">·</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {article.views.toLocaleString("cs-CZ")}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Cover image — overlapping hero */}
        {article.coverImage && (
          <div className="relative -mt-6 mb-10">
            <div className="relative aspect-[2/1] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
                priority
              />
            </div>
          </div>
        )}

        {/* Article content in card */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 md:p-10 mb-10">
          <article
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-blockquote:border-orange-400 prose-blockquote:bg-orange-50/50 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-li:marker:text-orange-400"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-gray-100">
              {article.tags.map(({ tag }) => (
                <Link key={tag.id} href={`/blog?tag=${tag.slug}`} className="no-underline">
                  <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 font-medium hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors">
                    #{tag.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reactions + Share card */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Jak se vám článek líbil?</p>
              <ArticleReactions
                articleId={article.id}
                initialCounts={reactionCounts}
                initialUserReactions={userReactionsList.map((r) => r.type)}
              />
            </div>
            <div className="sm:border-l sm:border-gray-100 sm:pl-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Sdílejte s přáteli</p>
              <ShareButtons url={articleUrl} title={article.title} />
            </div>
          </div>
        </div>

        {/* Author card */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 md:p-8 mb-10 ring-1 ring-orange-100">
          <div className="flex items-start gap-4 md:gap-6">
            {article.author.avatar ? (
              <Image
                src={article.author.avatar}
                alt=""
                width={72}
                height={72}
                className="rounded-full ring-4 ring-white shadow-md"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-2xl font-bold shrink-0 ring-4 ring-white shadow-md">
                {article.author.firstName[0]}
                {article.author.lastName[0]}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">Autor článku</p>
              <h3 className="font-bold text-xl text-gray-900">
                {article.author.firstName} {article.author.lastName}
              </h3>
              {article.author.bio && (
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">{article.author.bio}</p>
              )}
              {article.author.slug && (
                <Link
                  href={`/makler/${article.author.slug}`}
                  className="inline-flex items-center gap-1.5 text-orange-600 text-sm font-semibold mt-3 no-underline hover:text-orange-700 transition-colors"
                >
                  Zobrazit profil
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        <ArticleComments
          articleId={article.id}
          initialComments={approvedComments.map((c) => ({
            id: c.id,
            text: c.text,
            isHidden: c.isHidden,
            createdAt: c.createdAt.toISOString(),
            author: c.user,
          }))}
          total={commentTotal}
          isLoggedIn={!!session?.user}
        />

        {/* Newsletter */}
        <div className="my-12">
          <NewsletterSignup />
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="pb-12">
            <h2 className="text-2xl font-bold mb-6">Mohlo by vás zajímat</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="group no-underline"
                >
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                    {rel.coverImage && (
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={rel.coverImage}
                          alt={rel.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500 mb-2">
                        {rel.category.icon} {rel.category.name}
                      </span>
                      <h3 className="font-bold group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                        {rel.title}
                      </h3>
                      {rel.excerpt && (
                        <p className="text-sm text-gray-500 line-clamp-2">{rel.excerpt}</p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
