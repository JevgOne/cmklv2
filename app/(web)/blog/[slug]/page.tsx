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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Domů", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: article.category.name, href: `/blog/kategorie/${article.category.slug}` },
            { label: article.title },
          ]}
        />

        {/* Header */}
        <header className="mt-6 mb-8">
          <Link
            href={`/blog/kategorie/${article.category.slug}`}
            className="no-underline"
          >
            <Badge className="mb-4">
              {article.category.icon} {article.category.name}
            </Badge>
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-lg text-gray-500 mb-4">{article.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              {article.author.avatar ? (
                <Image
                  src={article.author.avatar}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs font-bold">
                  {article.author.firstName[0]}
                  {article.author.lastName[0]}
                </div>
              )}
              <span className="font-medium text-gray-700">
                {article.author.firstName} {article.author.lastName}
              </span>
            </div>
            <span>·</span>
            {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
            {article.readTime && (
              <>
                <span>·</span>
                <span>{article.readTime} min čtení</span>
              </>
            )}
            <span>·</span>
            <span>{article.views.toLocaleString("cs-CZ")} zobrazení</span>
          </div>
        </header>

        {/* Cover image */}
        {article.coverImage && (
          <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-8">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        )}

        {/* Content */}
        <article
          className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-orange-500 prose-img:rounded-xl mb-12"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map(({ tag }) => (
              <Link key={tag.id} href={`/blog?tag=${tag.slug}`} className="no-underline">
                <Badge variant="default" className="hover:bg-orange-100 transition-colors">
                  #{tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Reactions */}
        <ArticleReactions
          articleId={article.id}
          initialCounts={reactionCounts}
          initialUserReactions={userReactionsList.map((r) => r.type)}
        />

        {/* Share */}
        <div className="border-t border-b border-gray-100 py-6 mb-8">
          <ShareButtons url={articleUrl} title={article.title} />
        </div>

        {/* Author card */}
        <Card className="p-6 mb-12">
          <div className="flex items-start gap-4">
            {article.author.avatar ? (
              <Image
                src={article.author.avatar}
                alt=""
                width={64}
                height={64}
                className="rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xl font-bold shrink-0">
                {article.author.firstName[0]}
                {article.author.lastName[0]}
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg">
                {article.author.firstName} {article.author.lastName}
              </h3>
              {article.author.bio && (
                <p className="text-gray-500 text-sm mt-1">{article.author.bio}</p>
              )}
              {article.author.slug && (
                <Link
                  href={`/makler/${article.author.slug}`}
                  className="text-orange-500 text-sm font-medium mt-2 inline-block no-underline hover:underline"
                >
                  Zobrazit profil →
                </Link>
              )}
            </div>
          </div>
        </Card>

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
        <div className="mb-12">
          <NewsletterSignup />
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Další články z kategorie</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="group no-underline"
                >
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                    {rel.coverImage && (
                      <div className="relative aspect-[16/9]">
                        <Image
                          src={rel.coverImage}
                          alt={rel.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <Badge className="mb-2">
                        {rel.category.icon} {rel.category.name}
                      </Badge>
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
