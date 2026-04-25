import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlogArticlesTable } from "./BlogArticlesTable";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      include: {
        category: { select: { name: true, slug: true, icon: true } },
        author: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.articleCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog — správa článků</h1>
          <p className="text-gray-500 text-sm mt-1">
            Celkem {articles.length} článků
          </p>
        </div>
        <a
          href="/admin/blog/new/edit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full font-semibold text-sm hover:bg-orange-600 transition-colors no-underline"
        >
          + Nový článek
        </a>
      </div>

      <BlogArticlesTable
        articles={articles.map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          status: a.status,
          category: a.category,
          author: a.author,
          views: a.views,
          publishedAt: a.publishedAt?.toISOString() ?? null,
          createdAt: a.createdAt.toISOString(),
        }))}
        categories={categories}
      />
    </div>
  );
}
