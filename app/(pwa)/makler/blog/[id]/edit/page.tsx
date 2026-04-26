import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { BrokerArticleEditor } from "./BrokerArticleEditor";

export default async function BrokerEditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const isNew = id === "new";

  let article = null;
  if (!isNew) {
    article = await prisma.article.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
      },
    });
    if (!article) notFound();
    if (article.authorId !== session.user.id) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-red-600">
          Nemáte oprávnění upravovat tento článek.
        </div>
      );
    }
  }

  const categories = await prisma.articleCategory.findMany({
    orderBy: { name: "asc" },
  });

  const tags = await prisma.articleTag.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        {isNew ? "Nový článek" : "Upravit článek"}
      </h1>
      <BrokerArticleEditor
        article={article ? {
          id: article.id,
          title: article.title,
          content: article.content,
          excerpt: article.excerpt || "",
          coverImage: article.coverImage || "",
          categoryId: article.categoryId,
          status: article.status,
          tagIds: article.tags.map((t) => t.tagId),
        } : null}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
