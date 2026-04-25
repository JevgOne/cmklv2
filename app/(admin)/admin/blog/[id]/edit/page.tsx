import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArticleEditor } from "./ArticleEditor";

export const dynamic = "force-dynamic";

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BACKOFFICE", "BROKER"].includes(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const { id } = await params;
  const isNew = id === "new";

  const [article, categories] = await Promise.all([
    isNew
      ? null
      : prisma.article.findUnique({
          where: { id },
          include: {
            category: { select: { id: true, name: true } },
          },
        }),
    prisma.articleCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!isNew && !article) {
    redirect("/admin/blog");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? "Nový článek" : `Upravit: ${article!.title}`}
      </h1>
      <ArticleEditor
        article={
          article
            ? {
                id: article.id,
                title: article.title,
                slug: article.slug,
                content: article.content,
                excerpt: article.excerpt || "",
                coverImage: article.coverImage || "",
                categoryId: article.categoryId,
                seoTitle: article.seoTitle || "",
                seoDescription: article.seoDescription || "",
                readTime: article.readTime || 5,
                status: article.status,
              }
            : null
        }
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
        }))}
      />
    </div>
  );
}
